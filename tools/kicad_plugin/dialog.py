"""The plugin's wx dialog, themed to match the Prism web app.

wx has no stylesheet, so "theming" means setting colours/fonts explicitly and
owner-drawing the widgets whose native versions can't be styled (see widgets.py,
notably wx.Button ignores SetBackgroundColour on Windows, which is why the primary
button has to be drawn by hand).
"""

from __future__ import annotations

import os

import wx

from . import agent_launcher
from . import prism_theme as th
from . import version
from .agent_client import AgentClient, AgentUnavailable
from .settings_dialog import SettingsDialog
from .widgets import Button, Card, ChangeRow, Disclosure, ScrollThumb

try:
    from . import crossprobe
except ImportError:  # pcbnew is only importable inside KiCad
    crossprobe = None

LOGO = os.path.join(os.path.dirname(__file__), "assets", "prism-64.png")

# A real board can produce hundreds of changed items. Cap what we draw so the
# dialog stays responsive, and say so rather than silently truncating.
MAX_ROWS_PER_FILE = 60


def _c(hex_value):
    return wx.Colour(*th.hex_to_rgb(hex_value))


class PrismDialog(wx.Dialog):
    def __init__(self, parent, board_path):
        super().__init__(
            parent,
            title="Prism",
            size=wx.Size(520, 620),
            style=wx.DEFAULT_DIALOG_STYLE | wx.RESIZE_BORDER,
        )
        # Follow the OS/KiCad appearance: a light dialog inside a dark KiCad (or
        # the reverse) looks broken.
        self.pal = th.palette(dark=wx.SystemSettings.GetAppearance().IsDark())
        self.board_path = board_path
        self.data = None
        self.changes = None  # None = couldn't fetch; [] = genuinely nothing
        self.verdict = "ok"  # this plugin vs the server: ok | update | required
        self.download_url = ""
        # Which files the user has expanded, by path. Kept across a re-render so
        # toggling one file doesn't collapse the others.
        self.expanded = set()
        # Collapsed by default: the header already carries the change count, which
        # is the answer most of the time. Expand when you want the detail.
        self.section_open = False
        # KiCad's generated files stay folded unless you go looking for them.
        self.noise_open = False

        self.SetBackgroundColour(_c(self.pal["background"]))
        self._build()
        self._load()

    # -- layout ------------------------------------------------------------

    def _build(self):
        root = wx.BoxSizer(wx.VERTICAL)

        header = wx.BoxSizer(wx.HORIZONTAL)
        if os.path.isfile(LOGO):
            img = wx.Image(LOGO, wx.BITMAP_TYPE_PNG).Scale(
                28, 28, wx.IMAGE_QUALITY_HIGH
            )
            header.Add(
                wx.StaticBitmap(self, bitmap=wx.Bitmap(img)),
                0,
                wx.ALIGN_CENTER_VERTICAL | wx.RIGHT,
                th.SP_SM,
            )

        title = wx.StaticText(self, label="Prism")
        title.SetForegroundColour(_c(self.pal["foreground"]))
        tf = title.GetFont()
        tf.SetPointSize(th.FONT_TITLE)
        tf.SetWeight(wx.FONTWEIGHT_BOLD)
        title.SetFont(tf)
        header.Add(title, 0, wx.ALIGN_CENTER_VERTICAL)
        root.Add(header, 0, wx.LEFT | wx.RIGHT | wx.TOP, th.SP_LG)

        self.status = wx.StaticText(self, label="Contacting agent...")
        self.status.SetForegroundColour(_c(self.pal["muted_fg"]))
        sf = self.status.GetFont()
        sf.SetPointSize(th.FONT_SMALL)
        self.status.SetFont(sf)
        root.Add(self.status, 0, wx.LEFT | wx.RIGHT | wx.TOP, th.SP_LG)
        root.AddSpacer(th.SP_MD)

        # Scrolled body, a board with many edits makes a long list. The native
        # scrollbar can't be themed (wx offers no way to recolour it), so it's
        # hidden and ScrollThumb draws a slim one over the content instead.
        body = wx.BoxSizer(wx.HORIZONTAL)
        self.scroll = wx.ScrolledWindow(self, style=wx.VSCROLL)
        self.scroll.surface = self.pal["background"]
        self.scroll.pal = self.pal
        self.scroll.SetBackgroundColour(_c(self.pal["background"]))
        self.scroll.SetScrollRate(0, 12)
        self.scroll.ShowScrollbars(wx.SHOW_SB_NEVER, wx.SHOW_SB_NEVER)
        self.content = wx.BoxSizer(wx.VERTICAL)
        self.scroll.SetSizer(self.content)
        body.Add(self.scroll, 1, wx.EXPAND)

        self.scroll.Bind(wx.EVT_MOUSEWHEEL, self._on_wheel)

        self.thumb = ScrollThumb(self, self.scroll, self.pal)
        body.Add(self.thumb, 0, wx.EXPAND | wx.LEFT, 2)

        root.Add(body, 1, wx.EXPAND | wx.LEFT | wx.RIGHT, th.SP_LG)

        buttons = wx.BoxSizer(wx.HORIZONTAL)
        self.open_btn = Button(
            self, "Open in Prism", self.pal, variant="primary", on_click=self.on_open
        )
        self.open_btn.Enable(False)
        buttons.Add(self.open_btn, 0, wx.RIGHT, th.SP_SM)
        buttons.Add(
            Button(self, "Refresh", self.pal, variant="secondary", on_click=self._load),
            0,
        )
        buttons.AddStretchSpacer()
        buttons.Add(
            Button(
                self, "Settings", self.pal, variant="ghost", on_click=self._on_settings
            ),
            0,
            wx.RIGHT,
            th.SP_SM,
        )
        buttons.Add(
            Button(self, "Close", self.pal, variant="ghost", on_click=self.Close), 0
        )
        root.Add(buttons, 0, wx.EXPAND | wx.ALL, th.SP_LG)

        self.SetSizer(root)

    def _on_wheel(self, e):
        """ShowScrollbars(NEVER) also disables wheel scrolling, so drive it here."""
        lines = e.GetWheelRotation() / e.GetWheelDelta()
        self.scroll.Scroll(
            -1, max(0, self.scroll.GetScrollPos(wx.VERTICAL) - int(lines * 3))
        )
        self.thumb.Refresh()

    def _relayout(self):
        self.content.FitInside(self.scroll)
        self.scroll.Layout()
        self.thumb.Refresh()  # the thumb size depends on the new content height
        self.Layout()
        self.Refresh()

    # -- data --------------------------------------------------------------

    def _load(self):
        self.content.Clear(delete_windows=True)
        try:
            client = AgentClient()

            # An update installs a new plugin beside an ALREADY-RUNNING old agent
            # (it's detached, and autostart brings it back at login). Catch that
            # here, or the plugin talks to it, gets a 404 from a route that didn't
            # exist yet, and fails like a bug in the new code.
            health = client.health() or {}
            running = health.get("version", "")
            if version.agent_too_old(running):
                self.data = None
                self.changes = None
                self._render_outdated_agent(running)
                self._relayout()
                return

            # The plugin follows the server it talks to. "required" means this plugin
            # is older than the server can serve, so there's no point rendering a UI
            # whose calls will fail.
            self.verdict, self.download_url = version.server_verdict(
                health.get("server_plugin")
            )
            if self.verdict == "required":
                self.data = None
                self.changes = None
                self._render_outdated_plugin()
                self._relayout()
                return

            self.data = client.project(self.board_path)
        except AgentUnavailable as exc:
            self.data = None
            self.changes = None
            self._render_unavailable(str(exc))
            self._relayout()
            return

        # The diff parses every changed board, so it can take a second or two on
        # a big one. Show a wait cursor rather than appearing to freeze.
        self.changes = None
        try:
            with wx.BusyCursor():
                self.changes = client.changes(self.board_path).get("changes", [])
        except AgentUnavailable:
            pass  # project/git still render; the changes card explains itself

        self._render()
        self._relayout()

    def _rebuild(self):
        """Re-render from data already in hand. No refetch, expanding a file is
        instant even when computing the diff was slow."""
        self.content.Clear(delete_windows=True)
        self._render()
        self._relayout()

    def _render_outdated_plugin(self):
        """This plugin is older than the server can serve. Nothing else will work.

        Not recoverable in-app: the fix is a new plugin, which the user has to install
        through KiCad's Plugin Manager. So say what to do and where, and stop.
        """
        self.status.SetLabel("This plugin is out of date")
        self.status.SetForegroundColour(_c(self.pal["destructive"]))

        card = Card(self.scroll, "Update required", self.pal)
        card.row("Plugin", version.VERSION, tone="muted_fg")
        card.body.Add(
            card.label(
                "The Prism server needs a newer plugin. Download it and install\n"
                "it through KiCad's Plugin Manager.",
                tone="muted_fg",
            ),
            0,
            wx.BOTTOM,
            th.SP_SM,
        )
        if self.download_url:
            card.body.Add(
                Button(
                    card,
                    "Download",
                    self.pal,
                    variant="primary",
                    on_click=self._open_download,
                ),
                0,
            )

        self.content.Add(card, 0, wx.EXPAND)
        self.open_btn.Enable(False)

    def _render_update_available(self):
        """A newer plugin exists, but this one still works. A note, not a wall."""
        card = Card(self.scroll, "Update available", self.pal)
        card.body.Add(
            card.label(
                "The Prism server ships a newer plugin than this one (%s)."
                % version.VERSION,
                tone="muted_fg",
                small=True,
            ),
            0,
            wx.BOTTOM,
            th.SP_XS,
        )
        if self.download_url:
            card.body.Add(
                Button(
                    card,
                    "Download",
                    self.pal,
                    variant="ghost",
                    on_click=self._open_download,
                ),
                0,
            )
        self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

    def _open_download(self):
        import webbrowser

        webbrowser.open(self.download_url)

    def _render_outdated_agent(self, running):
        """An old agent is still running. Offer to restart it into the new one.

        Recoverable in one click, because the cause is mundane: the agent outlives
        KiCad by design, so an update leaves the previous one running. Telling the
        user to go hunt a background process would be a poor way to end an install.
        """
        self.status.SetLabel("The Prism agent is out of date")
        self.status.SetForegroundColour(_c(self.pal["warning"]))

        card = Card(self.scroll, "Prism agent", self.pal)
        card.body.Add(
            card.label(
                "Agent %s is running. This plugin needs %s or newer.\n"
                "Restart the agent to update it."
                % (running or "unknown", version.AGENT_MIN),
                tone="muted_fg",
            ),
            0,
            wx.BOTTOM,
            th.SP_SM,
        )
        card.body.Add(
            Button(
                card,
                "Restart the agent",
                self.pal,
                variant="primary",
                on_click=self._restart_agent,
            ),
            0,
        )
        self.content.Add(card, 0, wx.EXPAND)
        self.open_btn.Enable(False)

    def _restart_agent(self):
        """Stop the old agent, then start the one that shipped with THIS plugin.

        Deliberately not /restart: that makes the agent re-execute *itself*, from
        the path it was launched from. That path belongs to the old install, after
        an update it may have been replaced (fine), but it may also be gone
        entirely, and then the agent quietly fails to come back. The plugin knows
        where its own binary is; use that.
        """
        try:
            AgentClient().quit()
        except AgentUnavailable:
            pass  # already gone is the state we wanted

        # Wait for the port and the discovery file to be released, or the new
        # agent's single-instance guard sees the old one and politely refuses.
        for _ in range(20):
            wx.MilliSleep(250)
            wx.Yield()
            try:
                AgentClient().health()
            except AgentUnavailable:
                break

        try:
            with wx.BusyCursor():
                agent_launcher.start_agent()
        except agent_launcher.LaunchError as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        for _ in range(40):
            wx.MilliSleep(250)
            wx.Yield()
            try:
                AgentClient().health()
                break
            except AgentUnavailable:
                continue
        self._load()

    def _render_unavailable(self, message):
        """The agent isn't running. Offer to start it rather than just saying so."""
        self.status.SetLabel("Agent not running")
        self.status.SetForegroundColour(_c(self.pal["destructive"]))

        card = Card(self.scroll, "Prism agent", self.pal)

        card.body.Add(
            card.label(
                "The Prism agent isn't running. The plugin needs it.",
                tone="muted_fg",
            ),
            0,
            wx.BOTTOM,
            th.SP_SM,
        )

        card.body.Add(
            Button(
                card,
                "Start agent",
                self.pal,
                variant="primary",
                on_click=self._on_start_agent,
            ),
            0,
        )

        self.content.Add(card, 0, wx.EXPAND)
        self.open_btn.Enable(False)

    def _on_settings(self):
        dlg = SettingsDialog(self, self.pal)
        try:
            dlg.ShowModal()
        finally:
            dlg.Destroy()
        # The server URL (or the agent itself) may have changed underneath us.
        self._load()

    def _on_start_agent(self):
        try:
            with wx.BusyCursor():
                agent_launcher.start_agent()
        except agent_launcher.LaunchError as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        # The agent needs a moment to bind its port and publish the discovery
        # file. Poll rather than guess at a sleep long enough to always work.
        for _ in range(30):
            wx.MilliSleep(200)
            wx.Yield()
            try:
                AgentClient().health()
                break
            except AgentUnavailable:
                continue
        else:
            wx.MessageBox(
                "The agent started but isn't responding yet. Try Refresh.",
                "Prism",
                wx.OK | wx.ICON_INFORMATION,
            )
            return

        self._load()

    def _render(self):
        project = (self.data or {}).get("project")
        git = (self.data or {}).get("git")
        prism = (self.data or {}).get("prism")

        if self.verdict == "update":
            self._render_update_available()

        if not project:
            self.status.SetLabel("This board isn't inside a recognised KiCad project")
            self.status.SetForegroundColour(_c(self.pal["muted_fg"]))
            self.open_btn.Enable(False)
            return

        self.status.SetLabel(project["path"])
        self.status.SetForegroundColour(_c(self.pal["muted_fg"]))

        card = Card(self.scroll, "Project", self.pal)
        card.row("Name", project["name"])
        card.row(
            "In Prism",
            "Registered" if prism else "Not registered",
            badge=True,
            tone="success" if prism else "warning",
        )
        self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

        g = Card(self.scroll, "Git", self.pal)
        if git and git.get("branch"):
            g.row("Branch", git["branch"], mono=True)
            if git.get("ahead") or git.get("behind"):
                g.row(
                    "Ahead / behind",
                    "%d / %d" % (git["ahead"], git["behind"]),
                    mono=True,
                )
            if git.get("last_commit_hash"):
                g.row("Last commit", git["last_commit_hash"], mono=True)
        else:
            g.row("Status", "Not a git repository", tone="muted_fg")
        self.content.Add(g, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

        self._render_changes()
        self.open_btn.Enable(bool(prism))

    # -- uncommitted changes -----------------------------------------------

    def _render_changes(self):
        """What you've changed but not committed.

        One collapsible "Uncommitted changes" section holding a compact row per
        board/schematic, each of which expands into its own item-level changes.
        Same grouping the web UI applies to a commit, but these changes exist only
        on disk, so the web app cannot show them at all.
        """
        # Untitled card: the disclosure below *is* the heading, so a separate
        # "UNCOMMITTED CHANGES" caption above it would just say it twice.
        card = Card(self.scroll, "", self.pal)

        if self.changes is None:
            card.row("Uncommitted changes", "Couldn't read", tone="muted_fg")
            self.content.Add(card, 0, wx.EXPAND)
            return

        if not self.changes:
            card.row(
                "Uncommitted changes", "Nothing to commit", badge=True, tone="success"
            )
            self.content.Add(card, 0, wx.EXPAND)
            return

        # KiCad's own droppings (backup archives, -bak files, autosaves, caches) are
        # kept separate. They're not hidden, a file that silently vanishes from a
        # change list is a lie about the state of your repo, but they don't get to
        # drown the design work, and there can be dozens of them per real edit.
        design = [f for f in self.changes if not f.get("noise")]
        noise = [f for f in self.changes if f.get("noise")]

        total = sum(len(f.get("groups") or []) or 1 for f in design)

        def toggle_section(is_open):
            self.section_open = is_open
            self._rebuild()

        card.body.Add(
            Disclosure(
                card,
                self.pal,
                "Uncommitted changes",
                toggle_section,
                expanded=self.section_open,
                count=total,
                strong=True,
            ),
            0,
            wx.EXPAND,
        )

        if self.section_open:
            if design:
                for f in design:
                    self._add_file(card, f)
            else:
                card.body.Add(
                    card.label(
                        "Nothing but KiCad's own backup files.",
                        tone="muted_fg",
                        small=True,
                    ),
                    0,
                    wx.LEFT | wx.BOTTOM,
                    th.SP_MD,
                )

        if noise:
            self._add_noise(card, noise)

        self.content.Add(card, 0, wx.EXPAND)

    def _add_noise(self, card, noise):
        """KiCad's generated files, folded away behind a count.

        Worth surfacing at all because the honest fix is a .gitignore entry: these
        shouldn't be committed, and seeing them here is how you find out they are.
        """

        def toggle(is_open):
            self.noise_open = is_open
            self._rebuild()

        card.body.Add(
            Disclosure(
                card,
                self.pal,
                "KiCad backups & generated files",
                toggle,
                expanded=self.noise_open,
                count=len(noise),
            ),
            0,
            wx.EXPAND | wx.TOP,
            th.SP_XS,
        )

        if not self.noise_open:
            return

        for f in noise:
            status = f.get("status", "modified")
            card.body.Add(
                ChangeRow(
                    card,
                    self.pal,
                    {
                        "kind": status if status in ("added", "removed") else "changed",
                        "label": f["path"],  # full path: shows WHERE the noise is
                        "category_label": status,
                    },
                ),
                0,
                wx.EXPAND | wx.LEFT,
                th.SP_MD,
            )

        card.body.Add(
            card.label(
                "KiCad regenerates these. They usually belong in .gitignore.",
                tone="muted_fg",
                small=True,
            ),
            0,
            wx.LEFT | wx.TOP,
            th.SP_MD,
        )

    def _add_file(self, card, f):
        path = f["path"]
        groups = f.get("groups") or []
        status = f.get("status", "modified")
        kind = f.get("kind", "other")

        if not groups:
            # No item-level detail to show (a .kicad_pro, an asset, an untracked
            # folder). A plain row beats a disclosure arrow that opens nothing.
            card.body.Add(
                ChangeRow(
                    card,
                    self.pal,
                    {
                        "kind": status if status in ("added", "removed") else "changed",
                        "label": f["filename"],
                        "category_label": status,
                    },
                ),
                0,
                wx.EXPAND | wx.LEFT | wx.BOTTOM,
                th.SP_MD,
            )
            return

        holder = wx.BoxSizer(wx.VERTICAL)

        def on_toggle(is_open, _path=path):
            if is_open:
                self.expanded.add(_path)
            else:
                self.expanded.discard(_path)
            self._rebuild()

        count = len(groups)
        head = Disclosure(
            card,
            self.pal,
            f["filename"],
            on_toggle,
            expanded=path in self.expanded,
            # The board/schematic glyph, tinted the blue/emerald the web history
            # list uses, so you can tell what a file is at a glance.
            kind=kind,
            accent=self.pal.get(kind),
            count=count,
        )
        holder.Add(head, 0, wx.EXPAND | wx.LEFT, th.SP_MD)

        if path in self.expanded:
            # Only rows KiCad can actually jump to are clickable. A schematic row
            # gets no hand cursor and no hover, because clicking it could not do
            # anything, better than a row that lies. See crossprobe.py.
            clickable = crossprobe is not None and (
                kind == "pcb"
                or (kind == "sch" and crossprobe.schematic_probe_available())
            )
            for group in groups[:MAX_ROWS_PER_FILE]:
                row_group = dict(group, file_kind=kind)
                holder.Add(
                    ChangeRow(
                        card,
                        self.pal,
                        row_group,
                        on_click=self._on_change_click if clickable else None,
                    ),
                    0,
                    wx.EXPAND | wx.LEFT,
                    th.SP_MD * 2 + 6,
                )
            if count > MAX_ROWS_PER_FILE:
                holder.Add(
                    card.label(
                        "+ %d more..." % (count - MAX_ROWS_PER_FILE),
                        tone="muted_fg",
                        small=True,
                    ),
                    0,
                    wx.LEFT | wx.TOP,
                    th.SP_MD * 2 + 12,
                )

        card.body.Add(holder, 0, wx.EXPAND | wx.BOTTOM, th.SP_XS)

    # -- actions -----------------------------------------------------------

    def _on_change_click(self, group):
        """Jump to the changed item *inside KiCad*, select it and zoom to it.

        Not a link to the web app: you're already in the editor, so the useful
        thing is to land on the item here. See crossprobe.py for why the schematic
        side needs KiCad 9+.
        """
        try:
            crossprobe.probe(
                group.get("file_kind", "other"),
                group.get("item_id", ""),
                self._reference_of(group),
            )
        except crossprobe.ProbeError as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_INFORMATION)
            return

        # The item is selected behind the dialog; get out of the way so it can be
        # seen. Modeless would be nicer, but KiCad's plugin API runs us modally.
        self.EndModal(wx.ID_OK)

    @staticmethod
    def _reference_of(group) -> str:
        """A component reference for the group, when it has one.

        Segments and vias carry no uuid we can resolve (the diff keys them by
        geometry), so a reference is the only fallback that can find them.
        """
        label = group.get("label", "")
        if group.get("category") in ("components", "symbols") and label:
            # Labels look like "J102 (Header)", the reference is the leading token.
            return label.split(" ", 1)[0]
        return ""

    def on_open(self):
        prism = (self.data or {}).get("prism")
        if not prism:
            return
        try:
            AgentClient().open_in_prism(prism["id"])
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)

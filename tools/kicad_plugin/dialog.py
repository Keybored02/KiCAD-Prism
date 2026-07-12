"""The plugin's wx dialog, themed to match the Prism web app.

wx has no stylesheet, so "theming" means setting colours/fonts explicitly and
owner-drawing the widgets whose native versions can't be styled (see widgets.py —
notably wx.Button ignores SetBackgroundColour on Windows, which is why the primary
button has to be drawn by hand).
"""

from __future__ import annotations

import os

import wx

from . import agent_launcher
from . import prism_theme as th
from .agent_client import AgentClient, AgentUnavailable
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
        # Which files the user has expanded, by path. Kept across a re-render so
        # toggling one file doesn't collapse the others.
        self.expanded = set()
        # The "Uncommitted changes" section starts open — it's why you opened the
        # dialog. Collapsing it is for when you want the project/git cards alone.
        self.section_open = True

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

        self.status = wx.StaticText(self, label="Contacting agent…")
        self.status.SetForegroundColour(_c(self.pal["muted_fg"]))
        sf = self.status.GetFont()
        sf.SetPointSize(th.FONT_SMALL)
        self.status.SetFont(sf)
        root.Add(self.status, 0, wx.LEFT | wx.RIGHT | wx.TOP, th.SP_LG)
        root.AddSpacer(th.SP_MD)

        # Scrolled body — a board with many edits makes a long list. The native
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
        """Re-render from data already in hand. No refetch — expanding a file is
        instant even when computing the diff was slow."""
        self.content.Clear(delete_windows=True)
        self._render()
        self._relayout()

    def _render_unavailable(self, message):
        """The agent isn't running. Offer to start it rather than just saying so."""
        self.status.SetLabel("Agent not running")
        self.status.SetForegroundColour(_c(self.pal["destructive"]))

        card = Card(self.scroll, "Prism agent", self.pal)

        card.body.Add(
            card.label(
                "The Prism agent isn't running. It does the machine-side work —\n"
                "git, project lookup, diffing your uncommitted changes — so the\n"
                "plugin needs it.",
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
                "The agent was started but hasn't come up yet.\n"
                "Give it a moment, then hit Refresh.",
                "Prism",
                wx.OK | wx.ICON_INFORMATION,
            )
            return

        self._load()

    def _render(self):
        project = (self.data or {}).get("project")
        git = (self.data or {}).get("git")
        prism = (self.data or {}).get("prism")

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
        Same grouping the web UI applies to a commit — but these changes exist only
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

        total = sum(len(f.get("groups") or []) or 1 for f in self.changes)

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
            for f in self.changes:
                self._add_file(card, f)

        self.content.Add(card, 0, wx.EXPAND)

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
            # anything — better than a row that lies. See crossprobe.py.
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
                        "+ %d more…" % (count - MAX_ROWS_PER_FILE),
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
        """Jump to the changed item *inside KiCad* — select it and zoom to it.

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
            # Labels look like "J102 (Header)" — the reference is the leading token.
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

"""The plugin's wx dialog, themed to match the Prism web app.

wx has no stylesheet, so "theming" means setting colours/fonts explicitly and
owner-drawing the widgets whose native versions can't be styled (see widgets.py —
notably wx.Button ignores SetBackgroundColour on Windows, which is why the primary
button has to be drawn by hand).
"""

from __future__ import annotations

import os

import wx

from . import prism_theme as th
from .agent_client import AgentClient, AgentUnavailable
from .widgets import Button, Card, ChangeRow, Disclosure

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

        # Scrolled body — a board with many edits makes a long list.
        self.scroll = wx.ScrolledWindow(self, style=wx.VSCROLL)
        self.scroll.SetBackgroundColour(_c(self.pal["background"]))
        self.scroll.SetScrollRate(0, 12)
        self.content = wx.BoxSizer(wx.VERTICAL)
        self.scroll.SetSizer(self.content)
        root.Add(self.scroll, 1, wx.EXPAND | wx.LEFT | wx.RIGHT, th.SP_LG)

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

    def _relayout(self):
        self.content.FitInside(self.scroll)
        self.scroll.Layout()
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
        self.status.SetLabel("Agent not reachable")
        self.status.SetForegroundColour(_c(self.pal["destructive"]))

        card = Card(self.scroll, "Prism agent", self.pal)
        text = wx.StaticText(card, label=message)
        text.SetForegroundColour(_c(self.pal["muted_fg"]))
        f = text.GetFont()
        f.SetPointSize(th.FONT_BODY)
        text.SetFont(f)
        text.Wrap(400)
        card.body.Add(text, 0)
        self.content.Add(card, 0, wx.EXPAND)
        self.open_btn.Enable(False)

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

        The same grouping and the same rows the web UI shows for a commit — but
        these changes exist only on disk, so the web app can't show them at all.
        """
        card = Card(self.scroll, "Uncommitted changes", self.pal)

        if self.changes is None:
            card.row("Status", "Couldn't read changes", tone="muted_fg")
        elif not self.changes:
            card.row("Working tree", "Nothing to commit", badge=True, tone="success")
        else:
            for f in self.changes:
                self._add_file(card, f)

        self.content.Add(card, 0, wx.EXPAND)

    def _add_file(self, card, f):
        path = f["path"]
        groups = f.get("groups") or []
        status = f.get("status", "modified")

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
                wx.EXPAND | wx.BOTTOM,
                1,
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
            "%s  ·  %d change%s" % (f["filename"], count, "" if count == 1 else "s"),
            on_toggle,
            expanded=path in self.expanded,
            # Tint by file kind — the blue/emerald the web history list uses.
            accent=self.pal.get(f.get("kind", "other")),
        )
        holder.Add(head, 0, wx.EXPAND)

        if path in self.expanded:
            for group in groups[:MAX_ROWS_PER_FILE]:
                holder.Add(
                    ChangeRow(card, self.pal, group, on_click=self._on_change_click),
                    0,
                    wx.EXPAND | wx.LEFT,
                    th.SP_MD,
                )
            if count > MAX_ROWS_PER_FILE:
                more = wx.StaticText(
                    card, label="+ %d more…" % (count - MAX_ROWS_PER_FILE)
                )
                more.SetForegroundColour(_c(self.pal["muted_fg"]))
                mf = more.GetFont()
                mf.SetPointSize(th.FONT_SMALL)
                more.SetFont(mf)
                holder.Add(more, 0, wx.LEFT | wx.TOP, th.SP_MD + 8)

        card.body.Add(holder, 0, wx.EXPAND | wx.BOTTOM, th.SP_XS)

    # -- actions -----------------------------------------------------------

    def _on_change_click(self, _group):
        """Open the project in Prism.

        Not a deep-link to the item: the web app's routes only accept a `commit`,
        and an uncommitted change has no commit to point at. Rather than fake a
        landing spot, this opens the project. The item ids travel in the payload
        already, so adding a real deep-link later needs no change on this side.
        """
        self.on_open()

    def on_open(self):
        prism = (self.data or {}).get("prism")
        if not prism:
            return
        try:
            AgentClient().open_in_prism(prism["id"])
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)

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
from .widgets import Button, Card

LOGO = os.path.join(os.path.dirname(__file__), "assets", "prism-64.png")


def _c(hex_value):
    return wx.Colour(*th.hex_to_rgb(hex_value))


class PrismDialog(wx.Dialog):
    def __init__(self, parent, board_path):
        super().__init__(
            parent,
            title="Prism",
            size=wx.Size(470, 480),
            style=wx.DEFAULT_DIALOG_STYLE | wx.RESIZE_BORDER,
        )
        # Follow the OS/KiCad appearance: a light dialog inside a dark KiCad (or
        # the reverse) looks broken.
        self.pal = th.palette(dark=wx.SystemSettings.GetAppearance().IsDark())
        self.board_path = board_path
        self.data = None

        self.SetBackgroundColour(_c(self.pal["background"]))
        self._build()
        self._load()

    # -- layout ------------------------------------------------------------

    def _build(self):
        root = wx.BoxSizer(wx.VERTICAL)

        # Header: logo + wordmark, like the web app's top-left.
        header = wx.BoxSizer(wx.HORIZONTAL)
        if os.path.isfile(LOGO):
            img = wx.Image(LOGO, wx.BITMAP_TYPE_PNG).Scale(
                28, 28, wx.IMAGE_QUALITY_HIGH
            )
            logo = wx.StaticBitmap(self, bitmap=wx.Bitmap(img))
            header.Add(logo, 0, wx.ALIGN_CENTER_VERTICAL | wx.RIGHT, th.SP_SM)

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

        self.content = wx.BoxSizer(wx.VERTICAL)
        root.Add(self.content, 1, wx.EXPAND | wx.LEFT | wx.RIGHT, th.SP_LG)
        root.AddStretchSpacer()

        # Footer actions.
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

    # -- data --------------------------------------------------------------

    def _load(self):
        self.content.Clear(delete_windows=True)
        try:
            self.data = AgentClient().project(self.board_path)
        except AgentUnavailable as exc:
            self.data = None
            self._render_unavailable(str(exc))
        else:
            self._render()
        self.Layout()
        self.Refresh()

    def _render_unavailable(self, message):
        self.status.SetLabel("Agent not reachable")
        self.status.SetForegroundColour(_c(self.pal["destructive"]))

        card = Card(self, "Prism agent", self.pal)
        text = wx.StaticText(card, label=message)
        text.SetForegroundColour(_c(self.pal["muted_fg"]))
        f = text.GetFont()
        f.SetPointSize(th.FONT_BODY)
        text.SetFont(f)
        text.Wrap(370)
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

        card = Card(self, "Project", self.pal)
        card.row("Name", project["name"])
        card.row(
            "In Prism",
            "Registered" if prism else "Not registered",
            badge=True,
            tone="success" if prism else "warning",
        )
        self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

        g = Card(self, "Git", self.pal)
        if git and git.get("branch"):
            g.row("Branch", git["branch"], mono=True)
            g.row(
                "Working tree",
                "Uncommitted changes" if git["dirty"] else "Clean",
                badge=True,
                tone="warning" if git["dirty"] else "success",
            )
            if git["dirty"]:
                changed = (
                    len(git["staged"]) + len(git["modified"]) + len(git["untracked"])
                )
                g.row("Changed files", changed)
            if git.get("ahead") or git.get("behind"):
                g.row(
                    "Ahead / behind",
                    "%d / %d" % (git["ahead"], git["behind"]),
                    mono=True,
                )
            if git.get("last_commit_hash"):
                g.row("Last commit", git["last_commit_hash"], mono=True)
                msg = git.get("last_commit") or ""
                if msg:
                    g.row(
                        "", msg[:46] + ("…" if len(msg) > 46 else ""), tone="muted_fg"
                    )
        else:
            g.row("Status", "Not a git repository", tone="muted_fg")
        self.content.Add(g, 0, wx.EXPAND)

        self.open_btn.Enable(bool(prism))

    # -- actions -----------------------------------------------------------

    def on_open(self):
        prism = (self.data or {}).get("prism")
        if not prism:
            return
        try:
            AgentClient().open_in_prism(prism["id"])
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)

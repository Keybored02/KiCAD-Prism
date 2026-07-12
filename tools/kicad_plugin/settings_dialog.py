"""Settings for the agent, edited from inside KiCad.

The agent owns the settings (it's the thing that uses them, and it outlives KiCad);
this is just an editor for them over the loopback API. It lives here rather than in
the tray because a tray menu can't host text fields — pystray menus are labels and
checkmarks — and a half-usable tray form would be worse than none.
"""

from __future__ import annotations

import wx

from . import prism_theme as th
from .agent_client import AgentClient, AgentUnavailable
from .widgets import Button, Card


def _c(hex_value):
    return wx.Colour(*th.hex_to_rgb(hex_value))


class SettingsDialog(wx.Dialog):
    def __init__(self, parent, pal):
        super().__init__(
            parent,
            title="Prism settings",
            size=wx.Size(520, 560),
            style=wx.DEFAULT_DIALOG_STYLE | wx.RESIZE_BORDER,
        )
        self.pal = pal
        self.data = None
        self.SetBackgroundColour(_c(pal["background"]))
        self._build()
        self._load()

    # -- layout ------------------------------------------------------------

    def _build(self):
        root = wx.BoxSizer(wx.VERTICAL)

        self.scroll = wx.ScrolledWindow(self, style=wx.VSCROLL)
        self.scroll.surface = self.pal["background"]
        self.scroll.pal = self.pal
        self.scroll.SetBackgroundColour(_c(self.pal["background"]))
        self.scroll.SetScrollRate(0, 12)
        self.content = wx.BoxSizer(wx.VERTICAL)
        self.scroll.SetSizer(self.content)
        root.Add(self.scroll, 1, wx.EXPAND | wx.ALL, th.SP_LG)

        buttons = wx.BoxSizer(wx.HORIZONTAL)
        buttons.Add(
            Button(self, "Save", self.pal, variant="primary", on_click=self._save),
            0,
            wx.RIGHT,
            th.SP_SM,
        )
        buttons.Add(
            Button(
                self,
                "Restart agent",
                self.pal,
                variant="secondary",
                on_click=self._restart,
            ),
            0,
            wx.RIGHT,
            th.SP_SM,
        )
        buttons.Add(
            Button(
                self, "Stop agent", self.pal, variant="secondary", on_click=self._stop
            ),
            0,
        )
        buttons.AddStretchSpacer()
        buttons.Add(
            Button(self, "Close", self.pal, variant="ghost", on_click=self.Close), 0
        )
        root.Add(buttons, 0, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.BOTTOM, th.SP_LG)

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
            self.data = AgentClient().settings()
        except AgentUnavailable as exc:
            self.data = None
            card = Card(self.scroll, "Agent", self.pal)
            card.body.Add(card.label(str(exc), tone="muted_fg"), 0)
            self.content.Add(card, 0, wx.EXPAND)
            self._relayout()
            return
        self._render()
        self._relayout()

    def _render(self):
        settings = self.data.get("settings", {})
        identity = self.data.get("identity", {})
        proto = self.data.get("protocol", {})
        auto = self.data.get("autostart", {})

        # -- server ---------------------------------------------------------
        server = Card(self.scroll, "Server", self.pal)
        server.body.Add(
            server.label("Prism server URL", tone="muted_fg", small=True),
            0,
            wx.BOTTOM,
            th.SP_XS,
        )
        self.url = wx.TextCtrl(server, value=settings.get("server_url", ""))
        self._style_input(self.url)
        server.body.Add(self.url, 0, wx.EXPAND | wx.BOTTOM, th.SP_SM)

        server.row(
            "Status",
            "Connected" if identity.get("reachable") else "Unreachable",
            badge=True,
            tone="success" if identity.get("reachable") else "destructive",
        )
        self.content.Add(server, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

        # -- account --------------------------------------------------------
        account = Card(self.scroll, "Account", self.pal)
        if not identity.get("reachable"):
            account.body.Add(
                account.label(
                    "Can't reach the server, so there's nothing to sign in to yet.",
                    tone="muted_fg",
                ),
                0,
            )
        elif not identity.get("auth_enabled"):
            # Be explicit rather than showing a dead Sign-in button: this server
            # genuinely has auth switched off, so there is no account to use.
            account.body.Add(
                account.label(
                    identity.get("note") or "This server has authentication disabled.",
                    tone="muted_fg",
                ),
                0,
                wx.BOTTOM,
                th.SP_SM,
            )
            account.row("Signed in as", "Guest", badge=True, tone="muted")
        else:
            user = identity.get("user")
            if user:
                account.row("Signed in as", user.get("email", "?"))
                account.row(
                    "Role", str(user.get("role", "")), badge=True, tone="primary"
                )
            else:
                account.body.Add(
                    account.label(
                        "Prism signs in through your identity provider in a browser.\n"
                        "Paste an API token below, or use Sign in once it's wired up.",
                        tone="muted_fg",
                    ),
                    0,
                    wx.BOTTOM,
                    th.SP_SM,
                )

        account.body.Add(
            account.label("API token", tone="muted_fg", small=True), 0, wx.TOP, th.SP_SM
        )
        account.body.Add(
            account.label(
                "Stored on this machine only; never shown again once saved.",
                tone="muted_fg",
                small=True,
            ),
            0,
            wx.BOTTOM,
            th.SP_XS,
        )
        self.token = wx.TextCtrl(
            account,
            value="",
            style=wx.TE_PASSWORD,
        )
        self._style_input(self.token)
        has = settings.get("has_token")
        self.token.SetHint("•••••• (a token is saved)" if has else "Paste a token")
        account.body.Add(self.token, 0, wx.EXPAND)

        if has:
            account.body.Add(
                Button(
                    account,
                    "Clear token",
                    self.pal,
                    variant="ghost",
                    on_click=self._clear_token,
                ),
                0,
                wx.TOP,
                th.SP_XS,
            )
        self.content.Add(account, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

        # -- startup --------------------------------------------------------
        startup = Card(self.scroll, "Startup", self.pal)
        self.autostart = wx.CheckBox(startup, label="Start the Prism agent at login")
        self.autostart.SetValue(bool(auto.get("enabled")))
        self.autostart.SetForegroundColour(_c(self.pal["foreground"]))
        self.autostart.SetBackgroundColour(_c(self.pal["card"]))
        startup.body.Add(self.autostart, 0, wx.BOTTOM, th.SP_XS)
        startup.body.Add(
            startup.label(
                "Without this the agent only runs once you've opened KiCad, which\n"
                "defeats the point of it working when KiCad is closed.",
                tone="muted_fg",
                small=True,
            ),
            0,
        )
        self.content.Add(startup, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

        # -- links ----------------------------------------------------------
        links = Card(self.scroll, "prism:// links", self.pal)
        if proto.get("supported"):
            self.handler = wx.CheckBox(
                links, label="Let this machine open prism:// links"
            )
            self.handler.SetValue(bool(proto.get("registered")))
            self.handler.SetForegroundColour(_c(self.pal["foreground"]))
            self.handler.SetBackgroundColour(_c(self.pal["card"]))
            links.body.Add(self.handler, 0, wx.BOTTOM, th.SP_XS)
            links.body.Add(
                links.label(
                    "Registers the scheme for your user account only. Nothing is\n"
                    "written until you tick this and press Save.",
                    tone="muted_fg",
                    small=True,
                ),
                0,
            )
        else:
            self.handler = None
            links.body.Add(
                links.label(
                    "On macOS a URL scheme can only be claimed by an application\n"
                    "bundle, so this needs the agent packaged as a .app first.",
                    tone="muted_fg",
                    small=True,
                ),
                0,
            )
        self.content.Add(links, 0, wx.EXPAND)

    def _style_input(self, ctrl):
        ctrl.SetBackgroundColour(_c(self.pal["muted"]))
        ctrl.SetForegroundColour(_c(self.pal["foreground"]))
        f = ctrl.GetFont()
        f.SetPointSize(th.FONT_BODY)
        ctrl.SetFont(f)

    # -- actions -----------------------------------------------------------

    def _save(self):
        if self.data is None:
            return
        payload = {"server_url": self.url.GetValue().strip()}
        token = self.token.GetValue()
        if token:
            payload["api_token"] = token
        if self.handler is not None:
            payload["protocol_handler"] = self.handler.GetValue()
        payload["autostart"] = self.autostart.GetValue()

        try:
            result = AgentClient().save_settings(payload)
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        # The agent reports registration failures (e.g. the OS refused) rather
        # than silently persisting a setting it couldn't honour.
        if result.get("error"):
            wx.MessageBox(result["error"], "Prism", wx.OK | wx.ICON_WARNING)

        self.data = result
        self.content.Clear(delete_windows=True)
        self._render()
        self._relayout()

    def _clear_token(self):
        try:
            self.data = AgentClient().save_settings({"clear_token": True})
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return
        self.content.Clear(delete_windows=True)
        self._render()
        self._relayout()

    def _restart(self):
        try:
            AgentClient().restart()
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        # It takes a moment to come back on a new port; poll rather than guess.
        for _ in range(40):
            wx.MilliSleep(250)
            wx.Yield()
            try:
                AgentClient().health()
                break
            except AgentUnavailable:
                continue
        self._load()

    def _stop(self):
        if (
            wx.MessageBox(
                "Stop the Prism agent? The plugin won't work until it's started again.",
                "Prism",
                wx.YES_NO | wx.ICON_QUESTION,
            )
            != wx.YES
        ):
            return
        try:
            AgentClient().quit()
        except AgentUnavailable:
            pass  # already gone is the outcome we wanted
        self.EndModal(wx.ID_OK)

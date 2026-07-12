"""First-run setup.

The install story is "download a zip, install it in KiCad, everything else takes
care of itself" — but two of the things that need doing touch the machine outside
KiCad: starting a background agent, and (optionally) registering an autostart entry
and a URL scheme.

So this asks. Each item is a checkbox the user can decline, and each says plainly
what it will do — a registry key, a login item, a URL scheme. Doing any of that
silently is exactly the behaviour people rightly resent in desktop software.

It runs once. After that a marker sits beside the settings file, and the plugin goes
straight to the main dialog. "Set up again" in Settings clears it.
"""

from __future__ import annotations

import wx

from . import prism_theme as th
from .agent_client import AgentClient, AgentUnavailable
from .widgets import Button, Card

MARKER = "first_run_done"


def _c(hex_value):
    return wx.Colour(*th.hex_to_rgb(hex_value))


def needed() -> bool:
    """Has the user been through setup?

    Kept in the agent's settings so it survives a plugin reinstall — being asked to
    set up again because you updated the plugin would be irritating and pointless.
    Falls back to "yes, ask" when the agent isn't reachable: the setup dialog is
    precisely what starts it.
    """
    try:
        data = AgentClient().settings()
    except AgentUnavailable:
        return True
    return not data.get("settings", {}).get(MARKER)


class FirstRunDialog(wx.Dialog):
    """Start the agent, then offer the two OS-level integrations."""

    def __init__(self, parent, pal):
        super().__init__(
            parent,
            title="Set up Prism",
            size=wx.Size(520, 520),
            style=wx.DEFAULT_DIALOG_STYLE,
        )
        self.pal = pal
        self.agent_ok = False
        self.SetBackgroundColour(_c(pal["background"]))
        self._build()
        self._check_agent()

    # -- layout ------------------------------------------------------------

    def _build(self):
        root = wx.BoxSizer(wx.VERTICAL)

        title = wx.StaticText(self, label="Set up Prism")
        title.SetForegroundColour(_c(self.pal["foreground"]))
        f = title.GetFont()
        f.SetPointSize(th.FONT_TITLE)
        f.SetWeight(wx.FONTWEIGHT_BOLD)
        title.SetFont(f)
        root.Add(title, 0, wx.LEFT | wx.RIGHT | wx.TOP, th.SP_LG)

        self.status = wx.StaticText(self, label="Starting the Prism agent…")
        self.status.SetForegroundColour(_c(self.pal["muted_fg"]))
        sf = self.status.GetFont()
        sf.SetPointSize(th.FONT_SMALL)
        self.status.SetFont(sf)
        root.Add(self.status, 0, wx.LEFT | wx.RIGHT | wx.TOP, th.SP_LG)
        root.AddSpacer(th.SP_MD)

        self.body = wx.BoxSizer(wx.VERTICAL)
        root.Add(self.body, 1, wx.EXPAND | wx.LEFT | wx.RIGHT, th.SP_LG)

        buttons = wx.BoxSizer(wx.HORIZONTAL)
        self.finish_btn = Button(
            self, "Finish", self.pal, variant="primary", on_click=self._finish
        )
        self.finish_btn.Enable(False)
        buttons.Add(self.finish_btn, 0, wx.RIGHT, th.SP_SM)
        buttons.AddStretchSpacer()
        buttons.Add(
            Button(self, "Skip", self.pal, variant="ghost", on_click=self._skip), 0
        )
        root.Add(buttons, 0, wx.EXPAND | wx.ALL, th.SP_LG)

        self.SetSizer(root)

    def _relayout(self):
        self.body.Layout()
        self.Layout()
        self.Refresh()

    # -- the agent ---------------------------------------------------------

    def _check_agent(self):
        """The agent has to be up before anything else: it owns the settings, and
        the two toggles below are its to apply."""
        self.body.Clear(delete_windows=True)

        try:
            AgentClient().health()
            self.agent_ok = True
        except AgentUnavailable:
            self.agent_ok = False

        if not self.agent_ok:
            self._start_agent()

        if self.agent_ok:
            self._render_options()
        self._relayout()

    def _start_agent(self):
        from . import agent_launcher

        card = Card(self, "Prism agent", self.pal)
        try:
            with wx.BusyCursor():
                agent_launcher.start_agent()
        except agent_launcher.LaunchError as exc:
            self.status.SetLabel("Couldn't start the agent")
            self.status.SetForegroundColour(_c(self.pal["destructive"]))
            card.body.Add(card.label(str(exc), tone="muted_fg"), 0)
            self.body.Add(card, 0, wx.EXPAND)
            return

        # It needs a moment to bind its port and publish discovery. Poll rather than
        # guess at a sleep long enough to always work.
        for _ in range(30):
            wx.MilliSleep(200)
            wx.Yield()
            try:
                AgentClient().health()
                self.agent_ok = True
                break
            except AgentUnavailable:
                continue

        if not self.agent_ok:
            self.status.SetLabel("The agent was started but hasn't come up")
            self.status.SetForegroundColour(_c(self.pal["destructive"]))
            card.body.Add(
                card.label("Give it a moment, then reopen Prism.", tone="muted_fg"), 0
            )
            self.body.Add(card, 0, wx.EXPAND)

    # -- the options -------------------------------------------------------

    def _render_options(self):
        self.status.SetLabel("The agent is running.")
        self.status.SetForegroundColour(_c(self.pal["success"]))
        self.finish_btn.Enable(True)

        try:
            data = AgentClient().settings()
        except AgentUnavailable:
            return

        proto = data.get("protocol", {})

        card = Card(self, "Optional", self.pal)
        card.body.Add(
            card.label(
                "Prism can set these up for you. Both are per-user, and you can\n"
                "change them later in Settings.",
                tone="muted_fg",
                small=True,
            ),
            0,
            wx.BOTTOM,
            th.SP_SM,
        )

        self.autostart = wx.CheckBox(card, label="Start the Prism agent at login")
        # Pre-ticked on a fresh setup: it's what makes the agent behave as
        # advertised (there whether or not KiCad is open), and declining is one
        # click. If it's already on, that's what we show.
        self.autostart.SetValue(True)
        self._style_check(self.autostart)
        card.body.Add(self.autostart, 0)
        card.body.Add(
            card.label(self._autostart_detail(), tone="muted_fg", small=True),
            0,
            wx.LEFT | wx.BOTTOM,
            th.SP_MD,
        )

        if proto.get("supported"):
            self.handler = wx.CheckBox(card, label="Open prism:// links with Prism")
            self.handler.SetValue(bool(proto.get("registered")))
            self._style_check(self.handler)
            card.body.Add(self.handler, 0)
            card.body.Add(
                card.label(self._handler_detail(), tone="muted_fg", small=True),
                0,
                wx.LEFT,
                th.SP_MD,
            )
        else:
            self.handler = None
            card.body.Add(
                card.label(
                    "prism:// links need the agent packaged as a .app on macOS,\n"
                    "so that isn't available here yet.",
                    tone="muted_fg",
                    small=True,
                ),
                0,
                wx.LEFT,
                th.SP_MD,
            )

        self.body.Add(card, 0, wx.EXPAND)

    def _style_check(self, ctrl):
        ctrl.SetForegroundColour(_c(self.pal["foreground"]))
        ctrl.SetBackgroundColour(_c(self.pal["card"]))

    def _autostart_detail(self) -> str:
        """Say exactly what will be written. Vague reassurance is what makes people
        distrust installers."""
        import sys

        if sys.platform == "win32":
            return "Adds a per-user entry under HKCU\\…\\CurrentVersion\\Run."
        if sys.platform == "darwin":
            return "Adds a LaunchAgent in ~/Library/LaunchAgents."
        return "Adds a .desktop file in ~/.config/autostart."

    def _handler_detail(self) -> str:
        import sys

        if sys.platform == "win32":
            return "Registers the scheme under HKCU\\Software\\Classes, for you only."
        return "Registers the scheme for your user account only."

    # -- actions -----------------------------------------------------------

    def _finish(self):
        payload = {MARKER: True}
        if self.agent_ok:
            payload["autostart"] = self.autostart.GetValue()
            if self.handler is not None:
                payload["protocol_handler"] = self.handler.GetValue()

        try:
            result = AgentClient().save_settings(payload)
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        # The agent reports an OS refusal rather than persisting a setting it
        # couldn't honour — surface that instead of claiming success.
        if result.get("error"):
            wx.MessageBox(result["error"], "Prism", wx.OK | wx.ICON_WARNING)

        self.EndModal(wx.ID_OK)

    def _skip(self):
        """Don't ask again, but don't set anything up either."""
        try:
            AgentClient().save_settings({MARKER: True})
        except AgentUnavailable:
            pass  # nothing to remember it with; we'll ask again next time
        self.EndModal(wx.ID_CANCEL)

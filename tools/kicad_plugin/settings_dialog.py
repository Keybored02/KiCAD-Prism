"""Settings for the agent, edited from inside KiCad.

The agent owns the settings (it's the thing that uses them, and it outlives KiCad);
this is just an editor for them over the loopback API. It lives here rather than in
the tray because a tray menu can't host text fields, pystray menus are labels and
checkmarks, and a half-usable tray form would be worse than none.
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

        self._render_library()

        # -- account --------------------------------------------------------
        account = Card(self.scroll, "Account", self.pal)
        if not identity.get("reachable"):
            account.body.Add(
                account.label(
                    "Server unreachable.",
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
                # Signed in: the one action that matters is signing out. It clears
                # the token here and revokes it at Prism.
                account.body.Add(
                    Button(
                        account,
                        "Sign out",
                        self.pal,
                        variant="ghost",
                        on_click=self._sign_out,
                    ),
                    0,
                    wx.TOP,
                    th.SP_SM,
                )
            else:
                account.body.Add(
                    account.label(
                        "Not signed in. Sign in through your browser, the usual "
                        "way you log in to Prism.",
                        tone="muted_fg",
                    ),
                    0,
                    wx.BOTTOM,
                    th.SP_SM,
                )
                account.body.Add(
                    Button(
                        account,
                        "Sign in",
                        self.pal,
                        variant="primary",
                        on_click=self._sign_in,
                    ),
                    0,
                    wx.BOTTOM,
                    th.SP_SM,
                )

        # The manual token field stays as a fallback: a headless box with no
        # browser, or a service token an admin handed out, still needs a way in.
        # It is secondary to the browser flow now, so it is labelled as such.
        account.body.Add(
            account.label("API token (advanced)", tone="muted_fg", small=True),
            0,
            wx.TOP,
            th.SP_SM,
        )
        account.body.Add(
            account.label(
                "Paste a token instead of signing in. Stored on this machine, "
                "not shown again once saved.",
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

        # -- projects -------------------------------------------------------
        # Where to look for projects, by their .prism.json marker. A place to look,
        # not a place you are forced to put things: a checkout works wherever it is.
        projects = Card(self.scroll, "Projects", self.pal)

        # An agent older than this setting drops it on save and answers 200, so the
        # dialog would report success while the folders silently vanished. The tell is
        # that the key is absent from its payload entirely. Say so, and do not offer a
        # control that cannot work: a Save that lies is worse than a missing feature.
        if "projects_roots" not in settings:
            self.roots = None
            projects.body.Add(
                projects.label(
                    "The running agent is too old for this setting.\n"
                    "Restart it to pick up the new version.",
                    tone="warning",
                ),
                0,
            )
            self.content.Add(projects, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)
            return self._render_rest(auto, proto)

        projects.body.Add(
            projects.label(
                "Folders to search for Prism projects.",
                tone="muted_fg",
                small=True,
            ),
            0,
            wx.BOTTOM,
            th.SP_XS,
        )
        self.roots = wx.ListBox(
            projects,
            choices=list(settings.get("projects_roots") or []),
            size=wx.Size(-1, 90),
        )
        self.roots.SetForegroundColour(_c(self.pal["foreground"]))
        self.roots.SetBackgroundColour(_c(self.pal["background"]))
        projects.body.Add(self.roots, 0, wx.EXPAND | wx.BOTTOM, th.SP_XS)

        root_buttons = wx.BoxSizer(wx.HORIZONTAL)
        root_buttons.Add(
            Button(projects, "Add", self.pal, variant="ghost", on_click=self._add_root),
            0,
            wx.RIGHT,
            th.SP_XS,
        )
        root_buttons.Add(
            Button(
                projects,
                "Remove",
                self.pal,
                variant="ghost",
                on_click=self._remove_root,
            ),
            0,
        )
        projects.body.Add(root_buttons, 0)
        self.content.Add(projects, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

        self._render_rest(auto, proto)

    def _render_rest(self, auto, proto):
        """Everything below the Projects card.

        Split out because the Projects card has two shapes (usable, or "your agent is
        too old"), and both need the cards that follow.
        """
        # -- startup --------------------------------------------------------
        startup = Card(self.scroll, "Startup", self.pal)
        self.autostart = wx.CheckBox(startup, label="Start the Prism agent at login")
        self.autostart.SetValue(bool(auto.get("enabled")))
        self.autostart.SetForegroundColour(_c(self.pal["foreground"]))
        self.autostart.SetBackgroundColour(_c(self.pal["card"]))
        startup.body.Add(self.autostart, 0, wx.BOTTOM, th.SP_XS)
        startup.body.Add(
            startup.label(
                "Required for Prism to work while KiCad is closed.",
                tone="muted_fg",
                small=True,
            ),
            0,
            wx.BOTTOM,
            th.SP_SM,
        )
        startup.body.Add(
            Button(
                startup,
                "Run setup again",
                self.pal,
                variant="ghost",
                on_click=self._rerun_setup,
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
                    "Registered for your user account only, on Save.",
                    tone="muted_fg",
                    small=True,
                ),
                0,
            )
        else:
            # Not reachable today: all three platforms can register. Kept as a graceful
            # fallback rather than a crash if one ever cannot.
            self.handler = None
            links.body.Add(
                links.label(
                    "Not available on this platform.",
                    tone="muted_fg",
                    small=True,
                ),
                0,
            )
        self.content.Add(links, 0, wx.EXPAND)

    def _render_library(self):
        """Is Prism KiCad's remote symbol provider, and does it point at our server?

        Three states worth distinguishing:
            Linked        healthy.
            Wrong server  a Prism provider IS registered, but for a different server
                          than the one above. You'd be browsing the wrong catalog with
                          nothing to tell you.
            Not linked    never registered; Prism's parts aren't in the Symbol Chooser.
        """
        card = Card(self.scroll, "Symbol library", self.pal)

        try:
            state = AgentClient().library()
        except AgentUnavailable as exc:
            card.row("Status", "Unavailable", badge=True, tone="warning")
            card.body.Add(
                card.label(str(exc), tone="muted_fg", small=True), 0, wx.TOP, th.SP_XS
            )
            self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)
            return

        if not state.get("configured"):
            card.row("Status", "No KiCad config found", tone="muted_fg")
            self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)
            return

        linked = state.get("linked")
        stale = state.get("stale")

        if linked:
            label, tone = "Linked", "success"
        elif stale:
            label, tone = "Wrong server", "warning"
        else:
            label, tone = "Not linked", "warning"
        card.row("Prism", label, badge=True, tone=tone)
        card.row("KiCad", state.get("kicad_version") or ", ", tone="muted_fg")

        if stale:
            card.body.Add(
                card.label(
                    "Currently linked to %s.\nRe-link, then restart KiCad."
                    % state.get("linked_url", ""),
                    tone="muted_fg",
                    small=True,
                ),
                0,
                wx.TOP | wx.BOTTOM,
                th.SP_XS,
            )
        elif not linked:
            card.body.Add(
                card.label(
                    "Prism's parts won't appear in the Symbol Chooser.\n"
                    "Link, then restart KiCad.",
                    tone="muted_fg",
                    small=True,
                ),
                0,
                wx.TOP | wx.BOTTOM,
                th.SP_XS,
            )

        card.body.Add(
            Button(
                card,
                "Re-link" if (linked or stale) else "Link Prism",
                self.pal,
                variant="ghost" if linked else "primary",
                on_click=self._link_library,
            ),
            0,
            wx.TOP,
            th.SP_XS,
        )

        self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

    def _link_library(self):
        """Register Prism as KiCad's symbol provider.

        The agent does the write. It works with KiCad open, KiCad only rewrites the
        parts of eeschema.json it touched, and the provider list isn't one of them, but
        KiCad reads the providers at startup, so it needs a restart to pick this up.
        """
        try:
            with wx.BusyCursor():
                result = AgentClient().link_library()
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        if result.get("error"):
            wx.MessageBox(result["error"], "Prism", wx.OK | wx.ICON_WARNING)
        else:
            wx.MessageBox(
                "Linked to KiCad %s. Restart KiCad to load it."
                % (result.get("kicad_version") or ""),
                "Prism",
                wx.OK | wx.ICON_INFORMATION,
            )
        self._load()

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
        if self.roots is not None:
            payload["projects_roots"] = list(self.roots.GetStrings())

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

    def _add_root(self):
        with wx.DirDialog(
            self,
            "Choose a folder to search for Prism projects",
            style=wx.DD_DEFAULT_STYLE | wx.DD_DIR_MUST_EXIST,
        ) as dlg:
            if dlg.ShowModal() != wx.ID_OK:
                return
            chosen = dlg.GetPath()
        # The agent canonicalises and de-duplicates on save; this only stops the
        # obvious case of adding the identical string twice in one sitting.
        if chosen not in self.roots.GetStrings():
            self.roots.Append(chosen)

    def _remove_root(self):
        selected = self.roots.GetSelection()
        if selected != wx.NOT_FOUND:
            self.roots.Delete(selected)

    def _rerun_setup(self):
        """Reopen the first-run flow. Kept reachable because the two OS integrations
        it offers are easy to decline on day one and want later."""
        from .first_run import FirstRunDialog

        dlg = FirstRunDialog(self, self.pal)
        try:
            dlg.ShowModal()
        finally:
            dlg.Destroy()
        self._load()  # the toggles it applied are ours to redisplay

    def _sign_in(self):
        """Sign in through the browser, then redisplay the account state.

        Saves the server URL first: the user may have typed a new one without
        pressing Save, and signing in to the old server would be quietly wrong.
        The agent opens the browser and waits, so this can take a while, a busy
        cursor says so rather than the dialog appearing to hang.
        """
        url = self.url.GetValue().strip()
        if not url:
            wx.MessageBox(
                "Set the Prism server URL first.", "Prism", wx.OK | wx.ICON_WARNING
            )
            return
        try:
            AgentClient().save_settings({"server_url": url})
            with wx.BusyCursor():
                result = AgentClient().sign_in()
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        if result.get("error"):
            wx.MessageBox(result["error"], "Prism", wx.OK | wx.ICON_WARNING)

        self.data = result
        self.content.Clear(delete_windows=True)
        self._render()
        self._relayout()

    def _sign_out(self):
        try:
            with wx.BusyCursor():
                result = AgentClient().sign_out()
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        # Signed out locally regardless; the warning only means Prism could not be
        # reached to revoke the token, which the user may want to do by hand.
        if result.get("warning"):
            wx.MessageBox(result["warning"], "Prism", wx.OK | wx.ICON_INFORMATION)

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
                "Stop the Prism agent? The plugin needs it to run.",
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

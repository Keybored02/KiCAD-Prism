"""The plugin's wx dialog, themed to match the Prism web app.

wx has no stylesheet, so "theming" means setting colours/fonts explicitly and
owner-drawing the widgets whose native versions can't be styled (see widgets.py,
notably wx.Button ignores SetBackgroundColour on Windows, which is why the primary
button has to be drawn by hand).
"""

from __future__ import annotations

import os
import subprocess
import sys
import threading

import wx
import wx.adv

from . import agent_launcher
from . import prism_theme as th
from . import version
from .agent_client import AgentClient, AgentUnavailable
from .settings_dialog import SettingsDialog
from .widgets import (
    Badge,
    Button,
    Card,
    ChangeRow,
    Disclosure,
    ScrollThumb,
    StatusIcon,
)

try:
    from . import crossprobe
except ImportError:  # pcbnew is only importable inside KiCad
    crossprobe = None

LOGO = os.path.join(os.path.dirname(__file__), "assets", "prism-64.png")

# A real board can produce hundreds of changed items. Cap what we draw so the
# dialog stays responsive, and say so rather than silently truncating.
MAX_ROWS_PER_FILE = 60

# Distinguishes "the diff is still computing in the background" from None
# ("couldn't read") and [] ("nothing to commit"), so the changes card can show a
# transient loading state while the rest of the dialog is already up.
_CHANGES_LOADING = object()


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

        # The header carries what you'd otherwise need three rows to say: which project,
        # where it is, and whether the server and this project are in good standing.
        # The two icons replace the Project card's "In Prism" row entirely.
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

        self.title = wx.StaticText(self, label="Prism")
        self.title.SetForegroundColour(_c(self.pal["foreground"]))
        tf = self.title.GetFont()
        tf.SetPointSize(th.FONT_TITLE)
        tf.SetWeight(wx.FONTWEIGHT_BOLD)
        self.title.SetFont(tf)
        header.Add(self.title, 0, wx.ALIGN_CENTER_VERTICAL)

        # The branch sits with the project name, not with the path: it says WHICH
        # version of this project you have open, which is a fact about the project, not
        # about where it lives on disk.
        self.branch = Badge(self, "", self.pal, tone="muted", size=th.FONT_BODY)
        self.branch.SetToolTip("Current git branch")
        self.branch.Hide()  # nothing to show until the agent tells us the branch
        header.Add(self.branch, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, th.SP_SM)

        header.AddStretchSpacer()

        # Who you are on the SERVER, over the three things whose state you would
        # otherwise go looking for. The git identity is on the tooltip: it is a
        # different identity, and the two can silently disagree.
        corner = wx.BoxSizer(wx.VERTICAL)

        self.user = wx.StaticText(self, label="", style=wx.ALIGN_RIGHT)
        self.user.SetForegroundColour(_c(self.pal["muted_fg"]))
        uf = self.user.GetFont()
        uf.SetPointSize(th.FONT_SMALL)
        self.user.SetFont(uf)
        corner.Add(self.user, 0, wx.ALIGN_RIGHT | wx.BOTTOM, th.SP_XS)

        icons = wx.BoxSizer(wx.HORIZONTAL)
        # First, because it's the precondition for the rest: with no agent, the other
        # three know nothing and go grey.
        self.agent_icon = StatusIcon(
            self, "agent", self.pal, tooltip="Contacting the agent"
        )
        icons.Add(self.agent_icon, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, th.SP_XS)
        self.server_icon = StatusIcon(
            self, "server", self.pal, tooltip="Contacting the agent"
        )
        icons.Add(self.server_icon, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, th.SP_XS)
        self.git_icon = StatusIcon(self, "git", self.pal, tooltip="No repository yet")
        icons.Add(self.git_icon, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, th.SP_XS)
        self.library_icon = StatusIcon(
            self, "library", self.pal, tooltip="Symbol library"
        )
        icons.Add(self.library_icon, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, th.SP_XS)
        corner.Add(icons, 0, wx.ALIGN_RIGHT)

        header.Add(corner, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, th.SP_SM)

        root.Add(header, 0, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.TOP, th.SP_LG)

        # The path, under the name. Clickable: seeing where a project lives and wanting
        # to open that folder are the same impulse.
        self.status = wx.StaticText(self, label="Contacting agent...")
        self.status.SetForegroundColour(_c(self.pal["muted_fg"]))
        sf = self.status.GetFont()
        sf.SetPointSize(th.FONT_SMALL)
        self.status.SetFont(sf)
        self.status.Bind(wx.EVT_LEFT_UP, self._on_open_folder)
        self.status.Bind(wx.EVT_ENTER_WINDOW, self._on_path_enter)
        self.status.Bind(wx.EVT_LEAVE_WINDOW, self._on_path_leave)
        # SP_LG, the same gutter as the header, the cards and the buttons. Anything else
        # and the path sits proud of every other element in the dialog.
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

            # It answered, so it's alive. Its version is the useful thing to say about
            # it: "is the agent running" is a yes/no, and the yes is worth qualifying.
            self.agent_icon.set(
                "success", "Prism agent %s is running" % (running or "?")
            )

            # The agent answered, so the only question left is whether IT can reach the
            # backend. The icon says which, and stays out of the way otherwise.
            self._set_server_icon(bool(health.get("backend_reachable")))

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
            # The one thing here that IS an error. An unreachable backend is normal and
            # temporary; a missing agent means nothing works, so it gets the red.
            self.agent_icon.set("destructive", "The Prism agent isn't running")
            # And with no agent we know nothing about the rest. Grey, not amber: amber
            # says "reachable but unhappy", and we cannot even claim that much.
            self.server_icon.set("muted_fg", "Unknown")
            self.git_icon.set("muted_fg", "Unknown")
            self.library_icon.set("muted_fg", "Unknown")
            self.user.SetLabel("")
            self.branch.Hide()
            self._render_unavailable(str(exc))
            self._relayout()
            return

        # The diff parses every changed board, so it can take a second or two on
        # a big one. Don't block the dialog on it: render everything else now with
        # the changes card in a "Computing…" state, and fetch the diff in a
        # background thread. When it lands we marshal back to the UI thread and
        # re-render from data already in hand.
        self.changes = _CHANGES_LOADING
        self._render()
        self._relayout()
        self._start_changes_fetch(client)

    def _start_changes_fetch(self, client):
        """Fetch the uncommitted-changes diff off the UI thread, then rebuild.

        A generation counter guards against a stale result: if the user hits
        Refresh (which calls _load again) before an in-flight fetch returns, the
        old thread's result is dropped rather than overwriting newer state.
        """
        self._changes_gen = getattr(self, "_changes_gen", 0) + 1
        generation = self._changes_gen
        board_path = self.board_path

        def worker():
            try:
                result = client.changes(board_path).get("changes", [])
            except AgentUnavailable:
                result = None  # the changes card explains itself
            except Exception:
                result = None
            wx.CallAfter(self._apply_changes, generation, result)

        threading.Thread(target=worker, daemon=True).start()

    def _apply_changes(self, generation, result):
        # Ignore a result from a fetch the user has already superseded, and one
        # that arrives after the dialog is gone.
        if generation != getattr(self, "_changes_gen", 0):
            return
        if not self:
            return
        self.changes = result
        self._rebuild()

    def _rebuild(self):
        """Re-render from data already in hand. No refetch, expanding a file is
        instant even when computing the diff was slow."""
        self.content.Clear(delete_windows=True)
        self._render()
        self._relayout()

    def _on_path_enter(self, _e):
        if self._project_dir():
            self.status.SetForegroundColour(_c(self.pal["primary"]))
            self.status.SetCursor(wx.Cursor(wx.CURSOR_HAND))
            self.status.Refresh()

    def _on_path_leave(self, _e):
        self.status.SetForegroundColour(_c(self.pal["muted_fg"]))
        self.status.SetCursor(wx.Cursor(wx.CURSOR_ARROW))
        self.status.Refresh()

    def _project_dir(self):
        return ((self.data or {}).get("project") or {}).get("path") or ""

    def _on_open_folder(self, _e):
        """Show the project folder in the system file manager."""
        path = self._project_dir()
        if not path or not os.path.isdir(path):
            return
        if sys.platform == "win32":
            os.startfile(path)  # noqa: S606 - our own path, from the agent
        elif sys.platform == "darwin":
            subprocess.Popen(["open", path])
        else:
            subprocess.Popen(["xdg-open", path])

    def _render_identity(self, git) -> None:
        """Who you are to Prism, with the git identity on hover.

        These are two different identities and they can disagree. Being signed into
        Prism as one person while git attributes your commits to another is easy to do
        and impossible to notice, so the tooltip always shows both.
        """
        user = (self.data or {}).get("user") or {}
        prism_name = user.get("email") or user.get("name") or ""

        git_name = (git or {}).get("user_name") or ""
        git_email = (git or {}).get("user_email") or ""
        git_who = ""
        if git_name and git_email:
            git_who = "%s <%s>" % (git_name, git_email)
        elif git_name or git_email:
            git_who = git_name or git_email

        # The label is the SERVER identity, and only that. The git identity is a
        # different person and lives on the tooltip: showing both inline would suggest
        # they're the same thing, and they are exactly the thing worth telling apart.
        self.user.SetLabel(prism_name or "Guest")

        lines = [
            "Prism: %s" % (prism_name or "guest (this server has auth disabled)"),
            "Git:   %s" % (git_who or "no user.name set"),
        ]
        self.user.SetToolTip("\n".join(lines))

    def _set_git_icon(self, git, prism) -> None:
        """The repository, and whether Prism knows about it.

        One icon, because the two facts are the same question in practice: is this
        project under version control that Prism can see?
        """
        # Ask whether there IS a repo, not whether we are on a branch. `branch` is empty
        # on a detached HEAD, which is the normal state after opening a commit, and
        # testing it turned the icon grey and claimed "Not a git repository" for a repo
        # that is plainly fine.
        if not git or not git.get("last_commit_hash"):
            self.git_icon.set("muted_fg", "Not a git repository")
            return

        # Where we are, in the words the tooltip should use. A detached HEAD is still on
        # the branch's history, just not at its tip. (Built by hand rather than with
        # .capitalize(), which would lowercase a branch name like "Release-2".)
        branch = git.get("branch") or ""
        if branch:
            where = "On %s" % branch
        else:
            on = git.get("on_branches") or []
            where = "Viewing an older commit on %s" % on[0] if on else "Not on a branch"

        if prism:
            self.git_icon.set("success", "%s, registered in Prism" % where)
        else:
            self.git_icon.set("warning", "%s, but not registered in Prism" % where)

    def _set_library_icon(self, library) -> None:
        """Is the Prism remote library linked, and to THIS server?

        The only question that matters is whether Prism is registered as KiCad's symbol
        provider and pointing at the server we're configured for. Whether a KiCad config
        directory exists is our problem, not the user's.
        """
        library = library or {}

        if library.get("linked"):
            self.library_icon.set("success", "Prism library linked")
        elif library.get("stale"):
            self.library_icon.set(
                "warning",
                "Prism library is linked to another server: %s"
                % library.get("linked_url", ""),
            )
        else:
            self.library_icon.set("muted_fg", "Prism library not linked")

    def _set_server_icon(self, reachable: bool) -> None:
        """Green when Prism is reachable, amber when it is not.

        Never red: an unreachable server is a normal, temporary state (laptop offline,
        backend restarting), and the plugin's local features keep working. Red would be
        crying wolf.
        """
        if reachable:
            self.server_icon.set("success", "Connected to Prism")
        else:
            self.server_icon.set("warning", "Can't reach the Prism server")

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

        # Running, but too old to talk to. Amber: it's alive, which is not nothing, and
        # a restart fixes it.
        self.agent_icon.set(
            "warning", "Prism agent %s is out of date" % (running or "?")
        )

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

        self._render_identity(git)
        self._set_git_icon(git, prism)
        self._set_library_icon((self.data or {}).get("library"))

        if self.verdict == "update":
            self._render_update_available()

        if not project:
            self.title.SetLabel("Prism")
            self.status.SetLabel("This board isn't inside a recognised KiCad project")
            self.status.SetForegroundColour(_c(self.pal["muted_fg"]))
            self.open_btn.Enable(False)
            return

        # Name, then the branch beside it, then the path under both. What the Project
        # and Git cards used to spend rows saying.
        self.title.SetLabel(project["name"])
        self.status.SetLabel(project["path"])
        self.status.SetForegroundColour(_c(self.pal["muted_fg"]))
        self.status.SetToolTip("Open this folder")

        self._render_branch_tag(git)
        self.Layout()

        if not prism:
            # Prism doesn't know this project. That is the moment to offer to add it,
            # not to make the user go and find the web UI.
            self._render_publish(project)

        self._render_git(git, prism)
        self._render_changes()
        self.open_btn.Enable(bool(prism))

    def _render_branch_tag(self, git):
        """The branch tag beside the project name.

        Opening a commit detaches HEAD, and the tag used to vanish: the project appeared
        to belong to no branch at all, which is alarming and false. You are still on the
        same branch's history, you are just parked at an older point on it.

        So when detached we keep showing the branch, marked as not-current. Which branch:
        the one containing this commit, preferring the one you were on.
        """
        git = git or {}
        branch = git.get("branch") or ""

        if branch:
            self.branch.set_label(branch, tone="muted")
            self.branch.SetToolTip("Current git branch")
            self.branch.Show()
            return

        if git.get("detached"):
            on = git.get("on_branches") or []
            # Marked, not hidden. The tag still answers "which board history am I in?",
            # and the tone plus the tooltip answer "and am I at the tip of it?".
            if on:
                self.branch.set_label(on[0], tone="warning")
                self.branch.SetToolTip(
                    "Viewing an older commit on %s. You are not at the tip of the "
                    "branch." % on[0]
                )
            else:
                self.branch.set_label("no branch", tone="warning")
                self.branch.SetToolTip("Not on a branch (detached HEAD).")
            self.branch.Show()
            return

        self.branch.Hide()

    # -- publishing ---------------------------------------------------------

    def _render_publish(self, project):
        """Offer to put this project in Prism.

        Shown only when Prism does not already have it. The card says what will happen
        before anything does, because publishing writes to the user's folder (a first
        commit) and to the network (a push).
        """
        card = Card(self.scroll, "Not in Prism", self.pal)

        try:
            state = AgentClient().publish_status(project["path"])
        except AgentUnavailable as exc:
            card.body.Add(card.label(str(exc), tone="muted_fg"), 0)
            self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)
            return

        if state.get("has_origin"):
            origin = state.get("origin") or ""
            server = (self.data or {}).get("library", {}).get("server_url") or ""

            # It already pushes somewhere, so publishing would repoint it away from the
            # upstream it collaborates through. But WHICH somewhere changes the advice
            # entirely, and telling a user their Prism remote is "another remote" would
            # be a confusing lie.
            if server and origin.startswith(server.rstrip("/")):
                message = (
                    "This project already pushes to Prism, but the server does not "
                    "list it. It may have been deleted there."
                )
            else:
                message = (
                    "This project pushes to another remote. Import it in Prism instead."
                )

            card.body.Add(
                card.label(message, tone="muted_fg", small=True),
                0,
                wx.BOTTOM,
                th.SP_XS,
            )
            card.row("Remote", origin, mono=True)
            self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)
            return

        needs_commit = not state.get("is_repo") or not state.get("has_commits")
        files = state.get("will_commit") or []

        if needs_commit and not files:
            card.body.Add(
                card.label("There is nothing to commit here.", tone="muted_fg"),
                0,
            )
            self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)
            return

        summary = (
            "Prism will host the git repository for this project."
            if not needs_commit
            else "This folder is not in git yet. Prism will set it up and host it."
        )
        card.body.Add(
            card.label(summary, tone="muted_fg", small=True), 0, wx.BOTTOM, th.SP_XS
        )

        if needs_commit:
            # Say exactly what a first commit takes. "Trust me" is not good enough for
            # a list the user cannot see: this is how a private key ends up in a repo's
            # history forever.
            card.body.Add(
                card.label(
                    "%d file%s will be committed. Backups and caches are excluded."
                    % (len(files), "" if len(files) == 1 else "s"),
                    tone="muted_fg",
                    small=True,
                ),
                0,
                wx.BOTTOM,
                th.SP_SM,
            )

        card.body.Add(
            Button(
                card,
                "Add to Prism",
                self.pal,
                variant="primary",
                on_click=lambda: self._publish(project, files if needs_commit else []),
            ),
            0,
        )
        self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

    def _publish(self, project, files):
        """Confirm, then publish. Writes to the user's folder and to the network."""
        if files:
            preview = "\n".join("  " + f for f in files[:15])
            if len(files) > 15:
                preview += "\n  ... and %d more" % (len(files) - 15)
            message = "Commit %d file%s and push %s to Prism?\n\n%s" % (
                len(files),
                "" if len(files) == 1 else "s",
                project["name"],
                preview,
            )
        else:
            message = "Push %s to Prism?" % project["name"]

        if (
            wx.MessageBox(message, "Add to Prism", wx.YES_NO | wx.ICON_QUESTION)
            != wx.YES
        ):
            return

        try:
            with wx.BusyCursor():
                AgentClient().publish(project["path"], project["name"])
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        self._load()  # it is in Prism now; the whole dialog says something different

    def _render_git(self, git, prism):
        """What's left of the Git card once the branch moved to the header.

        The last commit is a link: seeing which commit you're on and wanting to look at
        it are the same impulse, and the web UI can already show it.
        """
        # `branch` is empty on a detached HEAD, which is the normal state after opening a
        # commit. Testing it alone made the whole card claim "Not a git repository" for a
        # repo that is plainly fine, so ask about the repo, not about the branch.
        if not git or not git.get("last_commit_hash"):
            card = Card(self.scroll, "Git", self.pal)
            card.row("Status", "Not a git repository", tone="muted_fg")
            self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)
            return

        card = Card(self.scroll, "Git", self.pal)

        if git.get("ahead") or git.get("behind"):
            card.row(
                "Ahead / behind",
                "%d / %d" % (git["ahead"], git["behind"]),
                mono=True,
            )

        detached = bool(git.get("detached"))
        commit_hash = git.get("last_commit_hash") or ""
        if commit_hash:
            # "Current commit" when parked on one, because that is the question you have
            # when you are there. "Last commit" is the right name only at the tip.
            self._add_commit_row(
                card,
                commit_hash,
                git.get("last_commit") or "",
                prism,
                label="Current commit" if detached else "Last commit",
            )

        # The tip of the branch, when we are not on it. Two rows that differ say "you are
        # behind" on their own; a sentence explaining it would be saying the same thing
        # twice.
        tip = git.get("tip_commit_hash") or ""
        if detached and tip and tip != commit_hash:
            self._add_commit_row(
                card, tip, git.get("tip_commit") or "", prism, label="Latest commit"
            )

        self._add_pull_row(card, git)

        self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

        self._render_gitignore()
        self._render_stashes()

    def _render_gitignore(self):
        """Offer a KiCad .gitignore to a project that has not got one.

        Shown only when it would actually silence something. A project that was imported
        rather than published never got one, and then git reports KiCad's caches, locks
        and backups as uncommitted work forever: "you have uncommitted changes" stops
        meaning anything, and so does "discard my changes".
        """
        project = (self.data or {}).get("project")
        if not project:
            return

        try:
            state = AgentClient().gitignore_status(project["path"]) or {}
        except AgentUnavailable:
            return  # not worth an error of its own

        if not state.get("is_repo") or state.get("has_gitignore"):
            return

        would = state.get("would_ignore") or []
        tracked = state.get("already_tracked") or []
        if not would and not tracked:
            return  # nothing to gain; do not nag

        card = Card(self.scroll, "Generated files", self.pal)
        card.body.Add(
            card.label(
                "%d file(s) KiCad regenerates are showing as uncommitted." % len(would),
                tone="muted_fg",
                small=True,
            ),
            0,
            wx.BOTTOM,
            th.SP_XS,
        )

        if tracked:
            # An ignore rule does nothing for a file git already tracks. Saying "added,
            # you're all set" while a committed .kicad_prl keeps appearing would be a
            # small lie, and untracking it would reverse a decision somebody made.
            card.body.Add(
                card.label(
                    "%d are already committed, so they'll keep showing: %s"
                    % (len(tracked), ", ".join(tracked[:2])),
                    tone="muted_fg",
                    small=True,
                ),
                0,
                wx.BOTTOM,
                th.SP_SM,
            )

        card.body.Add(
            Button(
                card,
                "Add .gitignore",
                self.pal,
                variant="secondary",
                on_click=lambda: self._add_gitignore(project, would),
            ),
            0,
        )
        self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

    def _add_gitignore(self, project, would):
        """Write it, after saying what it will do."""
        if (
            wx.MessageBox(
                "Add a KiCad .gitignore to this project?\n\n"
                "%d generated file(s) will stop being reported. Nothing is committed "
                "and nothing on disk is deleted." % len(would),
                "Add .gitignore",
                wx.YES_NO | wx.ICON_QUESTION,
            )
            != wx.YES
        ):
            return

        try:
            with wx.BusyCursor():
                result = AgentClient().add_gitignore(project["path"])
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        # It is not committed. Say so, rather than letting the user assume it is done
        # and wonder why their colleague still sees the noise.
        note = "Added .gitignore. %d file(s) will stop being reported." % len(
            result.get("silenced") or []
        )
        if result.get("still_tracked"):
            note += (
                "\n\n%d file(s) are already committed, so they'll keep showing. "
                "Untracking those is up to you." % len(result["still_tracked"])
            )
        note += "\n\nCommit it when you're ready."
        wx.MessageBox(note, "Prism", wx.OK | wx.ICON_INFORMATION)
        self._load()

    def _render_stashes(self):
        """Work the user set aside, and a way to get it back.

        Only shown when there is some. A stash the user cannot see is a stash they will
        never restore, and "where did my changes go" is the worst thing this feature
        could leave them asking.
        """
        project = (self.data or {}).get("project")
        if not project:
            return

        try:
            entries = (AgentClient().stashes(project["path"]) or {}).get(
                "stashes"
            ) or []
        except AgentUnavailable:
            return  # not worth an error of its own; the rest of the dialog still works

        if not entries:
            return

        card = Card(self.scroll, "Set aside", self.pal)
        for entry in entries[:5]:
            row = wx.BoxSizer(wx.HORIZONTAL)
            label = card.label(entry["message"] or "(no message)")
            row.Add(label, 1, wx.ALIGN_CENTER_VERTICAL)
            row.Add(
                card.label(entry["when"], tone="muted_fg", small=True),
                0,
                wx.ALIGN_CENTER_VERTICAL | wx.RIGHT,
                th.SP_SM,
            )
            row.Add(
                Button(
                    card,
                    "Apply",
                    self.pal,
                    variant="ghost",
                    on_click=lambda e=entry: self._apply_stash(e),
                ),
                0,
                wx.ALIGN_CENTER_VERTICAL,
            )
            # Discard is the only thing in this dialog that destroys work, so it is
            # marked as such rather than sitting there looking like Restore's twin.
            row.Add(
                Button(
                    card,
                    "Discard",
                    self.pal,
                    variant="destructive-ghost",
                    on_click=lambda e=entry: self._drop_stash(e),
                ),
                0,
                wx.ALIGN_CENTER_VERTICAL | wx.LEFT,
                th.SP_XS,
            )
            card.body.Add(row, 0, wx.EXPAND | wx.BOTTOM, th.SP_XS)

        if len(entries) > 5:
            card.body.Add(
                card.label(
                    "and %d more" % (len(entries) - 5), tone="muted_fg", small=True
                ),
                0,
            )

        self.content.Add(card, 0, wx.EXPAND | wx.BOTTOM, th.SP_MD)

    def _drop_stash(self, entry):
        """Throw a stash away. The confirmation IS the safety mechanism here.

        Everything else in this dialog refuses to destroy work. This is the one place the
        user can ask us to, so the question has to name what goes, and No has to be the
        default: a reflex Enter on a dialog you did not read must not delete a board.
        """
        project = (self.data or {}).get("project")
        if not project:
            return

        answer = wx.MessageBox(
            "Discard “%s”?\n\nThese changes will be gone. This can't be undone from "
            "Prism." % (entry["message"] or "your changes"),
            "Discard changes",
            wx.YES_NO | wx.NO_DEFAULT | wx.ICON_WARNING,
        )
        if answer != wx.YES:
            return

        try:
            with wx.BusyCursor():
                result = AgentClient().drop_stash(project["path"], entry["ref"])
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        # Say what went, and hand over the escape hatch. Git keeps the commit until it
        # garbage-collects, so this is genuinely recoverable for a while, and a user who
        # has just realised their mistake deserves to know that rather than be told
        # "Discarded." and left with nothing.
        files = result.get("files") or []
        note = "Discarded %d file(s)." % len(files) if files else "Discarded."
        sha = result.get("sha") or ""
        if sha:
            note += (
                "\n\nIf that was a mistake, it can still be recovered for a while:"
                "\n    git stash apply %s" % sha[:12]
            )
        wx.MessageBox(note, "Prism", wx.OK | wx.ICON_INFORMATION)
        self._load()

    def _apply_stash(self, entry):
        project = (self.data or {}).get("project")
        if not project:
            return
        try:
            with wx.BusyCursor():
                AgentClient().apply_stash(project["path"], entry["ref"])
        except AgentUnavailable as exc:
            # The agent refuses rather than forcing a conflict, and it says why. A stash
            # that fails to apply is still in the list, so nothing is lost.
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        wx.MessageBox(
            "Applied “%s”.\n\nReopen the board in KiCad to see it."
            % (entry["message"] or "your changes"),
            "Prism",
            wx.OK | wx.ICON_INFORMATION,
        )
        self._load()

    def _add_pull_row(self, card, git):
        """Offer to pull, but only when it would actually work.

        Every reason it would not is said out loud instead. A Pull button that fails
        when pressed teaches people to distrust the whole dialog, and the failures here
        are ones the user can fix (commit your work, get back on a branch).
        """
        behind = git.get("behind") or 0
        ahead = git.get("ahead") or 0

        if ahead and behind:
            # Diverged. A textual merge would produce a board neither author drew, so
            # this opens the object-level merge instead: same two branches, but the user
            # chooses what to take rather than git guessing.
            card.body.Add(
                card.label(
                    "This branch and the remote have both moved on "
                    "(%d here, %d there). Choose what to take from each."
                    % (ahead, behind),
                    tone="warning",
                    small=True,
                ),
                0,
                wx.TOP,
                th.SP_XS,
            )
            card.body.Add(
                Button(
                    card,
                    "Merge in Prism",
                    self.pal,
                    variant="secondary",
                    on_click=self._merge,
                ),
                0,
                wx.TOP,
                th.SP_XS,
            )
            return

        if not behind:
            return  # nothing to pull; no button, no noise

        card.body.Add(
            Button(
                card,
                "Pull %d commit%s" % (behind, "" if behind == 1 else "s"),
                self.pal,
                variant="secondary",
                on_click=self._pull,
            ),
            0,
            wx.TOP,
            th.SP_XS,
        )

    def _merge(self):
        """Open the object-level merge for the branch this one has diverged from.

        The board itself is merged in the browser, where there is room to show three
        versions of it side by side. Nothing moves on disk until the user commits there,
        so pressing this is safe even mid-edit.
        """
        project = (self.data or {}).get("project")
        if not project:
            return

        # `@{u}` is the tracking branch, and it is the right target by construction: the
        # ahead/behind counts that produced this button were measured against it, so
        # anything else would merge a different branch than the one the user was told
        # about. It also cannot go stale between reading the status and pressing the
        # button, the way a resolved branch name could.
        try:
            with wx.BusyCursor():
                AgentClient().start_merge(project["path"], "@{u}")
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        wx.MessageBox(
            "Prism has opened the merge in your browser.\n\n"
            "Nothing changes on disk until you finish it there.",
            "Prism",
            wx.OK | wx.ICON_INFORMATION,
        )

    def _pull(self):
        """Fast-forward the working tree. The agent refuses anything riskier."""
        project = (self.data or {}).get("project")
        if not project:
            return

        git = (self.data or {}).get("git") or {}

        # Uncommitted work blocks a pull. Rather than refusing and leaving the user to go
        # and fix it by hand, offer to put it aside, and ask what to call it: a stash you
        # cannot identify is a stash you will never restore.
        #
        # Gated on `dirty`, not `dirty_by_you`: git blocks on a lock file as readily as
        # on a board, so this has to fire whenever git would refuse. But the wording says
        # how many are actually the user's, because "you have uncommitted changes" about
        # a regenerated cache is crying wolf.
        stash_message = None
        if git.get("dirty"):
            yours = len(git.get("yours") or [])
            what = (
                "You have %d uncommitted file(s)." % yours
                if yours
                else "Some generated files are in the way."
            )
            stash_message = self._ask_stash_message(
                "%s The pull can't run until they're out of the way.\n\n"
                "Prism can set them aside and bring them back afterwards." % what
            )
            if stash_message is None:
                return  # they said no

        try:
            with wx.BusyCursor():
                result = AgentClient().pull(project["path"], stash_message)
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return

        note = result.get("message", "Done.")
        stashed = result.get("stashed")
        if stashed:
            # Tell them where their work went, and that getting it back is one click.
            # Work that vanishes with no explanation is work the user thinks they lost.
            note += (
                "\n\nYour changes are stashed as “%s”. Use Apply to "
                "bring them back." % stashed["message"]
            )

        # The board on disk has changed under KiCad, which will not know. Saying so is
        # the difference between a confusing stale view and an understood one.
        wx.MessageBox(
            "%s\n\nReopen the board in KiCad to see the updated version." % note,
            "Prism",
            wx.OK | wx.ICON_INFORMATION,
        )
        self._load()

    def _ask_stash_message(self, why):
        """Confirm a stash, and get a name for it. None if the user declines.

        The message is the point. Git's own default is "WIP on main: a1b2c3d", which says
        nothing about what is in it, and after two of them nobody knows which board they
        were half way through editing.
        """
        dlg = wx.TextEntryDialog(
            self,
            why + "\n\nWhat were you working on?",
            "Set changes aside",
            value="",
        )
        try:
            if dlg.ShowModal() != wx.ID_OK:
                return None
            return dlg.GetValue().strip()
        finally:
            dlg.Destroy()

    def _add_commit_row(self, card, commit_hash, subject, prism, label="Last commit"):
        """The commit you are on: SHA in a tag, subject beside it, the pair a link into
        Prism.

        Only a link when Prism actually knows the project. A link that lands on a 404 is
        worse than plain text.
        """
        row = wx.BoxSizer(wx.HORIZONTAL)
        row.Add(card.label(label, tone="muted_fg"), 0, wx.ALIGN_CENTER_VERTICAL)
        row.AddStretchSpacer()

        sha = Badge(card, commit_hash, self.pal, tone="muted")
        row.Add(sha, 0, wx.ALIGN_CENTER_VERTICAL)

        if subject:
            if prism:
                text = wx.adv.HyperlinkCtrl(card, label=subject, url="")
                text.SetNormalColour(_c(self.pal["foreground"]))
                text.SetHoverColour(_c(self.pal["primary"]))
                text.SetVisitedColour(_c(self.pal["foreground"]))
                text.SetBackgroundColour(_c(self.pal["card"]))
                text.SetToolTip("Open this commit in Prism")
                text.Bind(
                    wx.adv.EVT_HYPERLINK,
                    lambda _e, h=commit_hash, p=prism: self._open_commit(p, h),
                )
                # The tag is part of the link: clicking the SHA is the obvious gesture,
                # and having it do nothing would be a small betrayal.
                sha.SetToolTip("Open this commit in Prism")
                sha.SetCursor(wx.Cursor(wx.CURSOR_HAND))
                sha.Bind(
                    wx.EVT_LEFT_UP,
                    lambda _e, h=commit_hash, p=prism: self._open_commit(p, h),
                )
            else:
                text = card.label(subject)

            f = text.GetFont()
            f.SetPointSize(th.FONT_SMALL)
            text.SetFont(f)
            row.Add(text, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, th.SP_SM)

        card.body.Add(row, 0, wx.EXPAND | wx.BOTTOM, th.SP_XS + 2)

    def _open_commit(self, prism, commit_hash):
        """Open this commit on the project's page in Prism."""
        try:
            AgentClient().open_in_prism(prism.get("id"), commit=commit_hash)
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)

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

        if self.changes is _CHANGES_LOADING:
            # The diff is still being computed in the background; the rest of the
            # dialog is already up. Say so rather than looking empty or broken.
            card.row("Uncommitted changes", "Computing…", tone="muted_fg")
            self.content.Add(card, 0, wx.EXPAND)
            return

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

        # A commit box, when there is design work to commit. KiCad's churn alone is not
        # worth a commit prompt, that is what the .gitignore card is for.
        if design:
            self._add_commit_box(card)

        self.content.Add(card, 0, wx.EXPAND)

    def _add_commit_box(self, card):
        """A message field and a Commit button beneath the uncommitted changes.

        Commits everything git sees as changed (the same set the list shows), which is the
        common case; per-file staging can come later. A detached HEAD is handled by the
        agent, which refuses and tells the user to make a branch first, surfaced here as a
        prompt to create one.
        """
        card.body.Add(
            card.label("Commit message", tone="muted_fg", small=True),
            0,
            wx.LEFT | wx.TOP,
            th.SP_SM,
        )
        self.commit_message = wx.TextCtrl(card, value="", size=wx.Size(-1, 28))
        self.commit_message.SetBackgroundColour(_c(self.pal["muted"]))
        self.commit_message.SetForegroundColour(_c(self.pal["foreground"]))
        card.body.Add(self.commit_message, 0, wx.EXPAND | wx.LEFT | wx.RIGHT, th.SP_SM)
        card.body.Add(
            Button(card, "Commit", self.pal, variant="primary", on_click=self._commit),
            0,
            wx.LEFT | wx.TOP | wx.BOTTOM,
            th.SP_SM,
        )

    def _commit(self):
        """Commit the working changes. Handle the detached-HEAD case by offering a branch.

        The agent refuses a detached commit; rather than dead-end the user, we offer to
        create a branch here (git's own remedy) and then commit onto it.
        """
        project = (self.data or {}).get("project")
        if not project or not project.get("repo_root"):
            return
        message = self.commit_message.GetValue().strip()
        if not message:
            wx.MessageBox("A commit needs a message.", "Prism", wx.OK | wx.ICON_WARNING)
            return

        repo = project["repo_root"]
        try:
            with wx.BusyCursor():
                AgentClient().commit(repo, message)
        except AgentUnavailable as exc:
            text = str(exc)
            if "detached" in text.lower():
                self._commit_on_new_branch(repo, message)
                return
            wx.MessageBox(text, "Prism", wx.OK | wx.ICON_WARNING)
            return

        self._load()

    def _commit_on_new_branch(self, repo, message):
        """Offer to name a branch for a commit that would otherwise be detached."""
        name = wx.GetTextFromUser(
            "You're on a detached commit, so this would not be on any branch.\n\n"
            "Name a branch to keep it on:",
            "Create a branch",
            "",
        )
        if not name.strip():
            return
        try:
            with wx.BusyCursor():
                AgentClient().create_branch(repo, name.strip())
                AgentClient().commit(repo, message)
        except AgentUnavailable as exc:
            wx.MessageBox(str(exc), "Prism", wx.OK | wx.ICON_WARNING)
            return
        self._load()

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
        except Exception as exc:
            # A raw pcbnew/SWIG error here would otherwise crash the plugin and
            # can take KiCad down with it. Cross-probe is a convenience; a failed
            # jump must never be fatal. Report it and stay open.
            wx.MessageBox(
                "Couldn't jump to that item in KiCad.\n\n%s" % exc,
                "Prism",
                wx.OK | wx.ICON_INFORMATION,
            )
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

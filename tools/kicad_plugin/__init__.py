"""KiCad-Prism plugin: registers the pcbnew toolbar action.

KiCad imports this package from its plugin directory and calls register() on any
ActionPlugin it finds. The plugin itself is a thin UI, all the real work (git,
project lookup, backend calls) lives in the tray agent, which runs whether or not
KiCad is open. See tools/README.md.
"""

from __future__ import annotations

import os
import sys

import pcbnew
import wx


def is_dev_install() -> bool:
    """Are we the symlinked working copy, or a real installed package?

    A dev checkout has the repo's siblings next to it (build_agent.py, the agent
    source); a PCM install is just the plugin's own files plus the agent binary.

    This matters because a developer wants BOTH at once: a symlink to iterate on,
    and a real install to verify what users actually get. Without telling them
    apart, two identically-named plugins appear in the menu and you have no idea
    which one you just clicked, and the symlinked one has no bundled binary, so it
    quietly exercises the source fallback instead of the thing under test.
    """
    tools = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    return os.path.isfile(os.path.join(tools, "build_agent.py"))


class _Modules:
    """The plugin's own modules, resolved at Run() time rather than import time."""

    def __init__(self):
        from . import dialog, first_run, prism_theme

        self.dialog = dialog
        self.first_run = first_run
        self.prism_theme = prism_theme


def _reload_for_dev() -> "_Modules":
    """In a dev checkout, re-import the plugin's modules on every run.

    KiCad imports a plugin ONCE, when it starts, and keeps it in sys.modules for the
    rest of the session. So editing the source and clicking the toolbar button runs the
    *old* code, and the failure is baffling, because the file on disk plainly says
    otherwise. It bites hardest when the agent has moved on and the stale dialog reads a
    field the new agent no longer returns: a KeyError, and the dialog just won't open.

    Reloading here means edit, click, see the change, no KiCad restart. Only in a dev
    checkout: an installed plugin's files don't change under it, so reloading would be
    pure overhead and one more thing to go wrong.
    """
    modules = _Modules()
    if not is_dev_install():
        return modules

    import importlib

    # Depth-first: reload leaves before the modules that import them, or a parent gets
    # rebound to a stale child.
    for name in (
        "prism_theme",
        "widgets",
        "agent_client",
        "agent_launcher",
        "version",
        "crossprobe",
        "settings_dialog",
        "first_run",
        "dialog",
    ):
        module = sys.modules.get(f"{__name__}.{name}")
        if module is not None:
            try:
                importlib.reload(module)
            except Exception:
                # A syntax error mid-edit shouldn't wedge the plugin permanently,
                # keep the last good module and let the user see the real error.
                pass

    return _Modules()


class PrismPlugin(pcbnew.ActionPlugin):
    def defaults(self):
        dev = is_dev_install()
        # Label the working copy so it can't be mistaken for the installed one.
        self.name = "Prism (dev)" if dev else "Prism"
        self.category = "Prism"
        self.description = "Project status and Prism integration" + (
            ", development copy, running from source" if dev else ""
        )
        self.show_toolbar_button = True
        # KiCad wants a PNG next to the plugin; absent, it falls back to a
        # default icon rather than failing, so this is safe either way.
        self.icon_file_name = os.path.join(os.path.dirname(__file__), "icon.png")
        self.dark_icon_file_name = self.icon_file_name

    def Run(self):
        modules = _reload_for_dev()

        board = pcbnew.GetBoard()
        # The board's own filename is the most reliable way to locate the project
        # on disk, more so than any notion of a "current project" in the API.
        board_path = board.GetFileName() if board else ""

        parent = wx.FindWindowByName("PcbFrame") or wx.GetActiveWindow()
        pal = modules.prism_theme.palette(
            dark=wx.SystemSettings.GetAppearance().IsDark()
        )

        # First time in: start the agent and offer the OS-level integrations, each
        # declinable. Only once, the answer lives in the agent's settings, so it
        # survives a plugin reinstall.
        if modules.first_run.needed():
            setup = modules.first_run.FirstRunDialog(parent, pal)
            try:
                setup.ShowModal()
            finally:
                setup.Destroy()

        dialog = modules.dialog.PrismDialog(parent, board_path)
        try:
            dialog.ShowModal()
        finally:
            dialog.Destroy()


PrismPlugin().register()

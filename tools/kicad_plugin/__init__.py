"""KiCad-Prism plugin: registers the pcbnew toolbar action.

KiCad imports this package from its plugin directory and calls register() on any
ActionPlugin it finds. The plugin itself is a thin UI — all the real work (git,
project lookup, backend calls) lives in the tray agent, which runs whether or not
KiCad is open. See tools/README.md.
"""

from __future__ import annotations

import os

import pcbnew
import wx

from . import first_run
from . import prism_theme
from .dialog import PrismDialog


def is_dev_install() -> bool:
    """Are we the symlinked working copy, or a real installed package?

    A dev checkout has the repo's siblings next to it (build_agent.py, the agent
    source); a PCM install is just the plugin's own files plus the agent binary.

    This matters because a developer wants BOTH at once: a symlink to iterate on,
    and a real install to verify what users actually get. Without telling them
    apart, two identically-named plugins appear in the menu and you have no idea
    which one you just clicked — and the symlinked one has no bundled binary, so it
    quietly exercises the source fallback instead of the thing under test.
    """
    tools = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    return os.path.isfile(os.path.join(tools, "build_agent.py"))


class PrismPlugin(pcbnew.ActionPlugin):
    def defaults(self):
        dev = is_dev_install()
        # Label the working copy so it can't be mistaken for the installed one.
        self.name = "Prism (dev)" if dev else "Prism"
        self.category = "Prism"
        self.description = "Project status and Prism integration" + (
            " — development copy, running from source" if dev else ""
        )
        self.show_toolbar_button = True
        # KiCad wants a PNG next to the plugin; absent, it falls back to a
        # default icon rather than failing, so this is safe either way.
        self.icon_file_name = os.path.join(os.path.dirname(__file__), "icon.png")
        self.dark_icon_file_name = self.icon_file_name

    def Run(self):
        board = pcbnew.GetBoard()
        # The board's own filename is the most reliable way to locate the project
        # on disk — more so than any notion of a "current project" in the API.
        board_path = board.GetFileName() if board else ""

        parent = wx.FindWindowByName("PcbFrame") or wx.GetActiveWindow()
        pal = prism_theme.palette(dark=wx.SystemSettings.GetAppearance().IsDark())

        # First time in: start the agent and offer the OS-level integrations, each
        # declinable. Only once — the answer lives in the agent's settings, so it
        # survives a plugin reinstall.
        if first_run.needed():
            setup = first_run.FirstRunDialog(parent, pal)
            try:
                setup.ShowModal()
            finally:
                setup.Destroy()

        dialog = PrismDialog(parent, board_path)
        try:
            dialog.ShowModal()
        finally:
            dialog.Destroy()


PrismPlugin().register()

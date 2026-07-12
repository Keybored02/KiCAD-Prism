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

from .dialog import PrismDialog


class PrismPlugin(pcbnew.ActionPlugin):
    def defaults(self):
        self.name = "Prism"
        self.category = "Prism"
        self.description = "Project status and Prism integration"
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
        dialog = PrismDialog(parent, board_path)
        try:
            dialog.ShowModal()
        finally:
            dialog.Destroy()


PrismPlugin().register()

"""Which KiCad install Prism picks on Windows when several are side by side."""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from app.services import kicad_tools


class WindowsInstallOrderTests(unittest.TestCase):
    def candidates(self, *folders: str) -> list[str]:
        with tempfile.TemporaryDirectory() as program_files:
            for folder in folders:
                (Path(program_files) / "KiCad" / folder).mkdir(parents=True)
            with mock.patch.object(kicad_tools.platform, "system", return_value="Windows"), mock.patch.dict(
                os.environ, {"ProgramFiles": program_files}
            ):
                found = kicad_tools.kicad_cli_install_candidates()
            return [Path(path).parent.parent.name for path in found]

    def test_the_newest_install_comes_first_by_number_not_by_text(self) -> None:
        # As text "8.0" sorts above "10.0", which picked a KiCad that cannot open a v10 board.
        self.assertEqual(self.candidates("8.0", "10.0", "9.0"), ["10.0", "9.0", "8.0"])

    def test_a_minor_version_is_compared_too(self) -> None:
        self.assertEqual(self.candidates("9.0", "10.1", "10.0", "10.10"), ["10.10", "10.1", "10.0", "9.0"])

    def test_a_folder_that_is_not_a_version_goes_last(self) -> None:
        self.assertEqual(self.candidates("8.0", "nightly", "10.0"), ["10.0", "8.0", "nightly"])

    def test_no_install_folder(self) -> None:
        with tempfile.TemporaryDirectory() as program_files, mock.patch.object(
            kicad_tools.platform, "system", return_value="Windows"
        ), mock.patch.dict(os.environ, {"ProgramFiles": program_files}):
            self.assertEqual(kicad_tools.kicad_cli_install_candidates(), ())


if __name__ == "__main__":
    unittest.main()

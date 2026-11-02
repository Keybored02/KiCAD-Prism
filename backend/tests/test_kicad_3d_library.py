"""The runtime fetch of KiCad's stock 3D models binds the model variables once the clone is marked ready."""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from app.services import kicad_3d_library


class BindEnvironmentTests(unittest.TestCase):
    def test_binds_both_variables(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, mock.patch.dict(os.environ, {}, clear=False):
            for name in kicad_3d_library.VARIABLES:
                os.environ.pop(name, None)
            bound = kicad_3d_library.bind_environment(Path(tmp))
            self.assertEqual(bound, list(kicad_3d_library.VARIABLES))
            self.assertEqual(os.environ["KICAD10_3DMODEL_DIR"], tmp)

    def test_operator_value_is_kept(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, mock.patch.dict(
            os.environ, {"KICAD10_3DMODEL_DIR": "/mine"}
        ):
            os.environ.pop("KICAD9_3DMODEL_DIR", None)
            kicad_3d_library.bind_environment(Path(tmp))
            self.assertEqual(os.environ["KICAD10_3DMODEL_DIR"], "/mine")
            self.assertEqual(os.environ["KICAD9_3DMODEL_DIR"], tmp)

    def test_ready_needs_the_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            self.assertFalse(kicad_3d_library.is_ready(Path(tmp)))
            (Path(tmp) / ".prism-ready").write_text("10.0.4\n")
            self.assertTrue(kicad_3d_library.is_ready(Path(tmp)))

    def test_disabled_starts_nothing(self) -> None:
        with mock.patch.object(kicad_3d_library.settings, "KICAD_3D_LIBRARY_ENABLED", False):
            self.assertIsNone(kicad_3d_library.start_in_background())


if __name__ == "__main__":
    unittest.main()

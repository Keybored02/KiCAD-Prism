"""KiCad path libraries: configuration, priority over the environment, readiness and the fetch lock."""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from app.release_studio.documents import render_cache
from app.services import kicad_libraries as libs
from app.services import kicad_tools
from app.services.design_bundle import stage_models


def configure(root: Path, **overrides: object):
    values = {
        "KICAD_PROJECTS_ROOT": str(root),
        "KICAD_3D_LIBRARY_ENABLED": False,
        "KICAD_3D_LIBRARY_DIR": "",
        "KICAD_3D_LIBRARY_REF": "10.0.4",
        "PRISM_KICAD_LIBRARIES": "",
        **overrides,
    }
    return mock.patch.multiple(libs.settings, **values)


def declare(*entries: object) -> str:
    return json.dumps(list(entries))


class TempRoot(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.addCleanup(self._tmp.cleanup)


class ConfigurationTests(TempRoot):
    def test_nothing_declared(self) -> None:
        with configure(self.root):
            self.assertEqual(libs.configured(), ((), []))
            self.assertEqual(libs.resolve().variables, {})

    def test_preset_binds_both_stock_variables(self) -> None:
        with configure(self.root, KICAD_3D_LIBRARY_ENABLED=True):
            (library,), problems = libs.configured()
            self.assertEqual(problems, [])
            self.assertEqual(library.variables, libs.STOCK_VARIABLES)
            self.assertEqual(library.source, f"{libs.STOCK_REPOSITORY}@10.0.4#")
            self.assertEqual(library.clone_dir, self.root / ".kicad-prism" / "libraries" / "kicad-packages3d")

    def test_preset_dir_override(self) -> None:
        with configure(self.root, KICAD_3D_LIBRARY_ENABLED=True, KICAD_3D_LIBRARY_DIR=str(self.root / "x")):
            (library,), _ = libs.configured()
            self.assertEqual(library.clone_dir, self.root / "x")

    def test_bad_entries_are_reported_and_left_out(self) -> None:
        raw = declare(
            {"name": "ok", "variables": ["LSF"], "path": str(self.root)},
            {"name": "no source", "variables": ["A"]},
            {"name": "both", "variables": ["B"], "git": "u", "ref": "r", "path": "p"},
            {"name": "novar", "variables": [], "path": "p"},
            {"name": "badvar", "variables": ["1X"], "path": "p"},
            {"name": "noref", "variables": ["C"], "git": "u"},
            {"name": "escape", "variables": ["D"], "git": "u", "ref": "r", "subdir": "../x"},
            "text",
        )
        with configure(self.root, PRISM_KICAD_LIBRARIES=raw):
            libraries, problems = libs.configured()
        self.assertEqual([library.name for library in libraries], ["ok"])
        self.assertEqual(len(problems), 7)

    def test_not_json(self) -> None:
        with configure(self.root, PRISM_KICAD_LIBRARIES="{nope"):
            libraries, problems = libs.configured()
        self.assertEqual(libraries, ())
        self.assertIn("not a JSON list", problems[0])

    def test_duplicate_name_and_claimed_variable(self) -> None:
        raw = declare(
            {"name": "a", "variables": ["X"], "path": "/a"},
            {"name": "a", "variables": ["Y"], "path": "/b"},
            {"name": "b", "variables": ["X"], "path": "/c"},
        )
        with configure(self.root, PRISM_KICAD_LIBRARIES=raw):
            libraries, problems = libs.configured()
        self.assertEqual([library.name for library in libraries], ["a"])
        self.assertEqual(len(problems), 2)

    def test_declared_library_cannot_rebind_a_preset_variable(self) -> None:
        raw = declare({"name": "mine", "variables": ["KICAD10_3DMODEL_DIR"], "path": "/m"})
        with configure(self.root, KICAD_3D_LIBRARY_ENABLED=True, PRISM_KICAD_LIBRARIES=raw):
            libraries, problems = libs.configured()
        self.assertEqual([library.name for library in libraries], [libs.STOCK_NAME])
        self.assertEqual(len(problems), 1)


class ResolutionTests(TempRoot):
    def git_library(self, **extra: str) -> str:
        entry = {"name": "lsf", "variables": ["LSF_KICAD_LIB"], "git": "https://example/lsf.git", "ref": "v1"}
        return declare({**entry, **extra})

    def mark_ready(self, library: libs.Library) -> None:
        library.clone_dir.mkdir(parents=True, exist_ok=True)
        (library.clone_dir / ".prism-ready").write_text(library.source + "\n")

    def test_git_library_binds_only_when_marked_ready(self) -> None:
        with configure(self.root, PRISM_KICAD_LIBRARIES=self.git_library()):
            (library,), _ = libs.configured()
            self.assertEqual(libs.resolve().variables, {})
            self.mark_ready(library)
            resolution = libs.resolve()
            self.assertEqual(resolution.variables, {"LSF_KICAD_LIB": str(library.clone_dir)})
            self.assertEqual(resolution.fingerprints, {"LSF_KICAD_LIB": "https://example/lsf.git@v1#"})

    def test_changed_ref_is_no_longer_ready(self) -> None:
        with configure(self.root, PRISM_KICAD_LIBRARIES=self.git_library()):
            (library,), _ = libs.configured()
            self.mark_ready(library)
        with configure(self.root, PRISM_KICAD_LIBRARIES=self.git_library(ref="v2")):
            self.assertEqual(libs.resolve().variables, {})

    def test_subdir_is_the_bound_folder(self) -> None:
        with configure(self.root, PRISM_KICAD_LIBRARIES=self.git_library(subdir="lib/models")):
            (library,), _ = libs.configured()
            self.mark_ready(library)
            bound = libs.resolve().variables["LSF_KICAD_LIB"]
            self.assertEqual(Path(bound), library.clone_dir / "lib" / "models")

    def test_path_library_needs_the_folder(self) -> None:
        mounted = self.root / "mounted"
        raw = declare({"name": "m", "variables": ["M_LIB"], "path": str(mounted)})
        with configure(self.root, PRISM_KICAD_LIBRARIES=raw):
            self.assertEqual(libs.resolve().variables, {})
            mounted.mkdir()
            self.assertEqual(libs.resolve().variables, {"M_LIB": str(mounted)})

    def test_declared_library_wins_over_the_environment(self) -> None:
        mounted = self.root / "mounted"
        mounted.mkdir()
        raw = declare({"name": "m", "variables": ["M_LIB"], "path": str(mounted)})
        with configure(self.root, PRISM_KICAD_LIBRARIES=raw):
            env = libs.environment({"M_LIB": "/image/default", "OTHER": "1"})
        self.assertEqual(env, {"M_LIB": str(mounted), "OTHER": "1"})

    def test_unready_library_leaves_the_environment_alone(self) -> None:
        raw = declare({"name": "m", "variables": ["M_LIB"], "path": str(self.root / "absent")})
        with configure(self.root, PRISM_KICAD_LIBRARIES=raw):
            self.assertEqual(libs.environment({"M_LIB": "/image/default"}), {"M_LIB": "/image/default"})

    def test_environment_defaults_to_the_process(self) -> None:
        with configure(self.root), mock.patch.dict(os.environ, {"PROBE_VAR": "1"}):
            self.assertEqual(libs.environment()["PROBE_VAR"], "1")


class FetchTests(TempRoot):
    def test_lock_is_exclusive_and_goes_stale(self) -> None:
        lock = self.root / "lib.lock"
        self.assertTrue(libs._try_lock(lock))
        self.assertFalse(libs._try_lock(lock))
        old = lock.stat().st_mtime - libs._STALE_LOCK_SECONDS - 1
        os.utime(lock, (old, old))
        self.assertFalse(libs._try_lock(lock))  # reclaims the stale lock
        self.assertTrue(libs._try_lock(lock))  # so the next try wins

    def test_nothing_to_fetch_starts_no_thread(self) -> None:
        raw = declare({"name": "m", "variables": ["M_LIB"], "path": str(self.root)})
        with configure(self.root, PRISM_KICAD_LIBRARIES=raw):
            self.assertIsNone(libs.start_in_background())

    def test_startup_reports_configuration_problems(self) -> None:
        with configure(self.root, PRISM_KICAD_LIBRARIES="{nope"), self.assertLogs(libs.logger, "WARNING") as logged:
            libs.start_in_background()
        self.assertIn("not a JSON list", logged.output[0])


class ConsumerTests(TempRoot):
    """Every KiCad process takes its variables from the resolver."""

    def mounted(self, name: str = "LSF_KICAD_LIB") -> str:
        folder = self.root / "mounted"
        folder.mkdir(exist_ok=True)
        return declare({"name": "m", "variables": [name], "path": str(folder)})

    def test_a_tool_child_sees_the_library_over_the_environment(self) -> None:
        tool = kicad_tools.LocalTool("probe", lambda: sys.executable, isolate=False)
        code = "import os; print(os.environ.get('LSF_KICAD_LIB'))"
        with configure(self.root, PRISM_KICAD_LIBRARIES=self.mounted()), mock.patch.dict(
            os.environ, {"LSF_KICAD_LIB": "/image/default"}
        ):
            result = tool.run(["-c", code], timeout=30)
        self.assertEqual(result.stdout.strip(), str(self.root / "mounted"))

    def test_a_caller_env_still_overrides(self) -> None:
        tool = kicad_tools.LocalTool("probe", lambda: sys.executable, isolate=False)
        code = "import os; print(os.environ.get('LSF_KICAD_LIB'))"
        with configure(self.root, PRISM_KICAD_LIBRARIES=self.mounted()):
            result = tool.run(["-c", code], timeout=30, env={"LSF_KICAD_LIB": "/explicit"})
        self.assertEqual(result.stdout.strip(), "/explicit")

    def test_hlr_args_pass_a_third_party_variable(self) -> None:
        with configure(self.root, PRISM_KICAD_LIBRARIES=self.mounted()), mock.patch.object(
            stage_models.settings, "GEOMETER_EXECUTABLE", "/opt/geometer/geometer"
        ):
            args = stage_models.hlr_args({"KICAD10_3DMODEL_DIR": "/stock", "HOME": "/root"})
        self.assertEqual(
            args[4:],
            ["--model-dir", "KICAD10_3DMODEL_DIR=/stock", "--model-dir", f"LSF_KICAD_LIB={self.root / 'mounted'}"],
        )

    def test_hlr_args_prefer_the_declared_library_for_a_stock_variable(self) -> None:
        with configure(self.root, PRISM_KICAD_LIBRARIES=self.mounted("KICAD10_3DMODEL_DIR")), mock.patch.object(
            stage_models.settings, "GEOMETER_EXECUTABLE", "/opt/geometer/geometer"
        ):
            args = stage_models.hlr_args({"KICAD10_3DMODEL_DIR": "/image"})
        self.assertEqual(args[4:], ["--model-dir", f"KICAD10_3DMODEL_DIR={self.root / 'mounted'}"])

    def render_key(self, root: Path, ref: str) -> str:
        """The render cache key with the git library ready under ``root``."""

        board = self.root / "board.kicad_pcb"
        board.write_text("(kicad_pcb)")
        raw = declare({"name": "lsf", "variables": ["LSF_KICAD_LIB"], "git": "https://example/lsf.git", "ref": ref})
        with configure(root, PRISM_KICAD_LIBRARIES=raw):
            (library,), _ = libs.configured()
            library.clone_dir.mkdir(parents=True, exist_ok=True)
            (library.clone_dir / ".prism-ready").write_text(library.source + "\n")
            return render_cache.cache_key(
                board=board, render_args=["pcb", "render"], cli_version="10.0.4", environ={}
            )

    def test_render_key_follows_the_library_not_its_mount_point(self) -> None:
        first = self.render_key(self.root / "one", "v1")
        self.assertEqual(first, self.render_key(self.root / "two", "v1"))
        self.assertNotEqual(first, self.render_key(self.root / "one", "v2"))


if __name__ == "__main__":
    unittest.main()

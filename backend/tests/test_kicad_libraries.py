"""KiCad path libraries: validation, priority over the environment, readiness, the fetch lock and the consumers."""

from __future__ import annotations

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


def configure(root: Path, *rows: object, mount: Path | None = None, **overrides: object):
    """Settings rooted at ``root`` with ``rows`` as the administrator's declared libraries."""

    values = {
        "KICAD_PROJECTS_ROOT": str(root),
        "KICAD_3D_LIBRARY_ENABLED": False,
        "KICAD_3D_LIBRARY_DIR": "",
        "KICAD_3D_LIBRARY_REF": "10.0.4",
        "PRISM_KICAD_LIBRARY_MOUNT_ROOT": str(mount) if mount else "",
        **overrides,
    }
    patches = mock.patch.multiple(libs.settings, **values)
    rows_patch = mock.patch.object(libs, "declared_rows", return_value=list(rows))

    class Both:
        def __enter__(self):
            patches.__enter__()
            rows_patch.__enter__()

        def __exit__(self, *exc):
            rows_patch.__exit__(*exc)
            patches.__exit__(*exc)

    return Both()


def git(name: str = "lsf", variables=("LSF_KICAD_LIB",), ref: str = "v1", **extra: object) -> dict:
    return {"name": name, "variables": list(variables), "git": "https://example/lsf.git", "ref": ref, **extra}


def folder(name: str, variables, path: str) -> dict:
    return {"name": name, "variables": list(variables), "path": path}


class TempRoot(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.addCleanup(self._tmp.cleanup)


class ValidationTests(TempRoot):
    def test_a_git_library(self) -> None:
        library = libs.validate_entry(git(subdir="lib/models/"))
        self.assertEqual((library.git, library.ref, library.subdir), ("https://example/lsf.git", "v1", "lib/models"))

    def test_only_https_urls(self) -> None:
        for url in ("http://example/x.git", "git@example:x.git", "file:///x", "ssh://example/x", ""):
            with self.subTest(url=url), self.assertRaises(ValueError):
                libs.validate_entry({**git(), "git": url})

    def test_a_ref_cannot_be_an_option(self) -> None:
        with self.assertRaises(ValueError):
            libs.validate_entry(git(ref="--upload-pack=x"))

    def test_a_path_is_relative_to_the_mount_root(self) -> None:
        self.assertEqual(libs.validate_entry(folder("m", ["M"], "lsf/lib/")).path, "lsf/lib")
        for path in ("/abs", "../up", "a/../b", "C:/x", "C:\\x", " "):
            with self.subTest(path=path), self.assertRaises(ValueError):
                libs.validate_entry(folder("m", ["M"], path))

    def test_the_other_fields(self) -> None:
        bad = (
            {"name": "no source", "variables": ["A"]},
            {**git(), "path": "p"},
            {**git(), "variables": []},
            {**git(), "variables": ["1X"]},
            {**git(), "variables": ["A", "A"]},
            {**git(), "name": "bad name"},
            {**git(), "name": ""},
            {**git(), "subdir": "../x"},
            {**git(), "ref": ""},
            "text",
        )
        for raw in bad:
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                libs.validate_entry(raw)


class ConfigurationTests(TempRoot):
    def test_nothing_declared(self) -> None:
        with configure(self.root):
            self.assertEqual(libs.configured(), ((), []))
            self.assertEqual(libs.resolve().variables, {})

    def test_preset_binds_both_stock_variables_and_is_locked(self) -> None:
        with configure(self.root, KICAD_3D_LIBRARY_ENABLED=True):
            (library,), problems = libs.configured()
            self.assertEqual(problems, [])
            self.assertTrue(library.locked)
            self.assertEqual(library.variables, libs.STOCK_VARIABLES)
            self.assertEqual(library.source, f"{libs.STOCK_REPOSITORY}@10.0.4#")
            self.assertEqual(library.clone_dir, self.root / ".kicad-prism" / "libraries" / "kicad-packages3d")

    def test_preset_dir_override(self) -> None:
        with configure(self.root, KICAD_3D_LIBRARY_ENABLED=True, KICAD_3D_LIBRARY_DIR=str(self.root / "x")):
            (library,), _ = libs.configured()
            self.assertEqual(library.clone_dir, self.root / "x")

    def test_a_bad_row_is_reported_and_left_out(self) -> None:
        with configure(self.root, git(), {"name": "broken", "variables": []}):
            libraries, problems = libs.configured()
        self.assertEqual([library.name for library in libraries], ["lsf"])
        self.assertEqual(len(problems), 1)
        self.assertIn("broken", problems[0])

    def test_duplicate_name_and_claimed_variable(self) -> None:
        rows = (
            folder("a", ["X"], "a"),
            folder("a", ["Y"], "b"),
            folder("b", ["X"], "c"),
        )
        with configure(self.root, *rows):
            libraries, problems = libs.configured()
        self.assertEqual([library.name for library in libraries], ["a"])
        self.assertEqual(len(problems), 2)

    def test_a_declared_library_cannot_rebind_a_preset_variable(self) -> None:
        with configure(self.root, folder("mine", ["KICAD10_3DMODEL_DIR"], "m"), KICAD_3D_LIBRARY_ENABLED=True):
            libraries, problems = libs.configured()
        self.assertEqual([library.name for library in libraries], [libs.STOCK_NAME])
        self.assertEqual(len(problems), 1)


class RowsCacheTests(unittest.TestCase):
    def setUp(self) -> None:
        libs.forget_rows()
        self.addCleanup(libs.forget_rows)

    def test_rows_are_cached_then_read_again_after_forgetting(self) -> None:
        with mock.patch("app.services.kicad_library_store.declared", return_value=[git()]) as read:
            self.assertEqual(libs.declared_rows(), [git()])
            libs.declared_rows()
            self.assertEqual(read.call_count, 1)
            libs.forget_rows()
            libs.declared_rows()
            self.assertEqual(read.call_count, 2)

    def test_an_unreachable_database_keeps_the_last_rows(self) -> None:
        with mock.patch("app.services.kicad_library_store.declared", return_value=[git()]):
            libs.declared_rows()
        libs.forget_rows()
        with mock.patch("app.services.kicad_library_store.declared", side_effect=OSError("down")):
            self.assertEqual(libs.declared_rows(), [])  # nothing was ever read after forgetting
        with mock.patch("app.services.kicad_library_store.declared", return_value=[git()]):
            libs._rows_cache = None
            libs.declared_rows()
        with mock.patch.object(libs, "_ROWS_TTL_SECONDS", 0), mock.patch(
            "app.services.kicad_library_store.declared", side_effect=OSError("down")
        ), self.assertLogs(libs.logger, "WARNING"):
            self.assertEqual(libs.declared_rows(), [git()])


class ResolutionTests(TempRoot):
    def mark_ready(self, library: libs.Library) -> None:
        library.clone_dir.mkdir(parents=True, exist_ok=True)
        (library.clone_dir / ".prism-ready").write_text(library.source + "\n")

    def test_git_library_binds_only_when_marked_ready(self) -> None:
        with configure(self.root, git()):
            (library,), _ = libs.configured()
            self.assertEqual(libs.resolve().variables, {})
            self.mark_ready(library)
            resolution = libs.resolve()
            self.assertEqual(resolution.variables, {"LSF_KICAD_LIB": str(library.clone_dir)})
            self.assertEqual(resolution.fingerprints, {"LSF_KICAD_LIB": "https://example/lsf.git@v1#"})

    def test_ready_since_is_the_newest_marker_of_a_git_library(self) -> None:
        with configure(self.root, git(), git("other", ("OTHER_LIB",))):
            first, second = libs.configured()[0]
            self.assertEqual(libs.ready_since(), 0.0)
            self.mark_ready(first)
            self.mark_ready(second)
            os.utime(first.clone_dir / ".prism-ready", (1000, 1000))
            os.utime(second.clone_dir / ".prism-ready", (2000, 2000))
            self.assertEqual(libs.ready_since(), 2000)

    def test_ready_since_ignores_path_libraries(self) -> None:
        mount = self.root / "mnt"
        (mount / "lsf").mkdir(parents=True)
        with configure(self.root, folder("m", ["M_LIB"], "lsf"), mount=mount):
            self.assertEqual(libs.ready_since(), 0.0)

    def test_changed_ref_is_no_longer_ready(self) -> None:
        with configure(self.root, git()):
            (library,), _ = libs.configured()
            self.mark_ready(library)
        with configure(self.root, git(ref="v2")):
            self.assertEqual(libs.resolve().variables, {})

    def test_subdir_is_the_bound_folder(self) -> None:
        with configure(self.root, git(subdir="lib/models")):
            (library,), _ = libs.configured()
            self.mark_ready(library)
            bound = libs.resolve().variables["LSF_KICAD_LIB"]
            self.assertEqual(Path(bound), library.clone_dir / "lib" / "models")

    def test_path_library_needs_the_mount_root_and_the_folder(self) -> None:
        mount = self.root / "mnt"
        row = folder("m", ["M_LIB"], "lsf")
        with configure(self.root, row):  # no mount root configured
            (self.root / "lsf").mkdir()
            self.assertEqual(libs.resolve().variables, {})
        with configure(self.root, row, mount=mount):
            self.assertEqual(libs.resolve().variables, {})
            (mount / "lsf").mkdir(parents=True)
            self.assertEqual(libs.resolve().variables, {"M_LIB": str(mount / "lsf")})
            self.assertEqual(libs.resolve().fingerprints, {"M_LIB": "path:lsf"})

    def test_declared_library_wins_over_the_environment(self) -> None:
        mount = self.root / "mnt"
        (mount / "lsf").mkdir(parents=True)
        with configure(self.root, folder("m", ["M_LIB"], "lsf"), mount=mount):
            env = libs.environment({"M_LIB": "/image/default", "OTHER": "1"})
        self.assertEqual(env, {"M_LIB": str(mount / "lsf"), "OTHER": "1"})

    def test_unready_library_leaves_the_environment_alone(self) -> None:
        with configure(self.root, folder("m", ["M_LIB"], "absent"), mount=self.root / "mnt"):
            self.assertEqual(libs.environment({"M_LIB": "/image/default"}), {"M_LIB": "/image/default"})

    def test_environment_defaults_to_the_process(self) -> None:
        with configure(self.root), mock.patch.dict(os.environ, {"PROBE_VAR": "1"}):
            self.assertEqual(libs.environment()["PROBE_VAR"], "1")


class ConsumerTests(TempRoot):
    """Every KiCad process takes its variables from the resolver."""

    def setUp(self) -> None:
        super().setUp()
        self.mount = self.root / "mnt"
        (self.mount / "lsf").mkdir(parents=True)
        self.bound = str(self.mount / "lsf")

    def row(self, variable: str = "LSF_KICAD_LIB") -> dict:
        return folder("m", [variable], "lsf")

    def probe(self, **kwargs: object) -> str:
        tool = kicad_tools.LocalTool("probe", lambda: sys.executable, isolate=False)
        code = "import os; print(os.environ.get('LSF_KICAD_LIB'))"
        return tool.run(["-c", code], timeout=30, **kwargs).stdout.strip()

    def test_a_tool_child_sees_the_library_over_the_environment(self) -> None:
        with configure(self.root, self.row(), mount=self.mount), mock.patch.dict(
            os.environ, {"LSF_KICAD_LIB": "/image/default"}
        ):
            self.assertEqual(self.probe(), self.bound)

    def test_a_caller_env_still_overrides(self) -> None:
        with configure(self.root, self.row(), mount=self.mount):
            self.assertEqual(self.probe(env={"LSF_KICAD_LIB": "/explicit"}), "/explicit")

    def test_hlr_args_pass_a_third_party_variable(self) -> None:
        with configure(self.root, self.row(), mount=self.mount), mock.patch.object(
            stage_models.settings, "GEOMETER_EXECUTABLE", "/opt/geometer/geometer"
        ):
            args = stage_models.hlr_args({"KICAD10_3DMODEL_DIR": "/stock", "HOME": "/root"})
        self.assertEqual(
            args[4:],
            ["--model-dir", "KICAD10_3DMODEL_DIR=/stock", "--model-dir", f"LSF_KICAD_LIB={self.bound}"],
        )

    def test_hlr_args_prefer_the_declared_library_for_a_stock_variable(self) -> None:
        with configure(self.root, self.row("KICAD10_3DMODEL_DIR"), mount=self.mount), mock.patch.object(
            stage_models.settings, "GEOMETER_EXECUTABLE", "/opt/geometer/geometer"
        ):
            args = stage_models.hlr_args({"KICAD10_3DMODEL_DIR": "/image"})
        self.assertEqual(args[4:], ["--model-dir", f"KICAD10_3DMODEL_DIR={self.bound}"])

    def render_key(self, root: Path, ref: str) -> str:
        """The render cache key with the git library ready under ``root``."""

        board = self.root / "board.kicad_pcb"
        board.write_text("(kicad_pcb)")
        with configure(root, git(ref=ref)):
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

"""Projects that live inside a submodule are found during import analysis."""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from git import Repo

from app.services import git_checkout_service as service
from app.services import project_import_service as importer
from tests.test_git_checkout_service import git, make_repo

_REAL_HARDENED_ENV = service.hardened_env


def allow_file(base: dict) -> dict:
    env = _REAL_HARDENED_ENV(base)
    index = int(env["GIT_CONFIG_COUNT"])
    env[f"GIT_CONFIG_KEY_{index}"] = "protocol.file.allow"
    env[f"GIT_CONFIG_VALUE_{index}"] = "always"
    env["GIT_CONFIG_COUNT"] = str(index + 1)
    return env


class DiscoverSubmoduleProjects(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        root = Path(self._tmp.name)
        self.board = make_repo(
            root / "board", {"Main/Main.kicad_pro": "{}", "Main/Main.kicad_pcb": "", "Main/Main.kicad_sch": ""}
        )
        self.library = make_repo(root / "library", {"a.kicad_sym": "sym"})
        self.parent = make_repo(root / "parent", {"README.md": "hi"})
        git(self.parent, "submodule", "add", "-q", str(self.board), "hw/board")
        git(self.parent, "submodule", "add", "-q", str(self.library), "libs/library")
        git(self.parent, "commit", "-q", "-m", "submodules")
        self.analysis = Repo.clone_from(
            str(self.parent), str(root / "analysis"), no_checkout=True, env=allow_file(dict(os.environ))
        )
        self.context = mock.Mock()
        for patcher in (
            mock.patch.object(service, "hardened_env", allow_file),
            mock.patch.object(service, "parse_remote_url", lambda url, policy=None: url),
            mock.patch.object(importer.settings, "PRISM_GIT_SUBMODULE_MAX", 20),
        ):
            patcher.start()
            self.addCleanup(patcher.stop)
        self.env = allow_file(dict(os.environ))

    def discover(self):
        return importer._discover_submodule_projects(
            self.context, self.analysis, "", env=self.env, stage="clone-metadata"
        )

    def test_finds_board_in_submodule_and_reports_library_as_empty(self) -> None:
        projects, records = self.discover()
        self.assertEqual(len(projects), 1)
        project = projects[0]
        self.assertEqual(project.name, "Main")
        self.assertEqual(project.relative_path, "hw/board/Main")
        self.assertEqual(project.submodule, "hw/board")
        self.assertEqual(project.project_key, "hw/board/Main::Main.kicad_pro")
        counts = {r["path"]: (r["status"], r["project_count"]) for r in records}
        self.assertEqual(counts, {"hw/board": ("searched", 1), "libs/library": ("searched", 0)})

    def test_limit_of_zero_searches_nothing(self) -> None:
        with mock.patch.object(importer.settings, "PRISM_GIT_SUBMODULE_MAX", 0):
            projects, records = self.discover()
        self.assertEqual(projects, [])
        self.assertTrue(all(r["status"] == "skipped" for r in records))
        self.assertIn("turned off", records[0]["reason"])

    def test_limit_stops_after_n(self) -> None:
        with mock.patch.object(importer.settings, "PRISM_GIT_SUBMODULE_MAX", 1):
            _, records = self.discover()
        self.assertEqual([r["status"] for r in records].count("searched"), 1)

    def test_unreachable_submodule_is_reported(self) -> None:
        with mock.patch.object(service, "fetch_tree_only", side_effect=RuntimeError("no route")):
            projects, records = self.discover()
        self.assertEqual(projects, [])
        self.assertEqual(records[0]["status"], "skipped")
        self.assertIn("no route", records[0]["reason"])

    def test_policy_rejection_is_reported_without_contacting_the_remote(self) -> None:
        with mock.patch.object(service, "vet_submodule", return_value="host not allowed"), \
                mock.patch.object(service, "fetch_tree_only") as fetch:
            projects, records = self.discover()
        fetch.assert_not_called()
        self.assertEqual(records[0]["reason"], "host not allowed")

    def test_repository_without_submodules_is_untouched(self) -> None:
        plain = make_repo(Path(self._tmp.name) / "plain", {"a.txt": "x"})
        repo = Repo(str(plain))
        self.assertEqual(
            importer._discover_submodule_projects(self.context, repo, "", env=self.env, stage="s"),
            ([], []),
        )



if __name__ == "__main__":
    unittest.main()

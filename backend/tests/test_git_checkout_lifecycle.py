"""Submodules and LFS after import: changes upstream, failures and limits.

Each test builds real local repositories. The ``file`` transport, which
production refuses, is allowed by swapping the hardened environment, and URL
policy is bypassed the same way as in the other checkout tests.
"""

from __future__ import annotations

import asyncio
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from fastapi import HTTPException
from git import Repo

from app.services import file_service
from app.services import git_checkout_service as service
from app.services import git_service, project_import_service as importer
from app.services.git_remote_url import RemoteUrlPolicy
from app.services.project_import_plan import PlannedImportProject, ProjectImportPlan
from tests.test_git_checkout_service import OID, POINTER, git, make_repo
from tests.test_submodule_project_discovery import allow_file

POLICY = RemoteUrlPolicy.build()


class Scenario(unittest.TestCase):
    """A parent repository with one submodule, and a clone of it like Prism's."""

    def setUp(self) -> None:
        self.root = Path(tempfile.mkdtemp())
        self.addCleanup(self._remove_root)
        self.library = make_repo(self.root / "library", {"Main/Main.kicad_pcb": "pcb", "a.txt": "a"})
        self.parent = make_repo(self.root / "parent", {"README": "x"})
        git(self.parent, "submodule", "add", "-q", str(self.library), "libs/lib")
        git(self.parent, "commit", "-q", "-m", "add submodule")
        self.checkout = self.root / "checkout"
        git(self.root, "clone", "-q", str(self.parent), str(self.checkout))
        self.env = dict(os.environ)
        for patcher in (
            mock.patch.object(service, "hardened_env", allow_file),
            mock.patch.object(service, "parse_remote_url", lambda url, policy=None: url),
        ):
            patcher.start()
            self.addCleanup(patcher.stop)

    def _remove_root(self) -> None:
        # GitPython keeps repositories open until collected, and Windows will not
        # delete a directory a process still holds.
        import gc
        import shutil

        gc.collect()
        shutil.rmtree(self.root, ignore_errors=True)

    def hydrate(self, **overrides):
        args = dict(parent_url="", env=self.env, policy=POLICY, lfs=service.LfsSettings())
        args.update(overrides)
        return service.hydrate_checkout(self.checkout, **args)

    def upstream_commit(self, message: str = "change") -> None:
        git(self.parent, "add", "-A")
        git(self.parent, "commit", "-q", "-m", message)

    def pull(self) -> None:
        git(self.checkout, "pull", "-q", "--ff-only")


class SyncOnARealRepository(Scenario):
    def run_sync(self, project_path: Path, import_type: str = "multi") -> dict:
        row = {
            "id": "prj_1",
            "repo_id": "repo_1",
            "import_type": import_type,
            "path": str(project_path),
            "parent_repo_path": str(self.checkout),
        }
        with mock.patch.object(importer.workspace, "get_project_by_id", return_value=row), \
                mock.patch.object(importer.workspace, "update_repository_synced"), \
                mock.patch.object(importer, "refresh_project_assets"), \
                mock.patch.object(importer.derived_assets, "purge_legacy_in_tree_thumbnails"), \
                mock.patch.object(importer, "git_env", lambda: dict(os.environ)):
            return importer.sync_project("prj_1")

    def test_a_dirty_submodule_does_not_block_the_parent(self) -> None:
        self.hydrate()
        (self.checkout / "libs/lib/a.txt").write_text("edited locally", encoding="utf-8")
        self.assertTrue(
            Repo(str(self.checkout)).is_dirty(untracked_files=False),
            "precondition: the default dirty check sees the submodule",
        )
        (self.parent / "new.txt").write_text("new", encoding="utf-8")
        self.upstream_commit()
        result = self.run_sync(self.checkout / "libs/lib")
        self.assertEqual(result["status"], "success", result)
        self.assertTrue(result["message"].startswith("Synced"), result["message"])
        self.assertTrue((self.checkout / "new.txt").exists())

    def test_removed_submodule_is_cleaned_and_the_project_is_reported_gone(self) -> None:
        self.hydrate()
        git(self.parent, "rm", "-q", "-f", "libs/lib")
        self.upstream_commit("remove submodule")
        result = self.run_sync(self.checkout / "libs/lib")
        self.assertEqual(result["status"], "success", result)
        self.assertIn("no longer exists", result["message"])
        self.assertFalse((self.checkout / "libs/lib").exists())
        self.assertEqual(result["checkout"]["submodules_removed"], ["libs/lib"])

    def test_the_merge_runs_without_lfs_smudge(self) -> None:
        seen = {}
        real_merge = importer.Repo

        class Spy:
            def __init__(self, path):
                self._repo = real_merge(path)
                self.git = SimpleNamespace(merge=self._merge)

            def _merge(self, *args, **kwargs):
                seen.update(kwargs.get("env") or {})
                return self._repo.git.merge(*args, **kwargs)

            def __getattr__(self, name):
                return getattr(self._repo, name)

        (self.parent / "new.txt").write_text("new", encoding="utf-8")
        self.upstream_commit()
        with mock.patch.object(importer, "Repo", Spy):
            result = self.run_sync(self.checkout, import_type="multi")
        self.assertEqual(result["status"], "success", result)
        self.assertEqual(seen.get("GIT_LFS_SKIP_SMUDGE"), "1")


class SubmoduleLifecycle(Scenario):
    def test_added_after_import_is_picked_up_on_sync(self) -> None:
        other = make_repo(self.root / "other", {"b.txt": "b"})
        git(self.parent, "submodule", "add", "-q", str(other), "libs/other")
        self.upstream_commit("add another")
        self.pull()
        report = self.hydrate()
        self.assertEqual(report.submodules_initialized, 2)
        self.assertTrue((self.checkout / "libs/other/b.txt").is_file())

    def test_removed_submodule_is_pruned(self) -> None:
        self.hydrate()
        git(self.parent, "rm", "-q", "-f", "libs/lib")
        self.upstream_commit("remove")
        self.pull()
        self.assertTrue((self.checkout / "libs/lib").exists(), "precondition: git leaves it behind")
        report = self.hydrate()
        self.assertEqual(report.submodules_removed, ["libs/lib"])
        self.assertFalse((self.checkout / "libs/lib").exists())
        self.assertFalse((self.checkout / ".git/modules/libs/lib").exists())
        config = git(self.checkout, "config", "--local", "--list")
        self.assertNotIn("submodule.libs/lib", config)
        # Nothing left to remove the second time.
        self.assertEqual(self.hydrate().submodules_removed, [])

    def test_removed_submodule_with_local_changes_is_kept(self) -> None:
        self.hydrate()
        (self.checkout / "libs/lib/a.txt").write_text("precious", encoding="utf-8")
        git(self.parent, "rm", "-q", "-f", "libs/lib")
        self.upstream_commit("remove")
        self.pull()
        report = self.hydrate()
        self.assertEqual(report.submodules_removed, [])
        self.assertEqual((self.checkout / "libs/lib/a.txt").read_text(encoding="utf-8"), "precious")
        self.assertTrue(any("local changes" in warning for warning in report.warnings))

    def test_submodule_replaced_by_a_regular_directory_is_left_alone(self) -> None:
        self.hydrate()
        git(self.parent, "rm", "-q", "-f", "libs/lib")
        (self.parent / "libs/lib").mkdir(parents=True, exist_ok=True)
        (self.parent / "libs/lib/b.txt").write_text("b", encoding="utf-8")
        self.upstream_commit("now a directory")
        self.pull()
        report = self.hydrate()
        self.assertEqual(report.submodules_removed, [])
        self.assertTrue((self.checkout / "libs/lib/b.txt").is_file())
        self.assertTrue(any("regular directory" in warning for warning in report.warnings))

    def test_update_none_in_gitmodules_still_populates(self) -> None:
        git(self.parent, "config", "-f", ".gitmodules", "submodule.libs/lib.update", "none")
        self.upstream_commit("update none")
        self.pull()
        report = self.hydrate()
        self.assertEqual(report.submodules_initialized, 1)
        self.assertTrue((self.checkout / "libs/lib/a.txt").is_file())

    def test_an_empty_directory_is_not_counted_as_initialised(self) -> None:
        real_run = service._run

        def skip_update(args, **kwargs):
            if args[:2] == ["submodule", "update"]:
                return subprocess.CompletedProcess(args, 0, "", "")
            return real_run(args, **kwargs)

        report = service.CheckoutReport()
        with mock.patch.object(service, "_run", side_effect=skip_update):
            service._hydrate_submodules(
                self.checkout, "", env=service.hardened_env(self.env), policy=POLICY,
                report=report, depth=1, prefix="", progress=None, check_cancelled=None,
            )
        self.assertEqual(report.submodules_initialized, 0)
        self.assertEqual(report.submodules_skipped[0]["reason"], "not populated")

    def test_submodule_branches_stay_fresh(self) -> None:
        self.hydrate()
        git(self.library, "branch", "feature")
        self.hydrate()
        branches = git(self.checkout / "libs/lib", "branch", "-r")
        self.assertIn("origin/feature", branches)

        git(self.library, "branch", "another")
        service.fetch_submodule_refs(self.checkout, self.env)
        self.assertIn("origin/another", git(self.checkout / "libs/lib", "branch", "-r"))

    def test_detached_submodule_offers_the_pinned_commit_as_current(self) -> None:
        self.hydrate()
        result = git_service.get_branches(str(self.checkout / "libs/lib"))
        current = [item for item in result["branches"] if item["is_current"]]
        self.assertEqual(len(current), 1, result)
        self.assertEqual(current[0]["ref"], "HEAD")
        self.assertEqual(current[0]["source"], "pinned")

    def test_inside_submodule_detection(self) -> None:
        self.assertFalse(service.is_inside_submodule(self.checkout, "libs/lib/Main"), "not populated yet")
        self.hydrate()
        self.assertTrue(service.is_inside_submodule(self.checkout, "libs/lib/Main"))
        self.assertTrue(service.is_inside_submodule(self.checkout, "libs/lib"))
        self.assertFalse(service.is_inside_submodule(self.checkout, "docs"))
        self.assertFalse(service.is_inside_submodule(self.checkout, None))


class ReleaseStudioRefusal(Scenario):
    def test_refuses_a_project_inside_a_submodule(self) -> None:
        from app.api import release_studio

        self.hydrate()
        row = {
            "parent_repo_path": str(self.checkout),
            "path": str(self.checkout / "libs/lib/Main"),
            "relative_path": "libs/lib/Main",
        }
        request = SimpleNamespace(identity={})
        user = SimpleNamespace(role="designer", email="a@example.com")
        with mock.patch.object(release_studio, "get_project_for_role_or_404"), \
                mock.patch.object(release_studio.workspace, "get_project_by_id", return_value=row), \
                mock.patch.object(release_studio.jobs, "enqueue") as enqueue:
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(release_studio.create_candidate("prj", request, user))
        self.assertEqual(caught.exception.status_code, 400)
        self.assertIn("submodule", caught.exception.detail)
        enqueue.assert_not_called()


class ImportSkipsUnavailableSubmodules(unittest.TestCase):
    def plan(self, *paths: str) -> ProjectImportPlan:
        return ProjectImportPlan(
            repo_url="https://h/o/r.git",
            repo_name="r",
            import_type="type2",
            existing_repo_id=None,
            existing_repo_name=None,
            target_path="/x",
            selected=tuple(
                PlannedImportProject(
                    key=f"{path}::a.kicad_pro", name=Path(path).name, relative_path=path,
                    project_file="a.kicad_pro", adopt_project_id=None, register_relative_path=path,
                )
                for path in paths
            ),
        )

    def report(self, *skipped: str) -> service.CheckoutReport:
        return service.CheckoutReport(
            submodules_skipped=[{"path": path, "reason": "unreachable"} for path in skipped]
        )

    def test_nothing_skipped_leaves_the_plan_alone(self) -> None:
        plan = self.plan("a", "hw/b")
        self.assertEqual(importer._drop_unavailable_projects(plan, self.report()), (plan, []))

    def test_projects_in_a_failed_submodule_are_left_out(self) -> None:
        plan = self.plan("a", "hw/b", "hw/b/nested", "hw/other")
        kept, dropped = importer._drop_unavailable_projects(plan, self.report("hw/b"))
        self.assertEqual([p.relative_path for p in kept.selected], ["a", "hw/other"])
        self.assertEqual([d["submodule"] for d in dropped], ["hw/b", "hw/b"])

    def test_a_sibling_with_a_shared_prefix_is_not_confused(self) -> None:
        plan = self.plan("hw/board2")
        kept, dropped = importer._drop_unavailable_projects(plan, self.report("hw/board"))
        self.assertEqual(dropped, [])
        self.assertEqual(len(kept.selected), 1)

    def test_fails_when_nothing_would_be_left(self) -> None:
        with self.assertRaises(ValueError) as caught:
            importer._drop_unavailable_projects(self.plan("hw/b"), self.report("hw/b"))
        self.assertIn("hw/b", str(caught.exception))


class LimitsAndTimeouts(unittest.TestCase):
    def test_huge_lfs_pointer_is_refused_before_reading(self) -> None:
        pointer = (POINTER.format(oid=OID).replace("size 5", f"size {60 * 1024 * 1024}")).encode()
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(service.LfsObjectTooLarge):
                service.resolve_lfs_content(pointer, tmp)

    def test_history_reader_answers_413(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            pointer = POINTER.format(oid=OID).replace("size 5", f"size {60 * 1024 * 1024}")
            repo = make_repo(Path(tmp) / "repo", {"model.step": pointer})
            head = git(repo, "rev-parse", "HEAD").strip()
            with self.assertRaises(HTTPException) as caught:
                file_service.read_file_from_commit(str(repo), head, "model.step")
            self.assertEqual(caught.exception.status_code, 413)

    def test_discovery_fetch_has_a_short_timeout_and_is_not_retried(self) -> None:
        calls = []

        def run(args, **kwargs):
            calls.append((args[0], kwargs.get("timeout")))
            if args[0] == "fetch":
                raise subprocess.TimeoutExpired(args, kwargs["timeout"])
            return subprocess.CompletedProcess(args, 0, "", "")

        with tempfile.TemporaryDirectory() as tmp, mock.patch.object(service, "_run", side_effect=run):
            with self.assertRaises(subprocess.TimeoutExpired):
                service.fetch_tree_only(Path(tmp) / "r", "https://h/o/r.git", "a" * 40, {})
        fetches = [call for call in calls if call[0] == "fetch"]
        self.assertEqual(fetches, [("fetch", service.DISCOVERY_TIMEOUT_SECONDS)])
        self.assertLess(service.DISCOVERY_TIMEOUT_SECONDS, 120)

    def test_a_timeout_reads_as_timed_out(self) -> None:
        self.assertEqual(
            service.describe_failure(subprocess.TimeoutExpired(["git"], 60)), "timed out"
        )


if __name__ == "__main__":
    unittest.main()

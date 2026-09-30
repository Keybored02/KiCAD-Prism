"""Import and sync must hand the checkout to the hydration service."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from app.services import git_checkout_service, project_import_service


class SyncHydratesCheckout(unittest.TestCase):
    def setUp(self) -> None:
        self._temporary = tempfile.TemporaryDirectory()
        self.checkout = Path(self._temporary.name)
        self.addCleanup(self._temporary.cleanup)

        self.repo = mock.Mock()
        self.repo.head.is_detached = False
        self.repo.is_dirty.return_value = False
        self.repo.active_branch.name = "main"
        self.repo.active_branch.tracking_branch.return_value = SimpleNamespace(name="origin/main")
        self.origin = self.repo.remote.return_value
        self.origin.url = "https://github.com/org/main.git"
        self.origin.fetch.return_value = ["ref"]

        self.report = git_checkout_service.CheckoutReport(
            submodules_total=1, submodules_initialized=1
        )
        self.hydrate = mock.Mock(return_value=self.report)
        for patch in (
            mock.patch.object(
                project_import_service.workspace,
                "get_project_by_id",
                return_value={
                    "id": "prj_1", "repo_id": "repo_1", "import_type": "single",
                    "path": str(self.checkout), "parent_repo_path": str(self.checkout),
                },
            ),
            mock.patch.object(project_import_service, "Repo", return_value=self.repo),
            mock.patch.object(project_import_service, "hydrate_checkout", self.hydrate),
            mock.patch.object(project_import_service, "refresh_project_assets"),
            mock.patch.object(project_import_service.workspace, "update_repository_synced"),
            mock.patch.object(project_import_service.derived_assets, "purge_legacy_in_tree_thumbnails"),
        ):
            patch.start()
            self.addCleanup(patch.stop)

    def test_sync_hydrates_after_fast_forward(self) -> None:
        result = project_import_service.sync_project("prj_1")
        self.assertEqual(result["status"], "success")
        self.hydrate.assert_called_once_with(str(self.checkout), "https://github.com/org/main.git")
        self.assertTrue(result["checkout"]["has_submodules"])
        # Hydration must come after the fast-forward, not before.
        names = [call[0] for call in self.repo.git.method_calls]
        self.assertEqual(names, ["merge"])

    def test_sync_fetch_and_merge_are_hardened(self) -> None:
        project_import_service.sync_project("prj_1")
        env = self.origin.fetch.call_args.kwargs["env"]
        self.assertEqual(env["GIT_LFS_SKIP_SMUDGE"], "1")
        merge_env = self.repo.git.merge.call_args.kwargs["env"]
        self.assertEqual(merge_env["GIT_LFS_SKIP_SMUDGE"], "1")

    def test_background_fetch_does_not_hydrate(self) -> None:
        result = project_import_service.sync_project("prj_1", fetch_only=True)
        self.hydrate.assert_not_called()
        self.assertNotIn("checkout", result)

    def test_warning_reaches_the_message(self) -> None:
        self.report.warnings.append("1 LFS file(s) were not downloaded.")
        result = project_import_service.sync_project("prj_1")
        self.assertIn("LFS file(s) were not downloaded", result["message"])


class HydrateWrapper(unittest.TestCase):
    def test_passes_deployment_settings_and_context(self) -> None:
        context = mock.Mock()
        with mock.patch.object(
            project_import_service.git_checkout_service, "hydrate_checkout"
        ) as inner, mock.patch.object(
            project_import_service.settings, "PRISM_GIT_LFS_MODE", "off"
        ), mock.patch.object(project_import_service.settings, "PRISM_GIT_LFS_MAX_MB", 5):
            project_import_service.hydrate_checkout("/tmp/x", "https://h/o/r.git", context)
        kwargs = inner.call_args.kwargs
        self.assertEqual(kwargs["lfs"], git_checkout_service.LfsSettings(mode="off", max_mb=5))
        self.assertEqual(kwargs["parent_url"], "https://h/o/r.git")
        self.assertEqual(kwargs["check_cancelled"], context.check_cancelled)
        self.assertEqual(kwargs["env"]["GIT_TERMINAL_PROMPT"], "0")


if __name__ == "__main__":
    unittest.main()

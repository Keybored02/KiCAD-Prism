"""A local folder import must hand its clone to the hydration service."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest import mock

from git import Actor, Repo

from app.services import (
    git_checkout_service,
    local_project_import_service,
    project_import_service,
    project_service,
)


class LocalImportHydratesCheckout(unittest.TestCase):
    def setUp(self) -> None:
        self._temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self._temporary.cleanup)
        self.root = Path(self._temporary.name)

        patch = mock.patch.object(project_service, "PROJECTS_ROOT", str(self.root))
        patch.start()
        self.addCleanup(patch.stop)

        self.session_id = local_project_import_service.create_session()
        folder = local_project_import_service._session_dir(self.session_id) / "board"
        folder.mkdir()
        (folder / "board.kicad_pro").write_text("{}", encoding="utf-8")
        staged = Repo.init(str(folder))
        staged.index.add(["board.kicad_pro"])
        author = Actor("Test", "test@example.com")
        staged.index.commit("init", author=author, committer=author)
        staged.close()

        self.report = git_checkout_service.CheckoutReport(uses_lfs=True, lfs_status="ok")
        self.hydrate = mock.Mock(return_value=self.report)
        for target, name, value in (
            (project_import_service, "hydrate_checkout", self.hydrate),
            (local_project_import_service, "_register", mock.Mock(return_value=("repo_1", ["prj_1"]))),
        ):
            patch = mock.patch.object(target, name, value)
            patch.start()
            self.addCleanup(patch.stop)

    def test_clone_skips_smudge_and_is_hydrated(self) -> None:
        clone = mock.Mock(wraps=Repo.clone_from)
        with mock.patch.object(local_project_import_service.Repo, "clone_from", clone):
            result = local_project_import_service.import_session(self.session_id)

        self.assertEqual(clone.call_args.kwargs["env"]["GIT_LFS_SKIP_SMUDGE"], "1")
        target = self.root / "type1" / "board"
        self.hydrate.assert_called_once_with(target)
        self.assertEqual(result["checkout"], self.report.to_dict())

    def test_inspection_reports_lfs_use(self) -> None:
        self.assertFalse(local_project_import_service.inspect_session(self.session_id)["uses_lfs"])

        folder = local_project_import_service._session_dir(self.session_id) / "board"
        (folder / ".gitattributes").write_text("*.step filter=lfs diff=lfs merge=lfs -text\n", encoding="utf-8")
        staged = Repo(str(folder))
        staged.index.add([".gitattributes"])
        author = Actor("Test", "test@example.com")
        staged.index.commit("track step files in LFS", author=author, committer=author)
        staged.close()

        self.assertTrue(local_project_import_service.inspect_session(self.session_id)["uses_lfs"])

    def test_import_is_unwound_when_hydration_raises(self) -> None:
        self.hydrate.side_effect = RuntimeError("cancelled")

        with self.assertRaises(RuntimeError):
            local_project_import_service.import_session(self.session_id)

        self.assertFalse((self.root / "type1" / "board").exists())


if __name__ == "__main__":
    unittest.main()

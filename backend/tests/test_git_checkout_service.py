"""LFS hydration for Prism-managed checkouts.

Git LFS itself is stubbed out where a test needs a server; tracking detection
runs against real local repositories. Pointers and the object store are
``test_git_lfs``.
"""

from __future__ import annotations

import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from app.services import git_checkout_service as service
from app.services import project_import_service



def git(cwd: Path, *args: str) -> str:
    env = {
        **os.environ,
        "GIT_AUTHOR_NAME": "t",
        "GIT_AUTHOR_EMAIL": "t@example.com",
        "GIT_COMMITTER_NAME": "t",
        "GIT_COMMITTER_EMAIL": "t@example.com",
        "GIT_CONFIG_COUNT": "1",
        "GIT_CONFIG_KEY_0": "protocol.file.allow",
        "GIT_CONFIG_VALUE_0": "always",
    }
    return subprocess.run(
        ["git", *args], cwd=cwd, env=env, check=True, capture_output=True, text=True
    ).stdout


def make_repo(path: Path, files: dict[str, str]) -> Path:
    path.mkdir(parents=True)
    git(path, "init", "-q", "-b", "main")
    for name, content in files.items():
        target = path / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
    git(path, "add", "-A")
    git(path, "commit", "-q", "-m", "init")
    return path


class GitEnvironment(unittest.TestCase):
    def test_turns_off_implicit_lfs_downloads(self) -> None:
        self.assertEqual(project_import_service.git_env()["GIT_LFS_SKIP_SMUDGE"], "1")

    def test_add_git_config_appends_to_existing_entries(self) -> None:
        env = {"GIT_CONFIG_COUNT": "1", "GIT_CONFIG_KEY_0": "a.b", "GIT_CONFIG_VALUE_0": "1"}
        project_import_service.add_git_config(env, "c.d", "2")
        self.assertEqual(env["GIT_CONFIG_COUNT"], "2")
        self.assertEqual((env["GIT_CONFIG_KEY_1"], env["GIT_CONFIG_VALUE_1"]), ("c.d", "2"))
        self.assertEqual(env["GIT_CONFIG_KEY_0"], "a.b")

    def test_add_git_config_starts_from_nothing_and_ignores_a_bad_count(self) -> None:
        for env in ({}, {"GIT_CONFIG_COUNT": "oops"}):
            project_import_service.add_git_config(env, "c.d", "2")
            self.assertEqual(env["GIT_CONFIG_COUNT"], "1")
            self.assertEqual(env["GIT_CONFIG_KEY_0"], "c.d")


class DetectsLfsTracking(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.root = Path(self._tmp.name)
        self.env = dict(os.environ)

    def test_in_a_worktree_without_git_lfs(self) -> None:
        lfs = make_repo(self.root / "lfs", {".gitattributes": "*.step filter=lfs diff=lfs merge=lfs -text\n"})
        plain = make_repo(self.root / "plain", {"a.txt": "a"})
        self.assertTrue(service.tracks_lfs(lfs, self.env))
        self.assertFalse(service.tracks_lfs(plain, self.env))

    def test_in_a_nested_gitattributes(self) -> None:
        repo = make_repo(self.root / "nested", {"3d/.gitattributes": "*.step filter=lfs -text\n"})
        self.assertTrue(service.tracks_lfs(repo, self.env))

    def test_in_a_no_checkout_clone(self) -> None:
        lfs = make_repo(self.root / "lfs", {".gitattributes": "*.step filter=lfs -text\n"})
        clone = self.root / "analysis"
        git(self.root, "clone", "-q", "--no-checkout", str(lfs), str(clone))
        self.assertTrue(service.tracks_lfs(clone, self.env, ref="HEAD"))


class LfsPolicy(unittest.TestCase):
    """LFS decisions, with the Git commands stubbed out."""

    def setUp(self) -> None:
        patchers = [
            mock.patch.object(service, "tracks_lfs", return_value=True),
            mock.patch.object(service, "lfs_available", return_value=True),
        ]
        for patcher in patchers:
            patcher.start()
            self.addCleanup(patcher.stop)
        self.report = service.CheckoutReport()

    def hydrate(self, lfs: service.LfsSettings, files_before, files_after=None) -> None:
        answers = [files_before, files_after if files_after is not None else files_before]
        pulls: list[list[str]] = []

        def run(args, **kwargs):
            pulls.append(args)
            return subprocess.CompletedProcess(args, 0, "", "")

        self.pulls = pulls
        with mock.patch.object(service, "_lfs_files", side_effect=lambda *a: answers.pop(0) if answers else []), \
                mock.patch.object(service, "_run", side_effect=run):
            service._hydrate_lfs(
                [Path(".")], env={"GIT_LFS_SKIP_SMUDGE": "1"}, lfs=lfs, report=self.report,
                progress=None, check_cancelled=None,
            )

    def test_off_never_pulls(self) -> None:
        self.hydrate(service.LfsSettings(mode="off"), [])
        self.assertEqual(self.report.lfs_status, "disabled")
        self.assertTrue(self.report.warnings)
        self.assertEqual(self.pulls, [])

    def test_pointers_only_is_silent(self) -> None:
        self.hydrate(service.LfsSettings(mode="pointers-only"), [])
        self.assertEqual(self.report.lfs_status, "disabled")
        self.assertEqual(self.report.warnings, [])
        self.assertTrue(self.report.uses_lfs)

    def test_size_limit_skips_download(self) -> None:
        big = [{"size": 5 * 1024 * 1024, "downloaded": False, "checkout": False}]
        self.hydrate(service.LfsSettings(max_mb=1), big, big)
        self.assertEqual(self.report.lfs_status, "too-large")
        self.assertEqual(self.report.lfs_missing, 1)
        self.assertEqual(self.pulls, [])

    def test_success_and_partial(self) -> None:
        good = [{"size": 10, "downloaded": True, "checkout": True}]
        self.hydrate(service.LfsSettings(), good, good)
        self.assertEqual(self.report.lfs_status, "ok")

        self.report = service.CheckoutReport()
        bad = [{"size": 10, "downloaded": False, "checkout": False}]
        self.hydrate(service.LfsSettings(), bad, bad)
        self.assertEqual(self.report.lfs_status, "partial")
        self.assertEqual(self.report.lfs_missing, 1)

    def test_pull_runs_without_skip_smudge(self) -> None:
        seen: list[dict] = []

        def run(args, **kwargs):
            seen.append(kwargs["env"])
            return subprocess.CompletedProcess(args, 0, "", "")

        with mock.patch.object(service, "_lfs_files", return_value=[]), \
                mock.patch.object(service, "_run", side_effect=run):
            service._hydrate_lfs(
                [Path(".")], env={"GIT_LFS_SKIP_SMUDGE": "1"}, lfs=service.LfsSettings(),
                report=self.report, progress=None, check_cancelled=None,
            )
        self.assertNotIn("GIT_LFS_SKIP_SMUDGE", seen[0])

    def test_missing_binary_is_reported(self) -> None:
        with mock.patch.object(service, "lfs_available", return_value=False):
            service._hydrate_lfs(
                [Path(".")], env={}, lfs=service.LfsSettings(), report=self.report,
                progress=None, check_cancelled=None,
            )
        self.assertEqual(self.report.lfs_status, "unavailable")


if __name__ == "__main__":
    unittest.main()

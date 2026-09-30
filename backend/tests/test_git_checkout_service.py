"""LFS hydration for Prism-managed checkouts.

Git LFS itself is stubbed out where a test needs a server; tracking detection
and pointer resolution run against real local repositories.
"""

from __future__ import annotations

import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from app.services import git_checkout_service as service



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


class HardenedEnvironment(unittest.TestCase):
    def test_turns_off_implicit_lfs_downloads(self) -> None:
        env = service.hardened_env({"PATH": "x"})
        self.assertEqual(env["GIT_LFS_SKIP_SMUDGE"], "1")
        self.assertEqual(env["PATH"], "x")


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


POINTER = (
    "version https://git-lfs.github.com/spec/v1\n"
    "oid sha256:{oid}\n"
    "size 5\n"
)
OID = "a" * 64


class LfsPointersInHistory(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.repo = make_repo(
            Path(self._tmp.name) / "repo", {"model.step": POINTER.format(oid=OID), "a.txt": "plain"}
        )
        self.git_dir = self.repo / ".git"

    def store(self, data: bytes) -> None:
        target = self.git_dir / "lfs" / "objects" / OID[:2] / OID[2:4]
        target.mkdir(parents=True)
        (target / OID).write_bytes(data)

    def test_non_pointers_pass_through(self) -> None:
        self.assertEqual(service.resolve_lfs_content(b"plain", self.git_dir), b"plain")
        big = service._LFS_POINTER_PREFIX + b"\n" + b"x" * 2000
        self.assertEqual(service.resolve_lfs_content(big, self.git_dir), big)

    def test_pointer_resolves_to_the_stored_object(self) -> None:
        self.store(b"hello")
        pointer = POINTER.format(oid=OID).encode()
        self.assertEqual(service.resolve_lfs_content(pointer, self.git_dir), b"hello")

    def test_missing_object_is_reported_not_returned_as_pointer_text(self) -> None:
        pointer = POINTER.format(oid=OID).encode()
        with self.assertRaises(service.LfsObjectMissing):
            service.resolve_lfs_content(pointer, self.git_dir)

    def test_commit_file_reader_uses_it(self) -> None:
        from fastapi import HTTPException

        from app.services import file_service

        head = git(self.repo, "rev-parse", "HEAD").strip()
        with self.assertRaises(HTTPException) as caught:
            file_service.read_file_from_commit(str(self.repo), head, "model.step")
        self.assertEqual(caught.exception.status_code, 404)
        self.assertIn("LFS", caught.exception.detail)

        self.store(b"hello")
        self.assertEqual(
            file_service.read_file_from_commit(str(self.repo), head, "model.step").content,
            b"hello",
        )
        self.assertEqual(
            file_service.read_file_from_commit(str(self.repo), head, "a.txt").content, b"plain"
        )


class LfsSizeLimitInHistory(unittest.TestCase):
    def huge_pointer(self) -> str:
        return POINTER.format(oid=OID).replace("size 5", f"size {60 * 1024 * 1024}")

    def test_huge_pointer_is_refused_before_reading(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(service.LfsObjectTooLarge):
                service.resolve_lfs_content(self.huge_pointer().encode(), tmp)

    def test_history_reader_answers_413(self) -> None:
        from fastapi import HTTPException

        from app.services import file_service

        with tempfile.TemporaryDirectory() as tmp:
            repo = make_repo(Path(tmp) / "repo", {"model.step": self.huge_pointer()})
            head = git(repo, "rev-parse", "HEAD").strip()
            with self.assertRaises(HTTPException) as caught:
                file_service.read_file_from_commit(str(repo), head, "model.step")
            self.assertEqual(caught.exception.status_code, 413)


if __name__ == "__main__":
    unittest.main()

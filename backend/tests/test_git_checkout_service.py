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


class LfsFetchForACommit(unittest.TestCase):
    """Fetching another commit's LFS objects, with the Git commands stubbed out."""

    COMMIT = "c" * 40

    def setUp(self) -> None:
        self.calls: list[tuple[list[str], dict]] = []
        for target, value in (("tracks_lfs", True), ("lfs_available", True)):
            patcher = mock.patch.object(service, target, return_value=value)
            patcher.start()
            self.addCleanup(patcher.stop)

    def fetch(self, lfs: service.LfsSettings, listings, *, fails: bool = False):
        answers = list(listings)

        def run(args, **kwargs):
            self.calls.append((args, kwargs))
            if fails:
                raise subprocess.CalledProcessError(1, ["git", *args], stderr="batch response: 404")
            return subprocess.CompletedProcess(args, 0, "", "")

        with mock.patch.object(service, "_lfs_files", side_effect=lambda *a, **k: answers.pop(0)), \
                mock.patch.object(service, "_run", side_effect=run):
            return service.fetch_lfs_objects(
                ".", self.COMMIT, env={"GIT_LFS_SKIP_SMUDGE": "1"}, lfs=lfs
            )

    def fetches(self) -> list[list[str]]:
        return [args for args, _ in self.calls if args[:2] == ["lfs", "fetch"]]

    def test_a_repository_without_lfs_is_left_alone(self) -> None:
        with mock.patch.object(service, "tracks_lfs", return_value=False):
            report = self.fetch(service.LfsSettings(), [])
        self.assertEqual((report.uses_lfs, report.status), (False, "not-used"))
        self.assertEqual(self.calls, [])

    def test_objects_already_in_the_store_are_not_fetched(self) -> None:
        report = self.fetch(service.LfsSettings(), [[{"size": 5, "downloaded": True}]])
        self.assertEqual(report.status, "ok")
        self.assertEqual(self.fetches(), [])

    def test_fetches_the_commit_and_counts_what_arrived(self) -> None:
        absent = [{"size": 5, "downloaded": False}, {"size": 5, "downloaded": False}]
        present = [{"size": 5, "downloaded": True}, {"size": 5, "downloaded": True}]
        report = self.fetch(service.LfsSettings(), [absent, present])
        self.assertEqual((report.status, report.fetched, report.missing), ("ok", 2, 0))
        self.assertEqual(self.fetches(), [["lfs", "fetch", "origin", self.COMMIT]])

    def test_the_fetch_does_not_inherit_skip_smudge(self) -> None:
        absent = [{"size": 5, "downloaded": False}]
        self.fetch(service.LfsSettings(), [absent, absent])
        env = next(kwargs["env"] for args, kwargs in self.calls if args[:2] == ["lfs", "fetch"])
        self.assertNotIn("GIT_LFS_SKIP_SMUDGE", env)

    def test_some_objects_still_missing_is_partial(self) -> None:
        absent = [{"size": 5, "downloaded": False}, {"size": 5, "downloaded": False}]
        one_left = [{"size": 5, "downloaded": True}, {"size": 5, "downloaded": False}]
        report = self.fetch(service.LfsSettings(), [absent, one_left])
        self.assertEqual((report.status, report.fetched, report.missing), ("partial", 1, 1))

    def test_a_failed_download_is_reported_not_raised(self) -> None:
        absent = [{"size": 5, "downloaded": False}]
        report = self.fetch(service.LfsSettings(), [absent, absent], fails=True)
        self.assertEqual((report.status, report.missing), ("partial", 1))
        self.assertTrue(any("LFS download failed" in warning for warning in report.warnings))

    def test_the_size_limit_counts_only_what_is_absent(self) -> None:
        listing = [
            {"size": 5 * 1024 * 1024, "downloaded": True},
            {"size": 512 * 1024, "downloaded": False},
        ]
        report = self.fetch(service.LfsSettings(max_mb=1), [listing, listing])
        self.assertNotEqual(report.status, "too-large")
        self.assertEqual(len(self.fetches()), 1)

    def test_over_the_size_limit_nothing_is_fetched(self) -> None:
        big = [{"size": 5 * 1024 * 1024, "downloaded": False}]
        report = self.fetch(service.LfsSettings(max_mb=1), [big])
        self.assertEqual((report.status, report.missing), ("too-large", 1))
        self.assertEqual(self.fetches(), [])

    def test_off_and_pointers_only_never_contact_a_server(self) -> None:
        off = self.fetch(service.LfsSettings(mode="off"), [])
        pointers_only = self.fetch(service.LfsSettings(mode="pointers-only"), [])
        self.assertEqual((off.status, bool(off.warnings)), ("disabled", True))
        self.assertEqual((pointers_only.status, bool(pointers_only.warnings)), ("disabled", False))
        self.assertEqual(self.calls, [])

    def test_a_missing_binary_is_reported(self) -> None:
        with mock.patch.object(service, "lfs_available", return_value=False):
            report = self.fetch(service.LfsSettings(), [])
        self.assertEqual(report.status, "unavailable")

    def test_an_unlistable_commit_is_partial(self) -> None:
        report = self.fetch(service.LfsSettings(), [None])
        self.assertEqual(report.status, "partial")
        self.assertEqual(self.fetches(), [])

    def test_a_cancelled_job_stops_before_downloading(self) -> None:
        class Cancelled(Exception):
            pass

        def cancel() -> None:
            raise Cancelled

        absent = [{"size": 5, "downloaded": False}]
        with mock.patch.object(service, "_lfs_files", return_value=absent), \
                mock.patch.object(service, "_run") as run:
            with self.assertRaises(Cancelled):
                service.fetch_lfs_objects(
                    ".", self.COMMIT, env={}, lfs=service.LfsSettings(), check_cancelled=cancel
                )
        run.assert_not_called()


class FetchBeforeABuild(unittest.TestCase):
    def test_candidate_preparation_fetches_the_pinned_commit_before_the_closure(self) -> None:
        from app.services import release_studio_build_service as build_service

        order: list[str] = []
        with mock.patch.object(
            project_import_service,
            "fetch_lfs_objects",
            side_effect=lambda repo, commit: order.append(f"fetch {commit}")
            or service.LfsFetchReport(),
        ), mock.patch.object(
            build_service,
            "materialize_input_closure",
            side_effect=lambda *a, **k: order.append("closure") or (_ for _ in ()).throw(RuntimeError("stop")),
        ):
            with self.assertRaisesRegex(RuntimeError, "stop"):
                with tempfile.TemporaryDirectory() as tmp:
                    build_service.prepare_candidate(
                        project_id="p",
                        repository_id="r",
                        repo_root=Path(tmp),
                        commit_sha="abc123",
                        config_key="default",
                        variant="",
                        workspace_root=Path(tmp) / "work",
                        configuration={"default_variant": ""},
                    )
        self.assertEqual(order, ["fetch abc123", "closure"])

    def test_what_the_fetch_could_not_do_is_logged_and_does_not_stop_the_build(self) -> None:
        from app.services import release_studio_build_service as build_service

        report = service.LfsFetchReport(status="too-large", warnings=["over the limit"])
        with mock.patch.object(project_import_service, "fetch_lfs_objects", return_value=report), \
                self.assertLogs(build_service.logger, level="WARNING") as logged:
            build_service._fetch_lfs_objects(Path("."), "abcdef1234567890")
        self.assertIn("over the limit", logged.output[0])


if __name__ == "__main__":
    unittest.main()

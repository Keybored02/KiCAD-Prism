"""Submodule and LFS hydration for Prism-managed checkouts.

Submodule behavior runs against real local repositories. Those need the ``file``
transport, which production deliberately refuses, so the tests swap in an
environment that allows it and a URL check that accepts local paths. The policy
and the hardened environment are tested separately, as themselves. Git LFS
itself is stubbed out where a test needs a server.
"""

from __future__ import annotations

import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from app.services import git_checkout_service as service
from app.services.git_remote_url import RemoteUrlError, RemoteUrlPolicy



POLICY = RemoteUrlPolicy.build()
_REAL_HARDENED_ENV = service.hardened_env


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

    def test_blocks_file_and_ext_transports(self) -> None:
        env = service.hardened_env({"PATH": "x"})
        pairs = {
            env[f"GIT_CONFIG_KEY_{i}"]: env[f"GIT_CONFIG_VALUE_{i}"]
            for i in range(int(env["GIT_CONFIG_COUNT"]))
        }
        self.assertEqual(pairs["protocol.file.allow"], "never")
        self.assertEqual(pairs["protocol.ext.allow"], "never")

    def test_keeps_existing_config_entries(self) -> None:
        base = {
            "GIT_CONFIG_COUNT": "1",
            "GIT_CONFIG_KEY_0": "url.x.insteadOf",
            "GIT_CONFIG_VALUE_0": "y",
        }
        env = service.hardened_env(base)
        self.assertEqual(env["GIT_CONFIG_COUNT"], "3")
        self.assertEqual(env["GIT_CONFIG_KEY_0"], "url.x.insteadOf")


class RelativeUrls(unittest.TestCase):
    def test_resolves_against_parent(self) -> None:
        cases = [
            ("https://github.com/org/main.git", "../lib.git", "https://github.com/org/lib.git"),
            ("https://github.com/org/main.git", "../../other/lib.git", "https://github.com/other/lib.git"),
            ("git@github.com:org/main.git", "../lib.git", "git@github.com:org/lib.git"),
            ("git@github.com:main.git", "lib.git", "lib.git"),
            ("https://host:8443/org/main.git", "../lib.git", "https://host:8443/org/lib.git"),
            ("https://github.com/org/main.git", "https://x.example/a.git", "https://x.example/a.git"),
        ]
        for parent, relative, expected in cases:
            with self.subTest(parent=parent, relative=relative):
                self.assertEqual(service.resolve_submodule_url(parent, relative), expected)

    def test_refuses_to_climb_above_the_host(self) -> None:
        for parent in ("https://github.com/main.git", "git@github.com:main.git"):
            with self.subTest(parent=parent):
                with self.assertRaises(RemoteUrlError):
                    service.resolve_submodule_url(parent, "../../lib.git")

    def test_dot_slash_is_rejected(self) -> None:
        with self.assertRaises(RemoteUrlError):
            service.resolve_submodule_url("https://github.com/org/main.git", "./lib.git")


class VettingSubmodules(unittest.TestCase):
    def test_rejects_hostile_urls_and_paths(self) -> None:
        cases = [
            service.Submodule("a", "libs/a", "ext::sh -c 'id'"),
            service.Submodule("a", "libs/a", "file:///etc"),
            service.Submodule("a", "libs/a", "/srv/repos/private"),
            service.Submodule("a", "libs/a", "--upload-pack=x"),
            service.Submodule("a", "../escape", "https://github.com/org/a.git"),
            service.Submodule("a", ".git/hooks", "https://github.com/org/a.git"),
        ]
        for submodule in cases:
            with self.subTest(url=submodule.url, path=submodule.path):
                self.assertIsNotNone(
                    service.vet_submodule("https://github.com/org/main.git", submodule, POLICY)
                )

    def test_accepts_normal_and_relative_urls(self) -> None:
        parent = "https://github.com/org/main.git"
        for url in ("https://github.com/org/lib.git", "../lib.git", "git@github.com:org/lib.git"):
            with self.subTest(url=url):
                self.assertIsNone(
                    service.vet_submodule(parent, service.Submodule("a", "libs/a", url), POLICY)
                )

    def test_honours_host_allowlist(self) -> None:
        policy = RemoteUrlPolicy.build(allowed_hosts=["github.com"])
        reason = service.vet_submodule(
            "https://github.com/org/main.git",
            service.Submodule("a", "libs/a", "https://evil.example/a.git"),
            policy,
        )
        self.assertIsNotNone(reason)


class RealRepositories(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self._tmp.cleanup)
        self.root = Path(self._tmp.name)
        self.library = make_repo(self.root / "library", {"a.kicad_sym": "sym"})
        self.parent = make_repo(self.root / "parent", {"README.md": "hi"})
        git(self.parent, "submodule", "add", "-q", str(self.library), "libs/library")
        git(self.parent, "commit", "-q", "-m", "add submodule")
        self.env = {**os.environ}

        def allow_file(base: dict) -> dict:
            env = _REAL_HARDENED_ENV(base)
            index = int(env["GIT_CONFIG_COUNT"])
            env[f"GIT_CONFIG_KEY_{index}"] = "protocol.file.allow"
            env[f"GIT_CONFIG_VALUE_{index}"] = "always"
            env["GIT_CONFIG_COUNT"] = str(index + 1)
            return env

        for patcher in (
            mock.patch.object(service, "hardened_env", allow_file),
            mock.patch.object(service, "parse_remote_url", lambda url, policy=None: url),
        ):
            patcher.start()
            self.addCleanup(patcher.stop)

    def clone(self) -> Path:
        target = self.root / "checkout"
        git(self.root, "clone", "-q", str(self.parent), str(target))
        return target

    def test_reads_submodules_and_gitlinks(self) -> None:
        subs = service.read_submodules(self.parent, self.env)
        self.assertEqual([(s.path, s.url) for s in subs], [("libs/library", str(self.library))])
        by_ref = service.read_submodules(self.parent, self.env, ref="HEAD")
        self.assertEqual([s.path for s in by_ref], ["libs/library"])
        links = service.list_gitlinks(self.parent, self.env)
        self.assertEqual(list(links), ["libs/library"])
        self.assertEqual(len(links["libs/library"]), 40)

    def test_no_gitmodules_is_empty(self) -> None:
        self.assertEqual(service.read_submodules(self.library, self.env), [])

    def test_hydrate_populates_submodule(self) -> None:
        checkout = self.clone()
        self.assertFalse((checkout / "libs/library/a.kicad_sym").exists())
        report = service.hydrate_checkout(
            checkout, parent_url="", env=self.env, policy=POLICY, lfs=service.LfsSettings()
        )
        self.assertTrue((checkout / "libs/library/a.kicad_sym").is_file())
        self.assertEqual(report.submodules_total, 1)
        self.assertEqual(report.submodules_initialized, 1)
        self.assertEqual(report.lfs_status, "not-used")
        self.assertEqual(report.warnings, [])

    def test_hydrate_moves_submodule_to_new_pin_on_second_run(self) -> None:
        checkout = self.clone()
        args = dict(parent_url="", env=self.env, policy=POLICY, lfs=service.LfsSettings())
        service.hydrate_checkout(checkout, **args)
        (self.library / "b.kicad_sym").write_text("more", encoding="utf-8")
        git(self.library, "add", "-A")
        git(self.library, "commit", "-q", "-m", "more")
        git(self.parent / "libs/library", "pull", "-q")
        git(self.parent, "add", "-A")
        git(self.parent, "commit", "-q", "-m", "bump")
        git(checkout, "pull", "-q", "--ff-only")
        service.hydrate_checkout(checkout, **args)
        self.assertTrue((checkout / "libs/library/b.kicad_sym").is_file())

    def test_rejected_url_is_skipped_with_a_reason(self) -> None:
        checkout = self.clone()

        def reject(url: str, policy=None):
            raise RemoteUrlError("not allowed")

        with mock.patch.object(service, "parse_remote_url", reject):
            report = service.hydrate_checkout(
                checkout, parent_url="", env=self.env, policy=POLICY, lfs=service.LfsSettings()
            )
        self.assertEqual(report.submodules_initialized, 0)
        self.assertEqual(report.submodules_skipped[0]["path"], "libs/library")
        self.assertFalse((checkout / "libs/library/a.kicad_sym").exists())

    def test_unreachable_submodule_is_a_warning_not_an_error(self) -> None:
        checkout = self.clone()
        import shutil

        shutil.rmtree(self.library, onerror=lambda f, p, e: (os.chmod(p, 0o700), f(p)))
        report = service.hydrate_checkout(
            checkout, parent_url="", env=self.env, policy=POLICY, lfs=service.LfsSettings()
        )
        self.assertEqual(report.submodules_initialized, 0)
        self.assertTrue(report.warnings)

    def test_cancellation_propagates(self) -> None:
        checkout = self.clone()

        class Cancelled(Exception):
            pass

        def cancel() -> None:
            raise Cancelled

        with self.assertRaises(Cancelled):
            service.hydrate_checkout(
                checkout,
                parent_url="",
                env=self.env,
                policy=POLICY,
                lfs=service.LfsSettings(),
                check_cancelled=cancel,
            )

    def test_history_context_moves_into_the_submodule(self) -> None:
        checkout = self.clone()
        args = dict(parent_url="", env=self.env, policy=POLICY, lfs=service.LfsSettings())
        # Not initialised yet: the caller keeps the parent, so nothing breaks.
        self.assertEqual(
            service.resolve_history_context(checkout, "libs/library/sub"),
            (str(checkout), "libs/library/sub"),
        )
        service.hydrate_checkout(checkout, **args)
        self.assertEqual(
            service.resolve_history_context(checkout, "libs/library/sub/board"),
            (str(checkout / "libs/library"), "sub/board"),
        )
        # The submodule root itself has no inner path.
        self.assertEqual(
            service.resolve_history_context(checkout, "libs/library"),
            (str(checkout / "libs/library"), None),
        )
        # Anything outside a submodule is untouched.
        self.assertEqual(
            service.resolve_history_context(checkout, "docs"), (str(checkout), "docs")
        )
        self.assertEqual(service.resolve_history_context(checkout, None), (str(checkout), None))

    def test_history_in_the_submodule_repo_finds_project_commits(self) -> None:
        # The reason for the resolver: the parent sees nothing under the gitlink.
        checkout = self.clone()
        service.hydrate_checkout(
            checkout, parent_url="", env=self.env, policy=POLICY, lfs=service.LfsSettings()
        )
        self.assertEqual(git(checkout, "log", "--oneline", "--", "libs/library/a.kicad_sym"), "")
        repo, inner = service.resolve_history_context(checkout, "libs/library")
        self.assertEqual(len(git(Path(repo), "log", "--oneline").splitlines()), 1)


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

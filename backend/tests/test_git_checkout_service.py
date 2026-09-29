"""Submodule and LFS hydration for Prism-managed checkouts.

Submodule behavior runs against real local repositories. Those need the ``file``
transport, which production deliberately refuses, so the tests swap in an
environment that allows it and a URL check that accepts local paths. The policy
and the hardened environment are tested separately, as themselves.
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
    def test_blocks_file_and_ext_transports_and_smudge(self) -> None:
        env = service.hardened_env({"PATH": "x"})
        pairs = {
            env[f"GIT_CONFIG_KEY_{i}"]: env[f"GIT_CONFIG_VALUE_{i}"]
            for i in range(int(env["GIT_CONFIG_COUNT"]))
        }
        self.assertEqual(pairs["protocol.file.allow"], "never")
        self.assertEqual(pairs["protocol.ext.allow"], "never")
        self.assertEqual(env["GIT_LFS_SKIP_SMUDGE"], "1")

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

    def test_detects_lfs_tracking_without_git_lfs(self) -> None:
        repo = make_repo(
            self.root / "lfs", {".gitattributes": "*.step filter=lfs diff=lfs merge=lfs -text\n"}
        )
        self.assertTrue(service._tracks_lfs(repo, self.env))
        self.assertFalse(service._tracks_lfs(self.library, self.env))


class LfsPolicy(unittest.TestCase):
    """LFS decisions, with the Git commands stubbed out."""

    def setUp(self) -> None:
        patchers = [
            mock.patch.object(service, "_tracks_lfs", return_value=True),
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

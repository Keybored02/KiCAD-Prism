"""Fetching KiCad path libraries: git progress, a real clone, and the two jobs.

The clone tests run git against a repository made in a temporary directory, so
the swap, the ready marker and the cleanup after a failure are the real ones.
"""

from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from app.services import kicad_libraries as libs
from app.services import kicad_library_fetch as fetch
from app.services.job_runtime import JobCancelled, RetryableJobError


def git(*args: str, cwd: Path) -> None:
    subprocess.run(
        ["git", "-c", "user.name=t", "-c", "user.email=t@example.org", *args],
        cwd=cwd, check=True, capture_output=True,
    )


class Context:
    """The part of a JobContext the handlers use."""

    def __init__(self, payload: dict, cancel_after: int | None = None) -> None:
        self.payload = payload
        self.progress_calls: list[int] = []
        self._cancel_after = cancel_after

    def progress(self, **kwargs: object) -> None:
        self.progress_calls.append(int(kwargs["percent"]))

    def check_cancelled(self) -> None:
        if self._cancel_after is not None:
            raise JobCancelled("Cancellation requested")


class TempRoot(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.addCleanup(self._tmp.cleanup)

    def source_repo(self) -> Path:
        repo = self.root / "source"
        (repo / "layouts").mkdir(parents=True)
        (repo / "layouts" / "a4.kicad_wks").write_text("(kicad_wks)")
        (repo / "models").mkdir()
        (repo / "models" / "r.step").write_bytes(b"x" * 1000)
        git("init", "-q", "-b", "main", cwd=repo)
        git("add", "-A", cwd=repo)
        git("commit", "-q", "-m", "init", cwd=repo)
        git("tag", "v1", cwd=repo)
        return repo

    def library(self, repo: Path, **extra: object) -> libs.Library:
        fields = dict(name="lsf", variables=("LSF",), git=repo.as_uri(), ref="v1", directory=str(self.root / "libs" / "lsf"))
        return libs.Library(**{**fields, **extra})


class ProgressTests(unittest.TestCase):
    def test_phases_map_onto_one_scale(self) -> None:
        cases = {
            "Receiving objects:   0% (0/100)": 0,
            "Receiving objects:  50% (50/100), 1.00 MiB": 42,
            "Receiving objects: 100% (100/100), done.": 85,
            "Resolving deltas:  100% (10/10), done.": 90,
            "Updating files:  50% (5/10)": 95,
            "Updating files: 100% (10/10), done.": 100,
        }
        for line, expected in cases.items():
            with self.subTest(line=line):
                self.assertEqual(fetch.progress_of(line), expected)

    def test_other_lines_say_nothing(self) -> None:
        for line in ("Cloning into 'x'...", "remote: Counting objects: 100% (5/5)", "", "fatal: nope"):
            with self.subTest(line=line):
                self.assertIsNone(fetch.progress_of(line))


class CloneTests(TempRoot):
    def test_clone_marks_the_library_ready(self) -> None:
        library = self.library(self.source_repo())
        percents: list[int] = []
        size = fetch.clone(library, on_progress=percents.append)
        self.assertTrue(library.ready)
        self.assertTrue((library.clone_dir / "layouts" / "a4.kicad_wks").is_file())
        self.assertGreaterEqual(size, 1000)
        self.assertFalse(library.clone_dir.with_name("lsf.partial").exists())

    def test_clone_replaces_an_older_ref(self) -> None:
        repo = self.source_repo()
        fetch.clone(self.library(repo))
        (repo / "models" / "new.step").write_text("n")
        git("add", "-A", cwd=repo)
        git("commit", "-q", "-m", "more", cwd=repo)
        git("tag", "v2", cwd=repo)
        moved = self.library(repo, ref="v2")
        self.assertFalse(moved.ready)
        fetch.clone(moved)
        self.assertTrue(moved.ready)
        self.assertTrue((moved.clone_dir / "models" / "new.step").is_file())

    def test_a_missing_ref_fails_and_leaves_nothing_behind(self) -> None:
        library = self.library(self.source_repo(), ref="nope")
        with self.assertRaisesRegex(RuntimeError, "git clone failed"):
            fetch.clone(library)
        self.assertFalse(library.ready)
        self.assertEqual(list((self.root / "libs").iterdir()), [])

    def test_a_missing_subdir_fails_and_keeps_the_old_clone(self) -> None:
        repo = self.source_repo()
        fetch.clone(self.library(repo))
        library = self.library(repo, subdir="absent")
        with self.assertRaisesRegex(RuntimeError, "no folder"):
            fetch.clone(library)
        self.assertTrue((library.clone_dir / "models" / "r.step").is_file())
        self.assertFalse(library.clone_dir.with_name("lsf.partial").exists())

    def test_the_tick_can_stop_the_clone(self) -> None:
        library = self.library(self.source_repo())

        def stop() -> None:
            raise JobCancelled("Cancellation requested")

        with self.assertRaises(JobCancelled):
            fetch.clone(library, on_tick=stop)
        self.assertFalse(library.ready)
        self.assertEqual(list((self.root / "libs").iterdir()), [])


class JobTests(TempRoot):
    def setUp(self) -> None:
        super().setUp()
        self.repo = self.source_repo()
        self.library_ = self.library(self.repo)
        self.records: list[tuple] = []
        for target, effect in (
            (fetch, mock.patch.object(fetch, "_library", side_effect=lambda name: self.current)),
            (
                fetch.kicad_library_store,
                mock.patch.object(
                    fetch.kicad_library_store, "record_fetch", side_effect=lambda *a, **k: self.records.append((a, k))
                ),
            ),
        ):
            effect.start()
            self.addCleanup(effect.stop)
        self.current: libs.Library | None = self.library_

    def states(self) -> list[str]:
        return [kwargs["state"] for _args, kwargs in self.records]

    def test_a_fetch_records_progress_then_ready(self) -> None:
        context = Context({"name": "lsf"})
        result = fetch.run_fetch_job(context)
        self.assertTrue(self.library_.ready)
        self.assertEqual(self.states()[0], "fetching")
        self.assertEqual(self.states()[-1], "ready")
        self.assertGreaterEqual(result.details["sizeBytes"], 1000)

    def test_a_fetch_of_a_ready_library_does_nothing(self) -> None:
        fetch.clone(self.library_)
        with mock.patch.object(fetch, "clone") as cloned:
            result = fetch.run_fetch_job(Context({"name": "lsf"}))
        cloned.assert_not_called()
        self.assertEqual(self.states(), ["ready"])
        self.assertIn("ready", result.message)

    def test_a_failed_fetch_is_recorded_and_retried(self) -> None:
        self.current = self.library(self.repo, ref="nope")
        with self.assertRaises(RetryableJobError):
            fetch.run_fetch_job(Context({"name": "lsf"}))
        self.assertEqual(self.states()[-1], "failed")
        self.assertIn("git clone failed", self.records[-1][1]["error"])

    def test_a_cancelled_fetch_is_recorded_failed_and_cleaned_up(self) -> None:
        with mock.patch.object(fetch, "_CANCEL_CHECK_SECONDS", 0), self.assertRaises(JobCancelled):
            fetch.run_fetch_job(Context({"name": "lsf"}, cancel_after=0))
        self.assertEqual(self.states()[-1], "failed")
        self.assertFalse(self.library_.ready)

    def test_a_fetch_of_a_forgotten_or_path_library_does_nothing(self) -> None:
        self.current = None
        self.assertIn("no longer", fetch.run_fetch_job(Context({"name": "lsf"})).message)
        self.current = libs.Library(name="p", variables=("P",), path="x")
        self.assertIn("no longer", fetch.run_fetch_job(Context({"name": "p"})).message)
        self.assertEqual(self.records, [])

    def test_removal_deletes_the_clone_and_its_partial(self) -> None:
        library = self.library(self.repo, directory="")
        with mock.patch.object(libs, "libraries_root", return_value=self.root / "libs"):
            library = self.library(self.repo, directory=str(self.root / "libs" / "lsf"))
            fetch.clone(library)
            (self.root / "libs" / "lsf.partial").mkdir()
            self.current = None
            result = fetch.run_remove_job(Context({"name": "lsf", "directory": str(library.clone_dir)}))
        self.assertFalse(library.clone_dir.exists())
        self.assertFalse((self.root / "libs" / "lsf.partial").exists())
        self.assertIn("Removed", result.message)

    def test_removal_keeps_a_library_that_is_declared_again(self) -> None:
        fetch.clone(self.library_)
        with mock.patch.object(libs, "libraries_root", return_value=self.root / "libs"):
            result = fetch.run_remove_job(Context({"name": "lsf", "directory": str(self.library_.clone_dir)}))
        self.assertTrue(self.library_.ready)
        self.assertIn("declared again", result.message)

    def test_removal_never_leaves_the_libraries_folder(self) -> None:
        outside = self.root / "elsewhere"
        outside.mkdir()
        (outside / "keep.txt").write_text("x")
        self.current = None
        with mock.patch.object(libs, "libraries_root", return_value=self.root / "libs"):
            for target in (outside, self.root / "libs", self.root / "libs" / ".." / "elsewhere"):
                with self.subTest(target=str(target)):
                    result = fetch.run_remove_job(Context({"name": "lsf", "directory": str(target)}))
                    self.assertIn("kept", result.message)
        self.assertTrue((outside / "keep.txt").is_file())


class QueueTests(TempRoot):
    def test_only_unready_git_libraries_are_queued(self) -> None:
        ready = libs.Library(name="ready", variables=("A",), git="https://e/x.git", ref="v1", directory=str(self.root / "a"))
        (self.root / "a").mkdir()
        (self.root / "a" / ".prism-ready").write_text(ready.source + "\n")
        cold = libs.Library(name="cold", variables=("B",), git="https://e/y.git", ref="v1", directory=str(self.root / "b"))
        path = libs.Library(name="mounted", variables=("C",), path="c")
        with mock.patch.object(libs, "configured", return_value=((ready, cold, path), [])), mock.patch.object(
            fetch, "request_fetch"
        ) as request, mock.patch.object(libs, "forget_rows"):
            queued = fetch.queue_missing()
        self.assertEqual(queued, ["cold"])
        request.assert_called_once_with("cold", requested_by="startup")

    def test_a_removal_is_only_for_git_libraries(self) -> None:
        self.assertIsNone(fetch.request_removal(libs.Library(name="p", variables=("P",), path="x")))


class KindTests(unittest.TestCase):
    def test_both_kinds_lock_the_library_name(self) -> None:
        subject = fetch._subject("lsf")
        for kind in fetch.JOB_KINDS:
            self.assertEqual(kind.lock(subject), [{"key": "kicad-library:lsf", "mode": "write"}])


if __name__ == "__main__":
    unittest.main()

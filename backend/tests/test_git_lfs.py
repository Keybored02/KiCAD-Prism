"""Git LFS pointers and the local object store.

Pointer parsing, store lookup and tree hydration run against real local
repositories. No LFS server or ``git-lfs`` binary is involved: the store is
filled by hand, which is what a completed ``git lfs fetch`` leaves behind.
"""

from __future__ import annotations

import hashlib
import io
import os
import subprocess
import tarfile
import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException

from app.services import design_compare_service, file_service, git_lfs, project_source_snapshot
from app.services import semantic_visualizer_service

POINTER = "version https://git-lfs.github.com/spec/v1\noid sha256:{oid}\nsize {size}\n"


def pointer_for(data: bytes) -> tuple[str, str]:
    oid = hashlib.sha256(data).hexdigest()
    return POINTER.format(oid=oid, size=len(data)), oid


def git(cwd: Path, *args: str, binary: bool = False):
    env = {
        **os.environ,
        "GIT_AUTHOR_NAME": "t",
        "GIT_AUTHOR_EMAIL": "t@example.com",
        "GIT_COMMITTER_NAME": "t",
        "GIT_COMMITTER_EMAIL": "t@example.com",
    }
    result = subprocess.run(["git", *args], cwd=cwd, env=env, check=True, capture_output=True)
    return result.stdout if binary else result.stdout.decode("utf-8")


def make_repo(path: Path, files: dict[str, str]) -> Path:
    path.mkdir(parents=True)
    git(path, "init", "-q", "-b", "main")
    for name, content in files.items():
        target = path / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8", newline="")
    git(path, "add", "-A")
    git(path, "commit", "-q", "-m", "init")
    return path


def store_object(git_dir: Path, data: bytes, oid: str | None = None) -> str:
    oid = oid or hashlib.sha256(data).hexdigest()
    target = git_dir / "lfs" / "objects" / oid[:2] / oid[2:4]
    target.mkdir(parents=True, exist_ok=True)
    (target / oid).write_bytes(data)
    return oid


class TempRepoCase(unittest.TestCase):
    def setUp(self) -> None:
        # GitPython keeps handles open on Windows, so cleanup may fail there.
        self._tmp = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.addCleanup(self._tmp.cleanup)
        self.root = Path(self._tmp.name)


class ParsePointer(unittest.TestCase):
    def test_reads_oid_and_size(self) -> None:
        text, oid = pointer_for(b"hello")
        self.assertEqual(git_lfs.parse_pointer(text.encode()), git_lfs.LfsPointer(oid, 5))

    def test_ignores_extension_lines(self) -> None:
        text, oid = pointer_for(b"hello")
        text += "ext-0-foo sha256:" + "b" * 64 + "\n"
        self.assertEqual(git_lfs.parse_pointer(text.encode()).oid, oid)

    def test_plain_and_oversized_content_is_not_a_pointer(self) -> None:
        self.assertIsNone(git_lfs.parse_pointer(b"plain"))
        big = git_lfs.POINTER_VERSION.encode() + b"\n" + b"x" * 2000
        self.assertIsNone(git_lfs.parse_pointer(big))

    def test_malformed_pointer_is_content_unless_strict(self) -> None:
        for bad in (
            f"{git_lfs.POINTER_VERSION}\nsize 5\n",
            f"{git_lfs.POINTER_VERSION}\noid sha256:xyz\nsize 5\n",
            f"{git_lfs.POINTER_VERSION}\noid sha256:{'a' * 64}\nsize nope\n",
            f"{git_lfs.POINTER_VERSION}\noid sha256:{'a' * 64}\nsize -1\n",
        ):
            with self.subTest(bad=bad):
                self.assertIsNone(git_lfs.parse_pointer(bad.encode()))
                with self.assertRaises(ValueError):
                    git_lfs.parse_pointer(bad.encode(), strict=True)

    def test_non_ascii_pointer_is_malformed(self) -> None:
        raw = git_lfs.POINTER_VERSION.encode() + b"\n\xff\xfe"
        self.assertIsNone(git_lfs.parse_pointer(raw))
        with self.assertRaises(ValueError):
            git_lfs.parse_pointer(raw, strict=True)


class FindsTheGitDirectory(TempRepoCase):
    def test_plain_repository(self) -> None:
        repo = make_repo(self.root / "repo", {"a.txt": "a"})
        self.assertEqual(git_lfs.common_git_dir(repo), repo / ".git")

    def test_git_file_pointing_elsewhere(self) -> None:
        real = self.root / "modules" / "lib"
        real.mkdir(parents=True)
        work = self.root / "work"
        work.mkdir()
        (work / ".git").write_text(f"gitdir: {real}\n", encoding="utf-8")
        self.assertEqual(git_lfs.common_git_dir(work), real)

    def test_relative_git_file(self) -> None:
        (self.root / "parent" / ".git" / "modules" / "lib").mkdir(parents=True)
        work = self.root / "parent" / "lib"
        work.mkdir()
        (work / ".git").write_text("gitdir: ../.git/modules/lib\n", encoding="utf-8")
        self.assertEqual(
            git_lfs.common_git_dir(work).resolve(),
            (self.root / "parent" / ".git" / "modules" / "lib").resolve(),
        )

    def test_linked_worktree_uses_the_common_directory(self) -> None:
        repo = make_repo(self.root / "repo", {"a.txt": "a"})
        linked = self.root / "linked"
        git(repo, "worktree", "add", "-q", str(linked), "-b", "side")
        self.assertEqual(git_lfs.common_git_dir(linked).resolve(), (repo / ".git").resolve())

    def test_bare_repository(self) -> None:
        bare = self.root / "bare.git"
        bare.mkdir()
        git(bare, "init", "-q", "--bare")
        self.assertEqual(git_lfs.common_git_dir(bare), bare)


class ReadsTheStore(TempRepoCase):
    def setUp(self) -> None:
        super().setUp()
        self.git_dir = self.root / "gd"
        self.git_dir.mkdir()

    def test_reads_a_verified_object(self) -> None:
        text, _ = pointer_for(b"hello")
        store_object(self.git_dir, b"hello")
        self.assertEqual(git_lfs.resolve_content(text.encode(), self.git_dir), b"hello")

    def test_non_pointer_content_passes_through(self) -> None:
        self.assertEqual(git_lfs.resolve_content(b"plain", self.git_dir), b"plain")

    def test_missing_object(self) -> None:
        text, _ = pointer_for(b"hello")
        with self.assertRaises(git_lfs.LfsObjectMissing):
            git_lfs.resolve_content(text.encode(), self.git_dir)

    def test_truncated_object_is_corrupt(self) -> None:
        text, oid = pointer_for(b"hello")
        store_object(self.git_dir, b"hel", oid)
        with self.assertRaises(git_lfs.LfsObjectCorrupt):
            git_lfs.resolve_content(text.encode(), self.git_dir)

    def test_wrong_bytes_of_the_right_size_are_corrupt(self) -> None:
        text, oid = pointer_for(b"hello")
        store_object(self.git_dir, b"HELLO", oid)
        with self.assertRaises(git_lfs.LfsObjectCorrupt):
            git_lfs.resolve_content(text.encode(), self.git_dir)

    def test_too_large_is_refused_before_reading(self) -> None:
        text = POINTER.format(oid="a" * 64, size=60 * 1024 * 1024)
        with self.assertRaises(git_lfs.LfsObjectTooLarge) as caught:
            git_lfs.resolve_content(text.encode(), self.git_dir)
        self.assertEqual(caught.exception.size, 60 * 1024 * 1024)

    def test_no_limit_when_none(self) -> None:
        text, _ = pointer_for(b"hello")
        store_object(self.git_dir, b"hello")
        pointer = git_lfs.parse_pointer(text.encode())
        self.assertEqual(git_lfs.read_object(self.git_dir, pointer, max_bytes=None), b"hello")


class SpotsPointerFiles(TempRepoCase):
    def test_pointer_file_versus_content(self) -> None:
        text, _ = pointer_for(b"hello")
        (self.root / "ptr").write_text(text, encoding="utf-8", newline="")
        (self.root / "real").write_bytes(b"hello")
        self.assertTrue(git_lfs.is_pointer_file(self.root / "ptr"))
        self.assertFalse(git_lfs.is_pointer_file(self.root / "real"))
        self.assertFalse(git_lfs.is_pointer_file(self.root / "absent"))


class HydratesATree(TempRepoCase):
    def test_replaces_pointers_and_reports_the_missing(self) -> None:
        git_dir = self.root / "gd"
        git_dir.mkdir()
        have, _ = pointer_for(b"present")
        lack, _ = pointer_for(b"absent!")
        store_object(git_dir, b"present")
        tree = self.root / "tree"
        (tree / "sub").mkdir(parents=True)
        (tree / "sub" / "have.step").write_text(have, encoding="utf-8", newline="")
        (tree / "lack.step").write_text(lack, encoding="utf-8", newline="")
        (tree / "plain.txt").write_text("plain", encoding="utf-8")

        unresolved = git_lfs.hydrate_tree(tree, git_dir)

        self.assertEqual(unresolved, ["lack.step"])
        self.assertEqual((tree / "sub" / "have.step").read_bytes(), b"present")
        self.assertEqual((tree / "lack.step").read_text(), lack)
        self.assertEqual((tree / "plain.txt").read_text(), "plain")

    def test_fixes_a_git_archive_extraction(self) -> None:
        data = b"solid model"
        text, _ = pointer_for(data)
        repo = make_repo(self.root / "repo", {"3d/model.step": text, "a.txt": "plain"})
        store_object(repo / ".git", data)
        archive = git(repo, "archive", "--format=tar", "HEAD", binary=True)
        out = self.root / "out"
        out.mkdir()
        with tarfile.open(fileobj=io.BytesIO(archive)) as handle:
            handle.extractall(out, filter="data")
        self.assertEqual((out / "3d" / "model.step").read_text(), text)

        self.assertEqual(git_lfs.hydrate_tree(out, repo / ".git"), [])
        self.assertEqual((out / "3d" / "model.step").read_bytes(), data)


class HistoryEndpoints(TempRepoCase):
    def setUp(self) -> None:
        super().setUp()
        self.data = b"hello"
        self.text, self.oid = pointer_for(self.data)
        self.repo = make_repo(
            self.root / "repo", {"model.step": self.text, "a.txt": "plain"}
        )
        self.head = git(self.repo, "rev-parse", "HEAD").strip()

    def read(self, name: str = "model.step"):
        return file_service.read_file_from_commit(str(self.repo), self.head, name)

    def test_missing_object_is_a_404_that_names_lfs(self) -> None:
        with self.assertRaises(HTTPException) as caught:
            self.read()
        self.assertEqual(caught.exception.status_code, 404)
        self.assertIn("not been downloaded", caught.exception.detail)

    def test_corrupt_object_is_a_404_that_says_incomplete(self) -> None:
        store_object(self.repo / ".git", b"hel", self.oid)
        with self.assertRaises(HTTPException) as caught:
            self.read()
        self.assertEqual(caught.exception.status_code, 404)
        self.assertIn("incomplete", caught.exception.detail)

    def test_stored_object_is_returned(self) -> None:
        store_object(self.repo / ".git", self.data)
        self.assertEqual(self.read().content, self.data)
        self.assertEqual(self.read("a.txt").content, b"plain")

    def test_huge_file_is_a_413(self) -> None:
        huge = POINTER.format(oid="b" * 64, size=60 * 1024 * 1024)
        repo = make_repo(self.root / "huge", {"model.step": huge})
        head = git(repo, "rev-parse", "HEAD").strip()
        with self.assertRaises(HTTPException) as caught:
            file_service.read_file_from_commit(str(repo), head, "model.step")
        self.assertEqual(caught.exception.status_code, 413)


class CommitSnapshots(TempRepoCase):
    """The readers that copy a commit out of Git all see the LFS file, not the pointer."""

    SCHEMATIC = b"(kicad_sch (version 1))"
    MODEL = b"solid model"

    def setUp(self) -> None:
        super().setUp()
        sch_pointer, self.sch_oid = pointer_for(self.SCHEMATIC)
        model_pointer, self.model_oid = pointer_for(self.MODEL)
        self.model_pointer = model_pointer
        self.repo = make_repo(
            self.root / "repo",
            {
                "board.kicad_pro": "{}",
                "board.kicad_sch": sch_pointer,
                "board.kicad_pcb": "(kicad_pcb)",
                "3d/part.step": model_pointer,
            },
        )
        self.head = git(self.repo, "rev-parse", "HEAD").strip()
        self.out = self.root / "out"

    def store_schematic(self) -> None:
        store_object(self.repo / ".git", self.SCHEMATIC)

    def store_model(self) -> None:
        store_object(self.repo / ".git", self.MODEL)

    def test_semantic_archive_fills_in_stored_files(self) -> None:
        self.store_schematic()
        self.store_model()
        semantic_visualizer_service._archive_checkout(self.repo, self.head, self.out)
        self.assertEqual((self.out / "board.kicad_sch").read_bytes(), self.SCHEMATIC)
        self.assertEqual((self.out / "3d" / "part.step").read_bytes(), self.MODEL)

    def test_semantic_archive_keeps_a_missing_model_as_a_pointer(self) -> None:
        self.store_schematic()
        semantic_visualizer_service._archive_checkout(self.repo, self.head, self.out)
        self.assertEqual((self.out / "3d" / "part.step").read_text(), self.model_pointer)

    def test_semantic_archive_refuses_a_missing_kicad_source(self) -> None:
        with self.assertRaises(git_lfs.LfsSourcesUnavailable) as caught:
            semantic_visualizer_service._archive_checkout(self.repo, self.head, self.out)
        self.assertEqual(caught.exception.path, "board.kicad_sch")
        self.assertIn("Git LFS", str(caught.exception))

    def test_comparison_snapshot_fills_in_stored_sources(self) -> None:
        self.store_schematic()
        design_compare_service._snapshot_commit(self.repo, self.head, self.out, None)
        self.assertEqual((self.out / "board.kicad_sch").read_bytes(), self.SCHEMATIC)

    def test_comparison_snapshot_refuses_a_missing_source(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "Git LFS"):
            design_compare_service._snapshot_commit(self.repo, self.head, self.out, None)

    def test_variant_snapshot_fills_in_stored_sources(self) -> None:
        self.store_schematic()
        project_source_snapshot._checkout_sources(
            self.repo, self.head, self.out, "board.kicad_pro"
        )
        self.assertEqual((self.out / "board.kicad_sch").read_bytes(), self.SCHEMATIC)

    def test_variant_snapshot_refuses_a_missing_source(self) -> None:
        with self.assertRaises(git_lfs.LfsSourcesUnavailable):
            project_source_snapshot._checkout_sources(
                self.repo, self.head, self.out, "board.kicad_pro"
            )


if __name__ == "__main__":
    unittest.main()

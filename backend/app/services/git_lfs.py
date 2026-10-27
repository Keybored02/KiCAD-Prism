"""Git LFS pointers and the local LFS object store.

Git keeps an LFS file as a short pointer blob; the bytes live in
``<git dir>/lfs/objects``. Everything that reads a repository's history (the
file and history endpoints, comparison and semantic snapshots, Release Studio)
has to turn a pointer back into the file it names, and has to agree on what
happens when it cannot. This module is that one answer. It never contacts a
server: downloading is :mod:`git_checkout_service`'s job.

It imports nothing from the application, so Release Studio's closure and the
tests can use it against small local repositories.
"""

from __future__ import annotations

import hashlib
import os
import re
import stat
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

__all__ = [
    "LfsObjectCorrupt",
    "LfsObjectMissing",
    "LfsObjectTooLarge",
    "LfsObjectUnavailable",
    "KICAD_SOURCE_SUFFIXES",
    "LfsPointer",
    "LfsSourcesUnavailable",
    "MAX_HISTORY_LFS_BYTES",
    "common_git_dir",
    "hydrate_sources",
    "hydrate_tree",
    "is_pointer_file",
    "object_path",
    "parse_pointer",
    "read_object",
    "resolve_content",
]

POINTER_VERSION = "version https://git-lfs.github.com/spec/v1"
# A pointer is a few short lines; anything bigger is real content.
POINTER_MAX_BYTES = 1024
# History views read a file into memory per request; refuse to load a huge one.
MAX_HISTORY_LFS_BYTES = 50 * 1024 * 1024

# The files a build parses. A pointer in their place is an error to report, where
# a pointer standing in for a 3D model only costs the viewer a model.
KICAD_SOURCE_SUFFIXES = (".kicad_pro", ".kicad_sch", ".kicad_pcb", ".kicad_sym", ".kicad_mod")

_VERSION_BYTES = POINTER_VERSION.encode("ascii")
_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


@dataclass(frozen=True)
class LfsPointer:
    oid: str
    size: int


class LfsObjectUnavailable(Exception):
    """A committed LFS pointer whose file cannot be read from this server."""

    def __init__(self, oid: str, message: str) -> None:
        super().__init__(message)
        self.oid = oid


class LfsObjectMissing(LfsObjectUnavailable):
    """The object was never downloaded to this server."""

    def __init__(self, oid: str) -> None:
        super().__init__(oid, f"LFS object {oid[:12]} is not downloaded")


class LfsObjectCorrupt(LfsObjectUnavailable):
    """The stored object does not match its pointer."""

    def __init__(self, oid: str, reason: str) -> None:
        super().__init__(oid, f"LFS object {oid[:12]} {reason}")


class LfsObjectTooLarge(LfsObjectUnavailable):
    """The file is too big to read into memory for a history view."""

    def __init__(self, oid: str, size: int) -> None:
        super().__init__(oid, f"LFS object {oid[:12]} is {size} bytes")
        self.size = size


class LfsSourcesUnavailable(ValueError):
    """A KiCad source file is stored in Git LFS and its content is not on this server."""

    def __init__(self, path: str) -> None:
        super().__init__(
            f"{path} is stored in Git LFS and has not been downloaded to the server."
        )
        self.path = path


def parse_pointer(content: bytes, *, strict: bool = False) -> Optional[LfsPointer]:
    """Parse ``content`` as an LFS pointer, or return ``None`` when it is not one.

    A blob that starts like a pointer but is malformed is ordinary content to a
    history view, so the default is ``None``. Release Studio refuses such a
    file instead, and passes ``strict=True`` to get a ``ValueError`` for it.
    """
    if len(content) > POINTER_MAX_BYTES or not content.startswith(_VERSION_BYTES):
        return None
    try:
        return _parse_pointer_lines(content)
    except ValueError:
        if strict:
            raise
        return None


def _parse_pointer_lines(content: bytes) -> LfsPointer:
    try:
        lines = content.decode("ascii").splitlines()
    except UnicodeDecodeError:
        raise ValueError("malformed Git LFS pointer is not ASCII") from None
    if not lines or lines[0] != POINTER_VERSION:
        raise ValueError("malformed Git LFS pointer version")
    values: dict[str, str] = {}
    for line in lines[1:]:
        key, separator, value = line.partition(" ")
        if separator:
            values[key] = value
    oid = values.get("oid", "")
    if not oid.startswith("sha256:") or not _SHA256_RE.fullmatch(oid[7:]):
        raise ValueError("malformed Git LFS pointer oid")
    try:
        size = int(values["size"])
    except (KeyError, ValueError):
        raise ValueError("malformed Git LFS pointer size") from None
    if size < 0:
        raise ValueError("malformed Git LFS pointer has a negative size")
    return LfsPointer(oid=oid[7:], size=size)


def common_git_dir(repo_path: Path | str) -> Path:
    """The git directory that holds ``lfs/objects`` for the repository at ``repo_path``.

    A submodule's ``.git`` is a file pointing into the parent's ``modules``
    directory, and a linked worktree keeps its LFS objects in the common
    directory, so neither can be assumed to be ``repo_path / ".git"``.
    """
    root = Path(repo_path)
    git_path = root / ".git"
    if git_path.is_file():
        text = git_path.read_text(encoding="utf-8", errors="replace").strip()
        if text.startswith("gitdir:"):
            target = Path(text[len("gitdir:"):].strip())
            git_path = target if target.is_absolute() else (root / target).resolve()
    elif not git_path.exists():
        # A bare repository, or a path that already is the git directory.
        git_path = root
    common = git_path / "commondir"
    if common.is_file():
        target = Path(common.read_text(encoding="utf-8", errors="replace").strip())
        git_path = target if target.is_absolute() else (git_path / target).resolve()
    return git_path


def object_path(git_dir: Path | str, oid: str) -> Path:
    return Path(git_dir) / "lfs" / "objects" / oid[:2] / oid[2:4] / oid


def read_object(
    git_dir: Path | str, pointer: LfsPointer, *, max_bytes: Optional[int] = None
) -> bytes:
    """Read the object a pointer names, checking its size and sha256.

    Raises :class:`LfsObjectTooLarge` before reading when the pointer's size is
    past ``max_bytes``, :class:`LfsObjectMissing` when the store lacks the
    object, and :class:`LfsObjectCorrupt` when what is stored is not what the
    pointer promised, so a truncated download is never served as the file.
    """
    if max_bytes is not None and pointer.size > max_bytes:
        raise LfsObjectTooLarge(pointer.oid, pointer.size)
    try:
        content = object_path(git_dir, pointer.oid).read_bytes()
    except OSError:
        raise LfsObjectMissing(pointer.oid) from None
    if len(content) != pointer.size:
        raise LfsObjectCorrupt(pointer.oid, "has the wrong size")
    if hashlib.sha256(content).hexdigest() != pointer.oid:
        raise LfsObjectCorrupt(pointer.oid, "does not match its checksum")
    return content


def resolve_content(
    content: bytes, git_dir: Path | str, *, max_bytes: Optional[int] = MAX_HISTORY_LFS_BYTES
) -> bytes:
    """Swap a committed LFS pointer for the file it names.

    Returns ``content`` unchanged when it is not a pointer. Raises an
    :class:`LfsObjectUnavailable` subclass when it is one and the file cannot
    be read.
    """
    pointer = parse_pointer(content)
    if pointer is None:
        return content
    return read_object(git_dir, pointer, max_bytes=max_bytes)


def is_pointer_file(path: Path | str) -> bool:
    """Whether the file at ``path`` is an LFS pointer rather than its content."""
    try:
        with open(path, "rb") as handle:
            head = handle.read(POINTER_MAX_BYTES + 1)
    except OSError:
        return False
    return parse_pointer(head) is not None


def hydrate_tree(
    root: Path | str, git_dir: Path | str, *, max_bytes: Optional[int] = None
) -> list[str]:
    """Replace every pointer file under ``root`` with the file it names.

    For trees extracted by ``git archive``, which writes the pointer Git
    stores. Files whose object is not in the store are left as they are and
    returned, relative to ``root``, so the caller decides whether that is fatal.
    Symlinks are not followed.
    """
    base = Path(root)
    unresolved: list[str] = []
    for current, _dirs, names in os.walk(base):
        for name in names:
            path = Path(current) / name
            try:
                info = path.lstat()
            except OSError:
                continue
            if not stat.S_ISREG(info.st_mode) or info.st_size > POINTER_MAX_BYTES:
                continue
            try:
                pointer = parse_pointer(path.read_bytes())
            except OSError:
                continue
            if pointer is None:
                continue
            try:
                content = read_object(git_dir, pointer, max_bytes=max_bytes)
            except LfsObjectUnavailable:
                unresolved.append(path.relative_to(base).as_posix())
                continue
            path.write_bytes(content)
    return sorted(unresolved)


def hydrate_sources(
    root: Path | str,
    git_dir: Path | str,
    *,
    source_suffixes: tuple[str, ...] | frozenset[str] | set[str] = KICAD_SOURCE_SUFFIXES,
) -> list[str]:
    """:func:`hydrate_tree` for a snapshot that is about to be parsed.

    Pointers that name a file with one of ``source_suffixes`` raise
    :class:`LfsSourcesUnavailable`, so a build fails with a message about LFS
    rather than with a parser error on a pointer. Other unresolved files are
    returned and left as pointers.
    """
    unresolved = hydrate_tree(root, git_dir)
    suffixes = tuple(suffix.lower() for suffix in source_suffixes)
    for path in unresolved:
        if path.lower().endswith(suffixes):
            raise LfsSourcesUnavailable(path)
    return unresolved

"""The KiCad path variables a Prism process hands to KiCad, and the libraries behind them.

A board reaches files outside its repository through path variables such as
`${KICAD10_3DMODEL_DIR}` or `${LSF_KICAD_LIB}`. The image defines none of the
third-party ones and carries no stock 3D models, so an administrator declares
libraries in Settings (stored in ``ws_kicad_libraries``); the environment adds
one more, the stock 3D library, with `KICAD_3D_LIBRARY_ENABLED`. A git library
is cloned once, shallow, into the shared projects volume, so the API and every
worker see one copy; a path library is a folder under the mount root.

:func:`resolve` is the one answer to "which variable points where". A declared
library wins over a variable the environment already defines. Nothing here
writes `os.environ`: callers take :func:`environment` or :func:`resolve`.
"""

from __future__ import annotations

import logging
import os
import re
import shutil
import subprocess
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping

from app.core.config import settings

logger = logging.getLogger(__name__)

STOCK_REPOSITORY = "https://gitlab.com/kicad/libraries/kicad-packages3d.git"
STOCK_NAME = "kicad-packages3d"
STOCK_VARIABLES = ("KICAD9_3DMODEL_DIR", "KICAD10_3DMODEL_DIR")

_READY_MARKER = ".prism-ready"
_POLL_SECONDS = 10
# A clone that stops reporting progress is abandoned so another process can retry.
_STALE_LOCK_SECONDS = 15 * 60
# How long a process trusts the rows it read; a console edit reaches every process within this.
_ROWS_TTL_SECONDS = 5.0
_NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]*")
_VARIABLE = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


@dataclass(frozen=True, slots=True)
class Library:
    """One library: the variables it binds and where its files come from.

    A git library is cloned into ``directory`` (default
    ``.kicad-prism/libraries/<name>``); a path library is a folder under the
    mount root, named relative to it. ``subdir`` is the folder inside the clone
    the variables point at. ``locked`` marks the environment's own entry, which
    the console shows but cannot change.
    """

    name: str
    variables: tuple[str, ...]
    git: str = ""
    ref: str = ""
    subdir: str = ""
    path: str = ""
    directory: str = ""
    locked: bool = False

    @property
    def clone_dir(self) -> Path:
        return Path(self.directory).expanduser() if self.directory else libraries_root() / self.name

    @property
    def folder(self) -> Path:
        if self.path:
            return mount_root() / self.path
        return self.clone_dir / self.subdir if self.subdir else self.clone_dir

    @property
    def source(self) -> str:
        """What the library is, for its fingerprint: a different source or ref is a different library."""

        if self.path:
            return f"path:{self.path}"
        return f"{self.git}@{self.ref}#{self.subdir}"

    @property
    def ready(self) -> bool:
        if self.path:
            return bool(settings.PRISM_KICAD_LIBRARY_MOUNT_ROOT.strip()) and self.folder.is_dir()
        try:
            return (self.clone_dir / _READY_MARKER).read_text(encoding="utf-8").strip() == self.source
        except OSError:
            return False


@dataclass(frozen=True, slots=True)
class Resolution:
    """The variables that point at a ready library, and a fingerprint of each one's source."""

    variables: Mapping[str, str]
    fingerprints: Mapping[str, str]


def libraries_root() -> Path:
    return Path(settings.KICAD_PROJECTS_ROOT).expanduser() / ".kicad-prism" / "libraries"


def mount_root() -> Path:
    return Path(settings.PRISM_KICAD_LIBRARY_MOUNT_ROOT.strip()).expanduser()


def _preset() -> Library | None:
    if not settings.KICAD_3D_LIBRARY_ENABLED:
        return None
    return Library(
        name=STOCK_NAME,
        variables=STOCK_VARIABLES,
        git=STOCK_REPOSITORY,
        ref=settings.KICAD_3D_LIBRARY_REF.strip(),
        directory=settings.KICAD_3D_LIBRARY_DIR.strip(),
        locked=True,
    )


def validate_entry(raw: Any) -> Library:
    """A library from its declared fields, or ``ValueError`` saying what is wrong with them."""

    if not isinstance(raw, dict):
        raise ValueError("an entry must be an object")
    name = raw.get("name")
    if not isinstance(name, str) or not _NAME.fullmatch(name):
        raise ValueError("name must be letters, digits, '.', '_' or '-'")
    variables = raw.get("variables")
    if (
        not isinstance(variables, (list, tuple))
        or not variables
        or not all(isinstance(v, str) and _VARIABLE.fullmatch(v) for v in variables)
        or len(set(variables)) != len(variables)
    ):
        raise ValueError("variables must be a non-empty list of distinct variable names")
    git, path = raw.get("git") or None, raw.get("path") or None
    if (git is None) == (path is None):
        raise ValueError("give exactly one of git and path")
    if path is not None:
        if not isinstance(path, str) or not _relative(path):
            raise ValueError("path must be a folder inside the library mount root")
        return Library(name=name, variables=tuple(variables), path=path.strip().strip("/\\"))
    ref, subdir = raw.get("ref") or "", raw.get("subdir") or ""
    if not isinstance(git, str) or not git.strip().startswith("https://"):
        raise ValueError("a git library needs an https:// url")
    if not isinstance(ref, str) or not ref.strip() or ref.strip().startswith("-"):
        raise ValueError("a git library needs a tag or branch")
    if not isinstance(subdir, str) or (subdir and not _relative(subdir)):
        raise ValueError("subdir must be a relative folder inside the clone")
    return Library(
        name=name, variables=tuple(variables), git=git.strip(), ref=ref.strip(), subdir=subdir.strip().strip("/\\")
    )


def _relative(value: str) -> bool:
    """A folder named below its root: no leading separator, drive, or ``..``, whichever OS reads it."""

    text = value.strip()
    parts = text.replace(chr(92), "/").rstrip("/").split("/")
    return bool(text) and text[0] not in ("/", chr(92)) and ":" not in text and ".." not in parts and "" not in parts


_rows_lock = threading.Lock()
_rows_cache: tuple[float, list[dict[str, Any]]] | None = None


def declared_rows() -> list[dict[str, Any]]:
    """The administrator's libraries, as ``validate_entry`` takes them; read through a short cache.

    A database that cannot be reached leaves the last rows read in force, and none
    if there never were any, so a tool run is never blocked on it.
    """

    global _rows_cache
    now = time.monotonic()
    with _rows_lock:
        if _rows_cache is not None and now - _rows_cache[0] < _ROWS_TTL_SECONDS:
            return _rows_cache[1]
        try:
            from app.services import kicad_library_store

            rows = kicad_library_store.declared()
        except Exception as error:
            logger.warning("KiCad libraries: could not read the declared libraries: %s", error)
            rows = _rows_cache[1] if _rows_cache is not None else []
        _rows_cache = (now, rows)
        return rows


def forget_rows() -> None:
    """Drop the cached rows: the next read goes to the database."""

    global _rows_cache
    with _rows_lock:
        _rows_cache = None


def configured() -> tuple[tuple[Library, ...], list[str]]:
    """The libraries in force (the stock preset first), and why any declared one was left out."""

    entries: list[Library] = []
    problems: list[str] = []
    preset = _preset()
    if preset is not None:
        entries.append(preset)
    for raw in declared_rows():
        try:
            entries.append(validate_entry(raw))
        except ValueError as error:
            problems.append(f"library {raw.get('name', '?')!r}: {error}")
    kept: list[Library] = []
    names: set[str] = set()
    claimed: dict[str, str] = {}
    for library in entries:
        clash = next((v for v in library.variables if v in claimed), None)
        if library.name in names:
            problems.append(f"library {library.name!r} is declared twice; the later one is ignored")
        elif clash is not None:
            problems.append(
                f"library {library.name!r} binds {clash}, which {claimed[clash]!r} already binds; it is ignored"
            )
        else:
            kept.append(library)
            names.add(library.name)
            claimed.update({v: library.name for v in library.variables})
    return tuple(kept), problems


def resolve() -> Resolution:
    """The variables to bind now: a library still cloning binds nothing."""

    variables: dict[str, str] = {}
    fingerprints: dict[str, str] = {}
    for library in configured()[0]:
        if not library.ready:
            continue
        for name in library.variables:
            variables[name] = str(library.folder)
            fingerprints[name] = library.source
    return Resolution(variables, fingerprints)


def environment(base: Mapping[str, str] | None = None) -> dict[str, str]:
    """``base`` (default: this process's environment) with every ready library's variables over it."""

    env = dict(os.environ if base is None else base)
    env.update(resolve().variables)
    return env


# -- fetching ---------------------------------------------------------------


def _lock_path(library: Library) -> Path:
    return library.clone_dir.with_name(library.clone_dir.name + ".lock")


def _try_lock(lock: Path) -> bool:
    try:
        lock.parent.mkdir(parents=True, exist_ok=True)
        lock.mkdir()
        return True
    except FileExistsError:
        try:
            if time.time() - lock.stat().st_mtime > _STALE_LOCK_SECONDS:
                shutil.rmtree(lock, ignore_errors=True)
        except OSError:
            pass
        return False


def _clone(library: Library) -> None:
    directory = library.clone_dir
    partial = directory.with_name(directory.name + ".partial")
    shutil.rmtree(partial, ignore_errors=True)
    logger.info("Cloning %s (%s) into %s; this can take a while.", library.name, library.ref, directory)
    lock = _lock_path(library)
    process = subprocess.Popen(
        ["git", "clone", "--depth", "1", "--single-branch", "--branch", library.ref, "--progress", library.git, str(partial)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )
    assert process.stderr is not None
    tail = ""
    # git's progress keeps the lock fresh.
    for line in process.stderr:
        tail = line.strip() or tail
        try:
            os.utime(lock)
        except OSError:
            pass
    if process.wait() != 0:
        shutil.rmtree(partial, ignore_errors=True)
        raise RuntimeError(f"git clone failed: {tail}")
    if library.subdir and not (partial / library.subdir).is_dir():
        shutil.rmtree(partial, ignore_errors=True)
        raise RuntimeError(f"the clone has no folder {library.subdir!r}")
    shutil.rmtree(directory, ignore_errors=True)
    partial.rename(directory)
    (directory / _READY_MARKER).write_text(library.source + "\n", encoding="utf-8")


def _fetch_pending() -> None:
    reported: set[str] = set()
    while True:
        pending = [library for library in configured()[0] if library.git and not library.ready]
        if not pending:
            return
        for library in pending:
            lock = _lock_path(library)
            try:
                if not _try_lock(lock):
                    continue
                try:
                    _clone(library)
                    logger.info("%s is ready at %s.", library.name, library.folder)
                except Exception as error:
                    logger.error("Could not fetch %s: %s. Retrying later.", library.name, error)
                finally:
                    shutil.rmtree(lock, ignore_errors=True)
            except OSError as error:
                if library.name not in reported:
                    reported.add(library.name)
                    logger.error("Library %s is unavailable: %s", library.name, error)
        time.sleep(_POLL_SECONDS)


def start_in_background() -> threading.Thread | None:
    """Report the configuration's problems and fetch what is missing; never blocks startup."""

    libraries, problems = configured()
    for problem in problems:
        logger.warning("KiCad libraries: %s", problem)
    for library in libraries:
        if library.path and not library.ready:
            logger.warning("KiCad library %s: %s is not a folder.", library.name, library.folder)
    if not any(library.git for library in libraries):
        return None
    thread = threading.Thread(target=_fetch_pending, name="kicad-libraries", daemon=True)
    thread.start()
    return thread

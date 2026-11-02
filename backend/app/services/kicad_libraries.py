"""The KiCad path variables a Prism process hands to KiCad, and the libraries behind them.

A board reaches files outside its repository through path variables such as
`${KICAD10_3DMODEL_DIR}` or `${LSF_KICAD_LIB}`. The image defines none of the
third-party ones and carries no stock 3D models, so the admin declares
libraries (`PRISM_KICAD_LIBRARIES`, plus the stock preset
`KICAD_3D_LIBRARY_ENABLED`). A git library is cloned once, shallow, into the
shared projects volume, so the API and every worker see one copy.

:func:`resolve` is the one answer to "which variable points where". A declared
library wins over a variable the environment already defines. Nothing here
writes `os.environ`: callers take :func:`environment` or :func:`resolve`.
"""

from __future__ import annotations

import json
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
_NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]*")
_VARIABLE = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


@dataclass(frozen=True, slots=True)
class Library:
    """One declared library: the variables it binds and where its files come from.

    A git library is cloned into ``directory`` (default
    ``.kicad-prism/libraries/<name>``); a path library is a folder the operator
    mounted. ``subdir`` is the folder inside the clone the variables point at.
    """

    name: str
    variables: tuple[str, ...]
    git: str = ""
    ref: str = ""
    subdir: str = ""
    path: str = ""
    directory: str = ""

    @property
    def clone_dir(self) -> Path:
        return Path(self.directory).expanduser() if self.directory else libraries_root() / self.name

    @property
    def folder(self) -> Path:
        if self.path:
            return Path(self.path).expanduser()
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
            return self.folder.is_dir()
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


def _preset() -> Library | None:
    if not settings.KICAD_3D_LIBRARY_ENABLED:
        return None
    return Library(
        name=STOCK_NAME,
        variables=STOCK_VARIABLES,
        git=STOCK_REPOSITORY,
        ref=settings.KICAD_3D_LIBRARY_REF.strip(),
        directory=settings.KICAD_3D_LIBRARY_DIR.strip(),
    )


def _entry(raw: Any) -> Library:
    if not isinstance(raw, dict):
        raise ValueError("an entry must be an object")
    name = raw.get("name")
    if not isinstance(name, str) or not _NAME.fullmatch(name):
        raise ValueError("name must be letters, digits, '.', '_' or '-'")
    variables = raw.get("variables")
    if (
        not isinstance(variables, list)
        or not variables
        or not all(isinstance(v, str) and _VARIABLE.fullmatch(v) for v in variables)
    ):
        raise ValueError("variables must be a non-empty list of variable names")
    git, path = raw.get("git"), raw.get("path")
    if (git is None) == (path is None):
        raise ValueError("give exactly one of git and path")
    if path is not None:
        if not isinstance(path, str) or not path.strip():
            raise ValueError("path must be a folder")
        return Library(name=name, variables=tuple(variables), path=path.strip())
    ref, subdir = raw.get("ref", ""), raw.get("subdir", "")
    if not isinstance(git, str) or not git.strip() or not isinstance(ref, str) or not ref.strip():
        raise ValueError("a git library needs a url and a ref")
    if not isinstance(subdir, str) or Path(subdir).is_absolute() or ".." in Path(subdir).parts:
        raise ValueError("subdir must be a relative folder inside the clone")
    return Library(
        name=name, variables=tuple(variables), git=git.strip(), ref=ref.strip(), subdir=subdir.strip("/\\")
    )


def configured() -> tuple[tuple[Library, ...], list[str]]:
    """The libraries the configuration declares, and why any entry was left out."""

    entries: list[Library] = []
    problems: list[str] = []
    preset = _preset()
    if preset is not None:
        entries.append(preset)
    raw = settings.PRISM_KICAD_LIBRARIES.strip()
    if raw:
        try:
            declared = json.loads(raw)
            if not isinstance(declared, list):
                raise ValueError("expected a JSON list")
        except ValueError as error:
            problems.append(f"PRISM_KICAD_LIBRARIES is not a JSON list of libraries: {error}")
            declared = []
        for position, item in enumerate(declared, start=1):
            try:
                entries.append(_entry(item))
            except ValueError as error:
                problems.append(f"PRISM_KICAD_LIBRARIES entry {position}: {error}")
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

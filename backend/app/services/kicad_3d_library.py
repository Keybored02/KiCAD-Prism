"""KiCad's stock 3D model library, fetched at runtime when the operator asks for it.

The image does not carry kicad-packages3d (several GB). With
`KICAD_3D_LIBRARY_ENABLED` the first process to start clones it into
`KICAD_3D_LIBRARY_DIR` on the shared projects volume, so the API and every
worker see one copy. Each process then binds `KICAD9_3DMODEL_DIR` and
`KICAD10_3DMODEL_DIR` to it, which is how a board's
`${KICAD10_3DMODEL_DIR}/...` model paths resolve. Jobs started afterwards
inherit the variables.
"""

from __future__ import annotations

import logging
import os
import shutil
import subprocess
import threading
import time
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)

REPOSITORY_URL = "https://gitlab.com/kicad/libraries/kicad-packages3d.git"
VARIABLES = ("KICAD9_3DMODEL_DIR", "KICAD10_3DMODEL_DIR")

_READY_MARKER = ".prism-ready"
_POLL_SECONDS = 10
# A clone that stops reporting progress is abandoned so another process can retry.
_STALE_LOCK_SECONDS = 15 * 60


def library_dir() -> Path:
    configured = settings.KICAD_3D_LIBRARY_DIR.strip()
    if configured:
        return Path(configured).expanduser()
    return Path(settings.KICAD_PROJECTS_ROOT).expanduser() / ".kicad-prism" / "kicad-packages3d"


def is_ready(directory: Path | None = None) -> bool:
    return ((directory or library_dir()) / _READY_MARKER).is_file()


def bind_environment(directory: Path | None = None) -> list[str]:
    """Point the model variables at the library; a variable the operator set is left alone."""

    directory = directory or library_dir()
    bound = []
    for name in VARIABLES:
        if not os.environ.get(name):
            os.environ[name] = str(directory)
            bound.append(name)
    return bound


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


def _clone(directory: Path, ref: str) -> None:
    partial = directory.with_name(directory.name + ".partial")
    shutil.rmtree(partial, ignore_errors=True)
    logger.info("Cloning KiCad 3D models (%s) into %s; this takes a while.", ref, directory)
    # Progress keeps the lock fresh; git writes it to stderr as it goes.
    lock = directory.with_name(directory.name + ".lock")
    process = subprocess.Popen(
        ["git", "clone", "--depth", "1", "--single-branch", "--branch", ref, "--progress", REPOSITORY_URL, str(partial)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )
    assert process.stderr is not None
    tail = ""
    for line in process.stderr:
        tail = line.strip() or tail
        try:
            os.utime(lock)
        except OSError:
            pass
    if process.wait() != 0:
        shutil.rmtree(partial, ignore_errors=True)
        raise RuntimeError(f"git clone failed: {tail}")
    shutil.rmtree(directory, ignore_errors=True)
    partial.rename(directory)
    (directory / _READY_MARKER).write_text(ref + "\n", encoding="utf-8")


def _run() -> None:
    directory = library_dir()
    ref = settings.KICAD_3D_LIBRARY_REF.strip()
    lock = directory.with_name(directory.name + ".lock")
    while True:
        try:
            if is_ready(directory):
                bound = bind_environment(directory)
                if bound:
                    logger.info("KiCad 3D models at %s; set %s.", directory, ", ".join(bound))
                return
            if _try_lock(lock):
                try:
                    _clone(directory, ref)
                except Exception as error:
                    logger.error("Could not fetch the KiCad 3D models: %s. Retrying later.", error)
                finally:
                    shutil.rmtree(lock, ignore_errors=True)
                continue
        except OSError as error:
            logger.error("KiCad 3D model library unavailable: %s", error)
        time.sleep(_POLL_SECONDS)


def start_in_background() -> threading.Thread | None:
    """Fetch and bind the library when enabled; never blocks startup."""

    if not settings.KICAD_3D_LIBRARY_ENABLED:
        return None
    thread = threading.Thread(target=_run, name="kicad-3d-library", daemon=True)
    thread.start()
    return thread

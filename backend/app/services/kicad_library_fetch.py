"""Fetching and removing KiCad path libraries, as jobs.

A git library is a shallow clone under ``.kicad-prism/libraries``. The job system
gives one fetch per library at a time (a write lock on the library's name), retries,
cancellation, progress and logs; the clone itself is built beside its final place
and swapped in, and the ready marker is written last, so a library resolves only
once it is complete. Both jobs are idempotent: a fetch of a library that is
already ready, or a removal of one that is declared again, does nothing.
"""

from __future__ import annotations

import logging
import os
import re
import subprocess
import time
from pathlib import Path
from typing import Any, Callable

from app.services import kicad_libraries, kicad_library_store
from app.services.job_kinds import JobKind, JobSubject, subject_lock
from app.services.job_runtime import JobCancelled, JobContext, JobResult, RetryableJobError
from app.services.tree_removal import remove_tree

logger = logging.getLogger(__name__)

FETCH_KIND = "kicad_library_fetch"
REMOVE_KIND = "kicad_library_remove"
# After the interactive work and before the tracker's background polling.
PRIORITY = 200

# git writes "Receiving objects:  45% (...)" and the like to stderr as it goes.
_PHASES = (("Receiving objects", 0, 85), ("Resolving deltas", 85, 90), ("Updating files", 90, 100))
_PERCENT = re.compile(r"^(?P<phase>[A-Za-z ]+):\s+(?P<percent>\d+)%")
# Cancellation is checked this often while git runs.
_CANCEL_CHECK_SECONDS = 2.0
_CHECK_TIMEOUT_SECONDS = 20
# The console lists this many of a repository's tags and branches.
_MAX_LISTED = 100


def progress_of(line: str) -> int | None:
    """Overall percent for one line of git's progress output, or None for any other line."""

    match = _PERCENT.match(line.strip())
    if match is None:
        return None
    for phase, start, end in _PHASES:
        if match["phase"] == phase:
            return start + (end - start) * int(match["percent"]) // 100
    return None


def clone(
    library: kicad_libraries.Library,
    *,
    on_progress: Callable[[int], None] = lambda percent: None,
    on_tick: Callable[[], None] = lambda: None,
) -> int:
    """Clone ``library`` into its folder and mark it ready; returns its size in bytes.

    ``on_tick`` runs between git's output lines and may raise to stop the clone.
    """

    directory = library.clone_dir
    partial = directory.with_name(directory.name + ".partial")
    remove_tree(partial, ignore_errors=True)
    directory.parent.mkdir(parents=True, exist_ok=True)
    process = subprocess.Popen(
        ["git", "clone", "--depth", "1", "--single-branch", "--branch", library.ref, "--progress", library.git, str(partial)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
        env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
    )
    assert process.stderr is not None
    tail, last = "", -1
    try:
        for line in process.stderr:
            tail = line.strip() or tail
            on_tick()
            percent = progress_of(line)
            if percent is not None and percent != last:
                last = percent
                on_progress(percent)
        if process.wait() != 0:
            raise RuntimeError(f"git clone failed: {tail}")
        if library.subdir and not (partial / library.subdir).is_dir():
            raise RuntimeError(f"the clone has no folder {library.subdir!r}")
    except BaseException:
        process.kill()
        process.wait()
        remove_tree(partial, ignore_errors=True)
        raise
    remove_tree(directory, ignore_errors=True)
    partial.rename(directory)
    (directory / kicad_libraries._READY_MARKER).write_text(library.source + "\n", encoding="utf-8")
    return folder_size(directory)


def folder_size(directory: Path) -> int:
    total = 0
    for root, _dirs, files in os.walk(directory):
        for name in files:
            try:
                total += os.lstat(os.path.join(root, name)).st_size
            except OSError:
                pass
    return total


def _library(name: str) -> kicad_libraries.Library | None:
    kicad_libraries.forget_rows()
    return next((library for library in kicad_libraries.configured()[0] if library.name == name), None)


def run_fetch_job(context: JobContext) -> JobResult:
    name = str(context.payload.get("name") or "")
    library = _library(name)
    if library is None or not library.git:
        return JobResult(message=f"{name} is no longer a git library")
    if library.ready:
        kicad_library_store.record_fetch(name, state="ready", progress=100, error=None)
        return JobResult(message=f"{name} is ready")
    kicad_library_store.record_fetch(name, state="fetching", progress=0, error=None)
    checked = [time.monotonic()]

    def on_tick() -> None:
        if time.monotonic() - checked[0] >= _CANCEL_CHECK_SECONDS:
            checked[0] = time.monotonic()
            context.check_cancelled()

    def on_progress(percent: int) -> None:
        context.progress(stage="fetching", message=f"Fetching {name}", percent=percent)
        kicad_library_store.record_fetch(name, state="fetching", progress=percent)

    try:
        size = clone(library, on_progress=on_progress, on_tick=on_tick)
    except JobCancelled:
        kicad_library_store.record_fetch(name, state="failed", error="Cancelled")
        raise
    except Exception as error:
        kicad_library_store.record_fetch(name, state="failed", error=str(error)[:500])
        raise RetryableJobError(str(error)) from error
    kicad_library_store.record_fetch(name, state="ready", progress=100, size_bytes=size, error=None)
    logger.info("%s is ready at %s (%s bytes)", name, library.folder, size)
    return JobResult(message=f"Fetched {name}", details={"sizeBytes": size})


def run_remove_job(context: JobContext) -> JobResult:
    name = str(context.payload.get("name") or "")
    directory = Path(str(context.payload.get("directory") or ""))
    if not name or not str(directory):
        return JobResult(message="Nothing to remove")
    if _library(name) is not None:
        return JobResult(message=f"{name} is declared again; kept")
    root = kicad_libraries.libraries_root().resolve()
    target = directory.resolve()
    if target == root or root not in target.parents:
        # Only what Prism cloned is Prism's to delete.
        return JobResult(message=f"{directory} is outside the libraries folder; kept")
    for leftover in (target, target.with_name(target.name + ".partial")):
        remove_tree(leftover, ignore_errors=True)
    return JobResult(message=f"Removed {name}")


def _subject(name: str) -> JobSubject:
    return JobSubject(lock_key=f"kicad-library:{name}")


def request_fetch(name: str, *, requested_by: str = "") -> dict[str, Any]:
    """Queue a fetch of ``name``; safe to repeat, the job does nothing once the library is ready."""

    return FETCH.enqueue({"name": name}, subject=_subject(name), requested_by=requested_by)


def request_removal(library: kicad_libraries.Library, *, requested_by: str = "") -> dict[str, Any] | None:
    """Queue the deletion of a removed library's clone; a path library leaves its folder alone."""

    if not library.git:
        return None
    return REMOVE.enqueue(
        {"name": library.name, "directory": str(library.clone_dir)},
        subject=_subject(library.name),
        requested_by=requested_by,
    )


def check_remote(url: str, ref: str = "") -> dict[str, Any]:
    """Whether ``url`` answers as a git repository, its tags and branches, and whether ``ref`` is one of them.

    For the console's form: an administrator sees a wrong address or ref before saving.
    """

    url = url.strip()
    if not url.startswith("https://"):
        return {"reachable": False, "error": "Only https:// repositories are supported"}
    try:
        done = subprocess.run(
            ["git", "ls-remote", "--symref", "--", url, "HEAD", "refs/tags/*", "refs/heads/*"],
            capture_output=True,
            text=True,
            timeout=_CHECK_TIMEOUT_SECONDS,
            env={**os.environ, "GIT_TERMINAL_PROMPT": "0"},
        )
    except subprocess.TimeoutExpired:
        return {"reachable": False, "error": f"No answer within {_CHECK_TIMEOUT_SECONDS} seconds"}
    except OSError as error:
        return {"reachable": False, "error": f"git could not run: {error}"}
    if done.returncode != 0:
        lines = [line.strip() for line in done.stderr.splitlines() if line.strip()]
        return {"reachable": False, "error": (lines[-1] if lines else "git ls-remote failed")[:300]}
    tags, branches, default = [], [], None
    for line in done.stdout.splitlines():
        first, _, name = line.partition(chr(9))
        if first.startswith("ref: refs/heads/") and name == "HEAD":
            default = first.removeprefix("ref: refs/heads/")
        elif name.endswith("^{}"):
            continue  # a tag's peeled commit; the tag itself is already listed
        elif name.startswith("refs/tags/"):
            tags.append(name.removeprefix("refs/tags/"))
        elif name.startswith("refs/heads/"):
            branches.append(name.removeprefix("refs/heads/"))
    # Newest tag first (10 before 9), numbered releases before named ones, the default branch before the others.
    tags.sort(key=lambda name: (name[:1].isdigit(), _version_order(name)), reverse=True)
    branches.sort(key=lambda name: (name != default, name))
    ref = ref.strip()
    return {
        "reachable": True,
        "defaultBranch": default,
        "tags": tags[:_MAX_LISTED],
        "branches": branches[:_MAX_LISTED],
        "refFound": (ref in tags or ref in branches) if ref else None,
    }


def _version_order(name: str) -> list[tuple[int, int | str]]:
    """A sort key that reads digit runs as numbers: 10.0.4 after 9.0.9."""

    key: list[tuple[int, int | str]] = [
        (0, int(part)) if part.isdigit() else (1, part) for part in re.split(r"(\d+)", name) if part
    ]
    # A release sorts after its own pre-releases: 10.0.8 is newer than 10.0.8-rc1.
    return [*key, (2, "")]


def queue_missing() -> list[str]:
    """Queue a fetch for every git library that is not ready; returns their names. For startup."""

    queued = []
    kicad_libraries.forget_rows()
    libraries, problems = kicad_libraries.configured()
    for problem in problems:
        logger.warning("KiCad libraries: %s", problem)
    for library in libraries:
        if library.path and not library.ready:
            logger.warning("KiCad library %s: %s is not a folder.", library.name, library.folder)
        if library.git and not library.ready:
            request_fetch(library.name, requested_by="startup")
            queued.append(library.name)
    return queued


FETCH = JobKind(FETCH_KIND, run_fetch_job, lock=subject_lock("write"), priority=PRIORITY, max_attempts=3)
REMOVE = JobKind(REMOVE_KIND, run_remove_job, lock=subject_lock("write"), priority=PRIORITY, max_attempts=2)
JOB_KINDS = (FETCH, REMOVE)

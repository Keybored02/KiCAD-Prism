"""Git LFS for Prism-managed checkouts.

A plain ``git clone`` or ``merge --ff-only`` leaves LFS-tracked files as small
pointer files. Release Studio refuses to build from them, and the viewers cannot
parse a pointer. This module downloads them after the clone or fast-forward.

Downloads happen here and nowhere else. Every other checkout command runs with
``GIT_LFS_SKIP_SMUDGE``, and the image installs LFS with ``--skip-smudge``, so
the deployment's LFS mode and size limit always apply.

The module does not import the application config or the import service, so it
can be tested against small local repositories. Callers pass in the base
environment and the LFS settings.
"""

from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable, Optional

__all__ = [
    "CheckoutReport",
    "LfsObjectMissing",
    "LfsObjectTooLarge",
    "LfsSettings",
    "describe_failure",
    "hardened_env",
    "hydrate_checkout",
    "lfs_available",
    "resolve_lfs_content",
    "tracks_lfs",
]

COMMAND_TIMEOUT_SECONDS = 1800
# History views read a file into memory per request; refuse to load a huge one.
MAX_HISTORY_LFS_BYTES = 50 * 1024 * 1024

LFS_AUTO = "auto"
LFS_OFF = "off"
LFS_POINTERS_ONLY = "pointers-only"

ProgressCallback = Callable[[str], None]


@dataclass(frozen=True)
class LfsSettings:
    mode: str = LFS_AUTO
    # Megabytes; 0 means no limit.
    max_mb: int = 0


@dataclass
class CheckoutReport:
    """What hydration did, in a form a job result and the UI can carry."""

    uses_lfs: bool = False
    # ok | not-used | disabled | unavailable | too-large | partial
    lfs_status: str = "not-used"
    lfs_missing: int = 0
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "uses_lfs": self.uses_lfs,
            "lfs_status": self.lfs_status,
            "lfs_missing": self.lfs_missing,
            "warnings": list(self.warnings),
        }


def hardened_env(base: dict) -> dict:
    """Return ``base`` with the settings every checkout command must run under.

    ``GIT_LFS_SKIP_SMUDGE`` keeps clone, checkout and merge from downloading LFS
    files implicitly, so the size limit and the off switch are decided in one
    place (:func:`_hydrate_lfs`) rather than by whichever command touched the
    tree first.
    """
    env = dict(base)
    env["GIT_LFS_SKIP_SMUDGE"] = "1"
    return env


def _run(
    args: list[str],
    *,
    cwd: Path | str,
    env: dict,
    check: bool = True,
    timeout: int = COMMAND_TIMEOUT_SECONDS,
) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args],
        cwd=str(cwd),
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        check=check,
    )


def describe_failure(error: Exception) -> str:
    if isinstance(error, subprocess.CalledProcessError):
        text = (error.stderr or error.stdout or "").strip()
        if text:
            return text.splitlines()[-1][:300]
    if isinstance(error, subprocess.TimeoutExpired):
        return "timed out"
    return str(error)[:300] or error.__class__.__name__


def lfs_available(env: dict) -> bool:
    try:
        _run(["lfs", "version"], cwd=".", env=env)
    except (OSError, subprocess.SubprocessError):
        return False
    return True


# --- LFS pointers in history -------------------------------------------------

_LFS_POINTER_PREFIX = b"version https://git-lfs.github.com/spec/v1"
_LFS_POINTER_MAX_BYTES = 1024
_LFS_OID_RE = re.compile(rb"^oid sha256:(?P<oid>[0-9a-f]{64})$", re.MULTILINE)
_LFS_SIZE_RE = re.compile(rb"^size (?P<size>\d+)$", re.MULTILINE)


class LfsObjectMissing(Exception):
    """A committed LFS pointer whose file was never downloaded to this server."""

    def __init__(self, oid: str) -> None:
        super().__init__(f"LFS object {oid[:12]} is not downloaded")
        self.oid = oid


class LfsObjectTooLarge(Exception):
    """A committed LFS file too big to read into memory for a history view."""

    def __init__(self, size: int) -> None:
        super().__init__(f"LFS object is {size} bytes")
        self.size = size


def resolve_lfs_content(content: bytes, git_dir: Path | str) -> bytes:
    """Swap a committed LFS pointer for the file it names.

    History readers see the blob Git stores, which for an LFS file is a short
    pointer. Returns ``content`` unchanged when it is not a pointer, and raises
    :class:`LfsObjectMissing` when it is one but the object is not in the
    repository's LFS store, and :class:`LfsObjectTooLarge` past
    ``MAX_HISTORY_LFS_BYTES``. Never contacts a server: history views must stay
    fast, and download policy belongs to import and sync.
    """
    if len(content) > _LFS_POINTER_MAX_BYTES or not content.startswith(_LFS_POINTER_PREFIX):
        return content
    match = _LFS_OID_RE.search(content)
    if not match:
        return content
    oid = match["oid"].decode("ascii")
    size_match = _LFS_SIZE_RE.search(content)
    if size_match and int(size_match["size"]) > MAX_HISTORY_LFS_BYTES:
        raise LfsObjectTooLarge(int(size_match["size"]))
    stored = Path(git_dir) / "lfs" / "objects" / oid[:2] / oid[2:4] / oid
    try:
        return stored.read_bytes()
    except OSError:
        raise LfsObjectMissing(oid) from None


# --- hydration --------------------------------------------------------------


def _lfs_files(worktree: Path, env: dict) -> Optional[list[dict]]:
    """LFS files the tree tracks, or ``None`` when the query itself failed."""
    try:
        result = _run(["lfs", "ls-files", "--json"], cwd=worktree, env=env)
        return list(json.loads(result.stdout or "{}").get("files") or [])
    except (OSError, subprocess.SubprocessError, ValueError):
        return None


def tracks_lfs(worktree: Path | str, env: dict, *, ref: Optional[str] = None) -> bool:
    """Whether any ``.gitattributes`` in the tree routes files through LFS.

    This works without ``git-lfs`` installed, which is the case that matters:
    a deployment missing the binary should say so rather than hand out pointers.
    ``ref`` searches a commit instead of the worktree, for no-checkout clones.
    """
    args = ["grep", "-l", "-e", "filter=lfs"]
    if ref:
        args.append(ref)
    args += ["--", ":(glob)**/.gitattributes"]
    try:
        result = _run(args, cwd=worktree, env=env, check=False)
    except (OSError, subprocess.SubprocessError):
        return False
    return result.returncode == 0 and bool(result.stdout.strip())


def _hydrate_lfs(
    worktrees: Iterable[Path],
    *,
    env: dict,
    lfs: LfsSettings,
    report: CheckoutReport,
    progress: Optional[ProgressCallback],
    check_cancelled: Optional[Callable[[], None]],
) -> None:
    tracking = [tree for tree in worktrees if tracks_lfs(tree, env)]
    if not tracking:
        return
    report.uses_lfs = True

    if lfs.mode != LFS_AUTO:
        report.lfs_status = "disabled"
        if lfs.mode == LFS_OFF:
            report.warnings.append(
                "This repository uses Git LFS, which is turned off on this server. "
                "LFS files are left as pointers."
            )
        return
    if not lfs_available(env):
        report.lfs_status = "unavailable"
        report.warnings.append(
            "This repository uses Git LFS, but git-lfs is not installed on the server."
        )
        return

    pull_env = {key: value for key, value in env.items() if key != "GIT_LFS_SKIP_SMUDGE"}

    if lfs.max_mb > 0:
        total_bytes = 0
        for tree in tracking:
            files = _lfs_files(tree, env) or []
            total_bytes += sum(
                int(item.get("size") or 0) for item in files if not item.get("downloaded")
            )
        if total_bytes > lfs.max_mb * 1024 * 1024:
            report.lfs_status = "too-large"
            report.lfs_missing = sum(
                len([f for f in (_lfs_files(tree, env) or []) if not f.get("checkout")])
                for tree in tracking
            )
            report.warnings.append(
                f"LFS files total {total_bytes // (1024 * 1024)} MB, over the "
                f"{lfs.max_mb} MB limit. They are left as pointers."
            )
            return

    failed = False
    for tree in tracking:
        if check_cancelled:
            check_cancelled()
        if progress:
            progress("Downloading LFS files")
        try:
            _run(["lfs", "pull"], cwd=tree, env=pull_env)
        except (OSError, subprocess.SubprocessError) as error:
            failed = True
            report.warnings.append(f"LFS download failed: {describe_failure(error)}")

    missing = 0
    for tree in tracking:
        files = _lfs_files(tree, env)
        if files is not None:
            missing += len([item for item in files if not item.get("checkout")])
    report.lfs_missing = missing
    if failed or missing:
        report.lfs_status = "partial"
        if missing and not failed:
            report.warnings.append(f"{missing} LFS file(s) were not downloaded.")
    else:
        report.lfs_status = "ok"


def hydrate_checkout(
    repo_path: Path | str,
    *,
    env: dict,
    lfs: LfsSettings,
    progress: Optional[ProgressCallback] = None,
    check_cancelled: Optional[Callable[[], None]] = None,
) -> CheckoutReport:
    """Bring a checkout's LFS files up to date.

    Never raises for a remote or transport failure: a repository that imported
    is still worth having with some files missing, and the report says what is
    missing. Cancellation propagates.
    """
    report = CheckoutReport()
    _hydrate_lfs(
        [Path(repo_path)],
        env=hardened_env(env),
        lfs=lfs,
        report=report,
        progress=progress,
        check_cancelled=check_cancelled,
    )
    return report

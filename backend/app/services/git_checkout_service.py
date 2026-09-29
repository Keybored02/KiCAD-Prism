"""Submodules and Git LFS for Prism-managed checkouts.

A plain ``git clone`` or ``merge --ff-only`` leaves two kinds of content
unusable: submodule directories stay empty, and LFS-tracked files stay as small
pointer files. Release Studio refuses to build from either, and the viewers
cannot parse a pointer. This module fills both in, after the clone or
fast-forward, without ever discarding local work.

Both features make the remote's contents choose more remotes to contact. A
``.gitmodules`` URL is attacker-controlled input, so every one goes through the
deployment's remote policy before Git sees it, and the file and ``ext``
transports are switched off for every command as a second layer.

The module does not import the application config or the import service, so it
can be tested against small local repositories. Callers pass in the base
environment, the URL policy and the LFS settings.
"""

from __future__ import annotations

import json
import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable, Optional

from app.services.git_remote_url import RemoteUrlPolicy, RemoteUrlError, parse_remote_url

__all__ = [
    "CheckoutReport",
    "LfsSettings",
    "Submodule",
    "hardened_env",
    "hydrate_checkout",
    "describe_failure",
    "fetch_tree_only",
    "lfs_available",
    "list_gitlinks",
    "tracks_lfs",
    "vet_submodule",
    "read_submodules",
    "resolve_submodule_url",
]

# Nested submodules are followed, but not without limit: a hostile repository can
# chain them, and each level is another remote to contact.
MAX_SUBMODULE_DEPTH = 4
COMMAND_TIMEOUT_SECONDS = 1800

LFS_AUTO = "auto"
LFS_OFF = "off"
LFS_POINTERS_ONLY = "pointers-only"

_GITLINK_MODE = "160000"
_SUBMODULE_KEY_RE = re.compile(r"^submodule\.(?P<name>.+)\.(?P<key>path|url)$")

ProgressCallback = Callable[[str], None]


@dataclass(frozen=True)
class LfsSettings:
    mode: str = LFS_AUTO
    # Megabytes; 0 means no limit.
    max_mb: int = 0


@dataclass(frozen=True)
class Submodule:
    name: str
    path: str
    url: str


@dataclass
class CheckoutReport:
    """What hydration did, in a form a job result and the UI can carry."""

    submodules_total: int = 0
    submodules_initialized: int = 0
    # Each entry is {"path": ..., "reason": ...}.
    submodules_skipped: list[dict] = field(default_factory=list)
    uses_lfs: bool = False
    # ok | not-used | disabled | unavailable | too-large | partial | failed
    lfs_status: str = "not-used"
    lfs_missing: int = 0
    warnings: list[str] = field(default_factory=list)

    @property
    def has_submodules(self) -> bool:
        return self.submodules_total > 0

    def to_dict(self) -> dict:
        return {
            "has_submodules": self.has_submodules,
            "submodules_total": self.submodules_total,
            "submodules_initialized": self.submodules_initialized,
            "submodules_skipped": list(self.submodules_skipped),
            "uses_lfs": self.uses_lfs,
            "lfs_status": self.lfs_status,
            "lfs_missing": self.lfs_missing,
            "warnings": list(self.warnings),
        }


def hardened_env(base: dict) -> dict:
    """Return ``base`` with the settings every checkout command must run under.

    ``GIT_LFS_SKIP_SMUDGE`` keeps clone and checkout from downloading LFS files
    implicitly, so the size limit and the off switch are decided in one place
    (:func:`_hydrate_lfs`) rather than by whichever command touched the tree
    first. The file and ``ext`` transports are refused because a submodule URL
    can name them.
    """
    env = dict(base)
    env["GIT_LFS_SKIP_SMUDGE"] = "1"
    try:
        index = int(env.get("GIT_CONFIG_COUNT", "0") or "0")
    except ValueError:
        index = 0
    for key in ("protocol.file.allow", "protocol.ext.allow"):
        env[f"GIT_CONFIG_KEY_{index}"] = key
        env[f"GIT_CONFIG_VALUE_{index}"] = "never"
        index += 1
    env["GIT_CONFIG_COUNT"] = str(index)
    return env


def _run(
    args: list[str],
    *,
    cwd: Path | str,
    env: dict,
    check: bool = True,
) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args],
        cwd=str(cwd),
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=COMMAND_TIMEOUT_SECONDS,
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


# --- .gitmodules ------------------------------------------------------------


def _parse_gitmodules(text: str) -> list[Submodule]:
    """Parse ``git config --list -z`` style output for a ``.gitmodules`` file."""
    entries: dict[str, dict[str, str]] = {}
    for record in text.split("\0"):
        if not record:
            continue
        key, _, value = record.partition("\n")
        match = _SUBMODULE_KEY_RE.match(key)
        if match:
            entries.setdefault(match["name"], {})[match["key"]] = value
    return [
        Submodule(name=name, path=values["path"], url=values["url"])
        for name, values in entries.items()
        if values.get("path") and values.get("url")
    ]


def read_submodules(repo_path: Path | str, env: dict, *, ref: Optional[str] = None) -> list[Submodule]:
    """Read ``.gitmodules`` from the worktree, or from ``ref`` when given.

    Reading from a ref works in a no-checkout clone, which is what analysis has.
    """
    args = ["config", "-z", "--list"]
    if ref:
        # `--blob` reads the file straight from the object database.
        args += ["--blob", f"{ref}:.gitmodules"]
    else:
        args += ["-f", ".gitmodules"]
        if not (Path(repo_path) / ".gitmodules").is_file():
            return []
    try:
        result = _run(args, cwd=repo_path, env=env)
    except subprocess.CalledProcessError:
        return []
    return _parse_gitmodules(result.stdout)


def list_gitlinks(repo_path: Path | str, env: dict, *, ref: str = "HEAD") -> dict[str, str]:
    """Map each submodule path in ``ref``'s tree to the commit it pins."""
    try:
        result = _run(["ls-tree", "-r", "-z", ref], cwd=repo_path, env=env)
    except subprocess.CalledProcessError:
        return {}
    links: dict[str, str] = {}
    for record in result.stdout.split("\0"):
        meta, _, path = record.partition("\t")
        parts = meta.split()
        if len(parts) == 3 and parts[0] == _GITLINK_MODE and path:
            links[path] = parts[2]
    return links


def resolve_submodule_url(parent_url: str, submodule_url: str) -> str:
    """Resolve a ``../``-relative submodule URL against its parent's remote.

    Git resolves these itself at ``submodule init``. Discovery has to do the same
    to know what to contact. Only the ``../`` form is supported; ``./`` is
    ambiguous across Git versions and is rejected.
    """
    if not submodule_url.startswith("../"):
        if submodule_url.startswith("./"):
            raise RemoteUrlError("Relative submodule URLs starting with './' are not supported.")
        return submodule_url
    base = parent_url.rstrip("/")
    remainder = submodule_url
    sep = "/"
    while remainder.startswith("../"):
        remainder = remainder[3:]
        # A colon separates host from path only in scp-like `git@host:org/repo`.
        colon = base.rfind(":") if "://" not in base else -1
        cut = max(base.rfind("/"), colon)
        # Never climb past the host: `https://host` and `git@host` end here.
        if cut <= 0 or base[:cut].endswith(("/", ":")):
            raise RemoteUrlError("Relative submodule URL climbs above the repository host.")
        sep = base[cut]
        base = base[:cut]
    if not remainder or ".." in remainder.split("/"):
        raise RemoteUrlError("Relative submodule URL is malformed.")
    return f"{base}{sep}{remainder}"


def _submodule_path_is_safe(path: str) -> bool:
    parts = path.split("/")
    return bool(path) and not path.startswith("/") and ".." not in parts and ".git" not in parts


def vet_submodule(
    parent_url: str, submodule: Submodule, policy: RemoteUrlPolicy
) -> Optional[str]:
    """Return why ``submodule`` may not be fetched, or ``None`` when it may."""
    if not _submodule_path_is_safe(submodule.path):
        return "unsafe path"
    try:
        resolved = resolve_submodule_url(parent_url, submodule.url) if parent_url else submodule.url
        parse_remote_url(resolved, policy)
    except RemoteUrlError as error:
        return str(error)
    return None


def fetch_tree_only(dest: Path | str, url: str, commit: str, env: dict) -> str:
    """Fetch just the tree of ``commit`` from ``url`` into a new bare repository.

    Depth one and no blobs: enough to list file names, cheap against a large
    library. Returns the ref to list. Servers that refuse to serve an arbitrary
    commit fall back to the remote's default branch, which is close enough to
    tell whether the submodule holds a KiCad project.
    """
    target = Path(dest)
    target.mkdir(parents=True, exist_ok=True)
    _run(["init", "-q", "--bare"], cwd=target, env=env)
    _run(["remote", "add", "origin", url], cwd=target, env=env)
    base = ["fetch", "-q", "--depth", "1", "--filter=blob:none", "origin"]
    try:
        _run([*base, commit], cwd=target, env=env)
        return "FETCH_HEAD"
    except subprocess.CalledProcessError:
        _run([*base, "HEAD"], cwd=target, env=env)
        return "FETCH_HEAD"


# --- hydration --------------------------------------------------------------


def _hydrate_submodules(
    repo_path: Path,
    parent_url: str,
    *,
    env: dict,
    policy: RemoteUrlPolicy,
    report: CheckoutReport,
    depth: int,
    prefix: str,
    progress: Optional[ProgressCallback],
    check_cancelled: Optional[Callable[[], None]],
) -> list[Path]:
    """Initialise the submodules of one repository; return their worktrees."""
    submodules = read_submodules(repo_path, env)
    report.submodules_total += len(submodules)
    worktrees: list[Path] = []
    for submodule in submodules:
        if check_cancelled:
            check_cancelled()
        shown = f"{prefix}{submodule.path}"
        if depth > MAX_SUBMODULE_DEPTH:
            report.submodules_skipped.append({"path": shown, "reason": "nested too deeply"})
            continue
        reason = vet_submodule(parent_url, submodule, policy)
        if reason:
            report.submodules_skipped.append({"path": shown, "reason": reason})
            report.warnings.append(f"Skipped submodule {shown}: {reason}")
            continue
        if progress:
            progress(f"Fetching submodule {shown}")
        try:
            _run(["submodule", "sync", "--", submodule.path], cwd=repo_path, env=env)
            _run(["submodule", "update", "--init", "--", submodule.path], cwd=repo_path, env=env)
        except (OSError, subprocess.SubprocessError) as error:
            report.submodules_skipped.append({"path": shown, "reason": describe_failure(error)})
            report.warnings.append(f"Could not fetch submodule {shown}: {describe_failure(error)}")
            continue
        report.submodules_initialized += 1
        worktree = repo_path / submodule.path
        worktrees.append(worktree)
        try:
            child_url = resolve_submodule_url(parent_url, submodule.url) if parent_url else submodule.url
        except RemoteUrlError:
            child_url = ""
        worktrees.extend(
            _hydrate_submodules(
                worktree,
                child_url,
                env=env,
                policy=policy,
                report=report,
                depth=depth + 1,
                prefix=f"{shown}/",
                progress=progress,
                check_cancelled=check_cancelled,
            )
        )
    return worktrees


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
    parent_url: str,
    env: dict,
    policy: RemoteUrlPolicy,
    lfs: LfsSettings,
    progress: Optional[ProgressCallback] = None,
    check_cancelled: Optional[Callable[[], None]] = None,
) -> CheckoutReport:
    """Bring submodules and LFS files in a checkout up to date.

    Never raises for a remote or transport failure: a repository that imported
    is still worth having with one missing library, and the report says what is
    missing. Cancellation propagates.
    """
    root = Path(repo_path)
    report = CheckoutReport()
    safe_env = hardened_env(env)

    submodule_trees = _hydrate_submodules(
        root,
        parent_url,
        env=safe_env,
        policy=policy,
        report=report,
        depth=1,
        prefix="",
        progress=progress,
        check_cancelled=check_cancelled,
    )
    _hydrate_lfs(
        [root, *submodule_trees],
        env=safe_env,
        lfs=lfs,
        report=report,
        progress=progress,
        check_cancelled=check_cancelled,
    )
    return report

"""Read-only Git lookups on a child project's server clone (§1 invariant 7).

System Builder never fetches or writes here; the clone is kept current by the
existing project sync. Every ref and commit a caller supplies is validated
before it reaches ``git`` so it cannot be read as an option.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path
from typing import Any, Optional

_SHA_PREFIX = re.compile(r"^[0-9a-f]{7,40}$")
_REF_CHARS = re.compile(r"^[A-Za-z0-9._/+-]+$")


class SourceError(ValueError):
    """The ref or commit is malformed, or the clone cannot answer."""


def valid_tracked_ref(ref: str) -> str:
    """A branch name as ``git check-ref-format --branch`` would accept it, restricted.

    The allowed alphabet is narrower than Git's, which only costs exotic
    branch names and keeps shell and option syntax out entirely.
    """

    ref = (ref or "").strip()
    if (
        not ref
        or len(ref) > 200
        or not _REF_CHARS.match(ref)
        or ref.startswith(("-", "/", "."))
        or ref.endswith(("/", ".", ".lock"))
        or ".." in ref
        or "//" in ref
        or "/." in ref
        or ref == "HEAD"
    ):
        raise SourceError("trackedRef is not a valid branch name")
    return ref


def _git(repo: Path, *args: str) -> Optional[str]:
    try:
        result = subprocess.run(
            ["git", "-C", str(repo), *args],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
            timeout=30,
        )
    except subprocess.TimeoutExpired:
        raise SourceError("the project repository did not answer in time") from None
    return result.stdout.strip() if result.returncode == 0 else None


def repo_root(project: Any) -> Path:
    path = Path(str(getattr(project, "path", "") or ""))
    if not path.is_dir():
        raise SourceError("project source is not available")
    root = _git(path, "rev-parse", "--show-toplevel")
    if not root:
        raise SourceError("project is not inside a git repository")
    return Path(root)


def resolve_tracked_ref(project: Any, ref: str) -> Optional[str]:
    """The commit ``origin/<ref>`` points at, else local ``<ref>``, else ``None``.

    Remote-tracking refs are what project sync updates, so they are the
    canonical tip; a clone without fetched remotes falls back to its branches,
    like ``git_service.get_branches``.
    """

    ref = valid_tracked_ref(ref)
    root = repo_root(project)
    for full in (f"refs/remotes/origin/{ref}", f"refs/heads/{ref}"):
        sha = _git(root, "rev-parse", "--verify", "--quiet", f"{full}^{{commit}}")
        if sha:
            return sha
    return None


def resolve_commit(project: Any, commit: str) -> Optional[str]:
    """Expand a commit SHA (or unambiguous prefix) that exists in the clone."""

    commit = (commit or "").strip().lower()
    if not _SHA_PREFIX.match(commit):
        raise SourceError("commit must be a hexadecimal SHA")
    return _git(repo_root(project), "rev-parse", "--verify", "--quiet", f"{commit}^{{commit}}")

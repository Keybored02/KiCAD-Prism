"""Machine-side project knowledge: what project is this path, and what's its git state.

Deliberately shells out to `git` rather than depending on GitPython. The agent
should run on a plain Python with no install step, and every machine that has a
KiCad project checked out already has git.
"""

from __future__ import annotations

import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

# Files that identify a KiCad project root.
PROJECT_GLOBS = ("*.kicad_pro", "*.kicad_pcb", "*.kicad_sch")


def _run_git(repo: Path, *args: str, strip: bool = True) -> str:
    """Run git in `repo` and return stdout. Raises on failure.

    `strip=False` for output whose leading whitespace is significant, porcelain
    status is column-oriented (" M file" means modified-but-unstaged), so
    stripping it shifts every field and eats the first character of the path.
    """
    kwargs = {}
    if sys.platform == "win32":
        # Don't flash a console window when the agent runs windowless.
        kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW  # type: ignore[attr-defined]
    out = subprocess.run(
        ["git", "-C", str(repo), *args],
        capture_output=True,
        text=True,
        check=True,
        timeout=20,
        **kwargs,
    )
    return out.stdout.strip() if strip else out.stdout


@dataclass
class GitStatus:
    branch: str = ""
    # True when HEAD points at a commit rather than a branch, which is the normal state
    # after opening a specific revision. `branch` is empty then, and `on_branches` says
    # which branches contain the commit: that is what the user still thinks of themselves
    # as being on, and it is what makes a detached HEAD legible instead of alarming.
    detached: bool = False
    on_branches: list[str] = field(default_factory=list)
    # The tip of the branch we are parked on, when detached. Shown beside the current
    # commit: two rows that differ say "you are behind" without a paragraph saying it.
    tip_commit: str = ""
    tip_commit_hash: str = ""
    ahead: int = 0
    behind: int = 0
    staged: list[str] = field(default_factory=list)
    modified: list[str] = field(default_factory=list)
    untracked: list[str] = field(default_factory=list)
    last_commit: str = ""
    last_commit_hash: str = ""
    remote_url: str = ""
    # Who git will attribute a commit to here. Not the same person as the Prism user,
    # and when they disagree that is worth being able to see.
    user_name: str = ""
    user_email: str = ""

    @property
    def dirty(self) -> bool:
        """Does git see anything uncommitted? Including generated churn.

        The guards need this: git refuses a checkout over an untracked file the target
        has, and it does not care that the file is a cache.
        """
        return bool(self.staged or self.modified or self.untracked)

    @property
    def yours(self) -> list[str]:
        """The uncommitted paths that are the USER's work, not KiCad's churn.

        A KiCad project with no .gitignore is permanently "dirty": fp-info-cache, lock
        files, backups and fetched libraries are all regenerated and never committed.
        Reporting those as "you have uncommitted changes" is crying wolf, and the user
        learns to ignore the warning for the one time it matters.

        The UI counts this. The guards still use `dirty`, because git blocks on a lock
        file just as readily as on a board.
        """
        from .worktree_diff import _is_noise

        return [
            p
            for p in (*self.staged, *self.modified, *self.untracked)
            if not _is_noise(p)
        ]

    def to_dict(self) -> dict:
        d = self.__dict__.copy()
        d["dirty"] = self.dirty
        d["yours"] = self.yours
        d["dirty_by_you"] = bool(self.yours)
        return d


@dataclass
class Project:
    """A KiCad project on this machine."""

    name: str
    path: str  # project directory
    repo_root: str  # git root (may be an ancestor, for monorepos)
    pro_file: str = ""

    def to_dict(self) -> dict:
        return self.__dict__.copy()


def find_repo_root(start: Path) -> Path | None:
    """Nearest enclosing git repo, or None."""
    try:
        root = _run_git(start, "rev-parse", "--show-toplevel")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError):
        return None
    return Path(root) if root else None


def identify_project(path: str | Path) -> Project | None:
    """Resolve any path inside a KiCad project (a board file, or the folder) to
    the project itself. Returns None if it doesn't look like one."""
    p = Path(path).expanduser().resolve()
    directory = p if p.is_dir() else p.parent
    if not directory.is_dir():
        return None

    pro = next(iter(sorted(directory.glob("*.kicad_pro"))), None)
    has_design = pro is not None or any(
        next(iter(directory.glob(g)), None) for g in PROJECT_GLOBS
    )
    if not has_design:
        return None

    root = find_repo_root(directory)
    return Project(
        name=(pro.stem if pro else directory.name),
        path=str(directory),
        repo_root=str(root) if root else "",
        pro_file=str(pro) if pro else "",
    )


def git_status(repo_root: str | Path) -> GitStatus:
    """Branch, divergence and working-tree state for a repo."""
    repo = Path(repo_root)
    st = GitStatus()
    if not repo.is_dir():
        return st

    try:
        st.branch = _run_git(repo, "rev-parse", "--abbrev-ref", "HEAD")
    except Exception:
        return st  # not a repo / no commits yet, an empty status is the truth

    if st.branch == "HEAD":
        # Detached: rev-parse returns the literal string "HEAD", which is not a branch
        # and must never be shown as one. This is the normal state after opening a
        # commit, so the UI needs to say WHICH commit rather than pretend nothing
        # changed or blank the whole thing out.
        st.detached = True
        st.branch = ""
        # Which branches contain this commit. That is what the user still thinks of
        # themselves as being "on", and it is what makes a detached HEAD legible
        # instead of alarming.
        try:
            containing = _run_git(
                repo, "branch", "--contains", "HEAD", "--format=%(refname:short)"
            )
            st.on_branches = [b for b in containing.splitlines() if b and "(" not in b]
        except Exception:
            pass

        # The tip of that branch: what you would be on if you were not parked here.
        # Showing it next to the current commit says "you are behind" without a
        # sentence of explanation, because the two rows differing IS the explanation.
        if st.on_branches:
            try:
                st.tip_commit_hash = _run_git(
                    repo, "log", "-1", "--format=%h", st.on_branches[0]
                )
                st.tip_commit = _run_git(
                    repo, "log", "-1", "--format=%s", st.on_branches[0]
                )
            except Exception:
                pass

    # Porcelain v1, NUL-separated: XY <path>\0.
    #
    # `-z` matters, it is not a nicety. Without it git QUOTES any path containing a
    # space ("~Git test.kicad_pcb.lck"), and the quotes travel into every consumer: the
    # noise classifier then fails to match its own patterns and calls KiCad's lock files
    # the user's work. -z gives the raw bytes and no quoting at all.
    try:
        raw = _run_git(repo, "status", "--porcelain", "-z", strip=False)
        entries = [e for e in raw.split("\0") if e]
        i = 0
        while i < len(entries):
            entry = entries[i]
            i += 1
            if len(entry) < 4:
                continue
            code, name = entry[:2], entry[3:]
            # A rename/copy emits its original path as the next entry, unprefixed.
            if code[0] in ("R", "C") or code[1] in ("R", "C"):
                i += 1
            if code == "??":
                st.untracked.append(name)
                continue
            if code[0] not in " ?":
                st.staged.append(name)
            if code[1] not in " ?":
                st.modified.append(name)
    except Exception:
        pass

    # Divergence from the tracking branch (absent if there's no upstream).
    try:
        counts = _run_git(repo, "rev-list", "--left-right", "--count", "@{u}...HEAD")
        behind, ahead = counts.split()
        st.behind, st.ahead = int(behind), int(ahead)
    except Exception:
        pass

    try:
        st.last_commit_hash = _run_git(repo, "log", "-1", "--format=%h")
        st.last_commit = _run_git(repo, "log", "-1", "--format=%s")
    except Exception:
        pass

    # Who a commit from here would be attributed to. Resolved the way git itself does
    # (repo config over global), so it is what would actually be written.
    try:
        st.user_name = _run_git(repo, "config", "user.name")
        st.user_email = _run_git(repo, "config", "user.email")
    except Exception:
        pass

    try:
        st.remote_url = _run_git(repo, "remote", "get-url", "origin")
    except Exception:
        pass

    return st

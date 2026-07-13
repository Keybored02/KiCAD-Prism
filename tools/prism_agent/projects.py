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
    ahead: int = 0
    behind: int = 0
    staged: list[str] = field(default_factory=list)
    modified: list[str] = field(default_factory=list)
    untracked: list[str] = field(default_factory=list)
    last_commit: str = ""
    last_commit_hash: str = ""
    remote_url: str = ""

    @property
    def dirty(self) -> bool:
        return bool(self.staged or self.modified or self.untracked)

    def to_dict(self) -> dict:
        d = self.__dict__.copy()
        d["dirty"] = self.dirty
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

    # Porcelain v1 is stable and trivial to parse: XY <path>. It is *column*
    # oriented, so the output must not be stripped (see _run_git).
    try:
        for line in _run_git(repo, "status", "--porcelain", strip=False).splitlines():
            if not line.strip():
                continue
            code, name = line[:2], line[3:]
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

    try:
        st.remote_url = _run_git(repo, "remote", "get-url", "origin")
    except Exception:
        pass

    return st

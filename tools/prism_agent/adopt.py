"""Publishing a KiCad project that is not in Prism yet.

The on-ramp. Someone has a board in a folder, and either it is not a git repo at all or
it is one with no remote. Until now Prism had nothing useful to say to them: it only
served people who had already solved hosting themselves, which is the smaller half of
the audience.

This runs in the AGENT, not the server, and that is the whole point. The server cannot
read a folder on somebody else's laptop, so it cannot adopt one. The agent is on the
machine that has the files, so it can:

    1. git init + .gitignore + first commit   (only if the folder is not a repo yet)
    2. ask the server to reserve an empty hosted repo, and hand back its URL
    3. git remote add origin <url>, git push
    4. tell the server the push landed, so it can clone and render the board

Step 1 is the one to be careful with. `git add -A` on somebody's project folder is how
you commit 3 GB of build output and a private key, so we write a KiCad .gitignore first
and we show the user exactly what will be committed before committing anything.
"""

from __future__ import annotations

import logging
import subprocess
from pathlib import Path

log = logging.getLogger(__name__)

PUSH_TIMEOUT = 900

# Last-resort .gitignore, used only if the shared one cannot be loaded.
#
# The real one lives in the backend's kicad_noise_service, beside the patterns it
# mirrors, and rides along with the module the agent already loads for noise
# classification (see worktree_diff). This copy exists so a broken load degrades to a
# workable ignore file rather than to none at all: a project published with no
# .gitignore commits its own backups forever, and that is not recoverable by editing a
# file later.
_FALLBACK_GITIGNORE = """\
# KiCad-Prism
*-backups/
*.kicad_pcb-bak
*.kicad_sch-bak
*.bak
_autosave-*
*.lck
~*.lck
fp-info-cache
*-cache.lib
*-cache.dcm
RemoteLibrary/
"""


def gitignore() -> str:
    """The KiCad .gitignore to write. Shared with the backend so the file we write and
    the filter the history uses cannot disagree about what counts as churn."""
    from .worktree_diff import _load_noise_classifier

    mod = _load_noise_classifier()
    text = getattr(mod, "GITIGNORE", "") if mod else ""
    if not text:
        log.warning("Using the fallback .gitignore; the shared one wasn't loadable")
        return _FALLBACK_GITIGNORE
    return text


class AdoptError(Exception):
    """Couldn't publish the project, with a reason worth showing."""


def _git(args: list[str], cwd: Path, timeout: int = 60) -> str:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=str(cwd),
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (OSError, subprocess.SubprocessError) as exc:
        raise AdoptError(f"Couldn't run git: {exc}") from exc
    if result.returncode != 0:
        detail = (result.stderr or result.stdout or "").strip().splitlines()
        raise AdoptError(detail[-1] if detail else "git failed")
    return result.stdout


def status(project_dir: str | Path) -> dict:
    """What would publishing this folder involve?

    Lets the UI say the right thing before the user commits to anything:

        is_repo     already a git repo
        has_commits has history (an initialised repo with nothing in it does not)
        has_origin  already has a remote, so it is not ours to take over
        will_commit the files a first commit would include
    """
    path = Path(project_dir)
    is_repo = (path / ".git").is_dir()

    if not is_repo:
        return {
            "is_repo": False,
            "has_commits": False,
            "has_origin": False,
            "origin": "",
            "will_commit": _would_commit(path),
        }

    has_commits = True
    try:
        _git(["rev-parse", "--verify", "HEAD"], path)
    except AdoptError:
        has_commits = False

    origin = ""
    try:
        origin = _git(["remote", "get-url", "origin"], path).strip()
    except AdoptError:
        pass

    return {
        "is_repo": True,
        "has_commits": has_commits,
        "has_origin": bool(origin),
        "origin": origin,
        "will_commit": [] if has_commits else _would_commit(path),
    }


def _would_commit(path: Path) -> list[str]:
    """The files a first commit would take, with the KiCad .gitignore applied.

    Shown to the user BEFORE anything is committed. Committing on someone's behalf
    without telling them what is in it is how a private key ends up in a repo's history
    forever, and "trust me" is not good enough for a list the user cannot see.

    Asks git rather than reimplementing .gitignore matching, which is a genuinely subtle
    format and one we would get wrong. `git ls-files --others --exclude-standard` reads
    the .gitignore we are about to write, so the answer is exactly what `git add -A`
    would then stage. In a folder that is not a repo yet, git still answers if we point
    it at a scratch index.
    """
    ignore = path / ".gitignore"
    wrote_ignore = False
    try:
        if not ignore.exists():
            ignore.write_text(gitignore(), encoding="utf-8")
            wrote_ignore = True

        env = {"GIT_DIR": str(path / ".git"), "GIT_WORK_TREE": str(path)}
        if not (path / ".git").is_dir():
            # Not a repo. Give git a throwaway git-dir so it can still apply the
            # ignore rules, and leave nothing behind.
            import os
            import tempfile

            with tempfile.TemporaryDirectory() as scratch:
                env = dict(os.environ, GIT_DIR=scratch, GIT_WORK_TREE=str(path))
                subprocess.run(
                    ["git", "init", "--bare", scratch],
                    capture_output=True,
                    timeout=60,
                    check=False,
                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
                )
                return _ls_others(path, env)

        return _ls_others(path, None)
    except (OSError, subprocess.SubprocessError):
        return []
    finally:
        if wrote_ignore:
            try:
                ignore.unlink()
            except OSError:
                pass


def _ls_others(path: Path, env: dict | None) -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "--others", "--exclude-standard"],
        cwd=str(path),
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
        env=env,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    if result.returncode != 0:
        return []
    files = [line for line in result.stdout.splitlines() if line]
    # Drop the .gitignore we may have just written to run this check. It is ours, not
    # the user's content, and counting it would make an empty folder look like it had
    # something worth committing.
    files = [f for f in files if f != ".gitignore"]
    # Capped: a project with 10,000 files should not blow up a dialog. The count is
    # what matters to the user, and the UI shows that separately.
    return sorted(files)[:500]


def initialise(project_dir: str | Path, author: str = "") -> None:
    """Make the folder a git repo with one commit, writing a KiCad .gitignore first.

    The .gitignore comes BEFORE the add, which is the whole point: without it the first
    commit sweeps up backups, autosaves, lock files and caches, and every diff after
    that is noise.
    """
    path = Path(project_dir)
    if not path.is_dir():
        raise AdoptError(f"{path} is not a folder.")

    # Check there is something worth committing BEFORE writing anything. Otherwise the
    # .gitignore we add is itself the only staged file, and we would happily create a
    # project whose entire history is a .gitignore and no board.
    if not status(path)["will_commit"]:
        raise AdoptError("There is nothing to commit in this folder.")

    if not (path / ".git").is_dir():
        _git(["init", "-b", "main"], path)

    ignore = path / ".gitignore"
    if not ignore.exists():
        ignore.write_text(gitignore(), encoding="utf-8")

    _git(["add", "-A"], path)

    staged = _git(["diff", "--cached", "--name-only"], path).strip()
    if not staged:
        raise AdoptError("There is nothing to commit in this folder.")

    _git(["commit", "-m", "Add project to Prism"], path)
    log.info("Initialised %s", path)


def publish(project_dir: str | Path, origin_url: str) -> None:
    """Point the folder at a Prism-hosted origin and push into it.

    The tree is not moved and not converted. It gains a remote, and its history lands in
    the bare repo Prism reserved. That is the whole of "adoption" from the client side.
    """
    path = Path(project_dir)

    existing = ""
    try:
        existing = _git(["remote", "get-url", "origin"], path).strip()
    except AdoptError:
        pass
    if existing and existing != origin_url:
        raise AdoptError(
            f"This folder already pushes to {existing}. Adopting would replace it."
        )
    if not existing:
        _git(["remote", "add", "origin", origin_url], path)

    branch = _git(["rev-parse", "--abbrev-ref", "HEAD"], path).strip() or "main"
    _git(["push", "-u", "origin", branch], path, timeout=PUSH_TIMEOUT)
    log.info("Pushed %s to %s", path, origin_url)

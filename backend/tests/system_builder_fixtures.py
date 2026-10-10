"""Access to the System Builder fixture boards (SYS-01).

The fixture sources are per-step snapshots under
``fixtures/system_builder/sources/<board>/<step>/``. Drift and detection tests
need them as Git history, so ``build_fixture_repo`` turns one board into a
repository: ``main`` holds F0, and every other step is a branch with one commit
on top of F0 (``step/F11`` carries two). Author, committer and dates are fixed,
so the same sources always produce the same commit SHAs.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "fixtures" / "system_builder"
SOURCES = ROOT / "sources"
EVIDENCE = ROOT / "evidence"
BOARDS = ("mini_obc", "mini_payload", "mini_power")

_GIT_ENV = {
    "GIT_AUTHOR_NAME": "Prism Fixture",
    "GIT_AUTHOR_EMAIL": "fixture@prism.invalid",
    "GIT_COMMITTER_NAME": "Prism Fixture",
    "GIT_COMMITTER_EMAIL": "fixture@prism.invalid",
    "GIT_CONFIG_GLOBAL": os.devnull,
    "GIT_CONFIG_SYSTEM": os.devnull,
}


def load_json(name: str) -> dict:
    return json.loads((ROOT / name).read_text(encoding="utf-8"))


def fixture_system() -> dict:
    return load_json("system.json")


def expected_steps() -> dict:
    return load_json("expected/steps.json")


def manifest() -> dict:
    return load_json("manifest.json")


def snapshots(board: str) -> list[str]:
    """Snapshot names for a board, F0 first, then natural order."""

    def order(name: str) -> tuple[int, int]:
        step, _, commit = name[1:].partition(".")
        return int(step), int(commit or 0)

    return sorted((p.name for p in (SOURCES / board).iterdir() if p.is_dir()), key=order)


def snapshot_dir(board: str, snapshot: str) -> Path:
    return SOURCES / board / snapshot


def _git(repo: Path, *args: str, date: str | None = None) -> str:
    env = {**os.environ, **_GIT_ENV}
    if date is not None:
        env["GIT_AUTHOR_DATE"] = env["GIT_COMMITTER_DATE"] = date
    result = subprocess.run(
        ["git", *args], cwd=repo, env=env, check=True, capture_output=True, text=True
    )
    return result.stdout.strip()


def _replace_tree(repo: Path, source: Path) -> None:
    for entry in repo.iterdir():
        if entry.name != ".git":
            shutil.rmtree(entry) if entry.is_dir() else entry.unlink()
    for item in source.iterdir():
        shutil.copy2(item, repo / item.name)


def build_fixture_repo(board: str, destination: Path) -> dict[str, str]:
    """Create ``destination`` as a Git repository for ``board``.

    Returns ``{snapshot: commit_sha}``. ``main`` points at F0; step ``Fn`` is on
    branch ``step/Fn``. Multi-commit steps (``F11.1``, ``F11.2``) share branch
    ``step/F11`` in order.
    """

    destination.mkdir(parents=True, exist_ok=False)
    _git(destination, "init", "--quiet", "--initial-branch=main")
    commits: dict[str, str] = {}
    ordered = snapshots(board)
    for index, snapshot in enumerate(ordered):
        step = snapshot.partition(".")[0]
        if snapshot == "F0":
            pass
        elif snapshot.endswith(".1") or "." not in snapshot:
            _git(destination, "checkout", "--quiet", "-b", f"step/{step}", commits["F0"])
        _replace_tree(destination, snapshot_dir(board, snapshot))
        # Hash every file again: Git's stat cache can take a replaced file for
        # the old one (same size and mtime, and Linux may reuse the inode), and
        # commit the previous step's content. F11.1 and F11.2 differ only in
        # same-length net names.
        _git(destination, "read-tree", "--empty")
        _git(destination, "add", "--all")
        _git(
            destination, "commit", "--quiet", "--allow-empty", "-m", f"{board} {snapshot}",
            date=f"2026-09-27T12:{index:02d}:00+00:00",
        )
        commits[snapshot] = _git(destination, "rev-parse", "HEAD")
    _git(destination, "checkout", "--quiet", "main")
    return commits

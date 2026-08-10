"""Publishing a KiCad folder that is not in Prism yet: the on-ramp.

Runs in the agent, because the agent is on the machine that has the files. The server
cannot adopt a folder on somebody else's laptop, so it offers an empty origin and we
push into it.

The dangerous direction here is the first commit. `git add -A` on somebody's project
folder is how you commit 3 GB of build output and a private key, so most of these tests
are about what does and does not end up in it, and about never touching a folder that
already belongs to another remote.
"""

import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent import adopt  # noqa: E402
from prism_agent.adopt import AdoptError  # noqa: E402


def git(*args, cwd, check=True):
    return subprocess.run(
        ["git", *args], cwd=str(cwd), capture_output=True, text=True, check=check
    )


@pytest.fixture
def board(tmp_path):
    """A KiCad project folder with no git, and some noise in it."""
    path = tmp_path / "widget"
    path.mkdir()
    (path / "widget.kicad_pro").write_text("{}")
    (path / "widget.kicad_pcb").write_text("(kicad_pcb)")
    (path / "widget.kicad_prl").write_text("noise")
    (path / "widget-backups").mkdir()
    (path / "widget-backups" / "old.zip").write_text("noise")
    (path / "fp-info-cache").write_text("noise")
    return path


def committed(path: Path) -> list[str]:
    out = git("ls-tree", "-r", "--name-only", "HEAD", cwd=path).stdout
    return sorted(line for line in out.splitlines() if line)


# -- what a first commit would take ----------------------------------------


def test_the_preview_excludes_kicad_noise(board):
    """Shown to the user BEFORE anything is committed. Backups, autosaves, lock files
    and caches are churn: they make every diff noisy and say nothing about the board."""
    files = adopt.status(board)["will_commit"]
    assert "widget.kicad_pro" in files
    assert "widget.kicad_pcb" in files
    assert not any("prl" in f or "backups" in f or "fp-info-cache" in f for f in files)
    # The .gitignore we write is ours, not the user's content. Listing it would pad the
    # preview and, worse, make an empty folder look like it had something to commit.
    assert ".gitignore" not in files


def test_the_preview_leaves_no_gitignore_behind(board):
    """status() is read-only. It writes a .gitignore to ask git what would be ignored,
    and must clean up after itself: a folder the user only *looked* at must be
    unchanged."""
    before = sorted(p.name for p in board.iterdir())
    adopt.status(board)
    assert sorted(p.name for p in board.iterdir()) == before


def test_the_preview_reports_a_plain_folder_as_not_a_repo(board):
    state = adopt.status(board)
    assert state["is_repo"] is False
    assert state["has_commits"] is False
    assert state["has_origin"] is False


# -- initialising ----------------------------------------------------------


def test_initialise_commits_the_board_and_not_the_noise(board):
    adopt.initialise(board)
    files = committed(board)
    assert "widget.kicad_pro" in files
    assert "widget.kicad_pcb" in files
    assert ".gitignore" in files
    assert not any("prl" in f or "backups" in f or "fp-info-cache" in f for f in files)


def test_initialise_writes_the_gitignore_before_adding(board):
    """The order matters. Without the .gitignore first, `git add -A` sweeps up every
    backup and autosave, and they are in the history forever."""
    adopt.initialise(board)
    ignored = (board / ".gitignore").read_text()
    for pattern in ("*-backups/", "*.kicad_prl", "*.lck", "RemoteLibrary/"):
        assert pattern in ignored


def test_initialise_leaves_a_working_tree_not_a_bare_repo(board):
    adopt.initialise(board)
    out = git("rev-parse", "--is-bare-repository", cwd=board).stdout.strip()
    assert out == "false"


def test_initialise_respects_a_gitignore_the_user_already_wrote(board):
    """Their file, their call. Overwriting it to impose ours would be rude and could
    start committing something they deliberately excluded."""
    (board / ".gitignore").write_text("*.kicad_pcb\n")
    adopt.initialise(board)
    assert (board / ".gitignore").read_text() == "*.kicad_pcb\n"
    assert "widget.kicad_pcb" not in committed(board)


def test_initialising_an_empty_folder_is_refused(tmp_path):
    empty = tmp_path / "nothing"
    empty.mkdir()
    with pytest.raises(AdoptError, match="nothing to commit"):
        adopt.initialise(empty)


def test_initialise_is_safe_on_a_repo_that_already_has_commits(board):
    adopt.initialise(board)
    first = git("rev-parse", "HEAD", cwd=board).stdout.strip()
    # A second call has nothing to stage, so it refuses rather than making an empty
    # commit. The history is untouched.
    with pytest.raises(AdoptError):
        adopt.initialise(board)
    assert git("rev-parse", "HEAD", cwd=board).stdout.strip() == first


# -- publishing ------------------------------------------------------------


def test_publish_points_the_folder_at_prism_and_pushes(board, tmp_path):
    origin = tmp_path / "hosted.git"
    git("init", "--bare", str(origin), cwd=tmp_path)

    adopt.initialise(board)
    adopt.publish(board, str(origin))

    assert git("remote", "get-url", "origin", cwd=board).stdout.strip() == str(origin)
    # The history really landed.
    assert git("rev-parse", "--verify", "HEAD", cwd=origin).returncode == 0
    # And the user's folder is still their folder.
    assert (board / "widget.kicad_pro").is_file()
    assert git("rev-parse", "--is-bare-repository", cwd=board).stdout.strip() == "false"


def test_publishing_a_folder_that_already_has_an_origin_is_refused(board, tmp_path):
    """It already pushes somewhere. Silently repointing it would disconnect the user
    from the upstream they actually collaborate through."""
    adopt.initialise(board)
    git("remote", "add", "origin", "https://github.com/x/y", cwd=board)

    with pytest.raises(AdoptError, match="already pushes to"):
        adopt.publish(board, str(tmp_path / "hosted.git"))

    # Their remote is untouched.
    assert (
        git("remote", "get-url", "origin", cwd=board).stdout.strip()
        == "https://github.com/x/y"
    )


def test_the_preview_reports_an_existing_origin(board):
    adopt.initialise(board)
    git("remote", "add", "origin", "https://github.com/x/y", cwd=board)

    state = adopt.status(board)
    assert state["has_origin"] is True
    assert state["origin"] == "https://github.com/x/y"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))

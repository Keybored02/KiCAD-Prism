"""Moving a working tree to a specific revision, without destroying anything.

The rule every one of these tests is really about: **never destroy work the user cannot
get back.** A commit is recoverable from git. An uncommitted edit to a board is not.

So anything that would discard uncommitted changes is REFUSED, with a reason, rather
than done with a warning. `git checkout` itself is not this careful: it will carry dirty
files onto another branch, and `git checkout -f` deletes them without a word.

The other half is the ECAD constraint: a .kicad_pcb is an s-expression tree and cannot
be three-way merged textually. Git will happily produce a board neither author drew, so
`pull` is fast-forward only and a divergence is an error, not a merge commit.
"""

import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from prism_agent import checkout  # noqa: E402
from prism_agent.checkout import CheckoutError  # noqa: E402


def git(*args, cwd, check=True):
    return subprocess.run(
        ["git", *args], cwd=str(cwd), capture_output=True, text=True, check=check
    )


def commit(repo: Path, filename: str, content: str, message: str) -> str:
    (repo / filename).write_text(content)
    git("add", "-A", cwd=repo)
    git("commit", "-m", message, cwd=repo)
    return git("rev-parse", "HEAD", cwd=repo).stdout.strip()


class Repo(type(Path())):
    """A Path that also remembers the shas of the commits we made in it."""

    first: str = ""
    second: str = ""


@pytest.fixture
def repo(tmp_path):
    """A board repo with two commits on main."""
    path = Repo(tmp_path / "board")
    path.mkdir()
    git("init", "-b", "main", cwd=path)
    git("config", "user.email", "t@t.t", cwd=path)
    git("config", "user.name", "T", cwd=path)
    path.first = commit(path, "board.kicad_pcb", "(kicad_pcb v1)", "first")
    path.second = commit(path, "board.kicad_pcb", "(kicad_pcb v2)", "second")
    return path


# -- the guard that actually saves data ------------------------------------


def test_uncommitted_changes_block_a_checkout(repo):
    """THE one. An edited board that has not been committed cannot be recovered if it
    is overwritten, so this is a refusal, not a warning."""
    (repo / "board.kicad_pcb").write_text("(kicad_pcb work in progress)")

    state = checkout.status(repo, repo.first)
    assert state["can"] is False
    assert state["reason"] == "dirty"
    assert "uncommitted" in state["message"]

    with pytest.raises(CheckoutError, match="uncommitted"):
        checkout.checkout(repo, repo.first)

    # And the work is still there.
    assert (repo / "board.kicad_pcb").read_text() == "(kicad_pcb work in progress)"


def test_staged_but_uncommitted_changes_also_block(repo):
    (repo / "board.kicad_pcb").write_text("(kicad_pcb staged)")
    git("add", "-A", cwd=repo)

    assert checkout.status(repo, repo.first)["reason"] == "dirty"


def test_untracked_files_do_NOT_block(repo):
    """Git carries untracked files across a checkout, so they cannot be lost by one.
    Blocking on them would make the feature unusable: a KiCad project nearly always has
    some untracked output lying around."""
    (repo / "gerbers.zip").write_text("output")

    state = checkout.status(repo, repo.first)
    assert state["can"] is True
    assert state["untracked"] == ["gerbers.zip"]
    assert state["blocking"] == []

    checkout.checkout(repo, repo.first)
    # Still there afterwards.
    assert (repo / "gerbers.zip").is_file()


# -- the other refusals ----------------------------------------------------


def test_an_unknown_ref_is_refused_and_says_why(repo):
    state = checkout.status(repo, "deadbeef")
    assert state["can"] is False
    assert state["reason"] == "unknown_ref"
    # The likely cause is named, because "not found" alone sends people hunting.
    assert "not fetched" in state["message"]


def test_a_commit_not_in_this_repo_is_refused(repo, tmp_path):
    """A commit that exists, but on a branch this clone never fetched. The sha is real,
    so a naive `git checkout <sha>` fails with something cryptic."""
    other = tmp_path / "elsewhere"
    other.mkdir()
    git("init", "-b", "main", cwd=other)
    git("config", "user.email", "t@t.t", cwd=other)
    git("config", "user.name", "T", cwd=other)
    stranger = commit(other, "x.txt", "x", "a commit we never fetched")

    assert checkout.status(repo, stranger)["reason"] == "unknown_ref"


def test_a_checkout_mid_merge_is_refused(repo):
    """git's own state is half-written. Checking out now leaves the sequencer files
    behind, and the next `git merge --continue` operates on a tree that is no longer
    what it thinks it is."""
    git("checkout", "-b", "side", repo.first, cwd=repo)
    commit(repo, "board.kicad_pcb", "(kicad_pcb side)", "side edit")
    git("checkout", "main", cwd=repo)
    # Conflicting merge, left unresolved.
    git("merge", "side", cwd=repo, check=False)

    state = checkout.status(repo, repo.first)
    assert state["can"] is False
    assert state["reason"] in ("in_progress", "unmerged")
    assert "abort" in state["message"] or "Resolve" in state["message"]


def test_being_already_on_the_commit_is_reported_not_done_twice(repo):
    state = checkout.status(repo, repo.second)
    assert state["can"] is False
    assert state["reason"] == "already_here"


def test_a_folder_that_is_not_a_repo_is_refused(tmp_path):
    plain = tmp_path / "plain"
    plain.mkdir()
    assert checkout.status(plain, "main")["reason"] == "not_a_repo"


def test_an_empty_ref_is_refused(repo):
    with pytest.raises(CheckoutError, match="No commit or branch"):
        checkout.resolve(repo, "")


# -- what a successful checkout does ---------------------------------------


def test_checking_out_a_commit_detaches_head_and_says_so(repo):
    """Detached HEAD is CORRECT for "look at this revision", but the user has to be told:
    committing here would otherwise strand the work on no branch."""
    result = checkout.checkout(repo, repo.first)

    assert result["sha"] == repo.first
    assert result["kind"] == "commit"
    assert result["detached"] is True
    assert (repo / "board.kicad_pcb").read_text() == "(kicad_pcb v1)"


def test_checking_out_a_branch_stays_attached(repo):
    """A branch is checked out by NAME, so HEAD stays attached and the user can commit
    normally afterwards."""
    git("branch", "feature", repo.first, cwd=repo)

    result = checkout.checkout(repo, "feature")
    assert result["kind"] == "branch"
    assert result["detached"] is False
    assert result["branch"] == "feature"


def test_a_tag_resolves_to_the_commit_it_points_at(repo):
    git("tag", "-a", "v1.0", repo.first, "-m", "release", cwd=repo)

    resolved = checkout.resolve(repo, "v1.0")
    assert resolved["kind"] == "tag"
    # The COMMIT, not the tag object. Checking out a tag object would be meaningless.
    assert resolved["sha"] == repo.first


def test_the_guards_are_rechecked_at_the_moment_of_acting(repo):
    """The UI may have looked a minute ago. The user could have saved a board in KiCad
    since. A stale "it was clean" is exactly how the data loss happens, so checkout()
    re-checks rather than trusting what it was told."""
    clean = checkout.status(repo, repo.first)
    assert clean["can"] is True

    # ... and now they edit the board.
    (repo / "board.kicad_pcb").write_text("(kicad_pcb just saved)")

    with pytest.raises(CheckoutError, match="uncommitted"):
        checkout.checkout(repo, repo.first)


# -- pulling ---------------------------------------------------------------


@pytest.fixture
def clone(repo, tmp_path):
    """A clone of `repo`, so there is a real upstream to pull from."""
    dest = tmp_path / "clone"
    git("clone", str(repo), str(dest), cwd=tmp_path)
    git("config", "user.email", "c@c.c", cwd=dest)
    git("config", "user.name", "C", cwd=dest)
    return dest


def test_pull_fast_forwards(repo, clone):
    commit(repo, "board.kicad_pcb", "(kicad_pcb v3)", "third")

    result = checkout.pull(clone)
    assert result["changed"] is True
    assert result["pulled"] == 1
    assert (clone / "board.kicad_pcb").read_text() == "(kicad_pcb v3)"


def test_pull_with_nothing_to_do_says_so(clone):
    result = checkout.pull(clone)
    assert result["changed"] is False
    assert "up to date" in result["message"]


def test_a_diverged_branch_is_refused_rather_than_merged(repo, clone):
    """THE ECAD constraint. Both sides changed the board. A textual three-way merge of an
    s-expression tree produces a file NEITHER author drew, and git will do it happily.
    That is silent board corruption, which is worse than any error message."""
    commit(repo, "board.kicad_pcb", "(kicad_pcb theirs)", "their edit")
    commit(clone, "board.kicad_pcb", "(kicad_pcb mine)", "my edit")

    with pytest.raises(CheckoutError, match="cannot be merged automatically"):
        checkout.pull(clone)

    # Nothing was merged, and the local work is intact.
    assert (clone / "board.kicad_pcb").read_text() == "(kicad_pcb mine)"


def test_the_divergence_message_names_both_sides(repo, clone):
    commit(repo, "board.kicad_pcb", "(kicad_pcb theirs)", "their edit")
    commit(clone, "board.kicad_pcb", "(kicad_pcb mine)", "my edit")

    with pytest.raises(CheckoutError) as exc:
        checkout.pull(clone)
    # "you are 1 ahead and 1 behind" is actionable. "cannot pull" is not.
    assert "1 local" in str(exc.value)
    assert "1 remote" in str(exc.value)


def test_pull_refuses_to_clobber_uncommitted_work(repo, clone):
    commit(repo, "board.kicad_pcb", "(kicad_pcb v3)", "third")
    (clone / "board.kicad_pcb").write_text("(kicad_pcb work in progress)")

    with pytest.raises(CheckoutError, match="uncommitted"):
        checkout.pull(clone)

    assert (clone / "board.kicad_pcb").read_text() == "(kicad_pcb work in progress)"


def test_pull_on_a_detached_head_is_refused(clone):
    """There is no branch to pull into. `git pull` here does something surprising, so
    say plainly what the user has to do."""
    head = git("rev-parse", "HEAD~1", cwd=clone).stdout.strip()
    git("checkout", head, cwd=clone)

    with pytest.raises(CheckoutError, match="not on a branch"):
        checkout.pull(clone)


def test_pull_with_no_upstream_is_refused(repo):
    """A local-only branch has nothing to pull FROM."""
    git("checkout", "-b", "local-only", cwd=repo)
    with pytest.raises(CheckoutError, match="not tracking"):
        checkout.pull(repo)


def test_pull_mid_operation_is_refused(repo, clone):
    git("checkout", "-b", "side", "HEAD~1", cwd=clone)
    commit(clone, "board.kicad_pcb", "(kicad_pcb side)", "side")
    git("checkout", "main", cwd=clone)
    git("merge", "side", cwd=clone, check=False)  # leaves a conflict

    with pytest.raises(CheckoutError):
        checkout.pull(clone)


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))

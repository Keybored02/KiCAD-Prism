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
    with_cache: str = ""


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

    with pytest.raises(CheckoutError, match="would be overwritten"):
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


# -- an untracked file the target ALSO has ---------------------------------
#
# The hole in "untracked files always survive a checkout": they survive only if the
# target does not contain a file of the same name. If it does, git refuses outright and
# prints "Aborting", which names neither the file nor the way out.
#
# Real, not hypothetical: a KiCad project routinely has fp-info-cache untracked in one
# checkout and committed in another, and that alone aborts every attempt to open a commit.


@pytest.fixture
def collision(repo):
    """A repo where `fp-info-cache` is committed on main but untracked in the tree."""
    commit(repo, "fp-info-cache", "committed version", "add the cache")
    # Remove it from tracking, but leave a local copy behind: exactly the state a KiCad
    # project ends up in.
    git("rm", "--cached", "fp-info-cache", cwd=repo)
    git("commit", "-m", "stop tracking the cache", cwd=repo)
    (repo / "fp-info-cache").write_text("my local cache")
    repo.with_cache = git("rev-parse", "HEAD~1", cwd=repo).stdout.strip()
    return repo


def test_an_untracked_file_the_target_has_is_caught_before_git_aborts(collision):
    """Git's own message is "Aborting", which is useless. Ours has to name the file and
    the way out."""
    state = checkout.status(collision, collision.with_cache)

    assert state["can"] is False
    assert state["reason"] == "untracked_collision"
    assert state["clobbered"] == ["fp-info-cache"]
    assert "fp-info-cache" in state["message"]


def test_the_collision_does_not_abort_when_stashing(collision):
    """The bug the user hit. The guard said "can proceed" (nothing is *modified*), then
    git refused, and all they saw was "Aborting"."""
    result = checkout.checkout(
        collision, collision.with_cache, stash_message="my cache"
    )

    assert result["sha"] == collision.with_cache
    assert "fp-info-cache" in result["stashed"]["stashed"]
    # The committed version is now in the tree.
    assert (collision / "fp-info-cache").read_text() == "committed version"


def test_the_local_untracked_version_is_recoverable(collision):
    checkout.checkout(collision, collision.with_cache, stash_message="my cache")
    checkout.checkout(collision, "main")
    checkout.restore(collision)

    assert (collision / "fp-info-cache").read_text() == "my local cache"


def test_only_the_colliding_untracked_files_are_swept_up(collision):
    """NOT --include-untracked. Sweeping up someone's gerber exports and 3D renders
    because they happened to be lying around is taking something we did not need to take,
    and they would find them gone with no visible reason why."""
    (collision / "gerbers.zip").write_text("my exports")
    (collision / "render.png").write_text("my render")

    checkout.checkout(collision, collision.with_cache, stash_message="my cache")

    assert (collision / "gerbers.zip").read_text() == "my exports"
    assert (collision / "render.png").read_text() == "my render"


def test_an_untracked_file_the_target_does_NOT_have_still_never_blocks(repo):
    """The common case must stay unblocked, or the feature is unusable: a KiCad project
    almost always has some untracked output lying around."""
    (repo / "gerbers.zip").write_text("output")

    state = checkout.status(repo, repo.first)
    assert state["can"] is True
    assert state["clobbered"] == []


# -- stashing: the way out of the dirty guard ------------------------------


def test_stashing_lets_a_blocked_checkout_proceed(repo):
    """Refusing was correct but a dead end: the user was told to commit or stash, then
    had to leave and do it by hand. This is the way forward."""
    (repo / "board.kicad_pcb").write_text("(kicad_pcb work in progress)")

    result = checkout.checkout(repo, repo.first, stash_message="my track routing")

    assert result["sha"] == repo.first
    assert result["stashed"]["count"] == 1
    # The tree really moved.
    assert (repo / "board.kicad_pcb").read_text() == "(kicad_pcb v1)"


def test_the_stashed_work_is_recoverable(repo):
    (repo / "board.kicad_pcb").write_text("(kicad_pcb work in progress)")
    checkout.checkout(repo, repo.first, stash_message="my track routing")

    # Back to where we were, then bring it back.
    checkout.checkout(repo, "main")
    checkout.restore(repo)

    assert (repo / "board.kicad_pcb").read_text() == "(kicad_pcb work in progress)"


def test_the_message_is_what_makes_a_stash_findable(repo):
    """Git's default is "WIP on main: a1b2c3d", which says nothing about what is in it.
    After two of those nobody knows which board they were editing."""
    (repo / "board.kicad_pcb").write_text("(kicad_pcb work in progress)")
    checkout.checkout(repo, repo.first, stash_message="rerouting the power rail")

    entries = checkout.stashes(repo)
    assert len(entries) == 1
    assert entries[0]["message"] == "rerouting the power rail"
    assert entries[0]["ours"] is True


def test_an_empty_message_still_gets_something_identifiable(repo):
    (repo / "board.kicad_pcb").write_text("(kicad_pcb wip)")
    checkout.checkout(repo, repo.first, stash_message="")

    assert checkout.stashes(repo)[0]["message"] == "Uncommitted changes"


def test_without_a_message_uncommitted_changes_are_still_refused(repo):
    """Stashing moves the user's work. That needs an explicit yes, not a default."""
    (repo / "board.kicad_pcb").write_text("(kicad_pcb work in progress)")

    with pytest.raises(CheckoutError, match="uncommitted"):
        checkout.checkout(repo, repo.first)  # no stash_message at all

    assert (repo / "board.kicad_pcb").read_text() == "(kicad_pcb work in progress)"


def test_untracked_files_are_not_swept_into_the_stash(repo):
    """They survive a checkout on their own, so taking them would be taking something we
    did not need to take, and the user would find them gone for no visible reason."""
    (repo / "board.kicad_pcb").write_text("(kicad_pcb wip)")
    (repo / "gerbers.zip").write_text("output")

    checkout.checkout(repo, repo.first, stash_message="wip")

    assert (repo / "gerbers.zip").is_file()


def test_stashing_a_clean_tree_is_refused(repo):
    """An empty stash is a trap: it looks like your work is safe somewhere."""
    with pytest.raises(CheckoutError, match="no uncommitted changes"):
        checkout.stash(repo, "nothing here")


def test_a_stash_cannot_rescue_a_mid_operation_checkout(repo):
    """git would refuse anyway, and stashing on top of a half-finished merge turns a
    recoverable mess into an unrecoverable one."""
    git("checkout", "-b", "side", repo.first, cwd=repo)
    commit(repo, "board.kicad_pcb", "(kicad_pcb side)", "side edit")
    git("checkout", "main", cwd=repo)
    git("merge", "side", cwd=repo, check=False)  # leaves a conflict

    with pytest.raises(CheckoutError):
        checkout.checkout(repo, repo.first, stash_message="rescue me")


def test_restoring_onto_a_dirty_tree_is_refused(repo):
    """A conflict between a stash and a board is exactly what we cannot merge our way
    out of."""
    (repo / "board.kicad_pcb").write_text("(kicad_pcb first edit)")
    checkout.stash(repo, "first")
    (repo / "board.kicad_pcb").write_text("(kicad_pcb second edit)")

    with pytest.raises(CheckoutError, match="uncommitted"):
        checkout.restore(repo)

    # Both are intact: the stash is untouched and so is the tree.
    assert (repo / "board.kicad_pcb").read_text() == "(kicad_pcb second edit)"
    assert len(checkout.stashes(repo)) == 1


def test_a_stash_made_by_hand_is_still_listed(repo):
    """It is the user's work. Hiding it from a list titled "your stashed changes" would
    be a good way to let them destroy it."""
    (repo / "board.kicad_pcb").write_text("(kicad_pcb by hand)")
    git("stash", "push", "-m", "did this in a terminal", cwd=repo)

    entries = checkout.stashes(repo)
    assert len(entries) == 1
    assert entries[0]["message"] == "did this in a terminal"
    assert entries[0]["ours"] is False


# -- stashing, and pulling -------------------------------------------------


def test_stashing_lets_a_blocked_pull_proceed(repo, clone):
    commit(repo, "board.kicad_pcb", "(kicad_pcb v3)", "third")
    (clone / "board.kicad_pcb").write_text("(kicad_pcb my wip)")

    result = checkout.pull(clone, stash_message="my wip")

    assert result["changed"] is True
    assert result["stashed"]["count"] == 1
    assert (clone / "board.kicad_pcb").read_text() == "(kicad_pcb v3)"


def test_a_stash_is_put_back_when_the_pull_does_not_happen(repo, clone):
    """The trap. If we stash and then the pull turns out to be a no-op, the user's work
    has left their tree with nothing to show for it. That is their work going missing."""
    (clone / "board.kicad_pcb").write_text("(kicad_pcb my wip)")

    result = checkout.pull(clone, stash_message="my wip")  # nothing to pull

    assert result["changed"] is False
    assert result["stashed"] is None
    # Straight back where it was.
    assert (clone / "board.kicad_pcb").read_text() == "(kicad_pcb my wip)"
    assert checkout.stashes(clone) == []


def test_a_stash_is_put_back_when_the_pull_is_refused_for_divergence(repo, clone):
    commit(repo, "board.kicad_pcb", "(kicad_pcb theirs)", "their edit")
    commit(clone, "board.kicad_pcb", "(kicad_pcb mine)", "my edit")
    (clone / "board.kicad_pcb").write_text("(kicad_pcb my wip)")

    with pytest.raises(CheckoutError, match="cannot be merged automatically"):
        checkout.pull(clone, stash_message="my wip")

    # Diverged is still refused, AND the work is back in the tree, not stranded.
    assert (clone / "board.kicad_pcb").read_text() == "(kicad_pcb my wip)"
    assert checkout.stashes(clone) == []


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v"]))

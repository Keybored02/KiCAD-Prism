"""Getting a specific commit, branch or tag into the working tree, safely.

"Open this commit" sounds like a one-liner and is not. A checkout moves the files under
KiCad while KiCad may have them open, and it can destroy uncommitted work. Almost all of
this module is the guards, and that is the right proportion.

The rule everything here follows: **never destroy work the user cannot get back.**

A commit is recoverable from git. An uncommitted edit is not. So anything that would
discard uncommitted changes is refused, with a reason and a way forward, rather than
done with a warning. `git checkout` itself is not this careful: it will happily carry
your dirty files onto another branch, and `git checkout -f` will silently delete them.

What is checked, and why each one matters:

  no repo             nothing to check out from
  unknown ref         a typo or a commit from a branch you never fetched: say which
  uncommitted changes the one that loses data. Refused, always.
  unmerged paths      a conflict is already in progress; moving now compounds it
  mid-operation       a rebase/merge/cherry-pick is half-done; git's own state is
                      partial and a checkout leaves it inconsistent
  detached HEAD       fine, but the user should be told they are not on a branch
  KiCad has it open   we cannot detect this reliably, so we say it plainly instead
"""

from __future__ import annotations

import logging
import subprocess
from pathlib import Path

log = logging.getLogger(__name__)

TIMEOUT = 120

# Marks a stash as one Prism made, so it is recognisable in `git stash list` and in a
# terminal, not just in our own UI. The user's own message follows it.
STASH_PREFIX = "prism: "


class CheckoutError(Exception):
    """Refused, with a reason the user can act on."""


def _git(repo: Path, *args: str, check: bool = True) -> str:
    try:
        result = subprocess.run(
            ["git", "-C", str(repo), *args],
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
            check=False,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (OSError, subprocess.SubprocessError) as exc:
        raise CheckoutError(f"Couldn't run git: {exc}") from exc

    if check and result.returncode != 0:
        detail = (result.stderr or result.stdout or "").strip().splitlines()
        raise CheckoutError(detail[-1] if detail else "git failed")
    return result.stdout.strip()


def _ok(repo: Path, *args: str) -> bool:
    """Did this git command succeed? For questions, not actions."""
    try:
        subprocess.run(
            ["git", "-C", str(repo), *args],
            capture_output=True,
            timeout=TIMEOUT,
            check=True,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (OSError, subprocess.SubprocessError):
        return False
    return True


# -- what state is the tree in? --------------------------------------------


def in_progress(repo: Path) -> str:
    """A half-finished git operation, or "".

    Checking out in the middle of one leaves git's own state inconsistent: the
    sequencer files stay behind and the next `git rebase --continue` operates on a tree
    that is no longer what it thinks it is.
    """
    git_dir = Path(_git(repo, "rev-parse", "--git-dir"))
    if not git_dir.is_absolute():
        git_dir = repo / git_dir

    for marker, name in (
        ("rebase-merge", "a rebase"),
        ("rebase-apply", "a rebase"),
        ("MERGE_HEAD", "a merge"),
        ("CHERRY_PICK_HEAD", "a cherry-pick"),
        ("REVERT_HEAD", "a revert"),
        ("BISECT_LOG", "a bisect"),
    ):
        if (git_dir / marker).exists():
            return name
    return ""


def would_be_overwritten(repo: Path, sha: str, untracked: list[str]) -> list[str]:
    """Untracked files that the target commit ALSO has, so a checkout would clobber them.

    The hole in "untracked files always survive a checkout": they survive only if the
    target does not contain a file of the same name. If it does, git refuses outright
    ("The following untracked working tree files would be overwritten by checkout ...
    Aborting"), because writing the committed version would destroy the local one.

    Real, not hypothetical: a KiCad project routinely has `fp-info-cache` untracked in
    one checkout and committed in another, and that alone is enough to abort every
    attempt to open a commit.
    """
    if not sha or not untracked:
        return []
    listing = _git(repo, "ls-tree", "-r", "--name-only", sha, check=False)
    in_target = set(listing.splitlines())
    return sorted(set(untracked) & in_target)


def dirty_files(repo: Path) -> dict:
    """Uncommitted work, split by how recoverable it is.

    Untracked files are called out separately because a checkout usually does NOT destroy
    them (git carries them across), so they must not block one by default. Treating them
    as blocking would make the feature unusable: a KiCad project almost always has some
    untracked output lying around.

    The exception is per-target, so it does not live here: see would_be_overwritten.
    """
    out = _git(repo, "status", "--porcelain")
    staged, modified, untracked, unmerged = [], [], [], []

    for line in out.splitlines():
        if len(line) < 3:
            continue
        x, y, path = line[0], line[1], line[3:].strip().strip('"')
        if " -> " in path:
            path = path.split(" -> ", 1)[1]

        if x == "?" and y == "?":
            untracked.append(path)
        elif "U" in (x, y) or (x == "D" and y == "D") or (x == "A" and y == "A"):
            unmerged.append(path)
        else:
            if x != " ":
                staged.append(path)
            if y != " ":
                modified.append(path)

    return {
        "staged": staged,
        "modified": modified,
        "untracked": untracked,
        "unmerged": unmerged,
        # Untracked deliberately excluded: they survive a checkout, so they are not a
        # reason to refuse one.
        "blocking": sorted(set(staged) | set(modified)),
    }


def resolve(repo: Path, ref: str) -> dict:
    """What is this ref, if anything?

    Returns {found, sha, kind, subject}. `kind` distinguishes a branch from a tag from a
    bare sha, because moving to a branch and moving to a commit leave you in genuinely
    different states (on a branch vs detached), and the user should be told which.
    """
    if not ref or not ref.strip():
        raise CheckoutError("No commit or branch given.")
    ref = ref.strip()

    # rev-parse resolves anything: a sha, a branch, a tag, HEAD~3. `^{commit}` forces it
    # to a commit, so an annotated tag resolves to what it points at rather than to the
    # tag object.
    try:
        sha = _git(repo, "rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}")
    except CheckoutError:
        sha = ""
    if not sha:
        return {"found": False, "sha": "", "kind": "", "subject": "", "ref": ref}

    kind = "commit"
    if _ok(repo, "show-ref", "--verify", "--quiet", f"refs/heads/{ref}"):
        kind = "branch"
    elif _ok(repo, "show-ref", "--verify", "--quiet", f"refs/tags/{ref}"):
        kind = "tag"
    elif _ok(repo, "show-ref", "--verify", "--quiet", f"refs/remotes/{ref}"):
        kind = "remote-branch"

    subject = _git(repo, "log", "-1", "--format=%s", sha, check=False)
    return {"found": True, "sha": sha, "kind": kind, "subject": subject, "ref": ref}


def status(repo: str | Path, ref: str = "") -> dict:
    """Can we check `ref` out, and if not, why not?

    Read-only. This is what the UI asks before offering a button, so that a refusal is
    explained in advance rather than after the user has committed to the action.
    """
    path = Path(repo)
    if not (path / ".git").exists():
        return {
            "can": False,
            "reason": "not_a_repo",
            "message": "Not a git repository.",
        }

    busy = in_progress(path)
    dirt = dirty_files(path)
    target = resolve(path, ref) if ref else {"found": False}

    current = _git(path, "rev-parse", "--abbrev-ref", "HEAD", check=False)
    head = _git(path, "rev-parse", "HEAD", check=False)
    detached = current == "HEAD"

    result = {
        "can": True,
        "reason": "",
        "message": "",
        "current_branch": "" if detached else current,
        "detached": detached,
        "head": head,
        "target": target,
        **dirt,
    }

    if busy:
        result.update(
            can=False,
            reason="in_progress",
            message=f"There is {busy} in progress. Finish or abort it first.",
        )
        return result

    if dirt["unmerged"]:
        result.update(
            can=False,
            reason="unmerged",
            message=(
                f"{len(dirt['unmerged'])} file(s) have unresolved conflicts. "
                "Resolve them before moving."
            ),
        )
        return result

    if dirt["blocking"]:
        # THE one that loses data. A commit can always be recovered; an uncommitted edit
        # to a board cannot. So this is a refusal, not a warning.
        result.update(
            can=False,
            reason="dirty",
            message=(
                f"{len(dirt['blocking'])} file(s) have uncommitted changes. "
                "Commit or stash them first."
            ),
        )
        return result

    if ref and not target.get("found"):
        result.update(
            can=False,
            reason="unknown_ref",
            message=(
                f"'{ref}' is not a commit, branch or tag in this repository. "
                "It may be on a branch you have not fetched."
            ),
        )
        return result

    if ref and target.get("sha") == head:
        result.update(
            can=False,
            reason="already_here",
            message="The working tree is already at this commit.",
        )
        return result

    # An untracked file the TARGET also has. Git refuses these outright, and it is right
    # to: writing the committed version would destroy the local one. We have to catch it
    # ourselves, because otherwise git's own "Aborting" is all the user ever sees, and it
    # names neither the file nor the way out.
    clobbered = would_be_overwritten(path, target.get("sha", ""), dirt["untracked"])
    if clobbered:
        result["clobbered"] = clobbered
        result.update(
            can=False,
            reason="untracked_collision",
            message=(
                f"{len(clobbered)} untracked file(s) would be overwritten: "
                f"{', '.join(clobbered[:3])}"
                + (f" and {len(clobbered) - 3} more" if len(clobbered) > 3 else "")
                + ". Set them aside, or delete them."
            ),
        )
        return result

    result["clobbered"] = []
    return result


# -- stashing --------------------------------------------------------------


def stash(repo: str | Path, message: str = "", also: list[str] | None = None) -> dict:
    """Put uncommitted work aside so the tree can move, without losing it.

    This is the way OUT of the dirty guard. Refusing to check out was correct but a dead
    end: the user is told to commit or stash, and then has to leave and do it by hand.

    `also` names untracked files to take as well. Only ever the ones that WOULD BE
    OVERWRITTEN by the checkout, never every untracked file in the tree: sweeping up
    someone's gerber exports and 3D renders because they happened to be lying around is
    taking something we did not need to take, and they would find them gone with no
    visible reason why. So the sweep is targeted, and the caller says what to sweep.

    The MESSAGE is what makes a stash safe rather than a hiding place. A stash you cannot
    identify is one you will never restore. Git's default ("WIP on main: a1b2c3d") says
    nothing about what is in it, and after two of them nobody knows which board they were
    editing. So the caller supplies one, and we prefix it so Prism's own stashes are
    recognisable in `git stash list`.
    """
    path = Path(repo)
    also = also or []

    dirt = dirty_files(path)
    taking = sorted(set(dirt["blocking"]) | set(also))
    if not taking:
        raise CheckoutError("There are no uncommitted changes to stash.")

    label = (message or "").strip() or "Uncommitted changes"

    if also:
        # `-u` alone would take EVERY untracked file. Scoped to named paths it takes only
        # those, which is exactly what we want: the ones the checkout would clobber, and
        # not the user's gerber exports and 3D renders that merely happen to be lying
        # around. Without `-u`, git refuses a path that is not tracked ("Did you forget
        # to 'git add'?"), so it is required here, not optional.
        _git(path, "stash", "push", "-u", "-m", f"{STASH_PREFIX}{label}", "--", *taking)
    else:
        _git(path, "stash", "push", "-m", f"{STASH_PREFIX}{label}")

    return {
        "ok": True,
        "message": label,
        "stashed": taking,
        "count": len(taking),
    }


def stashes(repo: str | Path) -> list[dict]:
    """The stashes on this repo, newest first.

    Includes everyone's, not just ours: a stash made by hand in a terminal is still the
    user's work, and hiding it from a list titled "your stashed changes" would be a good
    way to let them destroy it.
    """
    path = Path(repo)
    if not (path / ".git").exists():
        return []

    out = _git(path, "stash", "list", "--format=%gd%x00%s%x00%cr", check=False)
    result = []
    for line in out.splitlines():
        parts = line.split("\0")
        if len(parts) < 3:
            continue
        ref, subject, when = parts[0], parts[1], parts[2]

        # git decorates every stash subject with "On <branch>: " (or "WIP on <branch>: "
        # for one it named itself). That is git's bookkeeping, not what the user typed,
        # and repeating it in a list that already shows the branch is just noise.
        for decoration in ("WIP on ", "On "):
            if subject.startswith(decoration):
                _, _, rest = subject.partition(": ")
                subject = rest or subject
                break

        # Strip our own prefix too: it exists to identify the stash in git's tooling, not
        # to be read back to the user who typed the message.
        ours = subject.startswith(STASH_PREFIX)
        if ours:
            subject = subject[len(STASH_PREFIX) :]

        result.append({"ref": ref, "message": subject, "when": when, "ours": ours})
    return result


def restore(repo: str | Path, ref: str = "stash@{0}") -> dict:
    """Put a stash back.

    `pop`, not `apply`: leaving the stash behind after restoring it is how you end up
    with a list of near-identical entries and no idea which is live. If it conflicts, git
    keeps the stash, which is the behaviour we want, so a failure here loses nothing.
    """
    path = Path(repo)

    dirt = dirty_files(path)
    if dirt["blocking"]:
        # Restoring onto a dirty tree can conflict, and resolving a conflict between a
        # stash and a board is exactly the situation we cannot merge our way out of.
        raise CheckoutError(
            f"{len(dirt['blocking'])} file(s) have uncommitted changes. "
            "Commit or stash them before restoring another stash."
        )

    try:
        _git(path, "stash", "pop", ref)
    except CheckoutError as exc:
        # The stash is still there: git does not drop one it could not apply cleanly.
        raise CheckoutError(
            f"Couldn't restore the stash: {exc}\n\n"
            "It is still in the stash list, so nothing is lost."
        ) from exc

    return {"ok": True, "restored": ref}


# -- doing it --------------------------------------------------------------


def checkout(repo: str | Path, ref: str, stash_message: str | None = None) -> dict:
    """Move the working tree to `ref`, refusing anything that would lose work.

    `stash_message`, when given, means "put my uncommitted changes aside first". That is
    the user's explicit consent to move their work, and the message is what makes it
    findable again afterwards. Without it, uncommitted changes are still a refusal.

    Re-checks the guards immediately before acting rather than trusting whatever the UI
    saw a moment ago. The user may have saved a board in KiCad in between, and a stale
    "it was clean" is exactly how the data loss happens.
    """
    path = Path(repo)
    state = status(path, ref)

    stashed = None
    stashable = ("dirty", "untracked_collision")
    if not state["can"] and state["reason"] in stashable and stash_message is not None:
        # Only these two are stashable. A mid-rebase or an unresolved conflict is NOT:
        # git would refuse anyway, and stashing on top of a half-finished operation is
        # how you turn a recoverable mess into an unrecoverable one.
        #
        # `clobbered` is the untracked files the TARGET also has. They go into the stash
        # too, because git will not overwrite them and there is nowhere else to put them.
        # Only those, though: every other untracked file stays where the user left it.
        stashed = stash(path, stash_message, also=state.get("clobbered") or [])
        state = status(path, ref)

    if not state["can"]:
        raise CheckoutError(state["message"])

    target = state["target"]

    # A branch is checked out by NAME, so HEAD stays attached and the user can commit
    # normally. A bare commit gets a detached HEAD, which is correct for "look at this
    # revision" and is what the caller is told.
    name = ref if target["kind"] in ("branch",) else target["sha"]
    _git(path, "checkout", name)

    now = _git(path, "rev-parse", "--abbrev-ref", "HEAD", check=False)
    return {
        "ok": True,
        "sha": target["sha"],
        "subject": target["subject"],
        "kind": target["kind"],
        "detached": now == "HEAD",
        "branch": "" if now == "HEAD" else now,
        # So the caller can tell the user their work was put aside, and where it went.
        # A stash the user does not know about is a stash they will never restore.
        "stashed": stashed,
    }


def pull(repo: str | Path, stash_message: str | None = None) -> dict:
    """Fetch and fast-forward the current branch.

    `stash_message`, when given, puts uncommitted changes aside first. Without it they
    are still a refusal.

    **Fast-forward only, deliberately.** A real merge of a KiCad board cannot be done
    textually: a .kicad_pcb is an s-expression tree where a three-way merge produces a
    file neither author drew, and git will cheerfully generate one. That is silent board
    corruption, which is worse than any error message.

    So when the branches have diverged we stop and say so, and resolving it is a
    deliberate act (take one side whole) rather than something a Pull button does behind
    the user's back. Stashing does NOT change that: it clears uncommitted work out of the
    way, it does not make two divergent histories mergeable.
    """
    path = Path(repo)

    if not (path / ".git").exists():
        raise CheckoutError("Not a git repository.")

    busy = in_progress(path)
    if busy:
        raise CheckoutError(f"There is {busy} in progress. Finish or abort it first.")

    branch = _git(path, "rev-parse", "--abbrev-ref", "HEAD", check=False)
    if branch == "HEAD":
        raise CheckoutError(
            "You are not on a branch (detached HEAD), so there is nothing to pull into. "
            "Check out a branch first."
        )

    upstream = _git(
        path, "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}", check=False
    )
    if not upstream:
        raise CheckoutError(
            f"'{branch}' is not tracking a remote branch, so there is nothing to pull."
        )

    # Fetch BEFORE deciding what blocks us: an untracked file only collides if the
    # incoming commit contains it, and we cannot know that until we have the commit.
    _git(path, "fetch", "--prune")

    stashed = None
    dirt = dirty_files(path)
    # A fast-forward writes the upstream's files over ours, so the same untracked
    # collision that aborts a checkout aborts a pull.
    clobbered = would_be_overwritten(
        path,
        _git(path, "rev-parse", upstream, check=False),
        dirt["untracked"],
    )
    if dirt["blocking"] or clobbered:
        if stash_message is None:
            # A pull that has to touch a file you have edited will either refuse or
            # overwrite. Refuse first, on our terms, with a message that says what to do.
            count = len(dirt["blocking"]) + len(clobbered)
            raise CheckoutError(
                f"{count} file(s) would be overwritten by the pull. "
                "Commit or stash them first."
            )
        stashed = stash(path, stash_message, also=clobbered)

    behind_ahead = _git(
        path, "rev-list", "--left-right", "--count", f"{upstream}...HEAD", check=False
    )
    try:
        behind, ahead = (int(n) for n in behind_ahead.split())
    except ValueError:
        behind, ahead = 0, 0

    if behind == 0 or ahead:
        # We are not going to pull after all, either because there is nothing to pull or
        # because the branches diverged. If we stashed to get here, the user's work is
        # now out of their tree with nothing to show for it, so put it straight back:
        # a stash they did not ask for and did not get a pull from is just their work
        # gone missing.
        if stashed:
            restore(path)
            stashed = None

    if behind == 0:
        return {
            "ok": True,
            "changed": False,
            "ahead": ahead,
            "behind": 0,
            "stashed": None,
            "message": "Already up to date."
            if not ahead
            else f"Already up to date. You have {ahead} commit(s) to push.",
        }

    if ahead:
        # Diverged. This is the case that would produce a merge commit, and for a board
        # that means a textual three-way merge of an s-expression tree: a file neither
        # author drew. Refuse, and name the choice that actually has to be made.
        raise CheckoutError(
            f"Your branch and the remote have both moved on "
            f"({ahead} local, {behind} remote commit(s)). "
            "A KiCad board cannot be merged automatically, so this has to be resolved "
            "by choosing one version of each conflicting file."
        )

    _git(path, "merge", "--ff-only", upstream)

    return {
        "ok": True,
        "changed": True,
        "ahead": 0,
        "behind": 0,
        "pulled": behind,
        "stashed": stashed,
        "message": f"Fast-forwarded {behind} commit(s).",
    }

"""Merging two branches of a KiCad project, on the machine that has the working tree.

This runs in the agent because the server cannot read a folder on somebody else's laptop.
It is the thing `checkout.pull()` refuses to do: pull() is fast-forward only precisely
because a textual three-way merge of a `.kicad_pcb` produces a board neither author drew,
and it says so in its own docstring. This module replaces that refusal with an
object-level merge whose output is validated before it is allowed near the tree.

The order is the point. Everything is built and checked IN MEMORY first, and `git merge`
is not started until we already hold text we are willing to commit. A merge that cannot
produce a sound board therefore never touches the working tree at all, which means there
is nothing to roll back in the common failure case.

The browser never sends board content. It sends a list of {key, resolution} decisions,
and this module re-reads base/ours/theirs from git and rebuilds the merge itself. So the
worst a compromised page can do is pick the wrong objects from commits that already exist
in the repository; it cannot introduce bytes.
"""

from __future__ import annotations

import logging
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

from . import checkout
from .checkout import _git, _ok
from .projects import _run_git

log = logging.getLogger(__name__)

# Files we merge by understanding. Everything else is git's business.
SEMANTIC_SUFFIXES = (".kicad_pcb", ".kicad_sch")


class MergeError(Exception):
    """Refused, with a reason the user can act on."""

    def __init__(self, message: str, *, conflicts: list[str] | None = None):
        super().__init__(message)
        # Text files git could not merge. Carried separately so the UI can offer a
        # choice per file rather than making the user parse a sentence.
        self.conflicts = conflicts or []


@dataclass
class FileMerge:
    """One file's three-way state and the decisions available for it."""

    path: str
    kind: str  # pcb | sch | text
    base: str | None = None
    ours: str | None = None
    theirs: str | None = None
    decisions: list = field(default_factory=list)
    # Routing runs the decisions fall into. Display only: the merge stages every decision
    # individually whether or not it belongs to a group.
    groups: list = field(default_factory=list)
    detail: str = ""

    @property
    def semantic(self) -> bool:
        return self.kind in ("pcb", "sch")

    def to_dict(self) -> dict:
        return {
            "path": self.path,
            "kind": self.kind,
            "semantic": self.semantic,
            "decisions": [d.to_dict() for d in self.decisions],
            "groups": [g.to_dict() for g in self.groups],
            "detail": self.detail,
            "needs_input": sum(1 for d in self.decisions if d.needs_input),
        }


@dataclass
class MergePlan:
    """What merging `theirs` into the current branch would involve."""

    repo: str
    ours_ref: str
    theirs_ref: str
    base_sha: str
    files: list[FileMerge] = field(default_factory=list)
    text_files: list[str] = field(default_factory=list)
    detail: str = ""

    def to_dict(self) -> dict:
        return {
            "repo": self.repo,
            "ours": self.ours_ref,
            "theirs": self.theirs_ref,
            "base": self.base_sha,
            "files": [f.to_dict() for f in self.files],
            "text_files": self.text_files,
            "detail": self.detail,
            "needs_input": sum(
                1 for f in self.files for d in f.decisions if d.needs_input
            ),
        }


def _services():
    """The backend's merge engines, loaded the way worktree_diff loads the diff ones.

    Deliberately NOT via `worktree_diff._load_diff_services`, which installs a stub for
    `kicad_monkey` so a board diff can run without it. That stub is right for diffing
    (identity does not depend on glyph outlines) and catastrophic for merging: the patch
    builder needs REAL byte spans from `parse_sexp_with_spans`, and a stub would hand
    back nonsense that we would then write to somebody's board.

    So this refuses rather than degrades. A merge we cannot compute correctly is one we
    must not attempt.
    """
    from . import worktree_diff

    try:
        import kicad_monkey  # noqa: F401
    except ImportError as exc:
        raise MergeError(
            "This agent cannot merge KiCad files: the s-expression parser "
            "(kicad_monkey) is not available."
        ) from exc

    services = worktree_diff._backend_services_dir()
    if not services.is_dir():
        raise MergeError("This agent is missing the merge engine.")

    try:
        worktree_diff._stub_module("git", Repo=None)
        worktree_diff._stub_module("app")
        worktree_diff._stub_module("app.services")
        worktree_diff._stub_module("app.services.workspace_service", workspace=None)

        load = worktree_diff._load_by_path
        load("app.services.sch_diff_service", services / "sch_diff_service.py")
        load("app.services.pcb_diff_service", services / "pcb_diff_service.py")
        load("app.services.span_index", services / "span_index.py")
        load("app.services.sexp_splice", services / "sexp_splice.py")
        load("app.services.merge_integrity", services / "merge_integrity.py")
        # Loaded BEFORE merge3_service, which imports it by name. These are path
        # loads, not package imports, so a module that is not registered here simply
        # does not exist as far as the next one is concerned.
        load("app.services.identity_match", services / "identity_match.py")
        load("app.services.trace_groups", services / "trace_groups.py")
        merge3 = load("app.services.merge3_service", services / "merge3_service.py")
        patch = load(
            "app.services.merge_patch_service", services / "merge_patch_service.py"
        )
        return merge3, patch
    except MergeError:
        raise
    except Exception as exc:
        log.warning("couldn't load the merge engine", exc_info=True)
        raise MergeError(f"This agent's merge engine failed to load: {exc}") from exc


def _kind(path: str) -> str:
    lowered = path.lower()
    if lowered.endswith(".kicad_pcb"):
        return "pcb"
    if lowered.endswith(".kicad_sch"):
        return "sch"
    return "text"


def _blob(repo: Path, ref: str, path: str) -> str | None:
    """A file's content at a revision, or None if it did not exist there.

    Read WITHOUT stripping. `checkout._git` strips its output, which is right for a sha
    or a branch name and catastrophic for a board: the leading and trailing bytes of a
    KiCad file are part of the file, and every byte offset the patch builder computed
    would be shifted by whatever we silently removed.
    """
    try:
        return _run_git(repo, "show", f"{ref}:{path}", strip=False)
    except (subprocess.CalledProcessError, subprocess.SubprocessError, OSError):
        return None  # did not exist at that revision


def merge_base(repo: Path, ours: str, theirs: str) -> str:
    """The commit both branches descend from."""
    sha = _git(repo, "merge-base", ours, theirs, check=False)
    if not sha:
        raise MergeError(
            f"{ours} and {theirs} have no common history, so there is nothing to "
            "merge against."
        )
    return sha


def changed_between(repo: Path, first: str, second: str) -> list[str]:
    """Files that differ between two revisions."""
    output = _git(repo, "diff", "--name-only", "-z", f"{first}..{second}", check=False)
    return [p for p in output.split("\0") if p]


def plan(repo: str | Path, theirs_ref: str, ours_ref: str = "HEAD") -> MergePlan:
    """Work out what merging `theirs_ref` would involve, without touching anything.

    Read-only. Nothing here writes to the working tree, so it is safe to call while the
    user has KiCad open on the project.
    """
    path = Path(repo)
    if not (path / ".git").exists():
        raise MergeError("Not a git repository.")

    if not _ok(path, "rev-parse", "--verify", f"{theirs_ref}^{{commit}}"):
        raise MergeError(
            f"'{theirs_ref}' is not a branch or commit in this repository."
        )

    base = merge_base(path, ours_ref, theirs_ref)
    ours_sha = _git(path, "rev-parse", ours_ref, check=False)
    theirs_sha = _git(path, "rev-parse", theirs_ref, check=False)

    if base == theirs_sha:
        raise MergeError(f"'{theirs_ref}' is already in this branch. Nothing to merge.")

    merge3, _ = _services()

    touched = sorted(
        set(changed_between(path, base, ours_sha))
        | set(changed_between(path, base, theirs_sha))
    )

    files: list[FileMerge] = []
    text_files: list[str] = []

    for relative in touched:
        kind = _kind(relative)
        if kind == "text":
            # git merges these perfectly well by line, and second-guessing it would be
            # worse. They are listed so the UI can show what else is moving.
            text_files.append(relative)
            continue

        entry = FileMerge(
            path=relative,
            kind=kind,
            base=_blob(path, base, relative),
            ours=_blob(path, ours_sha, relative),
            theirs=_blob(path, theirs_sha, relative),
        )

        if entry.ours is None or entry.theirs is None:
            # A whole file added or deleted on one side. There are no objects to pick
            # between, so this is a file-level choice git can make on its own.
            entry.detail = "added or removed as a whole file"
            files.append(entry)
            continue

        try:
            if kind == "pcb":
                entry.decisions, entry.groups = merge3.diff3_pcb_grouped(
                    entry.base or "", entry.ours, entry.theirs
                )
            else:
                entry.decisions = merge3.diff3_sch(
                    entry.base or "", entry.ours, entry.theirs
                )
            entry.detail = f"{len(entry.decisions)} change(s)"
        except Exception as exc:
            log.warning("couldn't diff %s", relative, exc_info=True)
            entry.detail = f"could not be compared: {exc}"

        files.append(entry)

    return MergePlan(
        repo=str(path),
        ours_ref=ours_ref,
        theirs_ref=theirs_ref,
        base_sha=base,
        files=files,
        text_files=text_files,
        detail=f"{len(files)} design file(s), {len(text_files)} other file(s)",
    )


@dataclass
class BuiltFile:
    """A merged file that passed every in-memory check."""

    path: str
    text: str
    applied: list[str] = field(default_factory=list)
    skipped: list = field(default_factory=list)
    promoted: list[str] = field(default_factory=list)


def build(plan_: MergePlan, decisions: dict[str, list]) -> list[BuiltFile]:
    """Produce every merged file, refusing outright if any one of them is unsound.

    `decisions` maps a file path to a list of `{key, resolution}` dicts.

    All or nothing. A merge that wrote three good files and refused the fourth would
    leave the project in a state neither branch describes, and the user would have to
    work out which files to trust. Better to refuse the whole thing while the tree is
    still untouched.
    """
    _, patch = _services()
    built: list[BuiltFile] = []

    for entry in plan_.files:
        if not entry.semantic or entry.ours is None or entry.theirs is None:
            continue

        staged = [
            patch.Staged(item.get("key", ""), item.get("resolution", patch.OURS))
            for item in decisions.get(entry.path, [])
            if item.get("key")
        ]

        builder = (
            patch.build_merged_pcb if entry.kind == "pcb" else patch.build_merged_sch
        )
        result = builder(
            entry.base or "", entry.ours, entry.theirs, staged, entry.decisions or None
        )

        if not result.ok:
            raise MergeError(f"{entry.path}: {result.detail}")

        built.append(
            BuiltFile(
                path=entry.path,
                text=result.text,
                applied=result.applied,
                skipped=result.skipped,
                promoted=result.promoted,
            )
        )

    return built


# ---------------------------------------------------------------------------
# The part that writes
# ---------------------------------------------------------------------------


def _kicad_check():
    """The DRC/ERC gate, if this agent can load it. None means skip, never fail."""
    from . import worktree_diff

    services = worktree_diff._backend_services_dir()
    path = services / "kicad_check_service.py"
    if not path.is_file():
        return None
    try:
        worktree_diff._load_by_path("app.services.kicad_cli", services / "kicad_cli.py")
        return worktree_diff._load_by_path("app.services.kicad_check_service", path)
    except Exception:
        log.warning("couldn't load the KiCad checker", exc_info=True)
        return None


def commit(
    repo: str | Path,
    theirs_ref: str,
    decisions: dict[str, list],
    message: str = "",
    stash_message: str | None = None,
    allow_new_violations: bool = False,
    text_choices: dict[str, str] | None = None,
) -> dict:
    """Merge `theirs_ref` into the current branch using the given decisions.

    The ordering is the safety property. Everything is built and validated while the
    working tree is untouched, so the overwhelmingly common failure (a selection that
    cannot produce a sound board) costs nothing and needs no rollback. `git merge` only
    starts once we are holding text we would be willing to commit.

    `stash_message` follows the convention the rest of the agent uses: present, even
    empty, means "put my uncommitted work aside first"; absent means uncommitted work is
    a refusal.
    """
    path = Path(repo)

    # 1. Refuse for the same reasons a checkout refuses. Re-checked immediately before
    #    acting rather than trusted from the UI's earlier look: the user may have saved a
    #    board in KiCad since then, and a stale "it was clean" is how work gets lost.
    busy = checkout.in_progress(path)
    if busy:
        raise MergeError(f"There is {busy} in progress. Finish or abort it first.")

    branch = _git(path, "rev-parse", "--abbrev-ref", "HEAD", check=False)
    if branch == "HEAD":
        raise MergeError(
            "You are not on a branch (detached HEAD), so there is nothing to merge into."
        )

    # 2. Build and validate everything, still touching nothing.
    plan_ = plan(path, theirs_ref)
    built = build(plan_, decisions)

    # 3. Only now may the tree move. Uncommitted work is handled with the same consent
    #    protocol as checkout: a stash the user did not ask for is not acceptable.
    dirt = checkout.dirty_files(path)
    stashed = None
    if dirt["blocking"]:
        if stash_message is None:
            raise MergeError(
                f"{len(dirt['blocking'])} file(s) have uncommitted changes. "
                "Commit or set them aside first."
            )
        stashed = checkout.stash(path, stash_message)

    try:
        return _perform(
            path,
            plan_,
            built,
            theirs_ref,
            branch,
            message,
            allow_new_violations,
            stashed,
            text_choices or {},
        )
    except Exception:
        # Anything at all from here on: put the tree back the way we found it.
        _abort(path, stashed)
        raise


def _perform(
    path: Path,
    plan_: MergePlan,
    built: list[BuiltFile],
    theirs_ref: str,
    branch: str,
    message: str,
    allow_new_violations: bool,
    stashed,
    text_choices: dict[str, str],
) -> dict:
    """The tree-touching half. Every exit through here is via commit() 's rollback."""
    checker = _kicad_check()

    # Baseline BEFORE the merge, so pre-existing violations are not blamed on it. A real
    # board carries violations for long stretches, and an absolute check would block
    # every merge on every board.
    baselines = {}
    if checker and checker.available():
        for entry in built:
            target = path / entry.path
            if target.is_file():
                baselines[entry.path] = (
                    checker.drc(target)
                    if entry.path.lower().endswith(".kicad_pcb")
                    else checker.erc(target)
                )

    # --no-ff so the result is a real merge commit with two parents even when git could
    # have fast-forwarded: history must record that these branches came together, or the
    # next merge computes its base from the wrong place.
    _git(path, "merge", "--no-commit", "--no-ff", theirs_ref, check=False)

    # git has now written its own idea of the merge, including conflict markers in our
    # design files. Overwrite those with what we built and verified.
    for entry in built:
        target = path / entry.path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(entry.text, encoding="utf-8")

        # The builder cleared every copper pour, because a merge invalidates them: each
        # was computed around one branch's routing and this board has both. Have KiCad
        # recompute them NOW, in the working tree, so the merge commit contains a
        # finished board.
        #
        # Otherwise the user opens KiCad, refills, saves and commits again: a second
        # commit for something the merge caused, on a board that looked wrong in
        # between. The DRC gate below then judges the refilled board, which is the one
        # they will actually open.
        if checker and entry.path.lower().endswith(".kicad_pcb"):
            filled = checker.refill_zones(target)
            if filled.ran and filled.ok:
                entry.text = target.read_text(encoding="utf-8")  # KiCad rewrote it
            elif filled.ran:
                log.warning(
                    "couldn't refill zones in %s: %s", entry.path, filled.detail
                )

        _git(path, "add", "--", entry.path)

    # Text files git could not merge by line. Unlike a board, there is a legitimate
    # file-level answer here (take one side whole), so the user is offered one rather
    # than being told to go and fix it in a terminal.
    conflicts = _unresolved(path, {e.path for e in built})
    for relative in list(conflicts):
        choice = (text_choices or {}).get(relative)
        if choice in ("ours", "theirs"):
            _git(path, "checkout", f"--{choice}", "--", relative)
            _git(path, "add", "--", relative)
            conflicts.remove(relative)

    if conflicts:
        raise MergeError(
            "git could not merge %s by line. Choose one side for each."
            % ", ".join(conflicts[:5]),
            conflicts=conflicts,
        )

    # Layer 4: KiCad's own parser. Our checks prove a file is well formed by OUR reading
    # of the format; only KiCad can prove KiCad opens it. Not overridable.
    if checker and checker.available():
        for entry in built:
            outcome = checker.can_open(path / entry.path)
            if outcome.ran and not outcome.ok:
                raise MergeError(
                    f"KiCad could not open the merged {entry.path}: {outcome.detail}"
                )

        # Layer 5: electrical. A delta against the baseline, and overridable, because a
        # board may legitimately merge into a state the engineer intends to fix next.
        if not allow_new_violations:
            for entry in built:
                before = baselines.get(entry.path)
                if before is None:
                    continue
                after = (
                    checker.drc(path / entry.path)
                    if entry.path.lower().endswith(".kicad_pcb")
                    else checker.erc(path / entry.path)
                )
                gate = checker.gate(before, after)
                if gate.blocked:
                    raise MergeError(
                        f"{entry.path}: {gate.detail} Review them, or merge anyway."
                    )

    # Resolve the ref to a name a person would recognise. `@{u}` is the correct thing to
    # merge (it is what ahead/behind were measured against) but "Merge @{u} into main" is
    # not a sentence anyone wants to find in their history a year later.
    named = (
        _git(
            path,
            "rev-parse",
            "--abbrev-ref",
            "--symbolic-full-name",
            theirs_ref,
            check=False,
        )
        or theirs_ref
    )
    subject = message.strip() or f"Merge {named} into {branch}"
    _git(path, "commit", "--no-verify", "-m", subject)

    return {
        "ok": True,
        "commit": _git(path, "rev-parse", "HEAD", check=False),
        "branch": branch,
        "merged": theirs_ref,
        "files": [
            {
                "path": e.path,
                "applied": len(e.applied),
                "skipped": [{"key": k, "reason": r} for k, r in e.skipped],
                "promoted": e.promoted,
            }
            for e in built
        ],
        "text_files": plan_.text_files,
        # Which text files the user had to settle by hand, so the result does not imply
        # git merged everything cleanly when it did not.
        "text_resolved": {
            p: c for p, c in text_choices.items() if p in plan_.text_files
        },
        "stashed": stashed,
        "message": f"Merged {named} into {branch}.",
    }


def _unresolved(path: Path, handled: set[str]) -> list[str]:
    """Files git still considers conflicted, excluding ones we wrote ourselves."""
    output = _git(path, "ls-files", "-u", "--format=%(path)", check=False)
    return sorted({p for p in output.splitlines() if p and p not in handled})


def _abort(path: Path, stashed) -> None:
    """Put the tree back, then give the user their work back.

    Order matters: `git merge --abort` restores tracked files, so unstashing first would
    have it fight the stash. And the stash MUST come back either way, per the rule
    `checkout.pull` states plainly: a stash they did not ask for and did not get a merge
    from is just their work gone missing.
    """
    try:
        if _ok(path, "rev-parse", "--verify", "MERGE_HEAD"):
            _git(path, "merge", "--abort", check=False)
    except Exception:
        log.warning("couldn't abort the merge", exc_info=True)

    if stashed:
        try:
            checkout.restore(path)
        except Exception:
            # Nothing left to try automatically, so say where it went rather than
            # letting it look like the work evaporated.
            log.error(
                "merge failed AND the stash could not be restored; "
                "the user's work is in `git stash list`",
                exc_info=True,
            )


def side_content(repo: str | Path, theirs_ref: str, path: str, side: str) -> str:
    """One side of one file, for the viewer to render.

    Kept out of the plan payload on purpose: a plan carries a decision LIST, and three
    copies of a 9MB board would make it unusable on exactly the projects where merging
    matters most. The viewer asks for what it is about to draw.

    `side` is base, ours or theirs. All three are read from git, so this cannot serve
    anything that is not already committed in this repository.
    """
    location = Path(repo)
    if side not in ("base", "ours", "theirs"):
        raise MergeError(f"unknown side {side!r}")

    # Reject anything that could climb out of the repository. The path arrives from a
    # web page, and while git would refuse an unknown path anyway, `..` in a path that
    # git DOES resolve is not something to leave to chance.
    if path.startswith("/") or ".." in Path(path).parts or Path(path).is_absolute():
        raise MergeError("that is not a path in this project")

    if side == "base":
        ref = merge_base(location, "HEAD", theirs_ref)
    elif side == "ours":
        ref = "HEAD"
    else:
        ref = theirs_ref

    content = _blob(location, ref, path)
    if content is None:
        raise MergeError(f"{path} does not exist in {side}")
    return content


def abort(repo: str | Path) -> dict:
    """Abandon a merge that was left in progress, e.g. by a crash."""
    path = Path(repo)
    if not _ok(path, "rev-parse", "--verify", "MERGE_HEAD"):
        raise MergeError("There is no merge in progress.")
    _git(path, "merge", "--abort")
    return {"ok": True, "message": "Merge abandoned."}

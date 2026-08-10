"""Turning staged decisions into a merged file, without re-serialising anything.

Ours is always the canvas. The output starts as the literal bytes of our side, and every
staged decision becomes a splice into it. Two things follow, and both are properties
rather than aspirations:

  - a decision resolving to ours produces NO edit, so staging nothing returns our file
    byte for byte
  - any region nobody staged is byte-identical to a file KiCad already opened

Corruption can therefore only originate inside a range we spliced, which is a small and
testable surface. Nothing here ever runs a serialiser: `roundtrip_sexp_text` normalises
floats and reflows lines, so rebuilding through a parser would rewrite thousands of lines
nobody edited.

Everything happens in memory and is validated before the caller is allowed to write it.
A `PatchResult` that failed its checks carries no text.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

from . import merge3_service as m3
from . import merge_integrity, sexp_splice
from . import span_index as si
from .sexp_splice import SpliceError
from .span_index import SpanIndexError

log = logging.getLogger(__name__)

OURS = "ours"
THEIRS = "theirs"
BOTH = "both"
REMOVE = "remove"


class PatchError(Exception):
    """The merge could not be built, so nothing should be written."""


@dataclass(frozen=True)
class Staged:
    """One decision the user made (or accepted by default)."""

    key: str
    resolution: str  # ours | theirs | both | remove


@dataclass
class PatchResult:
    """A merged file, or the reason there is not one.

    `text` is None whenever `ok` is False. A caller cannot accidentally write the output
    of a failed patch, because there is no output to write.
    """

    ok: bool
    text: str | None = None
    applied: list[str] = field(default_factory=list)
    skipped: list[tuple[str, str]] = field(default_factory=list)
    promoted: list[str] = field(default_factory=list)
    violations: list[merge_integrity.Violation] = field(default_factory=list)
    # Copper pours removed because the merge invalidated them. Reported so the caller
    # can tell the user to refill rather than let them find an empty zone.
    fills_dropped: int = 0
    detail: str = ""

    def to_dict(self) -> dict:
        return {
            "ok": self.ok,
            "applied": self.applied,
            "skipped": [{"key": k, "reason": r} for k, r in self.skipped],
            "promoted": self.promoted,
            "violations": [v.to_dict() for v in self.violations],
            "detail": self.detail,
        }


def build_merged_pcb(
    base: str,
    ours: str,
    theirs: str,
    staged: list[Staged],
    decisions: list[m3.Decision3] | None = None,
) -> PatchResult:
    """Apply staged decisions to our board and return the merged text.

    `decisions` comes from `diff3_pcb`; it is recomputed when not supplied. Passing it
    avoids a second parse of three large boards when the caller already has it.
    """
    try:
        computed = (
            decisions if decisions is not None else m3.diff3_pcb(base, ours, theirs)
        )
    except Exception as exc:
        # The diff engine assumes well-formed input and raises whatever the parser hands
        # it. Callers of a MERGE must never see a raw TypeError, so anything that fails
        # here becomes a refusal with no text to write.
        log.debug("could not diff the boards", exc_info=True)
        return PatchResult(ok=False, detail=f"could not read the boards: {exc}")

    return _build(
        base,
        ours,
        theirs,
        staged,
        computed,
        si.build_pcb_index,
        merge_integrity.check_pcb,
        net_aware=True,
    )


def build_merged_sch(
    base: str,
    ours: str,
    theirs: str,
    staged: list[Staged],
    decisions: list[m3.Decision3] | None = None,
) -> PatchResult:
    """The schematic equivalent. No nets to remap."""
    try:
        computed = (
            decisions if decisions is not None else m3.diff3_sch(base, ours, theirs)
        )
    except Exception as exc:
        log.debug("could not diff the schematics", exc_info=True)
        return PatchResult(ok=False, detail=f"could not read the schematics: {exc}")

    return _build(
        base,
        ours,
        theirs,
        staged,
        computed,
        si.build_sch_index,
        merge_integrity.check_sch,
        net_aware=False,
    )


def _build(
    base: str,
    ours: str,
    theirs: str,
    staged: list[Staged],
    decisions: list[m3.Decision3],
    build_index,
    check,
    net_aware: bool,
) -> PatchResult:
    try:
        ours_root, ours_index = build_index(ours)
        theirs_root, theirs_index = build_index(theirs)
    except SpanIndexError as exc:
        return PatchResult(ok=False, detail=f"could not read the files: {exc}")

    by_key = {d.key: d for d in decisions}
    wanted = _resolve_dependencies(staged, by_key, ours_index, theirs_index)

    edits: list[sexp_splice.Edit] = []
    applied: list[str] = []
    net_additions: list[str] = []

    for item in wanted.staged:
        decision = by_key.get(item.key)
        if decision is None:
            wanted.skipped.append((item.key, "no such change in this merge"))
            continue

        try:
            produced = _edits_for(
                item,
                decision,
                ours,
                theirs,
                ours_index,
                theirs_index,
                ours_root,
                theirs_root,
                net_aware,
                net_additions,
            )
        except PatchError as exc:
            wanted.skipped.append((item.key, str(exc)))
            continue

        if produced:
            edits.extend(produced)
        applied.append(item.key)

    # New nets go in before anything references them, so the file is never momentarily
    # inconsistent even if a later step fails and we inspect the intermediate.
    if net_additions:
        edits.extend(_net_table_edits(ours, ours_root, net_additions))

    try:
        merged = sexp_splice.apply_edits(ours, edits)
    except SpliceError as exc:
        # An overlap here means dependency resolution let a node and its descendant
        # through together. That is our bug, and the merge must not proceed.
        return PatchResult(
            ok=False,
            skipped=wanted.skipped,
            detail=f"could not splice the merge: {exc}",
        )

    # Copper pours are computed around the routing that existed when KiCad filled them.
    # A merge that moved copper invalidates every one of them, so they are dropped and
    # KiCad recomputes on open.
    #
    # Only when something actually changed. A merge that applied no edits must return
    # our file BYTE for byte - that identity law is what lets us promise an untouched
    # region is the same bytes KiCad already accepted - and clearing a fill nobody
    # invalidated would break it for no gain.
    fills_dropped = 0
    if net_aware and edits:
        merged, fills_dropped = strip_zone_fills(merged)

    violations = check(merged)
    if violations:
        return PatchResult(
            ok=False,
            applied=applied,
            skipped=wanted.skipped,
            promoted=wanted.promoted,
            violations=violations,
            detail=f"the merged file is not structurally sound: "
            f"{merge_integrity.describe(violations)}",
        )

    detail = f"{len(applied)} change(s) applied"
    if fills_dropped:
        detail += f"; {fills_dropped} zone fill(s) recomputed"

    return PatchResult(
        ok=True,
        text=merged,
        applied=applied,
        skipped=wanted.skipped,
        promoted=wanted.promoted,
        fills_dropped=fills_dropped,
        detail=detail,
    )


def strip_zone_fills(text: str) -> tuple[str, int]:
    """Remove computed copper pours, leaving the zones themselves untouched.

    A zone stores two different things: the OUTLINE the engineer drew, and the
    `filled_polygon` blocks KiCad computed by pouring copper around everything else on
    the board. The first is a decision; the second is derived data.

    A merge invalidates every fill on the board, whichever side it came from. The pour
    was computed around one branch's routing, and the merged board has both branches'
    routing, so the copper is now in the wrong place: it overlaps traces it was never
    poured around. On a real merge this produced 19 clearance, mask-bridge and
    hole-clearance errors from a board whose objects were otherwise electrically
    identical to one that passed DRC cleanly.

    KiCad's own merge engine refills after merging. We cannot: refilling needs a live
    BOARD and the geometry engine that goes with it. Removing the stale fill is the
    honest alternative. The agent then has KiCad refill them before committing (see
    `kicad_check_service.refill_zones`), so the merge lands a finished board; where that
    is not possible, an empty pour is visibly missing rather than quietly wrong.

    Returns the text and how many fills were dropped, so the caller can say so.
    """
    try:
        from kicad_monkey import parse_sexp_with_spans

        tree, spans = parse_sexp_with_spans(text)
    except Exception:  # pragma: no cover - parser is a hard dependency
        return text, 0

    # ONE parse. The span map is keyed by id() of the nodes in the tree it returned, so
    # a tree from any other call - build_pcb_index included - has different objects and
    # every lookup silently misses. That is not a crash; it is a function that quietly
    # does nothing, which is how this first shipped.
    root = tree[0] if tree and isinstance(tree[0], list) else tree
    if not isinstance(root, list):
        return text, 0

    edits: list[sexp_splice.Edit] = []
    for zone in si._children(root, "zone"):
        # Direct children only. `polygon` (the outline) and `filled_polygon` (the pour)
        # sit side by side here, and dropping the outline would delete the zone.
        for node in si._children(zone, "filled_polygon"):
            span = spans.get(id(node))
            if not span:
                continue
            # Take the whitespace AFTER the node, not before it. Swallowing the leading
            # newline pulls the zone's own closing paren up onto the previous line,
            # which reads as an edit to the outline in any byte comparison even though
            # nothing about the outline changed.
            start = span.offset
            while start > 0 and text[start - 1] in " \t":
                start -= 1  # its own indentation goes with it
            end = span.end_offset
            while end < len(text) and text[end] in " \t":
                end += 1
            if end < len(text) and text[end] == "\n":
                end += 1
            edits.append(sexp_splice.Edit(start, end, ""))

    if not edits:
        return text, 0

    try:
        return sexp_splice.apply_edits(text, edits), len(edits)
    except SpliceError:
        # Never worth failing a merge over: a stale fill is wrong, but a merge that
        # refuses to complete because it could not tidy one is worse.
        log.warning("couldn't strip zone fills", exc_info=True)
        return text, 0


@dataclass
class _Resolved:
    staged: list[Staged]
    skipped: list[tuple[str, str]] = field(default_factory=list)
    promoted: list[str] = field(default_factory=list)


def _resolve_dependencies(
    staged: list[Staged],
    by_key: dict,
    ours_index: dict,
    theirs_index: dict,
) -> _Resolved:
    """Make the staged set coherent before a single edit is built.

    Three things can go wrong, and all of them are cheaper to fix here than to detect
    afterwards in a spliced file:

    1. A child is staged whose parent footprint exists only on their side. The child
       cannot be inserted into a footprint that is not in our file, so the parent is
       promoted and reported. Silently dropping the child would lose the user's choice.
    2. A child is staged whose parent was deleted on our side and is not being restored.
       Nothing can hold it, so it is skipped with a reason.
    3. A parent AND one of its children are both staged. Splicing the parent already
       carries its children, so the child edit would overlap. The child is dropped.
    """
    resolved = _Resolved(staged=[])
    keys = {item.key for item in staged}
    seen: set[str] = set()

    for item in staged:
        if item.key in seen:
            continue
        seen.add(item.key)

        anchor = theirs_index.get(item.key) or ours_index.get(item.key)
        parent_key = anchor.parent_key if anchor else None

        if parent_key:
            # Rule 3: the parent is coming too, and brings this with it.
            if parent_key in keys:
                continue

            if parent_key not in ours_index:
                if parent_key in theirs_index:
                    # Rule 1: bring the parent along and say so.
                    if parent_key not in seen:
                        resolved.staged.append(Staged(parent_key, THEIRS))
                        resolved.promoted.append(parent_key)
                        seen.add(parent_key)
                    continue  # the promoted parent carries this child
                # Rule 2: nothing can hold it.
                resolved.skipped.append(
                    (item.key, "its footprint is not in the merged board")
                )
                continue

        resolved.staged.append(item)

    return resolved


def _edits_for(
    item: Staged,
    decision: m3.Decision3,
    ours: str,
    theirs: str,
    ours_index: dict,
    theirs_index: dict,
    ours_root: list,
    theirs_root: list,
    net_aware: bool,
    net_additions: list[str],
) -> list[sexp_splice.Edit]:
    """The splices for one staged decision.

    An empty list is a legitimate outcome: keeping our version means changing nothing,
    which is what makes the identity property free rather than special-cased.
    """
    here = ours_index.get(item.key)
    there = theirs_index.get(item.key)

    if item.resolution == OURS:
        return []  # ours is already the canvas

    if item.resolution == REMOVE:
        if here is None:
            return []  # already absent
        return [sexp_splice.delete(here.offset, here.end_offset, ours)]

    if item.resolution in (THEIRS, BOTH):
        if there is None:
            # Their side does not have this object. Taking theirs therefore means it is
            # not in the result, whether they deleted it or we were the only ones to
            # add it. Both are the same request: "give me their version of this spot",
            # and their version is nothing.
            #
            # The second case is what makes "take theirs everywhere" produce THEIR
            # board. Refusing it left our own additions in place, so the result was
            # neither branch: their routing plus our tracks, shorting nets neither
            # engineer shorted.
            if here is not None:
                return [sexp_splice.delete(here.offset, here.end_offset, ours)]
            return []  # absent from both sides; nothing to do

        donor = there.slice(theirs)
        if net_aware:
            donor = _remap_nets(donor, theirs_root, ours_root, net_additions)

        # A moved geometry-keyed object lives under its OLD key in our file. Clear that
        # first, or writing their version leaves both on the board: to KiCad that is two
        # tracks where the engineer drew one, which is a short rather than a move.
        superseded = []
        if item.resolution == THEIRS and decision.supersedes:
            stale = ours_index.get(decision.supersedes)
            if stale is not None:
                superseded.append(
                    sexp_splice.delete(stale.offset, stale.end_offset, ours)
                )

        if item.resolution == BOTH and here is not None:
            # Keep ours and add theirs alongside. Only legitimate for objects whose
            # identity is their geometry, where "same key" never meant "same object".
            if decision.classification != m3.KEY_COLLISION:
                raise PatchError("this change cannot keep both versions")
            return [_insert_beside(ours, here, donor)]

        if here is None:
            return [
                *superseded,
                _insert_new(ours, ours_index, ours_root, there, donor),
            ]

        return [
            *superseded,
            sexp_splice.replace(here.offset, here.end_offset, donor),
        ]

    raise PatchError(f"unknown resolution {item.resolution!r}")


def _insert_beside(ours: str, here: si.Anchor, donor: str) -> sexp_splice.Edit:
    """Add their object immediately after ours, keeping both."""
    indent = sexp_splice.indent_of(ours, here.offset)
    return sexp_splice.Edit(
        offset=here.end_offset,
        end_offset=here.end_offset,
        replacement="\n" + indent + donor,
    )


def _insert_new(
    ours: str,
    ours_index: dict,
    ours_root: list,
    there: si.Anchor,
    donor: str,
) -> sexp_splice.Edit:
    """Place an object our file does not have yet, at the right point in the tree.

    A footprint goes at top level; a footprint graphic goes inside its parent footprint.
    Getting this wrong produces a file that parses but means something else, which is
    exactly the class of error no later gate reliably catches.
    """
    if there.parent_key:
        parent = ours_index.get(there.parent_key)
        if parent is None:
            raise PatchError("its footprint is not in the merged board")
        indent = sexp_splice.indent_of(ours, parent.offset) + "\t"
        return sexp_splice.insert_into(ours, parent.end_offset, donor, indent)

    # Top level. Land beside an existing sibling of the same kind when there is one, so
    # related objects stay together rather than all new content piling up at the end.
    siblings = [
        a for a in ours_index.values() if a.kind == there.kind and not a.parent_key
    ]
    if siblings:
        last = max(siblings, key=lambda a: a.end_offset)
        indent = sexp_splice.indent_of(ours, last.offset)
        return sexp_splice.Edit(
            offset=last.end_offset,
            end_offset=last.end_offset,
            replacement="\n" + indent + donor,
        )

    return sexp_splice.insert_into(ours, _root_close(ours, ours_root), donor, "\t")


def _root_close(ours: str, ours_root: list) -> int:
    """Where the root expression ends."""
    stripped = ours.rstrip()
    if not stripped.endswith(")"):
        raise PatchError("the file does not close its root expression")
    return len(stripped)


# ---------------------------------------------------------------------------
# Nets
# ---------------------------------------------------------------------------

# `(net 3)` on a track, `(net 3 "GND")` on a pad. Both must move together, and the
# name form must keep its name consistent with the index.
_NET_REF = re.compile(r'\(net\s+(-?\d+)(\s+"(?:[^"\\]|\\.)*")?\s*\)')


def _remap_nets(
    donor: str,
    theirs_root: list,
    ours_root: list,
    net_additions: list[str],
) -> str:
    """Rewrite a donor object's net references to mean the same thing in our file.

    Net indices are file-local, and KiCad renumbers them on every footprint add or
    remove. Net 3 on their board and net 3 on ours are almost never the same net, so
    copying an object verbatim silently reconnects it to whatever happens to hold that
    index here. That is a wrong board that opens cleanly and passes most checks.

    So the index is resolved to a NAME on their side and back to an index on ours,
    allocating a new one when we do not have that net at all.

    Newer KiCad (20260206) references nets by name and carries no table. Nothing to
    remap there: names are already stable across branches, which is precisely the
    property this function has to manufacture for older files.
    """
    theirs_table = si.net_table(theirs_root)
    ours_table = si.net_table(ours_root)
    if not theirs_table and not ours_table:
        return donor  # name-addressed on both sides

    by_name = {name: index for index, name in ours_table.items()}
    next_index = max((int(i) for i in ours_table if i.lstrip("-").isdigit()), default=0)

    def rewrite(match: re.Match) -> str:
        their_index = match.group(1)
        name = theirs_table.get(their_index)
        if name is None:
            # No name to resolve through. Leaving the raw index would connect this to an
            # arbitrary net of ours; refusing is the only honest option.
            raise PatchError(
                f"their net {their_index} has no name, so it cannot be matched to ours"
            )

        our_index = by_name.get(name)
        if our_index is None:
            nonlocal next_index
            next_index += 1
            our_index = str(next_index)
            by_name[name] = our_index
            net_additions.append(name)

        # Preserve whichever form the donor used, and keep the name consistent with the
        # index we just chose. A pad claiming an index whose name disagrees with the
        # table is a silent short.
        if match.group(2):
            return f'(net {our_index} "{name}")'
        return f"(net {our_index})"

    return _NET_REF.sub(rewrite, donor)


def _net_table_edits(
    ours: str, ours_root: list, names: list[str]
) -> list[sexp_splice.Edit]:
    """Append nets our board did not have, so nothing references a net that is absent.

    The new entries go after the LAST existing `(net ...)` so the table stays contiguous,
    which is how KiCad writes it and how anyone reading the diff will expect it.
    """
    table = si.net_table(ours_root)
    if not table:
        return []  # name-addressed: no table to extend

    last = _last_net_span(ours)
    if last is None:
        return []

    next_index = max((int(i) for i in table if i.lstrip("-").isdigit()), default=0)
    indent = sexp_splice.indent_of(ours, last[0])

    additions = []
    for name in dict.fromkeys(names):  # de-duplicated, order preserved
        next_index += 1
        additions.append(f'\n{indent}(net {next_index} "{name}")')

    return [
        sexp_splice.Edit(
            offset=last[1], end_offset=last[1], replacement="".join(additions)
        )
    ]


def _last_net_span(text: str) -> tuple[int, int] | None:
    """Byte range of the final top-level `(net N "name")` entry.

    Found by re-walking the span map rather than by regex: a `(net ...)` string can also
    appear inside a footprint pad, and appending the board's net table into the middle of
    a footprint would be a very quiet disaster.
    """
    try:
        from kicad_monkey import parse_sexp_with_spans
    except ImportError:  # pragma: no cover - hard dependency
        return None

    try:
        tree, spans = parse_sexp_with_spans(text)
    except Exception:
        return None

    root = tree[0] if tree and isinstance(tree[0], list) else tree
    if not isinstance(root, list):
        return None

    best: tuple[int, int] | None = None
    for node in si._children(root, "net"):
        span = spans.get(id(node))
        if span and (best is None or span.end_offset > best[1]):
            best = (span.offset, span.end_offset)
    return best

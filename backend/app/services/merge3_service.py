"""Three-way semantic diff: what base, ours and theirs each say about every object.

Git merges KiCad files as lines, which is wrong in a way that does not announce itself.
Two engineers editing opposite corners of a board touch non-adjacent lines, so git merges
them cleanly and reports success, but the result can still be a board neither drew:
s-expression structure spans lines, and a "clean" textual merge can splice a footprint's
tail onto another's head.

So we diff by OBJECT instead. This module answers, for every object in the design, what
the two branches did to it since they parted, and whether those actions can both be
honoured.

It is deliberately two reuses of the existing pairwise engine (base->ours and
base->theirs, joined by key) rather than new diff logic. `_diff_pcb_items` already knows
how KiCad numbers nets, which fields count as a change, and how to re-pair a moved track;
a second implementation would drift from it, and drift here means addressing the wrong
object.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from . import identity_match, trace_groups
from . import pcb_diff_service as pcb
from . import sch_diff_service as sch

log = logging.getLogger(__name__)


# How the two branches relate, per object.
ONLY_OURS = "only_ours"  # theirs left it alone; nothing to decide
ONLY_THEIRS = "only_theirs"  # ours left it alone; safe to take
BOTH_SAME = "both_same"  # both made the identical edit; no decision needed
BOTH_FIELDS = "both_fields"  # both edited it, on different fields; keep both edits
CONFLICT = "conflict"  # both edited the same fields, differently
KEY_COLLISION = "key_collision"  # same synthesized key, but not the same object
UNDESCRIBABLE = "undescribable"  # both edited it, and we cannot name what changed
UNCHANGED = "unchanged"  # neither touched it

# What each side did to an object, relative to base.
ADDED = "added"
REMOVED = "removed"
CHANGED = "changed"
ABSENT = "absent"  # never existed on this side
KEPT = "kept"  # exists, untouched


@dataclass
class Decision3:
    """One object, and what the two branches want to happen to it.

    `resolutions` lists what the user may legally choose. A decision that needs no input
    (only one side acted, or both acted identically) still appears, because the merge
    must apply it and the UI should be able to show that it happened.
    """

    key: str
    kind: str
    classification: str
    ours_action: str
    theirs_action: str
    resolutions: list[str] = field(default_factory=list)
    default: str = "ours"
    base_item: dict | None = None
    ours_item: dict | None = None
    theirs_item: dict | None = None
    conflicting_fields: dict[str, Any] = field(default_factory=dict)
    merged_fields: dict[str, str] = field(default_factory=dict)
    detail: str = ""
    # True when the two sides were paired by similarity rather than by a shared uuid.
    # The pairing is an opinion, so it is surfaced and never auto-resolved.
    inferred_identity: bool = False
    inferred_from: str = ""
    inferred_score: float = 0.0
    # The key this object had on OUR side, when the diff engine re-paired a geometry
    # keyed object that moved. A track's key IS its coordinates, so moving one changes
    # its key: the decision is filed under the new position while our file still holds
    # the old one. Taking theirs has to remove that, or both end up on the board.
    supersedes: str = ""

    @property
    def needs_input(self) -> bool:
        """Does a human have to choose?

        BOTH_FIELDS does not: the sides edited different fields, so keeping both loses
        nothing. It is still surfaced, because a merge that quietly combined two people's
        edits should say so.

        An inferred identity always does, whatever its classification. Everything else
        here rests on the file telling us two things are the same object; when we worked
        that out ourselves, a person should agree before we act on it.
        """
        return self.inferred_identity or self.classification in (
            CONFLICT,
            KEY_COLLISION,
            UNDESCRIBABLE,
        )

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "kind": self.kind,
            "classification": self.classification,
            "ours_action": self.ours_action,
            "theirs_action": self.theirs_action,
            "resolutions": self.resolutions,
            "default": self.default,
            "needs_input": self.needs_input,
            "base_item": self.base_item,
            "ours_item": self.ours_item,
            "theirs_item": self.theirs_item,
            "conflicting_fields": self.conflicting_fields,
            "merged_fields": self.merged_fields,
            "detail": self.detail,
            "inferred_identity": self.inferred_identity,
            "inferred_from": self.inferred_from,
            "inferred_score": round(self.inferred_score, 3),
            "supersedes": self.supersedes,
        }


def _index_side(diff: dict) -> dict[str, tuple[str, dict, dict | None]]:
    """Turn a pairwise diff into {key -> (action, item, base_item)}.

    The pairwise engine returns three lists; a three-way join needs to ask "what happened
    to key X" directly, so flatten it once here rather than scanning three lists per key.
    """
    side: dict[str, tuple[str, dict, dict | None]] = {}
    for item in diff.get("added", []):
        side[item["uuid"]] = (ADDED, item, None)
    for item in diff.get("removed", []):
        side[item["uuid"]] = (REMOVED, item, item)
    for entry in diff.get("changed", []):
        item = entry["item"]
        side[item["uuid"]] = (CHANGED, item, entry.get("old_item"))
    return side


def _classify(
    key: str,
    kind: str,
    ours_action: str,
    theirs_action: str,
    base_item: dict | None,
    ours_item: dict | None,
    theirs_item: dict | None,
    comparable: list[str],
    net_aware: bool = False,
    theirs_base: dict | None = None,
) -> Decision3:
    """Decide how one object's two histories relate.

    `base_item` and `theirs_base` are the ancestor as each side recorded it. They are
    usually identical; when they are not, no-op detection is unsafe. See
    `_overlapping_fields`.
    """
    decision = Decision3(
        key=key,
        kind=kind,
        classification=UNCHANGED,
        ours_action=ours_action,
        theirs_action=theirs_action,
        base_item=base_item,
        ours_item=ours_item,
        theirs_item=theirs_item,
    )

    # One side did nothing. Default to whatever the other side decided, but offer both:
    # "only I changed this" is still something a person may want to drop.
    #
    # Both directions must offer both choices, and for the same reason. Offering only
    # "ours" here reads as "your own edits are not up for discussion", which is wrong
    # twice over: it is the user's board, and a merge is exactly when you discover your
    # change was superseded by the other side's. Worse, it is silently INCOHERENT with
    # the rest of the merge - somebody taking theirs everywhere still keeps their own
    # tracks, which is neither branch and can short nets that neither engineer shorted.
    if theirs_action == KEPT and ours_action != KEPT:
        decision.classification = ONLY_OURS
        decision.resolutions = ["ours", "theirs"]
        decision.default = "ours"
        decision.detail = _describe(ours_action, "you")
        return decision
    if ours_action == KEPT and theirs_action != KEPT:
        decision.classification = ONLY_THEIRS
        decision.resolutions = ["theirs", "ours"]
        decision.default = "theirs"
        decision.detail = _describe(theirs_action, "them")
        return decision
    if ours_action == KEPT and theirs_action == KEPT:
        return decision  # UNCHANGED

    # Both sides acted. Identical outcomes need no decision.
    if ours_action == REMOVED and theirs_action == REMOVED:
        decision.classification = BOTH_SAME
        decision.resolutions = ["remove"]
        decision.default = "remove"
        decision.detail = "Both deleted this."
        return decision

    if _same_item(ours_item, theirs_item, comparable):
        # ...unless the "identity" is synthesized from geometry and the two sides put
        # DIFFERENT nets there. The comparable keys for a track are position, layer and
        # width, none of which include the net, so two unrelated traces in the same spot
        # compare equal here. Calling that "both made the same change" would drop one
        # engineer's connection without a word. Checked before the sameness test, not
        # after, because this IS the sameness test being wrong.
        if net_aware and _collides_on_net(
            kind, ours_action, theirs_action, ours_item, theirs_item
        ):
            return _as_collision(decision, ours_item, theirs_item)

        # ...and unless we cannot actually SEE what either side did. The diff engine
        # says both sides edited this, yet every field we know how to compare agrees.
        # Something changed that our comparable-key list does not cover, and calling
        # that "both made the same change" throws one side's work away.
        #
        # KiCad's engine refuses the same case: "Resolving as MERGE_PROPS with zero
        # props would silently lose that change; flag a conflict instead."
        #
        # An empty `comparable` reaches here too, which is the point: a type we have no
        # keys for is not a type where everything agrees, it is a type we cannot judge.
        #
        # Only when the sides made no VISIBLE change at all. Two people who made the
        # same describable edit really did agree, and turning that into a conflict would
        # be the opposite mistake: work nobody has to do, on every merge.
        if _both_edited(ours_action, theirs_action) and _matches_base(
            base_item, ours_item, comparable
        ):
            return _as_undescribable(decision, comparable)

        decision.classification = BOTH_SAME
        decision.resolutions = ["ours"]
        decision.default = "ours"
        decision.detail = "Both made the same change."
        return decision

    # Two sides that each ADDED something at the same coordinates on different nets are
    # two objects, not one disagreement. Checked here too, because they may also differ
    # on width or layer and would otherwise be reported as a conflict the user cannot
    # resolve correctly (neither "ours" nor "theirs" is right; both belong).
    if net_aware and _collides_on_net(
        kind, ours_action, theirs_action, ours_item, theirs_item
    ):
        return _as_collision(decision, ours_item, theirs_item)

    # A delete on one side against an edit on the other is a real conflict even though
    # no field overlaps: keeping the edit resurrects an object someone deleted, and
    # taking the delete discards work. Only a human can say which was meant.
    if REMOVED in (ours_action, theirs_action):
        decision.classification = CONFLICT
        decision.resolutions = ["ours", "theirs"]
        decision.default = "ours"
        decision.detail = (
            "One side deleted this, the other edited it."
            if CHANGED in (ours_action, theirs_action)
            else "One side deleted this."
        )
        return decision

    # Both edited. Conflict only where they touched the SAME field with DIFFERENT
    # values: ours moving a footprint while theirs renames it is two edits that both
    # apply, and calling that a conflict would make the feature exhausting to use.
    overlap = _overlapping_fields(
        base_item, ours_item, theirs_item, comparable, theirs_base=theirs_base
    )
    if overlap:
        decision.classification = CONFLICT
        decision.resolutions = ["ours", "theirs"]
        decision.default = "ours"
        decision.conflicting_fields = overlap
        decision.detail = f"Both changed {', '.join(sorted(overlap))}."
        return decision

    # Both edited, but no field overlaps: ours moved it while theirs renamed it. BOTH
    # edits are wanted, so this cannot resolve to one side. Picking "theirs" here would
    # silently discard the move, which is the quiet data loss this whole feature exists
    # to prevent. The patch builder merges the fields instead.
    decision.classification = BOTH_FIELDS
    decision.resolutions = ["both", "ours", "theirs"]
    decision.default = "both"
    decision.merged_fields = _merge_fields(
        base_item, ours_item, theirs_item, comparable
    )
    fields = ", ".join(sorted(decision.merged_fields))
    decision.detail = f"Each side changed different fields ({fields})."
    return decision


def _merge_fields(
    base_item: dict | None,
    ours_item: dict | None,
    theirs_item: dict | None,
    comparable: list[str],
) -> dict:
    """Which side each non-overlapping changed field should come from.

    Only reached when the two sides changed disjoint fields, so for every field at most
    one side moved away from base and there is nothing to arbitrate.
    """
    taken: dict[str, str] = {}
    for key in comparable:
        base_value = (base_item or {}).get(key)
        ours_value = (ours_item or {}).get(key)
        theirs_value = (theirs_item or {}).get(key)
        if theirs_value != base_value and theirs_value != ours_value:
            taken[key] = "theirs"
        elif ours_value != base_value:
            taken[key] = "ours"
    return taken


def _describe(action: str, who: str) -> str:
    return {
        ADDED: f"Added by {who}.",
        REMOVED: f"Deleted by {who}.",
        CHANGED: f"Edited by {who}.",
    }.get(action, "")


def _same_item(a: dict | None, b: dict | None, comparable: list[str]) -> bool:
    """Do two items agree on every field that counts as a change?"""
    if a is None or b is None:
        return a is b
    return all(a.get(k) == b.get(k) for k in comparable)


def _overlapping_fields(
    base_item: dict | None,
    ours_item: dict | None,
    theirs_item: dict | None,
    comparable: list[str],
    theirs_base: dict | None = None,
) -> dict:
    """Fields both sides changed away from base, to different values.

    `base_item` is the ancestor as OUR side recorded it; `theirs_base` as theirs did.
    They are usually the same record, and when they are this behaves as you would
    expect: a side still holding the ancestor value is not a participant in a conflict,
    so the other side's edit applies cleanly.

    When they DISAGREE, no-op detection is not safe. Judged against their ancestor, our
    genuine edit can look like the losing half of a change they never made, and it
    disappears without a word. So a disagreement about the ancestor is itself a conflict:
    only a human knows which one was real.

    KiCad's own merge engine states the rule plainly: "The no-op detectors require
    matching `before` values on both sides; without that check a stale baseline (e.g.,
    theirs computed against a different ancestor) would silently override a real edit on
    the other side."
    """
    if ours_item is None or theirs_item is None:
        return {}

    overlap = {}
    for key in comparable:
        base_value = (base_item or {}).get(key)
        ours_value = ours_item.get(key)
        theirs_value = theirs_item.get(key)
        if ours_value == theirs_value:
            continue

        # Both sides must agree on what the ancestor held before either can be called
        # unchanged. Without a recorded ancestor at all there is nothing to agree on,
        # which is the same answer: we cannot prove a no-op, so we must not assume one.
        baselines_match = (
            base_item is not None
            and theirs_base is not None
            and base_value == theirs_base.get(key)
        )
        if baselines_match and (ours_value == base_value or theirs_value == base_value):
            continue

        overlap[key] = {
            "base": base_value,
            "ours": ours_value,
            "theirs": theirs_value,
        }
    return overlap


def _is_geometry_keyed(kind: str) -> bool:
    """Is this object's identity synthesized from its geometry rather than a uuid?

    Tracks, vias and arcs have no stable uuid in the diff engine, so their key IS their
    position. That makes "same key" mean "same place", not "same object".
    """
    return kind in ("segment", "via", "arc")


def _collides_on_net(
    kind: str,
    ours_action: str,
    theirs_action: str,
    ours_item: dict | None,
    theirs_item: dict | None,
) -> bool:
    """Did both sides independently put something here, carrying different nets?

    Only meaningful for geometry-keyed objects, and only when BOTH sides added: an edit
    to a shared track is a genuine two-people-one-object case, whereas two adds are two
    objects that merely landed on the same key.
    """
    if not _is_geometry_keyed(kind):
        return False
    if ours_action != ADDED or theirs_action != ADDED:
        return False
    return (ours_item or {}).get("net_name") != (theirs_item or {}).get("net_name")


def _matches_base(
    base_item: dict | None, item: dict | None, comparable: list[str]
) -> bool:
    """Does this side look untouched, by every field we can see?

    True is the alarming answer: the diff engine said this side edited the object, so if
    nothing we can compare moved, the edit is in something we cannot describe.

    With no comparable keys at all this is vacuously true, which is correct - a type we
    have no keys for is one where every change is invisible to us.
    """
    if item is None:
        return False
    reference = base_item or {}
    return all(item.get(field) == reference.get(field) for field in comparable)


def _both_edited(ours_action: str, theirs_action: str) -> bool:
    """Did both sides genuinely act on this object?

    A delete on either side is handled elsewhere and has its own, clearer message.
    """
    return ours_action in (ADDED, CHANGED) and theirs_action in (ADDED, CHANGED)


def _as_undescribable(decision: Decision3, comparable: list[str]) -> Decision3:
    """Both sides edited it, and we cannot say what either of them did.

    Defaults to ours, like every other refusal, so accepting without reading can never
    be the destructive choice. The message distinguishes the two ways to get here,
    because they need different fixes: an unknown item type is ours to correct, while a
    field we do not track is something the user has to look at themselves.
    """
    decision.classification = UNDESCRIBABLE
    decision.resolutions = ["ours", "theirs"]
    decision.default = "ours"
    decision.detail = (
        f"Both sides edited this, but Prism cannot compare {decision.kind} objects, "
        "so it cannot show what differs. Open both versions before choosing."
        if not comparable
        else "Both sides edited this, but the difference is in something Prism does "
        "not track. Open both versions before choosing."
    )
    return decision


def _as_collision(
    decision: Decision3, ours_item: dict | None, theirs_item: dict | None
) -> Decision3:
    """Mark a decision as two objects sharing a key, with "keep both" the default."""
    decision.classification = KEY_COLLISION
    decision.resolutions = ["both", "ours", "theirs"]
    decision.default = "both"
    ours_net = (ours_item or {}).get("net_name") or "?"
    theirs_net = (theirs_item or {}).get("net_name") or "?"
    decision.detail = (
        f"Both routed something here, on different nets ({ours_net} and {theirs_net})."
    )
    return decision


def diff3_pcb(
    base: str,
    ours: str,
    theirs: str,
    parser: str = "native",
) -> list[Decision3]:
    """What ours and theirs each did to every object on the board, since base.

    Returns one Decision3 per object that either side touched. Untouched objects are
    omitted: they are the overwhelming majority of a board, and listing them would bury
    the handful that need attention.
    """
    base_items = pcb._extract_pcb_items(base, parser)
    ours_items = pcb._extract_pcb_items(ours, parser)
    theirs_items = pcb._extract_pcb_items(theirs, parser)

    return _diff3_items(
        base_items,
        ours_items,
        theirs_items,
        pcb._diff_pcb_items,
        pcb._PCB_COMPARABLE_KEYS,
        net_aware=True,
    )


def diff3_pcb_grouped(
    base: str,
    ours: str,
    theirs: str,
    parser: str = "native",
) -> tuple[list[Decision3], list]:
    """`diff3_pcb`, plus the routing runs those decisions fall into.

    Separate from `diff3_pcb` so the merge path stays exactly as it was: grouping is
    advisory, and nothing that writes bytes should depend on it. Callers that only merge
    keep using `diff3_pcb`; callers that ask a person to choose use this.
    """
    base_items = pcb._extract_pcb_items(base, parser)
    ours_items = pcb._extract_pcb_items(ours, parser)
    theirs_items = pcb._extract_pcb_items(theirs, parser)

    decisions = _diff3_items(
        base_items,
        ours_items,
        theirs_items,
        pcb._diff_pcb_items,
        pcb._PCB_COMPARABLE_KEYS,
        net_aware=True,
    )

    try:
        groups = trace_groups.build_groups(
            decisions, base_items, ours_items, theirs_items
        )
    except Exception:
        # Grouping is a convenience over a correct decision list. If it fails, the merge
        # is still safe to run ungrouped, so log it and carry on rather than taking the
        # whole plan down.
        log.exception("trace grouping failed; continuing without groups")
        groups = []

    return decisions, groups


def diff3_sch(
    base: str,
    ours: str,
    theirs: str,
    parser: str = "native",
) -> list[Decision3]:
    """The schematic equivalent. Every object carries a uuid, so no geometry keys."""
    base_items = sch._extract_sch_items(base, parser)
    ours_items = sch._extract_sch_items(ours, parser)
    theirs_items = sch._extract_sch_items(theirs, parser)

    return _diff3_items(
        base_items,
        ours_items,
        theirs_items,
        sch._diff_sch_items,
        sch._COMPARABLE_KEYS,
        net_aware=False,
    )


def _diff3_items(
    base_items: dict,
    ours_items: dict,
    theirs_items: dict,
    pairwise,
    comparable_keys: dict,
    net_aware: bool,
) -> list[Decision3]:
    """The join. Two pairwise diffs against base, reconciled key by key."""
    # track_net_names so a track whose net was RENAMED counts as changed. Net index
    # renumbering is already excluded from identity, so this catches real edits only.
    ours_side = _index_side(
        pairwise(
            base_items, ours_items, **({"track_net_names": True} if net_aware else {})
        )
    )
    theirs_side = _index_side(
        pairwise(
            base_items, theirs_items, **({"track_net_names": True} if net_aware else {})
        )
    )

    # Objects whose uuid churned look like a delete on one side and an unrelated add on
    # the other. Fold those back together BEFORE classifying, so the user sees one part
    # that moved rather than two unconnected events. Only keys the exact pass could not
    # account for are offered, so this can never override a uuid.
    inferred = _infer_identities(ours_side, theirs_side)

    decisions: list[Decision3] = []
    for key in sorted(set(ours_side) | set(theirs_side) - set(inferred.consumed)):
        ours_action, ours_item, ours_base = ours_side.get(key, (KEPT, None, None))
        theirs_action, theirs_item, theirs_base = theirs_side.get(
            key, (KEPT, None, None)
        )

        # An inferred partner is the same object under its new id. Fold it in on
        # whichever side reported it, so the pair reads as one object rather than an
        # unexplained delete next to an unexplained add.
        partner = inferred.pairs.get(key)
        if partner is not None:
            if partner in theirs_side:
                theirs_action, theirs_item, theirs_base = theirs_side[partner]
            elif partner in ours_side:
                ours_action, ours_item, ours_base = ours_side[partner]

        if ours_action == KEPT:
            ours_item = ours_items.get(key)
        if theirs_action == KEPT:
            theirs_item = theirs_items.get(key)

        # Each side's own record of the ancestor, kept SEPARATE. Collapsing them to one
        # value with `or` is how a genuine edit gets discarded: judged against the wrong
        # ancestor, the other side looks like a no-op that never happened. When both
        # pairwise diffs came from the same base_items these are identical and nothing
        # changes; when they are not, `_overlapping_fields` refuses rather than guesses.
        shared_base = base_items.get(key)
        our_base = shared_base or ours_base
        their_base = shared_base or theirs_base
        base_item = our_base or their_base
        kind = (ours_item or theirs_item or base_item or {}).get("type") or "unknown"
        comparable = comparable_keys.get(kind, [])

        decision = _classify(
            key=key,
            kind=kind,
            ours_action=ours_action,
            theirs_action=theirs_action,
            base_item=our_base or base_item,
            ours_item=ours_item,
            theirs_item=theirs_item,
            comparable=comparable,
            net_aware=net_aware,
            theirs_base=their_base,
        )

        if partner is not None:
            # Say so. This pairing is our opinion, not a fact the file stated, and the
            # reader deserves to know which one they are looking at before they accept
            # it. Never auto-resolves: an identity we guessed at is exactly the thing a
            # person should confirm.
            decision.inferred_identity = True
            decision.inferred_from = partner
            decision.inferred_score = inferred.scores[key]
            decision.detail = (
                "This looks like the same object with a new id, rather than one "
                "deleted and another added. Check before accepting."
            )

        # A geometry-keyed object that MOVED is filed under its new position, while our
        # file still holds it at the old one. Record that old key so applying the
        # decision can clear it; without this, taking theirs leaves both copies on the
        # board, which reads as a short rather than a move.
        their_old = their_base.get("uuid") if their_base else None
        if (
            their_old
            and their_old != key
            and their_old not in ours_side
            and their_old not in theirs_side
        ):
            decision.supersedes = their_old

        if decision.classification != UNCHANGED:
            decisions.append(decision)

    return decisions


@dataclass
class _Inferred:
    """Pairings the similarity pass proposed."""

    pairs: dict[str, str] = field(default_factory=dict)
    consumed: set[str] = field(default_factory=set)
    scores: dict[str, float] = field(default_factory=dict)


def _infer_identities(ours_side: dict, theirs_side: dict) -> _Inferred:
    """Pair a removal with an addition that looks like the same object.

    A churned uuid shows up in one of two shapes, and both matter:

      - ONE side rewrote it, so that side reports a removal AND an addition while the
        other reports nothing. This is the common case: somebody re-imported a
        schematic or ran a library operation on their branch.
      - each side ended up with a different id, so the removal is on one and the
        addition on the other.

    Only removed-against-added is considered. An object both files still agree on has an
    identity we were given; second-guessing that with a similarity score is how a merge
    starts inventing history.
    """
    removed: dict[str, dict] = {}
    added: dict[str, dict] = {}
    for side in (ours_side, theirs_side):
        for key, (action, item, _base) in side.items():
            if action == REMOVED:
                removed[key] = item
            elif action == ADDED:
                added[key] = item

    # A key that is both removed and added is one side's rewrite reported twice; the
    # exact pass already accounts for it.
    for key in set(removed) & set(added):
        del removed[key]
        del added[key]

    if not removed or not added:
        return _Inferred()

    result = _Inferred()
    for match in identity_match.infer(removed, added, list(removed), list(added)):
        result.pairs[match.ours_key] = match.theirs_key
        result.consumed.add(match.theirs_key)
        result.scores[match.ours_key] = match.score

    if result.pairs:
        log.debug("inferred %d identity match(es) by similarity", len(result.pairs))
    return result


def summarise(decisions: list[Decision3]) -> dict:
    """Counts for the UI header, so it can say what needs attention before rendering."""
    counts: dict[str, int] = {}
    for decision in decisions:
        counts[decision.classification] = counts.get(decision.classification, 0) + 1
    return {
        "total": len(decisions),
        "needs_input": sum(1 for d in decisions if d.needs_input),
        "by_classification": counts,
    }

"""Recognising that two objects are the same object, when the uuid does not say so.

Most of the time identity is free: KiCad writes a uuid, both sides carry it, and the
merge engine matches on it exactly. This module is for the rest.

A uuid can churn. Re-importing a schematic, some library operations, and a few plugins
will rewrite one while leaving the object otherwise untouched. To a uuid-only matcher
that reads as "you deleted a footprint and added an unrelated one at the same place",
which is technically defensible and useless to the person reviewing it: they lose the
history of a part they never moved.

So unmatched objects get a second pass that scores how alike they are. The design is
borrowed from KiCad's own IDENTITY_RECONCILER (upstream commit a00c25e5), including the
two details that make it safe rather than merely clever - see `_key_prop_overlap` and
`THRESHOLD`.

Deliberately type-agnostic. It sees `ItemDescriptor` and nothing else; everything KiCad
specific lives in KEY_PROPS. That is what makes the matcher testable without boards, and
it is how the weights below can be tuned against fixtures rather than guessed at.
"""

from __future__ import annotations

from dataclasses import dataclass, field

# What a match is made of. Position and bounding box say "in the same place"; key
# properties say "and it is the same kind of thing". Neither alone is enough.
POSITION_WEIGHT = 0.40
BBOX_WEIGHT = 0.20
KEY_PROPS_WEIGHT = 0.40

# Deliberately high. An object with no identifying properties can reach at most
# POSITION + BBOX = 0.60, so it can never match here - which is the point. Guessing
# wrong is worse than not guessing: a wrong match splices the wrong object into
# somebody's board, and unlike a corrupt file nothing downstream catches it. The file
# parses, passes integrity, and opens in KiCad. It is simply not their board.
THRESHOLD = 0.85

# Positions must agree exactly by default. A tolerance would let two adjacent parts on a
# fine-pitch board match each other, and board coordinates are integers of nanometres:
# "close" is not a thing that happens by accident.
POSITION_TOLERANCE = 0.0

# The identifying fields per type. This is the ONLY KiCad knowledge in the module.
#
# Chosen for stability, not descriptiveness: a footprint's library id survives being
# moved, rotated and renamed, so it is worth more as evidence than its position. Net
# NAME rather than net index, because indices are file-local and KiCad renumbers them on
# every add or remove, which would make this signal worse than useless across branches.
KEY_PROPS: dict[str, tuple[str, ...]] = {
    "footprint": ("lib_id", "reference"),
    "segment": ("net_name", "layer"),
    "arc": ("net_name", "layer"),
    "via": ("net_name",),
    "zone": ("name", "net_name"),
    "symbol": ("lib_id", "reference"),
}


@dataclass(frozen=True)
class ItemDescriptor:
    """Everything the matcher is allowed to know about an object."""

    key: str
    type: str
    x: float
    y: float
    bbox: tuple[float, float, float, float] | None = None
    key_props: tuple[tuple[str, str], ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class Match:
    """One inferred pairing, and how confident we were."""

    ours_key: str
    theirs_key: str
    score: float


def describe(key: str, item: dict) -> ItemDescriptor:
    """Turn an extracted item into something the matcher can score.

    Absent key properties are omitted rather than recorded as empty. An empty value is
    not evidence of anything, and counting it as a match would let two objects agree by
    both lacking a reference.
    """
    kind = item.get("type") or "unknown"
    props = []
    for name in KEY_PROPS.get(kind, ()):
        value = item.get(name)
        if value not in (None, ""):
            props.append((name, str(value)))

    return ItemDescriptor(
        key=key,
        type=kind,
        x=float(item.get("x") or 0.0),
        y=float(item.get("y") or 0.0),
        bbox=_bbox_of(item),
        key_props=tuple(sorted(props)),
    )


def _bbox_of(item: dict) -> tuple[float, float, float, float] | None:
    """The item's extent, as four numbers the matcher can compare.

    For anything with endpoints this is the ENDPOINTS, normalised so that drawing a
    track A-to-B and B-to-A gives the same answer. It is deliberately not a bounding
    box: two tracks crossing in an X share a box, a midpoint, a net and a layer, and a
    box-based comparison scores them a perfect match. Found on a real 9MB board, where
    it was the only false match in 39.8 million pairs.
    """
    if all(k in item for k in ("start_x", "start_y", "end_x", "end_y")):
        start = (float(item["start_x"]), float(item["start_y"]))
        end = (float(item["end_x"]), float(item["end_y"]))
        # Direction carries no meaning, so order the pair rather than the coordinates.
        low, high = sorted((start, end))
        return (low[0], low[1], high[0], high[1])

    points = item.get("polygon_points")
    if points:
        xs = [float(p[0]) for p in points]
        ys = [float(p[1]) for p in points]
        return (min(xs), min(ys), max(xs), max(ys))

    return None


def _close(a: float, b: float, tolerance: float = POSITION_TOLERANCE) -> bool:
    return abs(a - b) <= tolerance


def _key_prop_overlap(
    a: tuple[tuple[str, str], ...], b: tuple[tuple[str, str], ...]
) -> float:
    """How much two property sets agree, from 0 to 1.

    Two decisions here are load-bearing, both taken from KiCad's engine.

    **Empty scores 0.0, not 1.0.** Objects with no identifying properties supply no
    evidence, and treating "nothing to disagree about" as perfect agreement would let
    two unrelated items at the same coordinates match at the maximum possible score.

    **The denominator is max(), not min() or len(a).** max() makes the score symmetric,
    so `overlap(a, b) == overlap(b, a)` and the matcher cannot depend on which file was
    read first. min() would over-credit a set that is a strict subset of the other;
    len(a) would make the result depend on argument order.
    """
    if not a or not b:
        return 0.0

    shared = len(set(a) & set(b))
    return shared / max(len(a), len(b))


def score(a: ItemDescriptor, b: ItemDescriptor) -> float:
    """How likely is it that these two are the same object? 0 to 1.

    Bounding boxes are optional, and a missing one is not evidence either way. Several
    real types carry no extractable extent - footprints and vias among them - and
    scoring an absent box as disagreement puts a ceiling of 0.80 on exactly the type
    this module exists to recover. So when neither side has a box, the remaining
    evidence is renormalised over the weights that actually applied.

    Renormalising rather than simply granting the points matters: an object with no
    identifying properties still cannot reach the threshold, because position alone
    normalises to 0.40/0.60 = 0.67. The empty-key-props guard survives.
    """
    if a.type != b.type:
        return 0.0  # never match across types, whatever else agrees

    total = 0.0
    available = POSITION_WEIGHT + KEY_PROPS_WEIGHT

    if _close(a.x, b.x) and _close(a.y, b.y):
        total += POSITION_WEIGHT

    if a.bbox is not None and b.bbox is not None:
        available += BBOX_WEIGHT
        if _bboxes_close(a.bbox, b.bbox):
            total += BBOX_WEIGHT

    total += _key_prop_overlap(a.key_props, b.key_props) * KEY_PROPS_WEIGHT
    return total / available


def _bboxes_close(
    a: tuple[float, float, float, float], b: tuple[float, float, float, float]
) -> bool:
    return all(_close(x, y) for x, y in zip(a, b, strict=True))


def reconcile(
    ours: list[ItemDescriptor],
    theirs: list[ItemDescriptor],
    threshold: float = THRESHOLD,
) -> list[Match]:
    """Pair up objects that look like each other, best matches first.

    Global best-first, not per-item greedy: every candidate above the threshold is
    scored, then the whole list is sorted and swept, taking a pair only when neither
    side is already spoken for. Per-item greedy would let whichever object happened to
    be considered first claim a partner that was a better match for something else, and
    would make the result depend on input order.

    Ties break on key order so two runs over the same data always agree. A merge that
    proposed different pairings on a refresh would be impossible to trust.
    """
    by_type: dict[str, list[ItemDescriptor]] = {}
    for descriptor in theirs:
        by_type.setdefault(descriptor.type, []).append(descriptor)

    candidates: list[tuple[float, str, str]] = []
    for ours_item in ours:
        # Only same-type candidates. Scoring across types is guaranteed zero, and on a
        # large board the cross product of everything against everything is the whole
        # cost of this pass.
        for theirs_item in by_type.get(ours_item.type, ()):
            value = score(ours_item, theirs_item)
            if value >= threshold:
                candidates.append((value, ours_item.key, theirs_item.key))

    candidates.sort(key=lambda c: (-c[0], c[1], c[2]))

    matched_ours: set[str] = set()
    matched_theirs: set[str] = set()
    results: list[Match] = []

    for value, ours_key, theirs_key in candidates:
        if ours_key in matched_ours or theirs_key in matched_theirs:
            continue
        matched_ours.add(ours_key)
        matched_theirs.add(theirs_key)
        results.append(Match(ours_key=ours_key, theirs_key=theirs_key, score=value))

    return results


def infer(
    ours_items: dict[str, dict],
    theirs_items: dict[str, dict],
    ours_keys: list[str],
    theirs_keys: list[str],
    threshold: float = THRESHOLD,
) -> list[Match]:
    """Match leftovers, given the keys each side could not account for.

    The caller passes only what the exact pass failed to match, so this can never
    override a uuid. That ordering is the safety property: a uuid is a statement of fact
    and a similarity score is an opinion, and the opinion never gets to argue.
    """
    ours = [describe(k, ours_items[k]) for k in ours_keys if k in ours_items]
    theirs = [describe(k, theirs_items[k]) for k in theirs_keys if k in theirs_items]
    return reconcile(ours, theirs, threshold)

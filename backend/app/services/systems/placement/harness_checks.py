"""Harness lengths and board collisions (CONTRACTS_P2 §17.10, SB2-46).

From a routed harness (``harness_route.route``):

- **Lengths.** The bundle is the curves' arc lengths plus each posed end's housing depth; a
  wire runs the segments that carry it plus its two ends' depths. Estimates add the service
  allowance (the harness's own, else ``LENGTH_ALLOWANCE``).
- **Collisions.** Each board is an oriented box (its outline × thickness, ``boundsMm`` in its own
  frame) grown by ``BOARD_COLLISION_MARGIN_MM``; each span between two samples is a capsule of
  the segment's bundle radius. A span closer to a box than that radius collides. The first
  ``BOOT_MM`` of arc from an end's exit is exempt against the board that end mates.

Distances are exact to the search: the squared distance from a point moving along a span to a
box is convex, so a fixed golden-section search finds its minimum the same way in both halves.
Only squares and one square root are used, never ``hypot``, so the halves agree bit for bit.

The twin of ``frontend/src/features/system-builder/placement/harness-checks.ts``; goldens
``harnessChecks`` in ``placement_cases.json``.
"""

from __future__ import annotations

import math
from typing import Any, Mapping, Optional, Sequence

from app.services.systems.placement import harness_spec as spec

Vec = list[float]
GOLDEN = (math.sqrt(5.0) - 1.0) / 2.0
SEARCH_STEPS = 60


def _box_distance2(p: Sequence[float], lo: Sequence[float], hi: Sequence[float]) -> float:
    total = 0.0
    for k in range(3):
        d = lo[k] - p[k] if p[k] < lo[k] else p[k] - hi[k] if p[k] > hi[k] else 0.0
        total += d * d
    return total


def span_box_distance(a: Sequence[float], b: Sequence[float], lo: Sequence[float],
                      hi: Sequence[float]) -> tuple[float, float]:
    """``(distance, t)``: the least distance from the span a→b to the box ``lo``–``hi`` (same frame)
    and where along the span (0…1) it is."""
    def f(t: float) -> float:
        return _box_distance2([a[k] + t * (b[k] - a[k]) for k in range(3)], lo, hi)

    left, right = 0.0, 1.0
    x1, x2 = right - GOLDEN * (right - left), left + GOLDEN * (right - left)
    f1, f2 = f(x1), f(x2)
    for _ in range(SEARCH_STEPS):
        if f1 <= f2:
            right, x2, f2 = x2, x1, f1
            x1 = right - GOLDEN * (right - left)
            f1 = f(x1)
        else:
            left, x1, f1 = x1, x2, f2
            x2 = left + GOLDEN * (right - left)
            f2 = f(x2)
    best_t, best = (x1, f1) if f1 <= f2 else (x2, f2)
    for t in (0.0, 1.0):
        value = f(t)
        if value < best:
            best_t, best = t, value
    return math.sqrt(best), best_t


def _local(m: Sequence[float], p: Sequence[float]) -> Vec:
    """A world point in a rigid column-major matrix's frame: Rᵀ(p − t)."""
    d = [p[0] - m[12], p[1] - m[13], p[2] - m[14]]
    return [m[k * 4] * d[0] + m[k * 4 + 1] * d[1] + m[k * 4 + 2] * d[2] for k in range(3)]


def _span(samples: Sequence[Sequence[float]], i: int) -> float:
    a, b = samples[i], samples[i + 1]
    return math.sqrt(sum((b[k] - a[k]) * (b[k] - a[k]) for k in range(3)))


def _exempt(samples: Sequence[Sequence[float]], from_start: bool) -> int:
    """How many spans lie (at least partly) within the first boot of arc from the start (or the end)."""
    count = len(samples) - 1
    arc = 0.0
    for n in range(count):
        i = n if from_start else count - 1 - n
        if arc >= spec.BOOT_MM:
            return n
        arc += _span(samples, i)
    return count


def collisions(routed: Mapping[str, Any], boards: Sequence[Mapping[str, Any]]) -> list[dict]:
    """Every segment–board pair that collides, in curve then board order: ``{segmentId, board,
    distanceMm, radiusMm, atMm, spans}`` with ``spans`` the colliding span indices (span i joins
    samples i and i+1) and ``atMm`` the closest point of the closest span. ``boards`` are
    ``{id, matrix, minMm, maxMm}``: world matrix and box in the board's frame."""
    margin = spec.BOARD_COLLISION_MARGIN_MM
    boxes = []
    for board in boards:
        lo = [board["minMm"][k] - margin for k in range(3)]
        hi = [board["maxMm"][k] + margin for k in range(3)]
        boxes.append((board, lo, hi))
    out = []
    for curve in routed["curves"]:
        radius = curve["diameterMm"] / 2.0
        samples = curve["samplesMm"]
        if radius <= 0 or len(samples) < 2:
            continue
        count = len(samples) - 1
        exempt: dict[str, set[int]] = {}
        if curve["from"] in routed["ends"]:
            exempt.setdefault(routed["ends"][curve["from"]]["occurrence"], set()).update(range(_exempt(samples, True)))
        if curve["to"] in routed["ends"]:
            exempt.setdefault(routed["ends"][curve["to"]]["occurrence"], set()).update(
                range(count - _exempt(samples, False), count))
        for board, lo, hi in boxes:
            points = [_local(board["matrix"], p) for p in samples]
            skip = exempt.get(board["id"], set())
            spans, best = [], None
            for i in range(count):
                if i in skip:
                    continue
                distance, t = span_box_distance(points[i], points[i + 1], lo, hi)
                if distance < radius:
                    spans.append(i)
                    if best is None or distance < best[0]:
                        best = (distance, i, t)
            if best is not None:
                distance, i, t = best
                a, b = samples[i], samples[i + 1]
                out.append({"segmentId": curve["segmentId"], "board": board["id"], "distanceMm": distance,
                            "radiusMm": radius, "atMm": [a[k] + t * (b[k] - a[k]) for k in range(3)], "spans": spans})
    return out


def lengths(routed: Mapping[str, Any], allowance_pct: Optional[float] = None) -> dict:
    """``{bundleMm, estimatedMm, allowancePct, complete, wires: {wireId: {lengthMm, estimatedMm}}}``.
    ``complete`` is false when an end has no pose or a wire is unplaced: the numbers then cover
    only what is routed."""
    allowance = spec.LENGTH_ALLOWANCE if allowance_pct is None else allowance_pct / 100.0
    depth = {end_id: end["depthMm"] for end_id, end in routed["ends"].items()}
    bundle = sum(c["lengthMm"] for c in routed["curves"]) + sum(depth.values())
    run: dict[str, float] = {}
    for curve in routed["curves"]:
        for wire in curve["wires"]:
            run[wire] = run.get(wire, 0.0) + curve["lengthMm"]
    wires = {}
    for wire in routed["wires"]:
        if wire["id"] in run:
            length = run[wire["id"]] + depth[wire["from"]] + depth[wire["to"]]
            wires[wire["id"]] = {"lengthMm": length, "estimatedMm": length * (1.0 + allowance)}
    return {"bundleMm": bundle, "estimatedMm": bundle * (1.0 + allowance), "allowancePct": allowance * 100.0,
            "complete": not routed["unplaced"], "wires": wires}

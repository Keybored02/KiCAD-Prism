"""Harness topology: runs, breakouts and per-segment wire sets (CONTRACTS_P2 §17.7; PLAN §7 item 3, 7).

A harness is a tree. Its leaves are the ends that have a pose (SB2-41); its
inner nodes are breakouts. Every edge is a **segment**, carrying the wires whose
two ends lie on opposite sides of it, and drawn with the bundle diameter of
those wires. The TypeScript twin is ``frontend/.../placement/harness-topology.ts``;
change both and the shared goldens together.
"""

from __future__ import annotations

import math
from typing import Any, Mapping, Optional, Sequence

from . import harness_spec as spec
from .poses import _clean


def _bundle(wires: Sequence[Mapping[str, Any]]) -> tuple[float, bool]:
    """``d = k·√Σ dᵢ²`` (§17.5) and whether any gauge was assumed; 0 without wires."""
    if not wires:
        return 0.0, False
    total, assumed = 0.0, False
    for wire in wires:
        od, guessed = spec.wire_od_mm(wire.get("gaugeAwg"))
        total += od * od
        assumed = assumed or guessed
    return _clean(spec.PACKING_FACTOR * math.sqrt(total)), assumed


def _auto_breakout(ends: Sequence[Mapping[str, Any]], weight: Mapping[str, int]) -> list[float]:
    """The wire-count-weighted centroid of the leg points, lifted along the mean outward axis."""
    weights = [max(weight.get(e["id"], 0), 0) for e in ends]
    if sum(weights) == 0:
        weights = [1] * len(ends)
    total = float(sum(weights))
    centre = [sum(w * e["legMm"][k] for w, e in zip(weights, ends)) / total for k in range(3)]
    mean = [sum(e["outward"][k] for e in ends) / len(ends) for k in range(3)]
    size = math.sqrt(sum(c * c for c in mean))
    if size < 1e-9:
        return centre
    return [centre[k] + spec.BREAKOUT_LIFT_MM * mean[k] / size for k in range(3)]


def topology(ends: Sequence[Mapping[str, Any]], wires: Sequence[Mapping[str, Any]],
             breakouts: Sequence[Mapping[str, Any]] = ()) -> dict:
    """The harness tree.

    - ``ends``: ``[{id, legMm, outward}]`` in ordinal order, only ends with a pose.
    - ``wires``: ``[{id, from: {end}, to: {end}, gaugeAwg?}]``; a wire touching an end without a
      pose is listed in ``unplaced``.
    - ``breakouts``: the user's, in order ``[{id, positionMm, ends?: [endId]}]``; an end not listed
      under any attaches to the nearest (by leg point, ties to the earlier). Consecutive breakouts
      are joined. Without user breakouts: none for two ends, one automatic (``id`` ``"auto"``) for more.

    Returns ``{nodes: [{id, kind: end|breakout, positionMm}], segments: [{id, from, to, wires,
    diameterMm, assumedGauge}], unplaced: [wireId]}``. Segments list end legs in end order, then
    breakout links in order; ``wires`` keep the wire order given.
    """
    by_end = {e["id"]: e for e in ends}
    placed = [w for w in wires if w["from"]["end"] in by_end and w["to"]["end"] in by_end]
    unplaced = [w["id"] for w in wires if w not in placed]
    weight: dict[str, int] = {}
    for wire in placed:
        for side in ("from", "to"):
            weight[wire[side]["end"]] = weight.get(wire[side]["end"], 0) + 1

    nodes = [{"id": e["id"], "kind": "end", "positionMm": [_clean(v) for v in e["legMm"]]} for e in ends]
    edges: list[tuple[str, str]] = []
    if breakouts:
        for b in breakouts:
            nodes.append({"id": b["id"], "kind": "breakout", "positionMm": [_clean(v) for v in b["positionMm"]]})
        assigned: dict[str, str] = {}
        for b in breakouts:  # an end listed under two breakouts belongs to the first
            for end_id in b.get("ends") or []:
                if end_id in by_end:
                    assigned.setdefault(end_id, b["id"])
        for end in ends:
            target = assigned.get(end["id"])
            if target is None:
                target = min(breakouts, key=lambda b: math.dist(b["positionMm"], end["legMm"]))["id"]
            edges.append((end["id"], target))
        edges += [(a["id"], b["id"]) for a, b in zip(breakouts, breakouts[1:])]
    elif len(ends) == 2:
        edges.append((ends[0]["id"], ends[1]["id"]))
    elif len(ends) > 2:
        nodes.append({"id": "auto", "kind": "breakout",
                      "positionMm": [_clean(v) for v in _auto_breakout(ends, weight)]})
        edges += [(end["id"], "auto") for end in ends]

    adjacency: dict[str, list[str]] = {n["id"]: [] for n in nodes}
    for a, b in edges:
        adjacency[a].append(b)
        adjacency[b].append(a)

    def side(start: str, cut: tuple[str, str]) -> set[str]:
        """The nodes reachable from ``start`` without crossing ``cut``."""
        seen, stack = {start}, [start]
        while stack:
            node = stack.pop()
            for other in adjacency[node]:
                if {node, other} == set(cut) or other in seen:
                    continue
                seen.add(other)
                stack.append(other)
        return seen

    segments = []
    for a, b in edges:
        near = side(a, (a, b))
        crossing = [w for w in placed if (w["from"]["end"] in near) != (w["to"]["end"] in near)]
        diameter, assumed = _bundle(crossing)
        segments.append({"id": f"{a}~{b}", "from": a, "to": b, "wires": [w["id"] for w in crossing],
                         "diameterMm": diameter, "assumedGauge": assumed})
    return {"nodes": nodes, "segments": segments, "unplaced": unplaced}

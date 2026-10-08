"""One harness routed in the world, from the scene's data (CONTRACTS_P2 §17.10, SB2-46).

A scene harness (ends located on board occurrences with their connectors, wires, nodes in the
level's frame) and each occurrence's world matrix give: the end poses (§17.6), the tree through
the stored breakouts (§17.7) and the curves through the stored waypoints (§17.8, §17.9). The
browser draws tubes from the same route; the server checks and measures it (``harness_checks``).

The twin of ``frontend/src/features/system-builder/placement/harness-route.ts``. Both run the
shared goldens in ``placement_cases.json`` (``harnessChecks``); change the two together.
"""

from __future__ import annotations

from typing import Any, Callable, Mapping, Optional, Sequence

from app.services.systems.placement import harness_curves, harness_ends, harness_nodes, harness_topology
from app.services.systems.placement.frames import quaternion

Matrix = Sequence[float]
IDENTITY = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0]


def matrix_pose(m: Matrix) -> dict:
    """A rigid column-major world matrix (mm) as a pose."""
    return {"translationMm": [m[12], m[13], m[14]],
            "rotation": quaternion([m[0], m[1], m[2]], [m[4], m[5], m[6]], [m[8], m[9], m[10]])}


def transform(m: Matrix, p: Sequence[float]) -> list[float]:
    """A point through a column-major matrix."""
    return [m[k] * p[0] + m[4 + k] * p[1] + m[8 + k] * p[2] + m[12 + k] for k in range(3)]


def route(harness: Mapping[str, Any], world_matrix_of: Callable[[str], Optional[Matrix]]) -> Optional[dict]:
    """The harness in world mm, or None with fewer than two posed ends.

    Returns ``{ends, tree, curves, unused, unplaced, wires}``: ``ends`` maps each posed end ID to its
    §17.6 pose plus ``occurrence``; ``curves`` are §17.8 results in tree order, each with the
    segment's ``from``, ``to``, ``wires``, ``diameterMm`` and ``assumedGauge``; ``unused`` lists
    waypoints no segment takes, ``unplaced`` the wires touching an end without a pose, ``wires``
    each wire's two end IDs.
    """
    posed: dict[str, dict] = {}
    for end in sorted(harness["ends"], key=lambda e: e["ordinal"]):
        matrix = world_matrix_of(end["occurrence"]) if end.get("occurrence") else None
        connector = end.get("connector")
        if matrix is None or not connector:
            continue
        pose = harness_ends.board_end(matrix_pose(matrix), connector["geometry"], connector.get("thicknessMm"),
                                      connector.get("stored"))
        if pose is not None:
            posed[end["id"]] = {**pose, "occurrence": end["occurrence"]}
    if len(posed) < 2:
        return None
    ends = [{"id": end_id, "legMm": pose["legMm"], "outward": pose["outward"]} for end_id, pose in posed.items()]
    wires = [{"id": w["id"], "from": {"end": w["from"]}, "to": {"end": w["to"]}, "gaugeAwg": w.get("gaugeAwg")}
             for w in harness["wires"]]
    # Nodes are stored in the harness's level frame; the root level is the world.
    level = world_matrix_of(harness["level"]) if harness.get("level") else IDENTITY
    nodes = [{**n, "positionMm": transform(level, n["positionMm"])} for n in harness.get("nodes") or []] \
        if level is not None else []
    tree = harness_topology.topology(ends, wires, harness_nodes.breakouts(nodes))
    split = harness_nodes.segment_waypoints(tree, nodes)
    by_id = {s["id"]: s for s in tree["segments"]}
    curves = []
    for curve in harness_curves.harness_curves(posed, tree, split["waypoints"], split["pinned"]):
        segment = by_id[curve["segmentId"]]
        curves.append({**curve, "from": segment["from"], "to": segment["to"], "wires": list(segment["wires"]),
                       "diameterMm": segment["diameterMm"], "assumedGauge": segment["assumedGauge"]})
    return {"ends": posed, "tree": tree, "curves": curves, "unused": split["unused"], "unplaced": tree["unplaced"],
            "wires": [{"id": w["id"], "from": w["from"], "to": w["to"]} for w in harness["wires"]]}

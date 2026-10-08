"""Stored harness nodes as inputs to the tree and the curves (CONTRACTS_P2 §17.9, SB2-45).

A harness's nodes (``system_harness_nodes``; the manifest's ``harnesses[].nodes``) are its
breakouts and waypoints, in the harness's system frame. ``breakouts`` gives the topology its
breakouts in chain order; ``segment_waypoints`` gives each segment of a built tree its waypoints
from the segment's ``from`` node toward its ``to`` node, and which of them are pinned.

The twin of ``frontend/src/features/system-builder/placement/harness-nodes.ts``. Both run the
shared goldens in ``placement_cases.json`` (``harnessNodes``); change the two together.
"""

from __future__ import annotations

from typing import Any, Mapping, Sequence


def _ordered(nodes: Sequence[Mapping[str, Any]], kind: str) -> list[Mapping[str, Any]]:
    return sorted((n for n in nodes if n["kind"] == kind), key=lambda n: (n["order"], n["id"]))


def breakouts(nodes: Sequence[Mapping[str, Any]]) -> list[dict]:
    """The breakouts in chain order, as SB2-42's ``topology`` takes them: ``{id, positionMm, ends}``."""
    return [{"id": n["id"], "positionMm": list(n["positionMm"]), "ends": list(n.get("ends") or [])}
            for n in _ordered(nodes, "breakout")]


def segment_waypoints(tree: Mapping[str, Any], nodes: Sequence[Mapping[str, Any]]) -> dict:
    """``{waypoints, pinned, unused}`` for a tree built from these nodes' breakouts.

    A waypoint lies between two nodes (``between``: end or breakout IDs) and belongs to the
    segment joining them, in either direction; along it the waypoints go by ``order`` from
    ``between[0]``. ``waypoints`` and ``pinned`` map segment ID → points and flags from the
    segment's ``from`` node; ``unused`` lists the waypoints whose two nodes are not a segment
    of the tree (an end without a pose, or a breakout that no longer joins them).
    """
    groups: dict[frozenset, list[Mapping[str, Any]]] = {}
    for node in _ordered(nodes, "waypoint"):
        groups.setdefault(frozenset(node["between"]), []).append(node)
    waypoints: dict[str, list[list[float]]] = {}
    pinned: dict[str, list[bool]] = {}
    used: set[frozenset] = set()
    for segment in tree["segments"]:
        key = frozenset((segment["from"], segment["to"]))
        group = groups.get(key)
        if not group:
            continue
        used.add(key)
        if group[0]["between"][0] != segment["from"]:
            group = group[::-1]
        waypoints[segment["id"]] = [list(n["positionMm"]) for n in group]
        pinned[segment["id"]] = [bool(n.get("pinned")) for n in group]
    unused = [n["id"] for key, group in groups.items() if key not in used for n in group]
    return {"waypoints": waypoints, "pinned": pinned, "unused": sorted(unused)}

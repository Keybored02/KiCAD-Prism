"""The tree solve: driving mates, auto poses and mate checks (CONTRACTS_P2 §14.9; PLAN §5.3).

Members are one system's instances (boards, assemblies, modules) in §14.3
order. B2B mates join them; each mated group is placed outward from its root
along one **driving** mate per member, and every other mate between placed
members is checked against where its own mate would put it (``SYS-V11``).
The twin is ``frontend/.../placement/solve.ts``; change both and the shared
goldens together.
"""

from __future__ import annotations

from typing import Any, Mapping, Optional, Sequence

from .frames import _natural
from .mate import inverse, mate, residual
from .poses import IDENTITY, Bounds, _clean, canonical_rotation, compose, default_row

MISMATCH_MM = 0.2
MISMATCH_DEG = 0.5


def _end_world(member_pose: Mapping[str, Any], end: Mapping[str, Any]) -> dict:
    """The world pose of the board an end's connector sits on (``inMember``: that board in its member)."""
    return compose(member_pose, end.get("inMember") or IDENTITY)


def _relative(link: Mapping[str, Any], result: Mapping[str, Any], from_side: str) -> dict:
    """The far member's frame in the near member's, through this link's mate."""
    a_in, b_in = link["a"].get("inMember") or IDENTITY, link["b"].get("inMember") or IDENTITY
    a_to_b = compose(compose(a_in, result["pose"]), inverse(b_in))
    return a_to_b if from_side == "a" else inverse(a_to_b)


def _clean_pose(pose: Mapping[str, Any], source: str) -> dict:
    return {"translationMm": [_clean(v) for v in pose["translationMm"]],
            "rotation": canonical_rotation(pose["rotation"]), "source": source}


def solve(
    items: Sequence[tuple[str, Optional[Bounds]]],
    stored: Mapping[str, Mapping[str, Any]],
    connections: Sequence[tuple[str, str]],
    mates: Sequence[Mapping[str, Any]],
    overrides: Optional[Mapping[str, str]] = None,
) -> dict:
    """Every member's pose with its ``source``, the driving mates and the mate checks.

    - ``items``, ``stored``: as for ``poses.place`` (members in §14.3 order with
      own-frame bounds; stored ``manual`` poses).
    - ``connections``: every link of the system as ``(memberA, memberB)``, any
      type; it ranks roots like the 2D layout's hub (most links).
    - ``mates``: the B2B links, ``{linkId, rows, stackHeightMm, a, b}``; an end
      is ``{member, reference, end, inMember?}`` with ``end`` a mate end
      (§14.8) and ``inMember`` the connector's board in its member (an
      assembly's board; identity for a board). A mate places only when both
      ends carry a stored (confirmed or override) frame (§15.2).
    - ``overrides``: ``{member: linkId}``, the user's driving mate choices.

    Returns ``{poses, driving, roots, mismatches, unusable, ignoredOverrides}``.
    """
    overrides = dict(overrides or {})
    order = {key: index for index, (key, _bounds) in enumerate(items)}
    defaults = default_row(items)
    degree = dict.fromkeys(order, 0)
    for a, b in connections:
        if a in degree:
            degree[a] += 1
        if b in degree and b != a:
            degree[b] += 1

    usable: list[tuple[Mapping[str, Any], dict]] = []
    unusable: list[str] = []
    for link in mates:
        a, b = link["a"], link["b"]
        if a["member"] not in order or b["member"] not in order or a["member"] == b["member"]:
            continue
        result = None
        if a["end"].get("stored") and b["end"].get("stored"):
            result = mate(a["end"], b["end"], link.get("stackHeightMm"))
        if result is None:
            unusable.append(link["linkId"])
        else:
            usable.append((link, result))
    by_id = {link["linkId"]: (link, result) for link, result in usable}

    ignored: list[dict] = []
    for member, link_id in sorted(overrides.items(), key=lambda kv: order.get(kv[0], len(order))):
        entry = by_id.get(link_id)
        if member not in order or entry is None or member not in (entry[0]["a"]["member"], entry[0]["b"]["member"]):
            ignored.append({"member": member, "linkId": link_id, "reason": "not_a_usable_mate"})
            overrides.pop(member)

    neighbours: dict[str, set[str]] = {key: set() for key in order}
    for link, _result in usable:
        neighbours[link["a"]["member"]].add(link["b"]["member"])
        neighbours[link["b"]["member"]].add(link["a"]["member"])

    poses: dict[str, dict] = {}
    designed: dict[str, dict] = {}  # every mated member where its mates put it, ignoring manual moves below the root
    driving: dict[str, dict] = {}
    roots: list[str] = []

    def own_pose(key: str) -> Optional[dict]:
        pose = stored.get(key)
        return _clean_pose(pose, pose["source"]) if pose is not None else None

    seen: set[str] = set()
    for start, _bounds in items:
        if start in seen or not neighbours[start]:
            continue
        group, queue = [start], [start]
        seen.add(start)
        while queue:
            for other in sorted(neighbours[queue.pop(0)], key=order.__getitem__):
                if other not in seen:
                    seen.add(other)
                    group.append(other)
                    queue.append(other)
        candidates = [m for m in group if m not in overrides] or group
        root = min(candidates, key=lambda m: (-degree[m], order[m]))
        roots.append(root)
        if root in overrides:
            ignored.append({"member": root, "linkId": overrides.pop(root), "reason": "root"})
        poses[root] = own_pose(root) or _clean_pose(defaults[root], "default")
        designed[root] = poses[root]

        placed = {root}
        while len(placed) < len(group):
            best = None
            for link, result in usable:
                for near, far in (("a", "b"), ("b", "a")):
                    x, y = link[near]["member"], link[far]["member"]
                    if x not in placed or y in placed:
                        continue
                    if y in overrides and overrides[y] != link["linkId"]:
                        continue
                    rank = (-int(link.get("rows") or 0), _natural(link[far].get("reference") or ""), link["linkId"])
                    if best is None or rank < best[0]:
                        best = (rank, link, result, near, x, y)
            if best is None:
                # Only overridden members are left, each waiting on a mate it can't reach: drop their overrides.
                stuck = sorted((m for m in group if m not in placed and m in overrides), key=order.__getitem__)
                if not stuck:
                    break
                for member in stuck:
                    ignored.append({"member": member, "linkId": overrides.pop(member), "reason": "unreachable"})
                continue
            _rank, link, result, near, x, y = best
            relative = _relative(link, result, near)
            auto = compose(poses[x], relative)
            designed[y] = compose(designed[x], relative)
            poses[y] = own_pose(y) or _clean_pose(auto, "auto")
            driving[y] = {"linkId": link["linkId"], "from": x, "autoPose": _clean_pose(auto, "auto"),
                          "overridden": y in stored}
            placed.add(y)

    for key, _bounds in items:
        if key not in poses:
            poses[key] = own_pose(key) or _clean_pose(defaults[key], "default")

    # SYS-V11 judges the mated design: a board moved by hand shows as overridden, never as a mismatch.
    driving_links = {entry["linkId"] for entry in driving.values()}
    mismatches = []
    for link, result in usable:
        if link["linkId"] in driving_links:
            continue
        a, b = link["a"], link["b"]
        got = residual(_end_world(designed[a["member"]], a), _end_world(designed[b["member"]], b), a["end"], b["end"],
                       result)
        axial = got["offsetMm"][2]
        if (got["lateralMm"] > MISMATCH_MM or got["angleDeg"] > MISMATCH_DEG
                or (link.get("stackHeightMm") is not None and abs(axial) > MISMATCH_MM)):
            mismatches.append({"linkId": link["linkId"], "offsetMm": got["offsetMm"], "lateralMm": got["lateralMm"],
                               "axialMm": _clean(axial), "angleDeg": got["angleDeg"]})

    return {"poses": poses, "driving": driving, "roots": roots, "mismatches": mismatches,
            "unusable": unusable, "ignoredOverrides": ignored}

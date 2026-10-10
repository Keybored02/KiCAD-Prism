"""The mate transform, connector bodies and stack-height clearance (CONTRACTS_P2 §14.5, §14.8).

Board B sits relative to board A as

    B = A · F_a · T(0, 0, h) · Rx(180°) · Rz(k · 90°) · F_b⁻¹

where ``F_a``/``F_b`` are the two connector frames (``frames.connector_frame``,
with any stored override and its quarter-turns applied), ``k`` puts pad 1 on
pad 1 and ``h`` is the link's stack height or the clearance fallback. Every
rule here has a twin in ``frontend/.../placement/mate.ts``; change both and the
shared goldens together.
"""

from __future__ import annotations

import math
from typing import Any, Mapping, Optional, Sequence

from .frames import _footprint_point, connector_frame
from .poses import _clean, canonical_rotation, compose, rotate

ASSUMED_BODY_HEIGHT_MM = 5.0  # a body without model bounds: courtyard × this
CLEARANCE_MARGIN_MM = 5.0  # an unknown stack sits visibly apart (§14.5)

_S = math.sqrt(0.5)
_QUARTER_TURNS = ([0.0, 0.0, 0.0, 1.0], [0.0, 0.0, _S, _S], [0.0, 0.0, 1.0, 0.0], [0.0, 0.0, _S, -_S])
_FLIP_X = [1.0, 0.0, 0.0, 0.0]

Vec = list[float]


def _frame_pose(frame: Mapping[str, Any]) -> dict:
    return {"translationMm": list(frame["originMm"]), "rotation": list(frame["rotation"])}


def inverse(pose: Mapping[str, Any]) -> dict:
    x, y, z, w = pose["rotation"]
    back = [-x, -y, -z, w]
    moved = rotate(back, pose["translationMm"])
    return {"translationMm": [_clean(-c) for c in moved], "rotation": canonical_rotation(back)}


def _local(frame: Mapping[str, Any], point: Sequence[float]) -> Vec:
    """A board-frame point in the connector frame's coordinates."""
    d = [point[i] - frame["originMm"][i] for i in range(3)]
    return [sum(d[i] * frame[axis][i] for i in range(3)) for axis in ("xAxis", "yAxis", "zAxis")]


def _mated(point: Sequence[float], k: int, h: float = 0.0) -> Vec:
    """A point in ``F_b`` coordinates → ``F_a`` coordinates under ``T(0,0,h)·Rx(180°)·Rz(k·90°)``."""
    x, y = point[0], point[1]
    for _ in range(k % 4):
        x, y = -y, x
    return [x, -y, h - point[2]]


def _pad_names(geometry: Mapping[str, Any], frame: Mapping[str, Any]) -> dict[str, Vec]:
    """Named pads' centres in the frame (pads sharing a name collapse to their centroid)."""
    groups: dict[str, list[Vec]] = {}
    for pad in geometry["pads"]:
        if pad["pad"]:
            groups.setdefault(pad["pad"], []).append(_local(frame, [*pad["positionMm"], frame["originMm"][2]]))
    return {name: [sum(p[i] for p in pts) / len(pts) for i in range(2)] for name, pts in groups.items()}


def pad_one_turns(geometry_a: Mapping[str, Any], frame_a: Mapping[str, Any],
                  geometry_b: Mapping[str, Any], frame_b: Mapping[str, Any]) -> int:
    """§14.5 default ``k``: the least summed distance between same-named pads, ties to the lower k.

    The frames are the *unturned* ones (the user's quarter-turns add on top). No
    common pad names: 0.
    """
    pads_a, pads_b = _pad_names(geometry_a, frame_a), _pad_names(geometry_b, frame_b)
    common = sorted(set(pads_a) & set(pads_b))
    if not common:
        return 0
    best, best_sum = 0, math.inf
    for k in range(4):
        total = 0.0
        for name in common:
            moved = _mated([*pads_b[name], 0.0], k)
            total += math.hypot(moved[0] - pads_a[name][0], moved[1] - pads_a[name][1])
        if total < best_sum - 1e-6:
            best, best_sum = k, total
    return best


def body_corners(geometry: Mapping[str, Any], thickness_mm: Optional[float],
                 bounds: Optional[Mapping[str, Sequence[float]]] = None) -> list[Vec]:
    """The eight corners of a connector body in the board frame.

    ``bounds`` (``{minMm, maxMm}``) is the body in the footprint's own frame
    (§14.6: y up, before rotation, a back footprint in its stored mirrored
    coordinates) with z measured **outward from the mounting surface**, e.g. its
    3D model's bounds under the KiCad model transform. Without it: the
    courtyard (or, lacking one, the pad centres) × ``ASSUMED_BODY_HEIGHT_MM``.
    """
    if bounds is not None:
        lo, hi = list(bounds["minMm"]), list(bounds["maxMm"])
    elif geometry.get("courtyard"):
        lo = [*geometry["courtyard"]["minMm"], 0.0]
        hi = [*geometry["courtyard"]["maxMm"], ASSUMED_BODY_HEIGHT_MM]
    else:
        local = [_footprint_point(geometry, p["positionMm"]) for p in geometry["pads"]]
        lo = [min(x for x, _ in local), min(y for _, y in local), 0.0]
        hi = [max(x for x, _ in local), max(y for _, y in local), ASSUMED_BODY_HEIGHT_MM]
    a = math.radians(geometry["rotationDeg"])
    px, py = geometry["positionMm"]
    half = (thickness_mm or 0.0) / 2.0
    top = geometry["side"] == "top"
    corners = []
    for i in range(8):
        x, y, z = ((lo, hi)[i >> k & 1][k] for k in range(3))
        corners.append([px + x * math.cos(a) - y * math.sin(a), py + x * math.sin(a) + y * math.cos(a),
                        half + z if top else -half - z])
    return corners


def _box_in(frame: Mapping[str, Any], corners: Sequence[Sequence[float]]) -> tuple[Vec, Vec]:
    local = [_local(frame, c) for c in corners]
    return [min(p[i] for p in local) for i in range(3)], [max(p[i] for p in local) for i in range(3)]


def clearance_height(frame_a: Mapping[str, Any], corners_a: Sequence[Sequence[float]],
                     frame_b: Mapping[str, Any], corners_b: Sequence[Sequence[float]], k: int) -> float:
    """§14.5 fallback ``h``: the least separation at which the two bodies' boxes (each an oriented
    box in its own connector frame) stop overlapping, plus ``CLEARANCE_MARGIN_MM``.

    Boxes whose footprints don't overlap across the mating plane never meet: 0 + margin.
    """
    lo_a, hi_a = _box_in(frame_a, corners_a)
    lo_b, hi_b = _box_in(frame_b, corners_b)
    moved = [_mated([x, y, 0.0], k) for x in (lo_b[0], hi_b[0]) for y in (lo_b[1], hi_b[1])]
    overlap = all(min(p[i] for p in moved) < hi_a[i] - 1e-9 and max(p[i] for p in moved) > lo_a[i] + 1e-9
                  for i in range(2))
    touching = hi_a[2] + hi_b[2] if overlap else 0.0
    return _clean(max(touching, 0.0) + CLEARANCE_MARGIN_MM)


def _unturned(stored: Optional[Mapping[str, Any]]) -> Optional[dict]:
    return {"axis": stored["axis"], "quarterTurns": 0} if stored else None


def mate(a: Mapping[str, Any], b: Mapping[str, Any], stack_height_mm: Optional[float] = None) -> Optional[dict]:
    """B's board frame in A's board frame for one B2B pair, or None when either frame is unknown.

    Each end is ``{geometry, thicknessMm, stored?, bodyMm?}``: extractor v6
    geometry, the board thickness, the stored mating record ``{axis,
    quarterTurns}`` (None = the inference) and optional body bounds for
    ``body_corners``. Returns ``{pose, quarterTurns, stackHeightMm,
    heightSource}`` with ``heightSource`` ``"link"`` or ``"clearance"``.
    """
    frame_a = connector_frame(a["geometry"], a["thicknessMm"], a.get("stored"))
    frame_b = connector_frame(b["geometry"], b["thicknessMm"], b.get("stored"))
    if frame_a is None or frame_b is None:
        return None
    k = pad_one_turns(a["geometry"], connector_frame(a["geometry"], a["thicknessMm"], _unturned(a.get("stored"))),
                      b["geometry"], connector_frame(b["geometry"], b["thicknessMm"], _unturned(b.get("stored"))))
    if stack_height_mm is not None:
        h, source = float(stack_height_mm), "link"
    else:
        h = clearance_height(frame_a, body_corners(a["geometry"], a["thicknessMm"], a.get("bodyMm")),
                             frame_b, body_corners(b["geometry"], b["thicknessMm"], b.get("bodyMm")), k)
        source = "clearance"
    joint = {"translationMm": [0.0, 0.0, h], "rotation": canonical_rotation(_FLIP_X)}
    joint = compose(joint, {"translationMm": [0.0, 0.0, 0.0], "rotation": _QUARTER_TURNS[k]})
    pose = compose(compose(_frame_pose(frame_a), joint), inverse(_frame_pose(frame_b)))
    return {"pose": pose, "quarterTurns": k, "stackHeightMm": _clean(h), "heightSource": source}


def residual(a_world: Mapping[str, Any], b_world: Mapping[str, Any], a: Mapping[str, Any], b: Mapping[str, Any],
             mated: Mapping[str, Any]) -> dict:
    """How far placed board B is from where pair (a, b)'s ``mate`` result puts it (SYS-V11 input).

    ``offsetMm`` is B's connector origin minus its mated position, on A's
    connector axes (x, y across the mating plane; z along the mating axis,
    positive = further apart); ``lateralMm`` its x-y length; ``angleDeg`` the
    rotation between the two.
    """
    frame_a = connector_frame(a["geometry"], a["thicknessMm"], a.get("stored"))
    frame_b = _frame_pose(connector_frame(b["geometry"], b["thicknessMm"], b.get("stored")))
    expected = compose(compose(a_world, mated["pose"]), frame_b)
    actual = compose(b_world, frame_b)
    world_a = compose(a_world, _frame_pose(frame_a))
    delta = [actual["translationMm"][i] - expected["translationMm"][i] for i in range(3)]
    offset = rotate([-c for c in world_a["rotation"][:3]] + [world_a["rotation"][3]], delta)
    turn = compose(inverse({"translationMm": [0.0, 0.0, 0.0], "rotation": expected["rotation"]}),
                   {"translationMm": [0.0, 0.0, 0.0], "rotation": actual["rotation"]})["rotation"]
    angle = math.degrees(2.0 * math.atan2(math.sqrt(sum(c * c for c in turn[:3])), abs(turn[3])))
    return {"offsetMm": [_clean(c) for c in offset], "distanceMm": _clean(math.sqrt(sum(c * c for c in delta))),
            "lateralMm": _clean(math.hypot(offset[0], offset[1])), "angleDeg": _clean(angle)}

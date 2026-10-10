"""Harness end poses and exit legs (CONTRACTS_P2 §17.6; PLAN §7 items 1–2).

An end's mating housing meets its board connector face to face, like a B2B
mate whose stack is the board connector's body height ``h``: the housing's
mating frame sits at ``F_c · T(0, 0, h) · Rx(180°) · Rz(k·90°)``. The cable leaves the housing's rear face and runs straight for
the boot length along the connector's outward axis to the **leg point**,
where the curve starts tangent to that axis. The TypeScript twin is
``frontend/.../placement/harness-ends.ts``; change both and the shared goldens
together.
"""

from __future__ import annotations

import math
from typing import Any, Mapping, Optional, Sequence

from . import harness_spec as spec
from .frames import connector_frame
from .mate import _box_in, body_corners
from .poses import _clean, canonical_rotation, compose, rotate

_S = math.sqrt(0.5)
_QUARTER_TURNS = ([0.0, 0.0, 0.0, 1.0], [0.0, 0.0, _S, _S], [0.0, 0.0, 1.0, 0.0], [0.0, 0.0, _S, -_S])
_FLIP_X = [1.0, 0.0, 0.0, 0.0]


def _axis_quaternion(axis: Sequence[float], degrees: float) -> list[float]:
    half = math.radians(degrees) / 2.0
    return [axis[0] * math.sin(half), axis[1] * math.sin(half), axis[2] * math.sin(half), math.cos(half)]


def alignment_pose(alignment: Optional[Mapping[str, Any]]) -> tuple[dict, float]:
    """A catalog model alignment (§18.2) as a pose and a scale: ``T(offset)·Rz·Ry·Rx`` and ``S``."""
    if not alignment:
        return {"translationMm": [0.0, 0.0, 0.0], "rotation": [0.0, 0.0, 0.0, 1.0]}, 1.0
    rx, ry, rz = (float(v) for v in alignment.get("rotationDeg") or (0.0, 0.0, 0.0))
    rotation = [0.0, 0.0, 0.0, 1.0]
    for axis, degrees in (([0.0, 0.0, 1.0], rz), ([0.0, 1.0, 0.0], ry), ([1.0, 0.0, 0.0], rx)):
        rotation = compose({"translationMm": [0, 0, 0], "rotation": rotation},
                           {"translationMm": [0, 0, 0], "rotation": _axis_quaternion(axis, degrees)})["rotation"]
    offset = [float(v) for v in alignment.get("offsetMm") or (0.0, 0.0, 0.0)]
    return {"translationMm": offset, "rotation": canonical_rotation(rotation)}, float(alignment.get("scale") or 1.0)


def _rear_face(housing: Optional[Mapping[str, Any]]) -> tuple[list[float], float, bool]:
    """The cable exit in the housing's mating frame, the housing depth, and whether a model gave it."""
    bounds = (housing or {}).get("boundsMm")
    if not bounds:
        return [0.0, 0.0, -spec.HOUSING_DEPTH_MM], spec.HOUSING_DEPTH_MM, False
    pose, scale = alignment_pose(housing.get("alignment"))
    lo, hi = bounds["minMm"], bounds["maxMm"]
    corners = []
    for i in range(8):
        corner = [(lo, hi)[i >> k & 1][k] * scale for k in range(3)]
        moved = rotate(pose["rotation"], corner)
        corners.append([moved[k] + pose["translationMm"][k] for k in range(3)])
    low = [min(c[k] for c in corners) for k in range(3)]
    high = [max(c[k] for c in corners) for k in range(3)]
    back = min(low[2], 0.0)  # a model aligned inside out never puts the exit in front of the mating face
    return [(low[0] + high[0]) / 2.0, (low[1] + high[1]) / 2.0, back], -back, True


def end_pose(connector_world: Mapping[str, Any], quarter_turns: int = 0,
             housing: Optional[Mapping[str, Any]] = None) -> dict:
    """An end from its connector's frame in the world (``F_c`` composed with the board's pose).

    ``housing`` is the end's part model ``{boundsMm, alignment}`` (§18.2) or None (no model:
    the housing is ``HOUSING_DEPTH_MM`` deep). Returns ``{pose, exitMm, outward, legMm,
    depthMm, modeled}``: the housing's mating frame in the world, the cable exit, the unit
    outward axis (away from the board), the leg point a boot further on, and the depth used.
    """
    turn = _QUARTER_TURNS[int(quarter_turns) % 4]
    flip = compose({"translationMm": [0.0, 0.0, 0.0], "rotation": _FLIP_X},
                   {"translationMm": [0.0, 0.0, 0.0], "rotation": turn})
    pose = compose(connector_world, flip)
    exit_local, depth, modeled = _rear_face(housing)
    exit_world = compose(pose, {"translationMm": exit_local, "rotation": [0.0, 0.0, 0.0, 1.0]})["translationMm"]
    outward = rotate(pose["rotation"], [0.0, 0.0, -1.0])
    leg = [exit_world[k] + spec.BOOT_MM * outward[k] for k in range(3)]
    return {"pose": pose, "exitMm": [_clean(v) for v in exit_world], "outward": [_clean(v) for v in outward],
            "legMm": [_clean(v) for v in leg], "depthMm": _clean(depth), "modeled": modeled}


def board_end(board_world: Mapping[str, Any], geometry: Optional[Mapping[str, Any]], thickness_mm: Optional[float],
              stored: Optional[Mapping[str, Any]] = None, quarter_turns: int = 0,
              housing: Optional[Mapping[str, Any]] = None,
              body_mm: Optional[Mapping[str, Sequence[float]]] = None) -> Optional[dict]:
    """``end_pose`` for a harness end mated to a board connector, or None without a frame (details needed).

    The housing meets the top of the connector's body along its mating axis: ``body_mm`` (§14.8, the
    connector's model bounds) or the courtyard × 5 mm. ``matingPlaneMm`` in the result is that height.
    """
    frame = connector_frame(geometry, thickness_mm, stored)
    if frame is None:
        return None
    height = max(_box_in(frame, body_corners(geometry, thickness_mm, body_mm))[1][2], 0.0)
    connector = compose(board_world, {"translationMm": frame["originMm"], "rotation": frame["rotation"]})
    connector = compose(connector, {"translationMm": [0.0, 0.0, height], "rotation": [0.0, 0.0, 0.0, 1.0]})
    return {**end_pose(connector, quarter_turns, housing), "matingPlaneMm": _clean(height)}

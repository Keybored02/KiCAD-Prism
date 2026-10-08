"""Connectors placed on a catalog module (CONTRACTS_P2 §3.6, D-P2-40).

A module's connector is a catalog part placed on a face of the module's model:
a point on the face, the face's outward normal and a quarter-turn, all in the
**module frame** (the module model after its alignment). The part's own mating
frame ``F_part`` (``frames.connector_frame`` on its footprint at the origin,
thickness 0) is put on that face frame ``P``, so the footprint sits at

    footprint pose = P · F_part⁻¹

in the module frame. A module port is then "a footprint at a pose on a
zero-thickness board", and mates, harness ends and checks reuse the board code.
Every rule here has a twin in ``frontend/.../placement/module-ports.ts``;
change both and the shared goldens together.
"""

from __future__ import annotations

import math
from typing import Any, Mapping, Optional

from .frames import AXES, _cross, _dot, _normalize, connector_frame, quaternion
from .mate import _frame_pose, inverse
from .poses import MAX_TRANSLATION_MM, _clean, compose

FALLBACK_AXIS = "top"  # a footprint whose mating axis can't be inferred mates out of its top face


def placement_from(value: Mapping[str, Any]) -> dict:
    """A placement from API input, canonical; ``ValueError`` when it is not one.

    ``{originMm: [x, y, z], normal: [x, y, z], quarterTurns: 0..3, axis: AXES | null}``; the
    normal is normalised, ``axis`` overrides the part's inferred mating axis.
    """
    origin, normal = list(value.get("originMm") or []), list(value.get("normal") or [])
    if len(origin) != 3 or len(normal) != 3:
        raise ValueError("originMm and normal take 3 numbers each")
    numbers = [float(v) for v in (*origin, *normal)]
    if any(not math.isfinite(v) for v in numbers):
        raise ValueError("placement values must be finite")
    if any(abs(v) > MAX_TRANSLATION_MM for v in numbers[:3]):
        raise ValueError(f"originMm is limited to ±{MAX_TRANSLATION_MM:g} mm")
    if math.sqrt(sum(v * v for v in numbers[3:])) < 1e-6:
        raise ValueError("normal must be a non-zero vector")
    turns = value.get("quarterTurns", 0)
    if isinstance(turns, bool) or not isinstance(turns, int) or not 0 <= turns <= 3:
        raise ValueError("quarterTurns must be 0, 1, 2 or 3")
    axis = value.get("axis")
    if axis is not None and axis not in AXES:
        raise ValueError(f"axis must be one of {', '.join(AXES)}")
    return {"originMm": [_clean(v) for v in numbers[:3]], "normal": [_clean(v) for v in _normalize(numbers[3:])],
            "quarterTurns": turns, "axis": axis}


def face_frame(placement: Mapping[str, Any]) -> dict:
    """``P``: origin on the face, z the outward normal, x module +x projected onto the face (+y when the
    face looks more along x than y), then ``quarterTurns`` about z (x → y)."""
    z = _normalize(placement["normal"])
    reference = [1.0, 0.0, 0.0] if abs(z[0]) <= abs(z[1]) + 1e-9 else [0.0, 1.0, 0.0]
    x = _normalize([r - _dot(reference, z) * c for r, c in zip(reference, z)])
    y = _cross(z, x)
    for _ in range(int(placement.get("quarterTurns") or 0) % 4):
        x, y = y, [-c for c in x]
    return {"originMm": [float(v) for v in placement["originMm"]], "xAxis": x, "yAxis": y, "zAxis": z,
            "rotation": quaternion(x, y, z)}


def part_frame(geometry: Mapping[str, Any], axis: Optional[str] = None) -> Optional[dict]:
    """``F_part``: the part footprint's mating frame at zero thickness; the inferred axis unless ``axis``
    overrides it, ``top`` when nothing is known. None for a footprint without pads."""
    if not geometry or not geometry.get("pads"):
        return None
    stored = {"axis": axis, "quarterTurns": 0} if axis else None
    return connector_frame(geometry, 0.0, stored) or connector_frame(geometry, 0.0, {"axis": FALLBACK_AXIS,
                                                                                        "quarterTurns": 0})


def footprint_pose(placement: Mapping[str, Any], geometry: Mapping[str, Any]) -> Optional[dict]:
    """Where the part's footprint origin sits in the module frame: ``P · F_part⁻¹``."""
    frame = part_frame(geometry, placement.get("axis"))
    if frame is None:
        return None
    pose = compose(_frame_pose(face_frame(placement)), inverse(_frame_pose(frame)))
    return {"translationMm": [_clean(v) for v in pose["translationMm"]], "rotation": pose["rotation"]}

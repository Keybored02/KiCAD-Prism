"""Connector mating frames: inference (CONTRACTS_P2 §15.1) and ``F_c`` (§14.4).

Inputs are one component's extractor v6 ``geometry`` and the board thickness.
Every rule here has a twin in ``frontend/.../placement/frames.ts``; change both
and the shared goldens together.
"""

from __future__ import annotations

import math
import re
from typing import Any, Mapping, Optional, Sequence

AXES = ("top", "bottom", "+x", "-x", "+y", "-y")
OVER_PADS_MARGIN_MM = 1.0  # body centre within the pad box grown by this: vertical
OFF_PADS_MIN_MM = 0.5  # body centre at least this far from the pad centroid: right-angle
AXIS_TOLERANCE_DEG = 20.0
SQUARE_TOLERANCE = 0.05  # principal axes within 5 %: use the footprint's own x

_VERTICAL = re.compile(r"_vertical(_|$)", re.IGNORECASE)
_RIGHT_ANGLE = re.compile(r"_(horizontal|rightangle|right_angle|angled)(_|$)|_RA(_|$)", re.IGNORECASE)

Vec = list[float]


def _natural(pad: str) -> tuple:
    head = pad.rstrip("0123456789")
    tail = pad[len(head):]
    return (head, int(tail) if tail else -1, pad)


def _footprint_point(geometry: Mapping[str, Any], point: Sequence[float]) -> tuple[float, float]:
    """Board frame → the footprint's own frame (y up, before rotation)."""
    a = math.radians(geometry["rotationDeg"])
    dx, dy = point[0] - geometry["positionMm"][0], point[1] - geometry["positionMm"][1]
    return (dx * math.cos(a) + dy * math.sin(a), -dx * math.sin(a) + dy * math.cos(a))


def _board_direction(geometry: Mapping[str, Any], local: Sequence[float]) -> Vec:
    a = math.radians(geometry["rotationDeg"])
    return [local[0] * math.cos(a) - local[1] * math.sin(a), local[0] * math.sin(a) + local[1] * math.cos(a), 0.0]


def _distinct_pad_positions(geometry: Mapping[str, Any]) -> list[tuple[float, float]]:
    return sorted({(p["positionMm"][0], p["positionMm"][1]) for p in geometry["pads"]})


def _frame_pads(geometry: Mapping[str, Any]) -> list[Mapping[str, Any]]:
    """The pads ``F_c`` is built from: the numbered ones, or every pad when none is numbered.

    Unnumbered pads are mounting and alignment holes, often off-centre (Samtec
    -A: one 1.27 mm off the centreline), which would skew the frame.
    """
    named = [p for p in geometry["pads"] if p["pad"]]
    return named or list(geometry["pads"])


def _pad_centroid(geometry: Mapping[str, Any]) -> tuple[float, float]:
    pads = _frame_pads(geometry)
    return (sum(p["positionMm"][0] for p in pads) / len(pads), sum(p["positionMm"][1] for p in pads) / len(pads))


def _local_axis(x: float, y: float) -> Optional[str]:
    """The footprint axis within ``AXIS_TOLERANCE_DEG`` of direction (x, y), if any."""
    angle = math.degrees(math.atan2(y, x))
    nearest = round(angle / 90.0) * 90.0
    if abs(angle - nearest) > AXIS_TOLERANCE_DEG:
        return None
    return {0: "+x", 90: "+y", 180: "-x", -180: "-x", -90: "-y"}[int(nearest)]


def infer(geometry: Optional[Mapping[str, Any]]) -> dict:
    """§15.1: ``{axis, confidence, reasons}``; ``axis`` is None when confidence is ``low``."""

    def result(axis: Optional[str], confidence: str, *reasons: str) -> dict:
        return {"axis": axis if confidence != "low" else None, "confidence": confidence, "reasons": list(reasons)}

    if not geometry or len(_distinct_pad_positions(geometry)) < 2:
        return result(None, "low", "too_few_pads")
    vertical_side = "top" if geometry["side"] == "top" else "bottom"
    name = geometry.get("footprintName") or ""
    named_vertical = bool(_VERTICAL.search(name))
    named_right_angle = bool(_RIGHT_ANGLE.search(name))
    courtyard = geometry.get("courtyard")
    if courtyard is None:
        if named_vertical:
            return result(vertical_side, "medium", "name_vertical", "no_courtyard")
        return result(None, "low", "no_courtyard")

    local_pads = [_footprint_point(geometry, p["positionMm"]) for p in geometry["pads"]]
    centroid = (sum(x for x, _ in local_pads) / len(local_pads), sum(y for _, y in local_pads) / len(local_pads))
    body = ((courtyard["minMm"][0] + courtyard["maxMm"][0]) / 2.0, (courtyard["minMm"][1] + courtyard["maxMm"][1]) / 2.0)
    over = (min(x for x, _ in local_pads) - OVER_PADS_MARGIN_MM <= body[0] <= max(x for x, _ in local_pads) + OVER_PADS_MARGIN_MM
            and min(y for _, y in local_pads) - OVER_PADS_MARGIN_MM <= body[1] <= max(y for _, y in local_pads) + OVER_PADS_MARGIN_MM)
    offset = (body[0] - centroid[0], body[1] - centroid[1])
    side_axis = None
    if not over and math.hypot(*offset) >= OFF_PADS_MIN_MM:
        side_axis = _local_axis(*offset)

    if named_vertical:
        return result(vertical_side, "high", "name_vertical", "body_over_pads") if over else \
            result(None, "low", "name_vertical", "name_conflicts_geometry")
    if named_right_angle:
        return result(side_axis, "high", "name_right_angle", "body_off_pads") if side_axis else \
            result(None, "low", "name_right_angle", "name_conflicts_geometry")
    if over:
        return result(vertical_side, "medium", "body_over_pads")
    if side_axis:
        return result(side_axis, "medium", "body_off_pads")
    return result(None, "low", "body_ambiguous")


# ---------------------------------------------------------------------------
# F_c (§14.4)


def _normalize(v: Sequence[float]) -> Vec:
    length = math.sqrt(sum(c * c for c in v))
    return [c / length for c in v]


def _cross(a: Sequence[float], b: Sequence[float]) -> Vec:
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def _dot(a: Sequence[float], b: Sequence[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def _pad_one(geometry: Mapping[str, Any]) -> Mapping[str, Any]:
    named = [p for p in geometry["pads"] if p["pad"]]
    for pad in named:
        if pad["pad"] == "1":
            return pad
    return sorted(named, key=lambda p: _natural(p["pad"]))[0] if named else geometry["pads"][0]


def _principal_axis(geometry: Mapping[str, Any]) -> Vec:
    """The largest eigenvector of the pad-centre covariance, or the footprint's +x for square arrays."""
    cx, cy = _pad_centroid(geometry)
    pads = _frame_pads(geometry)
    sxx = sum((p["positionMm"][0] - cx) ** 2 for p in pads) / len(pads)
    syy = sum((p["positionMm"][1] - cy) ** 2 for p in pads) / len(pads)
    sxy = sum((p["positionMm"][0] - cx) * (p["positionMm"][1] - cy) for p in pads) / len(pads)
    half_trace, det = (sxx + syy) / 2.0, sxx * syy - sxy * sxy
    spread = math.sqrt(max(half_trace * half_trace - det, 0.0))
    large, small = half_trace + spread, half_trace - spread
    if large <= 1e-12 or large - small <= SQUARE_TOLERANCE * large:
        return _board_direction(geometry, (1.0, 0.0))
    if abs(sxy) > 1e-12:
        vector = [large - syy, sxy, 0.0]
    else:
        vector = [1.0, 0.0, 0.0] if sxx >= syy else [0.0, 1.0, 0.0]
    return _normalize(vector)


def _mating_axis(geometry: Mapping[str, Any], axis: str) -> Vec:
    if axis == "top":
        return [0.0, 0.0, 1.0]
    if axis == "bottom":
        return [0.0, 0.0, -1.0]
    sign = -1.0 if axis[0] == "-" else 1.0
    local = (sign, 0.0) if axis[1] == "x" else (0.0, sign)
    return _normalize(_board_direction(geometry, local))


def quaternion(x_axis: Sequence[float], y_axis: Sequence[float], z_axis: Sequence[float]) -> Vec:
    """Rotation matrix with these columns → unit quaternion ``[x, y, z, w]``, canonical ``w ≥ 0``."""
    m00, m10, m20 = x_axis
    m01, m11, m21 = y_axis
    m02, m12, m22 = z_axis
    trace = m00 + m11 + m22
    if trace > 0:
        s = math.sqrt(trace + 1.0) * 2.0
        q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, 0.25 * s]
    elif m00 > m11 and m00 > m22:
        s = math.sqrt(1.0 + m00 - m11 - m22) * 2.0
        q = [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s]
    elif m11 > m22:
        s = math.sqrt(1.0 + m11 - m00 - m22) * 2.0
        q = [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s]
    else:
        s = math.sqrt(1.0 + m22 - m00 - m11) * 2.0
        q = [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s]
    q = _normalize(q)
    leading = next((c for c in (q[3], q[0], q[1], q[2]) if abs(c) > 1e-12), 1.0)
    return [-c for c in q] if leading < 0 else q


def connector_frame(geometry: Optional[Mapping[str, Any]], thickness_mm: Optional[float],
                    stored: Optional[Mapping[str, Any]] = None) -> Optional[dict]:
    """``F_c`` in the board frame, or None when no axis is known (a ``low`` inference and nothing stored).

    ``stored`` is a confirmed/override record ``{axis, quarterTurns}``; it replaces the inferred axis.
    """

    if not geometry or not geometry["pads"]:
        return None
    axis = stored["axis"] if stored else infer(geometry)["axis"]
    if axis is None:
        return None
    turns = int(stored.get("quarterTurns") or 0) % 4 if stored else 0
    cx, cy = _pad_centroid(geometry)
    half = (thickness_mm or 0.0) / 2.0
    origin = [cx, cy, half if geometry["side"] == "top" else -half]
    z = _mating_axis(geometry, axis)
    x = _principal_axis(geometry)
    x = [a - _dot(x, z) * b for a, b in zip(x, z)]
    if math.sqrt(_dot(x, x)) < 1e-9:  # pads run along the mating direction
        x = [-z[1], z[0], 0.0]
    x = _normalize(x)
    pad = _pad_one(geometry)["positionMm"]
    if _dot([pad[0] - cx, pad[1] - cy, 0.0], x) > 1e-9:
        x = [-c for c in x]
    y = _cross(z, x)
    for _ in range(turns):  # quarter-turns about z: x → y
        x, y = y, [-c for c in x]
    return {"axis": axis, "quarterTurns": turns, "originMm": origin, "xAxis": x, "yAxis": y, "zAxis": z,
            "rotation": quaternion(x, y, z)}

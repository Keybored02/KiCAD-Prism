"""Harness curves: control polygons, centripetal Catmull-Rom, bend radius, arc length (CONTRACTS_P2 §17.8;
PLAN §7 items 4–6).

Each segment of the harness tree (SB2-42) is one curve through its control
polygon. The TypeScript twin is ``frontend/.../placement/harness-curves.ts``;
it must produce the same samples (lengths agree within 0.01 mm, findings exactly).
"""

from __future__ import annotations

import math
from typing import Any, Mapping, Optional, Sequence

from . import harness_spec as spec
from .poses import _clean

MAX_DEPTH = 12  # subdivision depth per span
MIN_DEPTH = 2  # always split a span at least this often (S-shaped spans have mid-points on the chord)
DUPLICATE_MM = 1e-9

Vec = list[float]


def _sub(a: Sequence[float], b: Sequence[float]) -> Vec:
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]


def _dist(a: Sequence[float], b: Sequence[float]) -> float:
    return math.sqrt(sum((a[k] - b[k]) ** 2 for k in range(3)))


def _lerp(a: Sequence[float], b: Sequence[float], ta: float, tb: float, t: float) -> Vec:
    if tb == ta:
        return list(a)
    wa, wb = (tb - t) / (tb - ta), (t - ta) / (tb - ta)
    return [wa * a[k] + wb * b[k] for k in range(3)]


def _span(p0: Sequence[float], p1: Sequence[float], p2: Sequence[float], p3: Sequence[float]):
    """Centripetal Catmull-Rom between p1 and p2 (Barry–Goldman), as ``u ∈ [0, 1] → point``."""
    a = spec.CATMULL_ROM_ALPHA
    t0 = 0.0
    t1 = t0 + _dist(p0, p1) ** a
    t2 = t1 + _dist(p1, p2) ** a
    t3 = t2 + _dist(p2, p3) ** a

    def at(u: float) -> Vec:
        t = t1 + u * (t2 - t1)
        a1, a2, a3 = _lerp(p0, p1, t0, t1, t), _lerp(p1, p2, t1, t2, t), _lerp(p2, p3, t2, t3, t)
        b1, b2 = _lerp(a1, a2, t0, t2, t), _lerp(a2, a3, t1, t3, t)
        return _lerp(b1, b2, t1, t2, t)

    return at


def _off_chord(point: Sequence[float], a: Sequence[float], b: Sequence[float]) -> float:
    ab, ap = _sub(b, a), _sub(point, a)
    length = math.sqrt(sum(c * c for c in ab))
    if length < 1e-12:
        return _dist(point, a)
    cross = [ab[1] * ap[2] - ab[2] * ap[1], ab[2] * ap[0] - ab[0] * ap[2], ab[0] * ap[1] - ab[1] * ap[0]]
    return math.sqrt(sum(c * c for c in cross)) / length


def _dedupe(points: Sequence[Sequence[float]], movable: Sequence[bool]) -> tuple[list[Vec], list[bool]]:
    out, flags = [], []
    for point, free in zip(points, movable):
        if out and _dist(out[-1], point) < DUPLICATE_MM:
            flags[-1] = flags[-1] and free
            continue
        out.append([float(c) for c in point])
        flags.append(bool(free))
    return out, flags


def sample(points: Sequence[Sequence[float]]) -> tuple[list[Vec], list[int]]:
    """Adaptive samples of the curve through ``points`` (chord error ``CHORD_ERROR_MM``), and for each
    sample the index of the span it ends."""
    if len(points) < 2:
        return [list(p) for p in points], [0] * len(points)
    ext = [_sub([2 * c for c in points[0]], points[1]), *points, _sub([2 * c for c in points[-1]], points[-2])]
    samples, spans = [list(points[0])], [0]
    for i in range(len(points) - 1):
        at = _span(ext[i], ext[i + 1], ext[i + 2], ext[i + 3])

        def split(u0: float, u1: float, a: Vec, b: Vec, depth: int) -> None:
            um = (u0 + u1) / 2.0
            mid = at(um)
            if depth < MIN_DEPTH or (depth < MAX_DEPTH and _off_chord(mid, a, b) > spec.CHORD_ERROR_MM):
                split(u0, um, a, mid, depth + 1)
                split(um, u1, mid, b, depth + 1)
            else:
                samples.append(b)
                spans.append(i)

        split(0.0, 1.0, list(points[i]), list(points[i + 1]), 0)
    return samples, spans


def _radius(a: Sequence[float], b: Sequence[float], c: Sequence[float]) -> float:
    """Circumradius through three samples (inf when they are collinear)."""
    ab, bc, ca = _dist(a, b), _dist(b, c), _dist(c, a)
    u, v = _sub(b, a), _sub(c, a)
    cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    twice_area = math.sqrt(sum(x * x for x in cross))
    if twice_area < 1e-12:
        return math.inf
    return ab * bc * ca / (2.0 * twice_area)


def tightest(samples: Sequence[Sequence[float]]) -> tuple[float, int]:
    """The smallest bend radius along the samples and the sample where it is (inf, -1 when straight)."""
    best, at = math.inf, -1
    for i in range(1, len(samples) - 1):
        r = _radius(samples[i - 1], samples[i], samples[i + 1])
        if r < best:
            best, at = r, i
    return best, at


def curve(points: Sequence[Sequence[float]], movable: Sequence[bool], diameter_mm: float) -> dict:
    """One segment's curve with bend-radius relaxation.

    ``movable`` marks the control points relaxation may move (waypoints; never exits, legs, their
    tangent points or breakouts). Where a bend is tighter than ``MIN_BEND_RADIUS_FACTOR × d``, the
    movable control point nearest the tightest sample (by span; ties to the earlier) moves halfway
    toward the midpoint of its neighbours, up to ``BEND_RELAX_ITERATIONS`` times.

    Returns ``{controlMm, samplesMm, lengthMm, minRadiusMm, minRadiusAllowedMm, tightBend}``;
    ``tightBend`` is ``{atMm, radiusMm}`` when the bend still violates, else None. ``minRadiusMm``
    is None for a straight curve.
    """
    control, free = _dedupe(points, movable)
    allowed = spec.MIN_BEND_RADIUS_FACTOR * diameter_mm
    samples, spans = sample(control)
    radius, where = tightest(samples)
    for _ in range(spec.BEND_RELAX_ITERATIONS):
        if radius >= allowed or where < 0:
            break
        span = spans[where]
        candidates = [i for i in range(1, len(control) - 1) if free[i]]
        if not candidates:
            break
        target = min(candidates, key=lambda i: (min(abs(i - span), abs(i - (span + 1))), i))
        mid = [(control[target - 1][k] + control[target + 1][k]) / 2.0 for k in range(3)]
        control[target] = [(control[target][k] + mid[k]) / 2.0 for k in range(3)]
        samples, spans = sample(control)
        radius, where = tightest(samples)
    length = sum(_dist(samples[i], samples[i + 1]) for i in range(len(samples) - 1))
    tight = None
    if where >= 0 and radius < allowed:
        tight = {"atMm": [_clean(c) for c in samples[where]], "radiusMm": _clean(radius)}
    return {"controlMm": [[_clean(c) for c in p] for p in control],
            "samplesMm": [[_clean(c) for c in p] for p in samples],
            "lengthMm": _clean(length), "minRadiusMm": None if math.isinf(radius) else _clean(radius),
            "minRadiusAllowedMm": _clean(allowed), "tightBend": tight}


def _head(end: Mapping[str, Any]) -> list[Vec]:
    """An end's fixed points from the exit outward: exit, half a boot, the leg point, half a boot on."""
    exit_, out, leg = end["exitMm"], end["outward"], end["legMm"]
    half = spec.BOOT_MM / 2.0
    return [list(exit_), [exit_[k] + half * out[k] for k in range(3)], list(leg), [leg[k] + half * out[k] for k in range(3)]]


def harness_curves(ends: Mapping[str, Mapping[str, Any]], tree: Mapping[str, Any],
                   waypoints: Optional[Mapping[str, Sequence[Sequence[float]]]] = None,
                   pinned: Optional[Mapping[str, Sequence[bool]]] = None) -> list[dict]:
    """A curve per segment of ``tree`` (SB2-42's ``topology``). ``ends`` maps end ID → its SB2-41 pose
    (``exitMm``, ``outward``, ``legMm``); ``waypoints`` maps segment ID → points from its ``from`` node
    toward its ``to`` node, and ``pinned`` the waypoints relaxation leaves where they are (SB2-45)."""
    position = {n["id"]: n["positionMm"] for n in tree["nodes"]}
    out = []
    for segment in tree["segments"]:
        def side(node: str) -> tuple[list[Vec], list[bool]]:
            if node in ends:
                points = _head(ends[node])
                return points, [False] * len(points)
            return [list(position[node])], [False]

        head, head_free = side(segment["from"])
        tail, tail_free = side(segment["to"])
        middle = [list(p) for p in (waypoints or {}).get(segment["id"], [])]
        fixed = list((pinned or {}).get(segment["id"], []))
        points = head + middle + tail[::-1]
        movable = head_free + [not (i < len(fixed) and fixed[i]) for i in range(len(middle))] + tail_free[::-1]
        out.append({"segmentId": segment["id"], **curve(points, movable, segment["diameterMm"])})
    return out

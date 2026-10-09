"""The collision check (SB2-108, CONTRACTS_P2 §24.2): which placed bodies of different occurrences intersect.

Pure over ``Body`` meshes, each in its own frame with its placement in the root frame. A body's
mesh is never copied into the root frame: its box is its local box's corners placed, so a
large board's components cost only the cached meshes. Boxes find candidate pairs (a sweep on x,
then the per-axis overlap, which also drops bodies that only touch); exact triangle-mesh
intersection (python-fcl BVHs, built once per mesh and only for bodies in a candidate pair, placed
by the body's transform) decides. Bodies of one occurrence are never a pair, and mated connector
pairs are exempt: they touch by design.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Optional, Sequence

import numpy as np

TOUCH_MM = 0.05  # boxes that overlap less than this on an axis only touch
MAX_PAIRS = 10  # object pairs kept per colliding occurrence pair


@dataclass
class Body:
    occurrence: str  # occurrence path
    label: str
    reference: Optional[str]  # a component's reference; None for a board body, module or part
    vertices: np.ndarray  # (n, 3), the body's own frame, mm; shared with the mesh cache, never written
    faces: np.ndarray  # (m, 3) int32
    matrix: Optional[Sequence[float]] = None  # column-major 4×4 into the root frame (§14.1); None is identity
    solid: bool = False  # a closed box (a board body): anything inside it collides, not only its faces
    rotation: np.ndarray = field(init=False)
    translation: np.ndarray = field(init=False)
    lo: np.ndarray = field(init=False)
    hi: np.ndarray = field(init=False)

    def __post_init__(self) -> None:
        m = np.eye(4) if self.matrix is None else np.asarray(self.matrix, dtype=np.float64).reshape(4, 4).T
        self.rotation, self.translation = m[:3, :3], m[:3, 3]
        if np.linalg.det(self.rotation) < 0:  # a mirror is no rigid transform: mirror the mesh, keep a rotation
            self.vertices = self.vertices * np.array([-1.0, 1.0, 1.0], dtype=self.vertices.dtype)
            self.rotation = self.rotation @ np.diag([-1.0, 1.0, 1.0])
        if len(self.vertices) == 0:
            self.lo = self.hi = self.translation.copy()
            return
        lo, hi = self.vertices.min(axis=0).astype(np.float64), self.vertices.max(axis=0).astype(np.float64)
        corners = np.array([[x, y, z] for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])])
        placed = corners @ self.rotation.T + self.translation
        self.lo, self.hi = placed.min(axis=0), placed.max(axis=0)


def transformed(vertices: np.ndarray, matrix: Sequence[float]) -> np.ndarray:
    """``vertices`` under a column-major 4×4 ``matrix`` (§14.1)."""
    m = np.asarray(matrix, dtype=np.float64).reshape(4, 4).T
    return vertices @ m[:3, :3].T + m[:3, 3]


_BOX_FACES = np.array([[0, 2, 1], [1, 2, 3], [4, 5, 6], [5, 7, 6], [0, 1, 4], [1, 5, 4],
                       [2, 6, 3], [3, 6, 7], [0, 4, 2], [2, 4, 6], [1, 3, 5], [3, 7, 5]], dtype=np.int32)


def box(lo: Sequence[float], hi: Sequence[float]) -> tuple[np.ndarray, np.ndarray]:
    """A closed box mesh: a board body is its outline × thickness (§24.2), checked as a solid."""
    corners = np.array([[x, y, z] for x in (lo[0], hi[0]) for y in (lo[1], hi[1]) for z in (lo[2], hi[2])],
                       dtype=np.float64)
    return corners, _BOX_FACES.copy()


def candidate_pairs(bodies: Sequence[Body], exempt: Iterable[frozenset] = ()) -> list[tuple[int, int]]:
    """Index pairs of bodies of different occurrences whose boxes overlap by more than ``TOUCH_MM``."""
    exempt = set(exempt)
    order = sorted(range(len(bodies)), key=lambda i: bodies[i].lo[0])
    active: list[int] = []
    out = []
    for i in order:
        body = bodies[i]
        active = [j for j in active if bodies[j].hi[0] > body.lo[0] + TOUCH_MM]
        for j in active:
            other = bodies[j]
            if other.occurrence == body.occurrence:
                continue
            depth = np.minimum(body.hi, other.hi) - np.maximum(body.lo, other.lo)
            if np.all(depth > TOUCH_MM) and frozenset({(body.occurrence, body.reference),
                                                       (other.occurrence, other.reference)}) not in exempt:
                out.append((min(i, j), max(i, j)))
        active.append(i)
    return sorted(out)


def check(bodies: Sequence[Body], exempt: Iterable[frozenset] = ()) -> list[dict]:
    """One entry per colliding occurrence pair (§24.2): ``{a, b, atMm, pairs}``, in path order."""
    import fcl

    meshes: dict[int, object] = {}  # one BVH per mesh: a project placed twice shares its components'
    objects: dict[int, object] = {}

    def model(i: int):
        if i not in objects:
            body = bodies[i]
            if body.solid:  # a primitive box against triangles: a triangle wholly inside still hits
                lo, hi = body.vertices.min(axis=0), body.vertices.max(axis=0)
                centre = body.rotation @ ((lo + hi) / 2) + body.translation
                objects[i] = fcl.CollisionObject(fcl.Box(*(hi - lo)), fcl.Transform(body.rotation, centre))
                return objects[i]
            bvh = meshes.get(id(body.vertices))
            if bvh is None:
                bvh = meshes[id(body.vertices)] = fcl.BVHModel()
                bvh.beginModel(len(body.vertices), len(body.faces))
                bvh.addSubModel(body.vertices, body.faces)
                bvh.endModel()
            objects[i] = fcl.CollisionObject(bvh, fcl.Transform(body.rotation, body.translation))
        return objects[i]

    request = fcl.CollisionRequest(num_max_contacts=1, enable_contact=True)
    grouped: dict[tuple[str, str], dict] = {}
    for i, j in candidate_pairs(bodies, exempt):
        result = fcl.CollisionResult()
        if not fcl.collide(model(i), model(j), request, result):
            continue
        a, b = sorted((bodies[i], bodies[j]), key=lambda body: (body.occurrence, body.reference or ""))
        at = [round(float(v), 3) for v in result.contacts[0].pos] if result.contacts else \
            [round(float(v), 3) for v in (np.maximum(a.lo, b.lo) + np.minimum(a.hi, b.hi)) / 2]
        entry = grouped.setdefault((a.occurrence, b.occurrence), {
            "a": {"occurrence": a.occurrence, "label": a.label, "reference": None},
            "b": {"occurrence": b.occurrence, "label": b.label, "reference": None},
            "atMm": at, "pairs": []})
        for side, body in (("a", a), ("b", b)):
            if entry[side]["reference"] is None and body.reference:
                entry[side]["reference"] = body.reference
        if len(entry["pairs"]) < MAX_PAIRS:
            entry["pairs"].append({"a": a.reference, "b": b.reference, "atMm": at})
    return [grouped[key] for key in sorted(grouped)]

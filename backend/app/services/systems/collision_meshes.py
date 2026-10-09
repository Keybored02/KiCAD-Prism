"""Meshes for the collision check (SB2-108, CONTRACTS_P2 §24.2), in each occurrence's own frame.

A board's component bodies come from its viewer bundle's ``geometry/components.glb``: one body per
footprint node, named by reference (``semantic_geometry.json``), mapped from glTF (metres, Y-up) to
the board frame (millimetres, Z-up, about the copper mid-plane) by the scene's ``bundleToBoard``.
Parsing a large GLB takes seconds, so each bundle's bodies are kept as an ``.npz`` beside the
semantic store (a bundle never changes once built) and in a small in-process cache.

A module's or part's body is its catalog GLB (metres, the STEP's own axes) ×1000 under its alignment.
"""

from __future__ import annotations

import json
import threading
from collections import OrderedDict
from pathlib import Path
from typing import Optional, Sequence

import numpy as np

# glTF Y-up to the board's Z-up: (x, y, z) -> (x, -z, y), as the viewer's loader maps it.
_Y_UP = np.array([[1.0, 0.0, 0.0], [0.0, 0.0, -1.0], [0.0, 1.0, 0.0]])
_CACHE_BODIES = 16  # bundles or models kept in memory
_cache: "OrderedDict[str, list]" = OrderedDict()
_lock = threading.Lock()

Mesh = tuple[Optional[str], np.ndarray, np.ndarray]  # (reference, vertices, faces)


def _remember(key: str, value: list) -> list:
    with _lock:
        _cache[key] = value
        _cache.move_to_end(key)
        while len(_cache) > _CACHE_BODIES:
            _cache.popitem(last=False)
    return value


def _recalled(key: str) -> Optional[list]:
    with _lock:
        found = _cache.get(key)
        if found is not None:
            _cache.move_to_end(key)
        return found


def _pack(meshes: Sequence[Mesh], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp.npz")
    np.savez(tmp, references=np.array([m[0] or "" for m in meshes]),
             vertex_counts=np.array([len(m[1]) for m in meshes], dtype=np.int64),
             face_counts=np.array([len(m[2]) for m in meshes], dtype=np.int64),
             vertices=np.concatenate([m[1] for m in meshes]).astype(np.float32) if meshes else np.zeros((0, 3), np.float32),
             faces=np.concatenate([m[2] for m in meshes]).astype(np.int32) if meshes else np.zeros((0, 3), np.int32))
    tmp.replace(path)


def _unpack(path: Path) -> list[Mesh]:
    data = np.load(path)
    vertices, faces = data["vertices"], data["faces"]  # float32 views: the check only reads them
    out, v0, f0 = [], 0, 0
    for reference, vn, fn in zip(data["references"], data["vertex_counts"], data["face_counts"]):
        out.append((str(reference) or None, vertices[v0:v0 + vn], faces[f0:f0 + fn]))
        v0, f0 = v0 + int(vn), f0 + int(fn)
    return out


def board_components(bundle: Path, bundle_to_board: Sequence[float], cache: Optional[Path]) -> list[Mesh]:
    """Each footprint's body in the board frame, from a bundle directory. Empty without a model."""
    glb = bundle / "geometry" / "components.glb"
    if not glb.exists():
        return []
    key = f"board:{glb}:{glb.stat().st_mtime_ns}"
    found = _recalled(key)
    if found is not None:
        return found
    if cache is not None and cache.exists() and cache.stat().st_mtime_ns >= glb.stat().st_mtime_ns:
        return _remember(key, _unpack(cache))
    import trimesh

    semantic = json.loads((bundle / "semantic_geometry.json").read_text()) if (bundle / "semantic_geometry.json").exists() else {}
    references = {str(c["designator"]) for c in semantic.get("components") or [] if c.get("designator")}
    scene = trimesh.load(glb, force="scene", process=False)
    parents = scene.graph.transforms.parents
    m = np.asarray(bundle_to_board, dtype=np.float64).reshape(4, 4).T
    to_board = m[:3, :3] @ _Y_UP
    grouped: dict[str, list[tuple[np.ndarray, np.ndarray]]] = {}
    for node in scene.graph.nodes_geometry:
        owner = node
        while owner is not None and owner not in references:
            owner = parents.get(owner)
        if owner is None:
            continue
        transform, geometry_name = scene.graph[node]
        geometry = scene.geometry[geometry_name]
        if not hasattr(geometry, "faces") or len(geometry.faces) == 0:
            continue
        local = np.asarray(geometry.vertices, dtype=np.float64) @ transform[:3, :3].T + transform[:3, 3]
        grouped.setdefault(owner, []).append((local @ to_board.T + m[:3, 3], np.asarray(geometry.faces, dtype=np.int32)))
    meshes: list[Mesh] = []
    for reference in sorted(grouped):
        parts = grouped[reference]
        offsets = np.cumsum([0] + [len(v) for v, _ in parts[:-1]])
        meshes.append((reference, np.concatenate([v for v, _ in parts]).astype(np.float32),
                       np.concatenate([f + int(o) for (_, f), o in zip(parts, offsets)])))
    if cache is not None:
        try:
            _pack(meshes, cache)
        except OSError:
            pass  # a cache that cannot be written only costs the next check its parse
    return _remember(key, meshes)


def catalog_model(glb: Path, matrix_mm: Sequence[float]) -> list[Mesh]:
    """A module's or part's model in its own frame: GLB metres ×1000 under its alignment (§18.2)."""
    key = f"model:{glb}:{glb.stat().st_mtime_ns}:{','.join(f'{v:.6g}' for v in matrix_mm)}"
    found = _recalled(key)
    if found is not None:
        return found
    import trimesh

    mesh = trimesh.load(glb, force="mesh", process=False)
    m = np.asarray(matrix_mm, dtype=np.float64).reshape(4, 4).T
    vertices = np.asarray(mesh.vertices, dtype=np.float64) * 1000.0 @ m[:3, :3].T + m[:3, 3]
    return _remember(key, [(None, vertices.astype(np.float32), np.asarray(mesh.faces, dtype=np.int32))])

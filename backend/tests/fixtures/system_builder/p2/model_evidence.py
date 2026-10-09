"""Record STEP → GLB evidence for five KiCad stock connector models (SB2-17, CONTRACTS_P2 §18.2).

For each model:

* Geometer converts the STEP to GLB and measures ``model_bounds``;
* ``kicad-cli pcb export glb`` exports the model's stock footprint, placed at
  the origin on a throwaway board, and the component's bounds are measured
  from that GLB (node transforms applied). This is an independent check.

Writes ``evidence/models/record.json``. The STEP files are KiCad's own (not
vendored); the test skips a model whose file is not installed.

Run from ``backend/`` with KiCad 10.0.6::

    KICAD_CLI=/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli \\
        venv/bin/python tests/fixtures/system_builder/p2/model_evidence.py
"""

from __future__ import annotations

import json
import math
import os
import struct
import subprocess
import tempfile
import time
from pathlib import Path

from app.services.catalog import models

SHARED = Path("/Applications/KiCad/KiCad.app/Contents/SharedSupport")
OUT = Path(__file__).resolve().parent / "evidence" / "models" / "record.json"

SAMPLES = [
    # (label, footprint library, footprint name, model path under 3dmodels)
    ("pin header", "Connector_PinHeader_2.54mm", "PinHeader_1x04_P2.54mm_Vertical",
     "Connector_PinHeader_2.54mm.3dshapes/PinHeader_1x04_P2.54mm_Vertical.step"),
    ("JST PH side entry", "Connector_JST", "JST_PH_S4B-PH-K_1x04_P2.00mm_Horizontal",
     "Connector_JST.3dshapes/JST_PH_S4B-PH-K_1x04_P2.00mm_Horizontal.step"),
    ("BNC", "Connector_Coaxial", "BNC_Amphenol_B6252HB-NPP3G-50_Horizontal",
     "Connector_Coaxial.3dshapes/BNC_Amphenol_B6252HB-NPP3G-50_Horizontal.step"),
    ("multi-colour RJ45", "Connector_RJ", "RJ45_Amphenol_RJHSE538X",
     "Connector_RJ.3dshapes/RJ45_Amphenol_RJHSE538X.step"),
    ("large multi-body FMC", "Connector_Samtec", "Samtec_FMC_ASP-134602-01_10x40_P1.27mm_Vertical",
     "Connector_Samtec.3dshapes/Samtec_FMC_ASP-134602-01_10x40_P1.27mm_Vertical.step"),
]

BOARD = """(kicad_pcb (version 20240108) (generator "prism_evidence") (generator_version "1")
 (general (thickness 1.6)) (paper "A4")
 (layers (0 "F.Cu" signal) (31 "B.Cu" signal) (36 "B.SilkS" user) (37 "F.SilkS" user) (38 "B.Mask" user)
  (39 "F.Mask" user) (44 "Edge.Cuts" user) (46 "B.CrtYd" user) (47 "F.CrtYd" user) (48 "B.Fab" user) (49 "F.Fab" user))
 (setup (pad_to_mask_clearance 0))
 (net 0 "")
 {footprint}
)"""


def _glb_json(glb: bytes) -> tuple[dict, bytes]:
    length = struct.unpack_from("<I", glb, 12)[0]
    document = json.loads(glb[20:20 + length])
    rest = 20 + length
    binary = b""
    if rest < len(glb):
        chunk_length = struct.unpack_from("<I", glb, rest)[0]
        binary = glb[rest + 8:rest + 8 + chunk_length]
    return document, binary


def _matrix(node: dict) -> list[float]:
    if "matrix" in node:
        return list(node["matrix"])
    tx, ty, tz = node.get("translation", [0, 0, 0])
    qx, qy, qz, qw = node.get("rotation", [0, 0, 0, 1])
    sx, sy, sz = node.get("scale", [1, 1, 1])
    r = [[1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)],
         [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)],
         [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)]]
    return [r[0][0] * sx, r[1][0] * sx, r[2][0] * sx, 0, r[0][1] * sy, r[1][1] * sy, r[2][1] * sy, 0,
            r[0][2] * sz, r[1][2] * sz, r[2][2] * sz, 0, tx, ty, tz, 1]


def _mul(a: list[float], b: list[float]) -> list[float]:
    return [sum(a[k * 4 + row] * b[col * 4 + k] for k in range(4)) for col in range(4) for row in range(4)]


def glb_bounds(glb: bytes) -> tuple[list[float], list[float]]:
    """World AABB of every mesh primitive's POSITION min/max corners, in the GLB's units."""
    document, _binary = _glb_json(glb)
    lo, hi = [math.inf] * 3, [-math.inf] * 3

    def visit(index: int, parent: list[float]) -> None:
        node = document["nodes"][index]
        world = _mul(parent, _matrix(node))
        if "mesh" in node:
            for primitive in document["meshes"][node["mesh"]]["primitives"]:
                accessor = document["accessors"][primitive["attributes"]["POSITION"]]
                amin, amax = accessor["min"], accessor["max"]
                for corner in ((x, y, z) for x in (amin[0], amax[0]) for y in (amin[1], amax[1]) for z in (amin[2], amax[2])):
                    p = [world[0] * corner[0] + world[4] * corner[1] + world[8] * corner[2] + world[12],
                         world[1] * corner[0] + world[5] * corner[1] + world[9] * corner[2] + world[13],
                         world[2] * corner[0] + world[6] * corner[1] + world[10] * corner[2] + world[14]]
                    for i in range(3):
                        lo[i], hi[i] = min(lo[i], p[i]), max(hi[i], p[i])
        for child in node.get("children") or []:
            visit(child, world)

    identity = [1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0, 0, 0, 0, 0, 1.0]
    scene = document["scenes"][document.get("scene", 0)]
    for root in scene["nodes"]:
        visit(root, identity)
    return lo, hi


def kicad_extents(cli: str, library: str, name: str) -> list[float]:
    """Sizes (mm) of the footprint's 3D model as kicad-cli exports it, in glTF axes (x, y up, z)."""
    footprint = (SHARED / "footprints" / f"{library}.pretty" / f"{name}.kicad_mod").read_text().strip()
    footprint = footprint.replace(f'(footprint "{name}"', f'(footprint "{library}:{name}" (at 0 0)', 1)
    with tempfile.TemporaryDirectory() as directory:
        board, out = Path(directory) / "t.kicad_pcb", Path(directory) / "t.glb"
        board.write_text(BOARD.format(footprint=footprint))
        subprocess.run([cli, "pcb", "export", "glb", "--force", "--no-board-body", "-o", str(out), str(board)],
                       check=True, capture_output=True)
        lo, hi = glb_bounds(out.read_bytes())
    unit = 1000.0 if max(h - low for h, low in zip(hi, lo)) < 1.0 else 1.0  # KiCad writes metres
    return [round((h - low) * unit, 4) for h, low in zip(hi, lo)]


def main() -> None:
    cli = os.environ.get("KICAD_CLI", "kicad-cli")
    version = subprocess.run([cli, "--version"], check=True, capture_output=True, text=True).stdout.strip()
    record = {"kicad": version, "converter": models.converter_id(), "models": []}
    for label, library, name, model in SAMPLES:
        step = (SHARED / "3dmodels" / model).read_bytes()
        started = time.perf_counter()
        converted = models.convert(step)
        seconds = time.perf_counter() - started
        lo, hi = converted["bounds"]["minMm"], converted["bounds"]["maxMm"]
        record["models"].append({
            "label": label, "model": model, "footprint": f"{library}:{name}", "stepBytes": len(step),
            "geometerBoundsMm": {"minMm": lo, "maxMm": hi}, "glbBytes": len(converted["glb"]),
            "materials": converted["materials"], "convertSeconds": round(seconds, 2),
            # glTF is y-up: KiCad's (x, y, z) model sizes appear as (x, z, y).
            "kicadExtentsMm": kicad_extents(cli, library, name),
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(record, indent=1) + "\n")


if __name__ == "__main__":
    main()

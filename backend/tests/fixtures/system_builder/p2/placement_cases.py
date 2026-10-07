"""Generate ``placement_cases.json``: shared goldens for the placement library pair (SB2-12, SB2-28).

Inputs are KiCad 10.0.6 **stock** footprints, read with the extractor v6 code
at the origin and then posed here (side, rotation, position), so each case is
the geometry a board with that footprint would produce. The expected outputs
come from the Python library; ``test_system_placement_frames.py`` checks the
meaning of every case by hand (axis, confidence, which way pad 1 and the
mating axis point) and the TypeScript twin must reproduce the numbers.

Run from ``backend/``::

    venv/bin/python tests/fixtures/system_builder/p2/placement_cases.py
"""

from __future__ import annotations

import copy
import json
import math
from pathlib import Path

from kicad_monkey import kicad_pcb_footprint, kicad_sexpr

from app.services.systems.interface_extractor import _footprint_geometry, extract_interface
from app.services.systems.placement import harness_ends, mate, poses, solve
from app.services.systems.placement.frames import connector_frame, infer

SOURCES = Path(__file__).resolve().parent / "sources"
STOCK = Path("/Applications/KiCad/KiCad.app/Contents/SharedSupport/footprints")
OUT = Path(__file__).resolve().parents[1] / "placement_cases.json"
THICKNESS = 1.6

FOOTPRINTS = {
    "header_v": "Connector_PinHeader_2.54mm.pretty/PinHeader_1x04_P2.54mm_Vertical.kicad_mod",
    "header_h": "Connector_PinHeader_2.54mm.pretty/PinHeader_1x04_P2.54mm_Horizontal.kicad_mod",
    "header_2x2": "Connector_PinHeader_2.54mm.pretty/PinHeader_2x02_P2.54mm_Vertical.kicad_mod",
    "jst_side": "Connector_JST.pretty/JST_PH_S4B-PH-K_1x04_P2.00mm_Horizontal.kicad_mod",
    "df40": "Connector_Hirose_DF40.pretty/Hirose_DF40B-10DS-0.4V_2x05-1MP_P0.4mm.kicad_mod",
}


def stock(name: str) -> dict:
    footprint = kicad_pcb_footprint.Footprint.from_sexp(kicad_sexpr.parse_sexp((STOCK / FOOTPRINTS[name]).read_text()))
    return _footprint_geometry(footprint)


def pose(local: dict, *, x: float, y: float, angle: float, side: str = "top") -> dict:
    """Place origin-extracted geometry: mirror left-right for the back, then rotate and move."""
    geometry = copy.deepcopy(local)
    a = math.radians(angle)

    def place(px: float, py: float) -> list[float]:
        if side == "bottom":
            px = -px
        return [round(x + px * math.cos(a) - py * math.sin(a), 4) + 0.0,
                round(y + px * math.sin(a) + py * math.cos(a), 4) + 0.0]

    for pad in geometry["pads"]:
        pad["positionMm"] = place(*pad["positionMm"])
    if side == "bottom" and geometry["courtyard"]:
        lo, hi = geometry["courtyard"]["minMm"], geometry["courtyard"]["maxMm"]
        geometry["courtyard"] = {"minMm": [-hi[0], lo[1]], "maxMm": [-lo[0], hi[1]]}
    geometry.update(side=side, positionMm=[x, y], rotationDeg=angle)
    return geometry


def cases() -> list[dict]:
    header_v, header_h = stock("header_v"), stock("header_h")
    no_courtyard = dict(stock("df40"), courtyard=None)
    renamed = dict(header_h, footprintName="PinHeader_1x04_P2.54mm_Vertical")
    single = dict(header_v, pads=header_v["pads"][:1])
    specs = [
        ("vertical header, top", pose(header_v, x=50, y=-10, angle=0), None),
        ("vertical header, bottom, 90°", pose(header_v, x=20, y=-30, angle=90, side="bottom"), None),
        ("right-angle header, top", pose(header_h, x=0, y=0, angle=0), None),
        ("right-angle header, top, 90°", pose(header_h, x=10, y=5, angle=90), None),
        ("right-angle header, bottom, 180°", pose(header_h, x=-4, y=12, angle=180, side="bottom"), None),
        ("JST PH side entry, top, -90°", pose(stock("jst_side"), x=30, y=-20, angle=-90), None),
        ("DF40 mezzanine without a keyword, top", pose(stock("df40"), x=40, y=-40, angle=0), None),
        ("DF40 mezzanine without a keyword, bottom, 45°", pose(stock("df40"), x=40, y=-40, angle=45, side="bottom"), None),
        ("2x2 header (square array), top, 30°", pose(stock("header_2x2"), x=5, y=5, angle=30), None),
        ("no courtyard and no keyword", pose(no_courtyard, x=0, y=0, angle=0), None),
        ("vertical name on a right-angle body", pose(renamed, x=0, y=0, angle=0), None),
        ("one pad", pose(single, x=0, y=0, angle=0), None),
        ("override: right-angle header turned to +y, two quarter-turns", pose(header_h, x=0, y=0, angle=0),
         {"axis": "+y", "quarterTurns": 2}),
        ("override on an ambiguous footprint", pose(no_courtyard, x=0, y=0, angle=0), {"axis": "top", "quarterTurns": 1}),
    ]
    out = []
    for name, geometry, stored in specs:
        out.append({"name": name, "geometry": geometry, "thicknessMm": THICKNESS, "stored": stored,
                    "expected": {"inference": infer(geometry), "frame": connector_frame(geometry, THICKNESS, stored)}})
    return out


def pose_cases() -> list[dict]:
    """Pose algebra and member placement (§14.1, §14.3), computed by the Python half."""
    s = math.sqrt(0.5)
    turn_z = [0.0, 0.0, s, s]
    tilt_x = poses.canonical_rotation([math.sin(math.radians(15)), 0.0, 0.0, math.cos(math.radians(15))])
    board = {"minMm": [10.0, -60.0, -0.8], "maxMm": [110.0, -10.0, 0.8]}
    small = {"minMm": [0.0, 0.0, -0.8], "maxMm": [30.0, 20.0, 0.8]}
    parent = {"translationMm": [100.0, -20.0, 5.0], "rotation": turn_z}
    child = {"translationMm": [10.0, 0.0, 1.0], "rotation": tilt_x}
    items = [["a", board], ["b", None], ["c", small], ["d", board]]
    stored = {"c": {"translationMm": [0.0, 200.0, 12.5], "rotation": [0.0, 0.0, -s, -s], "source": "manual"}}
    return [
        {"name": "canonical rotation flips w < 0 and normalises", "op": "canonicalRotation",
         "input": {"rotation": [0.0, 0.0, -2.0, -2.0]}, "expected": poses.canonical_rotation([0.0, 0.0, -2.0, -2.0])},
        {"name": "pose from input", "op": "poseFrom", "input": {"translationMm": [1.25, -2.5, 0.0], "rotation": [0, 0, 1, 1]},
         "expected": poses.pose_from([1.25, -2.5, 0.0], [0, 0, 1, 1])},
        {"name": "compose applies the child first", "op": "compose", "input": {"parent": parent, "child": child},
         "expected": poses.compose(parent, child)},
        {"name": "matrix is column-major T·R", "op": "matrix", "input": {"pose": parent}, "expected": poses.matrix(parent)},
        {"name": "bounds after a tilt take all eight corners", "op": "transformBounds",
         "input": {"pose": {"translationMm": [0.0, 0.0, 0.0], "rotation": tilt_x}, "bounds": board},
         "expected": poses.transform_bounds({"translationMm": [0.0, 0.0, 0.0], "rotation": tilt_x}, board)},
        {"name": "default row with an empty slot", "op": "defaultRow", "input": {"items": items},
         "expected": poses.default_row([(k, b) for k, b in items])},
        {"name": "a stored pose wins; the others keep their slots", "op": "place",
         "input": {"items": items, "stored": stored}, "expected": poses.place([(k, b) for k, b in items], stored)},
    ]


MATE_ENDS: dict[str, dict] = {}  # fixture connectors, written once as ``mateEnds`` and named by the cases


def fixture_end(snapshot: str, reference: str) -> dict:
    """One connector of an SB2-21 fixture board, as a mate end: ``{"end": key}`` naming ``MATE_ENDS``."""
    key = f"{snapshot} {reference}"
    if key not in MATE_ENDS:
        board, step = snapshot.split("/")
        payload = extract_interface(SOURCES / board / step / f"{board}.kicad_pro", project_id=f"prj_{board}", commit=None)
        geometry = next(c for c in payload["components"] if c["reference"] == reference)["geometry"]
        MATE_ENDS[key] = {"geometry": geometry, "thicknessMm": payload["boardThicknessMm"], "stored": None}
    return {"end": key}


def resolve(end: dict) -> dict:
    """A case's end with its ``{"end": key}`` reference expanded (the tests do the same)."""
    return {**MATE_ENDS[end["end"]], **{k: v for k, v in end.items() if k != "end"}} if "end" in end else end


def stock_end(name: str, **placement) -> dict:
    stored = placement.pop("stored", None)
    return {"geometry": pose(stock(name), **placement), "thicknessMm": THICKNESS, "stored": stored}


def mate_cases() -> list[dict]:
    """The mate transform and clearance (§14.5, §14.8), computed by the Python half.

    ``test_system_placement_mate.py`` checks the Samtec ones against the
    datasheet goldens and the others by meaning (pad 1 on pad 1, axes opposed).
    """
    def body(end: dict, height: float) -> dict:
        courtyard = resolve(end)["geometry"]["courtyard"]
        lo, hi = courtyard["minMm"], courtyard["maxMm"]
        return {**end, "bodyMm": {"minMm": [*lo, 0.0], "maxMm": [*hi, height]}}

    base, top = fixture_end("mezz_base/F0", "J1"), fixture_end("mezz_top/F0", "J1")
    specs = [
        ("Samtec ADM6/ADF6 mezzanine, link stack 7.00 mm", base, top, 7.0),
        ("Samtec mezzanine, clearance from the datasheet body heights", body(base, 4.9), body(top, 3.23), None),
        ("Samtec mezzanine, clearance from the courtyard x 5 mm", base, top, None),
        ("orthogonal: right-angle header into a vertical socket",
         fixture_end("edge_a/F0", "J1"), fixture_end("edge_b/F0", "J1"), None),
        ("coplanar: right-angle socket and right-angle header",
         fixture_end("edge_a/F0", "J2"), fixture_end("edge_b/F0", "J2"), None),
        ("vertical headers, the far one on a back side at 90 degrees",
         stock_end("header_v", x=50, y=-10, angle=0), stock_end("header_v", x=20, y=-30, angle=90, side="bottom"), 8.5),
        ("square 2x2 headers: k turns pad 1 onto pad 1",
         stock_end("header_2x2", x=5, y=5, angle=0), stock_end("header_2x2", x=0, y=0, angle=0), 3.0),
        ("a quarter-turn override on one side turns the mated board",
         stock_end("header_v", x=50, y=-10, angle=0),
         stock_end("header_v", x=0, y=0, angle=0, side="bottom", stored={"axis": "bottom", "quarterTurns": 1}), 8.5),
        ("one DF40 footprint on both boards (45 degrees, back side): pad 1 lands one row across",
         stock_end("df40", x=40, y=-40, angle=0), stock_end("df40", x=40, y=-40, angle=45, side="bottom"), 1.5),
        ("an end without a frame gives no mate",
         stock_end("header_v", x=0, y=0, angle=0),
         {"geometry": dict(pose(stock("df40"), x=0, y=0, angle=0), courtyard=None), "thicknessMm": THICKNESS,
          "stored": None}, None),
    ]
    out = []
    for name, a, b, stack in specs:
        out.append({"name": name, "op": "mate", "input": {"a": a, "b": b, "stackHeightMm": stack},
                    "expected": mate.mate(resolve(a), resolve(b), stack)})
    shifted = fixture_end("mezz_top/F1", "J2")
    driving = mate.mate(resolve(base), resolve(top), 7.0)
    second = mate.mate(resolve(fixture_end("mezz_base/F0", "J2")), resolve(shifted), 7.0)
    residual_input = {"aWorld": poses.IDENTITY, "bWorld": driving["pose"], "a": fixture_end("mezz_base/F0", "J2"),
                      "b": shifted, "result": second}
    out.append({"name": "residual: the shifted top's J2 misses by 1.5 mm when J1 drives", "op": "residual",
                "input": residual_input,
                "expected": mate.residual(poses.IDENTITY, driving["pose"], resolve(residual_input["a"]), resolve(shifted),
                                          second)})
    return out


def confirmed(end: dict) -> dict:
    """The end with its inference confirmed (§15.2: auto-placement uses stored frames only)."""
    return {**end, "stored": {"axis": infer(resolve(end)["geometry"])["axis"], "quarterTurns": 0}}


def solve_cases() -> list[dict]:
    """The tree solve (§14.9), computed by the Python half; ``test_system_placement_solve.py`` checks the meaning."""
    board = {"minMm": [100.0, -125.0, -0.8], "maxMm": [150.0, -85.0, 0.8]}
    edge = {"minMm": [95.0, -130.0, -0.8], "maxMm": [145.0, -95.0, 0.8]}
    base = {r: confirmed(fixture_end("mezz_base/F0", r)) for r in ("J1", "J2")}
    top = {r: confirmed(fixture_end("mezz_top/F0", r)) for r in ("J1", "J2")}
    shifted = {r: confirmed(fixture_end("mezz_top/F1", r)) for r in ("J1", "J2")}

    def pair(link_id, a_member, a_end, b_member, b_end, ref, rows=30, stack=7.0, a_in=None, b_in=None):
        a = {"member": a_member, "reference": ref, "end": a_end}
        b = {"member": b_member, "reference": ref, "end": b_end}
        if a_in:
            a["inMember"] = a_in
        if b_in:
            b["inMember"] = b_in
        return {"linkId": link_id, "rows": rows, "stackHeightMm": stack, "a": a, "b": b}

    stack = [pair("lnk_j1", "base", base["J1"], "top", shifted["J1"], "J1"),
             pair("lnk_j2", "base", base["J2"], "top", shifted["J2"], "J2")]
    items = [["base", board], ["top", board]]
    edges = [pair("lnk_edge", "edge_a", confirmed(fixture_end("edge_a/F0", "J1")), "edge_b",
                  confirmed(fixture_end("edge_b/F0", "J1")), "J1", rows=4, stack=None)]
    inside = {"translationMm": [5.0, -2.0, 1.5], "rotation": poses.canonical_rotation([0.0, 0.0, 1.0, 1.0])}
    moved = {"translationMm": [0.0, 0.0, 30.0], "rotation": [0.0, 0.0, 0.0, 1.0], "source": "manual"}
    specs = [
        ("misplacement fixture: J1 drives (equal rows, lower reference), J2 misses by 1.5 mm",
         items, {}, [["base", "top"], ["base", "top"]], stack, None),
        ("the aligned commit checks clean",
         items, {}, [["base", "top"], ["base", "top"]],
         [pair("lnk_j1", "base", base["J1"], "top", top["J1"], "J1"),
          pair("lnk_j2", "base", base["J2"], "top", top["J2"], "J2")], None),
        ("the mate with more rows drives",
         items, {}, [["base", "top"], ["base", "top"]], [stack[0], {**stack[1], "rows": 40}], None),
        ("a driving override wins over rows",
         items, {}, [["base", "top"], ["base", "top"]], [stack[0], {**stack[1], "rows": 40}], {"top": "lnk_j1"}),
        ("an unconfirmed end makes its mate unusable",
         items, {}, [["base", "top"]],
         [pair("lnk_j1", "base", base["J1"], "top", fixture_end("mezz_top/F1", "J1"), "J1")], None),
        ("a manual pose on the driven board: overridden, the auto pose kept for snap-back",
         items, {"top": moved}, [["base", "top"], ["base", "top"]], stack, None),
        ("the root is the most-connected member; others hang off it",
         [["top", board], ["base", board], ["radio", board]], {},
         [["base", "top"], ["base", "radio"], ["base", "top"]], stack[:1], None),
        ("an assembly member: the connector's board sits inside it",
         [["base", board], ["cdh", board]], {}, [["base", "cdh"]],
         [pair("lnk_j1", "base", base["J1"], "cdh", top["J1"], "J1", b_in=inside)], None),
        ("two mated groups and a loose board",
         [["base", board], ["edge_a", edge], ["edge_b", edge], ["loose", board], ["top", board]], {},
         [["base", "top"], ["edge_a", "edge_b"]], stack[:1] + edges, None),
        ("an override naming no usable mate, or one only reachable through itself, is ignored",
         [["a", board], ["b", board], ["c", board], ["d", board]], {}, [["a", "b"], ["a", "c"], ["a", "d"]],
         [pair("lnk_ab", "a", base["J1"], "b", top["J1"], "J1"), pair("lnk_bc", "b", base["J2"], "c", top["J2"], "J2"),
          pair("lnk_cd", "c", base["J1"], "d", top["J1"], "J1", stack=12.0)],
         {"b": "lnk_nope", "c": "lnk_cd"}),
        ("every member overridden: the hub is root and its override is ignored",
         [["a", board], ["b", board]], {}, [["a", "b"]],
         [pair("lnk_ab", "a", base["J1"], "b", top["J1"], "J1")], {"a": "lnk_ab", "b": "lnk_ab"}),
    ]
    out = []
    for name, members, stored, connections, mates, overrides in specs:
        resolved = [{**m, "a": {**m["a"], "end": resolve(m["a"]["end"])}, "b": {**m["b"], "end": resolve(m["b"]["end"])}}
                    for m in mates]
        out.append({"name": name, "input": {"items": members, "stored": stored, "connections": connections,
                                            "mates": mates, "overrides": overrides},
                    "expected": solve.solve([tuple(i) for i in members], stored, [tuple(c) for c in connections],
                                            resolved, overrides)})
    return out


def harness_end_cases() -> list[dict]:
    """Harness end poses and exit legs (§17.6), computed by the Python half."""
    s = math.sqrt(0.5)
    tilted = {"translationMm": [100.0, -20.0, 5.0], "rotation": poses.canonical_rotation([0.0, 0.3, 0.2, 0.93])}
    housing = {"boundsMm": {"minMm": [-6.0, -3.0, -14.0], "maxMm": [6.0, 3.0, 0.0]},
               "alignment": {"offsetMm": [0.5, 0.0, 0.0], "rotationDeg": [0.0, 0.0, 90.0], "scale": 1.0}}
    scaled = {"boundsMm": {"minMm": [-0.6, -0.3, -1.4], "maxMm": [0.6, 0.3, 0.0]},
              "alignment": {"offsetMm": [0.0, 0.0, 0.0], "rotationDeg": [0.0, 180.0, 0.0], "scale": 10.0}}
    header_v, header_h = pose(stock("header_v"), x=50, y=-10, angle=0), pose(stock("header_h"), x=0, y=0, angle=0)
    specs = [
        ("vertical header, no housing model", poses.IDENTITY, header_v, None, 0, None, None),
        ("right-angle header: the exit runs along the board", poses.IDENTITY, header_h, None, 0, None, None),
        ("back-side header on a tilted board, a quarter turn", tilted,
         pose(stock("header_v"), x=20, y=-30, angle=90, side="bottom"), None, 1, None, None),
        ("a housing model aligned by a quarter turn sets the depth", poses.IDENTITY, header_v, None, 0, housing, None),
        ("a scaled, flipped housing model", poses.IDENTITY, header_v, None, 0, scaled, None),
        ("connector body bounds set the mating plane", poses.IDENTITY, header_v, None, 0, None,
         {"minMm": [-1.27, -8.89, 0.0], "maxMm": [1.27, 1.27, 8.5]}),
        ("an override frame: the right-angle header turned to +y", poses.IDENTITY, header_h,
         {"axis": "+y", "quarterTurns": 0}, 0, None, None),
        ("no frame: details needed", poses.IDENTITY, dict(pose(stock("df40"), x=0, y=0, angle=0), courtyard=None),
         None, 0, None, None),
    ]
    out = []
    for name, world, geometry, stored, turns, housing_model, body in specs:
        args = {"boardWorld": world, "geometry": geometry, "thicknessMm": THICKNESS, "stored": stored,
                "quarterTurns": turns, "housing": housing_model, "bodyMm": body}
        out.append({"name": name, "input": args,
                    "expected": harness_ends.board_end(world, geometry, THICKNESS, stored, turns, housing_model, body)})
    del s
    return out


def compact(value, indent: int = 0) -> str:
    """JSON with every container that fits in 120 columns on one line (pads stay one per line)."""
    flat = json.dumps(value)
    if not isinstance(value, (dict, list)) or len(flat) + indent <= 120:
        return flat
    pad = " " * (indent + 1)
    if isinstance(value, list):
        items = [pad + compact(v, indent + 1) for v in value]
        return "[\n" + ",\n".join(items) + "\n" + " " * indent + "]"
    items = [f"{pad}{json.dumps(k)}: {compact(v, indent + 1)}" for k, v in value.items()]
    return "{\n" + ",\n".join(items) + "\n" + " " * indent + "}"


def main() -> None:
    OUT.write_text(compact({"schema": "prism.placement_cases.v1", "kicad": "10.0.6 stock footprints",
                            "tolerance": {"mm": 1e-6, "unit": 1e-9}, "frames": cases(),
                            "poses": pose_cases(), "mates": mate_cases(),
                            "solves": solve_cases(), "harnessEnds": harness_end_cases(), "mateEnds": MATE_ENDS}) + "\n")


if __name__ == "__main__":
    main()

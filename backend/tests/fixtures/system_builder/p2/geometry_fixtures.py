"""Generate the P2 geometry fixture boards (SB2-21, plan §8).

Boards (``sources/<board>/<step>/``):

* ``mezz_base`` / F0: 50×40 mm, 1.6 mm. J1 and J2 are Samtec ADM6-30-03.5-L-4-0-A
  terminals (AcceleRate HD, 4×30 at 0.635 mm) on the top side, 30 mm apart.
* ``mezz_top`` / F0: the same outline. J1 and J2 are ADF6-30-03.5-L-4-0-A sockets on the
  bottom side, over the terminals, so both pairs mate. F1 is the next commit: J2 moved
  +1.5 mm in X. This is the JTYU OBC (ADM6) to CMBD (ADF6) pair.
* ``edge_a`` / F0 and ``edge_b`` / F0: J1 is a right-angle pin header (edge_a) mating a
  vertical socket (edge_b); J2 is a right-angle socket (edge_a) mating a right-angle
  header (edge_b).
* ``ambiguous`` / F0: J1 is a fixture-library 2×05 footprint whose name says neither
  vertical nor right-angle, with no courtyard and no 3D model.

Footprints are placed through KiCad's IPC API (``ipc_build.py``; KiCad 11 drops the SWIG
``pcbnew`` module). The edge and ``ambiguous`` parts are KiCad 10.0.6 stock. KiCad ships
no ADM6/ADF6, so their footprints are written here from Samtec's recommended PCB layouts
(``SAMTEC`` below), and the boards reference Samtec's STEP files, which are not
redistributed: put them in ``vendor/samtec/`` (see the README) before running this.

Every board is checked with ``kicad-cli`` 10.0.6: ``sch erc``, ``pcb drc
--schematic-parity``, ``sch export netlist``, ``pcb export step`` and ``pcb export glb``.
Reports go to ``evidence/fixtures/<board>/<step>/``; ``evidence/fixtures/record.json``
holds every command, exit code and violation count, and the SHA-256 of every file.

Run it with a Python that has ``kicad-python==0.8.0``, while KiCad 10.0.6's PCB editor is
open on any board with the API server enabled (the generator replaces that board's
contents and saves it under each fixture's name)::

    <python with kicad-python> tests/fixtures/system_builder/p2/geometry_fixtures.py
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import generate as g  # noqa: E402  (the P1 schematic writer)

sys.path.insert(0, str(HERE))
import ipc_build  # noqa: E402

SOURCES = HERE / "sources"
EVIDENCE = HERE / "evidence" / "fixtures"
VENDOR = HERE / "vendor" / "samtec"
KICAD = Path("/Applications/KiCad/KiCad.app/Contents")
CLI = os.environ.get("KICAD_CLI", str(KICAD / "MacOS" / "kicad-cli"))
STOCK = KICAD / "SharedSupport" / "footprints"
FIXTURE_LIB = "PrismFixture"
THICKNESS = 1.6

# Samtec's STEP files (PARTsolutions exports). Samtec serves them only after an e-mail
# sign-up; these are the copies in the JTYU repositories' packages3D folders (README).
VENDOR_MODELS = {
    "ADM6": "ADM6-30-03.5-L-4-0-A-TR.stp",
    "ADF6": "ADF6-30-03.5-L-4-0-A-TR.stp",
}


def _mod(board: str, step: str) -> str:
    """Model paths are relative to the project, so the committed sources work wherever the repo is."""
    return "${KIPRJMOD}/" + os.path.relpath(VENDOR, SOURCES / board / step)


# ADM6 / ADF6, 30 positions per row, from Samtec's drawings (README, "Where the numbers
# come from"): recommended PCB layouts ADM6-XXX-XX.X-XXX-X-X-X-FOOTPRINT rev G and
# ADF6-…-FOOTPRINT rev H (sheet 1, -0 column termination, -A alignment pins). Page mm,
# y down, origin at the centre. Both drawings are top views of the part's own board:
# the ADM6 has row A at the top, the ADF6 row A at the bottom, pin 01 at the right.
POSITIONS = 30
PITCH = 0.635  # along a row
ROWS_Y = {"A": -1.75, "B": -0.79, "C": 0.79, "D": 1.75}  # 3.50 between A and D, 1.58 between B and C
PAD_DIAMETER = 0.356
NPTH_DIAMETER = 0.950
ENVELOPE = (23.77, 5.00)  # Table 1 "A" for -30 × 5.00, with 1.00 × 45° chamfers on the row-A side
NPTH_SPACING = 21.22  # Table 1 "C" (-A option)
NPTH_OFFSET = 1.27  # one hole sits 1.27 off the centreline
SAMTEC = {
    # kind: (footprint name, row-A side (-1 top / +1 bottom), NPTHs (x sign, y), part, model)
    "ADM6": ("Samtec_ADM6-30-03.5-L-4-0-A", -1, ((-1, -NPTH_OFFSET), (1, 0.0)), "ADM6-30-03.5-L-4-0-A-TR"),
    "ADF6": ("Samtec_ADF6-30-03.5-L-4-0-A", 1, ((-1, 0.0), (1, -NPTH_OFFSET)), "ADF6-30-03.5-L-4-0-A-TR"),
}
SAMTEC_PINS = [f"{row}{n:02d}" for row in "ABCD" for n in range(1, POSITIONS + 1)]

# The models (Y up, origin at the seating plane, centred) need only KiCad's usual turn
# from Y up to Z up. Their alignment pins sit on the NPTHs above at this placement, which
# fixes both the turn and the pin-1 end (README, "3D models").
MODEL_PLACEMENT = {"offsetMm": [0.0, 0.0, 0.0], "rotationDeg": [-90.0, 0.0, 0.0]}


def _samtec_footprint(kind: str, board: str, step: str) -> str:
    name, row_a_side, holes, part = SAMTEC[kind]
    sign = 1 if row_a_side < 0 else -1  # ADF6 rows are the ADM6 rows mirrored
    width, height = ENVELOPE
    hw, hh, c = width / 2, height / 2, 1.0
    a = row_a_side * hh  # the chamfered (row-A) edge
    outline = [(-hw, -a), (hw, -a), (hw, a - row_a_side * c), (hw - c, a), (-hw + c, a), (-hw, a - row_a_side * c)]
    lines = []
    for (x0, y0), (x1, y1) in zip(outline, outline[1:] + outline[:1]):
        lines.append(f'\t(fp_line (start {x0:g} {y0:g}) (end {x1:g} {y1:g}) (stroke (width 0.1) (type solid)) (layer "F.Fab"))')
    pin1_x = (POSITIONS - 1) / 2 * PITCH
    pads = []
    for pin in SAMTEC_PINS:
        x = round(pin1_x - (int(pin[1:]) - 1) * PITCH, 4)
        y = sign * ROWS_Y[pin[0]]
        pads.append(f'\t(pad "{pin}" smd circle (at {x:g} {y:g}) (size {PAD_DIAMETER:g} {PAD_DIAMETER:g}) '
                    '(layers "F.Cu" "F.Paste" "F.Mask"))')
    for x_sign, y in holes:
        pads.append(f'\t(pad "" np_thru_hole circle (at {x_sign * NPTH_SPACING / 2:g} {y:g}) '
                    f'(size {NPTH_DIAMETER:g} {NPTH_DIAMETER:g}) (drill {NPTH_DIAMETER:g}) (layers "*.Cu" "*.Mask"))')
    offset, rotation = MODEL_PLACEMENT["offsetMm"], MODEL_PLACEMENT["rotationDeg"]
    return f"""(footprint "{name}"
\t(version 20260206)
\t(generator "prism_fixture")
\t(layer "F.Cu")
\t(descr "SB2-21 fixture: Samtec {part}, from Samtec's recommended PCB layout")
\t(property "Reference" "REF**" (at 0 {-row_a_side * (hh + 1.2):g} 0) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))
\t(property "Value" "{name}" (at 0 {row_a_side * (hh + 1.2):g} 0) (layer "F.Fab") (effects (font (size 1 1) (thickness 0.15))))
\t(attr smd)
{chr(10).join(lines)}
\t(fp_rect (start {-hw - 0.25:g} {-hh - 0.25:g}) (end {hw + 0.25:g} {hh + 0.25:g}) (stroke (width 0.05) (type solid)) (fill no) (layer "F.CrtYd"))
{chr(10).join(pads)}
\t(model "{_mod(board, step)}/{VENDOR_MODELS[kind]}"
\t\t(offset (xyz {" ".join(f"{v:g}" for v in offset)}))
\t\t(scale (xyz 1 1 1))
\t\t(rotate (xyz {" ".join(f"{v:g}" for v in rotation)}))
\t)
\t(embedded_fonts no)
)
"""


# --------------------------------------------------------------------------
# Symbols: one fixture-library symbol per footprint, so the schematic's Footprint
# field and the board agree (DRC schematic parity).

def _conn(name: str, pins: int | list[str], footprint: str) -> g.LibSymbol:
    numbers = [str(i) for i in range(1, pins + 1)] if isinstance(pins, int) else pins
    return g.LibSymbol(f"{FIXTURE_LIB}:{name}", "J", name, footprint,
                       tuple(g.LibPin(n, n if isinstance(pins, list) else f"Pin_{n}") for n in numbers))


SYMBOLS = {
    "ADM6": _conn("ADM6_4x30", SAMTEC_PINS, f"{FIXTURE_LIB}:{SAMTEC['ADM6'][0]}"),
    "ADF6": _conn("ADF6_4x30", SAMTEC_PINS, f"{FIXTURE_LIB}:{SAMTEC['ADF6'][0]}"),
    "HDR_RA": _conn("Header_1x04_RA", 4, "Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Horizontal"),
    "SKT_RA": _conn("Socket_1x04_RA", 4, "Connector_PinSocket_2.54mm:PinSocket_1x04_P2.54mm_Horizontal"),
    "SKT_V": _conn("Socket_1x04_V", 4, "Connector_PinSocket_2.54mm:PinSocket_1x04_P2.54mm_Vertical"),
    "CUSTOM": _conn("Conn_Custom_2x05", 10, f"{FIXTURE_LIB}:Conn_Custom_2x05"),
}

# A footprint of the fixture's own library: 2×05 at 2.54 mm, no courtyard, no model,
# and a name that says neither vertical nor right-angle.
CUSTOM_FOOTPRINT = """(footprint "Conn_Custom_2x05"
\t(version 20260206)
\t(generator "prism_fixture")
\t(layer "F.Cu")
\t(descr "SB2-21 fixture: a connector whose orientation cannot be inferred")
\t(property "Reference" "REF**" (at 0 -2.5 0) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))
\t(property "Value" "Conn_Custom_2x05" (at 0 12.7 0) (layer "F.Fab") (effects (font (size 1 1) (thickness 0.15))))
\t(fp_rect (start -1.27 -1.27) (end 3.81 11.43) (stroke (width 0.1) (type default)) (fill no) (layer "F.Fab"))
{pads}
\t(embedded_fonts no)
)
"""


def _custom_pads() -> str:
    rows = []
    for i in range(10):
        number, x, y = i + 1, (i % 2) * 2.54, (i // 2) * 2.54
        shape = "rect" if number == 1 else "circle"
        rows.append(f'\t(pad "{number}" thru_hole {shape} (at {x:g} {y:g}) (size 1.7 1.7) (drill 1) '
                    '(layers "*.Cu" "*.Mask"))')
    return "\n".join(rows)


# --------------------------------------------------------------------------
# Boards. Page coordinates in mm (y down), as KiCad stores them.

def _part(key: str, reference: str, at: tuple[float, float], side: str, rotation: float, prefix: str) -> dict:
    return {"symbol": key, "reference": reference, "atMm": list(at), "side": side, "rotationDeg": rotation,
            "netPrefix": prefix}


# Each net joins two pins of one connector (a loopback), routed on the board, so every
# net is real (no ERC isolated labels, no DRC unconnected items). Samtec pins An and Bn,
# Cn and Dn sit 0.96 mm apart in neighbouring rows; the others pair neighbours on one row.
SAMTEC_LOOPBACKS = [(f"{a}{n:02d}", f"{b}{n:02d}") for a, b in ("AB", "CD") for n in range(1, POSITIONS + 1)]
LOOPBACKS = {
    "ADM6": SAMTEC_LOOPBACKS,
    "ADF6": SAMTEC_LOOPBACKS,
    "HDR_RA": [("1", "2"), ("3", "4")],
    "SKT_RA": [("1", "2"), ("3", "4")],
    "SKT_V": [("1", "2"), ("3", "4")],
    "CUSTOM": [(str(n), str(n + 1)) for n in range(1, 11, 2)],
}


def _net(part: dict, pin: str) -> str:
    """The loopback net a pin is on, named after its first pin (A_A01 joins J1 pins A01 and B01)."""
    first = next(a for a, b in LOOPBACKS[part["symbol"]] if pin in (a, b))
    return f"{part['netPrefix']}{first}"


def boards() -> list[dict]:
    base = [_part("ADM6", "J1", (125, 105), "top", 0, "A_"),
            _part("ADM6", "J2", (125, 135), "top", 0, "B_")]
    # Flipped to the bottom with no further turn, the socket's pin An lands on the
    # terminal's pin An: Samtec draws the ADF6 rows mirrored for exactly this.
    # The generator checks it from the placed pads (and kicad-cli's IPC-D-356 agrees).
    top = [_part("ADF6", "J1", (125, 105), "bottom", 0, "A_"),
           _part("ADF6", "J2", (125, 135), "bottom", 0, "B_")]
    shifted = [top[0], {**top[1], "atMm": [126.5, 135]}]
    return [
        {"board": "mezz_base", "step": "F0", "outlineMm": [100, 100, 150, 140], "parts": base},
        {"board": "mezz_top", "step": "F0", "outlineMm": [100, 100, 150, 140], "parts": top},
        {"board": "mezz_top", "step": "F1", "outlineMm": [100, 100, 150, 140], "parts": shifted},
        {"board": "edge_a", "step": "F0", "outlineMm": [100, 100, 140, 130],
         "parts": [_part("HDR_RA", "J1", (105, 104), "top", 0, "E"),
                   _part("SKT_RA", "J2", (135, 118), "top", 0, "C")]},
        {"board": "edge_b", "step": "F0", "outlineMm": [100, 100, 140, 130],
         "parts": [_part("SKT_V", "J1", (110, 106), "top", 0, "E"),
                   _part("HDR_RA", "J2", (105, 118), "top", 0, "C")]},
        {"board": "ambiguous", "step": "F0", "outlineMm": [100, 100, 130, 125],
         "parts": [_part("CUSTOM", "J1", (110, 106), "top", 0, "X")]},
    ]


# --------------------------------------------------------------------------
# Writers.

def _schematic_board(spec: dict) -> g.Board:
    symbols = []
    for index, part in enumerate(spec["parts"]):
        lib = SYMBOLS[part["symbol"]]
        pins = {p.number: ("local", _net(part, p.number)) for p in lib.pins}
        symbols.append(g.Symbol(key=part["reference"], lib=part["symbol"], at=(60.96 + index * 50.8, 50.8),
                                pins=pins, refs={"": part["reference"]}))
    return g.Board(name=spec["board"], root=g.SheetFile(f"{spec['board']}.kicad_sch", symbols))


def _symbol_library() -> str:
    body = []
    for sym in SYMBOLS.values():
        text = g.lib_symbol_sexpr(sym)
        body.append(text.replace(g.q(sym.lib_id), g.q(sym.lib_id.split(":", 1)[1]), 1))
    return ('(kicad_symbol_lib\n(version 20251024)\n(generator "prism_fixture")\n(generator_version "10.0")\n'
            + "\n".join(body) + "\n)\n")


def _tables(directory: Path) -> None:
    (directory / "sym-lib-table").write_text(
        '(sym_lib_table\n\t(version 7)\n'
        f'\t(lib (name "{FIXTURE_LIB}") (type "KiCad") (uri "${{KIPRJMOD}}/{FIXTURE_LIB}.kicad_sym") (options "") (descr "SB2-21 fixture symbols"))\n)\n')
    (directory / "fp-lib-table").write_text(
        '(fp_lib_table\n\t(version 7)\n'
        f'\t(lib (name "{FIXTURE_LIB}") (type "KiCad") (uri "${{KIPRJMOD}}/{FIXTURE_LIB}.pretty") (options "") (descr "SB2-21 fixture footprints"))\n)\n')
    (directory / f"{FIXTURE_LIB}.kicad_sym").write_text(_symbol_library())
    pretty = directory / f"{FIXTURE_LIB}.pretty"
    pretty.mkdir(exist_ok=True)
    (pretty / "Conn_Custom_2x05.kicad_mod").write_text(CUSTOM_FOOTPRINT.format(pads=_custom_pads()))
    board, step = directory.parent.name, directory.name
    for kind, (name, *_rest) in SAMTEC.items():
        (pretty / f"{name}.kicad_mod").write_text(_samtec_footprint(kind, board, step))


def _pcb_spec(spec: dict, directory: Path, board: g.Board) -> dict:
    footprints = []
    for part in spec["parts"]:
        lib = SYMBOLS[part["symbol"]]
        library, name = lib.footprint.split(":", 1)
        path = (directory / f"{FIXTURE_LIB}.pretty") if library == FIXTURE_LIB else (STOCK / f"{library}.pretty")
        sym = next(s for s in board.root.symbols if s.key == part["reference"])
        footprints.append({
            "library": library, "name": name, "footprintFile": str(path / f"{name}.kicad_mod"), "reference": part["reference"],
            "value": lib.value, "atMm": part["atMm"], "side": part["side"], "rotationDeg": part["rotationDeg"],
            "path": f"{g.instance_path(board, None)}/{g.symbol_uuid(board, sym)}",
            "nets": {p.number: f"/{_net(part, p.number)}" for p in lib.pins},
            "loopbacks": [list(pair) for pair in LOOPBACKS[part["symbol"]]],
        })
    return {"thicknessMm": THICKNESS, "outlineMm": spec["outlineMm"], "footprints": footprints,
            "schematicFile": f"{spec['board']}.kicad_sch"}


def _stable_uuids(text: str, board: str, step: str) -> str:
    """pcbnew draws random UUIDs; replace them in order of appearance so the file is reproducible."""
    seen: dict[str, str] = {}

    def stable(match: re.Match) -> str:
        old = match.group(1)
        seen.setdefault(old, g.uid(board, step, "pcb", str(len(seen))))
        return f'(uuid "{seen[old]}")'

    return re.sub(r'\(uuid "([0-9a-f-]{36})"\)', stable, text)


def _numeric_models(models: list) -> list:
    return [[m[1], *[[float(v) for v in ipc_build.child(ipc_build.child(m, key), "xyz")[1:]]
                     for key in ("offset", "scale", "rotate")]] for m in models]


def _check_models(spec: dict, directory: Path, pcb: Path) -> None:
    """Every placed footprint's 3D model block must equal its library file's (DRC does not check offsets)."""
    board = ipc_build.parse(pcb.read_text())
    placed = {}
    for footprint in ipc_build.children(board, "footprint"):
        reference = next(p[2] for p in ipc_build.children(footprint, "property") if p[1] == "Reference")
        placed[reference] = ipc_build.children(footprint, "model")
    for part in spec["parts"]:
        library, name = SYMBOLS[part["symbol"]].footprint.split(":", 1)
        path = (directory / f"{FIXTURE_LIB}.pretty") if library == FIXTURE_LIB else (STOCK / f"{library}.pretty")
        expected = ipc_build.children(ipc_build.parse((path / f"{name}.kicad_mod").read_text()), "model")
        if _numeric_models(placed[part["reference"]]) != _numeric_models(expected):
            raise SystemExit(f"{spec['board']}/{spec['step']} {part['reference']}: 3D model differs from the library: "
                             f"{_numeric_models(placed[part['reference']])} != {_numeric_models(expected)}")


def _run(argv: list[str], cwd: Path) -> dict:
    result = subprocess.run([CLI, *argv], cwd=cwd, capture_output=True, text=True)
    return {"argv": ["kicad-cli", *argv], "exitCode": result.returncode}


def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _violations(report: Path) -> dict:
    data = json.loads(report.read_text())
    counts: dict[str, int] = {}
    for sheet in data.get("sheets") or [data]:
        for key in ("violations", "unconnected_items", "schematic_parity"):
            for violation in sheet.get(key) or []:
                counts[violation.get("severity", "?")] = counts.get(violation.get("severity", "?"), 0) + 1
    return counts


def build(spec: dict, record: dict) -> None:
    board_name, step = spec["board"], spec["step"]
    directory = SOURCES / board_name / step
    if directory.exists():
        shutil.rmtree(directory)
    directory.mkdir(parents=True)
    board = _schematic_board(spec)
    g.LIB.update(SYMBOLS)
    _tables(directory)
    (directory / f"{board_name}.kicad_pro").write_text(g.project_text(board))
    (directory / f"{board_name}.kicad_sch").write_text(g.schematic_text(board, board.root))

    pads = ipc_build.build({**_pcb_spec(spec, directory, board), "output": str(directory / f"{board_name}.kicad_pcb"),
                            "idSeed": f"{board_name}/{step}"})
    # Saving from the editor may rewrite the project file; keep the generated one.
    (directory / f"{board_name}.kicad_pro").write_text(g.project_text(board))
    pcb = directory / f"{board_name}.kicad_pcb"
    pcb.write_text(_stable_uuids(pcb.read_text(), board_name, step))
    _check_models(spec, directory, pcb)

    out = EVIDENCE / board_name / step
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    (out / "pads.json").write_text(json.dumps(pads, indent=1, sort_keys=True) + "\n")
    commands = [_run(["sch", "upgrade", "--force", f"{board_name}.kicad_sch"], directory)]
    checks = {
        "erc": ["sch", "erc", "--format", "json", "--severity-all", "-o", str(out / "erc.json"), f"{board_name}.kicad_sch"],
        "drc": ["pcb", "drc", "--format", "json", "--severity-all", "--schematic-parity", "-o", str(out / "drc.json"),
                f"{board_name}.kicad_pcb"],
        "netlist": ["sch", "export", "netlist", "--format", "kicadxml", "-o", str(out / "netlist.xml"), f"{board_name}.kicad_sch"],
        "step": ["pcb", "export", "step", "--force", "--no-dnp", "-o", str(Path(tempfile.gettempdir()) / f"{board_name}-{step}.step"),
                 f"{board_name}.kicad_pcb"],
        "glb": ["pcb", "export", "glb", "--force", "-o", str(Path(tempfile.gettempdir()) / f"{board_name}-{step}.glb"),
                f"{board_name}.kicad_pcb"],
    }
    results = {}
    for name, argv in checks.items():
        result = subprocess.run([CLI, *argv], cwd=directory, capture_output=True, text=True)
        commands.append({"argv": ["kicad-cli", *argv[:2], *(a for a in argv[2:] if not a.startswith("/"))],
                         "exitCode": result.returncode})
        results[name] = {"exitCode": result.returncode}
        if name in ("step", "glb"):
            # The export log names each model it could not load; none may be missing.
            log = result.stdout + result.stderr
            results[name]["missingModels"] = sorted(set(re.findall(r"[Cc]ould not (?:load|find|add) [^\n]*", log)))
    for name in ("erc", "drc"):
        results[name]["violations"] = _violations(out / f"{name}.json")
        # The reports carry the date and absolute paths; keep only what is reproducible.
        data = json.loads((out / f"{name}.json").read_text())
        for key in ("date", "source", "kicad_version"):
            data.pop(key, None)
        (out / f"{name}.json").write_text(json.dumps(data, indent=1, sort_keys=True) + "\n")
    netlist = (out / "netlist.xml").read_text()
    netlist = re.sub(r"<source>.*?</source>", "<source/>", netlist)
    netlist = re.sub(r"<date>.*?</date>", "<date/>", netlist)
    netlist = re.sub(r"<tool>.*?</tool>", "<tool/>", netlist)
    (out / "netlist.xml").write_text(netlist)
    for leftover in list(directory.glob("*.kicad_prl")) + list(directory.glob("*-backups")) + list(directory.glob("*.bak")):
        shutil.rmtree(leftover) if leftover.is_dir() else leftover.unlink()
    record["boards"][f"{board_name}/{step}"] = {
        "commands": commands, "checks": results,
        "files": {str(p.relative_to(HERE)): _sha(p) for p in sorted(directory.rglob("*")) if p.is_file()},
    }


def main() -> int:
    version = subprocess.run([CLI, "--version"], capture_output=True, text=True, check=True).stdout.strip()
    if version != "10.0.6":
        print(f"expected kicad-cli 10.0.6, found {version!r}", file=sys.stderr)
        return 1
    missing = [f for f in VENDOR_MODELS.values() if not (VENDOR / f).is_file()]
    if missing:
        print(f"missing Samtec models in {VENDOR}: {', '.join(missing)} (see the README)", file=sys.stderr)
        return 1
    record = {"kicad": version, "vendorModels": {f: {"sha256": _sha(VENDOR / f)} for f in VENDOR_MODELS.values()},
              "boards": {}}
    for spec in boards():
        build(spec, record)
    (EVIDENCE / "record.json").write_text(json.dumps(record, indent=1, sort_keys=True) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

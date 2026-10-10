"""Generate the System Builder fixture boards (SYS-01).

Three small KiCad 10.0.6 projects and the per-step snapshots that exercise
every drift rule in ``docs/system-builder/CONTRACTS.md`` §11. The model below
is the only hand-authored input; every ``.kicad_*`` file under ``sources/`` is
emitted from it and then re-saved by ``kicad-cli ... upgrade --force`` so the
committed files are KiCad-written. UUIDs are uuid5 of stable labels, so the
output is byte-reproducible.

    KICAD_CLI=/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli \\
        python3 backend/tests/fixtures/system_builder/generate.py

Evidence: ``kicad-cli sch export netlist --format kicadxml`` for every
snapshot, normalized and written under ``evidence/``. ``manifest.json``
records the executable, every command, and the SHA-256 of every file.
"""

from __future__ import annotations

import copy
import datetime
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import uuid
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / "sources"
EVIDENCE = ROOT / "evidence"
NAMESPACE = uuid.UUID("5b1d7f0e-3c55-4a8e-9a57-8f2f3b1c0d66")
SCH_VERSION = "20260306"
PCB_VERSION = "20260206"


def uid(*parts: str) -> str:
    return str(uuid.uuid5(NAMESPACE, ":".join(parts)))


def q(text: str) -> str:
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'


# --------------------------------------------------------------------------
# Library symbols. Pins are laid out top to bottom on the left edge; a pin's
# ``at`` is its connectable end, which is where labels are placed.

PITCH = 2.54


@dataclass(frozen=True)
class LibPin:
    number: str
    name: str
    unit: int = 1


@dataclass(frozen=True)
class LibSymbol:
    lib_id: str
    reference_prefix: str
    value: str
    footprint: str
    pins: tuple[LibPin, ...]

    @property
    def units(self) -> int:
        return max(pin.unit for pin in self.pins)

    def unit_pins(self, unit: int) -> list[LibPin]:
        return [pin for pin in self.pins if pin.unit == unit]

    def pin_offset(self, number: str) -> tuple[float, float]:
        """Library-space position (y up) of a pin's connectable end."""
        pin = next(p for p in self.pins if p.number == number)
        index = self.unit_pins(pin.unit).index(pin)
        return (-5.08, -index * PITCH)


def conn_1xn(n: int) -> LibSymbol:
    return LibSymbol(
        f"Connector_Generic:Conn_01x{n:02d}",
        "J",
        f"Conn_01x{n:02d}",
        f"Connector_PinHeader_2.54mm:PinHeader_1x{n:02d}_P2.54mm_Vertical",
        tuple(LibPin(str(i), f"Pin_{i}") for i in range(1, n + 1)),
    )


def conn_2xn(n: int) -> LibSymbol:
    return LibSymbol(
        f"Connector_Generic:Conn_02x{n:02d}_Odd_Even",
        "J",
        f"Conn_02x{n:02d}",
        f"Connector_PinHeader_2.54mm:PinHeader_2x{n:02d}_P2.54mm_Vertical",
        tuple(LibPin(str(i), f"Pin_{i}") for i in range(1, 2 * n + 1)),
    )


LIB = {
    "Conn_01x02": conn_1xn(2),
    "Conn_01x04": conn_1xn(4),
    "Conn_02x10": conn_2xn(10),
    "Conn_02x12": conn_2xn(12),
    "R": LibSymbol(
        "Device:R", "R", "R", "Resistor_SMD:R_0603_1608Metric",
        (LibPin("1", "~"), LibPin("2", "~")),
    ),
    "SolderJumper": LibSymbol(
        "Jumper:SolderJumper_2_Open", "JP", "SolderJumper_2_Open",
        "Jumper:SolderJumper-2_P1.3mm_Open_Pad1.0x1.5mm",
        (LibPin("1", "A"), LibPin("2", "B")),
    ),
    # Custom libraries: the nickname deliberately does not start with
    # "Connector", so detection must come from the field or the refdes.
    "TestPad": LibSymbol(
        "MiniSys:TestPad", "TP", "TestPad", "MiniSys:TestPad_1.5mm",
        (LibPin("1", "TP"),),
    ),
    "Split2x2": LibSymbol(
        "MiniSys:Conn_Split_2x2", "J", "Conn_Split_2x2", "MiniSys:Conn_Split_2x2",
        (
            LibPin("1", "A1", 1), LibPin("2", "A2", 1),
            LibPin("3", "B1", 2), LibPin("4", "B2", 2),
        ),
    ),
}


def lib_symbol_sexpr(sym: LibSymbol) -> str:
    name = sym.lib_id.split(":", 1)[1]
    lines = [
        f"(symbol {q(sym.lib_id)}",
        "(pin_names (offset 1.016))",
        "(exclude_from_sim no)",
        "(in_bom yes)",
        "(on_board yes)",
        f'(property "Reference" {q(sym.reference_prefix)} (at 0 3.81 0) (effects (font (size 1.27 1.27))))',
        f'(property "Value" {q(sym.value)} (at 0 -3.81 0) (effects (font (size 1.27 1.27))))',
        f'(property "Footprint" {q(sym.footprint)} (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))',
        '(property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))',
        f'(property "Description" {q(sym.value)} (at 0 0 0) (effects (font (size 1.27 1.27)) (hide yes)))',
    ]
    for unit in range(1, sym.units + 1):
        pins = sym.unit_pins(unit)
        height = max(len(pins), 1) * PITCH
        lines.append(f"(symbol {q(f'{name}_{unit}_1')}")
        lines.append(
            f"(rectangle (start -2.54 1.27) (end 2.54 {1.27 - height:.2f}) "
            "(stroke (width 0.254) (type default)) (fill (type background)))"
        )
        for pin in pins:
            x, y = sym.pin_offset(pin.number)
            lines.append(
                f"(pin passive line (at {x:g} {y:g} 0) (length 2.54) "
                f"(name {q(pin.name)} (effects (font (size 1.27 1.27)))) "
                f"(number {q(pin.number)} (effects (font (size 1.27 1.27)))))"
            )
        lines.append(")")
    lines.append("(embedded_fonts no)")
    lines.append(")")
    return "\n".join(lines)


# --------------------------------------------------------------------------
# Design model.

# A pin binding: ("local", name) | ("global", name) | ("nc",) | None (floating).
Binding = tuple


@dataclass
class Symbol:
    key: str  # stable identity label; drives the UUID
    lib: str
    at: tuple[float, float]
    unit: int = 1
    pins: dict[str, Binding] = field(default_factory=dict)
    fields: dict[str, str] = field(default_factory=dict)
    dnp: bool = False
    # reference per sheet-instance key ("" = root). One entry per instance.
    refs: dict[str, str] = field(default_factory=dict)


@dataclass
class SheetFile:
    filename: str
    symbols: list[Symbol] = field(default_factory=list)


@dataclass
class SheetInstance:
    key: str  # stable identity of the sheet symbol
    name: str  # Sheetname property; changing it renames local nets
    filename: str
    page: str
    at: tuple[float, float]


@dataclass
class Board:
    name: str
    root: SheetFile
    sheets: dict[str, SheetFile] = field(default_factory=dict)  # by filename
    instances: list[SheetInstance] = field(default_factory=list)
    has_pcb: bool = True
    # Board-level overrides of footprint pad nets, used by the "PCB not
    # updated" step: {(reference, pad): net or None}.
    pcb_net_overrides: dict[tuple[str, str], str | None] = field(default_factory=dict)
    readme: str = ""


def root_uuid(board: Board) -> str:
    return uid(board.name, "root")


def instance_path(board: Board, inst: SheetInstance | None) -> str:
    base = f"/{root_uuid(board)}"
    return base if inst is None else f"{base}/{uid(board.name, 'sheet', inst.key)}"


def symbol_uuid(board: Board, sym: Symbol) -> str:
    return uid(board.name, "sym", sym.key)


def sheet_owner_instances(board: Board, filename: str) -> list[SheetInstance | None]:
    if filename == board.root.filename:
        return [None]
    return [inst for inst in board.instances if inst.filename == filename]


def label_sexpr(board: Board, sym: Symbol, number: str, binding: Binding) -> str:
    lib = LIB[sym.lib]
    px, py = lib.pin_offset(number)
    x, y = round(sym.at[0] + px, 2), round(sym.at[1] - py, 2)
    key = uid(board.name, "net", sym.key, number)
    if binding[0] == "nc":
        return f"(no_connect (at {x:g} {y:g}) (uuid {q(key)}))"
    if binding[0] == "local":
        return (
            f"(label {q(binding[1])} (at {x:g} {y:g} 180) "
            "(effects (font (size 1.27 1.27)) (justify right bottom)) "
            f"(uuid {q(key)}))"
        )
    return (
        f"(global_label {q(binding[1])} (shape passive) (at {x:g} {y:g} 180) "
        "(effects (font (size 1.27 1.27)) (justify right)) "
        f"(uuid {q(key)}) "
        '(property "Intersheetrefs" "${INTERSHEET_REFS}" (at 0 0 0) '
        "(effects (font (size 1.27 1.27)) (hide yes))))"
    )


def symbol_sexpr(board: Board, sheet: SheetFile, sym: Symbol) -> str:
    lib = LIB[sym.lib]
    sym_uuid = symbol_uuid(board, sym)
    owners = sheet_owner_instances(board, sheet.filename)
    first_ref = sym.refs[owners[0].key if owners[0] else ""]
    x, y = sym.at
    props = [
        ("Reference", first_ref, False),
        ("Value", lib.value, False),
        ("Footprint", lib.footprint, True),
        ("Datasheet", "", True),
        ("Description", "", True),
        *[(k, v, True) for k, v in sym.fields.items()],
    ]
    lines = [
        "(symbol",
        f"(lib_id {q(lib.lib_id)})",
        f"(at {x:g} {y:g} 0)",
        f"(unit {sym.unit})",
        "(exclude_from_sim no)",
        "(in_bom yes)",
        "(on_board yes)",
        "(in_pos_files yes)",
        f"(dnp {'yes' if sym.dnp else 'no'})",
        f"(uuid {q(sym_uuid)})",
    ]
    for i, (name, value, hidden) in enumerate(props):
        hide = " (hide yes)" if hidden else ""
        lines.append(
            f"(property {q(name)} {q(value)} (at {x + 3.81:g} {y + 1.27 * i:g} 0) "
            f"(effects (font (size 1.27 1.27)){hide}))"
        )
    # KiCad lists every library pin on every unit; omitted ones get random UUIDs.
    for pin in lib.pins:
        lines.append(f"(pin {q(pin.number)} (uuid {q(uid(board.name, 'pin', sym.key, pin.number))}))")
    lines.append("(instances")
    lines.append(f"(project {q(board.name)}")
    for owner in owners:
        ref = sym.refs[owner.key if owner else ""]
        lines.append(f"(path {q(instance_path(board, owner))} (reference {q(ref)}) (unit {sym.unit}))")
    lines.append(")")
    lines.append(")")
    lines.append(")")
    return "\n".join(lines)


def sheet_symbol_sexpr(board: Board, inst: SheetInstance) -> str:
    x, y = inst.at
    return "\n".join(
        [
            "(sheet",
            f"(at {x:g} {y:g})",
            "(size 25.4 12.7)",
            "(exclude_from_sim no)",
            "(in_bom yes)",
            "(on_board yes)",
            "(dnp no)",
            "(stroke (width 0.1524) (type solid))",
            "(fill (color 0 0 0 0.0000))",
            f"(uuid {q(uid(board.name, 'sheet', inst.key))})",
            f'(property "Sheetname" {q(inst.name)} (at {x:g} {y - 0.7:g} 0) (effects (font (size 1.27 1.27)) (justify left bottom)))',
            f'(property "Sheetfile" {q(inst.filename)} (at {x:g} {y + 13.3:g} 0) (effects (font (size 1.27 1.27)) (justify left top)))',
            "(instances",
            f"(project {q(board.name)}",
            f"(path {q(instance_path(board, None))} (page {q(inst.page)}))",
            ")",
            ")",
            ")",
        ]
    )


def schematic_text(board: Board, sheet: SheetFile) -> str:
    is_root = sheet.filename == board.root.filename
    sheet_uuid = root_uuid(board) if is_root else uid(board.name, "file", sheet.filename)
    used = sorted({sym.lib for sym in sheet.symbols}, key=lambda k: LIB[k].lib_id)
    parts = [
        "(kicad_sch",
        f"(version {SCH_VERSION})",
        '(generator "eeschema")',
        '(generator_version "10.0")',
        f"(uuid {q(sheet_uuid)})",
        '(paper "A3")',
        "(lib_symbols",
        *[lib_symbol_sexpr(LIB[k]) for k in used],
        ")",
    ]
    for sym in sheet.symbols:
        for number, binding in sorted(sym.pins.items(), key=lambda kv: kv[0]):
            if binding is not None:
                parts.append(label_sexpr(board, sym, number, binding))
    for sym in sheet.symbols:
        parts.append(symbol_sexpr(board, sheet, sym))
    if is_root:
        for inst in board.instances:
            parts.append(sheet_symbol_sexpr(board, inst))
        parts.append('(sheet_instances (path "/" (page "1")))')
    parts.append("(embedded_fonts no)")
    parts.append(")")
    return "\n".join(parts) + "\n"


def project_text(board: Board) -> str:
    sheets = [[root_uuid(board), "Root"]] + [
        [uid(board.name, "sheet", inst.key), inst.name] for inst in board.instances
    ]
    payload = {
        "board": {"design_settings": {"defaults": {}}, "layer_presets": [], "viewports": []},
        "libraries": {"pinned_footprint_libs": [], "pinned_symbol_libs": []},
        "meta": {"filename": f"{board.name}.kicad_pro", "version": 3},
        "net_settings": {
            "classes": [{
                "name": "Default", "clearance": 0.2, "track_width": 0.2,
                "via_diameter": 0.6, "via_drill": 0.3, "priority": 2147483647,
            }],
            "meta": {"version": 4},
        },
        "pcbnew": {"last_paths": {}, "page_layout_descr_file": ""},
        "schematic": {"legacy_lib_dir": "", "legacy_lib_list": []},
        "sheets": sheets,
        "text_variables": {},
    }
    return json.dumps(payload, indent=2) + "\n"


# --------------------------------------------------------------------------
# Board: one footprint per placed symbol occurrence; pad nets follow the
# schematic unless overridden. Multi-unit symbols contribute one footprint.


def schematic_net(board: Board, inst: SheetInstance | None, binding: Binding) -> str | None:
    if binding is None or binding[0] == "nc":
        return None
    if binding[0] == "global":
        return binding[1]
    return f"/{binding[1]}" if inst is None else f"/{inst.name}/{binding[1]}"


def occurrences(board: Board):
    """Yield (instance, sheet, symbol) for every placed symbol occurrence."""
    for sym in board.root.symbols:
        yield None, board.root, sym
    for inst in board.instances:
        for sym in board.sheets[inst.filename].symbols:
            yield inst, board.sheets[inst.filename], sym


def pcb_text(board: Board) -> str:
    groups: dict[str, dict] = {}
    for inst, sheet, sym in occurrences(board):
        ref = sym.refs[inst.key if inst else ""]
        entry = groups.setdefault(
            ref,
            {"lib": LIB[sym.lib], "inst": inst, "sheet": sheet, "sym": sym, "nets": {}},
        )
        if sym.unit < entry["sym"].unit:
            entry.update(sym=sym, inst=inst, sheet=sheet)
        for number, binding in sym.pins.items():
            entry["nets"][number] = schematic_net(board, inst, binding)

    lines = [
        "(kicad_pcb",
        f"(version {PCB_VERSION})",
        '(generator "pcbnew")',
        '(generator_version "10.0")',
        "(general (thickness 1.6) (legacy_teardrops no))",
        '(paper "A4")',
        "(layers",
        '(0 "F.Cu" signal)', '(2 "B.Cu" signal)',
        '(5 "F.SilkS" user "F.Silkscreen")', '(7 "B.SilkS" user "B.Silkscreen")',
        '(1 "F.Mask" user)', '(3 "B.Mask" user)',
        '(25 "Edge.Cuts" user)', '(35 "F.Fab" user)', '(33 "B.Fab" user)',
        ")",
        "(setup (pad_to_mask_clearance 0))",
    ]
    for index, ref in enumerate(sorted(groups)):
        entry = groups[ref]
        lib, sym, inst = entry["lib"], entry["sym"], entry["inst"]
        fx, fy = 10 + (index % 5) * 20, 10 + (index // 5) * 20
        path = f"{instance_path(board, inst)}/{symbol_uuid(board, sym)}"
        sheetname = "/" if inst is None else f"/{inst.name}/"
        lines += [
            f"(footprint {q(lib.footprint)}",
            '(layer "F.Cu")',
            f"(uuid {q(uid(board.name, 'fp', ref, sym.key))})",
            f"(at {fx:g} {fy:g})",
            f'(property "Reference" {q(ref)} (at 0 -3 0) (layer "F.SilkS") (uuid {q(uid(board.name, "fp-ref", ref))}) (effects (font (size 1 1) (thickness 0.15))))',
            f'(property "Value" {q(lib.value)} (at 0 3 0) (layer "F.Fab") (uuid {q(uid(board.name, "fp-val", ref))}) (effects (font (size 1 1) (thickness 0.15))))',
            *[
                f'(property {q(name)} "" (at 0 0 0) (layer "F.Fab") (hide yes) (uuid {q(uid(board.name, "fp-" + name, ref))}) (effects (font (size 1 1) (thickness 0.15))))'
                for name in ("Datasheet", "Description")
            ],
            f"(path {q(path)})",
            f"(sheetname {q(sheetname)})",
            f"(sheetfile {q(entry['sheet'].filename)})",
            "(attr through_hole)",
        ]
        for i, pin in enumerate(lib.pins):
            net = entry["nets"].get(pin.number)
            if (ref, pin.number) in board.pcb_net_overrides:
                net = board.pcb_net_overrides[(ref, pin.number)]
            net_expr = f" (net {q(net)})" if net else ""
            lines.append(
                f'(pad {q(pin.number)} thru_hole circle (at 0 {i * PITCH:g}) (size 1.7 1.7) (drill 1) '
                f'(layers "*.Cu" "*.Mask"){net_expr} (uuid {q(uid(board.name, "pad", ref, sym.key, pin.number))}))'
            )
        lines += ["(embedded_fonts no)", ")"]
    lines += ["(embedded_fonts no)", ")"]
    return "\n".join(lines) + "\n"


# --------------------------------------------------------------------------
# The three boards at baseline (F0).


def mini_obc() -> Board:
    j7_pins: dict[str, Binding] = {
        "1": ("global", "GND"), "2": ("global", "GND"),
        "3": ("local", "SPI_SCK"), "4": ("local", "SPI_MOSI"),
        "5": ("local", "SPI_MISO"), "6": ("local", "SPI_CS#"),
        "7": ("global", "+3V3"), "8": ("global", "+3V3"),
        **{str(9 + i): ("local", f"GPIO{i}") for i in range(8)},
        "17": ("global", "PAYLOAD_RESET#"),
        "18": ("global", "PAYLOAD_IRQ#"),
        "19": ("local", "SPARE19"),
        "20": ("nc",),
    }
    payload_if = SheetFile(
        "payload_if.kicad_sch",
        [
            Symbol("J7", "Conn_02x10", (60, 40), pins=j7_pins, refs={"payload_if": "J7"}),
            Symbol(
                "R10", "R", (100, 40),
                pins={"1": ("global", "PAYLOAD_RESET#"), "2": ("global", "+3V3")},
                refs={"payload_if": "R10"},
            ),
        ],
    )
    root = SheetFile(
        "mini_obc.kicad_sch",
        [
            Symbol(
                "J2", "Conn_01x04", (40, 40),
                pins={"1": ("global", "VIN_28V"), "2": ("global", "GND"),
                      "3": ("local", "PWR_GOOD"), "4": ("local", "PWR_EN")},
                refs={"": "J2"},
            ),
            Symbol(
                "J5", "Conn_01x04", (40, 80),
                pins={"1": ("global", "VIN_28V"), "2": ("global", "GND"),
                      "3": ("local", "AUX_A"), "4": ("local", "AUX_B")},
                refs={"": "J5"},
            ),
            Symbol(
                "J6", "Conn_01x04", (40, 120),
                pins={"1": ("global", "VIN_28V"), "2": ("global", "GND"),
                      "3": ("local", "PWR_GOOD"), "4": ("local", "AUX_C")},
                refs={"": "J6"},
            ),
            Symbol(
                "JP1", "SolderJumper", (100, 80),
                pins={"1": ("local", "PWR_EN"), "2": ("global", "GND")},
                refs={"": "JP1"},
            ),
        ],
    )
    return Board(
        "mini_obc",
        root,
        sheets={"payload_if.kicad_sch": payload_if},
        instances=[SheetInstance("payload_if", "Payload IF", "payload_if.kicad_sch", "2", (150, 40))],
        readme="# mini_obc\n\nSystem Builder fixture board (on-board computer side).\n",
    )


def mini_payload() -> Board:
    j4_pins: dict[str, Binding] = {
        "1": ("global", "GND"), "2": ("global", "GND"),
        "3": ("local", "SCK_IN"), "4": ("local", "MOSI_IN"),
        "5": ("local", "MISO_OUT"), "6": ("local", "CS_IN#"),
        "7": ("global", "+3V3_OBC"), "8": ("global", "+3V3_OBC"),
        **{str(9 + i): ("local", f"IO{i}") for i in range(8)},
        "17": ("local", "RST_IN#"),
        "18": ("local", "IRQ_OUT#"),
        "19": ("nc",), "20": ("nc",),
    }
    channel = SheetFile(
        "channel.kicad_sch",
        [
            Symbol(
                "JCH", "Conn_01x02", (60, 40),
                pins={"1": ("local", "CH_PWR"), "2": ("global", "GND")},
                refs={"ch_a": "J11", "ch_b": "J12"},
            ),
        ],
    )
    root = SheetFile(
        "mini_payload.kicad_sch",
        [
            Symbol("J4", "Conn_02x10", (40, 40), pins=j4_pins, refs={"": "J4"}),
            Symbol(
                "TP1", "TestPad", (100, 40),
                pins={"1": ("local", "RST_IN#")},
                fields={"Prism_Port": "yes"}, refs={"": "TP1"},
            ),
            Symbol(
                "J9", "Conn_01x02", (100, 80),
                pins={"1": ("local", "PROG_TX"), "2": ("local", "PROG_RX")},
                fields={"Prism_Port": "no"}, refs={"": "J9"},
            ),
        ],
    )
    return Board(
        "mini_payload",
        root,
        sheets={"channel.kicad_sch": channel},
        instances=[
            SheetInstance("ch_a", "CH_A", "channel.kicad_sch", "2", (150, 40)),
            SheetInstance("ch_b", "CH_B", "channel.kicad_sch", "3", (150, 80)),
        ],
        has_pcb=False,
        readme="# mini_payload\n\nSystem Builder fixture board (payload side, schematic only).\n",
    )


def mini_power() -> Board:
    root = SheetFile(
        "mini_power.kicad_sch",
        [
            Symbol(
                "J1", "Conn_01x04", (40, 40),
                pins={"1": ("global", "VOUT_28V"), "2": ("global", "GND"),
                      "3": ("local", "PG_OUT"), "4": ("local", "EN_IN")},
                refs={"": "J1"},
            ),
            Symbol(
                "J3A", "Split2x2", (40, 80), unit=1,
                pins={"1": ("local", "AUX1"), "2": ("local", "AUX2")},
                refs={"": "J3"},
            ),
            Symbol(
                "J3B", "Split2x2", (40, 110), unit=2,
                pins={"3": ("local", "PAY_PWR"), "4": ("global", "GND")},
                refs={"": "J3"},
            ),
            Symbol(
                "J8", "Conn_01x02", (100, 40),
                pins={"1": ("local", "DEBUG_TX"), "2": ("global", "GND")},
                dnp=True, refs={"": "J8"},
            ),
        ],
    )
    return Board(
        "mini_power",
        root,
        readme="# mini_power\n\nSystem Builder fixture board (power side).\n",
    )


# --------------------------------------------------------------------------
# Steps. Each is F0 plus the change named in CONTRACTS.md §11. F11 is two
# commits. Every step except F8 keeps the board synchronized.


def find(board: Board, key: str) -> Symbol:
    for sheet in [board.root, *board.sheets.values()]:
        for sym in sheet.symbols:
            if sym.key == key:
                return sym
    raise KeyError(key)


def remove(board: Board, key: str) -> None:
    for sheet in [board.root, *board.sheets.values()]:
        sheet.symbols = [sym for sym in sheet.symbols if sym.key != key]


def step_f1(b: Board) -> None:
    find(b, "J7").pins["17"] = ("nc",)


def step_f2(b: Board) -> None:
    find(b, "J2").refs[""] = "J12"


def step_f3(b: Board) -> None:
    j7 = find(b, "J7")
    j7.key = "J7#replaced"


def step_f4(b: Board) -> None:
    j7 = find(b, "J7")
    j7.lib = "Conn_02x12"
    j7.pins.update({"21": ("nc",), "22": ("nc",), "23": ("nc",), "24": ("nc",)})


def step_f5(b: Board) -> None:
    b.instances[0].name = "Payload Interface"


def step_f6(b: Board) -> None:
    b.readme += "\nRevision notes: documentation only.\n"


def step_f7(b: Board) -> None:
    find(b, "J7").pins["19"] = ("local", "SPARE19_B")


def step_f8(b: Board) -> None:
    find(b, "J7").pins["18"] = ("global", "PAYLOAD_INT#")
    b.pcb_net_overrides[("J7", "18")] = "PAYLOAD_IRQ#"


def step_f9(b: Board) -> None:
    remove(b, "J2")


def step_f10(b: Board) -> None:
    remove(b, "J3A")


def step_f11_second(b: Board) -> None:
    find(b, "J7").pins["3"] = ("local", "SPI_CLK")


# (board factory, step id, [commit transforms applied cumulatively on F0])
STEPS: list[tuple[str, str, list]] = [
    ("mini_obc", "F0", []),
    ("mini_obc", "F1", [step_f1]),
    ("mini_obc", "F2", [step_f2]),
    ("mini_obc", "F3", [step_f3]),
    ("mini_obc", "F4", [step_f4]),
    ("mini_obc", "F5", [step_f5]),
    ("mini_obc", "F6", [step_f6]),
    ("mini_obc", "F7", [step_f7]),
    ("mini_obc", "F8", [step_f8]),
    ("mini_obc", "F9", [step_f9]),
    ("mini_obc", "F11", [step_f1, step_f11_second]),
    ("mini_payload", "F0", []),
    ("mini_power", "F0", []),
    ("mini_power", "F10", [step_f10]),
]

FACTORIES = {"mini_obc": mini_obc, "mini_payload": mini_payload, "mini_power": mini_power}


def write_board(board: Board, directory: Path) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    (directory / f"{board.name}.kicad_pro").write_text(project_text(board))
    (directory / board.root.filename).write_text(schematic_text(board, board.root))
    for sheet in board.sheets.values():
        (directory / sheet.filename).write_text(schematic_text(board, sheet))
    if board.has_pcb:
        (directory / f"{board.name}.kicad_pcb").write_text(pcb_text(board))
    (directory / "README.md").write_text(board.readme)


# --------------------------------------------------------------------------
# The fixture system (§11): four instances and five links at F0. Identity is
# taken from the model; row net baselines are read from KiCad's own netlist
# evidence at F0 and normalized per CONTRACTS.md §3.

INSTANCES = {
    "OBC-A": {"board": "mini_obc", "baseline": "F0", "trackedRef": "main", "pinned": False},
    "OBC-B": {"board": "mini_obc", "baseline": "F0", "trackedRef": "main", "pinned": True},
    "PAY": {"board": "mini_payload", "baseline": "F0", "trackedRef": "main", "pinned": False},
    "PWR": {"board": "mini_power", "baseline": "F0", "trackedRef": "main", "pinned": False},
}

# (link id, harness, (instance, reference), (instance, reference), [(pinA, pinB, signal)])
LINKS = [
    ("L-J7J4", None, ("OBC-A", "J7"), ("PAY", "J4"), [
        ("1", "1", "GND"), ("2", "2", "GND"),
        ("3", "3", "SPI_SCK"), ("4", "4", "SPI_MOSI"), ("5", "5", "SPI_MISO"), ("6", "6", "SPI_CS#"),
        ("7", "7", "+3V3"), ("8", "8", "+3V3"),
        *[(str(9 + i), str(9 + i), f"GPIO{i}") for i in range(8)],
        ("17", "17", "PAYLOAD_RESET"), ("18", "18", "PAYLOAD_IRQ"),
    ]),
    ("L-J2J1", None, ("OBC-A", "J2"), ("PWR", "J1"), [
        ("1", "1", "VIN_28V"), ("2", "2", "GND"), ("3", "3", "PWR_GOOD"), ("4", "4", "PWR_EN"),
    ]),
    ("L-J3J11", "WH-001", ("PWR", "J3"), ("PAY", "J11"), [("3", "1", "PAY_PWR"), ("4", "2", "GND")]),
    ("L-J3J12", "WH-001", ("PWR", "J3"), ("PAY", "J12"), [("3", "1", "PAY_PWR")]),
    ("L-OBCB-TP1", None, ("OBC-B", "J7"), ("PAY", "TP1"), [("17", "1", "PAYLOAD_RESET")]),
]


def port_baseline(board: Board, reference: str) -> dict:
    units = []
    for inst, _sheet, sym in occurrences(board):
        if sym.refs[inst.key if inst else ""] == reference:
            key = f"{instance_path(board, inst)}/{symbol_uuid(board, sym)}"
            units.append((sym.unit, key, sym))
    units.sort()
    lib = LIB[units[0][2].lib]
    return {
        "reference": reference,
        "portKey": units[0][1],
        "memberKeys": sorted(key for _unit, key, _sym in units),
        "libId": lib.lib_id,
        "footprint": lib.footprint,
        "pinCount": len({pin.number for pin in lib.pins}),
    }


def netlist_nets(path: Path) -> dict[tuple[str, str], list[str]]:
    import xml.etree.ElementTree as ET

    result: dict[tuple[str, str], list[str]] = {}
    for net in ET.parse(path).getroot().iter("net"):
        name = net.get("name") or ""
        for node in net.iter("node"):
            nets = [] if name.startswith("unconnected-(") else [name]
            result[(node.get("ref"), node.get("pin"))] = nets
    return result


def fixture_system() -> dict:
    boards = {name: factory() for name, factory in FACTORIES.items()}
    links = []
    for link_id, harness, a, b, rows in LINKS:
        ends = {}
        nets = {}
        for side, (instance, reference) in (("a", a), ("b", b)):
            board = boards[INSTANCES[instance]["board"]]
            ends[side] = {"instance": instance, **port_baseline(board, reference)}
            nets[side] = (reference, netlist_nets(EVIDENCE / board.name / "F0" / "netlist.xml"))
        links.append({
            "id": link_id,
            "harness": harness,
            "a": ends["a"],
            "b": ends["b"],
            "rows": [
                {
                    "pinA": pin_a,
                    "pinB": pin_b,
                    "signal": signal,
                    "netA": nets["a"][1][(nets["a"][0], pin_a)],
                    "netB": nets["b"][1][(nets["b"][0], pin_b)],
                }
                for pin_a, pin_b, signal in rows
            ],
        })
    return {"schema": "prism.system_fixture_a0", "instances": INSTANCES, "links": links}


# --------------------------------------------------------------------------
# kicad-cli.


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(cli: str, argv: list[str], cwd: Path) -> dict:
    result = subprocess.run([cli, *argv], cwd=cwd, capture_output=True, text=True)
    stderr = "\n".join(
        line for line in result.stderr.splitlines() if "Fontconfig" not in line
    ).strip()
    return {"argv": ["kicad-cli", *argv], "exitCode": result.returncode, "stderr": stderr}


def normalize_netlist(text: str) -> str:
    text = re.sub(r"<source>[^<]*</source>", "<source>(normalized)</source>", text)
    text = re.sub(r"<date>[^<]*</date>", "<date>(normalized)</date>", text)
    return re.sub(r'<tool>[^<]*</tool>', "<tool>(normalized)</tool>", text)


def main() -> int:
    cli = os.environ.get("KICAD_CLI", "/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli")
    version = subprocess.run([cli, "version"], capture_output=True, text=True).stdout.strip()
    if version != "10.0.6":
        print(f"expected kicad-cli 10.0.6, found {version!r}", file=sys.stderr)
        return 2

    shutil.rmtree(SOURCES, ignore_errors=True)
    shutil.rmtree(EVIDENCE, ignore_errors=True)
    manifest: dict = {
        "schema": "prism.system_fixture_manifest_a0",
        "generatedAt": datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat(),
        "kicad": {"version": version, "executable": cli},
        "contract": {"document": "docs/system-builder/CONTRACTS.md", "version": "1.0"},
        "snapshots": {},
    }
    failures = 0
    for board_name, step, transforms in STEPS:
        board = FACTORIES[board_name]()
        # A single-commit step writes one snapshot named after the step; a
        # multi-commit step (F11) writes one snapshot per commit, F11.1, F11.2.
        snapshots: list[tuple[str, Board]] = []
        for transform in transforms:
            transform(board)
            if len(transforms) > 1:
                snapshots.append((f"{step}.{len(snapshots) + 1}", copy.deepcopy(board)))
        if len(transforms) <= 1:
            snapshots.append((step, board))
        for name, snapshot in snapshots:
            snapshot_id = f"{board_name}/{name}"
            directory = SOURCES / board_name / name
            write_board(snapshot, directory)
            commands = []
            for sch in sorted(directory.glob("*.kicad_sch")):
                commands.append(run(cli, ["sch", "upgrade", "--force", sch.name], directory))
            for pcb in sorted(directory.glob("*.kicad_pcb")):
                commands.append(run(cli, ["pcb", "upgrade", "--force", pcb.name], directory))
            evidence_dir = EVIDENCE / board_name / name
            evidence_dir.mkdir(parents=True, exist_ok=True)
            with tempfile.TemporaryDirectory() as scratch:
                out = Path(scratch) / "netlist.xml"
                cmd = run(
                    cli,
                    ["sch", "export", "netlist", "--format", "kicadxml", "-o", str(out),
                     f"{snapshot.name}.kicad_sch"],
                    directory,
                )
                cmd["argv"][-2] = f"evidence/{snapshot_id}/netlist.xml"
                commands.append(cmd)
                if out.exists():
                    (evidence_dir / "netlist.xml").write_text(normalize_netlist(out.read_text()))
            # Upgrade leaves backups and kicad-cli writes per-user .kicad_prl
            # settings; neither is part of the design.
            for scratch_file in [*directory.glob("*-bak*"), *directory.glob("*.kicad_prl")]:
                scratch_file.unlink()
            failures += sum(1 for c in commands if c["exitCode"] != 0)
            manifest["snapshots"][snapshot_id] = {
                "files": {
                    str(p.relative_to(ROOT)): sha256(p)
                    for p in sorted([*directory.rglob("*"), *evidence_dir.rglob("*")])
                    if p.is_file()
                },
                "commands": commands,
            }
    (ROOT / "system.json").write_text(json.dumps(fixture_system(), indent=1) + "\n")
    manifest["system"] = sha256(ROOT / "system.json")
    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=1, sort_keys=True) + "\n")
    print(f"{len(manifest['snapshots'])} snapshots, {failures} failing commands")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())

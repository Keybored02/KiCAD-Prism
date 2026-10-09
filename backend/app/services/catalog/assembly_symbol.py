"""The multi-unit KiCad symbol a published assembly carries (CONTRACTS_P2 §3.3, D-P2-41, SB2-51b).

Publishing a system snapshot generates it from the export interface, so assemblies
and modules look alike in the catalog and in KiCad: one unit per export (named
after it), one pin per pad, numbered by the pad and named by its net (the net's
last path segment; ``~`` when unconnected). Power nets are ``power_in`` pins,
every other pin is ``passive``.
"""

from __future__ import annotations

import re
from typing import Any, Mapping

LIBRARY = "Prism_Assemblies"
PIN_PITCH = 2.54
BODY_HALF_WIDTH = 7.62
PIN_LENGTH = 2.54


def _quote(text: str) -> str:
    return '"' + text.replace("\\", "\\\\").replace('"', '\\"') + '"'


def _natural(pad: str) -> tuple:
    head = pad.rstrip("0123456789")
    tail = pad[len(head):]
    return (head, int(tail) if tail else -1, pad)


def symbol_name(identity: str) -> str:
    """A KiCad-safe symbol name from the assembly's identity (its IPN)."""
    name = re.sub(r"[^A-Za-z0-9_.+-]+", "_", identity.strip()).strip("_")
    return name or "ASSEMBLY"


def _pin_name(pin: Mapping[str, Any]) -> str:
    nets = [str(n) for n in pin.get("nets") or [] if n]
    if not nets:
        return "~"
    return nets[0].rstrip("/").rsplit("/", 1)[-1] or nets[0]


def _unit(name: str, index: int, entry: Mapping[str, Any]) -> str:
    pins = sorted(entry.get("pins") or [], key=lambda p: _natural(str(p["pad"])))
    height = max(len(pins), 1) * PIN_PITCH
    body = [f'(rectangle (start {-BODY_HALF_WIDTH} {PIN_PITCH}) (end {BODY_HALF_WIDTH} {-height:.2f}) '
            '(stroke (width 0.254) (type default)) (fill (type background)))']
    for row, pin in enumerate(pins):
        kind = "power_in" if pin.get("powerNet") else "passive"
        y = -row * PIN_PITCH
        body.append(f'(pin {kind} line (at {-(BODY_HALF_WIDTH + PIN_LENGTH)} {y:.2f} 0) (length {PIN_LENGTH}) '
                    f'(name {_quote(_pin_name(pin))} (effects (font (size 1.27 1.27)))) '
                    f'(number {_quote(str(pin["pad"]))} (effects (font (size 1.27 1.27)))))')
    label = str(entry.get("name") or entry.get("id") or f"Export {index}")
    return (f'    (symbol {_quote(f"{name}_{index}_1")} (unit_name {_quote(label)})\n      '
            + "\n      ".join(body) + "\n    )")


def symbol_library(name: str, interface: Mapping[str, Any], *, description: str = "") -> str:
    """A ``.kicad_sym`` library holding the assembly's symbol, one unit per resolved export."""
    exports = [e for e in interface.get("exports") or [] if e.get("resolved", True)]
    if not exports:
        raise ValueError("an assembly symbol needs at least one export")
    units = "\n".join(_unit(name, index, entry) for index, entry in enumerate(exports, start=1))
    return f'''(kicad_symbol_lib (version 20241209) (generator "prism_system_builder")
  (symbol {_quote(name)} (in_bom yes) (on_board no)
    (property "Reference" "A" (at 0 {PIN_PITCH * 2} 0) (effects (font (size 1.27 1.27))))
    (property "Value" {_quote(name)} (at 0 {PIN_PITCH} 0) (effects (font (size 1.27 1.27))))
    (property "Footprint" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
    (property "Datasheet" "" (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
    (property "Description" {_quote(description or f"System Builder assembly {name}")} (at 0 0 0) (effects (font (size 1.27 1.27)) hide))
{units}
  )
)
'''


__all__ = ["LIBRARY", "symbol_library", "symbol_name"]

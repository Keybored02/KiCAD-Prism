"""A module's interface, derived from its multi-unit KiCad symbol (CONTRACTS_P2 §3.5, D-P2-39).

A ``module`` is drawn by an ordinary catalog symbol whose **units are its connectors**. Every
revision stores the interface derived from that symbol as ``prism.module_interface.v1``::

    {"schema": "prism.module_interface.v1",
     "units": [{"key": "A", "unit": 1, "name": "J1",
                "pins": [{"pad": "1", "name": "VIN", "signal": "VIN", "powerNet": true}, …]}]}

- ``key`` is the unit's letter (A for unit 1, B for unit 2, … as KiCad names them); it names the
  connector for ports and links. ``name`` is the unit's name in the symbol, else ``Unit A``.
- A pin's number is its pad; its **name is its signal label** (its net in system nets, SB2-50;
  empty for KiCad's ``~``); ``power_in``/``power_out`` pins are power nets.
- Pins common to all units (unit 0) have no connector and are refused, as are repeated pad numbers.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Optional

SCHEMA = "prism.module_interface.v1"
MAX_UNITS = 32
POWER_TYPES = frozenset({"power_in", "power_out"})


def unit_key(unit: int) -> str:
    """KiCad's unit letters: A … Z, then AA, AB, …"""
    letters = ""
    while unit > 0:
        unit, rest = divmod(unit - 1, 26)
        letters = chr(ord("A") + rest) + letters
    return letters


def _pad_key(pad: str) -> tuple:
    """Natural order for pads ("2" before "10")."""
    return tuple((0, int(part), "") if part.isdigit() else (1, 0, part) for part in re.findall(r"\d+|\D+", pad))


def from_symbol(symbol: Any) -> dict:
    """The interface of a ``kicad_monkey`` library symbol, or ValueError naming what is wrong."""
    count = int(symbol.unit_count or 1)
    if count > MAX_UNITS:
        raise ValueError(f"a module has at most {MAX_UNITS} connectors (units)")
    pins: dict[int, list[dict]] = {u: [] for u in range(1, count + 1)}
    names: dict[int, str] = {}
    seen: set[str] = set()
    for sub in symbol.subsymbols:
        unit = int(sub.unit or 0)
        if getattr(sub, "unit_name", None):
            names[unit] = str(sub.unit_name)
        if int(getattr(sub, "style", 1) or 1) == 2:
            continue  # the alternate (De Morgan) body style repeats the same pins
        for pin in sub.pins:
            pad = str(pin.number or "").strip()
            if not pad:
                continue
            if unit == 0:
                raise ValueError(f"pin {pad} is common to all units; every module pin belongs to one connector")
            if pad in seen:
                raise ValueError(f"pad {pad} appears twice")
            seen.add(pad)
            name = str(pin.name or "").strip()
            name = "" if name == "~" else name
            kind = getattr(pin.electrical_type, "value", pin.electrical_type)
            pins.setdefault(unit, []).append({"pad": pad, "name": name, "signal": name,
                                              "powerNet": str(kind or "") in POWER_TYPES})
    units = []
    for unit in sorted(pins):
        if not pins[unit]:
            continue
        units.append({"key": unit_key(unit), "unit": unit, "name": names.get(unit) or f"Unit {unit_key(unit)}",
                      "pins": sorted(pins[unit], key=lambda p: _pad_key(p["pad"]))})
    if not units:
        raise ValueError("the symbol has no pins")
    return {"schema": SCHEMA, "units": units}


def from_symbol_file(path: Path, symbol_name: Optional[str] = None) -> dict:
    """``from_symbol`` for a ``.kicad_sym`` file (``symbol_name``, else its first symbol)."""
    from kicad_monkey.kicad_symbol_lib import KiCadSymbolLib

    library = KiCadSymbolLib.from_file(path)
    names = library.symbol_names()
    if not names:
        raise ValueError("the symbol library is empty")
    symbol = (library.get_symbol(symbol_name) if symbol_name else None) or library.get_symbol(names[0])
    return from_symbol(symbol)


def revision_interface(conn: Any, revision_id: str) -> dict:
    """The interface of a module revision's symbol asset. Without a usable symbol it has no units and
    ``error`` says why, so the release gate can name the problem."""
    row = conn.execute(
        """
        SELECT a.canonical_path, a.target_name FROM revision_assets ra JOIN assets a ON a.id = ra.asset_id
        WHERE ra.revision_id = %s AND ra.asset_type = 'symbol' ORDER BY a.id LIMIT 1
        """,
        (revision_id,),
    ).fetchone()
    path = Path(str(row["canonical_path"])) if row else None
    if path is None or not path.is_file():
        return {"schema": SCHEMA, "units": [], "error": "the module has no symbol"}
    try:
        return from_symbol_file(path, str(row["target_name"] or "") or None)
    except ValueError as error:
        return {"schema": SCHEMA, "units": [], "error": str(error)}
    except Exception:  # unreadable: the release gate refuses it
        return {"schema": SCHEMA, "units": [], "error": "the symbol could not be read"}

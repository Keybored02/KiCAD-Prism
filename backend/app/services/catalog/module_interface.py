"""A module's interface: its connectors and their pins (CONTRACTS_P2 §3.5, SB2-48).

A ``module`` revision's ``interface`` is ``prism.module_interface.v1``::

    {"schema": "prism.module_interface.v1",
     "units": [{"key": "J1", "name": "J1", "description": "Power and serial",
                "pins": [{"pad": "1", "name": "VIN", "signal": "VIN", "powerNet": true}, …]}]}

A unit is one connector on the module. ``key`` names it for ports and links and never changes
between revisions of the same connector; ``signal`` is the pin's signal label, which stands in
for a board net in system nets (SB2-50). ``normalize`` checks and canonicalises one.
"""

from __future__ import annotations

import re
from typing import Any, Mapping

SCHEMA = "prism.module_interface.v1"
MAX_UNITS = 32
MAX_PINS = 1000
_KEY = re.compile(r"[A-Za-z0-9_.\-]{1,40}")


def _pad_key(pad: str) -> tuple:
    """Natural order for pads ("2" before "10")."""
    return tuple((0, int(part), "") if part.isdigit() else (1, 0, part) for part in re.findall(r"\d+|\D+", pad))


def normalize(interface: Any) -> dict:
    """The canonical interface, or ValueError naming what is wrong."""
    if not isinstance(interface, Mapping):
        raise ValueError("interface must be an object")
    units = interface.get("units")
    if not isinstance(units, list) or not units:
        raise ValueError("a module has at least one connector")
    if len(units) > MAX_UNITS:
        raise ValueError(f"a module has at most {MAX_UNITS} connectors")
    out, keys = [], set()
    for unit in units:
        if not isinstance(unit, Mapping):
            raise ValueError("every connector is an object")
        key = str(unit.get("key") or "").strip()
        if not _KEY.fullmatch(key):
            raise ValueError(f"connector key {key!r}: 1–40 letters, digits, '_', '.' or '-'")
        if key in keys:
            raise ValueError(f"connector key {key} appears twice")
        keys.add(key)
        pins = unit.get("pins")
        if not isinstance(pins, list) or not pins:
            raise ValueError(f"connector {key} has no pins")
        if len(pins) > MAX_PINS:
            raise ValueError(f"connector {key} has more than {MAX_PINS} pins")
        pads, clean = set(), []
        for pin in pins:
            if not isinstance(pin, Mapping):
                raise ValueError(f"connector {key}: every pin is an object")
            pad = str(pin.get("pad") or "").strip()
            if not pad or len(pad) > 20:
                raise ValueError(f"connector {key}: every pin needs a pad of at most 20 characters")
            if pad in pads:
                raise ValueError(f"connector {key}: pad {pad} appears twice")
            pads.add(pad)
            name, signal = str(pin.get("name") or "").strip(), str(pin.get("signal") or "").strip()
            if len(name) > 80 or len(signal) > 120:
                raise ValueError(f"connector {key} pad {pad}: name up to 80, signal up to 120 characters")
            clean.append({"pad": pad, "name": name, "signal": signal, "powerNet": bool(pin.get("powerNet"))})
        clean.sort(key=lambda p: _pad_key(p["pad"]))
        name = str(unit.get("name") or "").strip() or key
        out.append({"key": key, "name": name[:80], "description": str(unit.get("description") or "").strip()[:500],
                    "pins": clean})
    return {"schema": SCHEMA, "units": out}

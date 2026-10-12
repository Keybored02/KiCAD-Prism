"""Which field of a KiCad symbol is the manufacturer and which is the manufacturer part number.

Projects spell these many ways. Names are compared ignoring case, best first: when a symbol
carries several, the earliest in the list wins, so an explicit "Manufacturer Part Number" beats a
looser "PartNumber". "Vendor Part Number" is a distributor's number and is deliberately absent.

The BOM table in the frontend keeps the same two lists (``bom-supply.ts``) until it reads them
from here. A test compares the two so they cannot drift apart.
"""

from __future__ import annotations

from typing import Any, Mapping

MANUFACTURER_FIELDS: tuple[str, ...] = (
    "manufacturer", "manufacturer name", "manufacturer_name", "mfr", "mfr.", "mfg", "mnf", "mnf.", "make", "brand",
)
MPN_FIELDS: tuple[str, ...] = (
    "manufacturer part number", "manufacturer_part_number", "mpn", "mfr. no.", "mfr no", "mfr part number",
    "mfg part number", "manufacturer pn", "mfr pn", "mnf part number", "partnumber", "part number", "part_number",
)


def _text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def _first(fields: Mapping[str, Any], names: tuple[str, ...]) -> str:
    by_name: dict[str, str] = {}
    for key, raw in fields.items():
        text = _text(raw)
        name = str(key).strip().lower()
        if text and name not in by_name:
            by_name[name] = text
    for name in names:
        if name in by_name:
            return by_name[name]
    return ""


PRISM_ID_FIELD = "prism id"


def prism_id_of(fields: Mapping[str, Any]) -> str:
    """The catalog component id placed on the symbol, empty when it has none."""

    return _first(fields, (PRISM_ID_FIELD,))


def identity_of(fields: Mapping[str, Any]) -> tuple[str, str]:
    """(manufacturer, part number) of a symbol, each empty when it has none."""

    return _first(fields, MANUFACTURER_FIELDS), _first(fields, MPN_FIELDS)


def is_fitted(fields: Mapping[str, Any]) -> bool:
    """In the BOM and not marked do-not-place, as the BOM table decides it."""

    in_bom = _text(fields.get("In BOM")).lower()
    dnp = _text(fields.get("DNP")).lower()
    return in_bom != "no" and dnp != "yes"

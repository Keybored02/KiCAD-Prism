"""What Prism could add to a project's BOM lines, as suggestions.

Only facts about what a part is, never stock, price or lifecycle (they change daily; the same reason they stay out of
component revisions). Nothing here changes a project: a person applies a suggestion in KiCad, or by linking the symbol to
its library component, and the next read of the BOM no longer shows it.

* ``manufacturer``: a line with a part number and no manufacturer, when the part number belongs to one manufacturer.
* ``lcsc_part``: a line with only an LCSC number, when a listing at LCSC already says what it is.
* ``datasheet``: the symbol has no datasheet address and a distributor gave one for the part.
* ``prism_id``: the symbol is not linked to the library component that has the same manufacturer and part number.
"""

from __future__ import annotations

from typing import Any, Callable, Mapping, Sequence

from app.services.supply import bom_lookup
from app.services.supply.identity import alias_key, match_key

KINDS = ("manufacturer", "lcsc_part", "datasheet", "prism_id")
LABELS = {
    "manufacturer": "Manufacturer", "lcsc_part": "Manufacturer and part number", "datasheet": "Datasheet", "prism_id": "Prism ID",
}


def _item(kind: str, row: Mapping[str, Any], current: str, suggested: str, reason: str) -> dict[str, Any]:
    return {
        "kind": kind, "label": LABELS[kind], "line_key": row["key"], "references": row["references"], "manufacturer": row["manufacturer"],
        "mpn": row["mpn"], "current": current, "suggested": suggested, "reason": reason,
    }


def _one_manufacturer(conn, numbers: Sequence[str]) -> dict[str, str]:
    """The manufacturer name per part number that only one manufacturer has."""

    if not numbers:
        return {}
    rows = conn.execute(
        "SELECT p.match_key, m.name FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id WHERE p.match_key = ANY(%s)", (list(numbers),)
    ).fetchall()
    names: dict[str, set[str]] = {}
    for row in rows:
        names.setdefault(row["match_key"], set()).add(row["name"])
    return {number: next(iter(found)) for number, found in names.items() if len(found) == 1}


def _lcsc_listings(conn, numbers: Sequence[str]) -> dict[str, tuple[str, str]]:
    """(manufacturer, part number) per LCSC number that an LCSC listing already names."""

    if not numbers:
        return {}
    rows = conn.execute(
        """
        SELECT l.sku, COALESCE(m.name, l.raw_manufacturer) AS manufacturer, COALESCE(p.mpn, l.raw_mpn) AS mpn
        FROM listings l JOIN connectors c ON c.id = l.connector_id
        LEFT JOIN parts p ON p.id = l.part_id LEFT JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE c.provider = 'lcsc' AND l.sku = ANY(%s) AND COALESCE(p.mpn, l.raw_mpn) <> ''
        """,
        (list(numbers),),
    ).fetchall()
    return {row["sku"]: (row["manufacturer"] or "", row["mpn"]) for row in rows}


def _datasheets(conn, part_ids: Sequence[str]) -> dict[str, str]:
    if not part_ids:
        return {}
    rows = conn.execute("SELECT id, datasheet_url FROM parts WHERE id = ANY(%s) AND datasheet_url <> ''", (list(part_ids),)).fetchall()
    return {row["id"]: row["datasheet_url"] for row in rows}


def _library() -> dict[tuple[str, str], str]:
    from app.services.supply import catalog_read

    return catalog_read.component_ids_by_part()


def build(conn, rows: Sequence[Mapping[str, Any]], library: Callable[[], dict[tuple[str, str], str]] = _library) -> list[dict[str, Any]]:
    """Suggestions for a project's stored lines (``usage.project_rows``), grouped by line, in line order."""

    lines = [bom_lookup.BomLine(row["key"], row["manufacturer"], row["mpn"], row["quantity"], lcsc=row["lcsc"]) for row in rows]
    resolved = bom_lookup.resolve_lines(lines, conn)
    bare = {row["key"] for row in rows if row["mpn"] and not alias_key(row["manufacturer"])}
    makers = _one_manufacturer(conn, sorted({match_key(row["mpn"]) for row in rows if row["key"] in bare}))
    lcsc_only = {row["key"] for row in rows if not row["mpn"] and row["lcsc"]}
    named = _lcsc_listings(conn, sorted({row["lcsc"] for row in rows if row["key"] in lcsc_only}))
    part_ids = [resolved[row["key"]][1] for row in rows if resolved[row["key"]][1] and not row["datasheet"]]
    sheets = _datasheets(conn, sorted(set(part_ids)))
    try:
        in_library = library() if any(row["mpn"] and not row["prism_id"] for row in rows) else {}
    except Exception:  # noqa: BLE001 - the catalog may be unavailable; the other suggestions still stand
        in_library = {}

    found: list[dict[str, Any]] = []
    for row in rows:
        if row["key"] in bare and match_key(row["mpn"]) in makers:
            found.append(_item("manufacturer", row, "", makers[match_key(row["mpn"])], "Only this manufacturer has this part number"))
        if row["key"] in lcsc_only and row["lcsc"] in named:
            maker, mpn = named[row["lcsc"]]
            found.append(_item("lcsc_part", row, row["lcsc"], f"{maker} {mpn}".strip(), f"LCSC lists {row['lcsc']} as this part"))
        part_id = resolved[row["key"]][1]
        if part_id and not row["datasheet"] and part_id in sheets:
            found.append(_item("datasheet", row, "", sheets[part_id], "A distributor gives this datasheet for the part"))
        if row["mpn"] and not row["prism_id"]:
            component = in_library.get((alias_key(row["manufacturer"]), match_key(row["mpn"])))
            if component:
                found.append(_item("prism_id", row, "", component, "The library has a component with this manufacturer and part number"))
    return found


def summary(items: Sequence[Mapping[str, Any]]) -> dict[str, int]:
    return {kind: sum(1 for item in items if item["kind"] == kind) for kind in KINDS}

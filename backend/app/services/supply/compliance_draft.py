"""A draft RoHS and REACH declaration for a project's BOM, with the gaps listed.

It lists every distinct part on the BOM with what distributors and supplier declarations say, and says what is missing. It is a
working document for a person to complete and sign off, not a declaration: Prism cannot know what a manufacturer has not said.
A part nothing is known about is *unknown*, never compliant.
"""

from __future__ import annotations

import csv
import io
from typing import Any, Mapping, Sequence

from app.services.supply import bom_lookup, compliance

HEADER = ("Manufacturer", "Part number", "Per board", "References", "RoHS", "REACH", "Declared substances on the Candidate List", "Gaps")
_RISKY_START = ("=", "+", "-", "@", "\t", "\r")


def _rohs(flags: Sequence[bool]) -> str:
    if not flags:
        return "unknown"
    if all(flags):
        return "compliant"
    return "not compliant" if not any(flags) else "disputed"


def _reach_text(standing: Mapping[str, Any]) -> str:
    return {"affected": "affected", "clear": "not affected", "unknown": "unknown"}[standing["state"]]


def build(conn, rows: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    """The draft for BOM lines (``key``, ``manufacturer``, ``mpn``, ``quantity``, optionally ``references``)."""

    lines = [bom_lookup.BomLine(row["key"], row["manufacturer"], row["mpn"], row["quantity"]) for row in rows]
    resolved = bom_lookup.resolve_lines(lines, conn)
    part_ids = sorted({part_id for state, part_id, _how in resolved.values() if state == bom_lookup.TRACKED and part_id})
    flags: dict[str, list[tuple[bool | None, bool | None]]] = {part_id: [] for part_id in part_ids}
    if part_ids:
        for offer in conn.execute(
            "SELECT l.part_id, o.rohs, o.reach_affected FROM offers o JOIN listings l ON l.id = o.listing_id "
            "WHERE l.part_id = ANY(%s) AND l.match_state IN ('exact', 'manual')",
            (part_ids,),
        ).fetchall():
            flags[offer["part_id"]].append((offer["rohs"], offer["reach_affected"]))
    listed = compliance.listed_substances(conn, part_ids)
    list_loaded = compliance.list_info(conn)["loaded"]
    out: list[dict[str, Any]] = []
    for row in rows:
        state, part_id, _how = resolved[row["key"]]
        gaps: list[str] = []
        if not row["mpn"].strip():
            gaps.append("No part number on the BOM line.")
            rohs, reach, on_list = "unknown", "unknown", []
        elif state != bom_lookup.TRACKED or not part_id:
            gaps.append("Prism does not track this part, so nothing is known about it.")
            rohs, reach, on_list = "unknown", "unknown", []
        else:
            rohs = _rohs([item[0] for item in flags[part_id] if item[0] is not None])
            on_list = listed.get(part_id, [])
            standing = compliance.standing([{"reach_affected": item[1]} for item in flags[part_id]], on_list)
            reach = _reach_text(standing)
            if rohs == "unknown":
                gaps.append("No RoHS statement from any distributor.")
            if rohs in ("not compliant", "disputed"):
                gaps.append(f"RoHS is {rohs}: check with the manufacturer.")
            if reach == "unknown":
                gaps.append("No REACH statement or substance declaration.")
            if reach == "affected":
                gaps.append("Affected by REACH: get the manufacturer's substance declaration.")
        if not list_loaded and not gaps:
            gaps.append("The REACH Candidate List is not loaded, so declared substances were not checked.")
        out.append({
            "manufacturer": row["manufacturer"], "mpn": row["mpn"], "quantity": row["quantity"], "references": row.get("references", ""),
            "rohs": rohs, "reach": reach, "on_candidate_list": on_list, "gaps": gaps,
        })
    gap_count = sum(1 for item in out if item["gaps"])
    return {
        "parts": out,
        "summary": {"parts": len(out), "with_gaps": gap_count, "rohs_unknown": sum(1 for i in out if i["rohs"] == "unknown"),
                    "reach_unknown": sum(1 for i in out if i["reach"] == "unknown"), "candidate_list_loaded": list_loaded},
    }


def _safe(cell: object) -> str:
    """A spreadsheet cell that cannot run as a formula."""

    text = str(cell)
    return "'" + text if text.startswith(_RISKY_START) else text


def to_csv(draft: Mapping[str, Any]) -> str:
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\r\n")
    writer.writerow(HEADER)
    for item in draft["parts"]:
        writer.writerow([
            _safe(item["manufacturer"]), _safe(item["mpn"]), item["quantity"], _safe(item["references"]), item["rohs"], item["reach"],
            _safe("; ".join(item["on_candidate_list"])), _safe(" ".join(item["gaps"])),
        ])
    return out.getvalue()

"""How one product stands in supply: its parts, planned builds, releases and line notes.

Reads the lines stored when the project's BOM was read (``usage``), never a checked-out commit, and calls no
distributor. A release is judged again against today's data so the page can say what changed since.
"""

from __future__ import annotations

from typing import Any

from app.services.supply import bom_comments, bom_lookup, usage

_WORST_FIRST = {"fatal": 0, "error": 1, "warning": 2, "unknown": 3, "ok": 4}
MAX_RELEASES = 20
# What changed since a release is told for parts that were fine then and are not now.
_GOOD = ("ok", "warning", None)
_BAD = ("error", "fatal")


def _parts(conn, rows: list[dict[str, Any]], build_quantity: int, notes: dict[str, int]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    lines = [bom_lookup.BomLine(row["key"], row["manufacturer"], row["mpn"], row["quantity"], lcsc=row["lcsc"]) for row in rows]
    result = bom_lookup.lookup(conn, lines, build_quantity)
    part_ids = sorted({entry["part_id"] for entry in result["lines"].values() if entry.get("part_id")})
    tiers = {
        row["part_id"]: row["tier"]
        for row in conn.execute("SELECT part_id, tier FROM part_tiers WHERE part_id = ANY(%s)", (part_ids,)).fetchall()
    } if part_ids else {}
    waiting = {
        row["part_id"]
        for row in conn.execute("SELECT DISTINCT part_id FROM admissions WHERE state = 'waiting' AND part_id = ANY(%s)", (part_ids,)).fetchall()
    } if part_ids else set()
    parts = []
    for row in rows:
        entry = result["lines"][row["key"]]
        part_id = entry.get("part_id")
        parts.append({
            "key": row["key"], "manufacturer": row["manufacturer"], "mpn": row["mpn"], "quantity": row["quantity"],
            "references": row["references"], "part_id": part_id, "state": entry["state"], "status": entry.get("status"),
            "stock": entry.get("stock"), "lifecycle": entry.get("lifecycle"), "lead_time_days": entry.get("lead_time_days"),
            "short": bool(entry.get("short")), "jlc": entry.get("jlc"), "unit_price": (entry.get("buy") or {}).get("unit_price"),
            "tier": tiers.get(part_id), "waiting": part_id in waiting, "notes": notes.get(row["key"], 0),
        })
    parts.sort(key=lambda part: (_WORST_FIRST.get(part["status"] or "unknown", 3), part["mpn"]))
    return parts, result["rollup"]


def _builds(conn, project_id: str) -> list[dict[str, Any]]:
    """The planned builds this project put on the plan: one per name, with its parts and the date it is wanted by."""

    prefix = f"{project_id}/"
    rows = conn.execute(
        "SELECT source_ref, COUNT(*) AS parts, MIN(need_by) AS need_by, MAX(note) AS note, MAX(created_at) AS created_at "
        "FROM demands WHERE source = 'bom_watch' AND state <> 'closed' AND left(source_ref, %s) = %s "
        "GROUP BY source_ref ORDER BY MIN(need_by) NULLS LAST, source_ref",
        (len(prefix), prefix),
    ).fetchall()
    return [
        {"name": row["source_ref"][len(prefix):], "parts": row["parts"], "need_by": row["need_by"].isoformat() if row["need_by"] else None,
         "note": row["note"], "created_at": row["created_at"].isoformat()}
        for row in rows
    ]


def _releases(conn, project_id: str, now_status: dict[str, str | None]) -> list[dict[str, Any]]:
    """Each release's frozen snapshot, with the parts that were fine then and are not today."""

    rows = conn.execute(
        "SELECT build_id, tag, created_at, health, status, assessment FROM release_snapshots WHERE project_id = %s "
        "ORDER BY created_at DESC LIMIT %s",
        (project_id, MAX_RELEASES),
    ).fetchall()
    releases = []
    for row in rows:
        changed = []
        for line in row["assessment"].get("lines", []):
            part_id = line.get("part_id")
            if part_id and line.get("status") in _GOOD and now_status.get(part_id) in _BAD:
                changed.append({"part_id": part_id, "manufacturer": line["manufacturer"], "mpn": line["mpn"], "was": line.get("status"), "now": now_status[part_id]})
        releases.append({
            "build_id": row["build_id"], "tag": row["tag"], "created_at": row["created_at"].isoformat(),
            "health": float(row["health"]) if row["health"] is not None else None, "status": row["status"],
            "parts": row["assessment"].get("parts", 0), "needing_a_look": row["assessment"].get("needing_a_look", 0),
            "changed_since": changed,
        })
    return releases


def overview(conn, project_id: str, variant: str = "", build_quantity: int = 1) -> dict[str, Any]:
    rows = usage.project_rows(conn, project_id, variant)
    notes_by_line: dict[str, int] = {}
    notes = bom_comments.for_project(conn, project_id)
    for note in notes:
        notes_by_line[note["line_key"]] = notes_by_line.get(note["line_key"], 0) + 1
    builds = _builds(conn, project_id)
    if not rows:
        return {"available": False, "variants": usage.project_variants(conn, project_id), "variant": variant, "builds": builds, "releases": [], "notes": notes}
    parts, rollup = _parts(conn, rows, build_quantity, notes_by_line)
    status_now = {part["part_id"]: part["status"] for part in parts if part["part_id"]}
    return {
        "available": True, "variant": variant, "variants": usage.project_variants(conn, project_id), "rollup": rollup,
        "parts": parts, "builds": builds, "releases": _releases(conn, project_id, status_now), "notes": notes,
    }

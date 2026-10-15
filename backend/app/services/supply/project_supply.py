"""How one product stands in supply: its parts, planned builds, releases and line notes.

Reads the lines stored when the project's BOM was read (``usage``), never a checked-out commit, and calls no
distributor. A release is judged again against today's data so the page can say what changed since.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.supply import bom_comments, bom_lookup, tracking, usage

_WORST_FIRST = {"fatal": 0, "error": 1, "warning": 2, "unknown": 3, "ok": 4}
MAX_RELEASES = 20
COST_HISTORY_DAYS = 180
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
    first_seen = {
        row["id"]: row["created_at"].date().isoformat()
        for row in conn.execute("SELECT id, created_at FROM parts WHERE id = ANY(%s)", (part_ids,)).fetchall()
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
            "short": bool(entry.get("short")), "jlc": entry.get("jlc"), "fetched_at": entry.get("fetched_at"), "unit_price": (entry.get("buy") or {}).get("unit_price"),
            "tier": tiers.get(part_id), "first_seen": first_seen.get(part_id), "waiting": part_id in waiting, "notes": notes.get(row["key"], 0),
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


def snapshot_costs(conn, now: datetime) -> int:
    """Write today's cost per board of every tracked project and variant that has a cost. Once a day; returns rows written."""

    today = now.astimezone(timezone.utc).date()
    written = 0
    for project in tracking.list_tracked_projects(conn):
        for variant in project["variants"]:
            if conn.execute(
                "SELECT 1 FROM bom_cost_history WHERE project_id = %s AND variant = %s AND day = %s", (project["project_id"], variant, today)
            ).fetchone():
                continue
            rows = usage.project_rows(conn, project["project_id"], variant)
            if not rows:
                continue
            lines = [bom_lookup.BomLine(row["key"], row["manufacturer"], row["mpn"], row["quantity"], lcsc=row["lcsc"]) for row in rows]
            rollup = bom_lookup.lookup(conn, lines, 1)["rollup"]
            if rollup["cost_per_board"] is None or not rollup["currency"]:
                continue
            conn.execute(
                "INSERT INTO bom_cost_history (project_id, variant, day, cost_per_board, currency, lines, lines_priced) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING",
                (project["project_id"], variant, today, rollup["cost_per_board"], rollup["currency"], rollup["lines"], rollup["lines_priced"]),
            )
            written += 1
    return written


def _cost_history(conn, project_id: str, variant: str) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT day, cost_per_board, currency, lines, lines_priced FROM bom_cost_history WHERE project_id = %s AND variant = %s "
        "ORDER BY day DESC LIMIT %s", (project_id, variant, COST_HISTORY_DAYS),
    ).fetchall()
    return [
        {"day": row["day"].isoformat(), "cost_per_board": format(row["cost_per_board"], "f"), "currency": row["currency"],
         "complete": row["lines_priced"] >= row["lines"]}
        for row in reversed(rows)
    ]


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
        "parts": parts, "cost_history": _cost_history(conn, project_id, variant), "builds": builds, "releases": _releases(conn, project_id, status_now), "notes": notes,
    }


COST_HEADER = (
    "Manufacturer", "Part number", "References", "Per board", "For the build", "Status", "In stock", "Lead time (days)",
    "Unit price", "Currency", "Cost for the build",
)


def cost_csv(conn, project_id: str, variant: str = "", build_quantity: int = 1) -> str | None:
    """The BOM costed at a build size, as a CSV. It is a costing, not an order: it names no distributor, SKU or link, and says
    which pieces the smallest orders add. None when the BOM has not been read."""

    import csv
    import io

    from app.services.supply.compliance_draft import _safe

    rows = usage.project_rows(conn, project_id, variant)
    if not rows:
        return None
    lines = [bom_lookup.BomLine(row["key"], row["manufacturer"], row["mpn"], row["quantity"], lcsc=row["lcsc"]) for row in rows]
    result = bom_lookup.lookup(conn, lines, build_quantity)
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\r\n")
    writer.writerow(COST_HEADER)
    for row in rows:
        entry = result["lines"][row["key"]]
        buy = entry.get("buy") or {}
        writer.writerow([
            _safe(row["manufacturer"]), _safe(row["mpn"]), _safe(row["references"]), row["quantity"], entry["need"],
            entry.get("status") or "not tracked", "" if entry.get("stock") is None else entry["stock"], entry.get("lead_time_days") or "",
            buy.get("unit_price", ""), buy.get("currency", ""), buy.get("extended", "") if not entry.get("bought_with") else "with another line",
        ])
    rollup = result["rollup"]
    if rollup["cost_build"] is not None:
        writer.writerow([])
        writer.writerow(["Total", "", "", "", "", "", "", "", "", rollup["currency"], rollup["cost_build"]])
        writer.writerow(["Per board", "", "", "", "", "", "", "", "", rollup["currency"], rollup["cost_per_board"]])
        writer.writerow(["Prices are list prices without VAT or shipping." + (" Converted at the rates of %s." % rollup["rates_day"] if rollup["converted"] else "")])
    return out.getvalue()

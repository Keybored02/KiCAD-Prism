"""How one product stands in supply: its parts, releases and line notes.

Reads the lines stored when the project's BOM was read (``usage``), never a checked-out commit, and calls no
distributor. A release is judged again against today's data so the page can say what changed since.
"""

from __future__ import annotations

import json

from datetime import datetime, timezone
from typing import Any

from app.services.supply import bom_comments, bom_lookup, cost_history, part_insights, parts_view, tracking, usage
from app.services.supply.assessment import settings_store

_WORST_FIRST = {"fatal": 0, "error": 1, "warning": 2, "unknown": 3, "ok": 4}
MAX_RELEASES = 20
COST_HISTORY_DAYS = 180
# Build sizes the page's cost curve is worked out for, and the chosen one.
CURVE_SIZES = (1, 10, 100, 1_000, 10_000)
# Lines the "where the money goes" list names before it says "other".
TOP_LINES = 10
# What changed since a release is told for parts that were fine then and are not now.
_GOOD = ("ok", "warning", None)
_BAD = ("error", "fatal")


# "Spares as the workspace has them set", until the request names its own.
DEFAULT = "default"


def attrition_of(spares: str) -> float | None | str:
    """The spares a request asks for: "auto" is by package (None), a number is that percent for every part, empty is the workspace's
    setting (``DEFAULT``)."""

    text = (spares or "").strip().lower()
    if text == "auto":
        return None
    if not text:
        return DEFAULT
    try:
        percent = float(text)
    except ValueError as exc:
        raise ValueError("Spares are \"auto\" or a percent from 0 to 100.") from exc
    if not 0 <= percent <= 100:
        raise ValueError("Spares are \"auto\" or a percent from 0 to 100.")
    return percent


def _parts(
    conn, rows: list[dict[str, Any]], build_quantity: int, notes: dict[str, int], attrition_percent: float | None = 0,
) -> tuple[list[dict[str, Any]], dict[str, Any], dict[str, int], list[dict[str, Any]]]:
    lines = [bom_lookup.BomLine(row["key"], row["manufacturer"], row["mpn"], row["quantity"], lcsc=row["lcsc"]) for row in rows]
    # What is read does not depend on the build size: it is read once, and priced for the chosen size and for the curve.
    loaded = bom_lookup.load(conn, lines)
    result = bom_lookup.price(conn, loaded, build_quantity, attrition_percent)
    sizes = sorted({*CURVE_SIZES, build_quantity})
    curve = bom_lookup.cost_curve(loaded, sizes, attrition_percent)
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
    kept = part_insights.of_parts(conn, part_ids) if part_ids else {}
    alerts = {
        row["part_id"]: int(row["n"])
        for row in conn.execute(
            "SELECT part_id, COUNT(*) AS n FROM alerts WHERE state = 'open' AND part_id = ANY(%s) GROUP BY part_id", (part_ids,)
        ).fetchall()
    } if part_ids else {}
    converted = bool(result["rollup"]["converted"])
    parts = []
    for row in rows:
        entry = result["lines"][row["key"]]
        part_id = entry.get("part_id")
        buy = entry.get("buy") or {}
        parts.append({
            "key": row["key"], "manufacturer": row["manufacturer"], "mpn": row["mpn"], "quantity": row["quantity"],
            "references": row["references"], "part_id": part_id, "state": entry["state"], "status": entry.get("status"),
            "stock": entry.get("stock"), "lifecycle": entry.get("lifecycle"), "lead_time_days": entry.get("lead_time_days"),
            "short": bool(entry.get("short")), "jlc": entry.get("jlc"), "fetched_at": entry.get("fetched_at"), "unit_price": (entry.get("buy") or {}).get("unit_price"),
            "tier": tiers.get(part_id), "first_seen": first_seen.get(part_id), "waiting": part_id in waiting, "notes": notes.get(row["key"], 0),
            "need": entry.get("need"),
            # The line's cost for the build, in the total's currency; none for a line bought with another line or not priced.
            "line_cost": None if entry.get("bought_with") or not buy else (buy.get("in_base") if converted else buy.get("extended")),
            "holders": (kept.get(part_id) or {}).get("holders"), "days_to_zero": (kept.get(part_id) or {}).get("days_to_zero"),
            "alerts": alerts.get(part_id, 0),
        })
    parts.sort(key=lambda part: (_WORST_FIRST.get(part["status"] or "unknown", 3), part["mpn"]))
    return parts, result["rollup"], alerts, curve


def _counts(parts: list[dict[str, Any]], rollup: dict[str, Any], alerts: dict[str, int], facts: dict[str, dict[str, Any]]) -> dict[str, int]:
    """What the page's chips count, over distinct parts: the shared ``parts_view.status_counts`` and what only a project knows."""

    first: dict[str, dict[str, Any]] = {}
    for part in parts:
        if part["part_id"] and part["status"] and part["part_id"] not in first:
            first[part["part_id"]] = part
    members = list(first.values())
    counts = parts_view.status_counts(
        [{"status": part["status"], "stock": part["stock"], "lifecycle": part["lifecycle"] or "unknown"} for part in members],
        [facts.get(part_id) or {} for part_id in first],
    )
    return {
        **counts,
        "needs_a_look": rollup["needs_a_look"],
        "short": rollup["short"],
        "alerts": sum(alerts.values()),
        "waiting": sum(1 for part in members if part["waiting"]),
        "not_priced": sum(1 for part in members if part["unit_price"] is None),
    }


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


# What of the day's rollup is kept with its cost: the boards the stock covers, the money out and what is left over.
KEPT_ROLLUP = ("can_build", "cost_build", "waste_cost", "at_risk", "needs_a_look", "short", "tracked", "lines")


def snapshot_costs(conn, now: datetime) -> int:
    """Write today's cost per board of every tracked project and variant that has a cost, worked out for the project's usual build.
    Once a day; returns rows written."""

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
            boards = int(project["build_quantity"])
            rollup = bom_lookup.lookup(conn, lines, boards, settings_store.load(conn).default_attrition())["rollup"]
            if rollup["cost_per_board"] is None or not rollup["currency"]:
                continue
            conn.execute(
                "INSERT INTO bom_cost_history (project_id, variant, day, cost_per_board, currency, lines, lines_priced, rollup, build_quantity) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s) ON CONFLICT DO NOTHING",
                (project["project_id"], variant, today, rollup["cost_per_board"], rollup["currency"], rollup["lines"], rollup["lines_priced"],
                 json.dumps({key: rollup.get(key) for key in KEPT_ROLLUP}), boards),
            )
            written += 1
    return written


def _cost_history(conn, project_id: str, variant: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """The days to draw, and the days left out as one price read wrong (see ``cost_history``)."""

    kept, left_out = cost_history.series(conn, project_id, variant, COST_HISTORY_DAYS)

    def shown(row: dict[str, Any]) -> dict[str, Any]:
        return {"day": row["day"].isoformat(), "cost_per_board": format(row["cost_per_board"], "f"), "currency": row["currency"], "boards": row["build_quantity"]}

    return [shown(row) for row in kept], [shown(row) for row in left_out]


def _where_the_money_goes(parts: list[dict[str, Any]]) -> dict[str, Any] | None:
    """The lines that cost the most for the build, with their share, then what all the other lines cost. None when nothing is priced."""

    priced = sorted(
        ((float(part["line_cost"]), part) for part in parts if part.get("line_cost") not in (None, "")), key=lambda pair: -pair[0],
    )
    total = sum(cost for cost, _part in priced)
    if not priced or total <= 0:
        return None
    top = [
        {"key": part["key"], "part_id": part["part_id"], "mpn": part["mpn"], "manufacturer": part["manufacturer"], "cost": format(cost, ".2f"), "share": round(cost / total, 4)}
        for cost, part in priced[:TOP_LINES]
    ]
    rest = priced[TOP_LINES:]
    return {
        "lines": top, "other": {"count": len(rest), "cost": format(sum(cost for cost, _part in rest), ".2f"), "share": round(sum(cost for cost, _part in rest) / total, 4)},
        "total": format(total, ".2f"),
    }


def overview(conn, project_id: str, variant: str = "", build_quantity: int | None = None, attrition_percent: float | None | str = DEFAULT) -> dict[str, Any]:
    """``build_quantity`` None is the tracked project's usual build, else 100; ``attrition_percent`` ``DEFAULT`` is the workspace's spares."""

    if attrition_percent == DEFAULT:
        attrition_percent = settings_store.load(conn).default_attrition()
    tracked = tracking.tracked_project(conn, project_id)
    usual = int(tracked["build_quantity"]) if tracked else None
    if build_quantity is None:
        build_quantity = usual or 100
    rows = usage.project_rows(conn, project_id, variant)
    notes_by_line: dict[str, int] = {}
    notes = bom_comments.for_project(conn, project_id)
    for note in notes:
        notes_by_line[note["line_key"]] = notes_by_line.get(note["line_key"], 0) + 1
    if not rows:
        return {"available": False, "variants": usage.project_variants(conn, project_id), "variant": variant, "releases": [], "notes": notes}
    parts, rollup, alerts, curve = _parts(conn, rows, build_quantity, notes_by_line, attrition_percent)
    history, left_out = _cost_history(conn, project_id, variant)
    status_now = {part["part_id"]: part["status"] for part in parts if part["part_id"]}
    part_ids = sorted(status_now)
    return {
        "available": True, "variant": variant, "build_quantity": build_quantity, "usual_build": usual, "attrition_percent": attrition_percent, "variants": usage.project_variants(conn, project_id), "rollup": rollup,
        "counts": _counts(parts, rollup, alerts, part_insights.of_parts(conn, part_ids) if part_ids else {}),
        "parts": parts, "cost_curve": curve, "money": _where_the_money_goes(parts), "cost_history": history, "cost_history_left_out": left_out, "releases": _releases(conn, project_id, status_now), "notes": notes,
    }


COST_HEADER = (
    "Manufacturer", "Part number", "References", "Per board", "For the build", "Status", "In stock", "Lead time (days)",
    "Unit price", "Currency", "Cost for the build",
)


def cost_csv(conn, project_id: str, variant: str = "", build_quantity: int = 1, attrition_percent: float | None | str = DEFAULT) -> str | None:
    """The BOM costed at a build size, as a CSV. It is a costing, not an order: it names no distributor, SKU or link, and says
    which pieces the smallest orders add. None when the BOM has not been read."""

    import csv
    import io

    from app.services.supply.compliance_draft import _safe

    if attrition_percent == DEFAULT:
        attrition_percent = settings_store.load(conn).default_attrition()
    rows = usage.project_rows(conn, project_id, variant)
    if not rows:
        return None
    lines = [bom_lookup.BomLine(row["key"], row["manufacturer"], row["mpn"], row["quantity"], lcsc=row["lcsc"]) for row in rows]
    result = bom_lookup.lookup(conn, lines, build_quantity, attrition_percent)
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

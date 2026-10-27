"""The Dashboard's figures and charts, in one read. Reads only, except ``snapshot_figures``.

Every chart is a count over the parts Prism tracks, from the same summaries the Parts list shows and the facts kept in
``part_insights``, so a bar and the list it opens agree.
"""

from __future__ import annotations

from collections import Counter
from datetime import date, datetime, timedelta, timezone
from typing import Any

from app.services.supply import ending_parts, forecast_overview, overview, part_insights, parts_view, risk_views
from app.services.supply.vocabulary import Status

FIGURE_DAYS = 30
ALERT_DAYS = 30
COST_DAYS = 90
FIGURES = ("watched", "at_risk", "out_of_stock", "lifecycle", "open_alerts", "waiting")
STATUS_ORDER = (Status.OK.value, Status.WARNING.value, Status.ERROR.value, Status.FATAL.value, Status.UNKNOWN.value)


def _figures_now(conn, now: datetime) -> dict[str, int]:
    base = overview.build_overview(conn, now)
    waiting = conn.execute("SELECT COUNT(DISTINCT part_id) AS n FROM supply_admissions WHERE state = 'waiting'").fetchone()["n"]
    return {**{name: int(base["figures"][name]) for name in ("watched", "at_risk", "out_of_stock", "lifecycle")},
            "open_alerts": int(base["open_alerts"]), "waiting": int(waiting)}


def snapshot_figures(conn, now: datetime | None = None) -> int:
    """Store today's figures unless they were stored already. Returns how many were written."""

    now = now or datetime.now(timezone.utc)
    today = now.date()
    if conn.execute("SELECT 1 FROM supply_figure_history WHERE day = %s LIMIT 1", (today,)).fetchone():
        return 0
    figures = _figures_now(conn, now)
    for metric, value in figures.items():
        conn.execute("INSERT INTO supply_figure_history (day, metric, value) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", (today, metric, value))
    return len(figures)


def _figure_series(conn, today: date) -> dict[str, list[int]]:
    """Each figure's stored values over the last 30 days, oldest first."""

    series: dict[str, list[int]] = {name: [] for name in FIGURES}
    for row in conn.execute(
        "SELECT day, metric, value FROM supply_figure_history WHERE day >= %s ORDER BY day", (today - timedelta(days=FIGURE_DAYS),)
    ).fetchall():
        if row["metric"] in series:
            series[row["metric"]].append(int(row["value"]))
    return series


def _alerts_by_day(conn, today: date) -> list[dict[str, Any]]:
    """Alerts opened each day of the last 30, by kind."""

    rows = conn.execute(
        """
        SELECT (opened_at AT TIME ZONE 'UTC')::date AS day, kind, COUNT(*) AS n FROM supply_alerts
        WHERE opened_at IS NOT NULL AND opened_at >= %s GROUP BY 1, 2 ORDER BY 1
        """,
        (datetime.combine(today - timedelta(days=ALERT_DAYS - 1), datetime.min.time(), tzinfo=timezone.utc),),
    ).fetchall()
    by_day: dict[str, dict[str, Any]] = {}
    for row in rows:
        entry = by_day.setdefault(row["day"].isoformat(), {"day": row["day"].isoformat()})
        entry[row["kind"]] = int(row["n"])
    return list(by_day.values())


def _project_costs(conn, today: date) -> list[dict[str, Any]]:
    """The cost of one board a day for each tracked project (the base design), 90 days."""

    from app.services.supply import cost_history

    projects = conn.execute(
        "SELECT DISTINCT h.project_id, COALESCE(u.project_name, h.project_id) AS project_name FROM supply_bom_cost_history h "
        "LEFT JOIN supply_bom_usage_projects u ON u.project_id = h.project_id WHERE h.variant = '' AND h.day >= %s ORDER BY 1",
        (today - timedelta(days=COST_DAYS),),
    ).fetchall()
    found: list[dict[str, Any]] = []
    for project in projects:
        kept, _left_out = cost_history.series(conn, project["project_id"], "", COST_DAYS)
        if kept:
            found.append({
                "project_id": project["project_id"], "project_name": project["project_name"], "currency": kept[-1]["currency"],
                "points": [[row["day"].isoformat(), float(row["cost_per_board"])] for row in kept],
            })
    return found


def build(conn, now: datetime | None = None, role: str | None = None) -> dict[str, Any]:
    """Everything the Dashboard page draws."""

    now = now or datetime.now(timezone.utc)
    items, _total = parts_view.ranked_parts(conn, scope="watched", role=role)
    figures = _figures_now(conn, now)
    series = _figure_series(conn, now.date())
    kept = {row["part_id"]: row for row in part_insights.read_all(conn)}
    statuses = Counter(item["status"] for item in items)
    runway: Counter[str] = Counter()
    holders: Counter[str] = Counter()
    for item in items:
        facts = kept.get(item["id"])
        if item["stock"] == 0:
            runway["out_now"] += 1
        elif facts is None:
            runway["few_readings"] += 1
        else:
            bucket = next((name for name in ("runs_out_2w", "runs_out_8w", "runs_out_later", "steady", "few_readings") if part_insights.KINDS[name](facts)), "few_readings")
            runway[bucket] += 1
        if item["stock"] is not None:
            count = (facts or {}).get("holders") if facts else None
            holders["none" if item["stock"] == 0 else "one" if count == 1 else "two" if count == 2 else "three_plus" if count else "unknown"] += 1
    tracked_ids = [item["id"] for item in items]
    groups = parts_view.part_groups(conn, scope="watched", role=role)["groups"]
    return {
        "risk_grid": risk_views.risk_grid(items, kept),
        "deadlines": risk_views.deadlines(conn, tracked_ids, now.date()),
        "projects": [
            {"project_id": group["project_id"], "project_name": group["project_name"], "count": group["count"], "statuses": group["statuses"], "stats": group["stats"]}
            for group in groups if group["tracked"]
        ],
        "figures": figures,
        "ending_components": ending_parts.undecided_count(conn, role),
        "forecast": forecast_overview.dashboard(conn, now.date()),
        "figure_history": series,
        "statuses": [{"status": status, "count": statuses.get(status, 0)} for status in STATUS_ORDER],
        "runway": {name: runway.get(name, 0) for name in ("out_now", "runs_out_2w", "runs_out_8w", "runs_out_later", "steady", "few_readings")},
        "holders": {name: holders.get(name, 0) for name in ("none", "one", "two", "three_plus", "unknown")},
        "alerts_by_day": _alerts_by_day(conn, now.date()),
        "project_costs": _project_costs(conn, now.date()),
        "insights_ready": len(kept),
    }

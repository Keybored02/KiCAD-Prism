"""The Dashboard's inbox: what needs a person today, worst first, as a few lines instead of every row.

Each item names a kind, how bad it is, how many it covers and where it is acted on; the page words it. It reads what the
Dashboard has already worked out (failing feeds, ending components, deadlines, project rows, forecasts) plus open alerts by kind
and what waits for QA, so it adds two small queries. Nothing here decides anything: every item opens the place where a person does.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Mapping

from app.core import policy

# Worst first; within a severity, in this order.
SEVERITY = ("fatal", "error", "warning", "info")
KIND_ORDER = ("feed", "ending", "deadline", "project_short", "alerts", "work_due", "likely_out", "approvals", "work_mine", "project_unconfirmed")
SHOWN = 8
# A deadline this close is in the inbox; the Deadlines card lists the rest of the year.
DEADLINE_DAYS = 30


def items(conn, built: Mapping[str, Any], role: str | None, now: datetime, actor: str = "") -> dict[str, Any]:
    """The inbox for the Dashboard ``built``: up to ``SHOWN`` items, worst first, and how many more there are. ``actor`` is the
    person asking, for the work items they own."""

    found: list[dict[str, Any]] = []
    feeds = built.get("failing_feeds") or []
    # Several stores sources read as one feed, as the Stores cell on every screen says.
    stores = [feed for feed in feeds if feed["kind"] == "stores"]
    if stores:
        found.append({"kind": "feed", "severity": "error", "count": len(stores), "name": "Stores", "feed": "stores",
                      "since": min((feed["since"] for feed in stores if feed["since"]), default=None)})
    for feed in feeds:
        if feed["kind"] != "stores":
            found.append({"kind": "feed", "severity": "error", "count": 1, "name": feed["name"], "since": feed["since"], "feed": feed["kind"]})
    if built.get("ending_components"):
        found.append({"kind": "ending", "severity": "error", "count": int(built["ending_components"])})
    found.extend(_deadlines(built.get("deadlines") or [], now.date()))
    found.extend(_alerts(conn, now))
    for row in built.get("projects") or []:
        stats = row.get("stats") or {}
        boards, usual = stats.get("boards"), stats.get("build_quantity")
        if stats.get("unchecked"):
            found.append({"kind": "project_unconfirmed", "severity": "warning", "count": int(stats["unchecked"]),
                          "project_id": row["project_id"], "name": row["project_name"]})
        elif boards is not None and usual and boards < usual:
            found.append({"kind": "project_short", "severity": "error", "count": int(boards), "of": int(usual),
                          "project_id": row["project_id"], "name": row["project_name"]})
    forecast = built.get("forecast") or {}
    if forecast.get("likely_out_4w") and (forecast.get("state") or {}).get("state") == "shown":
        found.append({"kind": "likely_out", "severity": "warning", "count": int(forecast["likely_out_4w"])})
    work = _work(conn, actor, now.date())
    if work["due"]:
        found.append({"kind": "work_due", "severity": "warning", "count": work["due"]})
    if work["mine"]:
        found.append({"kind": "work_mine", "severity": "info", "count": work["mine"]})
    if role is not None and policy.role_allows(role, "supply_approve"):
        waiting = _awaiting_approval(conn)
        if waiting:
            found.append({"kind": "approvals", "severity": "warning", "count": waiting})
    found.sort(key=lambda item: (SEVERITY.index(item["severity"]), KIND_ORDER.index(item["kind"]), -item["count"]))
    return {"items": found[:SHOWN], "more": max(0, len(found) - SHOWN)}


def _deadlines(deadlines: list[Mapping[str, Any]], today: date) -> list[dict[str, Any]]:
    """The soonest deadline in the next ``DEADLINE_DAYS``, with how many fall in them."""

    near = [item for item in deadlines if date.fromisoformat(item["date"]) <= today + timedelta(days=DEADLINE_DAYS)]
    if not near:
        return []
    first = near[0]
    return [{"kind": "deadline", "severity": "error", "count": len(near), "part_id": first["part_id"], "mpn": first["mpn"],
             "deadline": first["kind"], "date": first["date"]}]


def _alerts(conn, now: datetime) -> list[dict[str, Any]]:
    """Open alerts, one item per kind, at the worst severity among them."""

    rows = conn.execute(
        """
        SELECT kind, COUNT(*) AS n,
               MIN(CASE severity WHEN 'fatal' THEN 0 WHEN 'error' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END) AS worst
        FROM supply_alerts WHERE state = 'open' OR (state = 'snoozed' AND snoozed_until <= %s)
        GROUP BY kind
        """,
        (now,),
    ).fetchall()
    return [{"kind": "alerts", "severity": SEVERITY[int(row["worst"])], "count": int(row["n"]), "alert_kind": row["kind"]} for row in rows]


def _work(conn, actor: str, today: date) -> dict[str, int]:
    from app.services.supply import work_items

    return work_items.counts(conn, actor, today)


def _awaiting_approval(conn) -> int:
    """Waivers proposed and, where the catalog is here, alternates proposed: what waits for QA."""

    from app.services.supply import review

    waiting = review.to_approve(conn)
    return sum(len(entries) for entries in waiting.values())

"""The Supply overview: how the watchlist stands, and what needs a person.

Reads only. Counts come from the same part summaries the Parts list shows, so the
figures and the list never disagree.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.supply import alerts, parts_view
from app.services.supply.providers import registry

ATTENTION_LIMIT = 10


def _quota_today(conn, now: datetime) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT c.id, c.display_name, c.provider, c.daily_budget, c.paused_reason, COALESCE(q.spent, 0) AS spent
        FROM connectors c LEFT JOIN quota_ledger q ON q.connector_id = c.id AND q.day = %s
        WHERE c.enabled ORDER BY lower(c.display_name), c.id
        """,
        (now.astimezone(timezone.utc).date(),),
    ).fetchall()
    result = []
    for row in rows:
        try:
            metered = registry.get_spec(row["provider"]).metered
        except registry.UnknownProvider:
            metered = True
        result.append({
            "connector_id": row["id"],
            "name": row["display_name"],
            "metered": metered,
            "spent": int(row["spent"]),
            "budget": int(row["daily_budget"]) if metered else None,
            "paused": bool(row["paused_reason"]),
        })
    return result


def build_overview(conn, now: datetime | None = None, role: str | None = None) -> dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    items, _total = parts_view.ranked_parts(conn, scope="watched")
    read_times = [item["fetched_at"] for item in items if item["fetched_at"]]
    connectors = conn.execute("SELECT COUNT(*) AS n FROM connectors WHERE enabled").fetchone()["n"]
    return {
        "figures": {
            "watched": len(items),
            **{name: sum(1 for item in items if matches(item)) for name, matches in parts_view.FILTERS.items()},
            "no_data": sum(1 for item in items if item["status"] == "unknown"),
        },
        "needs_attention": [item for item in items if parts_view.FILTERS["at_risk"](item)][:ATTENTION_LIMIT],
        "open_alerts": alerts.count_attention(conn, now),
        "recent_changes": alerts.recent_changes(conn, now, role=role),
        "data_age": {"oldest": min(read_times) if read_times else None, "newest": max(read_times) if read_times else None},
        "connectors": int(connectors),
        "quota": _quota_today(conn, now),
    }

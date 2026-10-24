"""The Supply overview: how the watchlist stands (the counts the Dashboard tiles open).

Reads only. Counts come from the same part summaries the Parts list shows, so the
figures and the list never disagree.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.supply import alerts, parts_view


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
        "open_alerts": alerts.count_attention(conn, now),
        "recent_changes": alerts.recent_changes(conn, now, role=role),
        "data_age": {"oldest": min(read_times) if read_times else None, "newest": max(read_times) if read_times else None},
        "connectors": int(connectors),
    }

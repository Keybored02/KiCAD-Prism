"""What the forecasts are worked out from, read from the database in the shapes ``forecast_stock`` takes.

Reads only. The outage models and quote ratios are pooled across all parts and kept for ten minutes, since every part's forecast
uses them.
"""

from __future__ import annotations

import time
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any

from app.services.supply import forecast_stock, part_history
from app.services.supply.forecast_stock import Holder, OutageModel

_COUNTED = ("exact", "manual")
_CACHE_FOR = 600.0
_pooled: tuple[float, date, tuple[dict[str, OutageModel | None], dict[str, float], dict[str, int]]] | None = None


def holders(conn, part_id: str, now: datetime, days: int = 90) -> list[Holder]:
    """Each distributor's daily stock of the part, with the lead time it quotes."""

    built = part_history.build(conn, part_id, now, days)
    if not built["connectors"]:
        return []
    quotes = {
        row["connector_id"]: row["lead"] for row in conn.execute(
            """
            SELECT l.connector_id, MIN(o.lead_time_days) FILTER (WHERE o.lead_time_days > 0) AS lead
            FROM listings l JOIN offers o ON o.listing_id = l.id WHERE l.part_id = %s AND l.match_state = ANY(%s) GROUP BY l.connector_id
            """,
            (part_id, list(_COUNTED)),
        ).fetchall()
    }
    rate = conn.execute("SELECT rate FROM part_tiers WHERE part_id = %s", (part_id,)).fetchone()
    found = []
    for line in built["connectors"]:
        series = [(date.fromisoformat(day), int(stock)) for day, stock in line["stock"]]
        if series:
            found.append(Holder(line["connector_id"], line["name"], line["provider"], series, quotes.get(line["connector_id"]), bool(rate and rate["rate"] != "daily")))
    return found


def is_weekly(conn, part_id: str) -> bool:
    row = conn.execute("SELECT rate FROM part_tiers WHERE part_id = %s", (part_id,)).fetchone()
    return bool(row and row["rate"] != "daily")


def pooled(conn, today: date | None = None) -> tuple[dict[str, OutageModel | None], dict[str, float], dict[str, int]]:
    """(outage model per connector id with an ``all`` fallback, real-to-quoted ratio per connector, quote cases per connector)."""

    global _pooled
    today = today or datetime.now(timezone.utc).date()
    if _pooled is not None and time.monotonic() - _pooled[0] < _CACHE_FOR and _pooled[1] == today:
        return _pooled[2]
    rows = conn.execute(
        """
        SELECT l.connector_id, e.day, e.resolved_on, e.quoted_lead_days
        FROM stock_events e JOIN listings l ON l.id = e.listing_id WHERE e.kind = 'stock_out'
        """
    ).fetchall()
    durations: dict[str, list[tuple[float, bool]]] = defaultdict(list)
    ratios: dict[str, list[float]] = defaultdict(list)
    for row in rows:
        ended = row["resolved_on"] is not None
        length = ((row["resolved_on"] if ended else today) - row["day"]).days
        durations[row["connector_id"]].append((float(length), ended))
        durations["all"].append((float(length), ended))
        if ended and row["quoted_lead_days"]:
            ratios[row["connector_id"]].append(length / row["quoted_lead_days"])
            ratios["all"].append(length / row["quoted_lead_days"])
    models: dict[str, OutageModel | None] = {}
    everyone = forecast_stock.kaplan_meier([d for d, _ in durations["all"]], [o for _, o in durations["all"]], pooled=True)
    for connector, items in durations.items():
        own = forecast_stock.kaplan_meier([d for d, _ in items], [o for _, o in items])
        models[connector] = own or everyone
    models.setdefault("all", everyone)
    shrunk = {connector: forecast_stock.shrunk_ratio(values, ratios["all"]) for connector, values in ratios.items() if connector != "all"}
    result = (_with_fallback(models), {c: r for c, (r, _n) in shrunk.items()}, {c: n for c, (_r, n) in shrunk.items()})
    _pooled = (time.monotonic(), today, result)
    return result


class _Fallback(dict):
    """A connector with no stock-outs of its own uses the pooled model."""

    def get(self, key, default=None):  # type: ignore[override]
        return super().get(key) or super().get("all") or default


def _with_fallback(models: dict[str, OutageModel | None]) -> dict[str, OutageModel | None]:
    return _Fallback(models)


def forget() -> None:
    global _pooled
    _pooled = None


def default_quantity(conn, part_id: str) -> int:
    from app.services.supply import price_quantity

    return int(price_quantity.of_part(conn, part_id)["quantity"])


def listing_context(conn, part_id: str) -> dict[str, Any]:
    """How many followed listings and distributors the forecast stands on."""

    row = conn.execute(
        "SELECT COUNT(*) AS listings, COUNT(DISTINCT connector_id) AS connectors FROM listings WHERE part_id = %s AND match_state = ANY(%s)",
        (part_id, list(_COUNTED)),
    ).fetchone()
    return {"listings": int(row["listings"]), "connectors": int(row["connectors"])}

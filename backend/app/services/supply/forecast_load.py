"""What the forecasts are worked out from, read from the database in the shapes ``forecast_stock`` takes.

Reads only. The outage models and quote ratios are pooled across all parts and kept for ten minutes, since every part's forecast
uses them.
"""

from __future__ import annotations

import time
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any

import numpy as np

from app.services.supply import counted, forecast_stock, part_history
from app.services.supply.forecast_stock import Holder, OutageModel

_CACHE_FOR = 600.0
_pooled: tuple[float, date, tuple[dict[str, OutageModel | None], dict[str, float], dict[str, int]]] | None = None


def holders(conn, part_id: str, now: datetime, days: int = 90, *, borrow: bool = True) -> list[Holder]:
    """Each distributor's daily stock of the part, with the lead time it quotes. A distributor with too few readings since its last
    restock to have a drain of its own is given the drains of similar parts (``borrow`` False leaves that out)."""

    built = part_history.build(conn, part_id, now, days)
    if not built["connectors"]:
        return []
    quotes = {
        row["connector_id"]: row["lead"] for row in conn.execute(
            """
            SELECT l.connector_id, MIN(o.lead_time_days) FILTER (WHERE o.lead_time_days > 0) AS lead
            FROM supply_listings l JOIN supply_offers o ON o.listing_id = l.id WHERE l.part_id = %s AND l.match_state = ANY(%s) GROUP BY l.connector_id
            """,
            (part_id, list(counted.STATES)),
        ).fetchall()
    }
    rate = conn.execute("SELECT rate FROM supply_part_tiers WHERE part_id = %s", (part_id,)).fetchone()
    found = []
    similar: np.ndarray | None | bool = False
    for line in built["connectors"]:
        series = [(date.fromisoformat(day), int(stock)) for day, stock in line["stock"]]
        if series:
            holder = Holder(line["connector_id"], line["name"], line["provider"], series, quotes.get(line["connector_id"]), bool(rate and rate["rate"] != "daily"))
            if borrow and len(forecast_stock.run_since_restock(series)) < forecast_stock.FEW_READINGS:
                if similar is False:
                    similar = similar_shares(conn, part_id, now)
                holder.similar = similar  # type: ignore[assignment]
            found.append(holder)
    return found


def similar_shares(conn, part_id: str, now: datetime, limit: int = 40) -> np.ndarray | None:
    """The drain, as a share of stock a day, of each tracked part of the same maker and category that has a drain of its own. None
    unless at least ``MIN_SIMILAR`` parts have one."""

    category = conn.execute("SELECT lower(trim(value)) AS value FROM supply_part_facts WHERE part_id = %s AND name = 'category' LIMIT 1", (part_id,)).fetchone()
    if category is None or not category["value"]:
        return None
    others = conn.execute(
        """
        SELECT p.id FROM supply_parts p JOIN supply_part_tiers pt ON pt.part_id = p.id
        JOIN supply_parts me ON me.id = %s AND me.manufacturer_id = p.manufacturer_id
        WHERE p.id <> %s AND EXISTS (SELECT 1 FROM supply_part_facts f WHERE f.part_id = p.id AND f.name = 'category' AND lower(trim(f.value)) = %s)
        ORDER BY p.id LIMIT %s
        """,
        (part_id, part_id, category["value"], limit),
    ).fetchall()
    shares: list[float] = []
    for other in others:
        drains = stocks = 0.0
        for holder in holders(conn, other["id"], now, borrow=False):
            slopes = forecast_stock.drain_samples(holder.series)
            if slopes is not None and holder.stock > 0:
                drains += float(np.median(slopes))
                stocks += holder.stock
        if stocks > 0:
            shares.append(drains / stocks)
    return np.asarray(shares, dtype=float) if len(shares) >= forecast_stock.MIN_SIMILAR else None


def is_weekly(conn, part_id: str) -> bool:
    row = conn.execute("SELECT rate FROM supply_part_tiers WHERE part_id = %s", (part_id,)).fetchone()
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
        FROM supply_stock_events e JOIN supply_listings l ON l.id = e.listing_id WHERE e.kind = 'stock_out'
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
        "SELECT COUNT(*) AS listings, COUNT(DISTINCT connector_id) AS connectors FROM supply_listings WHERE part_id = %s AND match_state = ANY(%s)",
        (part_id, list(counted.STATES)),
    ).fetchone()
    return {"listings": int(row["listings"]), "connectors": int(row["connectors"])}

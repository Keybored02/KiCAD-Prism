"""Lifecycle forecasts: the chance a part's lifecycle turns to ending within 12 and 24 months (P8), and how long after a first sign a last
time buy comes (P9).

Both are pooled across all tracked parts and, for a maker, shrunk towards that pool. Few lifecycle changes are ever seen, so these
stay "learning" for a long time (about 30 changes needed); the rule-based outlook stays beside them.

* P8: a monthly rate of changes into not-recommended, last time buy or obsolete, per part-month watched. Over ``m`` months the chance is
  ``1 - exp(-rate * m)``. A part already ending has no such chance.
  The maker's rate is multiplied by what the part itself shows: an open end-of-life, not-recommended or last-time-buy notice (x3), and
  distributors dropping it (up to x2, by the share of the distributors that list it that have dropped it). These are fixed priors:
  too few lifecycle changes are seen to measure them, and they are measured from the changes when there are ``MIN_CASES`` of them.
  The chance stays under 95% a year however many signs there are. (Factory stock is not a figure Prism reads, so it is no factor.)
* P9: from notices that name a first sign (end of life, not recommended) and a last time buy date, the observed months between.
"""

from __future__ import annotations

import math
import statistics
import time
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any

from app.services.supply.vocabulary import Lifecycle

_ENDING = (Lifecycle.NRND.value, Lifecycle.LAST_TIME_BUY.value, Lifecycle.OBSOLETE.value)
MAKER_SHRINK_MONTHS = 60.0
PRIOR_EVENTS = 0.5
MIN_CASES = 5
MIN_CHANGES_TO_SHOW = 30
# What each sign multiplies the rate by when the data cannot say: an open notice, and every distributor that lists the part having dropped it.
NOTICE_FACTOR = 3.0
DROPPED_FACTOR = 2.0
# A year's chance never reaches this.
MAX_P12 = 0.95


def chance(rate_per_month: float, months: int) -> float:
    return 1.0 - math.exp(-max(rate_per_month, 0.0) * months)


RATES_CACHE_FOR = 6 * 3600.0
_rates: tuple[float, date, dict[str, Any]] | None = None


def pooled_rates(conn, today: date) -> dict[str, Any]:
    """``rates`` for ``today``, kept for six hours: a forecast run asks for them once per part, and they rest on every tracked part and
    every lifecycle change, which move slowly."""

    global _rates
    if _rates is not None and _rates[1] == today and time.monotonic() - _rates[0] < RATES_CACHE_FOR:
        return _rates[2]
    found = rates(conn, today)
    _rates = (time.monotonic(), today, found)
    return found


def forget() -> None:
    global _rates
    _rates = None


def rates(conn, today: date | None = None) -> dict[str, Any]:
    """Pooled and per-maker monthly rates of changes into an ending lifecycle, with the changes and part-months they rest on."""

    today = today or datetime.now(timezone.utc).date()
    exposure: dict[str, float] = defaultdict(float)
    for row in conn.execute(
        """
        SELECT m.name AS maker, p.created_at FROM supply_parts p JOIN supply_manufacturers m ON m.id = p.manufacturer_id
        JOIN supply_part_tiers pt ON pt.part_id = p.id
        """
    ).fetchall():
        months = max((today - row["created_at"].date()).days, 0) / 30.0
        exposure["__all__"] += months
        exposure[row["maker"]] += months
    changes: dict[str, int] = defaultdict(int)
    for row in conn.execute(
        """
        SELECT DISTINCT ON (e.part_id) e.part_id, m.name AS maker FROM supply_events e JOIN supply_parts p ON p.id = e.part_id
        JOIN supply_manufacturers m ON m.id = p.manufacturer_id
        WHERE e.kind = 'lifecycle_changed' AND e.payload->>'to' = ANY(%s) ORDER BY e.part_id, e.at
        """,
        (list(_ENDING),),
    ).fetchall():
        changes["__all__"] += 1
        changes[row["maker"]] += 1
    pooled = (changes["__all__"] + PRIOR_EVENTS) / max(exposure["__all__"], 1.0)
    makers = {
        maker: (changes[maker] + MAKER_SHRINK_MONTHS * pooled) / (months + MAKER_SHRINK_MONTHS)
        for maker, months in exposure.items() if maker != "__all__"
    }
    return {"pooled": pooled, "makers": makers, "changes": changes["__all__"], "part_months": exposure["__all__"], "exposure": dict(exposure)}


def signs(conn, part_id: str) -> dict[str, Any]:
    """What the part itself shows: whether an end-of-life, not-recommended or last-time-buy notice is open, and the share of the
    distributors that list it that have dropped it."""

    notice = conn.execute(
        "SELECT 1 FROM supply_pcn_parts pp JOIN supply_pcns n ON n.id = pp.pcn_id WHERE pp.part_id = %s AND n.state = 'open' "
        "AND n.kind IN ('end_of_life', 'nrnd', 'last_time_buy') LIMIT 1",
        (part_id,),
    ).fetchone()
    rows = conn.execute(
        """
        SELECT l.connector_id, bool_and(o.discontinued) AS dropped FROM supply_listings l JOIN supply_offers o ON o.listing_id = l.id
        WHERE l.part_id = %s AND l.match_state IN ('exact', 'manual') AND NOT o.marketplace GROUP BY l.connector_id
        """,
        (part_id,),
    ).fetchall()
    return {"notice": notice is not None, "dropped_share": (sum(1 for row in rows if row["dropped"]) / len(rows)) if rows else 0.0}


def factor(found: dict[str, Any]) -> float:
    """What the part's own signs multiply the maker's rate by."""

    return (NOTICE_FACTOR if found["notice"] else 1.0) * (1.0 + (DROPPED_FACTOR - 1.0) * found["dropped_share"])


def part_chance(conn, part_id: str, lifecycle: str, today: date | None = None, *, pooled: dict[str, Any] | None = None) -> dict[str, Any]:
    """The chance a part turns ending within 12 and 24 months, from its maker's rate and its own signs. None for a part that already is."""

    if lifecycle in _ENDING:
        return {"available": False, "reason": "already_ending"}
    found = pooled if pooled is not None else rates(conn, today)
    maker = conn.execute("SELECT m.name FROM supply_parts p JOIN supply_manufacturers m ON m.id = p.manufacturer_id WHERE p.id = %s", (part_id,)).fetchone()
    rate = found["makers"].get(maker["name"], found["pooled"]) if maker else found["pooled"]
    shown = signs(conn, part_id)
    rate = min(rate * factor(shown), -math.log(1.0 - MAX_P12) / 12)
    return {
        "available": True, "rate": rate, "p12": chance(rate, 12), "p24": chance(rate, 24), "signs": shown,
        "changes": found["changes"], "needs": MIN_CHANGES_TO_SHOW, "part_months": round(found["part_months"]),
    }


def last_buy_lag(conn) -> dict[str, Any]:
    """Months from a first sign (end-of-life or not-recommended notice) to the last time buy date, over the parts that have both."""

    lags = []
    for row in conn.execute(
        """
        SELECT pp.part_id,
               MIN(COALESCE(n.published_on, (n.created_at AT TIME ZONE 'UTC')::date)) FILTER (WHERE n.kind IN ('end_of_life', 'nrnd')) AS first_sign,
               MIN(n.last_time_buy) AS last_buy
        FROM supply_pcns n JOIN supply_pcn_parts pp ON pp.pcn_id = n.id GROUP BY pp.part_id
        HAVING MIN(n.last_time_buy) IS NOT NULL AND MIN(COALESCE(n.published_on, (n.created_at AT TIME ZONE 'UTC')::date)) FILTER (WHERE n.kind IN ('end_of_life', 'nrnd')) IS NOT NULL
        """
    ).fetchall():
        months = (row["last_buy"] - row["first_sign"]).days / 30.0
        if months >= 0:
            lags.append(months)
    if len(lags) < MIN_CASES:
        return {"available": False, "cases": len(lags), "needs": MIN_CASES}
    q = statistics.quantiles(lags, n=10) if len(lags) >= 10 else [min(lags)] + [statistics.median(lags)] * 8 + [max(lags)]
    return {"available": True, "cases": len(lags), "low": q[0], "median": statistics.median(lags), "high": q[-1]}

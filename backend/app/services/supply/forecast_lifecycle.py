"""Lifecycle forecasts: the chance a part's lifecycle turns to ending within 12 and 24 months (P8), and how long after a first sign a last
time buy comes (P9).

Both are pooled across all tracked parts and, for a maker, shrunk towards that pool. Few lifecycle changes are ever seen, so these
stay "learning" for a long time (about 30 changes needed); the rule-based outlook stays beside them.

* P8: a monthly rate of changes into not-recommended, last time buy or obsolete, per part-month watched. Over ``m`` months the chance is
  ``1 - exp(-rate * m)``. A part already ending has no such chance.
* P9: from notices that name a first sign (end of life, not recommended) and a last time buy date, the observed months between.
"""

from __future__ import annotations

import math
import statistics
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any

from app.services.supply.vocabulary import Lifecycle

_ENDING = (Lifecycle.NRND.value, Lifecycle.LAST_TIME_BUY.value, Lifecycle.OBSOLETE.value)
MAKER_SHRINK_MONTHS = 60.0
PRIOR_EVENTS = 0.5
MIN_CASES = 5
MIN_CHANGES_TO_SHOW = 30


def chance(rate_per_month: float, months: int) -> float:
    return 1.0 - math.exp(-max(rate_per_month, 0.0) * months)


def rates(conn, today: date | None = None) -> dict[str, Any]:
    """Pooled and per-maker monthly rates of changes into an ending lifecycle, with the changes and part-months they rest on."""

    today = today or datetime.now(timezone.utc).date()
    exposure: dict[str, float] = defaultdict(float)
    for row in conn.execute(
        """
        SELECT m.name AS maker, p.created_at FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id
        JOIN part_tiers pt ON pt.part_id = p.id
        """
    ).fetchall():
        months = max((today - row["created_at"].date()).days, 0) / 30.0
        exposure["__all__"] += months
        exposure[row["maker"]] += months
    changes: dict[str, int] = defaultdict(int)
    for row in conn.execute(
        """
        SELECT DISTINCT ON (e.part_id) e.part_id, m.name AS maker FROM events e JOIN parts p ON p.id = e.part_id
        JOIN manufacturers m ON m.id = p.manufacturer_id
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


def part_chance(conn, part_id: str, lifecycle: str, today: date | None = None) -> dict[str, Any]:
    """The chance a part turns ending within 12 and 24 months. None for a part that already is."""

    if lifecycle in _ENDING:
        return {"available": False, "reason": "already_ending"}
    found = rates(conn, today)
    maker = conn.execute("SELECT m.name FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id WHERE p.id = %s", (part_id,)).fetchone()
    rate = found["makers"].get(maker["name"], found["pooled"]) if maker else found["pooled"]
    return {
        "available": True, "rate": rate, "p12": chance(rate, 12), "p24": chance(rate, 24),
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
        FROM pcns n JOIN pcn_parts pp ON pp.pcn_id = n.id GROUP BY pp.part_id
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

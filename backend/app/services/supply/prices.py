"""How a part's price has moved, from the prices the poller recorded.

The price of a part on a day is the cheapest unit price any counted, non-marketplace listing showed
that day, in the currency most days were priced in (prices in two currencies are never compared). A
rise is a price move only when the readings span a week or more and the latest one is recent, so a
part nobody has read lately says nothing.
"""

from __future__ import annotations

from collections import Counter
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Sequence

WINDOW_DAYS = 30
MIN_SPAN_DAYS = 7
MAX_AGE_DAYS = 3
_COUNTED = ("exact", "manual")

DayPrice = tuple[date, Decimal, str]  # day, cheapest unit price, currency


def daily_cheapest(conn, part_id: str, now: datetime) -> list[DayPrice]:
    """The cheapest counted unit price per day over the window, oldest first, in one currency."""

    since = now - timedelta(days=WINDOW_DAYS)
    rows = conn.execute(
        """
        SELECT day, currency, MIN(price) AS price FROM (
            SELECT DISTINCT ON (s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date)
                   (s.sampled_at AT TIME ZONE 'UTC')::date AS day, s.currency, s.unit_price AS price
            FROM samples s JOIN listings l ON l.id = s.listing_id
            WHERE l.part_id = %(part)s AND l.match_state = ANY(%(states)s) AND s.sampled_at >= %(since)s
              AND NOT s.marketplace AND s.unit_price IS NOT NULL AND s.currency <> ''
            ORDER BY s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date, s.sampled_at DESC
        ) latest GROUP BY day, currency
        UNION ALL
        SELECT d.day, d.currency, MIN(d.last_unit_price) AS price
        FROM samples_daily d JOIN listings l ON l.id = d.listing_id
        WHERE l.part_id = %(part)s AND l.match_state = ANY(%(states)s) AND d.day >= %(since_day)s
          AND NOT d.marketplace AND d.last_unit_price IS NOT NULL AND d.currency <> ''
          AND NOT EXISTS (
              SELECT 1 FROM samples s WHERE s.listing_id = d.listing_id
                AND (s.sampled_at AT TIME ZONE 'UTC')::date = d.day)
        GROUP BY d.day, d.currency
        """,
        {"part": part_id, "states": list(_COUNTED), "since": since, "since_day": since.date()},
    ).fetchall()
    return series([(row["day"], Decimal(row["price"]), row["currency"]) for row in rows])


def series(points: Sequence[DayPrice]) -> list[DayPrice]:
    """One price per day, for the currency that has the most days, oldest first."""

    if not points:
        return []
    currency = Counter(currency for _, _, currency in points).most_common(1)[0][0]
    cheapest: dict[date, Decimal] = {}
    for day, price, code in points:
        if code == currency and price > 0:
            cheapest[day] = min(price, cheapest.get(day, price))
    return [(day, cheapest[day], currency) for day in sorted(cheapest)]


def trend(points: Sequence[DayPrice], today: date) -> dict[str, Any] | None:
    """First and latest price over the window, or None when the readings are too few, too close or too old."""

    if len(points) < 2:
        return None
    (first_day, first, currency), (last_day, last, _) = points[0], points[-1]
    if (last_day - first_day).days < MIN_SPAN_DAYS or (today - last_day).days > MAX_AGE_DAYS:
        return None
    return {
        "currency": currency,
        "was": format(first.normalize(), "f"),
        "now": format(last.normalize(), "f"),
        "change_percent": round(float((last - first) / first * 100), 1),
        "days": (last_day - first_day).days,
    }

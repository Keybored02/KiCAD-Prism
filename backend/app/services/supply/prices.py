"""How a part's price has moved, from the prices the poller recorded.

The price of a part on a day is the cheapest unit price any counted, non-marketplace listing showed that day at the
part's price quantity, in the base currency (see ``price_quantity`` and ``price_breaks``). A rise is a price move only
when the readings span a week or more and the latest one is recent, so a part nobody has read lately says nothing.
"""

from __future__ import annotations

from collections import Counter
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Sequence

from app.services.supply import pricing

WINDOW_DAYS = 30
CHART_DAYS = 90
MIN_SPAN_DAYS = 7
MAX_AGE_DAYS = 3
_COUNTED = ("exact", "manual")

DayPrice = tuple[date, Decimal, str]  # day, cheapest unit price, currency


REFERENCE_QUANTITY = 100


def daily_cheapest(conn, part_id: str, now: datetime, days: int = WINDOW_DAYS) -> list[DayPrice]:
    """The cheapest counted unit price per day over the last ``days``, oldest first, in the base currency."""

    return daily(conn, part_id, now, days)[0]


def daily(conn, part_id: str, now: datetime, days: int = WINDOW_DAYS) -> tuple[list[DayPrice], dict[str, Any]]:
    """The daily series and what it was priced at: ``{"quantity", "estimated_until"}``.

    Each listing's price is worked out from the price breaks in force that day at the part's quantity, converted to the
    base currency. Days before the breaks were kept only have the price at 100 pieces; when the part's quantity is not
    100 those days are estimated, and ``estimated_until`` is the last of them. A listing a packaging pick leaves out
    does not count, and neither does one whose smallest order is above the quantity (a reel of 1,500), unless nothing
    else prices the part.
    """

    points, meta = _points(conn, part_id, now, days)
    base = meta["base"]
    chosen = [point for point in points if point[3]] or points
    cheapest: dict[date, Decimal] = {}
    for _listing, day, price, _orderable in chosen:
        cheapest[day] = min(price, cheapest.get(day, price))
    result = [(day, cheapest[day], base) for day in sorted(cheapest)]
    return result, {"quantity": meta["quantity"], "estimated_until": meta["estimated_until"] if cheapest else None}


def listing_series(conn, part_id: str, now: datetime, days: int = CHART_DAYS) -> dict[str, list[tuple[date, Decimal]]]:
    """Each counted listing's own price per day in the base currency, oldest first, orderable listings only when any are. Converted at one rate (the latest), so a currency
    a listing is quoted in changing is not a price change, and a listing that joins later is its own series, not a move of the part."""

    points, _meta = _points(conn, part_id, now, days)
    # As in `daily`: a reel sold from more pieces than the part needs does not set the part's price moves, unless nothing else prices it.
    points = [point for point in points if point[3]] or points
    found: dict[str, list[tuple[date, Decimal]]] = {}
    for listing, day, price, _orderable in points:
        found.setdefault(listing, []).append((day, price))
    return {listing: sorted(series) for listing, series in found.items()}


def _points(conn, part_id: str, now: datetime, days: int) -> tuple[list[tuple[str, date, Decimal, bool]], dict[str, Any]]:
    """Every listing's price on each day it was read: (listing, day, price in the base currency, orderable at the part's quantity)."""

    from app.services.supply import fx, price_breaks, price_quantity
    from app.services.supply.assessment import settings_store

    quantity = price_quantity.of_parts(conn, [part_id])[part_id]
    base = settings_store.load(conn).base_currency
    rates = fx.latest(conn)
    raw = _daily_rows(conn, part_id, now, days)
    kept = price_breaks.load(conn, sorted({row["listing_id"] for row in raw}))
    points: list[tuple[str, date, Decimal, bool]] = []
    estimated: list[date] = []
    for row in raw:
        held = price_breaks.in_force(kept.get(row["listing_id"], []), row["day"])
        if held is not None:
            price = pricing.unit_price_at(held["breaks"], moq=held["moq"], order_multiple=held["order_multiple"], wanted=quantity)
            currency, moq = held["currency"], held["moq"]
        else:
            price, currency, moq = row["price"], row["currency"], row["moq"]
            if quantity != REFERENCE_QUANTITY:
                estimated.append(row["day"])
        converted = rates.convert(price, currency, base) if price is not None else None
        if converted is not None and converted > 0:
            points.append((row["listing_id"], row["day"], converted, moq <= quantity))
    return points, {"quantity": quantity, "base": base, "estimated_until": max(estimated).isoformat() if estimated else None}


def _daily_rows(conn, part_id: str, now: datetime, days: int) -> list[dict[str, Any]]:
    """One reading per listing and day (raw samples, then the daily rollups): its price at 100, currency and smallest order."""

    since = now - timedelta(days=days)
    return conn.execute(
        """
        SELECT DISTINCT ON (s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date)
               s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date AS day, s.currency, s.unit_price AS price, s.moq
        FROM samples s JOIN listings l ON l.id = s.listing_id
        WHERE l.part_id = %(part)s AND l.match_state = ANY(%(states)s) AND s.sampled_at >= %(since)s
          AND NOT s.marketplace AND s.unit_price IS NOT NULL AND s.currency <> ''
          AND NOT EXISTS (SELECT 1 FROM packaging_picks pk WHERE pk.part_id = l.part_id AND pk.connector_id = l.connector_id AND pk.listing_id <> l.id)
        ORDER BY s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date, s.sampled_at DESC
        """,
        {"part": part_id, "states": list(_COUNTED), "since": since},
    ).fetchall() + conn.execute(
        """
        SELECT d.listing_id, d.day, d.currency, d.last_unit_price AS price,
               COALESCE((SELECT o.moq FROM offers o WHERE o.listing_id = d.listing_id), 1) AS moq
        FROM samples_daily d JOIN listings l ON l.id = d.listing_id
        WHERE l.part_id = %(part)s AND l.match_state = ANY(%(states)s) AND d.day >= %(since_day)s
          AND NOT d.marketplace AND d.last_unit_price IS NOT NULL AND d.currency <> ''
          AND NOT EXISTS (SELECT 1 FROM packaging_picks pk WHERE pk.part_id = l.part_id AND pk.connector_id = l.connector_id AND pk.listing_id <> l.id)
          AND NOT EXISTS (
              SELECT 1 FROM samples s WHERE s.listing_id = d.listing_id
                AND (s.sampled_at AT TIME ZONE 'UTC')::date = d.day)
        """,
        {"part": part_id, "states": list(_COUNTED), "since_day": since.date()},
    ).fetchall()


def last_in_stock(conn, part_id: str, base: str, rates) -> tuple[Decimal, date] | None:
    """The cheapest price at 100 on the most recent day any counted listing had stock, in the base currency, and that day."""

    rows = conn.execute(
        """
        SELECT (s.sampled_at AT TIME ZONE 'UTC')::date AS day, s.currency, s.unit_price AS price
        FROM samples s JOIN listings l ON l.id = s.listing_id
        WHERE l.part_id = %s AND l.match_state = ANY(%s) AND s.stock > 0 AND NOT s.marketplace
          AND s.unit_price IS NOT NULL AND s.currency <> ''
        ORDER BY s.sampled_at DESC LIMIT 20
        """,
        (part_id, list(_COUNTED)),
    ).fetchall()
    if not rows:
        return None
    day = rows[0]["day"]
    converted = [rates.convert(Decimal(row["price"]), row["currency"], base) for row in rows if row["day"] == day]
    known = [price for price in converted if price is not None and price > 0]
    return (min(known), day) if known else None


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


def view(points: Sequence[DayPrice], today: date) -> dict[str, Any]:
    """What the part sheet shows: the daily series and, over the last 30 days of it, the move."""

    recent = [point for point in points if (today - point[0]).days <= WINDOW_DAYS]
    return {
        "currency": points[-1][2] if points else "",
        "history": [{"day": day.isoformat(), "price": float(price)} for day, price, _ in points],
        "trend": trend(recent, today),
    }


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

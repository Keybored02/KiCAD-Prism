"""A part's stock and price over time, one line per distributor.

The part sheet draws these as lines in each distributor's colour and opens them larger with a choice of timeframe.

* A line steps from reading to reading and is carried forward to the listing's last read (the offer's read time, not the
  last stored sample), so a part read once draws a flat line from that day to the last read.
* A distributor's stock is what the part's stock counts there (``stock.counted_listing_sql``: every listing, except those a pick
  stops being read at LCSC and JLCPCB), pooled or added up by pile as that provider shares it (``stock.aggregate``).
* A distributor's price is its followed (picked) listing at the reference quantity, or its cheapest listing where none is picked,
  in the base currency at the latest rates.
  Listings whose smallest order is above the reference quantity are left out, unless there is nothing else.
* ``total`` is what counts for the part.
* ``stale`` marks a line whose distributor was not read for longer than the part's rate allows; the chart dashes the rest.

Reads only.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from app.services.supply import fx, insights, prices, stock
from app.services.supply.assessment import settings_store

_COUNTED = ("exact", "manual")
MAX_DAYS = 3650
# Days a listing may go unread before its line is dashed, by the part's rate.
GAP_DAYS = {"daily": 2, "weekly": 9, "monthly": 35}
DEFAULT_DAYS = 90


def _listings(conn, part_id: str) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT l.id, l.connector_id, c.display_name, c.provider, o.fetched_at, o.moq, o.packaging,
               EXISTS (SELECT 1 FROM packaging_picks fp WHERE fp.listing_id = l.id) AS followed
        FROM listings l
        JOIN connectors c ON c.id = l.connector_id
        LEFT JOIN offers o ON o.listing_id = l.id
        WHERE l.part_id = %s AND l.match_state = ANY(%s) AND {counted}
        """.replace("{counted}", stock.counted_listing_sql()),
        (part_id, list(_COUNTED)),
    ).fetchall()
    return [dict(row) for row in rows]


def _day_figures(conn, listing_ids: list[str], since: datetime) -> dict[str, dict[date, dict[str, Any]]]:
    """Each listing's last figures per day: raw readings where they exist, the daily rollup before."""

    figures: dict[str, dict[date, dict[str, Any]]] = defaultdict(dict)
    for row in conn.execute(
        """
        SELECT d.listing_id, d.day, d.last_stock AS stock, d.last_unit_price AS price, d.currency, d.marketplace
        FROM samples_daily d WHERE d.listing_id = ANY(%s) AND d.day >= %s
        """,
        (listing_ids, since.date()),
    ).fetchall():
        figures[row["listing_id"]][row["day"]] = dict(row)
    for row in conn.execute(
        """
        SELECT DISTINCT ON (s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date)
               s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date AS day, s.stock, s.unit_price AS price, s.currency, s.marketplace, s.moq
        FROM samples s WHERE s.listing_id = ANY(%s) AND s.sampled_at >= %s
        ORDER BY s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date, s.sampled_at DESC
        """,
        (listing_ids, since),
    ).fetchall():
        figures[row["listing_id"]][row["day"]] = dict(row)
    return figures


def _events(conn, part_id: str, total: list[list[Any]], first: date) -> list[dict[str, Any]]:
    """Days worth marking on the axis: a restock (the total rose as ``insights`` counts one) and a product change notice published."""

    found = [
        {"day": after[0], "kind": "restock", "text": f"Restock: {before[1]:,} to {after[1]:,}"}
        for before, after in zip(total, total[1:])
        if insights.is_restock(int(before[1]), int(after[1]))
    ]
    for row in conn.execute(
        """
        SELECT COALESCE(n.published_on, (n.created_at AT TIME ZONE 'UTC')::date) AS day, n.title, n.kind
        FROM pcns n JOIN pcn_parts pp ON pp.pcn_id = n.id WHERE pp.part_id = %s
        """,
        (part_id,),
    ).fetchall():
        if row["day"] >= first:
            found.append({"day": row["day"].isoformat(), "kind": "notice", "text": f"Notice: {row['title']}"})
    return sorted(found, key=lambda item: item["day"])


def build(conn, part_id: str, now: datetime | None = None, days: int = DEFAULT_DAYS) -> dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    days = max(1, min(int(days), MAX_DAYS))
    listings = _listings(conn, part_id)
    empty = {"days": days, "currency": "", "connectors": [], "total": [], "events": []}
    if not listings:
        return empty
    figures = _day_figures(conn, [item["id"] for item in listings], now - timedelta(days=days))
    figures = {key: value for key, value in figures.items() if value}
    if not figures:
        return empty
    base = settings_store.load(conn).base_currency
    rates = fx.latest(conn)
    tier = conn.execute("SELECT rate FROM part_tiers WHERE part_id = %s", (part_id,)).fetchone()
    allowed_gap = GAP_DAYS.get(tier["rate"] if tier else "daily", GAP_DAYS["daily"])

    first = min(min(per_day) for per_day in figures.values())
    today = now.astimezone(timezone.utc).date()
    ends: dict[str, date] = {}
    for item in listings:
        if item["id"] not in figures:
            continue
        read = item["fetched_at"].astimezone(timezone.utc).date() if item["fetched_at"] else max(figures[item["id"]])
        ends[item["id"]] = min(max(read, max(figures[item["id"]])), today)
    last_day = max(ends.values())

    # Orderable listings carry the price lines; if none are, every listing does.
    orderable = {item["id"] for item in listings if (item["moq"] or 1) <= prices.REFERENCE_QUANTITY}
    priced = orderable if any(item["id"] in orderable for item in listings if item["id"] in figures) else {item["id"] for item in listings}

    by_connector: dict[str, dict[str, Any]] = {}
    for item in listings:
        if item["id"] in figures:
            by_connector.setdefault(item["connector_id"], {"name": item["display_name"], "provider": item["provider"], "listings": []})["listings"].append(item)

    carried: dict[str, dict[str, Any]] = {}
    lines: dict[str, dict[str, Any]] = {
        connector_id: {"connector_id": connector_id, "name": info["name"], "provider": info["provider"], "stock": [], "price": [],
                       "last_read": max((i["fetched_at"] for i in info["listings"] if i["fetched_at"]), default=None)}
        for connector_id, info in by_connector.items()
    }
    total: list[list[Any]] = []
    day = first
    while day <= last_day:
        for listing_id, per_day in figures.items():
            if day in per_day:
                carried[listing_id] = per_day[day]
        live = {listing_id: row for listing_id, row in carried.items() if ends[listing_id] >= day}
        rows_for_total = []
        for connector_id, info in by_connector.items():
            mine = [item for item in info["listings"] if item["id"] in live]
            if not mine:
                continue
            rows = [{"connector_id": connector_id, "provider": info["provider"], "stock": live[item["id"]]["stock"], "marketplace": bool(live[item["id"]]["marketplace"]),
                     "fetched_at": day, "packaging": item["packaging"]} for item in mine]
            rows_for_total.extend(rows)
            lines[connector_id]["stock"].append([day.isoformat(), stock.aggregate(rows, "any").total])
            candidates = []
            # Where a listing is picked, it prices the part; else every listing does.
            followed = [item for item in mine if item["followed"]]
            for item in (followed or mine):
                row = live[item["id"]]
                if item["id"] in priced and row.get("price") is not None and row.get("currency") and not row.get("marketplace"):
                    converted = rates.convert(Decimal(row["price"]), row["currency"], base)
                    if converted is not None:
                        candidates.append(converted)
            if candidates:
                lines[connector_id]["price"].append([day.isoformat(), float(min(candidates))])
        total.append([day.isoformat(), stock.aggregate(rows_for_total, "any").total])
        day += timedelta(days=1)

    events = _events(conn, part_id, total, first)
    ordered = sorted(lines.values(), key=lambda line: line["name"].lower())
    for line in ordered:
        read = line["last_read"]
        # Not read for longer than the part's rate allows: the chart draws the rest of the line dashed.
        line["stale"] = read is not None and (today - read.astimezone(timezone.utc).date()).days > allowed_gap
        line["last_read"] = read.isoformat() if read else None
    return {"days": days, "currency": base, "connectors": ordered, "total": total, "events": events}

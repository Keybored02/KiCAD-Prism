"""Read models for the Parts screen: a list of parts and the detail of one.

Reads only. Counting rules are the ones in ``stock`` (exact and manual listings,
no marketplace stock, pooling per provider). A part with a watch is "watched".
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Literal

from app.services.supply import parts, stock
from app.services.supply.part_status import part_status, worst_lifecycle
from app.services.supply.tiers import Tier
from app.services.supply.vocabulary import Lifecycle

Scope = Literal["watched", "all"]
MAX_LIMIT = 200
HISTORY_DAYS = 90
_COUNTED = ("exact", "manual")
_TIER_ORDER = [tier.value for tier in (Tier.HOT, Tier.WARM, Tier.NORMAL, Tier.COLD)]


def _like(text: str) -> str:
    """A contains-pattern for ILIKE with the user's own wildcards made literal."""

    escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def _watch_dto(row) -> dict[str, Any] | None:
    if row["watch_id"] is None:
        return None
    return {"id": row["watch_id"], "threshold": row["threshold"], "pinned": bool(row["pinned"]), "owner": row["owner"]}


def _cheapest(offers: list[dict]) -> tuple[str | None, str]:
    """The lowest first-break price, if every priced offer is in one currency."""

    priced = [(Decimal(o["price_breaks"][0][1]), o["currency"]) for o in offers if o["price_breaks"] and o["currency"]]
    if not priced or len({currency for _, currency in priced}) != 1:
        return None, ""
    price, currency = min(priced)
    return format(price.normalize(), "f"), currency


def list_parts(conn, *, scope: Scope = "watched", query: str = "", limit: int = 100) -> dict[str, Any]:
    limit = max(1, min(limit, MAX_LIMIT))
    conditions = ["TRUE" if scope == "all" else "w.id IS NOT NULL"]
    params: list[Any] = []
    text = query.strip()
    if text:
        conditions.append("(p.mpn ILIKE %s OR m.name ILIKE %s)")
        params += [_like(text), _like(text)]
    where = " AND ".join(conditions)
    total = conn.execute(
        f"SELECT COUNT(*) AS n FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id "
        f"LEFT JOIN watches w ON w.part_id = p.id WHERE {where}", params,
    ).fetchone()["n"]
    rows = conn.execute(
        f"SELECT p.id, p.mpn, m.name AS manufacturer, w.id AS watch_id, w.threshold, w.pinned, w.owner "
        f"FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id LEFT JOIN watches w ON w.part_id = p.id "
        f"WHERE {where} ORDER BY lower(m.name), lower(p.mpn) LIMIT %s", [*params, limit],
    ).fetchall()

    offers_by_part: dict[str, list[dict]] = defaultdict(list)
    if rows:
        for row in conn.execute(
            """
            SELECT l.part_id, l.connector_id, c.provider, o.stock, o.marketplace, o.fetched_at, o.lifecycle,
                   o.price_breaks, o.currency, ps.tier
            FROM listings l
            JOIN offers o ON o.listing_id = l.id
            JOIN connectors c ON c.id = l.connector_id
            LEFT JOIN poll_state ps ON ps.listing_id = l.id
            WHERE l.part_id = ANY(%s) AND l.match_state = ANY(%s)
            """,
            ([r["id"] for r in rows], list(_COUNTED)),
        ).fetchall():
            offers_by_part[row["part_id"]].append(dict(row))

    items = []
    for row in rows:
        offers = offers_by_part.get(row["id"], [])
        combined = stock.aggregate(offers) if offers else None
        lifecycle = worst_lifecycle(Lifecycle(o["lifecycle"]) for o in offers)
        price, currency = _cheapest([o for o in offers if not o["marketplace"]])
        tiers = [o["tier"] for o in offers if o["tier"]]
        items.append({
            "id": row["id"],
            "mpn": row["mpn"],
            "manufacturer": row["manufacturer"],
            "watch": _watch_dto(row),
            "status": part_status(combined.total if combined else None, row["threshold"], lifecycle).value,
            "stock": combined.total if combined else None,
            "listings": combined.listings if combined else 0,
            "lifecycle": lifecycle.value,
            "unit_price": price,
            "currency": currency,
            "fetched_at": combined.newest_fetched_at.isoformat() if combined and combined.newest_fetched_at else None,
            "tier": min(tiers, key=_TIER_ORDER.index) if tiers else None,
        })
    return {"items": items, "total": int(total), "limit": limit}


def _history(conn, part_id: str, now: datetime) -> list[dict[str, Any]]:
    """Total counted stock per day, carrying each listing's last known figure forward."""

    since = now - timedelta(days=HISTORY_DAYS)
    rows = conn.execute(
        """
        SELECT DISTINCT ON (s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date)
               s.listing_id, l.connector_id, c.provider, (s.sampled_at AT TIME ZONE 'UTC')::date AS day, s.stock
        FROM samples s
        JOIN listings l ON l.id = s.listing_id
        JOIN connectors c ON c.id = l.connector_id
        WHERE l.part_id = %s AND l.match_state = ANY(%s) AND s.sampled_at >= %s
        ORDER BY s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date, s.sampled_at DESC
        """,
        (part_id, list(_COUNTED), since),
    ).fetchall()
    if not rows:
        return []
    by_day: dict[date, list] = defaultdict(list)
    for row in rows:
        by_day[row["day"]].append(row)
    last: dict[str, dict] = {}
    series = []
    day, end = min(by_day), max(by_day)
    while day <= end:
        for row in by_day.get(day, []):
            last[row["listing_id"]] = {
                "connector_id": row["connector_id"], "provider": row["provider"], "stock": row["stock"],
                "marketplace": False, "fetched_at": day,
            }
        series.append({"day": day.isoformat(), "stock": stock.aggregate(last.values()).total})
        day += timedelta(days=1)
    return series


def part_detail(conn, part_id: str, *, now: datetime | None = None) -> dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    part = parts.get_part(conn, part_id)
    watch_row = conn.execute(
        "SELECT w.id AS watch_id, w.threshold, w.pinned, w.owner FROM watches w WHERE w.part_id = %s", (part_id,)
    ).fetchone() or {"watch_id": None, "threshold": None, "pinned": False, "owner": ""}

    rows = conn.execute(
        """
        SELECT l.id, l.connector_id, c.display_name AS connector_name, c.provider, l.sku, l.packaging, l.match_state,
               l.match_reason, o.fetched_at, o.stock, o.incoming, o.moq, o.order_multiple, o.price_breaks, o.currency,
               o.lead_time_days, o.lifecycle, o.discontinued, o.rohs, o.marketplace, o.product_url,
               ps.tier, ps.next_poll_at, ps.last_polled_at, ps.error_streak, ps.last_error_code
        FROM listings l
        JOIN connectors c ON c.id = l.connector_id
        LEFT JOIN offers o ON o.listing_id = l.id
        LEFT JOIN poll_state ps ON ps.listing_id = l.id
        WHERE l.part_id = %s AND l.match_state <> 'rejected'
        ORDER BY c.display_name, l.sku
        """,
        (part_id,),
    ).fetchall()

    counted = [dict(r) for r in rows if r["match_state"] in _COUNTED and r["fetched_at"] is not None]
    combined = stock.aggregate(counted) if counted else None
    lifecycle = worst_lifecycle(Lifecycle(r["lifecycle"]) for r in counted)
    names = {r["connector_id"]: r["connector_name"] for r in rows}

    def iso(value: datetime | None) -> str | None:
        return value.isoformat() if value else None

    listings = []
    for r in rows:
        has_offer = r["fetched_at"] is not None
        listings.append({
            "id": r["id"],
            "connector_id": r["connector_id"],
            "connector_name": r["connector_name"],
            "sku": r["sku"],
            "packaging": r["packaging"],
            "match_state": r["match_state"],
            "counted": r["match_state"] in _COUNTED,
            "offer": {
                "fetched_at": iso(r["fetched_at"]),
                "stock": r["stock"],
                "incoming": r["incoming"],
                "moq": r["moq"],
                "order_multiple": r["order_multiple"],
                "price_breaks": r["price_breaks"],
                "currency": r["currency"],
                "lead_time_days": r["lead_time_days"],
                "lifecycle": r["lifecycle"],
                "discontinued": bool(r["discontinued"]),
                "rohs": r["rohs"],
                "marketplace": bool(r["marketplace"]),
                "product_url": r["product_url"],
            } if has_offer else None,
            "poll": {
                "tier": r["tier"],
                "next_poll_at": iso(r["next_poll_at"]),
                "last_polled_at": iso(r["last_polled_at"]),
                "error_streak": r["error_streak"],
                "last_error_code": r["last_error_code"],
            } if r["tier"] else None,
        })

    return {
        "part": {"id": part.id, "mpn": part.mpn, "manufacturer": part.manufacturer_name},
        "watch": _watch_dto(watch_row),
        "status": part_status(combined.total if combined else None, watch_row["threshold"], lifecycle).value,
        "stock": {
            "total": combined.total if combined else None,
            "by_connector": [
                {"connector_id": cid, "connector_name": names.get(cid, ""), "stock": value}
                for cid, value in (combined.by_connector.items() if combined else [])
            ],
        },
        "lifecycle": lifecycle.value,
        "listings": listings,
        "history": _history(conn, part_id, now),
    }

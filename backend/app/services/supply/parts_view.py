"""Read models for the Parts screen: a list of parts and the detail of one.

Reads only. Counting rules are the ones in ``stock`` (exact and manual listings,
no marketplace stock, pooling per provider). A part with a watch is "watched".
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Callable, Literal

from app.services.supply import demand, facts, insights, outlook, params, parts, pcn, prices, pricing, stock, usage
from app.services.supply.part_status import (
    PROBLEM_LABEL, STATUS_ORDER, part_problem, part_status, worst_lifecycle,
)
from app.services.supply.tiers import Tier
from app.services.supply.vocabulary import Lifecycle

Scope = Literal["watched", "in_use", "all"]
Filter = Literal["", "at_risk", "out_of_stock", "lifecycle"]
_NEEDS_A_LOOK = ("fatal", "error", "warning")
_LIFECYCLE_RISK = (Lifecycle.NRND.value, Lifecycle.LAST_TIME_BUY.value, Lifecycle.OBSOLETE.value)
# The groups the Overview counts, so a count and the list it links to agree.
FILTERS: dict[str, Callable[[dict[str, Any]], bool]] = {
    "at_risk": lambda item: item["status"] in _NEEDS_A_LOOK,
    "out_of_stock": lambda item: item["stock"] == 0,
    "lifecycle": lambda item: item["lifecycle"] in _LIFECYCLE_RISK,
}
MAX_LIMIT = 200
# Parts are ordered by how much they need a look, which needs every candidate's
# status, so the list reads this many at most before it cuts to the page.
MAX_CANDIDATES = 5000
HISTORY_DAYS = 90
_COUNTED = ("exact", "manual")
_TIER_ORDER = [tier.value for tier in (Tier.HOT, Tier.WARM, Tier.NORMAL, Tier.COLD)]
_STATUS_RANK = {status.value: rank for rank, status in enumerate(STATUS_ORDER)}


def _like(text: str) -> str:
    """A contains-pattern for ILIKE with the user's own wildcards made literal."""

    escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def _watch_dto(row) -> dict[str, Any] | None:
    if row["watch_id"] is None:
        return None
    return {"id": row["watch_id"], "threshold": row["threshold"], "pinned": bool(row["pinned"]), "owner": row["owner"],
            "packaging": row["watch_packaging"] or "any"}


def _cheapest(offers: list[dict]) -> tuple[str | None, str, int]:
    """The lowest price, as (price, currency, quantity it is quoted at).

    Prices are compared at the reference quantity. An offer that cannot be bought
    in that quantity (its minimum order is higher, as with a full reel) only
    counts when nothing else can, and then it is quoted at what must be ordered.
    Mixed currencies give no price: nothing here converts them.
    """

    within, beyond = [], []
    for offer in offers:
        if not offer["currency"]:
            continue
        breaks = [(int(quantity), Decimal(price)) for quantity, price in offer["price_breaks"]]
        quantity = pricing.order_quantity(pricing.REFERENCE_QUANTITY, offer["moq"], offer["order_multiple"])
        price = pricing.unit_price_at(breaks, moq=offer["moq"], order_multiple=offer["order_multiple"])
        if price is not None:
            (within if offer["moq"] <= pricing.REFERENCE_QUANTITY else beyond).append((price, offer["currency"], quantity))
    priced = within or beyond
    if not priced or len({currency for _, currency, _ in priced}) != 1:
        return None, "", pricing.REFERENCE_QUANTITY
    price, currency, quantity = min(priced)
    return format(price.normalize(), "f"), currency, quantity


def _problems(conn, part_ids: list[str]) -> dict[str, str | None]:
    """Why a part with nothing counted is in trouble, per part."""

    if not part_ids:
        return {}
    facts = {
        row["part_id"]: row
        for row in conn.execute(
            """
            SELECT part_id,
                   bool_or(match_state = ANY(%s)) AS counted,
                   bool_or(match_state = 'gone') AS gone,
                   bool_or(match_state <> 'rejected') AS listed
            FROM listings WHERE part_id = ANY(%s) GROUP BY part_id
            """,
            (list(_COUNTED), part_ids),
        ).fetchall()
    }
    searched = {
        row["part_id"]
        for row in conn.execute("SELECT DISTINCT part_id FROM discovery_runs WHERE part_id = ANY(%s)", (part_ids,)).fetchall()
    }
    result: dict[str, str | None] = {}
    for part_id in part_ids:
        fact = facts.get(part_id)
        result[part_id] = part_problem(
            has_counted=bool(fact and fact["counted"]),
            has_gone=bool(fact and fact["gone"]),
            has_listings=bool(fact and fact["listed"]),
            was_searched=part_id in searched,
        )
    return result


_USES = "FROM bom_usage u JOIN bom_usage_projects up ON up.project_id = u.project_id WHERE " + usage.MATCHES_PART + " AND " + usage.VISIBLE
_IN_USE = "EXISTS (SELECT 1 " + _USES + ")"

_ROW_SELECT = (
    "SELECT p.id, p.mpn, m.name AS manufacturer, w.id AS watch_id, w.threshold, w.pinned, w.owner, w.packaging AS watch_packaging, "
    "(SELECT COUNT(DISTINCT u.project_id) " + _USES + ") AS used_in "
    "FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id LEFT JOIN watches w ON w.part_id = p.id "
)


def offers_by_part(conn, part_ids: list[str]) -> dict[str, list[dict]]:
    """Counted offers per part (exact and manual listings), with what pricing and display need."""

    offers: dict[str, list[dict]] = defaultdict(list)
    if not part_ids:
        return offers
    for row in conn.execute(
        """
        SELECT l.part_id, l.connector_id, l.sku, c.provider, c.display_name AS connector_name,
               o.stock, o.marketplace, o.packaging, o.discontinued, o.rohs, o.reach_affected, o.fetched_at, o.lifecycle, o.price_breaks, o.currency, o.moq,
               o.order_multiple, o.lead_time_days, o.product_url, ps.tier
        FROM listings l
        JOIN offers o ON o.listing_id = l.id
        JOIN connectors c ON c.id = l.connector_id
        LEFT JOIN poll_state ps ON ps.listing_id = l.id
        WHERE l.part_id = ANY(%s) AND l.match_state = ANY(%s)
        """,
        (part_ids, list(_COUNTED)),
    ).fetchall():
        offers[row["part_id"]].append(dict(row))
    return offers


def _summaries(conn, rows, offers: dict[str, list[dict]] | None = None) -> list[dict[str, Any]]:
    """The list-row summary of each part row: status, stock, price, lifecycle, tier."""

    ids = [r["id"] for r in rows]
    offers_by_part_id = offers if offers is not None else offers_by_part(conn, ids)
    problems = _problems(conn, ids)
    needed, needed_by = demand.open_totals(conn, ids), demand.next_needs(conn, ids)

    items = []
    for row in rows:
        policy = row["watch_packaging"] or "any"
        # Only the packaging the watch counts: stock, lifecycle and price all follow it.
        offers_here = [o for o in offers_by_part_id.get(row["id"], []) if stock.counts(o["packaging"], policy)]
        combined = stock.aggregate(offers_here, policy) if offers_here else None
        lifecycle = worst_lifecycle(Lifecycle(o["lifecycle"]) for o in offers_here)
        price, currency, price_quantity = _cheapest([o for o in offers_here if not o["marketplace"]])
        tiers = [o["tier"] for o in offers_here if o["tier"]]
        problem = problems.get(row["id"]) if combined is None else None
        items.append({
            "id": row["id"],
            "mpn": row["mpn"],
            "manufacturer": row["manufacturer"],
            "watch": _watch_dto(row),
            "status": part_status(combined.total if combined else None, row["threshold"], lifecycle, problem).value,
            "problem": problem,
            "stock": combined.total if combined else None,
            "listings": combined.listings if combined else 0,
            "lifecycle": lifecycle.value,
            # Every distributor that lists it has stopped selling it.
            "dropped": bool(offers_here) and all(o["discontinued"] for o in offers_here),
            "unit_price": price,
            "price_quantity": price_quantity,
            "currency": currency,
            "fetched_at": combined.newest_fetched_at.isoformat() if combined and combined.newest_fetched_at else None,
            "tier": min(tiers, key=_TIER_ORDER.index) if tiers else None,
            "used_in": int(row["used_in"]),
            # What open demand asks of the part, and the soonest date it is wanted by.
            "needed": max(0, needed.get(row["id"], 0)),
            "need_by": needed_by.get(row["id"]),
        })
    return items


def summaries_for(conn, part_ids: list[str]) -> list[dict[str, Any]]:
    """Summaries of the given parts, in no particular order."""

    return summaries_with_offers(conn, part_ids)[0]


def summaries_with_offers(conn, part_ids: list[str], role: str | None = None) -> tuple[list[dict[str, Any]], dict[str, list[dict]]]:
    """Summaries of the given parts and the counted offers behind them, for callers that price."""

    if not part_ids:
        return [], {}
    rows = conn.execute(_ROW_SELECT + "WHERE p.id = ANY(%s)", [*usage.role_params(role), list(part_ids)]).fetchall()
    offers = offers_by_part(conn, [row["id"] for row in rows])
    return _summaries(conn, rows, offers), offers


def ranked_parts(conn, *, scope: Scope = "watched", query: str = "", role: str | None = None) -> tuple[list[dict[str, Any]], int]:
    """Every matching part (up to ``MAX_CANDIDATES``), the ones that need a look first, and the true count."""

    conditions = [{"all": "TRUE", "watched": "w.id IS NOT NULL", "in_use": "(" + _IN_USE + ")"}[scope]]
    params: list[Any] = usage.role_params(role) if scope == "in_use" else []
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
        _ROW_SELECT + f"WHERE {where} ORDER BY lower(m.name), lower(p.mpn) LIMIT %s", [*usage.role_params(role), *params, MAX_CANDIDATES],
    ).fetchall()
    items = _summaries(conn, rows)
    # The sort is stable, so parts of equal status keep their name order.
    items.sort(key=lambda item: _STATUS_RANK[item["status"]])
    return items, int(total)


def list_parts(
    conn, *, scope: Scope = "watched", query: str = "", limit: int = 100, role: str | None = None, only: Filter = ""
) -> dict[str, Any]:
    """Parts that need a look first (worst status), then by name. ``only`` keeps one group of them."""

    limit = max(1, min(limit, MAX_LIMIT))
    items, total = ranked_parts(conn, scope=scope, query=query, role=role)
    if only:
        items = [item for item in items if FILTERS[only](item)]
        total = len(items)
    return {"items": items[:limit], "total": total, "limit": limit}


def _day_rows(conn, part_id: str, since: datetime) -> list[dict]:
    """Each listing's last known stock per day: raw samples where they exist, rollups before that."""

    states = list(_COUNTED) + ["gone"]
    raw = conn.execute(
        """
        SELECT DISTINCT ON (s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date)
               s.listing_id, l.connector_id, c.provider, l.match_state, l.packaging,
               (s.sampled_at AT TIME ZONE 'UTC')::date AS day, s.stock, s.marketplace
        FROM samples s
        JOIN listings l ON l.id = s.listing_id
        JOIN connectors c ON c.id = l.connector_id
        WHERE l.part_id = %s AND l.match_state = ANY(%s) AND s.sampled_at >= %s
        ORDER BY s.listing_id, (s.sampled_at AT TIME ZONE 'UTC')::date, s.sampled_at DESC
        """,
        (part_id, states, since),
    ).fetchall()
    rolled = conn.execute(
        """
        SELECT d.listing_id, l.connector_id, c.provider, l.match_state, l.packaging, d.day, d.last_stock AS stock, d.marketplace
        FROM samples_daily d
        JOIN listings l ON l.id = d.listing_id
        JOIN connectors c ON c.id = l.connector_id
        WHERE l.part_id = %s AND l.match_state = ANY(%s) AND d.day >= %s
        """,
        (part_id, states, since.date()),
    ).fetchall()
    merged = {(r["listing_id"], r["day"]): dict(r) for r in rolled}
    merged.update({(r["listing_id"], r["day"]): dict(r) for r in raw})
    return list(merged.values())


def history(conn, part_id: str, now: datetime) -> list[dict[str, Any]]:
    """Total counted stock per day, carrying each listing's last known figure forward.

    Marketplace stock is left out, as in the current total. A listing that has
    disappeared stops counting after its last reading. ``listings`` says how
    many listings stood behind each day, so a jump from a new listing reads as a
    change in coverage and not as a restock.
    """

    rows = _day_rows(conn, part_id, now - timedelta(days=HISTORY_DAYS))
    if not rows:
        return []
    watch = conn.execute("SELECT packaging FROM watches WHERE part_id = %s", (part_id,)).fetchone()
    policy = watch["packaging"] if watch else "any"
    by_day: dict[date, list] = defaultdict(list)
    last_day: dict[str, date] = {}
    gone: set[str] = set()
    for row in rows:
        by_day[row["day"]].append(row)
        last_day[row["listing_id"]] = max(row["day"], last_day.get(row["listing_id"], row["day"]))
        if row["match_state"] == "gone":
            gone.add(row["listing_id"])
    last: dict[str, dict] = {}
    series = []
    day, end = min(by_day), max(by_day)
    while day <= end:
        for row in by_day.get(day, []):
            last[row["listing_id"]] = {
                "connector_id": row["connector_id"], "provider": row["provider"], "stock": row["stock"],
                "marketplace": bool(row["marketplace"]), "fetched_at": day, "packaging": row["packaging"],
            }
        for listing_id in gone:
            if last_day[listing_id] < day:
                last.pop(listing_id, None)
        combined = stock.aggregate(last.values(), policy)
        series.append({"day": day.isoformat(), "stock": combined.total, "listings": combined.listings})
        day += timedelta(days=1)
    return series


def insight_from(days: list[dict[str, Any]], threshold: int | None, now: datetime) -> dict[str, Any]:
    """What the daily history says (see ``insights``)."""

    points = [insights.Point(date.fromisoformat(day["day"]), day["stock"], day["listings"]) for day in days]
    return insights.analyse(points, threshold=threshold, today=now.astimezone(timezone.utc).date())


def parameters_of(conn, part_id: str) -> list[dict[str, Any]]:
    """The attributes distributors list for the part: known ones in one vocabulary first, the rest as written."""

    rows = conn.execute(
        "SELECT provider, name, raw FROM part_params WHERE part_id = %s ORDER BY provider, name", (part_id,)
    ).fetchall()
    sources: dict[tuple[str, str], list[str]] = {}
    for row in rows:
        sources.setdefault((row["name"].lower(), row["raw"]), []).append(row["provider"])
    first_seen = list(dict.fromkeys((row["name"], row["raw"]) for row in rows))
    return [
        {
            "name": item.name, "raw": item.raw, "key": item.key, "unit": item.unit,
            "value": format(item.value.normalize(), "f") if item.value is not None else None,
            "sources": sources.get((item.name.lower(), item.raw), []),
        }
        for item in params.normalise(first_seen)
    ]


def part_detail(conn, part_id: str, *, now: datetime | None = None, role: str | None = None) -> dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    part = parts.get_part(conn, part_id)
    watch_row = conn.execute(
        "SELECT w.id AS watch_id, w.threshold, w.pinned, w.owner, w.packaging AS watch_packaging FROM watches w WHERE w.part_id = %s",
        (part_id,),
    ).fetchone() or {"watch_id": None, "threshold": None, "pinned": False, "owner": "", "watch_packaging": "any"}

    rows = conn.execute(
        """
        SELECT l.id, l.connector_id, c.display_name AS connector_name, c.provider, l.sku, l.packaging, l.match_state,
               l.match_reason, o.fetched_at, o.stock, o.incoming, o.moq, o.order_multiple, o.price_breaks, o.currency,
               o.lead_time_days, o.lifecycle, o.discontinued, o.rohs, o.reach_affected, o.marketplace, o.product_url,
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

    policy = watch_row["watch_packaging"] or "any"
    counted = [dict(r) for r in rows if r["match_state"] in _COUNTED and r["fetched_at"] is not None]
    combined = stock.aggregate(counted, policy) if counted else None
    lifecycle = worst_lifecycle(Lifecycle(r["lifecycle"]) for r in counted)
    names = {r["connector_id"]: r["connector_name"] for r in rows}
    providers = {r["connector_id"]: r["provider"] for r in rows}
    problem = _problems(conn, [part_id])[part_id] if combined is None else None

    def iso(value: datetime | None) -> str | None:
        return value.isoformat() if value else None

    listings = []
    for r in rows:
        has_offer = r["fetched_at"] is not None
        listings.append({
            "id": r["id"],
            "connector_id": r["connector_id"],
            "connector_name": r["connector_name"],
            "provider": r["provider"],
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
                "reach_affected": r["reach_affected"],
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

    days = history(conn, part_id, now)
    price_view = prices.view(prices.daily_cheapest(conn, part_id, now, prices.CHART_DAYS), now.date())
    sheet = conn.execute("SELECT markers FROM datasheets WHERE part_id = %s ORDER BY version DESC LIMIT 1", (part_id,)).fetchone()
    return {
        "part": {"id": part.id, "mpn": part.mpn, "manufacturer": part.manufacturer_name},
        "watch": _watch_dto(watch_row),
        "status": part_status(combined.total if combined else None, watch_row["threshold"], lifecycle, problem).value,
        "problem": problem,
        "problem_text": PROBLEM_LABEL.get(problem or "", ""),
        "stock": {
            "total": combined.total if combined else None,
            "by_connector": [
                {"connector_id": cid, "connector_name": names.get(cid, ""), "provider": providers.get(cid, ""), "stock": value}
                for cid, value in (combined.by_connector.items() if combined else [])
            ],
        },
        "lifecycle": lifecycle.value,
        "listings": listings,
        "history": days,
        "price": price_view,
        "parameters": parameters_of(conn, part_id),
        "outlook": outlook.outlook(
            lifecycle,
            [item["offer"] for item in listings if item["counted"] and item["offer"]],
            datasheet_markers=list(sheet["markers"]) if sheet else [],
            zero_stock_days=outlook.trailing_zero_days(days),
            price_change_percent=(price_view["trend"] or {}).get("change_percent"),
            notices=pcn.for_part(conn, part_id),
            last_buy_dates=[
                (source["source"], source["value"])
                for item in facts.for_part(conn, part_id) if item["name"] == "last_buy_date" for source in item["sources"]
            ],
        ),
        "used_in": usage.used_in(conn, part_id, role),
        "insight": insight_from(days, watch_row["threshold"], now),
    }

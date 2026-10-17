"""Read models for the Parts screen: a list of parts and the detail of one.

Reads only. Counting rules are the ones in ``stock`` (exact and manual listings,
no marketplace stock, pooling per provider). A part with a watch is "watched".
"""

from __future__ import annotations

import json
import statistics
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Callable, Literal

from app.services.supply import facts, insights, outlook, params, part_insights, parts, pcn, preferences, price_behaviour, trade_marks, prices, pricing, promises, settle, stock, usage
from app.services.supply.part_status import (
    PROBLEM_LABEL, STATUS_ORDER, part_problem, part_status, worst_lifecycle,
)
from app.services.supply.tiers import SCHEDULES
from app.services.supply.vocabulary import Lifecycle

# watched: tracked at tier 1 or 2; tier1 and tier2 narrow that; waiting: waits for room at a distributor; pick: has several
# listings at a distributor and no packaging picked.
Scope = Literal["watched", "followed", "in_use", "all", "tier1", "tier2", "waiting", "pick"]
Filter = Literal[
    "", "at_risk", "out_of_stock", "lifecycle", "runs_out_2w", "runs_out_8w", "runs_out_later", "steady", "few_readings", "draining",
    "restock_late", "often_out", "one_distributor", "lead_up", "unusual_drop", "price_moving",
]
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
# Most often first: the schedule a part is read on.
_TIER_ORDER = list(SCHEDULES)
_STATUS_RANK = {status.value: rank for rank, status in enumerate(STATUS_ORDER)}


def _like(text: str) -> str:
    """A contains-pattern for ILIKE with the user's own wildcards made literal."""

    escaped = text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def _tracking_dto(row) -> dict[str, Any] | None:
    """Whether Prism follows the part and why: tier 1 or 2, how often, and the reasons (a project, a person, a component)."""

    if row["tracking_tier"] is None:
        return None
    return {"tier": int(row["tracking_tier"]), "rate": row["tracking_rate"], "reasons": row["tracking_reasons"]}


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


_USES = "FROM " + usage.ALL_USES + " u JOIN bom_usage_projects up ON up.project_id = u.project_id WHERE " + usage.MATCHES_PART + " AND " + usage.VISIBLE
_IN_USE = "EXISTS (SELECT 1 " + _USES + ")"

_ROW_SELECT = (
    "SELECT p.id, p.mpn, m.name AS manufacturer, m.provisional AS maker_provisional, w.id AS watch_id, w.threshold, w.pinned, w.owner, w.packaging AS watch_packaging, "
    "pt.tier AS tracking_tier, pt.rate AS tracking_rate, pt.reasons AS tracking_reasons, "
    "(SELECT COUNT(DISTINCT u.project_id) " + _USES + ") AS used_in "
    "FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id LEFT JOIN watches w ON w.part_id = p.id "
    "LEFT JOIN part_tiers pt ON pt.part_id = p.id "
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
          AND NOT EXISTS (SELECT 1 FROM packaging_picks pk WHERE pk.part_id = l.part_id AND pk.connector_id = l.connector_id AND pk.listing_id <> l.id)
        """,
        (part_ids, list(_COUNTED)),
    ).fetchall():
        offers[row["part_id"]].append(dict(row))
    return offers


def _offer_summary(offers_here: list[dict], policy: str, problem: str | None) -> dict[str, Any]:
    """What a part's counted offers add up to. This is what ``part_summaries`` keeps."""

    combined = stock.aggregate(offers_here, policy) if offers_here else None
    lifecycle = worst_lifecycle(Lifecycle(o["lifecycle"]) for o in offers_here)
    price, currency, price_quantity = _cheapest([o for o in offers_here if not o["marketplace"]])
    tiers = [o["tier"] for o in offers_here if o["tier"]]
    return {
        "problem": problem if combined is None else None,
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
    }


def _computed(conn, rows, offers: dict[str, list[dict]]) -> dict[str, dict[str, Any]]:
    problems = _problems(conn, [r["id"] for r in rows])
    return {
        row["id"]: _offer_summary(
            [o for o in offers.get(row["id"], []) if stock.counts(o["packaging"], row["watch_packaging"] or "any")],
            row["watch_packaging"] or "any", problems.get(row["id"]),
        )
        for row in rows
    }


def _cached(conn, rows) -> dict[str, dict[str, Any]]:
    """The offer summaries of these parts: kept ones as they are, stale or missing ones worked out and kept."""

    ids = [r["id"] for r in rows]
    # A kept summary is current while no change of its part came from a transaction still running when it was worked out.
    fresh = {
        r["part_id"]: r["data"] for r in conn.execute(
            """
            SELECT s.part_id, s.data FROM part_summaries s
            WHERE s.part_id = ANY(%s) AND s.snap > 0
              AND NOT EXISTS (SELECT 1 FROM summary_dirty d WHERE d.part_id = s.part_id AND d.xid >= s.snap)
            """,
            (ids,),
        ).fetchall()
    }
    todo = [r for r in rows if r["id"] not in fresh]
    if todo:
        snap = conn.execute("SELECT pg_snapshot_xmin(pg_current_snapshot())::text::bigint AS n").fetchone()["n"]
        found = _computed(conn, todo, offers_by_part(conn, [r["id"] for r in todo]))
        for row in todo:
            # Keeping it is a favour to the next reader: never wait for a row another transaction holds.
            mine = conn.execute("SELECT part_id FROM part_summaries WHERE part_id = %s FOR UPDATE SKIP LOCKED", (row["id"],)).fetchone()
            data = json.dumps(found[row["id"]])
            if mine:
                conn.execute(
                    "UPDATE part_summaries SET data = %s::jsonb, snap = %s, computed_at = NOW() WHERE part_id = %s",
                    (data, max(snap, 1), row["id"]),
                )
            else:
                conn.execute(
                    "INSERT INTO part_summaries (part_id, data, snap, computed_at) VALUES (%s, %s::jsonb, %s, NOW()) ON CONFLICT DO NOTHING",
                    (row["id"], data, max(snap, 1)),
                )
        fresh.update(found)
    return fresh


def _summaries(conn, rows, offers: dict[str, list[dict]] | None = None) -> list[dict[str, Any]]:
    """The list-row summary of each part row: status, stock, price, lifecycle, tier.

    With ``offers`` given they are used as they are. Without, the offer summaries are read from ``part_summaries``.
    """

    ids = [r["id"] for r in rows]
    sums = _computed(conn, rows, offers) if offers is not None else _cached(conn, rows)
    jlc = facts.jlc_classes(conn, ids)

    items = []
    for row in rows:
        mine = sums[row["id"]]
        lifecycle = Lifecycle(mine["lifecycle"])
        items.append({
            "id": row["id"],
            "mpn": row["mpn"],
            "manufacturer": row["manufacturer"],
            # Written by a person or a BOM and not yet confirmed by a distributor's answer.
            "manufacturer_provisional": bool(row["maker_provisional"]),
            "watch": _watch_dto(row),
            "tracking": _tracking_dto(row),
            "status": part_status(mine["stock"], row["threshold"], lifecycle, mine["problem"]).value,
            **mine,
            "used_in": int(row["used_in"]),
            "jlc": jlc.get(row["id"]),
        })
    return items


def summaries_for(conn, part_ids: list[str]) -> list[dict[str, Any]]:
    """Summaries of the given parts, in no particular order. Reads the kept offer summaries; no offers are loaded."""

    if not part_ids:
        return []
    rows = conn.execute(_ROW_SELECT + "WHERE p.id = ANY(%s)", [*usage.role_params(None), list(part_ids)]).fetchall()
    return _summaries(conn, rows)


def summaries_with_offers(conn, part_ids: list[str], role: str | None = None) -> tuple[list[dict[str, Any]], dict[str, list[dict]]]:
    """Summaries of the given parts and the counted offers behind them, for callers that price.

    A watch counts one packaging when it says so (cut tape for prototypes), and the offers returned follow it, so a
    purchase suggestion and the checks never use a packaging the watch leaves out.
    """

    if not part_ids:
        return [], {}
    rows = conn.execute(_ROW_SELECT + "WHERE p.id = ANY(%s)", [*usage.role_params(role), list(part_ids)]).fetchall()
    offers = offers_by_part(conn, [row["id"] for row in rows])
    counted = {
        row["id"]: [o for o in offers.get(row["id"], []) if stock.counts(o["packaging"], row["watch_packaging"] or "any")]
        for row in rows
    }
    return _summaries(conn, rows, counted), counted


def ranked_parts(conn, *, scope: Scope = "watched", query: str = "", role: str | None = None) -> tuple[list[dict[str, Any]], int]:
    """Every matching part (up to ``MAX_CANDIDATES``), the ones that need a look first, and the true count."""

    conditions = [{
        "all": "TRUE", "watched": "pt.part_id IS NOT NULL", "in_use": "(" + _IN_USE + ")",
        "followed": "(pt.part_id IS NOT NULL OR " + _IN_USE + ")",
        "tier1": "pt.tier = 1", "tier2": "pt.tier = 2",
        "waiting": "EXISTS (SELECT 1 FROM admissions ad WHERE ad.part_id = p.id AND ad.state = 'waiting')",
        "pick": "pt.part_id IS NOT NULL AND EXISTS (SELECT 1 FROM listings pl WHERE pl.part_id = p.id AND pl.match_state IN ('exact', 'manual') "
                "AND NOT EXISTS (SELECT 1 FROM packaging_picks pk WHERE pk.part_id = pl.part_id AND pk.connector_id = pl.connector_id) "
                "GROUP BY pl.connector_id HAVING COUNT(*) > 1)",
    }[scope]]
    params: list[Any] = usage.role_params(role) if scope in ("in_use", "followed") else []
    text = query.strip()
    if text:
        conditions.append("(p.mpn ILIKE %s OR m.name ILIKE %s)")
        params += [_like(text), _like(text)]
    where = " AND ".join(conditions)
    total = conn.execute(
        f"SELECT COUNT(*) AS n FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id "
        f"LEFT JOIN watches w ON w.part_id = p.id LEFT JOIN part_tiers pt ON pt.part_id = p.id WHERE {where}", params,
    ).fetchone()["n"]
    rows = conn.execute(
        _ROW_SELECT + f"WHERE {where} ORDER BY lower(m.name), lower(p.mpn) LIMIT %s", [*usage.role_params(role), *params, MAX_CANDIDATES],
    ).fetchall()
    items = _summaries(conn, rows)
    # The sort is stable, so parts of equal status keep their name order.
    items.sort(key=lambda item: _STATUS_RANK[item["status"]])
    return items, int(total)


NO_PROJECT = "none"


def _projects_of(conn, part_ids: list[str], role: str | None) -> dict[str, set[str]]:
    """The projects (that ``role`` may see) whose BOM carries each part."""

    found: dict[str, set[str]] = {}
    if not part_ids:
        return found
    rows = conn.execute(
        "SELECT DISTINCT p.id AS part_id, u.project_id FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id "
        "JOIN " + usage.ALL_USES + " u ON " + usage.MATCHES_PART + " JOIN bom_usage_projects up ON up.project_id = u.project_id "
        "WHERE p.id = ANY(%s) AND " + usage.VISIBLE,
        [part_ids, *usage.role_params(role)],
    ).fetchall()
    for row in rows:
        found.setdefault(row["part_id"], set()).add(row["project_id"])
    return found


def part_groups(
    conn, *, scope: Scope = "watched", query: str = "", role: str | None = None, only: Filter = "",
) -> dict[str, Any]:
    """The parts that match, grouped by the projects that use them: tracked projects first, then by what needs a look.

    A part in two projects is in both. Parts no visible project uses are the group ``none``.
    """

    items, _total = ranked_parts(conn, scope=scope, query=query, role=role)
    if only:
        items = _only(conn, items, only)
    of = _projects_of(conn, [item["id"] for item in items], role)
    groups: dict[str, dict[str, Any]] = {}
    for item in items:
        for project_id in of.get(item["id"]) or {NO_PROJECT}:
            group = groups.setdefault(project_id, {"project_id": project_id, "count": 0, "statuses": {}})
            group["count"] += 1
            group["statuses"][item["status"]] = group["statuses"].get(item["status"], 0) + 1
    named = {}
    tracked: set[str] = set()
    for key, group in groups.items():
        group["members"] = [item for item in items if key in (of.get(item["id"]) or {NO_PROJECT})]
    real = [key for key in groups if key != NO_PROJECT]
    if real:
        named = {row["project_id"]: row["project_name"] for row in conn.execute(
            "SELECT project_id, project_name FROM bom_usage_projects WHERE project_id = ANY(%s)", (real,)).fetchall()}
        tracked = {row["project_id"] for row in conn.execute(
            "SELECT project_id FROM tracked_projects WHERE project_id = ANY(%s)", (real,)).fetchall()}
    for key, group in groups.items():
        group["project_name"] = "Not in a project" if key == NO_PROJECT else (named.get(key) or key)
        group["tracked"] = key in tracked
        group["worst"] = min((_STATUS_RANK[status] for status in group["statuses"]), default=len(_STATUS_RANK))
    ordered = sorted(
        groups.values(),
        key=lambda group: (group["project_id"] == NO_PROJECT, not group["tracked"], group["worst"], group["project_name"].lower()),
    )
    kept = part_insights.of_parts(conn, [item["id"] for item in items])
    for group in ordered:
        del group["worst"]
        group["stats"] = _group_stats(conn, group, kept)
        del group["members"]
    return {"groups": ordered, "total": len(items)}


def _group_stats(conn, group: dict[str, Any], kept: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """What a project row shows closed: the counts that need a look, and for a tracked project its cost, boards, BOM age and alerts."""

    members = group["members"]
    facts = [kept.get(item["id"]) or {} for item in members]
    stats: dict[str, Any] = {
        "at_risk": sum(1 for item in members if item["status"] in ("error", "fatal")),
        "out": sum(1 for item in members if item["stock"] == 0),
        "end_of_life": sum(1 for item in members if item["lifecycle"] not in ("active", "unknown")),
        "one_distributor": sum(1 for data in facts if data.get("holders") == 1),
        "runs_out_soon": sum(1 for data in facts if data.get("days_to_zero") is not None and data["days_to_zero"] <= 14),
    }
    project_id = group["project_id"]
    if project_id == NO_PROJECT:
        return stats
    read = conn.execute("SELECT updated_at FROM bom_usage_projects WHERE project_id = %s", (project_id,)).fetchone()
    stats["bom_read_at"] = read["updated_at"].isoformat() if read and read["updated_at"] else None
    if not group["tracked"]:
        return stats
    tracked = conn.execute("SELECT variants, all_variants, packaging FROM tracked_projects WHERE project_id = %s", (project_id,)).fetchone()
    stats["variants"] = list(tracked["variants"]) if tracked else []
    stats["all_variants"] = bool(tracked and tracked["all_variants"])
    stats["packaging"] = tracked["packaging"] if tracked else None
    latest = conn.execute(
        "SELECT day, cost_per_board, currency, rollup FROM bom_cost_history WHERE project_id = %s AND variant = %s ORDER BY day DESC LIMIT 1",
        (project_id, (tracked["variants"] or [""])[0] if tracked else ""),
    ).fetchone()
    if latest:
        before = conn.execute(
            "SELECT cost_per_board FROM bom_cost_history WHERE project_id = %s AND variant = %s AND day <= %s ORDER BY day DESC LIMIT 1",
            (project_id, (tracked["variants"] or [""])[0], latest["day"] - timedelta(days=30)),
        ).fetchone()
        stats["cost_per_board"] = format(latest["cost_per_board"], "f")
        stats["currency"] = latest["currency"]
        stats["cost_change_percent"] = (
            round((float(latest["cost_per_board"]) - float(before["cost_per_board"])) / float(before["cost_per_board"]) * 100, 1)
            if before and before["cost_per_board"] else None
        )
        stats["boards"] = (latest["rollup"] or {}).get("can_build")
    stats["alerts"] = int(conn.execute(
        "SELECT COUNT(*) AS n FROM alerts WHERE state = 'open' AND part_id = ANY(%s)", ([item["id"] for item in members],)).fetchone()["n"])
    return stats


def _only(conn, items: list[dict[str, Any]], only: str) -> list[dict[str, Any]]:
    """The parts a group applies to: a status or stock group from the rows themselves, a finding from the kept insights."""

    if only in FILTERS:
        return [item for item in items if FILTERS[only](item)]
    keep = part_insights.matching(conn, only)
    return [item for item in items if item["id"] in keep]


def list_parts(
    conn, *, scope: Scope = "watched", query: str = "", limit: int = 100, role: str | None = None, only: Filter = "", offset: int = 0,
    project_id: str = "",
) -> dict[str, Any]:
    """Parts that need a look first (worst status), then by name. ``only`` keeps one group of them; ``project_id`` the parts of
    one project (``none`` for those in no project)."""

    limit = max(1, min(limit, MAX_LIMIT))
    items, total = ranked_parts(conn, scope=scope, query=query, role=role)
    if only:
        items = _only(conn, items, only)
        total = len(items)
    if project_id:
        of = _projects_of(conn, [item["id"] for item in items], role)
        items = [item for item in items if (project_id in of.get(item["id"], set()) if project_id != NO_PROJECT else not of.get(item["id"]))]
        total = len(items)
    offset = max(0, offset)
    page = items[offset:offset + limit]
    kept = part_insights.of_parts(conn, [item["id"] for item in page])
    extras = _row_extras(conn, page, kept, role)
    page = [
        item | ({"spark": kept[item["id"]]["spark"], "runs_out_days": kept[item["id"]]["days_to_zero"]} if item["id"] in kept else {}) | extras[item["id"]]
        for item in page
    ]
    more = offset + limit < total
    return {"items": page, "total": total, "limit": limit, "offset": offset, "next_offset": offset + limit if more else None}


def _parts_with_alternate(conn) -> set[str]:
    """The parts that are the primary of a catalog component with at least one approved alternate."""

    from app.services.supply import catalog_read

    components = [row["component_id"] for row in conn.execute("SELECT DISTINCT component_id FROM component_sources WHERE approval = 'approved'").fetchall()]
    if not components:
        return set()
    found = set()
    for maker, mpn in catalog_read.identities(components).values():
        primary = parts.find_part(conn, maker, mpn) if maker and mpn else None
        if primary:
            found.add(primary.id)
    return found


def _row_extras(conn, page: list[dict[str, Any]], kept: dict[str, dict[str, Any]], role: str | None) -> dict[str, dict[str, Any]]:
    """What a row shows beyond the summary: the first projects, the distributors that list the part, the price move, the lead time, flags."""

    ids = [item["id"] for item in page]
    projects = _projects_of(conn, ids, role)
    names = {}
    wanted = {project for found in projects.values() for project in found}
    if wanted:
        names = {row["project_id"]: row["project_name"] for row in conn.execute(
            "SELECT project_id, project_name FROM bom_usage_projects WHERE project_id = ANY(%s)", (list(wanted),)).fetchall()}
    offers = offers_by_part(conn, ids)
    waiting = {row["part_id"] for row in conn.execute("SELECT DISTINCT part_id FROM admissions WHERE state = 'waiting' AND part_id = ANY(%s)", (ids,)).fetchall()}
    preferred = preferences.of_parts(conn, ids)
    stated: dict[str, dict[str, set[str]]] = {}
    for row in conn.execute(
        "SELECT part_id, name, value FROM part_facts WHERE name IN ('ncnr', 'normally_stocking') AND part_id = ANY(%s)", (ids,)
    ).fetchall():
        stated.setdefault(row["part_id"], {}).setdefault(row["name"], set()).add(row["value"].strip().lower())
    with_alternate = _parts_with_alternate(conn)
    extras = {}
    for item in page:
        here = [offer for offer in offers.get(item["id"], []) if not offer["marketplace"]]
        by_connector: dict[str, dict[str, Any]] = {}
        for offer in here:
            entry = by_connector.setdefault(offer["connector_id"], {"connector_id": offer["connector_id"], "provider": offer["provider"], "name": offer["connector_name"], "stock": 0, "price": None, "currency": ""})
            entry["stock"] += int(offer["stock"] or 0)
            price, currency, _quantity = _cheapest([offer])
            if price is not None and (entry["price"] is None or Decimal(price) < Decimal(entry["price"])):
                entry["price"], entry["currency"] = price, currency
        flags = []
        if item["id"] in waiting:
            flags.append("waiting")
        if any(offer["rohs"] is False for offer in here):
            flags.append("rohs")
        if any(offer["reach_affected"] for offer in here):
            flags.append("reach")
        if "yes" in stated.get(item["id"], {}).get("ncnr", set()):
            flags.append("ncnr")
        if "no" in stated.get(item["id"], {}).get("normally_stocking", set()):
            flags.append("not_stocked")
        if item["status"] in ("error", "fatal") and item["id"] not in with_alternate:
            flags.append("no_alternate")
        facts_here = kept.get(item["id"]) or {}
        projects_here = sorted(names.get(project) or project for project in projects.get(item["id"], set()))
        extras[item["id"]] = {
            "project_names": projects_here[:2],
            "distributors": sorted(by_connector.values(), key=lambda entry: entry["name"].lower()),
            "preferred_connector_id": preferred.get(item["id"]),
            "price_change_percent": facts_here.get("price_change_percent"),
            "lead_days": facts_here.get("lead_days"),
            "flags": flags,
        }
    return extras


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
        holding = [amount for amount in combined.by_connector.values() if amount > 0]
        series.append({
            "day": day.isoformat(), "stock": combined.total, "listings": combined.listings, "sources": len(holding),
            "concentration": sum((amount / combined.total) ** 2 for amount in holding) if combined.total > 0 else None,
        })
        day += timedelta(days=1)
    return series


LEAD_TREND_DAYS = 90
LEAD_TREND_WINDOW_DAYS = 14
LEAD_TREND_MIN_CHANGE_DAYS = 7


def lead_time_trend(conn, part_id: str, now: datetime) -> dict[str, Any] | None:
    """How the quoted lead time moved over the last 90 days: the median of the first two weeks of readings against the last two.
    None without lead times in both windows, or when the change is under a week."""

    rows = conn.execute(
        """
        SELECT s.sampled_at, s.lead_time_days FROM samples s JOIN listings l ON l.id = s.listing_id
        WHERE l.part_id = %s AND s.lead_time_days IS NOT NULL AND s.sampled_at >= %s ORDER BY s.sampled_at
        """,
        (part_id, now - timedelta(days=LEAD_TREND_DAYS)),
    ).fetchall()
    if len(rows) < 2:
        return None
    window = timedelta(days=LEAD_TREND_WINDOW_DAYS)
    first = [row["lead_time_days"] for row in rows if row["sampled_at"] <= rows[0]["sampled_at"] + window]
    last = [row["lead_time_days"] for row in rows if row["sampled_at"] >= rows[-1]["sampled_at"] - window]
    if rows[-1]["sampled_at"] - rows[0]["sampled_at"] < window * 2:
        return None
    before, after = statistics.median(first), statistics.median(last)
    if abs(after - before) < LEAD_TREND_MIN_CHANGE_DAYS:
        return None
    return {"before": round(before), "after": round(after), "since": rows[0]["sampled_at"].date().isoformat()}


def _alternate_for(conn, part_id: str) -> list[dict[str, Any]]:
    """For each catalog component that lists this part as an approved alternate, what its parts hold together."""

    from app.services.supply import catalog_read, sources

    found = []
    for component_id in sources.components_with_alternate(conn, part_id):
        maker, mpn = catalog_read.identities([component_id]).get(component_id, ("", ""))
        primary = parts.find_part(conn, maker, mpn) if maker and mpn else None
        found.append(sources.coverage(conn, component_id, primary.id if primary else None) | {"component": f"{maker} {mpn}".strip()})
    return found


def _first_seen(conn, part_id: str) -> str | None:
    """The day Prism first knew the part: a rough age, since parts are created when first searched for."""

    row = conn.execute("SELECT created_at FROM parts WHERE id = %s", (part_id,)).fetchone()
    return row["created_at"].date().isoformat() if row else None


def _with_lead_gap(insight: dict[str, Any], listings: list[dict[str, Any]], trend: dict[str, Any] | None = None) -> dict[str, Any]:
    """Add how far ahead of the soonest restock stock is expected to run out: the shortest lead time any counted listing quotes."""

    leads = [item["offer"]["lead_time_days"] for item in listings if item["counted"] and item["offer"] and item["offer"].get("lead_time_days")]
    return insight | {"lead_gap_days": insights.lead_gap_days(insight, min(leads) if leads else None), "lead_time_trend": trend}


def insight_from(days: list[dict[str, Any]], threshold: int | None, now: datetime) -> dict[str, Any]:
    """What the daily history says (see ``insights``)."""

    points = [
        insights.Point(date.fromisoformat(day["day"]), day["stock"], day["listings"], day.get("sources"), day.get("concentration"))
        for day in days
    ]
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
    listed = [
        {
            "name": item.name, "raw": item.raw, "key": item.key, "unit": item.unit,
            "value": format(item.value.normalize(), "f") if item.value is not None else None,
            "sources": sources.get((item.name.lower(), item.raw), []),
        }
        for item in params.normalise(first_seen)
    ]
    # What a distributor files the part under is not a compliance fact; it is listed here, as the distributor wrote it.
    for fact in facts.for_part(conn, part_id):
        if fact["name"] in facts.NOT_COMPLIANCE:
            for value in dict.fromkeys(source["value"] for source in fact["sources"]):
                listed.append({
                    "name": fact["label"], "raw": value, "key": None, "unit": None, "value": None,
                    "sources": [source["provider"] for source in fact["sources"] if source["value"] == value],
                })
    return listed


def _packaging_state(conn, part_id: str) -> dict[str, Any]:
    """The picks on a part (listing per distributor), and the distributors where it still waits for one."""

    pick_rows = conn.execute("SELECT connector_id, listing_id, picked_by, note FROM packaging_picks WHERE part_id = %s", (part_id,)).fetchall()
    picks = {row["connector_id"]: row["listing_id"] for row in pick_rows}
    counts = conn.execute(
        "SELECT l.connector_id, c.display_name, COUNT(*) AS n FROM listings l JOIN connectors c ON c.id = l.connector_id "
        "WHERE l.part_id = %s AND l.match_state = ANY(%s) GROUP BY l.connector_id, c.display_name HAVING COUNT(*) > 1",
        (part_id, list(_COUNTED)),
    ).fetchall()
    tracked = conn.execute("SELECT 1 FROM part_tiers WHERE part_id = %s", (part_id,)).fetchone() is not None
    return {
        "picks": picks,
        # Who picked each (a person, or "auto" for Prism) and what Prism noted when it fell back.
        "picked_by": {row["connector_id"]: {"by": row["picked_by"], "note": row["note"]} for row in pick_rows},
        "needs_pick": [
            {"connector_id": r["connector_id"], "connector": r["display_name"], "listings": int(r["n"])}
            for r in counts if tracked and r["connector_id"] not in picks
        ],
    }


def part_detail(conn, part_id: str, *, now: datetime | None = None, role: str | None = None) -> dict[str, Any]:
    now = now or datetime.now(timezone.utc)
    part = parts.get_part(conn, part_id)
    watch_row = conn.execute(
        "SELECT w.id AS watch_id, w.threshold, w.pinned, w.owner, w.packaging AS watch_packaging, "
        "pt.tier AS tracking_tier, pt.rate AS tracking_rate, pt.reasons AS tracking_reasons "
        "FROM parts p LEFT JOIN watches w ON w.part_id = p.id LEFT JOIN part_tiers pt ON pt.part_id = p.id WHERE p.id = %s",
        (part_id,),
    ).fetchone()

    rows = conn.execute(
        """
        SELECT l.id, l.connector_id, c.display_name AS connector_name, c.provider, l.sku, COALESCE(NULLIF(o.packaging, 'unknown'), l.packaging) AS packaging,
               o.reel_size, o.packaging_inferred, l.match_state,
               l.match_reason, l.raw_mpn, l.raw_manufacturer, o.fetched_at, o.stock, o.incoming, o.moq, o.order_multiple, o.price_breaks, o.currency,
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
            "reel_size": r["reel_size"],
            "packaging_inferred": bool(r["packaging_inferred"]),
            "match_state": r["match_state"],
            "raw_mpn": r["raw_mpn"] or "",
            "raw_manufacturer": r["raw_manufacturer"] or "",
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
    return {
        "part": {"id": part.id, "mpn": part.mpn, "manufacturer": part.manufacturer_name, "first_seen": _first_seen(conn, part_id)},
        "watch": _watch_dto(watch_row),
        "tracking": _tracking_dto(watch_row),
        "packaging": _packaging_state(conn, part_id),
        "preferred_connector_id": preferences.get(conn, part_id),
        "trade": trade_marks.state(conn, part_id),
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
            zero_stock_days=outlook.trailing_zero_days(days),
            price_change_percent=(price_view["trend"] or {}).get("change_percent"),
            notices=pcn.for_part(conn, part_id),
            last_buy_dates=[
                (source["source"], source["value"])
                for item in facts.for_part(conn, part_id) if item["name"] == "last_buy_date" for source in item["sources"]
            ],
        ),
        "numbers": parts.list_numbers(conn, part_id),
        "sold_as": settle.sold_as(conn, part_id),
        "used_in": usage.used_in(conn, part_id, role),
        "jlc": facts.jlc_classes(conn, [part_id]).get(part_id),
        "alternate_for": _alternate_for(conn, part_id),
        "market_behaviour": price_behaviour.load(conn, part_id, now) | {"arrivals": promises.reliability(conn, part_id, now.date())},
        "insight": _with_lead_gap(insight_from(days, watch_row["threshold"], now), listings, lead_time_trend(conn, part_id, now)),
    }

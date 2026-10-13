"""Planning: for every part with open demand, whether stock covers it and the first date it does not.

Supply is our own stock plus what the distributors hold now (counted, non-marketplace). Demand is read in date
order. A negative demand is stock already on its way in: it adds supply from its date (from the start when it has
none). The shortage date is the first dated demand at which the demand so far is more than the supply so far;
demand without a date is added last. Nothing here buys anything: it only says where the plan runs short.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any, Callable, Iterable, Mapping, Sequence

from app.services.supply import demand, parts_view

OwnStock = Callable[[Iterable[tuple[str, str]]], Mapping[tuple[str, str], int | None]]


@dataclass(frozen=True, slots=True)
class Entry:
    quantity: int
    need_by: date | None
    state: str


def shortage(entries: Sequence[Entry], supply_now: int) -> dict[str, Any]:
    """Where demand first outruns supply. ``supply_now`` is own plus distributor stock."""

    incoming_from_start = sum(-e.quantity for e in entries if e.quantity < 0 and e.need_by is None)
    dated_incoming = sorted((e.need_by, -e.quantity) for e in entries if e.quantity < 0 and e.need_by is not None)
    dated_demand = sorted((e.need_by, e.quantity) for e in entries if e.quantity > 0 and e.need_by is not None)
    undated_demand = sum(e.quantity for e in entries if e.quantity > 0 and e.need_by is None)

    def supply_by(day: date) -> int:
        return supply_now + incoming_from_start + sum(amount for when, amount in dated_incoming if when <= day)

    needed = 0
    first: date | None = None
    short_by = 0
    for day, quantity in dated_demand:
        needed += quantity
        gap = needed - supply_by(day)
        if gap > 0 and first is None:
            first, short_by = day, gap
    total_gap = needed + undated_demand - (supply_now + incoming_from_start + sum(amount for _, amount in dated_incoming))
    return {
        "short": first is not None or total_gap > 0,
        "first_short_on": first.isoformat() if first else None,
        "short_by": short_by if first else max(total_gap, 0),
        "total_short_by": max(total_gap, 0),
    }


MAX_WEEKS = 26


def weekly(entries: Sequence[Entry], supply_now: int) -> list[dict[str, Any]]:
    """Week by week, from the week of the first dated entry: demand, stock arriving, and what is left after both.

    ``balance`` starts from what is held (and incoming stock with no date) and ends each week less the demand so far plus
    the arrivals so far; below 0 the plan is short that week. Demand without a date is not in any week. At most
    ``MAX_WEEKS`` weeks are given.
    """

    dated = [e for e in entries if e.need_by is not None]
    if not dated:
        return []
    first = min(e.need_by for e in dated)
    start = first - timedelta(days=first.weekday())
    balance = supply_now + sum(-e.quantity for e in entries if e.quantity < 0 and e.need_by is None)
    last = max(e.need_by for e in dated)
    weeks: list[dict[str, Any]] = []
    cursor = start
    while cursor <= last and len(weeks) < MAX_WEEKS:
        end = cursor + timedelta(days=7)
        needs = sum(e.quantity for e in dated if e.quantity > 0 and cursor <= e.need_by < end)
        arrives = sum(-e.quantity for e in dated if e.quantity < 0 and cursor <= e.need_by < end)
        balance += arrives - needs
        weeks.append({"week": cursor.isoformat(), "demand": needs, "incoming": arrives, "balance": balance})
        cursor = end
    return weeks


def compute(conn, own_stock: OwnStock | None = None) -> dict[str, Any]:
    """One row per part with open demand: the plan against what is held. Shortages first, the soonest first."""

    rows = conn.execute(
        """
        SELECT d.part_id, d.quantity, d.need_by, d.state FROM demands d WHERE d.state = ANY(%s) ORDER BY d.part_id, d.need_by NULLS LAST
        """,
        (list(demand.OPEN_STATES),),
    ).fetchall()
    by_part: dict[str, list[Entry]] = {}
    for row in rows:
        by_part.setdefault(row["part_id"], []).append(Entry(row["quantity"], row["need_by"], row["state"]))
    items, _offers = parts_view.summaries_with_offers(conn, sorted(by_part))
    own = own_stock([(item["manufacturer"], item["mpn"]) for item in items]) if own_stock and items else {}
    planned: list[dict[str, Any]] = []
    for item in items:
        entries = by_part[item["id"]]
        own_here = own.get((item["manufacturer"].strip().casefold(), item["mpn"].strip().casefold()))
        held = item["stock"] or 0
        result = shortage(entries, held + (own_here or 0))
        dated = sorted(e.need_by for e in entries if e.quantity > 0 and e.need_by)
        planned.append({
            "part_id": item["id"], "manufacturer": item["manufacturer"], "mpn": item["mpn"], "status": item["status"],
            "needed": sum(e.quantity for e in entries if e.quantity > 0),
            "incoming": sum(-e.quantity for e in entries if e.quantity < 0),
            "committed": sum(e.quantity for e in entries if e.quantity > 0 and e.state == "committed"),
            "own_stock": own_here, "distributor_stock": item["stock"],
            "next_need_by": dated[0].isoformat() if dated else None, **result,
            "stock_known": item["stock"] is not None,
            "weeks": weekly(entries, held + (own_here or 0)),
        })
    planned.sort(key=lambda row: (not row["short"], row["first_short_on"] or "9999-12-31", row["next_need_by"] or "9999-12-31", row["mpn"].lower()))
    return {"parts": planned, "short": sum(1 for row in planned if row["short"])}

"""A part's stock across distributors, counting only what should count.

Only ``exact`` and ``manual`` listings count. Marketplace stock is left out.
Within one connector, packaging variants of a part may share a single stock
pool (cut tape and reel drawn from the same shelf): the provider declares
whether its stock is ``pooled`` (take the largest of all its listings) or ``separate``.
Of a ``separate`` provider, cut tape and custom reel (Digi-Reel, MouseReel, a re-reel) are one pile and the largest counts;
a full reel, a tray or a tube is a pile of its own and adds.
Across connectors the figures add, because they are different warehouses.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Iterable, Mapping

from app.services.supply.providers import registry


# A watch can count only one packaging: cut tape for prototypes, reel for production. "any" counts all.
POLICIES = ("any", "cut_tape", "custom_reel", "tape_reel", "tray", "tube", "bulk")


# Packagings cut from the same stock: of these only the largest figure counts.
ONE_PILE = frozenset({"cut_tape", "custom_reel"})


def counted_listing_sql(listing: str = "l", connector: str = "c") -> str:
    """SQL for "this listing counts toward stock": every listing, except where a pick limits what is read (LCSC, JLCPCB: the others
    are not read, so their figures are old) and the part has a pick elsewhere. One place, so the queries that count stock agree."""

    from app.services.supply import budget

    limited = ", ".join(f"'{key}'" for key in budget.providers_limited_by_picks() if key.replace("_", "").isalnum())
    return (
        f"({connector}.provider <> ALL(ARRAY[{limited}]::text[]) OR NOT EXISTS (SELECT 1 FROM packaging_picks pk "
        f"WHERE pk.part_id = {listing}.part_id AND pk.connector_id = {listing}.connector_id AND pk.listing_id <> {listing}.id))"
    )


def connector_stock(provider: str, rows: Iterable[Mapping[str, Any]]) -> int:
    """The stock of one distributor's listings of a part: the largest figure where the provider pools its stock, else one figure for
    each pile (cut tape and custom reel together, every other packaging by itself)."""

    stocks = [(row.get("packaging"), int(row["stock"])) for row in rows]
    if not stocks:
        return 0
    try:
        pooled = registry.get_spec(provider).stock_pooling == "pooled"
    except registry.UnknownProvider:
        pooled = False  # a removed plugin: add up rather than hide stock
    if pooled:
        return max(stock for _packaging, stock in stocks)
    cut = [stock for packaging, stock in stocks if packaging in ONE_PILE]
    return (max(cut) if cut else 0) + sum(stock for packaging, stock in stocks if packaging not in ONE_PILE)


def counts(packaging: str | None, policy: str) -> bool:
    """Whether a listing of this packaging counts under the watch's policy. A listing of unknown packaging does not match a specific one."""

    return policy == "any" or packaging == policy


@dataclass(frozen=True, slots=True)
class PartStock:
    total: int
    by_connector: dict[str, int] = field(default_factory=dict)
    listings: int = 0
    newest_fetched_at: datetime | None = None


def aggregate(rows: Iterable[Mapping[str, Any]], policy: str = "any") -> PartStock:
    """Combine offer rows of one part. Each row needs connector_id, provider, stock, marketplace, fetched_at,
    and ``packaging`` when ``policy`` names one: other packaging is left out of the total (but still dates it)."""

    pools: dict[str, list[Mapping[str, Any]]] = {}
    providers: dict[str, str] = {}
    counted = 0
    newest: datetime | None = None
    for row in rows:
        if newest is None or row["fetched_at"] > newest:
            newest = row["fetched_at"]
        if row["marketplace"] or not counts(row.get("packaging"), policy):
            continue
        counted += 1
        pools.setdefault(row["connector_id"], []).append(row)
        providers[row["connector_id"]] = row["provider"]

    by_connector = {connector_id: connector_stock(providers[connector_id], held) for connector_id, held in pools.items()}
    return PartStock(sum(by_connector.values()), by_connector, counted, newest)


def part_stock(conn, part_id: str) -> PartStock:
    rows = conn.execute(
        """
        SELECT l.connector_id, c.provider, o.stock, o.marketplace, o.fetched_at, o.packaging
        FROM listings l
        JOIN offers o ON o.listing_id = l.id
        JOIN connectors c ON c.id = l.connector_id
        WHERE l.part_id = %s AND l.match_state IN ('exact', 'manual') AND {counted}
        """.replace("{counted}", counted_listing_sql()),
        (part_id,),
    ).fetchall()
    watch = conn.execute("SELECT packaging FROM watches WHERE part_id = %s", (part_id,)).fetchone()
    return aggregate(rows, watch["packaging"] if watch else "any")

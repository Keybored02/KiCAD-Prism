"""A part's stock across distributors, counting only what should count.

Only ``exact`` and ``manual`` listings count. Marketplace stock is left out.
Within one connector, packaging variants of a part may share a single stock
pool (cut tape and reel drawn from the same shelf): the provider declares
whether its stock is ``pooled`` (take the largest) or ``separate`` (add up).
Across connectors the figures add, because they are different warehouses.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Iterable, Mapping

from app.services.supply.providers import registry


# A watch can count only one packaging: cut tape for prototypes, reel for production. "any" counts all.
POLICIES = ("any", "cut_tape", "tape_reel", "tray", "tube", "bulk")


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

    pools: dict[str, list[int]] = {}
    providers: dict[str, str] = {}
    counted = 0
    newest: datetime | None = None
    for row in rows:
        if newest is None or row["fetched_at"] > newest:
            newest = row["fetched_at"]
        if row["marketplace"] or not counts(row.get("packaging"), policy):
            continue
        counted += 1
        pools.setdefault(row["connector_id"], []).append(int(row["stock"]))
        providers[row["connector_id"]] = row["provider"]

    by_connector: dict[str, int] = {}
    for connector_id, stocks in pools.items():
        try:
            pooled = registry.get_spec(providers[connector_id]).stock_pooling == "pooled"
        except registry.UnknownProvider:
            pooled = False  # a removed plugin: add up rather than hide stock
        by_connector[connector_id] = max(stocks) if pooled else sum(stocks)
    return PartStock(sum(by_connector.values()), by_connector, counted, newest)


def part_stock(conn, part_id: str) -> PartStock:
    rows = conn.execute(
        """
        SELECT l.connector_id, c.provider, o.stock, o.marketplace, o.fetched_at, o.packaging
        FROM listings l
        JOIN offers o ON o.listing_id = l.id
        JOIN connectors c ON c.id = l.connector_id
        WHERE l.part_id = %s AND l.match_state IN ('exact', 'manual')
        """,
        (part_id,),
    ).fetchall()
    watch = conn.execute("SELECT packaging FROM watches WHERE part_id = %s", (part_id,)).fetchone()
    return aggregate(rows, watch["packaging"] if watch else "any")

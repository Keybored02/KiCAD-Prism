"""Will a connector's budget keep up with what is watched? Shown before it bites.

For each metered connector: the listings that would be polled, by the tier they are on now,
turned into calls a day by ``quota.estimate_capacity`` (a provider that needs two calls for a
batch of offers counts twice), against what the budget allows once the interactive reserve is
held back. Searches for watched parts not yet looked up are one-off calls and are reported
apart: they are spent first and then the steady load remains.
"""

from __future__ import annotations

from typing import Any

from app.services.supply import quota
from app.services.supply.providers import registry

# A listing not polled yet is read at once and then settles; plan for the middle.
_UNPOLLED_TIER = "warm"


def connector_capacity(conn) -> list[dict[str, Any]]:
    connectors = conn.execute(
        "SELECT id, display_name, provider, daily_budget, interactive_reserve_pct FROM connectors "
        "WHERE enabled ORDER BY lower(display_name), id"
    ).fetchall()
    tiers: dict[str, dict[str, int]] = {}
    for row in conn.execute(
        """
        SELECT connector_id, tier, COUNT(*) AS n FROM (
            SELECT l.connector_id, COALESCE(ps.tier, %s) AS tier
            FROM listings l
            JOIN watches w ON w.part_id = l.part_id
            LEFT JOIN poll_state ps ON ps.listing_id = l.id
            WHERE l.match_state IN ('exact', 'manual')
        ) listed GROUP BY connector_id, tier
        """,
        (_UNPOLLED_TIER,),
    ).fetchall():
        tiers.setdefault(row["connector_id"], {})[row["tier"]] = int(row["n"])
    unsearched = {
        row["connector_id"]: int(row["n"])
        for row in conn.execute(
            """
            SELECT c.id AS connector_id, COUNT(*) AS n
            FROM connectors c CROSS JOIN watches w
            LEFT JOIN discovery_runs d ON d.part_id = w.part_id AND d.connector_id = c.id
            WHERE d.part_id IS NULL GROUP BY c.id
            """
        ).fetchall()
    }

    result = []
    for row in connectors:
        try:
            spec = registry.get_spec(row["provider"])
        except registry.UnknownProvider:
            continue
        if not spec.metered:
            continue
        by_tier = tiers.get(row["id"], {})
        estimate = quota.estimate_capacity(
            by_tier, max_batch=spec.max_batch, daily_budget=row["daily_budget"],
            reserve_pct=row["interactive_reserve_pct"], calls_per_batch=spec.calls_per_offers_batch,
        )
        result.append({
            "connector_id": row["id"],
            "name": row["display_name"],
            "listings": sum(by_tier.values()),
            "calls_per_day": estimate.calls_per_day,
            "usable_per_day": estimate.usable_per_day,
            "shortfall_pct": estimate.shortfall_pct,
            "fits": estimate.fits,
            "searches_pending": unsearched.get(row["id"], 0),
        })
    return result

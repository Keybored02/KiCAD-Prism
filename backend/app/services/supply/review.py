"""The review queue: what matching could not settle by itself.

Two kinds of item wait for a person. A spelling a distributor used that maps to
no manufacturer yet, and a listing that is a candidate for a part but is not
proven to be it. Deciding is done with ``parts.confirm_alias`` and
``discovery.pin_listing`` / ``reject_listing``. Functions here read.
"""

from __future__ import annotations

from typing import Any

from app.services.supply import discovery, parts
from app.services.supply.identity import alias_key

_WAITING_STATES = (discovery.UNRESOLVED, discovery.NEAR)


def manufacturers(conn, *, limit: int = 1000) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT m.id, m.name, COUNT(p.id) AS part_count FROM manufacturers m "
        "LEFT JOIN parts p ON p.manufacturer_id = m.id GROUP BY m.id, m.name ORDER BY lower(m.name) LIMIT %s",
        (limit,),
    ).fetchall()
    return [{"id": row["id"], "name": row["name"], "part_count": int(row["part_count"])} for row in rows]


def review_queue(conn, *, limit: int = 200) -> dict[str, Any]:
    """Pending spellings and listings waiting for a decision, newest first."""

    rows = conn.execute(
        """
        SELECT l.id, l.connector_id, c.display_name AS connector_name, l.sku, l.raw_mpn, l.raw_manufacturer,
               l.match_state, l.match_reason, l.first_seen_at,
               p.id AS part_id, p.mpn AS part_mpn, m.name AS part_manufacturer
        FROM listings l
        JOIN connectors c ON c.id = l.connector_id
        LEFT JOIN parts p ON p.id = l.part_id
        LEFT JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE l.match_state = ANY(%s)
        ORDER BY l.first_seen_at DESC, l.sku
        LIMIT %s
        """,
        (list(_WAITING_STATES), limit),
    ).fetchall()
    counts = {
        row["match_state"]: int(row["n"])
        for row in conn.execute(
            "SELECT match_state, COUNT(*) AS n FROM listings WHERE match_state = ANY(%s) GROUP BY match_state",
            (list(_WAITING_STATES),),
        ).fetchall()
    }
    waiting_by_alias: dict[str, int] = {}
    for row in conn.execute(
        "SELECT raw_manufacturer FROM listings WHERE match_state = %s", (discovery.UNRESOLVED,)
    ).fetchall():
        key = alias_key(row["raw_manufacturer"])
        waiting_by_alias[key] = waiting_by_alias.get(key, 0) + 1

    aliases = [
        {**alias, "first_seen_at": alias["first_seen_at"].isoformat(), "waiting_listings": waiting_by_alias.get(alias["alias_key"], 0)}
        for alias in parts.pending_aliases(conn)
    ]
    return {
        "aliases": aliases,
        "listings": [
            {
                "id": row["id"],
                "connector_id": row["connector_id"],
                "connector_name": row["connector_name"],
                "sku": row["sku"],
                "raw_mpn": row["raw_mpn"],
                "raw_manufacturer": row["raw_manufacturer"],
                "match_state": row["match_state"],
                "match_reason": row["match_reason"],
                "first_seen_at": row["first_seen_at"].isoformat(),
                "part": (
                    {"id": row["part_id"], "mpn": row["part_mpn"], "manufacturer": row["part_manufacturer"]}
                    if row["part_id"] else None
                ),
            }
            for row in rows
        ],
        "counts": {"aliases": len(aliases), "unresolved": counts.get(discovery.UNRESOLVED, 0), "near": counts.get(discovery.NEAR, 0)},
        "manufacturers": manufacturers(conn),
    }

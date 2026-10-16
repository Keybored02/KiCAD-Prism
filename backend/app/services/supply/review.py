"""The review queue: what matching could not settle by itself.

Two kinds of item wait for a person. A spelling a distributor used that maps to
no manufacturer yet, and a listing that is a candidate for a part but is not
proven to be it. Deciding is done with ``parts.confirm_alias`` and
``discovery.pin_listing`` / ``reject_listing``. Functions here read.
"""

from __future__ import annotations

from typing import Any

from app.services.supply import discovery, parts, settle
from app.services.supply.identity import alias_key, match_key

# Another maker's listing of a number (near) is kept on the part and shown there; only the legacy waiting state is queued.
_WAITING_STATES = (discovery.UNRESOLVED,)


def manufacturers(conn, *, limit: int = 1000) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT m.id, m.name, COUNT(p.id) AS part_count FROM manufacturers m "
        "LEFT JOIN parts p ON p.manufacturer_id = m.id GROUP BY m.id, m.name ORDER BY lower(m.name) LIMIT %s",
        (limit,),
    ).fetchall()
    return [{"id": row["id"], "name": row["name"], "part_count": int(row["part_count"])} for row in rows]


def other_number_pins(conn, *, limit: int = 2000) -> list[dict[str, Any]]:
    """Listings a person pinned as a part although their number is another one, grouped by part.

    A distributor's loose search returns look-alikes (ACAG0301-2450-T for TSR 1-2450); pinned, their stock counts as the
    part's. Taking them off is one decision per part.
    """

    rows = conn.execute(
        """
        SELECT l.id, l.sku, l.raw_mpn, c.display_name AS connector, p.id AS part_id, p.mpn, p.match_key, m.name AS manufacturer
        FROM listings l JOIN parts p ON p.id = l.part_id JOIN manufacturers m ON m.id = p.manufacturer_id
        JOIN connectors c ON c.id = l.connector_id
        WHERE l.match_state = 'manual' ORDER BY lower(p.mpn), c.display_name, l.sku LIMIT %s
        """,
        (limit,),
    ).fetchall()
    others: dict[str, set[str]] = {}
    for item in conn.execute("SELECT part_id, match_key FROM part_numbers").fetchall():
        others.setdefault(item["part_id"], set()).add(item["match_key"])
    groups: dict[str, dict[str, Any]] = {}
    for row in rows:
        number = match_key(row["raw_mpn"] or "")
        if not number or number == row["match_key"] or number in others.get(row["part_id"], ()):
            continue
        group = groups.setdefault(row["part_id"], {"part_id": row["part_id"], "mpn": row["mpn"], "manufacturer": row["manufacturer"], "listings": []})
        group["listings"].append({"id": row["id"], "sku": row["sku"], "raw_mpn": row["raw_mpn"], "connector": row["connector"]})
    return list(groups.values())


def matched_by_prism(conn, *, limit: int = 100) -> dict[str, Any]:
    """What Prism decided by itself and a person may undo: the spellings it learned for a maker, and the parts it settled."""

    learned = conn.execute(
        """
        SELECT a.alias_key, a.alias_text, m.name AS manufacturer, a.first_seen_at,
               (SELECT COUNT(*) FROM part_spellings s WHERE s.alias_key = a.alias_key) AS parts
        FROM manufacturer_aliases a JOIN manufacturers m ON m.id = a.manufacturer_id
        WHERE a.source = 'learned' ORDER BY a.first_seen_at DESC LIMIT %s
        """,
        (limit,),
    ).fetchall()
    settled = conn.execute(
        """
        SELECT e.subject_id AS part_id, p.mpn, m.name AS manufacturer, e.at
        FROM audit_events e JOIN parts p ON p.id = e.subject_id JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE e.action = 'part.settle' AND e.actor = %s ORDER BY e.at DESC LIMIT %s
        """,
        (settle.SYSTEM, limit),
    ).fetchall()
    return {
        "aliases": [{**dict(row), "first_seen_at": row["first_seen_at"].isoformat(), "parts": int(row["parts"])} for row in learned],
        "parts": [{**dict(row), "at": row["at"].isoformat()} for row in settled],
    }


def review_queue(conn, *, limit: int = 200) -> dict[str, Any]:
    """Pending spellings and listings waiting for a decision, newest first."""

    rows = conn.execute(
        """
        SELECT l.id, l.connector_id, c.display_name AS connector_name, c.provider, l.sku, l.raw_mpn, l.raw_manufacturer,
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

    # A spelling nothing waits on is not a question: it stays pending, and comes back if a listing uses it again.
    aliases = [
        {**alias, "first_seen_at": alias["first_seen_at"].isoformat(), "waiting_listings": waiting_by_alias[alias["alias_key"]]}
        for alias in parts.pending_aliases(conn)
        if waiting_by_alias.get(alias["alias_key"], 0) > 0
    ]
    return {
        "aliases": aliases,
        "listings": [
            {
                "id": row["id"],
                "connector_id": row["connector_id"],
                "connector_name": row["connector_name"],
                "provider": row["provider"],
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
        "other_numbers": other_number_pins(conn),
        "choices": settle.needs_choice(conn),
        "matched": matched_by_prism(conn),
        "counts": {"aliases": len(aliases), "unresolved": counts.get(discovery.UNRESOLVED, 0), "near": counts.get(discovery.NEAR, 0)},
        "manufacturers": manufacturers(conn),
    }

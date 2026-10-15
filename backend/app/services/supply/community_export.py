"""What this workspace could share with a public data set: facts with a public source, and nothing else.

Only two kinds go out. Manufacturer aliases that a person confirmed (how distributors spell a maker's name), and the manufacturer
lifecycle of a part with the distributor's public product page it was read from. Never a watch list, a project, a BOM, demand,
stock, a price, a person's name or address, a connector, a credential or a raw distributor answer. It is built for an
administrator to read and send on; Prism sends nothing anywhere.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

SCHEMA = "kicad-prism.community-facts.v1"
MAX_LIFECYCLE = 5000


def build(conn, now: datetime | None = None) -> dict[str, Any]:
    aliases = [
        {"alias": row["alias_text"], "manufacturer": row["manufacturer"]}
        for row in conn.execute(
            """
            SELECT a.alias_text, m.name AS manufacturer FROM manufacturer_aliases a JOIN manufacturers m ON m.id = a.manufacturer_id
            WHERE a.status = 'confirmed' AND lower(a.alias_text) <> lower(m.name) ORDER BY m.name, a.alias_text
            """
        ).fetchall()
    ]
    lifecycle = [
        {"manufacturer": row["manufacturer"], "mpn": row["mpn"], "lifecycle": row["lifecycle"], "source": row["product_url"], "seen": row["fetched_at"].date().isoformat()}
        for row in conn.execute(
            """
            SELECT DISTINCT ON (p.id) m.name AS manufacturer, p.mpn, o.lifecycle, o.product_url, o.fetched_at
            FROM offers o JOIN listings l ON l.id = o.listing_id JOIN parts p ON p.id = l.part_id JOIN manufacturers m ON m.id = p.manufacturer_id
            WHERE l.match_state IN ('exact', 'manual') AND o.lifecycle <> 'unknown' AND o.product_url LIKE 'https://%%' AND NOT o.marketplace
            ORDER BY p.id, o.fetched_at DESC LIMIT %s
            """,
            (MAX_LIFECYCLE,),
        ).fetchall()
    ]
    return {
        "schema": SCHEMA, "generated_at": (now or datetime.now(timezone.utc)).isoformat(),
        "note": "Facts with a public source only. No watch lists, projects, demand, stock, prices, people or credentials.",
        "manufacturer_aliases": aliases, "lifecycle": lifecycle,
    }

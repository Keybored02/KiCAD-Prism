"""A component's local stock as people need it: what can be used now, what is held, what sits at a vendor.

The catalog's own aggregate (``inventory_policy``) sums every row of a source. With InvenTree's statuses and external
locations that overstates what is on hand, so the Supply tab reads the rows here instead:

* **available**: OK stock (``available``; a CSV row with no status counts too) at Prism's own locations, less what is
  allocated to work orders;
* **held**: stock at Prism's locations in any other status (on hold, quarantined, damaged...);
* **at vendor**: stock at an external location, shown but never counted as on hand.

Reads only.
"""

from __future__ import annotations

from typing import Any

AVAILABLE = frozenset({"available", ""})


def local_stock(conn, component_id: str) -> dict[str, Any]:
    """Every stock row of the component with its source, and the totals. Units are reported as found; totals mix none."""

    rows = conn.execute(
        """
        SELECT l.source, l.source_id, l.location_key, COALESCE(s.display_name, '') AS source_name, l.location_path, l.quantity, l.allocated,
               l.inventory_status, l.external, l.batch, l.uom, l.fetch_status, l.fetched_at, l.source_updated_at
        FROM inventory_levels l LEFT JOIN inventory_sources s ON s.id = l.source_id
        WHERE l.component_id = %s
        ORDER BY lower(COALESCE(s.display_name, l.source)), l.external, l.location_path, l.source_record_id
        """,
        (component_id,),
    ).fetchall()
    units = sorted({(row["uom"] or "").strip() for row in rows})
    available = held = at_vendor = 0.0
    items = []
    for row in rows:
        quantity, allocated = float(row["quantity"] or 0), float(row["allocated"] or 0)
        status = (row["inventory_status"] or "").strip().casefold()
        if row["external"]:
            at_vendor += quantity
        elif status in AVAILABLE:
            available += max(quantity - allocated, 0.0)
        else:
            held += quantity
        items.append({
            "key": f"{row['source']}/{row['location_key']}", "source": row["source_name"] or row["source"], "source_id": row["source_id"], "location": row["location_path"],
            "quantity": quantity, "allocated": allocated, "status": status or "available", "external": bool(row["external"]),
            "batch": row["batch"], "uom": row["uom"], "stale": row["fetch_status"] != "ok", "fetched_at": row["fetched_at"],
            "updated_at": row["source_updated_at"],
        })
    mixed = len(units) > 1
    return {
        "component_id": component_id,
        "uom": "" if mixed else (units[0] if units else ""),
        "mixed_units": mixed,
        "available": None if mixed else available,
        "held": None if mixed else held,
        "at_vendor": None if mixed else at_vendor,
        "rows": items,
    }

"""Seed listings from the catalog's vendor fields.

A catalog component can name a vendor and the vendor's own part number. When the vendor is a
connected distributor, that is a known listing, so the part can be read at once instead of
waiting for a search to find it. The listing is stored as a person's decision (``manual``): the
catalog says so, and discovery will not move it.

It only adds listings. It never creates a manufacturer, a watch or an alias, and running it
again changes nothing.
"""

from __future__ import annotations

import re
import uuid
from typing import Any, Iterable, Mapping

from app.services.supply import parts
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.discovery import MANUAL

_MIN_NAME = 3
REASON = "vendor part number in the catalog"


def _squash(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", text.casefold())


def connector_for(vendor: str, connectors: Iterable[Mapping[str, Any]]) -> Mapping[str, Any] | None:
    """The one active connector a vendor name points at, or None when none or several do."""

    key = _squash(vendor)
    if len(key) < _MIN_NAME:
        return None
    found = []
    for connector in connectors:
        if not connector["enabled"] or connector["paused_reason"]:
            continue
        names = {_squash(connector["provider"]), _squash(connector["provider_label"]), _squash(connector["display_name"])}
        names = {name for name in names if len(name) >= _MIN_NAME}
        if any(name == key or name in key for name in names):
            found.append(connector)
    return found[0] if len(found) == 1 else None


def seed(conn, components: Iterable[Mapping[str, Any]], connectors: list[Mapping[str, Any]], actor: str) -> dict[str, int]:
    """Add a listing for each component that names a connected vendor and a vendor part number."""

    actor = actor_text(actor)
    counts = {"considered": 0, "added": 0, "already": 0, "no_connector": 0, "unknown_manufacturer": 0}
    for component in components:
        vendor = str(component.get("vendor") or "").strip()
        sku = str(component.get("vendor_part_number") or "").strip()
        mpn = str(component.get("mpn") or "").strip()
        manufacturer = str(component.get("manufacturer") or "").strip()
        if not (vendor and sku and mpn and manufacturer) or component.get("identity_kind") != "mpn":
            continue
        counts["considered"] += 1
        connector = connector_for(vendor, connectors)
        if connector is None:
            counts["no_connector"] += 1
            continue
        try:
            part = parts.ensure_part(conn, manufacturer, mpn, actor, may_create=False)
        except parts.UnknownManufacturer:
            counts["unknown_manufacturer"] += 1
            continue
        listing_id = uuid.uuid4().hex
        created = conn.execute(
            """
            INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state, match_reason, matched_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'catalog')
            ON CONFLICT (connector_id, sku) DO NOTHING RETURNING id
            """,
            (listing_id, connector["id"], sku, part.id, part.mpn, manufacturer, MANUAL, REASON),
        ).fetchone()
        if created is None:
            counts["already"] += 1
            continue
        counts["added"] += 1
        write_audit(conn, actor, "listing.seed", listing_id,
                    {"part_id": part.id, "connector_id": connector["id"], "sku": sku}, subject_kind="listing")
    return counts

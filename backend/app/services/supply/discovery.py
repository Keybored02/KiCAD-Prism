"""Finding a part's listings at a distributor, and the review actions on them.

Discovery asks a provider for a part number and sorts each answer into a match
state (design: section 6.3). Only ``exact`` and ``manual`` listings count
toward stock and price. Everything else waits for a person.

Network calls happen outside any database transaction.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Callable

from app.services.supply import parts
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.identity import match_key
from app.services.supply.models import PartMatch
from app.services.supply.providers.base import SupplyProvider
from app.services.supply.store import SupplyStore, supply_store

EXACT = "exact"
MANUAL = "manual"
UNRESOLVED = "manufacturer_unresolved"
NEAR = "near"
REJECTED = "rejected"
GONE = "gone"

# A person's decision is never overwritten by discovery.
_STICKY = frozenset({MANUAL, REJECTED})


class ListingNotFound(KeyError):
    """No listing with this id."""


@dataclass(frozen=True, slots=True)
class DiscoveryResult:
    part_id: str
    connector_id: str
    exact: int
    unresolved: int
    near: int

    @property
    def total(self) -> int:
        return self.exact + self.unresolved + self.near


def classify(part: parts.PartRecord, match: PartMatch, resolution: parts.Resolution) -> tuple[str, str]:
    """The match state and the reason, from facts alone."""

    if match_key(match.mpn) != part.match_key:
        return NEAR, "different part number"
    if resolution.status == "confirmed" and resolution.manufacturer_id == part.manufacturer_id:
        return EXACT, "part number and manufacturer match"
    if resolution.status == "confirmed":
        return NEAR, "same part number, different manufacturer"
    return UNRESOLVED, "manufacturer spelling not confirmed"


class DiscoveryService:
    def __init__(
        self,
        provider_for: Callable[[str], SupplyProvider],
        store: SupplyStore = supply_store,
    ) -> None:
        self._provider_for = provider_for
        self._store = store

    def discover(self, part_id: str, connector_id: str) -> DiscoveryResult:
        with self._store.connection() as conn:
            part = parts.get_part(conn, part_id)
        matches = self._provider_for(connector_id).lookup_mpn(part.mpn, part.manufacturer_name)

        counts = {EXACT: 0, UNRESOLVED: 0, NEAR: 0}
        with self._store.connection() as conn:
            for match in matches:
                resolution = parts.resolve_manufacturer(conn, match.manufacturer, provider=match.provider)
                state, reason = classify(part, match, resolution)
                state = self._upsert(conn, connector_id, part.id, match, state, reason)
                if state in counts:
                    counts[state] += 1
        return DiscoveryResult(part.id, connector_id, counts[EXACT], counts[UNRESOLVED], counts[NEAR])

    @staticmethod
    def _upsert(conn, connector_id: str, part_id: str, match: PartMatch, state: str, reason: str) -> str:
        """Record one listing. Returns the state it ends up in."""

        existing = conn.execute(
            "SELECT id, match_state FROM listings WHERE connector_id = %s AND sku = %s FOR UPDATE",
            (connector_id, match.sku),
        ).fetchone()
        if existing is None:
            conn.execute(
                """
                INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state, match_reason)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (connector_id, sku) DO NOTHING
                """,
                (uuid.uuid4().hex, connector_id, match.sku, part_id, match.mpn, match.manufacturer, state, reason),
            )
            return state
        current = existing["match_state"]
        keep = current in _STICKY or (current == EXACT and state != EXACT)
        if keep:
            conn.execute(
                "UPDATE listings SET last_seen_at = NOW(), raw_mpn = %s, raw_manufacturer = %s WHERE id = %s",
                (match.mpn, match.manufacturer, existing["id"]),
            )
            return current
        conn.execute(
            "UPDATE listings SET last_seen_at = NOW(), raw_mpn = %s, raw_manufacturer = %s, part_id = %s, "
            "match_state = %s, match_reason = %s, matched_by = 'discovery' WHERE id = %s",
            (match.mpn, match.manufacturer, part_id, state, reason, existing["id"]),
        )
        return state


def pin_listing(conn, listing_id: str, part_id: str, actor: str) -> None:
    """A person says this listing is this part. It counts, and discovery will not undo it."""

    actor = actor_text(actor)
    parts.get_part(conn, part_id)
    result = conn.execute(
        "UPDATE listings SET part_id = %s, match_state = %s, match_reason = %s, matched_by = %s WHERE id = %s",
        (part_id, MANUAL, "pinned by a person", actor, listing_id),
    )
    if result.rowcount == 0:
        raise ListingNotFound(listing_id)
    write_audit(conn, actor, "listing.pin", listing_id, {"part_id": part_id}, subject_kind="listing")


def reject_listing(conn, listing_id: str, actor: str) -> None:
    """A person says this listing is not the part. It stops counting and is not suggested again."""

    actor = actor_text(actor)
    result = conn.execute(
        "UPDATE listings SET match_state = %s, match_reason = %s, matched_by = %s WHERE id = %s",
        (REJECTED, "rejected by a person", actor, listing_id),
    )
    if result.rowcount == 0:
        raise ListingNotFound(listing_id)
    write_audit(conn, actor, "listing.reject", listing_id, {}, subject_kind="listing")


def counted_listings(conn, part_id: str) -> list[dict]:
    """The listings that feed stock and price for a part."""

    rows = conn.execute(
        "SELECT id, connector_id, sku, packaging, match_state FROM listings "
        "WHERE part_id = %s AND match_state IN ('exact', 'manual') ORDER BY connector_id, sku",
        (part_id,),
    ).fetchall()
    return [dict(row) for row in rows]

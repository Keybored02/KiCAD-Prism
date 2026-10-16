"""Finding a part's listings at a distributor, and the review actions on them.

Discovery asks a provider for a part number and sorts each answer into a match
state (design: section 6.3). Only ``exact`` and ``manual`` listings count
toward stock and price. Everything else waits for a person.

Network calls happen outside any database transaction.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from typing import Callable

from app.services.supply import parts, settle
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.identity import alias_key, match_key
from app.services.supply.makers import same_maker
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
_WAITING = frozenset({UNRESOLVED, NEAR})


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


def classify(
    part: parts.PartRecord, match: PartMatch, resolution: parts.Resolution, known: frozenset[str] = frozenset(), numbers: frozenset[str] = frozenset(),
) -> tuple[str, str]:
    """The match state and the reason, from facts alone.

    The same number counts when the distributor's spelling names the part's maker: its manufacturer, a spelling of it, one
    the part has been seen under (``known``), or the same maker by ``makers.same_maker``. Another maker's listing of the
    number is ``near``, kept and shown on the part but never counted.
    """

    if match_key(match.mpn) != part.match_key and match_key(match.mpn) not in numbers:
        return NEAR, "different part number"
    if resolution.status == "confirmed" and resolution.manufacturer_id == part.manufacturer_id:
        return EXACT, "part number and manufacturer match"
    if alias_key(match.manufacturer) in known or same_maker(match.manufacturer, part.manufacturer_name):
        return EXACT, "same maker as the part"
    return NEAR, "same part number, different manufacturer"


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
        return self.apply(part, matches, connector_id)

    def apply(self, part: parts.PartRecord, matches: list[PartMatch], connector_id: str) -> DiscoveryResult:
        """Sort a provider's answer for ``part`` into listings. Split from ``discover`` so one search call can serve many parts."""

        counts = {EXACT: 0, UNRESOLVED: 0, NEAR: 0}
        with self._store.connection() as conn:
            known = frozenset(parts.part_spelling_keys(conn, part.id))
            numbers = frozenset(parts.part_number_keys(conn, part.id))
            numbers = numbers | frozenset(self._suffixed(conn, part, matches, numbers))
            for match in matches:
                resolution = parts.resolve_manufacturer(conn, match.manufacturer, provider=match.provider)
                state, reason = classify(part, match, resolution, known, numbers)
                state = self._upsert(conn, connector_id, part.id, match, state, reason)
                if state == EXACT and reason == "same maker as the part":
                    parts.record_spelling(conn, part.id, match.manufacturer, "learned")
                if state == EXACT and match.datasheet_url:
                    remember_datasheet(conn, part.id, match.datasheet_url)
                if state == EXACT and match.parameters:
                    remember_parameters(conn, part.id, match.provider, match.parameters)
                if state in counts:
                    counts[state] += 1
            if part.provisional:
                # The answers may settle who makes it; the listings are sorted again by what they say.
                settle.settle_part(conn, part.id)
            settle.learn_aliases(conn)
        return DiscoveryResult(part.id, connector_id, counts[EXACT], counts[UNRESOLVED], counts[NEAR])

    @staticmethod
    def _suffixed(conn, part: parts.PartRecord, matches: list[PartMatch], numbers: frozenset[str]) -> list[str]:
        """When no distributor lists the part's own number, the same maker's number plus a packaging suffix (LM358D -> LM358DR)
        is the same part: those numbers are added to it. Returns the keys added."""

        if part.provisional or any(match_key(match.mpn) in numbers for match in matches):
            return []
        added = []
        for match in matches:
            key = match_key(match.mpn)
            if key.startswith(part.match_key) and key[len(part.match_key):] in parts.PACKAGING_SUFFIXES and same_maker(match.manufacturer, part.manufacturer_name):
                if parts.add_number(conn, part.id, match.mpn, "system", "suffix"):
                    added.append(key)
        return added

    @staticmethod
    def _upsert(conn, connector_id: str, part_id: str, match: PartMatch, state: str, reason: str) -> str:
        """Record one listing. Returns the state it ends up in."""

        existing = conn.execute(
            "SELECT id, match_state, part_id FROM listings WHERE connector_id = %s AND sku = %s FOR UPDATE",
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
            # A sibling number that turns up in a later search, once the part has been searched here before, is news; the first
            # search finds every sibling at once and says nothing.
            if state == NEAR and part_id and conn.execute(
                "SELECT 1 FROM discovery_runs WHERE part_id = %s AND connector_id = %s", (part_id, connector_id)
            ).fetchone():
                conn.execute(
                    "INSERT INTO events (kind, part_id, payload) VALUES ('family_member_new', %s, %s::jsonb)",
                    (part_id, json.dumps({"sku": match.sku, "mpn": match.mpn, "manufacturer": match.manufacturer})),
                )
            return state
        current = existing["match_state"]
        keep = current in _STICKY or (current == EXACT and state != EXACT)
        # A listing waiting for review stays a candidate for the first part it was
        # found for, so searching for another part does not keep moving it.
        if current in _WAITING and state in _WAITING and existing["part_id"] not in (None, part_id):
            keep = True
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


def remember_datasheet(conn, part_id: str, url: str) -> None:
    """Keep the first datasheet address a distributor gives for a part. A person's choice later replaces it."""

    url = url.strip()
    if url.lower().startswith("https://") and len(url) <= 500:
        conn.execute("UPDATE parts SET datasheet_url = %s WHERE id = %s AND datasheet_url = ''", (url, part_id))


MAX_PARAMETERS = 80


def remember_parameters(conn, part_id: str, provider: str, attributes) -> None:
    """Keep the latest attributes a distributor gave for a part."""

    for name, raw in list(attributes)[:MAX_PARAMETERS]:
        name, raw = str(name).strip()[:120], str(raw).strip()[:300]
        if name and raw:
            # A distributor changing a listed attribute without a notice is worth a line.
            before = conn.execute(
                "SELECT raw FROM part_params WHERE part_id = %s AND provider = %s AND name = %s", (part_id, provider, name)
            ).fetchone()
            if before is not None and before["raw"] != raw:
                conn.execute(
                    "INSERT INTO events (kind, part_id, payload) VALUES ('param_changed', %s, %s::jsonb)",
                    (part_id, json.dumps({"provider": provider, "name": name, "from": before["raw"], "to": raw})),
                )
            conn.execute(
                """
                INSERT INTO part_params (part_id, provider, name, raw) VALUES (%s, %s, %s, %s)
                ON CONFLICT (part_id, provider, name) DO UPDATE SET raw = EXCLUDED.raw, observed_at = NOW()
                """,
                (part_id, provider, name, raw),
            )


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

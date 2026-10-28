"""Reading a local inventory source into the catalog's ``inventory_levels`` (decision D15).

A sync reads the whole followed category, then, in one transaction, replaces the source's stock rows and its list of
unmatched parts. Nothing is read inside a transaction, and a failed read changes no stock: the source's rows are
marked ``fetch_status = error`` so they show as stale, and the error is kept on the source.

Each server part is matched to one active catalog component, first hit wins:

1. a person's link (``inventory_links``);
2. the part's IPN equals one component's SAP code;
3. one of its MPNs is one component's part number. Several components with the number are told apart by the maker,
   which is otherwise only a hint (Vision serves every part under "Unknown manufacturer").

A part with stock that matches nothing waits in ``inventory_unmatched`` with the reason.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Mapping

from app.services.supply import credentials as sealed
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.identity import alias_key, match_key
from app.services.supply.inventory import sources
from app.services.supply.inventory.inventree import STATUS_NAMES, STATUS_OK, InvenTreeClient, Location, Part, StockRecord
from app.services.supply.providers.base import ProviderError
from app.services.supply.store import SupplyStore

SOURCE_NAME = "inventree"
NO_MATCH, SAP_SHARED, MPN_SHARED = "no_component", "sap_code_shared", "mpn_shared"

ClientFactory = Callable[[str, str], InvenTreeClient]


@dataclass(frozen=True, slots=True)
class Read:
    """What one read of the server returned."""

    server: str
    api_version: int
    parts: Mapping[int, Part]
    locations: Mapping[int, Location]
    stock: list[StockRecord]


class _Library:
    """The active components, indexed by SAP code and by part number."""

    def __init__(self, conn) -> None:
        rows = conn.execute(
            """
            SELECT c.id, r.sap_code, r.manufacturer, r.mpn
            FROM components c JOIN component_revisions r ON r.id = c.current_revision_id
            WHERE c.is_active = 1
            """
        ).fetchall()
        self.active = {row["id"] for row in rows}
        self.by_sap: dict[str, list[str]] = {}
        self.by_mpn: dict[str, list[tuple[str, str]]] = {}
        for row in rows:
            if (row["sap_code"] or "").strip():
                self.by_sap.setdefault(row["sap_code"].strip(), []).append(row["id"])
            if match_key(row["mpn"] or ""):
                self.by_mpn.setdefault(match_key(row["mpn"]), []).append((row["id"], row["manufacturer"] or ""))

    def match(self, part: Part, linked: str | None) -> tuple[str | None, str]:
        """The component and how it matched ("link", "sap_code", "mpn"), or None and why not."""

        if linked in self.active:
            return linked, "link"
        found = self.by_sap.get(part.ipn, []) if part.ipn else []
        if len(found) == 1:
            return found[0], "sap_code"
        reason = SAP_SHARED if found else NO_MATCH
        for maker, mpn in part.mpns:
            holders = self.by_mpn.get(match_key(mpn), [])
            if len(holders) > 1 and alias_key(maker):
                holders = [holder for holder in holders if alias_key(holder[1]) == alias_key(maker)] or holders
            if len(holders) == 1:
                return holders[0][0], "mpn"
            if holders:
                reason = MPN_SHARED
        return None, reason


def read(client: InvenTreeClient, category: int) -> Read:
    info = client.server()
    return Read(server=info.server, api_version=info.api_version, parts=client.parts(category), locations=client.locations(), stock=client.stock(category))


def _status(record: StockRecord) -> str:
    if record.status == STATUS_OK:
        return "available"
    return (record.status_text or STATUS_NAMES.get(record.status, str(record.status))).strip().casefold()


def apply(conn, source_id: str, found: Read, now: datetime) -> dict[str, int]:
    """Replace the source's stock rows and unmatched parts with what was read. Returns the counts."""

    library = _Library(conn)
    links = {row["remote_part"]: row["component_id"] for row in conn.execute(
        "SELECT remote_part, component_id FROM inventory_links WHERE source_id = %s", (source_id,)).fetchall()}
    by_part: dict[int, list[StockRecord]] = {}
    for record in found.stock:
        by_part.setdefault(record.part, []).append(record)
    stamp = now.isoformat()
    conn.execute("DELETE FROM inventory_levels WHERE source_id = %s", (source_id,))
    conn.execute("DELETE FROM inventory_unmatched WHERE source_id = %s", (source_id,))
    matched = unmatched = 0
    for part_pk, records in sorted(by_part.items()):
        part = found.parts.get(part_pk) or Part(pk=part_pk, name="", ipn="", units="")
        component_id, how = library.match(part, links.get(str(part_pk)))
        if component_id is None:
            unmatched += 1
            first = part.mpns[0] if part.mpns else ("", "")
            conn.execute(
                "INSERT INTO inventory_unmatched (source_id, remote_part, ipn, mpn, manufacturer, name, quantity, records, reason, seen_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (source_id, str(part_pk), part.ipn, first[1], first[0], part.name, sum(r.quantity for r in records), len(records), how, now),
            )
            continue
        matched += 1
        for record in records:
            location = found.locations.get(record.location) if record.location is not None else None
            conn.execute(
                """
                INSERT INTO inventory_levels (source, component_id, location_key, source_record_id, quantity, uom, inventory_status,
                    fetch_status, fetched_at, updated_at, source_id, allocated, location_path, external, batch, source_updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'ok', %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (SOURCE_NAME, component_id, f"{source_id}/{record.pk}", str(record.pk), record.quantity, part.units, _status(record),
                 stamp, stamp, source_id, record.allocated, location.pathstring if location else "", bool(location and location.external),
                 record.batch, record.updated),
            )
    conn.execute(
        "UPDATE inventory_sources SET server = %s, api_version = %s, last_sync_at = %s, last_status = 'ok', last_error = '', matched = %s, unmatched = %s WHERE id = %s",
        (found.server, found.api_version, now, matched, unmatched, source_id),
    )
    return {"matched": matched, "unmatched": unmatched, "records": len(found.stock)}


def fail(conn, source_id: str, error: str, now: datetime) -> None:
    """Keep the source's stock, marked stale, and say why the read failed."""

    conn.execute("UPDATE inventory_levels SET fetch_status = 'error' WHERE source_id = %s", (source_id,))
    conn.execute(
        "UPDATE inventory_sources SET last_sync_at = %s, last_status = 'error', last_error = %s WHERE id = %s", (now, error[:300], source_id)
    )


def sync(
    store: SupplyStore, keyring: sealed.CredentialKeyring, source_id: str, *,
    client_factory: ClientFactory | None = None, now: datetime | None = None,
) -> dict[str, Any]:
    """Read one source and store what it holds. Returns the counts, or the error the source now shows."""

    moment = now or datetime.now(timezone.utc)
    with store.connection() as conn:
        row = sources.get(conn, source_id)
    try:
        if row["category_id"] is None:
            raise sources.SourceError("Choose the category to follow first.")
        client = (client_factory or InvenTreeClient)(row["base_url"], sources.token_of(keyring, row))
        try:
            found = read(client, int(row["category_id"]))
        finally:
            client.close()
    except (ProviderError, sources.SourceError) as exc:
        message = f"{getattr(exc, 'code', 'invalid')}: {exc}"
        with store.connection() as conn:
            fail(conn, source_id, message, moment)
        return {"status": "error", "error": message}
    with store.connection() as conn:
        return {"status": "ok", **apply(conn, source_id, found, moment)}


def due(conn, now: datetime) -> list[str]:
    """Enabled sources with a token and a category whose last read is older than their interval."""

    rows = conn.execute(
        "SELECT id, interval_hours, last_sync_at FROM inventory_sources WHERE enabled AND credential_envelope <> '' AND category_id IS NOT NULL ORDER BY id"
    ).fetchall()
    return [row["id"] for row in rows if row["last_sync_at"] is None or row["last_sync_at"] <= now - timedelta(hours=row["interval_hours"])]


def sync_due(store: SupplyStore, keyring: sealed.CredentialKeyring, now: datetime | None = None) -> list[dict[str, Any]]:
    moment = now or datetime.now(timezone.utc)
    with store.connection() as conn:
        ids = due(conn, moment)
    return [sync(store, keyring, source_id, now=moment) for source_id in ids]


def link(conn, source_id: str, remote_part: str, component_id: str, actor: str) -> None:
    """A person's answer to an unmatched part: it is this component from the next read on."""

    actor = actor_text(actor)
    sources.get(conn, source_id)
    active = conn.execute("SELECT is_active FROM components WHERE id = %s", (component_id,)).fetchone()
    if not active or not active["is_active"]:
        raise sources.SourceError("There is no such component in the library.")
    conn.execute(
        "INSERT INTO inventory_links (source_id, remote_part, component_id, linked_by) VALUES (%s, %s, %s, %s) "
        "ON CONFLICT (source_id, remote_part) DO UPDATE SET component_id = EXCLUDED.component_id, linked_by = EXCLUDED.linked_by, linked_at = NOW()",
        (source_id, remote_part, component_id, actor),
    )
    # Answered: it leaves the review list now, even if the next read fails.
    gone = conn.execute("DELETE FROM inventory_unmatched WHERE source_id = %s AND remote_part = %s", (source_id, remote_part)).rowcount
    if gone:
        conn.execute("UPDATE inventory_sources SET unmatched = GREATEST(unmatched - 1, 0) WHERE id = %s", (source_id,))
    write_audit(conn, actor, "inventory_source.link", source_id, {"remote_part": remote_part, "component_id": component_id}, subject_kind="inventory_source")


def unmatched(conn, source_id: str) -> list[dict[str, Any]]:
    return [dict(row) for row in conn.execute(
        "SELECT remote_part, ipn, mpn, manufacturer, name, quantity, records, reason, seen_at FROM inventory_unmatched "
        "WHERE source_id = %s ORDER BY quantity DESC, remote_part", (source_id,)).fetchall()]

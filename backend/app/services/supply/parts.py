"""Manufacturers, their spellings, and parts. Functions on a connection; none commit.

A manufacturer part is (canonical manufacturer, part number key). A person who
enters a part names its manufacturer and that name is trusted. A spelling that
only a distributor uses stays ``pending`` until someone maps it, so a stray
"TI" never creates a second Texas Instruments.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Literal

from app.services.supply.audit import actor_text, write_audit
from app.services.supply.identity import alias_key, match_key


class PartNotFound(KeyError):
    """No part with this id."""


class AliasError(ValueError):
    """The alias cannot be confirmed as asked. The message is safe to show."""


class UnknownManufacturer(ValueError):
    """A person without approval rights named a manufacturer Prism does not know yet."""


@dataclass(frozen=True, slots=True)
class Resolution:
    manufacturer_id: str | None
    status: Literal["confirmed", "pending", "blank"]


@dataclass(frozen=True, slots=True)
class PartRecord:
    id: str
    manufacturer_id: str
    manufacturer_name: str
    mpn: str
    match_key: str


def resolve_manufacturer(conn, name: str, *, provider: str = "") -> Resolution:
    """Look a spelling up. Unknown spellings are remembered as pending, never created."""

    key = alias_key(name)
    if not key:
        return Resolution(None, "blank")
    row = conn.execute(
        "SELECT manufacturer_id, status FROM manufacturer_aliases WHERE alias_key = %s", (key,)
    ).fetchone()
    if row and row["status"] == "confirmed":
        return Resolution(row["manufacturer_id"], "confirmed")
    known = conn.execute("SELECT id FROM manufacturers WHERE name_key = %s", (key,)).fetchone()
    if known:
        return Resolution(known["id"], "confirmed")
    conn.execute(
        "INSERT INTO manufacturer_aliases (alias_key, alias_text, status, seen_at_provider) "
        "VALUES (%s, %s, 'pending', %s) ON CONFLICT (alias_key) DO NOTHING",
        (key, name.strip(), provider),
    )
    return Resolution(None, "pending")


def ensure_manufacturer(conn, name: str, actor: str, *, may_create: bool = True) -> str:
    """The manufacturer for a name a person typed.

    A known name (a manufacturer or a confirmed spelling) is always accepted. A new
    name creates a manufacturer only when ``may_create`` is set, which is for people
    who can approve spellings: otherwise a stray "TI" would become a second Texas
    Instruments. Creating one from a spelling distributors reported confirms that
    spelling, and moves the listings that were waiting on it.
    """

    actor = actor_text(actor)
    key = alias_key(name)
    if not key:
        raise ValueError("manufacturer is required")
    row = conn.execute(
        "SELECT manufacturer_id FROM manufacturer_aliases WHERE alias_key = %s AND status = 'confirmed'", (key,)
    ).fetchone()
    if row:
        return row["manufacturer_id"]
    known = conn.execute("SELECT id FROM manufacturers WHERE name_key = %s", (key,)).fetchone()
    if known is None and not may_create:
        raise UnknownManufacturer(
            f"Prism does not know the manufacturer \"{name.strip()}\". Pick one from the list, "
            "or ask QA or an administrator to add it."
        )
    manufacturer_id = known["id"] if known else uuid.uuid4().hex
    if known is None:
        conn.execute(
            "INSERT INTO manufacturers (id, name, name_key) VALUES (%s, %s, %s) ON CONFLICT (name_key) DO NOTHING",
            (manufacturer_id, name.strip(), key),
        )
        manufacturer_id = conn.execute("SELECT id FROM manufacturers WHERE name_key = %s", (key,)).fetchone()["id"]
    pending = conn.execute(
        "SELECT 1 FROM manufacturer_aliases WHERE alias_key = %s AND status = 'pending' FOR UPDATE", (key,)
    ).fetchone()
    conn.execute(
        """
        INSERT INTO manufacturer_aliases (alias_key, alias_text, manufacturer_id, status, confirmed_by)
        VALUES (%s, %s, %s, 'confirmed', %s)
        ON CONFLICT (alias_key) DO UPDATE SET
            manufacturer_id = EXCLUDED.manufacturer_id, status = 'confirmed', confirmed_by = EXCLUDED.confirmed_by
        """,
        (key, name.strip(), manufacturer_id, actor),
    )
    if pending:
        _release_waiting(conn, key, manufacturer_id, actor)
    return manufacturer_id


def ensure_part(conn, manufacturer_name: str, mpn: str, actor: str, *, may_create: bool = True) -> PartRecord:
    """The part for a manufacturer and part number a person typed, created on first use."""

    actor = actor_text(actor)
    key = match_key(mpn)
    if not key:
        raise ValueError("mpn is required")
    manufacturer_id = ensure_manufacturer(conn, manufacturer_name, actor, may_create=may_create)
    part_id = uuid.uuid4().hex
    created = conn.execute(
        "INSERT INTO parts (id, manufacturer_id, mpn, match_key) VALUES (%s, %s, %s, %s) "
        "ON CONFLICT (manufacturer_id, match_key) DO NOTHING RETURNING id",
        (part_id, manufacturer_id, mpn.strip(), key),
    ).fetchone()
    if created:
        write_audit(conn, actor, "part.create", part_id, {"mpn": mpn.strip()}, subject_kind="part")
    row = conn.execute(
        "SELECT id FROM parts WHERE manufacturer_id = %s AND match_key = %s", (manufacturer_id, key)
    ).fetchone()
    return get_part(conn, row["id"])


def find_part(conn, manufacturer_name: str, mpn: str) -> PartRecord | None:
    """The part for a manufacturer and part number, or None. Reads only: nothing is created or remembered."""

    key, name_key = match_key(mpn), alias_key(manufacturer_name)
    if not key or not name_key:
        return None
    row = conn.execute(
        """
        SELECT p.id FROM parts p
        WHERE p.match_key = %s AND p.manufacturer_id IN (
            SELECT manufacturer_id FROM manufacturer_aliases WHERE alias_key = %s AND status = 'confirmed'
            UNION
            SELECT id FROM manufacturers WHERE name_key = %s
        )
        """,
        (key, name_key, name_key),
    ).fetchone()
    return get_part(conn, row["id"]) if row else None


def get_part(conn, part_id: str) -> PartRecord:
    row = conn.execute(
        "SELECT p.id, p.manufacturer_id, m.name AS manufacturer_name, p.mpn, p.match_key "
        "FROM parts p JOIN manufacturers m ON m.id = p.manufacturer_id WHERE p.id = %s",
        (part_id,),
    ).fetchone()
    if row is None:
        raise PartNotFound(part_id)
    return PartRecord(row["id"], row["manufacturer_id"], row["manufacturer_name"], row["mpn"], row["match_key"])


def pending_aliases(conn) -> list[dict]:
    """Spellings distributors used that nobody has mapped yet, oldest first."""

    rows = conn.execute(
        "SELECT alias_key, alias_text, seen_at_provider, first_seen_at FROM manufacturer_aliases "
        "WHERE status = 'pending' ORDER BY first_seen_at, alias_key"
    ).fetchall()
    return [dict(row) for row in rows]


def confirm_alias(conn, key: str, manufacturer_id: str, actor: str) -> int:
    """Map a pending spelling to a manufacturer. Returns how many listings it moved.

    Listings that waited on this spelling become exact when the manufacturer is
    the part's own, and near when it is a different one.
    """

    actor = actor_text(actor)
    row = conn.execute(
        "SELECT alias_text, status FROM manufacturer_aliases WHERE alias_key = %s FOR UPDATE", (key,)
    ).fetchone()
    if row is None:
        raise AliasError("Unknown spelling.")
    if row["status"] != "pending":
        raise AliasError("This spelling is already mapped.")
    if conn.execute("SELECT 1 FROM manufacturers WHERE id = %s", (manufacturer_id,)).fetchone() is None:
        raise AliasError("Unknown manufacturer.")
    conn.execute(
        "UPDATE manufacturer_aliases SET manufacturer_id = %s, status = 'confirmed', confirmed_by = %s "
        "WHERE alias_key = %s",
        (manufacturer_id, actor, key),
    )
    moved = _release_waiting(conn, key, manufacturer_id, actor)
    write_audit(conn, actor, "alias.confirm", key, {"manufacturer_id": manufacturer_id, "listings": moved},
                subject_kind="manufacturer_alias")
    return moved


def _release_waiting(conn, key: str, manufacturer_id: str, actor: str) -> int:
    """Settle the listings that waited on a spelling. Returns how many moved.

    They become exact when the manufacturer is the part's own, and near when it
    is a different one.
    """

    waiting = conn.execute(
        "SELECT l.id, l.raw_manufacturer, p.manufacturer_id AS part_manufacturer FROM listings l "
        "JOIN parts p ON p.id = l.part_id WHERE l.match_state = 'manufacturer_unresolved'"
    ).fetchall()
    moved = 0
    for listing in waiting:
        if alias_key(listing["raw_manufacturer"]) != key:
            continue
        same = listing["part_manufacturer"] == manufacturer_id
        conn.execute(
            "UPDATE listings SET match_state = %s, match_reason = %s, matched_by = %s WHERE id = %s",
            (
                "exact" if same else "near",
                "manufacturer spelling confirmed" if same else "same part number, different manufacturer",
                actor,
                listing["id"],
            ),
        )
        moved += 1
    return moved

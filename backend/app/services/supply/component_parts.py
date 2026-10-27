"""Which manufacturer parts a catalog component may be built with (the catalog's ``component_parts`` table).

A component's **main** part is its current revision's manufacturer and MPN; ``sync_main`` keeps the row in step when
the revision changes. **Alternates** are proposed by a designer and decided by QA. Until approved, an alternate is shown
but never counted. Approved alternates count wherever the main part does (``counted_parts``).

Supply facts (offers, stock, health) hang off ``supply_parts``; this table says which of those parts belong to which
component. The rows live outside component revisions, as stock does: revisions are hashed, and this list changes.
"""

from __future__ import annotations

from typing import Any, Iterable

import psycopg

from app.services.supply import parts
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.identity import match_key

SYSTEM = "system"
MAIN, ALTERNATE = "main", "alternate"
PENDING, APPROVED, REJECTED = "pending", "approved", "rejected"


class ComponentPartError(ValueError):
    """The request is not valid. The message is safe to show."""


def _present(conn) -> bool:
    """Whether this schema holds the catalog (supply-only test schemas do not)."""

    row = conn.execute("SELECT to_regclass('component_parts') IS NOT NULL AS present").fetchone()
    return bool(row and row["present"])


def parts_of(conn, component_id: str) -> list[dict[str, Any]]:
    """The component's main part first, then its alternates (approved, pending, rejected), oldest first."""

    rows = conn.execute(
        """
        SELECT cp.part_id, cp.role, cp.approval, cp.created_by, cp.created_at, cp.decided_by, cp.decided_at,
               p.mpn, m.name AS manufacturer
        FROM component_parts cp
        JOIN supply_parts p ON p.id = cp.part_id
        JOIN supply_manufacturers m ON m.id = p.manufacturer_id
        WHERE cp.component_id = %s
        ORDER BY cp.role = 'main' DESC, array_position(ARRAY['approved', 'pending', 'rejected'], cp.approval), cp.created_at
        """,
        (component_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def counted_parts(conn, component_ids: Iterable[str]) -> dict[str, list[str]]:
    """Part ids that count for each component: its main part and its approved alternates, main first."""

    wanted = sorted({str(item) for item in component_ids if item})
    if not wanted:
        return {}
    rows = conn.execute(
        """
        SELECT component_id, part_id FROM component_parts
        WHERE component_id = ANY(%s) AND approval = 'approved'
        ORDER BY component_id, role = 'main' DESC, created_at
        """,
        (wanted,),
    ).fetchall()
    found: dict[str, list[str]] = {}
    for row in rows:
        found.setdefault(row["component_id"], []).append(row["part_id"])
    return found


def components_of(conn, part_ids: Iterable[str]) -> dict[str, list[str]]:
    """The components each part counts for (as main or approved alternate)."""

    wanted = sorted({str(item) for item in part_ids if item})
    if not wanted:
        return {}
    rows = conn.execute(
        "SELECT part_id, component_id FROM component_parts WHERE part_id = ANY(%s) AND approval = 'approved' ORDER BY part_id, component_id",
        (wanted,),
    ).fetchall()
    found: dict[str, list[str]] = {}
    for row in rows:
        found.setdefault(row["part_id"], []).append(row["component_id"])
    return found


def _set_main(conn, component_id: str, part_id: str | None) -> bool:
    """Make ``part_id`` the component's main part (or remove the main part). True when something changed."""

    current = conn.execute(
        "SELECT part_id FROM component_parts WHERE component_id = %s AND role = 'main'", (component_id,)
    ).fetchone()
    if current and current["part_id"] == part_id:
        return False
    if current:
        conn.execute("DELETE FROM component_parts WHERE component_id = %s AND role = 'main'", (component_id,))
    if part_id is None:
        return current is not None
    # A part that was an alternate becomes the main part: the revision now names it.
    conn.execute(
        """
        INSERT INTO component_parts (component_id, part_id, role, approval, created_by, decided_by, decided_at)
        VALUES (%s, %s, 'main', 'approved', %s, %s, NOW())
        ON CONFLICT (component_id, part_id) DO UPDATE
            SET role = 'main', approval = 'approved', decided_by = EXCLUDED.decided_by, decided_at = NOW()
        """,
        (component_id, part_id, SYSTEM, SYSTEM),
    )
    return True


def sync_main(conn, component_ids: Iterable[str] | None = None, *, actor: str = SYSTEM) -> dict[str, int]:
    """Keep every active component's main part equal to its current revision's manufacturer and MPN.

    ``component_ids`` limits the work to those components; ``None`` syncs all of them. A number several makers share,
    with no maker to tell them apart, is left for a person (counted as ``ambiguous``).
    """

    counts = {"changed": 0, "ambiguous": 0}
    if not _present(conn):
        return counts
    wanted = None if component_ids is None else sorted({str(item) for item in component_ids if item})
    rows = conn.execute(
        """
        SELECT c.id, r.manufacturer, r.mpn
        FROM components c JOIN component_revisions r ON r.id = c.current_revision_id
        WHERE c.is_active = 1 AND (%s::text[] IS NULL OR c.id = ANY(%s::text[]))
        ORDER BY c.id
        """,
        (wanted, wanted),
    ).fetchall()
    for row in rows:
        part_id = None
        if match_key(row["mpn"]):
            try:
                with conn.transaction():
                    part_id = parts.ensure_part(conn, row["manufacturer"], row["mpn"], actor).id
            except parts.UnknownManufacturer:
                counts["ambiguous"] += 1
                continue
        counts["changed"] += int(_set_main(conn, row["id"], part_id))
    return counts


def propose_alternate(conn, component_id: str, manufacturer: str, mpn: str, actor: str) -> dict[str, Any]:
    """Propose a manufacturer part as an alternate. It counts once QA approves it."""

    actor = actor_text(actor)
    if not match_key(mpn):
        raise ComponentPartError("An alternate needs a part number.")
    try:
        with conn.transaction():
            part = parts.ensure_part(conn, manufacturer, mpn, actor, may_create=False)
    except parts.UnknownManufacturer as exc:
        raise ComponentPartError(str(exc)) from exc
    existing = conn.execute(
        "SELECT role, approval FROM component_parts WHERE component_id = %s AND part_id = %s", (component_id, part.id)
    ).fetchone()
    if existing and existing["role"] == MAIN:
        raise ComponentPartError("That is the component's main part.")
    if existing and existing["approval"] != REJECTED:
        raise ComponentPartError("That part is already an alternate of this component.")
    try:
        with conn.transaction():
            conn.execute(
                """
                INSERT INTO component_parts (component_id, part_id, role, approval, created_by)
                VALUES (%s, %s, 'alternate', 'pending', %s)
                ON CONFLICT (component_id, part_id) DO UPDATE
                    SET approval = 'pending', created_by = EXCLUDED.created_by, created_at = NOW(), decided_by = '', decided_at = NULL
                """,
                (component_id, part.id, actor),
            )
    except psycopg.errors.ForeignKeyViolation as exc:
        raise ComponentPartError("There is no such component.") from exc
    write_audit(conn, actor, "component_part.propose", component_id, {"part_id": part.id, "mpn": part.mpn}, subject_kind="component")
    return {"part_id": part.id, "manufacturer": part.manufacturer_name, "mpn": part.mpn, "approval": PENDING}


def decide(conn, component_id: str, part_id: str, approve: bool, actor: str) -> dict[str, Any]:
    """Approve or reject an alternate. A decision can be changed later; the main part is not decided here."""

    actor = actor_text(actor)
    approval = APPROVED if approve else REJECTED
    row = conn.execute(
        """
        UPDATE component_parts SET approval = %s, decided_by = %s, decided_at = NOW()
        WHERE component_id = %s AND part_id = %s AND role = 'alternate'
        RETURNING part_id
        """,
        (approval, actor, component_id, part_id),
    ).fetchone()
    if row is None:
        raise ComponentPartError("That part is not an alternate of this component.")
    write_audit(conn, actor, f"component_part.{approval}", component_id, {"part_id": part_id}, subject_kind="component")
    return {"part_id": part_id, "approval": approval}


def remove_alternate(conn, component_id: str, part_id: str, actor: str) -> None:
    actor = actor_text(actor)
    row = conn.execute(
        "DELETE FROM component_parts WHERE component_id = %s AND part_id = %s AND role = 'alternate' RETURNING part_id",
        (component_id, part_id),
    ).fetchone()
    if row is None:
        raise ComponentPartError("That part is not an alternate of this component.")
    write_audit(conn, actor, "component_part.remove", component_id, {"part_id": part_id}, subject_kind="component")

"""The approved parts list (AVL) of a catalog component.

A component's own manufacturer part is its primary source and comes from the catalog. This
list holds the alternates: other manufacturer parts that may stand in for it. Someone who
writes supply data proposes one; someone who approves (admin, qa) accepts or rejects it. An
approver who adds one approves it in the same step. Ranks order the approved ones.

The list is not part of any revision hash. Every change is audited.
"""

from __future__ import annotations

import uuid
from typing import Any

from app.services.supply import parts, parts_view
from app.services.supply.audit import actor_text, write_audit

PENDING, APPROVED, REJECTED = "pending", "approved", "rejected"
MAX_PER_COMPONENT = 50


class SourceNotFound(KeyError):
    """No source with this id."""


class SourceError(ValueError):
    """The change does not apply. The message is safe to show."""


def _row(conn, source_id: str):
    row = conn.execute("SELECT * FROM component_sources WHERE id = %s FOR UPDATE", (source_id,)).fetchone()
    if row is None:
        raise SourceNotFound(source_id)
    return row


def list_sources(conn, component_id: str) -> list[dict[str, Any]]:
    """Alternates in rank order, rejected ones last, each with how its part stands now."""

    rows = conn.execute(
        """
        SELECT cs.id, cs.part_id, cs.approval, cs.rank, cs.created_by, cs.decided_by,
               cs.created_at, cs.decided_at, p.mpn, m.name AS manufacturer
        FROM component_sources cs
        JOIN parts p ON p.id = cs.part_id
        JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE cs.component_id = %s
        ORDER BY (cs.approval = 'rejected'), cs.rank, cs.created_at
        """,
        (component_id,),
    ).fetchall()
    standing = {item["id"]: item for item in parts_view.summaries_for(conn, [row["part_id"] for row in rows])}

    def iso(value):
        return value.isoformat() if value else None

    items = []
    for row in rows:
        now = standing.get(row["part_id"], {})
        items.append({
            "id": row["id"],
            "part_id": row["part_id"],
            "manufacturer": row["manufacturer"],
            "mpn": row["mpn"],
            "approval": row["approval"],
            "rank": row["rank"],
            "created_by": row["created_by"],
            "decided_by": row["decided_by"],
            "created_at": iso(row["created_at"]),
            "decided_at": iso(row["decided_at"]),
            "status": now.get("status", "unknown"),
            "stock": now.get("stock"),
            "lifecycle": now.get("lifecycle", "unknown"),
        })
    return items


def add_source(conn, component_id: str, manufacturer: str, mpn: str, actor: str, *, approver: bool) -> dict[str, Any]:
    """Put a manufacturer part on a component's list: pending, or approved when an approver adds it."""

    actor = actor_text(actor)
    component_id = component_id.strip()
    if not component_id:
        raise SourceError("A component is required.")
    part = parts.ensure_part(conn, manufacturer, mpn, actor, may_create=approver)
    conn.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (f"component_sources:{component_id}",))
    stats = conn.execute(
        "SELECT COUNT(*) AS n, COALESCE(MAX(rank), 0) AS top FROM component_sources WHERE component_id = %s",
        (component_id,),
    ).fetchone()
    count, top = stats["n"], stats["top"]
    if conn.execute(
        "SELECT 1 FROM component_sources WHERE component_id = %s AND part_id = %s", (component_id, part.id)
    ).fetchone():
        raise SourceError("That part is already on the list.")
    if count >= MAX_PER_COMPONENT:
        raise SourceError(f"A component can have at most {MAX_PER_COMPONENT} alternates.")
    source_id = uuid.uuid4().hex
    approval = APPROVED if approver else PENDING
    conn.execute(
        """
        INSERT INTO component_sources (id, component_id, part_id, approval, rank, created_by, decided_by, decided_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, CASE WHEN %s THEN NOW() END)
        """,
        (source_id, component_id, part.id, approval, top + 1, actor, actor if approver else "", approver),
    )
    write_audit(conn, actor, "source.add", source_id,
                {"component_id": component_id, "part_id": part.id, "mpn": part.mpn, "approval": approval},
                subject_kind="component_source")
    return {"id": source_id, "part_id": part.id, "approval": approval}


def decide(conn, source_id: str, actor: str, *, approve: bool) -> str:
    """Approve or reject a source. Returns the component it belongs to."""

    actor = actor_text(actor)
    row = _row(conn, source_id)
    approval = APPROVED if approve else REJECTED
    if row["approval"] == approval:
        return row["component_id"]
    conn.execute(
        "UPDATE component_sources SET approval = %s, decided_by = %s, decided_at = NOW() WHERE id = %s",
        (approval, actor, source_id),
    )
    write_audit(conn, actor, "source.approve" if approve else "source.reject", source_id,
                {"component_id": row["component_id"], "part_id": row["part_id"], "was": row["approval"]},
                subject_kind="component_source")
    return row["component_id"]


def set_rank(conn, source_id: str, rank: int, actor: str) -> None:
    actor = actor_text(actor)
    if not 1 <= rank <= MAX_PER_COMPONENT:
        raise SourceError(f"Rank must be between 1 and {MAX_PER_COMPONENT}.")
    row = _row(conn, source_id)
    if row["rank"] == rank:
        return
    conn.execute("UPDATE component_sources SET rank = %s WHERE id = %s", (rank, source_id))
    write_audit(conn, actor, "source.rank", source_id,
                {"component_id": row["component_id"], "part_id": row["part_id"], "from": row["rank"], "to": rank},
                subject_kind="component_source")


def remove(conn, source_id: str, actor: str, *, approver: bool) -> None:
    """Take a part off the list. Someone who only proposes may withdraw their own pending ones."""

    actor = actor_text(actor)
    row = _row(conn, source_id)
    if not approver and (row["approval"] != PENDING or row["created_by"] != actor):
        raise SourceError("Only an approver can remove a part that is approved or was proposed by someone else.")
    conn.execute("DELETE FROM component_sources WHERE id = %s", (source_id,))
    write_audit(conn, actor, "source.remove", source_id,
                {"component_id": row["component_id"], "part_id": row["part_id"], "was": row["approval"]},
                subject_kind="component_source")


def coverage(conn, component_id: str, primary_part_id: str | None) -> dict[str, Any]:
    """What a component's parts hold together: its own part and the alternates approved for it, and which part gives how much.

    ``stock`` is the sum of the figures that exist; ``unread`` counts parts nobody has read yet, so a total is not taken for complete."""

    approved = [row for row in list_sources(conn, component_id) if row["approval"] == APPROVED]
    ids = [part_id for part_id in [primary_part_id, *(row["part_id"] for row in approved)] if part_id]
    standing = {item["id"]: item for item in parts_view.summaries_for(conn, ids)} if ids else {}
    contributors = []
    if primary_part_id and primary_part_id in standing:
        item = standing[primary_part_id]
        contributors.append({"part_id": primary_part_id, "manufacturer": item["manufacturer"], "mpn": item["mpn"], "role": "primary", "stock": item["stock"]})
    for row in approved:
        contributors.append({"part_id": row["part_id"], "manufacturer": row["manufacturer"], "mpn": row["mpn"], "role": "alternate", "stock": row["stock"]})
    known = [item["stock"] for item in contributors if item["stock"] is not None]
    return {
        "component_id": component_id,
        "stock": sum(known) if known else None,
        "unread": sum(1 for item in contributors if item["stock"] is None),
        "parts": contributors,
    }


def components_with_alternate(conn, part_id: str) -> list[str]:
    """The catalog components that list this part as an approved alternate."""

    return [
        row["component_id"] for row in conn.execute(
            "SELECT DISTINCT component_id FROM component_sources WHERE part_id = %s AND approval = %s ORDER BY component_id", (part_id, APPROVED)
        ).fetchall()
    ]

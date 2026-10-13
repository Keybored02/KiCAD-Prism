"""Demand: how many of a part are needed, and by when.

All needs live here, whatever made them. A person adds a ``manual`` demand; other sources
(a watched BOM, a manufacturing run) write their own rows with a ``source_ref`` so they can replace
them. A negative quantity is stock that is already on its way in. Open demand is ``planned`` or
``committed``; closing keeps the row.

The net requirement is open demand minus our own on-hand stock (read from the catalog by the
caller). Distributor stock is compared with that figure and is never added to our own.
"""

from __future__ import annotations

import uuid
from datetime import date
from typing import Any, Iterable, Mapping, Sequence

from app.services.supply import parts
from app.services.supply.audit import actor_text, write_audit

OPEN_STATES = ("planned", "committed")
STATES = ("planned", "committed", "closed")
MAX_QUANTITY = 100_000_000
MAX_NOTE = 200
MAX_REF = 100
MAX_OPEN_PER_PART = 200


class DemandNotFound(KeyError):
    """No demand with this id."""


class DemandError(ValueError):
    """The change does not apply. The message is safe to show."""


def _dto(row: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "part_id": row["part_id"],
        "source": row["source"],
        "source_ref": row["source_ref"],
        "quantity": row["quantity"],
        "need_by": row["need_by"].isoformat() if row["need_by"] else None,
        "state": row["state"],
        "note": row["note"],
        "created_by": row["created_by"],
        "created_at": row["created_at"].isoformat(),
        "closed_by": row["closed_by"],
        "closed_at": row["closed_at"].isoformat() if row["closed_at"] else None,
    }


def list_for_part(conn, part_id: str, *, include_closed: bool = False) -> list[dict[str, Any]]:
    """A part's demands, soonest need first; closed ones only when asked."""

    states = list(STATES if include_closed else OPEN_STATES)
    rows = conn.execute(
        "SELECT * FROM demands WHERE part_id = %s AND state = ANY(%s) ORDER BY need_by NULLS LAST, created_at",
        (part_id, states),
    ).fetchall()
    return [_dto(row) for row in rows]


def add_manual(
    conn, part_id: str, quantity: int, actor: str, *, need_by: date | None = None, committed: bool = False, note: str = ""
) -> dict[str, Any]:
    actor = actor_text(actor)
    parts.get_part(conn, part_id)
    if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity == 0 or abs(quantity) > MAX_QUANTITY:
        raise DemandError(f"Quantity must be a whole number other than 0, up to {MAX_QUANTITY:,}.")
    note = note.strip()
    if len(note) > MAX_NOTE:
        raise DemandError(f"A note can be at most {MAX_NOTE} characters.")
    count = conn.execute("SELECT COUNT(*) AS n FROM demands WHERE part_id = %s AND state <> 'closed'", (part_id,)).fetchone()["n"]
    if count >= MAX_OPEN_PER_PART:
        raise DemandError(f"A part can have at most {MAX_OPEN_PER_PART} open demands. Close some first.")
    demand_id = uuid.uuid4().hex
    state = "committed" if committed else "planned"
    conn.execute(
        "INSERT INTO demands (id, part_id, source, quantity, need_by, state, note, created_by) "
        "VALUES (%s, %s, 'manual', %s, %s, %s, %s, %s)",
        (demand_id, part_id, quantity, need_by, state, note, actor),
    )
    write_audit(conn, actor, "demand.add", demand_id,
                {"part_id": part_id, "quantity": quantity, "need_by": need_by.isoformat() if need_by else None, "state": state},
                subject_kind="demand")
    return _dto(conn.execute("SELECT * FROM demands WHERE id = %s", (demand_id,)).fetchone())


def replace_from_source(
    conn, source: str, source_ref: str, quantities: Mapping[str, int], actor: str, *, need_by: date | None = None, note: str = ""
) -> dict[str, int]:
    """Make ``source_ref`` ask for exactly ``quantities`` (part id to units): its open demand is closed and written again.

    This is how a watched BOM or a run keeps its demand current: the same name replaces its earlier one.
    Returns how many parts it asks for and how many it stopped asking for.
    """

    actor = actor_text(actor)
    if source not in ("bom_watch", "manufacturing_run"):
        raise DemandError("Only a BOM or a run can replace its own demand.")
    source_ref = source_ref.strip()
    if not source_ref or len(source_ref) > MAX_REF:
        raise DemandError(f"Give the plan a name of up to {MAX_REF} characters.")
    if any(quantity < 1 or quantity > MAX_QUANTITY for quantity in quantities.values()):
        raise DemandError(f"Quantities must be from 1 to {MAX_QUANTITY:,}.")
    for part_id in quantities:
        parts.get_part(conn, part_id)
    closed = conn.execute(
        "UPDATE demands SET state = 'closed', closed_by = %s, closed_at = NOW() "
        "WHERE source = %s AND source_ref = %s AND state <> 'closed'",
        (actor, source, source_ref),
    ).rowcount
    for part_id, quantity in quantities.items():
        conn.execute(
            "INSERT INTO demands (id, part_id, source, source_ref, quantity, need_by, state, note, created_by) "
            "VALUES (%s, %s, %s, %s, %s, %s, 'planned', %s, %s)",
            (uuid.uuid4().hex, part_id, source, source_ref, quantity, need_by, note.strip()[:MAX_NOTE], actor),
        )
    write_audit(conn, actor, "demand.replace", source_ref,
                {"source": source, "parts": len(quantities), "replaced": closed, "need_by": need_by.isoformat() if need_by else None},
                subject_kind="demand")
    return {"parts": len(quantities), "replaced": closed}


def close(conn, demand_id: str, actor: str) -> None:
    actor = actor_text(actor)
    row = conn.execute("SELECT * FROM demands WHERE id = %s FOR UPDATE", (demand_id,)).fetchone()
    if row is None:
        raise DemandNotFound(demand_id)
    if row["state"] == "closed":
        return
    conn.execute("UPDATE demands SET state = 'closed', closed_by = %s, closed_at = NOW() WHERE id = %s", (actor, demand_id))
    write_audit(conn, actor, "demand.close", demand_id,
                {"part_id": row["part_id"], "quantity": row["quantity"], "was": row["state"]}, subject_kind="demand")


def open_totals(conn, part_ids: Sequence[str]) -> dict[str, int]:
    """Open demand per part, own incoming (negative) entries included. Parts with none are left out."""

    if not part_ids:
        return {}
    rows = conn.execute(
        "SELECT part_id, SUM(quantity)::int AS total FROM demands WHERE part_id = ANY(%s) AND state = ANY(%s) GROUP BY part_id",
        (list(part_ids), list(OPEN_STATES)),
    ).fetchall()
    return {row["part_id"]: row["total"] for row in rows}


def next_needs(conn, part_ids: Sequence[str]) -> dict[str, str]:
    """Per part, the soonest date something open is needed by. Parts with no dated demand are left out."""

    if not part_ids:
        return {}
    rows = conn.execute(
        "SELECT part_id, MIN(need_by) AS day FROM demands WHERE part_id = ANY(%s) AND state = ANY(%s) AND quantity > 0 AND need_by IS NOT NULL "
        "GROUP BY part_id",
        (list(part_ids), list(OPEN_STATES)),
    ).fetchall()
    return {row["part_id"]: row["day"].isoformat() for row in rows}


def net_requirement(open_total: int, own_stock: int | None) -> int:
    """What distributors must cover: open demand less our own stock. Never below 0."""

    return max(0, open_total - (own_stock or 0))


def summary(conn, part_id: str, own_stock: int | None) -> dict[str, Any]:
    """The figures a part sheet shows: open demand, our stock, what is left to cover, and the next date."""

    total = open_totals(conn, [part_id]).get(part_id, 0)
    soonest = conn.execute(
        "SELECT MIN(need_by) AS day FROM demands WHERE part_id = %s AND state = ANY(%s) AND quantity > 0",
        (part_id, list(OPEN_STATES)),
    ).fetchone()["day"]
    return {
        "open": total,
        "own_stock": own_stock,
        "net": net_requirement(total, own_stock),
        "next_need_by": soonest.isoformat() if soonest else None,
    }


def coverage(stock: int | None, open_total: int) -> float | None:
    """Distributor stock as a multiple of open demand; None without demand or without a stock figure."""

    if stock is None or open_total <= 0:
        return None
    return stock / open_total


def parts_with_demand(conn, part_ids: Iterable[str]) -> set[str]:
    return set(open_totals(conn, list(part_ids)))

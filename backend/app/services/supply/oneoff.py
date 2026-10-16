"""Check once: read a BOM or a component at the distributors without tracking it.

Tracking a part costs a share of a budget every day. A check costs a handful of calls, once, for a part nobody follows (a
BOM from a file, a component being considered). A request lists its parts; ``read_request_work`` has a row for each part and
distributor still to read. The worker serves it from the pool the budget keeps for one-off work, and from spare budget when
the pool is empty, so a large BOM finishes over an evening or a weekend. Progress is how many parts have been read
everywhere they will be.

A part that is already tracked is left out: the schedule reads it. Assembly-only distributors are left out too, as for a
person's own tracking.
"""

from __future__ import annotations

import uuid
from typing import Any, Sequence

from app.services.supply import parts
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.identity import alias_key, match_key
from app.services.supply.providers import registry

MAX_PARTS = 2000
MAX_ATTEMPTS = 5
PER_RUN = 20


class RequestError(ValueError):
    """The request cannot be made. The message is safe to show."""


def _eligible_connectors(conn) -> list[str]:
    ids = []
    for row in conn.execute("SELECT id, provider FROM connectors WHERE enabled AND paused_reason = '' ORDER BY created_at, id").fetchall():
        try:
            spec = registry.get_spec(row["provider"])
        except registry.UnknownProvider:
            continue
        if spec.assembly_only:
            continue
        ids.append(row["id"])
    return ids


def request(
    conn, kind: str, lines: Sequence[tuple[str, str]], actor: str, *, project_id: str = "", may_create_manufacturer: bool = True,
) -> dict[str, Any]:
    """Queue a check of these (manufacturer, part number) lines. Returns the request and what was left out."""

    actor = actor_text(actor)
    if kind not in ("bom", "component"):
        raise RequestError("A check is of a BOM or a component.")
    distinct: dict[tuple[str, str], tuple[str, str]] = {}
    skipped: list[dict[str, str]] = []
    for maker, mpn in lines:
        if not match_key(mpn):
            skipped.append({"mpn": mpn, "reason": "no_mpn"})
        elif not alias_key(maker):
            skipped.append({"mpn": mpn, "reason": "no_manufacturer"})
        else:
            distinct.setdefault((alias_key(maker), match_key(mpn)), (maker, mpn))
    if not distinct:
        raise RequestError("Nothing on it names both a manufacturer and a part number.")
    if len(distinct) > MAX_PARTS:
        raise RequestError(f"At most {MAX_PARTS:,} parts can be checked at once.")
    connectors = _eligible_connectors(conn)
    if not connectors:
        raise RequestError("There is no distributor to ask.")
    request_id = uuid.uuid4().hex
    conn.execute("INSERT INTO read_requests (id, kind, project_id, requested_by) VALUES (%s, %s, %s, %s)", (request_id, kind, project_id, actor))
    part_ids: list[str] = []
    tracked = 0
    for maker, mpn in distinct.values():
        try:
            with conn.transaction():
                part = parts.ensure_part(conn, maker, mpn, actor, may_create=may_create_manufacturer)
        except parts.UnknownManufacturer:
            skipped.append({"mpn": mpn, "reason": "unknown_manufacturer"})
            continue
        if conn.execute("SELECT 1 FROM part_tiers WHERE part_id = %s", (part.id,)).fetchone():
            tracked += 1
            continue
        part_ids.append(part.id)
    for part_id in part_ids:
        for connector_id in connectors:
            conn.execute(
                "INSERT INTO read_request_work (request_id, part_id, connector_id) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                (request_id, part_id, connector_id),
            )
    if not part_ids:
        conn.execute("UPDATE read_requests SET finished_at = NOW() WHERE id = %s", (request_id,))
    write_audit(conn, actor, "check.request", request_id,
                {"kind": kind, "project_id": project_id, "parts": len(part_ids), "already_tracked": tracked}, subject_kind="check")
    return {"id": request_id, "parts": len(part_ids), "already_tracked": tracked, "skipped": skipped}


def progress(conn, request_id: str) -> dict[str, Any]:
    row = conn.execute("SELECT id, kind, project_id, created_at, finished_at FROM read_requests WHERE id = %s", (request_id,)).fetchone()
    if row is None:
        raise KeyError(request_id)
    counts = conn.execute(
        """
        SELECT COUNT(*) AS total,
               COUNT(*) FILTER (WHERE open = 0) AS done,
               COUNT(*) FILTER (WHERE failed > 0 AND open = 0) AS failed
        FROM (SELECT part_id, COUNT(*) FILTER (WHERE state = 'pending') AS open, COUNT(*) FILTER (WHERE state = 'failed') AS failed
              FROM read_request_work WHERE request_id = %s GROUP BY part_id) per_part
        """,
        (request_id,),
    ).fetchone()
    return {
        "id": row["id"], "kind": row["kind"], "project_id": row["project_id"], "created_at": row["created_at"].isoformat(),
        "finished": row["finished_at"] is not None, "parts": int(counts["total"]), "done": int(counts["done"]), "failed": int(counts["failed"]),
    }


def pending_connectors(conn) -> list[str]:
    """Connectors with a part still to read for an open request."""

    return [r["connector_id"] for r in conn.execute(
        "SELECT DISTINCT w.connector_id FROM read_request_work w JOIN read_requests q ON q.id = w.request_id "
        "WHERE w.state = 'pending' AND q.finished_at IS NULL").fetchall()]


def _finish(conn) -> None:
    conn.execute(
        "UPDATE read_requests q SET finished_at = NOW() WHERE finished_at IS NULL "
        "AND NOT EXISTS (SELECT 1 FROM read_request_work w WHERE w.request_id = q.id AND w.state = 'pending')"
    )


def run(discoverer, poller, store, connector_id: str, *, limit: int = PER_RUN) -> dict[str, int]:
    """Serve the open requests at one connector: search the parts not yet searched, then read their listings."""

    with store.connection() as conn:
        rows = conn.execute(
            "SELECT w.request_id, w.part_id FROM read_request_work w JOIN read_requests q ON q.id = w.request_id "
            "WHERE w.connector_id = %s AND w.state = 'pending' AND q.finished_at IS NULL ORDER BY q.created_at, w.part_id LIMIT %s",
            (connector_id, limit),
        ).fetchall()
    if not rows:
        return {"parts": 0, "done": 0}
    part_ids = list(dict.fromkeys(r["part_id"] for r in rows))
    _searched, search_stop = discoverer.search_parts(connector_id, part_ids)
    summary = poller.poll_connector(connector_id, only_part=part_ids, oneoff=True)
    # Waiting for budget or a rest is not a failed try: the work stays for the next run.
    waiting = {"budget", "cooling_down", "inactive"}
    resting = search_stop in waiting or summary.stopped in waiting
    done = 0
    with store.connection() as conn:
        for part_id in part_ids:
            ready = conn.execute(
                """
                SELECT EXISTS (SELECT 1 FROM discovery_runs d WHERE d.part_id = %(p)s AND d.connector_id = %(c)s) AS searched,
                       NOT EXISTS (SELECT 1 FROM listings l LEFT JOIN offers o ON o.listing_id = l.id
                                   WHERE l.part_id = %(p)s AND l.connector_id = %(c)s AND l.match_state IN ('exact', 'manual')
                                     AND o.listing_id IS NULL) AS read
                """,
                {"p": part_id, "c": connector_id},
            ).fetchone()
            if ready["searched"] and ready["read"]:
                done += conn.execute(
                    "UPDATE read_request_work SET state = 'done' WHERE connector_id = %s AND part_id = %s AND state = 'pending'", (connector_id, part_id)
                ).rowcount
            elif not resting:
                conn.execute(
                    "UPDATE read_request_work SET attempts = attempts + 1, state = CASE WHEN attempts + 1 >= %s THEN 'failed' ELSE state END "
                    "WHERE connector_id = %s AND part_id = %s AND state = 'pending'", (MAX_ATTEMPTS, connector_id, part_id),
                )
        _finish(conn)
    return {"parts": len(part_ids), "done": done}

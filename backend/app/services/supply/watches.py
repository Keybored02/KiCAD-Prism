"""The watchlist: parts someone wants tracked. Functions on a connection; none commit.

A watch is one per part. It decides which parts get polled and carries the
rules that raise the polling rate: a stock threshold and a pin to the fastest
tier. Pins are capped so they cannot starve everything else of quota.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from app.services.supply import parts
from app.services.supply.audit import actor_text, write_audit

MAX_PINNED = 25

_UNSET: Any = object()


class WatchNotFound(KeyError):
    """No watch with this id."""


class WatchError(ValueError):
    """The change breaks a watch rule. The message is safe to show."""


@dataclass(frozen=True, slots=True)
class WatchRecord:
    id: str
    part_id: str
    manufacturer_name: str
    mpn: str
    threshold: int | None
    pinned: bool
    owner: str
    created_at: datetime


_SELECT = """
    SELECT w.id, w.part_id, m.name AS manufacturer_name, p.mpn, w.threshold, w.pinned, w.owner, w.created_at
    FROM watches w JOIN parts p ON p.id = w.part_id JOIN manufacturers m ON m.id = p.manufacturer_id
"""


def _record(row) -> WatchRecord:
    return WatchRecord(
        row["id"], row["part_id"], row["manufacturer_name"], row["mpn"],
        row["threshold"], bool(row["pinned"]), row["owner"], row["created_at"],
    )


def _check_threshold(threshold: Any) -> int | None:
    if threshold is None:
        return None
    if isinstance(threshold, bool) or not isinstance(threshold, int) or threshold < 0:
        raise WatchError("The threshold is a whole number, 0 or more.")
    return threshold


def _check_pin_room(conn, *, excluding: str | None = None) -> None:
    pinned = conn.execute(
        "SELECT COUNT(*) AS n FROM watches WHERE pinned AND id IS DISTINCT FROM %s", (excluding,)
    ).fetchone()["n"]
    if pinned >= MAX_PINNED:
        raise WatchError(f"At most {MAX_PINNED} parts can be pinned to the fastest polling.")


def get_watch(conn, watch_id: str) -> WatchRecord:
    row = conn.execute(_SELECT + " WHERE w.id = %s", (watch_id,)).fetchone()
    if row is None:
        raise WatchNotFound(watch_id)
    return _record(row)


def list_watches(conn) -> list[WatchRecord]:
    rows = conn.execute(_SELECT + " ORDER BY lower(m.name), lower(p.mpn)").fetchall()
    return [_record(row) for row in rows]


def add_watch(
    conn, manufacturer_name: str, mpn: str, actor: str, *, threshold: int | None = None, pinned: bool = False
) -> WatchRecord:
    """Watch a part, creating it if needed. Watching a watched part returns the existing watch."""

    actor = actor_text(actor)
    threshold = _check_threshold(threshold)
    part = parts.ensure_part(conn, manufacturer_name, mpn, actor)
    existing = conn.execute("SELECT id FROM watches WHERE part_id = %s", (part.id,)).fetchone()
    if existing:
        return get_watch(conn, existing["id"])
    if pinned:
        _check_pin_room(conn)
    watch_id = uuid.uuid4().hex
    conn.execute(
        "INSERT INTO watches (id, part_id, threshold, pinned, owner, created_by) VALUES (%s, %s, %s, %s, %s, %s) "
        "ON CONFLICT (part_id) DO NOTHING",
        (watch_id, part.id, threshold, pinned, actor, actor),
    )
    row = conn.execute("SELECT id FROM watches WHERE part_id = %s", (part.id,)).fetchone()
    write_audit(conn, actor, "watch.add", row["id"], {"part_id": part.id, "pinned": pinned}, subject_kind="watch")
    return get_watch(conn, row["id"])


def update_watch(conn, watch_id: str, actor: str, *, threshold: Any = _UNSET, pinned: Any = _UNSET) -> WatchRecord:
    """Change the rules of a watch. Omit a field to leave it; ``threshold=None`` clears it."""

    actor = actor_text(actor)
    current = get_watch(conn, watch_id)
    changes: dict[str, Any] = {}
    if threshold is not _UNSET:
        changes["threshold"] = _check_threshold(threshold)
    if pinned is not _UNSET:
        if not isinstance(pinned, bool):
            raise WatchError("Pinned is true or false.")
        if pinned and not current.pinned:
            _check_pin_room(conn, excluding=watch_id)
        changes["pinned"] = pinned
    if not changes:
        return current
    # Column names come from the fixed set above, never from the caller.
    assignments = ", ".join(f"{column} = %s" for column in changes)
    conn.execute(f"UPDATE watches SET {assignments}, updated_at = NOW() WHERE id = %s", (*changes.values(), watch_id))
    write_audit(conn, actor, "watch.update", watch_id, {"fields": sorted(changes)}, subject_kind="watch")
    return get_watch(conn, watch_id)


def remove_watch(conn, watch_id: str, actor: str) -> None:
    actor = actor_text(actor)
    get_watch(conn, watch_id)
    conn.execute("DELETE FROM watches WHERE id = %s", (watch_id,))
    write_audit(conn, actor, "watch.remove", watch_id, {}, subject_kind="watch")

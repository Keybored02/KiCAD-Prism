"""The watchlist: parts someone wants tracked. Functions on a connection; none commit.

A watch is one per part. It decides which parts get polled and carries the
rules that raise the polling rate: a stock threshold and a pin to the fastest
tier. Pins are capped so they cannot starve everything else of quota.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from app.services.supply import alerts, component_parts, parts, stock, tracking
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
    packaging: str = "any"
    tier: int = 2
    rate: str = "weekly"
    origin: str = "person"


_SELECT = """
    SELECT w.id, w.part_id, m.name AS manufacturer_name, p.mpn, w.threshold, w.pinned, w.owner, w.created_at, w.packaging,
           w.tier, w.rate, w.origin
    FROM supply_watches w JOIN supply_parts p ON p.id = w.part_id JOIN supply_manufacturers m ON m.id = p.manufacturer_id
"""


def _record(row) -> WatchRecord:
    return WatchRecord(
        row["id"], row["part_id"], row["manufacturer_name"], row["mpn"],
        row["threshold"], bool(row["pinned"]), row["owner"], row["created_at"], row["packaging"],
        int(row["tier"]), row["rate"], row["origin"],
    )


def _check_threshold(threshold: Any) -> int | None:
    if threshold is None:
        return None
    if isinstance(threshold, bool) or not isinstance(threshold, int) or threshold < 0:
        raise WatchError("The threshold is a whole number, 0 or more.")
    return threshold


def _check_packaging(packaging: Any) -> str:
    if packaging not in stock.POLICIES:
        raise WatchError("Packaging is any, cut_tape, tape_reel, tray, tube or bulk.")
    return packaging


def _check_pin_room(conn, *, excluding: str | None = None) -> None:
    pinned = conn.execute(
        "SELECT COUNT(*) AS n FROM supply_watches WHERE pinned AND id IS DISTINCT FROM %s", (excluding,)
    ).fetchone()["n"]
    if pinned >= MAX_PINNED:
        raise WatchError(f"At most {MAX_PINNED} parts can be pinned to the fastest polling.")


def _more_often(asked: tuple[int, str], current: tuple[int, str]) -> bool:
    return (asked[0], tracking.RATE_DAYS[asked[1]]) < (current[0], tracking.RATE_DAYS[current[1]])


def get_watch(conn, watch_id: str) -> WatchRecord:
    row = conn.execute(_SELECT + " WHERE w.id = %s", (watch_id,)).fetchone()
    if row is None:
        raise WatchNotFound(watch_id)
    return _record(row)


def add_watch(
    conn,
    manufacturer_name: str,
    mpn: str,
    actor: str,
    *,
    threshold: int | None = None,
    pinned: bool = False,
    packaging: str = "any",
    tier: int | None = None,
    rate: str | None = None,
    origin: str = "person",
    may_create_manufacturer: bool = True,
) -> tuple[WatchRecord, bool]:
    """Watch a library part. Returns the watch and whether it is new; a number with no library component is ``NotInLibrary``.

    Watching a part that is already watched keeps that watch, and applies the rules
    that were asked for on top of it, so nothing the caller sent is dropped. A tier asked for here only ever raises a
    watch (tier 1 over tier 2); lowering one is ``update_watch``.
    """

    actor = actor_text(actor)
    threshold = _check_threshold(threshold)
    packaging = _check_packaging(packaging)
    asked_tier = tracking.check_tier(tier, rate or "weekly") if tier is not None else None
    part = component_parts.library_part(conn, manufacturer_name, mpn, actor, may_create=may_create_manufacturer)
    existing = conn.execute("SELECT id FROM supply_watches WHERE part_id = %s", (part.id,)).fetchone()
    if existing:
        asked: dict[str, Any] = {}
        if threshold is not None:
            asked["threshold"] = threshold
        if pinned:
            asked["pinned"] = True
        if packaging != "any":
            asked["packaging"] = packaging
        current = get_watch(conn, existing["id"])
        if asked_tier and _more_often(asked_tier, (current.tier, current.rate)):
            asked["tier"], asked["rate"] = asked_tier
        return (update_watch(conn, existing["id"], actor, **asked) if asked else get_watch(conn, existing["id"])), False
    if pinned:
        _check_pin_room(conn)
    watch_id = uuid.uuid4().hex
    new_tier, new_rate = asked_tier or (tracking.TIER_2, "weekly")
    created = conn.execute(
        "INSERT INTO supply_watches (id, part_id, threshold, pinned, packaging, tier, rate, origin, owner, created_by) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (part_id) DO NOTHING RETURNING id",
        (watch_id, part.id, threshold, pinned, packaging, new_tier, new_rate, origin, actor, actor),
    ).fetchone()
    row = conn.execute("SELECT id FROM supply_watches WHERE part_id = %s", (part.id,)).fetchone()
    if created:
        write_audit(conn, actor, "watch.add", row["id"],
                    {"part_id": part.id, "threshold": threshold, "pinned": pinned, "packaging": packaging,
                     "tier": new_tier, "rate": new_rate, "origin": origin}, subject_kind="watch")
        tracking.recompute(conn, [part.id])
    return get_watch(conn, row["id"]), bool(created)


def update_watch(
    conn, watch_id: str, actor: str, *, threshold: Any = _UNSET, pinned: Any = _UNSET, packaging: Any = _UNSET,
    tier: Any = _UNSET, rate: Any = _UNSET,
) -> WatchRecord:
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
    if packaging is not _UNSET:
        changes["packaging"] = _check_packaging(packaging)
    if tier is not _UNSET or rate is not _UNSET:
        changes["tier"], changes["rate"] = tracking.check_tier(
            current.tier if tier is _UNSET else tier,
            (current.rate if current.rate != "daily" else "weekly") if rate is _UNSET else rate,
        )
    # A field sent with the value it already has is no change: no write, no audit row, no alert run.
    changes = {field: value for field, value in changes.items() if getattr(current, field) != value}
    if not changes:
        return current
    # Column names come from the fixed set above, never from the caller.
    assignments = ", ".join(f"{column} = %s" for column in changes)
    conn.execute(f"UPDATE supply_watches SET {assignments}, updated_at = NOW() WHERE id = %s", (*changes.values(), watch_id))
    before = {field: getattr(current, field) for field in changes}
    write_audit(conn, actor, "watch.update", watch_id, {"before": before, "after": changes}, subject_kind="watch")
    tracking.recompute(conn, [current.part_id])
    alerts.evaluate_parts(conn, [current.part_id], datetime.now(timezone.utc))
    return get_watch(conn, watch_id)


def set_tier(conn, part_id: str, tier: int, rate: str, actor: str) -> WatchRecord:
    """Put a part in tier 1 or 2 by a person's choice, watching it if it is not watched. Lowers as well as raises."""

    tier, rate = tracking.check_tier(tier, rate)
    part = parts.get_part(conn, part_id)
    existing = conn.execute("SELECT id FROM supply_watches WHERE part_id = %s", (part_id,)).fetchone()
    if existing:
        return update_watch(conn, existing["id"], actor, tier=tier, rate=rate)
    record, _created = add_watch(conn, part.manufacturer_name, part.mpn, actor, tier=tier, rate=rate)
    return record


def stop_tracking(conn, part_id: str, actor: str) -> bool:
    """Take a part out of a person's tracking. It stays followed for any other reason (a project, a component)."""

    existing = conn.execute("SELECT id FROM supply_watches WHERE part_id = %s", (part_id,)).fetchone()
    if existing is None:
        return False
    remove_watch(conn, existing["id"], actor)
    return True


def remove_watch(conn, watch_id: str, actor: str) -> None:
    actor = actor_text(actor)
    current = get_watch(conn, watch_id)
    conn.execute("DELETE FROM supply_watches WHERE id = %s", (watch_id,))
    if current.origin == "component":
        # A watch a component asked for comes back with the next sync unless the component watch goes too.
        from app.services.supply import component_watches

        component_watches.forget_part(conn, current.part_id)
    tracking.recompute(conn, [current.part_id])
    # Without a watch every condition is false, so its alerts clear.
    alerts.evaluate_parts(conn, [current.part_id], datetime.now(timezone.utc))
    write_audit(conn, actor, "watch.remove", watch_id,
                {"part_id": current.part_id, "threshold": current.threshold, "pinned": current.pinned},
                subject_kind="watch")

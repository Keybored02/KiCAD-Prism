"""Alerts: when a watched part crosses a line, say so once, and stop saying it when it clears.

Alerts are in-app only; nothing is sent anywhere. One alert exists per part and kind.
A condition has to hold on two evaluations at least ``HOLD`` apart before it opens
(so one odd reading does not raise anything), except a lost part, which is already
a settled fact. A condition that clears resolves its alert by itself. A person can
acknowledge an alert (it stays listed, quieter) or snooze it; a worse severity wakes
either of them up.

Evaluation happens when a part has just been read, when its watch changes, and when
it stops being watched. Functions work on a connection and do not commit.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Iterable, Mapping

from app.services.supply import parts_view
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.vocabulary import Lifecycle, Status

HOLD = timedelta(minutes=30)
MAX_SNOOZE_HOURS = 24 * 30

# Kinds, and the severity that goes with them. Lifecycle severity depends on the value.
OUT_OF_STOCK = "out_of_stock"
BELOW_THRESHOLD = "below_threshold"
LIFECYCLE = "lifecycle"
PART_LOST = "part_lost"
KINDS = (OUT_OF_STOCK, BELOW_THRESHOLD, LIFECYCLE, PART_LOST)

_IMMEDIATE = frozenset({PART_LOST})
_SEVERITY_RANK = {Status.FATAL.value: 0, Status.ERROR.value: 1, Status.WARNING.value: 2}

PENDING, OPEN, ACKNOWLEDGED, SNOOZED, RESOLVED = "pending", "open", "acknowledged", "snoozed", "resolved"


class AlertNotFound(KeyError):
    """No alert with this id."""


class AlertError(ValueError):
    """The action does not apply to this alert. The message is safe to show."""


@dataclass(frozen=True, slots=True)
class Condition:
    severity: str
    detail: Mapping[str, Any]


def conditions_for(item: Mapping[str, Any]) -> dict[str, Condition]:
    """The lines a watched part has crossed, from its summary row."""

    found: dict[str, Condition] = {}
    watch = item["watch"]
    if watch is None:
        return found
    stock = item["stock"]
    if item["problem"]:
        found[PART_LOST] = Condition(Status.ERROR.value, {"problem": item["problem"]})
    if stock is not None:
        if stock == 0:
            found[OUT_OF_STOCK] = Condition(Status.ERROR.value, {"stock": 0})
        elif watch["threshold"] is not None and stock <= watch["threshold"]:
            found[BELOW_THRESHOLD] = Condition(Status.WARNING.value, {"stock": stock, "threshold": watch["threshold"]})
    lifecycle = item["lifecycle"]
    if lifecycle == Lifecycle.OBSOLETE.value:
        found[LIFECYCLE] = Condition(Status.FATAL.value, {"lifecycle": lifecycle})
    elif lifecycle in (Lifecycle.NRND.value, Lifecycle.LAST_TIME_BUY.value):
        found[LIFECYCLE] = Condition(Status.WARNING.value, {"lifecycle": lifecycle})
    return found


def evaluate_parts(conn, part_ids: Iterable[str], now: datetime) -> None:
    """Bring the alerts of these parts in line with how they stand now."""

    ids = sorted(set(part_ids))
    if not ids:
        return
    current = {item["id"]: conditions_for(item) for item in parts_view.summaries_for(conn, ids)}
    existing: dict[tuple[str, str], Mapping[str, Any]] = {}
    for row in conn.execute(
        "SELECT * FROM alerts WHERE part_id = ANY(%s) AND state <> 'resolved' FOR UPDATE", (ids,)
    ).fetchall():
        existing[(row["part_id"], row["kind"])] = row

    for part_id in ids:
        found = current.get(part_id, {})
        for kind in KINDS:
            row = existing.get((part_id, kind))
            condition = found.get(kind)
            if condition is None:
                if row is not None:
                    _clear(conn, row, now)
            elif row is None:
                _begin(conn, part_id, kind, condition, now)
            else:
                _update(conn, row, kind, condition, now)


def _begin(conn, part_id: str, kind: str, condition: Condition, now: datetime) -> None:
    state = OPEN if kind in _IMMEDIATE else PENDING
    conn.execute(
        """
        INSERT INTO alerts (part_id, kind, severity, state, first_seen_at, seen_count, opened_at, last_event_at, detail)
        VALUES (%s, %s, %s, %s, %s, 1, %s, %s, %s::jsonb)
        """,
        (part_id, kind, condition.severity, state, now, now if state == OPEN else None, now,
         json.dumps(dict(condition.detail))),
    )


def _clear(conn, row: Mapping[str, Any], now: datetime) -> None:
    if row["state"] == PENDING:
        conn.execute("DELETE FROM alerts WHERE id = %s", (row["id"],))
    else:
        conn.execute("UPDATE alerts SET state = 'resolved', resolved_at = %s WHERE id = %s", (now, row["id"]))


def _update(conn, row: Mapping[str, Any], kind: str, condition: Condition, now: datetime) -> None:
    detail = json.dumps(dict(condition.detail))
    worse = _SEVERITY_RANK[condition.severity] < _SEVERITY_RANK[row["severity"]]
    state = row["state"]
    if state == PENDING:
        seen = row["seen_count"] + 1
        if seen >= 2 and now - row["first_seen_at"] >= HOLD:
            conn.execute(
                "UPDATE alerts SET state = 'open', seen_count = %s, severity = %s, opened_at = %s, last_event_at = %s, "
                "detail = %s::jsonb WHERE id = %s",
                (seen, condition.severity, now, now, detail, row["id"]),
            )
        else:
            conn.execute(
                "UPDATE alerts SET seen_count = %s, severity = %s, detail = %s::jsonb WHERE id = %s",
                (seen, condition.severity, detail, row["id"]),
            )
        return
    wake = worse or (state == SNOOZED and row["snoozed_until"] is not None and row["snoozed_until"] <= now)
    if wake:
        conn.execute(
            "UPDATE alerts SET state = 'open', severity = %s, last_event_at = %s, acknowledged_by = '', "
            "acknowledged_at = NULL, snoozed_until = NULL, detail = %s::jsonb WHERE id = %s",
            (condition.severity, now, detail, row["id"]),
        )
    else:
        conn.execute("UPDATE alerts SET severity = %s, detail = %s::jsonb WHERE id = %s",
                     (condition.severity, detail, row["id"]))


# --- reading -------------------------------------------------------------------


def _effective_state(row: Mapping[str, Any], now: datetime) -> str:
    if row["state"] == SNOOZED and row["snoozed_until"] is not None and row["snoozed_until"] <= now:
        return OPEN
    return row["state"]


def list_alerts(conn, now: datetime, *, include_resolved: bool = False, limit: int = 200) -> list[dict[str, Any]]:
    """Alerts people should see: worst first, then newest. Resolved ones only on request (recent first)."""

    states = [OPEN, ACKNOWLEDGED, SNOOZED] + ([RESOLVED] if include_resolved else [])
    rows = conn.execute(
        """
        SELECT a.*, p.mpn, m.name AS manufacturer
        FROM alerts a JOIN parts p ON p.id = a.part_id JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE a.state = ANY(%s)
        ORDER BY a.last_event_at DESC, a.id DESC
        LIMIT %s
        """,
        (states, limit),
    ).fetchall()
    items = [_dto(row, now) for row in rows]
    items.sort(key=lambda item: (item["state"] == RESOLVED, _SEVERITY_RANK.get(item["severity"], 3)))
    return items


def count_attention(conn, now: datetime) -> int:
    """Alerts that are open (not acknowledged, snoozed or resolved)."""

    return int(conn.execute(
        "SELECT COUNT(*) AS n FROM alerts WHERE state = 'open' OR (state = 'snoozed' AND snoozed_until <= %s)", (now,)
    ).fetchone()["n"])


def _dto(row: Mapping[str, Any], now: datetime) -> dict[str, Any]:
    def iso(value: datetime | None) -> str | None:
        return value.isoformat() if value else None

    return {
        "id": row["id"],
        "part_id": row["part_id"],
        "mpn": row["mpn"],
        "manufacturer": row["manufacturer"],
        "kind": row["kind"],
        "severity": row["severity"],
        "state": _effective_state(row, now),
        "detail": row["detail"],
        "opened_at": iso(row["opened_at"]),
        "last_event_at": iso(row["last_event_at"]),
        "acknowledged_by": row["acknowledged_by"],
        "snoozed_until": iso(row["snoozed_until"]),
        "resolved_at": iso(row["resolved_at"]),
    }


# --- actions -------------------------------------------------------------------


def _fetch(conn, alert_id: int):
    row = conn.execute("SELECT * FROM alerts WHERE id = %s FOR UPDATE", (alert_id,)).fetchone()
    if row is None or row["state"] == PENDING:
        raise AlertNotFound(alert_id)
    if row["state"] == RESOLVED:
        raise AlertError("This alert has already cleared.")
    return row


def acknowledge(conn, alert_id: int, actor: str, now: datetime) -> None:
    actor = actor_text(actor)
    row = _fetch(conn, alert_id)
    if _effective_state(row, now) != OPEN:
        raise AlertError("Only an open alert can be acknowledged.")
    conn.execute(
        "UPDATE alerts SET state = 'acknowledged', acknowledged_by = %s, acknowledged_at = %s WHERE id = %s",
        (actor, now, alert_id),
    )
    write_audit(conn, actor, "alert.acknowledge", str(alert_id), {"kind": row["kind"]}, subject_kind="alert")


def snooze(conn, alert_id: int, hours: int, actor: str, now: datetime) -> None:
    actor = actor_text(actor)
    if isinstance(hours, bool) or not isinstance(hours, int) or not 1 <= hours <= MAX_SNOOZE_HOURS:
        raise AlertError(f"Snooze for 1 to {MAX_SNOOZE_HOURS} hours.")
    row = _fetch(conn, alert_id)
    until = now + timedelta(hours=hours)
    conn.execute(
        "UPDATE alerts SET state = 'snoozed', snoozed_until = %s, acknowledged_by = %s, acknowledged_at = %s WHERE id = %s",
        (until, actor, now, alert_id),
    )
    write_audit(conn, actor, "alert.snooze", str(alert_id), {"kind": row["kind"], "hours": hours}, subject_kind="alert")

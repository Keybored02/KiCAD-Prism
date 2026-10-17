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
from decimal import Decimal
from typing import Any, Iterable, Mapping

from app.services.supply import alert_rules, insights, parts_view, pcn, prices
from app.services.supply.audit import actor_text, write_audit
from app.services.supply.vocabulary import Lifecycle, Status

HOLD = timedelta(minutes=30)
MAX_SNOOZE_HOURS = 24 * 30

# Kinds, and the severity that goes with them. Lifecycle severity depends on the value.
OUT_OF_STOCK = "out_of_stock"
BELOW_THRESHOLD = "below_threshold"
LIFECYCLE = "lifecycle"
PART_LOST = "part_lost"
RUPTURE_SOON = "rupture_soon"
PRICE_UP = "price_up"
PCN = "pcn"
TARGET_PRICE_MISSED = "target_price_missed"
ASSESSMENT_WORSE = "assessment_worse"
LIKELY_OUT = "likely_out"
KINDS = (
    OUT_OF_STOCK, BELOW_THRESHOLD, LIFECYCLE, PART_LOST, RUPTURE_SOON, PRICE_UP, PCN,
    TARGET_PRICE_MISSED, ASSESSMENT_WORSE, LIKELY_OUT,
)
# The chance of being out everywhere within four weeks that raises the alert, on two runs in a row (a shown model only).
LIKELY_OUT_CHANCE = 0.7

# Assessment statuses from best to worst; "unknown" is not a state to compare.
_STATUS_ORDER = ("ok", "warning", "error", "fatal")

# The cheapest price rising by this much over the window is worth a look.
PRICE_RISE_PERCENT = 20

# Open on the first look: these are facts that do not flicker, unlike a stock reading.
_IMMEDIATE = frozenset({PART_LOST, PCN})
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


def conditions_for(
    item: Mapping[str, Any],
    insight: Mapping[str, Any] | None = None,
    price: Mapping[str, Any] | None = None,
    notice: Mapping[str, Any] | None = None,
    rules: alert_rules.Rules = alert_rules.NONE,
    assessed: str | None = None,
    mark: str | None = None,
    likely: Mapping[str, Any] | None = None,
) -> dict[str, Condition]:
    """The lines a tracked part has crossed, from its summary row and, when there are any, its insight and price trend."""

    found: dict[str, Condition] = {}
    if item["tracking"] is None:
        return found
    threshold = item["watch"]["threshold"] if item["watch"] else None
    stock = item["stock"]
    if item["problem"]:
        found[PART_LOST] = Condition(Status.ERROR.value, {"problem": item["problem"]})
    if stock is not None:
        if stock == 0:
            found[OUT_OF_STOCK] = Condition(Status.ERROR.value, {"stock": 0})
        elif threshold is not None and stock <= threshold:
            found[BELOW_THRESHOLD] = Condition(Status.WARNING.value, {"stock": stock, "threshold": threshold})
    if insight is not None and stock and BELOW_THRESHOLD not in found:
        days = insights.rupture_expected_within(dict(insight))
        if days is not None:
            found[RUPTURE_SOON] = Condition(Status.WARNING.value, {
                "days_to_zero": days, "decrease_per_day": insight["decrease_per_day"], "confidence": insight["confidence"],
            })
    if likely is not None:
        # Once the forecast model has earned its place it replaces the straight-line warning.
        found.pop(RUPTURE_SOON, None)
        if likely["chance"] is not None:
            found[LIKELY_OUT] = Condition(Status.WARNING.value, {"chance": likely["chance"], "weeks": 4})
    if price is not None and price["change_percent"] >= (rules.price_rise_percent or PRICE_RISE_PERCENT):
        found[PRICE_UP] = Condition(Status.WARNING.value, dict(price))
    if notice is not None:
        found[PCN] = Condition(Status.ERROR.value if notice["soon"] else Status.WARNING.value, dict(notice))
    lifecycle = item["lifecycle"]
    if lifecycle == Lifecycle.OBSOLETE.value:
        found[LIFECYCLE] = Condition(Status.FATAL.value, {"lifecycle": lifecycle})
    elif lifecycle in (Lifecycle.NRND.value, Lifecycle.LAST_TIME_BUY.value):
        found[LIFECYCLE] = Condition(Status.WARNING.value, {"lifecycle": lifecycle})
    elif item.get("dropped"):
        found[LIFECYCLE] = Condition(Status.WARNING.value, {"lifecycle": lifecycle, "dropped": True})
    target = rules.target_price
    if target is not None and item.get("unit_price") and item.get("currency") == rules.target_currency:
        if Decimal(item["unit_price"]) > target:
            found[TARGET_PRICE_MISSED] = Condition(Status.WARNING.value, {
                "price": item["unit_price"], "target": format(target.normalize(), "f"), "currency": rules.target_currency,
                "quantity": item.get("price_quantity"),
            })
    if assessed in _STATUS_ORDER and mark in _STATUS_ORDER and _STATUS_ORDER.index(assessed) > _STATUS_ORDER.index(mark):
        found[ASSESSMENT_WORSE] = Condition(
            Status.ERROR.value if assessed in ("error", "fatal") else Status.WARNING.value,
            {"was": mark, "now": assessed, "to": assessed},
        )
    # A worse assessment says something new only when no alert already says as much.
    worse = found.get(ASSESSMENT_WORSE)
    if worse is not None and any(
        _SEVERITY_RANK[other.severity] <= _SEVERITY_RANK[worse.severity] for kind, other in found.items() if kind != ASSESSMENT_WORSE
    ):
        del found[ASSESSMENT_WORSE]
    return {kind: condition for kind, condition in found.items() if kind not in rules.muted}


def evaluate_parts(conn, part_ids: Iterable[str], now: datetime) -> None:
    """Bring the alerts of these parts in line with how they stand now."""

    ids = sorted(set(part_ids))
    if not ids:
        return
    current = {}
    rules = alert_rules.for_parts(conn, ids)
    assessed, marks = _assessment_states(conn, ids, now)
    likely = _likely_out(conn, ids)
    for item in parts_view.summaries_for(conn, ids):
        tracked = item["tracking"] is not None
        # A projection needs history, which costs queries: only for tracked parts with stock to lose.
        insight = None
        if tracked and item["stock"]:
            insight = parts_view.insight_from(
                parts_view.history(conn, item["id"], now), item["watch"]["threshold"] if item["watch"] else None, now
            )
        price = prices.trend(prices.daily_cheapest(conn, item["id"], now), now.date()) if tracked else None
        notice = pcn.alert_detail(pcn.for_part(conn, item["id"]), now.date()) if tracked else None
        current[item["id"]] = conditions_for(
            item, insight, price, notice, rules.get(item["id"], alert_rules.NONE), assessed.get(item["id"]), marks.get(item["id"]),
            likely.get(item["id"]) if tracked else None,
        )
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


def _likely_out(conn, ids: list[str]) -> dict[str, dict[str, Any]]:
    """For tracked daily parts, once the four-week model is shown: the chance they are out everywhere within four weeks, if the last two
    runs both said at least ``LIKELY_OUT_CHANCE`` (else None, which clears the alert). Empty while the model is learning."""

    from app.services.supply import forecasting

    state = conn.execute("SELECT state FROM forecast_models WHERE target = 'out_4w'").fetchone()
    if not state or state["state"] != forecasting.SHOWN:
        return {}
    found: dict[str, dict[str, Any]] = {}
    for row in conn.execute(
        """
        SELECT f.subject_id, (array_agg(f.probability ORDER BY f.made_on DESC))[1:2] AS lately
        FROM forecasts f JOIN part_tiers pt ON pt.part_id = f.subject_id AND pt.rate = 'daily'
        WHERE f.subject_kind = 'part' AND f.target = 'out_4w' AND f.subject_id = ANY(%s) GROUP BY f.subject_id
        """,
        (ids,),
    ).fetchall():
        lately = [float(value) for value in row["lately"]]
        found[row["subject_id"]] = {"chance": min(lately) if len(lately) == 2 and min(lately) >= LIKELY_OUT_CHANCE else None}
    return found


def _assessment_states(conn, ids: list[str], now: datetime) -> tuple[dict[str, str], dict[str, str]]:
    """How each tracked part's assessment stands, and the status it is judged against. A part is marked the first time it is
    assessed, and the mark follows it down when it improves; a worsening is an alert until someone acknowledges it."""

    from app.services.supply.assessment import service as assessment

    tracked = [row["part_id"] for row in conn.execute("SELECT part_id FROM part_tiers WHERE part_id = ANY(%s)", (ids,)).fetchall()]
    if not tracked:
        return {}, {}
    result = assessment.assess_parts(conn, tracked, now=now)
    states = {part_id: entry["status"] for part_id, entry in result.items() if entry["status"] in _STATUS_ORDER}
    marks = {
        row["part_id"]: row["status"]
        for row in conn.execute("SELECT part_id, status FROM assessment_marks WHERE part_id = ANY(%s)", (tracked,)).fetchall()
    }
    for part_id, status in states.items():
        mark = marks.get(part_id)
        if mark is None or _STATUS_ORDER.index(status) < _STATUS_ORDER.index(mark):
            conn.execute(
                "INSERT INTO assessment_marks (part_id, status) VALUES (%s, %s) "
                "ON CONFLICT (part_id) DO UPDATE SET status = EXCLUDED.status, marked_at = NOW()",
                (part_id, status),
            )
            marks[part_id] = status
    return states, marks


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


def recent_changes(conn, now: datetime, *, days: int = 14, limit: int = 15, role: str | None = None) -> list[dict[str, Any]]:
    """What happened lately, newest first: alerts that opened, alerts that cleared, listings that disappeared, and what a
    tracked project's new revision added to or took off its BOM (only for a ``role`` that may see the project)."""

    since = now - timedelta(days=days)
    changes: list[dict[str, Any]] = []
    rows = conn.execute(
        """
        SELECT a.*, p.mpn, m.name AS manufacturer
        FROM alerts a JOIN parts p ON p.id = a.part_id JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE a.opened_at >= %s OR a.resolved_at >= %s
        """,
        (since, since),
    ).fetchall()
    for row in rows:
        alert = _dto(row, now)
        if row["opened_at"] and row["opened_at"] >= since:
            changes.append({"at": alert["opened_at"], "type": "alert_opened", "part_id": row["part_id"], "mpn": row["mpn"],
                            "manufacturer": row["manufacturer"], "alert": alert, "sku": ""})
        if row["resolved_at"] and row["resolved_at"] >= since:
            changes.append({"at": alert["resolved_at"], "type": "alert_cleared", "part_id": row["part_id"], "mpn": row["mpn"],
                            "manufacturer": row["manufacturer"], "alert": alert, "sku": ""})
    for row in conn.execute(
        """
        SELECT e.at, e.kind, e.part_id, e.payload, p.mpn, m.name AS manufacturer
        FROM events e JOIN parts p ON p.id = e.part_id JOIN manufacturers m ON m.id = p.manufacturer_id
        WHERE e.kind IN ('listing_gone', 'lifecycle_changed', 'normally_stocking_lost', 'moq_jump', 'family_member_new', 'param_changed') AND e.at >= %s
        """,
        (since,),
    ).fetchall():
        changes.append({"at": row["at"].isoformat(), "type": row["kind"], "part_id": row["part_id"], "mpn": row["mpn"],
                        "manufacturer": row["manufacturer"], "alert": None, "sku": str((row["payload"] or {}).get("sku", "")),
                        "detail": row["payload"] or {}})
    for row in conn.execute("SELECT at, kind, payload FROM events WHERE kind = 'project_bom_changed' AND at >= %s", (since,)).fetchall():
        payload = row["payload"] or {}
        if role is not None and role not in (payload.get("visible_roles") or []):
            continue
        changes.append({"at": row["at"].isoformat(), "type": row["kind"], "part_id": None, "mpn": "", "manufacturer": "", "alert": None,
                        "sku": "", "detail": {key: value for key, value in payload.items() if key != "visible_roles"}})
    changes.sort(key=lambda item: item["at"], reverse=True)
    return changes[:limit]


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
    if row["kind"] == ASSESSMENT_WORSE and (row["detail"] or {}).get("to") in _STATUS_ORDER:
        # Seen and accepted: the part is now judged against where it stands.
        conn.execute("UPDATE assessment_marks SET status = %s, marked_at = %s WHERE part_id = %s", (row["detail"]["to"], now, row["part_id"]))
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

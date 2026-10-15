"""The workspace's working week and which spare work may run, kept in the supply ``settings`` table.

Spare budget (see ``quota.spare_allowance``) is released outside working hours and in the last hours of a provider's day.
These settings say when those are, and which kinds of spare work are on. Absent means the defaults here.
"""

from __future__ import annotations

import json
from typing import Any, Mapping
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.services.supply import quota
from app.services.supply.audit import actor_text, write_audit

KEY = "schedule"
# In the order spare budget is spent: parts waiting for room, then tier-2 parts ahead of their time, then notices of untracked parts.
SPARE_KINDS = ("waiting", "tier2_early", "notices")
DEFAULTS: dict[str, Any] = {
    "tz": "UTC",
    "days": [0, 1, 2, 3, 4],
    "start": "08:00",
    "end": "19:00",
    "spare": {kind: True for kind in SPARE_KINDS},
}


class ScheduleError(ValueError):
    """The settings are not valid. The message is safe to show."""


def _time(value: Any, label: str) -> str:
    text = str(value or "").strip()
    try:
        hours, minutes = (int(part) for part in text.split(":"))
    except ValueError:
        hours = minutes = -1
    if len(text) != 5 or not (0 <= hours <= 23 and 0 <= minutes <= 59):
        raise ScheduleError(f"The {label} is hours and minutes, such as 08:00.")
    return text


def validate(payload: Mapping[str, Any]) -> dict[str, Any]:
    tz = str(payload.get("tz") or "").strip()
    try:
        ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError):
        raise ScheduleError("The time zone is a name such as UTC or Europe/Rome.") from None
    days = payload.get("days")
    if not isinstance(days, list) or any(isinstance(day, bool) or not isinstance(day, int) or not 0 <= day <= 6 for day in days):
        raise ScheduleError("Working days are numbers from 0 (Monday) to 6 (Sunday).")
    start, end = _time(payload.get("start"), "start"), _time(payload.get("end"), "end")
    if start >= end:
        raise ScheduleError("Working hours end after they start.")
    spare = payload.get("spare")
    if not isinstance(spare, Mapping) or set(spare) - set(SPARE_KINDS) or any(not isinstance(spare.get(kind, True), bool) for kind in SPARE_KINDS):
        raise ScheduleError("Spare work is on or off for each kind.")
    return {
        "tz": tz, "days": sorted(set(days)), "start": start, "end": end,
        "spare": {kind: bool(spare.get(kind, True)) for kind in SPARE_KINDS},
    }


def load(conn) -> dict[str, Any]:
    row = conn.execute("SELECT value FROM settings WHERE key = %s", (KEY,)).fetchone()
    if row is None:
        return json.loads(json.dumps(DEFAULTS))
    try:
        return validate(row["value"])
    except (ScheduleError, AttributeError, TypeError):
        # A stored value that no longer fits must not stop the budget.
        return json.loads(json.dumps(DEFAULTS))


def save(conn, payload: Mapping[str, Any], actor: str) -> dict[str, Any]:
    actor = actor_text(actor)
    value = validate(payload)
    before = load(conn)
    conn.execute(
        """
        INSERT INTO settings (key, value, updated_by) VALUES (%s, %s::jsonb, %s)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()
        """,
        (KEY, json.dumps(value), actor),
    )
    write_audit(conn, actor, "settings.schedule", KEY, {"before": before, "after": value}, subject_kind="settings")
    return value


def work_week(settings: Mapping[str, Any]) -> quota.WorkWeek:
    return quota.WorkWeek(settings["tz"], tuple(settings["days"]), settings["start"], settings["end"])

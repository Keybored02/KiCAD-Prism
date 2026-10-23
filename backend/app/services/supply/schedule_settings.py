"""Which spare work may run, kept in the supply ``settings`` table.

Spare budget is the calls nothing else needs (see ``quota.free_allowance``), at any hour. These settings say which kinds of spare work
are on. Absent means the defaults here. (A working week was kept here until the spare rework made it unused; a stored one is ignored.)
"""

from __future__ import annotations

import json
from typing import Any, Mapping

from app.services.supply.audit import actor_text, write_audit

KEY = "schedule"
# In the order spare budget is spent: parts waiting for room, then tier-2 parts ahead of their time, then notices of untracked parts.
SPARE_KINDS = ("waiting", "tier2_early", "notices")

DEFAULTS: dict[str, Any] = {"spare": {kind: True for kind in SPARE_KINDS}}


class ScheduleError(ValueError):
    """The settings are not valid. The message is safe to show."""


def validate(payload: Mapping[str, Any]) -> dict[str, Any]:
    spare = payload.get("spare")
    if not isinstance(spare, Mapping) or set(spare) - set(SPARE_KINDS) or any(not isinstance(spare.get(kind, True), bool) for kind in SPARE_KINDS):
        raise ScheduleError("Spare work is on or off for each kind.")
    return {"spare": {kind: bool(spare.get(kind, True)) for kind in SPARE_KINDS}}


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

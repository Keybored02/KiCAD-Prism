"""Where a workspace's assessment settings are kept. Absent means the defaults in code."""

from __future__ import annotations

import json
from typing import Mapping

from app.services.supply.assessment import settings as rules
from app.services.supply.assessment.settings import AssessmentSettings
from app.services.supply.audit import actor_text, write_audit

KEY = "assessment"


def load(conn) -> AssessmentSettings:
    row = conn.execute("SELECT value FROM settings WHERE key = %s", (KEY,)).fetchone()
    if row is None:
        return rules.DEFAULTS
    try:
        return rules.from_dto(rules.validate(row["value"]))
    except (ValueError, KeyError, TypeError):
        # A stored value that no longer fits the rules must not stop every assessment.
        return rules.DEFAULTS


def save(conn, payload: Mapping, actor: str) -> AssessmentSettings:
    actor = actor_text(actor)
    value = rules.validate(payload)
    before = load(conn)
    conn.execute(
        """
        INSERT INTO settings (key, value, updated_by) VALUES (%s, %s::jsonb, %s)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()
        """,
        (KEY, json.dumps(value), actor),
    )
    write_audit(conn, actor, "settings.assessment", KEY, {"before": rules.to_dto(before), "after": value}, subject_kind="settings")
    return rules.from_dto(value)


def reset(conn, actor: str) -> AssessmentSettings:
    actor = actor_text(actor)
    conn.execute("DELETE FROM settings WHERE key = %s", (KEY,))
    write_audit(conn, actor, "settings.assessment.reset", KEY, {}, subject_kind="settings")
    return rules.DEFAULTS

"""Workspace schema migration 35: per-system optional validation rules (CONTRACTS_P2 §8.4).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """``optional_rules`` lists the opt-in rules a system runs (today only ``SYS-V09``).

    Empty by default: a rule listed here is off until the system enables it.
    """

    conn.execute(
        "ALTER TABLE system_projects ADD COLUMN IF NOT EXISTS optional_rules TEXT[] NOT NULL DEFAULT '{}'"
    )

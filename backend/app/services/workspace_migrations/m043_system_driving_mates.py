"""Workspace schema migration 43: driving mate overrides (CONTRACTS_P2 §14.9, SB2-37).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """The user's choice of which B2B link places an instance. Absent means the solve picks
    (most rows, then the lower reference). Deleting the instance or the link drops the choice."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_driving_mates (
            instance_id  TEXT PRIMARY KEY REFERENCES system_instances(id) ON DELETE CASCADE,
            system_id    TEXT NOT NULL,
            link_id      TEXT NOT NULL REFERENCES system_links(id) ON DELETE CASCADE,
            updated_by   TEXT NOT NULL,
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS system_driving_mates_system ON system_driving_mates (system_id)")

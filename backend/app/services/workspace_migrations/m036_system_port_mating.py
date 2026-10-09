"""Workspace schema migration 36: stored connector mating frames (CONTRACTS_P2 §15.2).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """One confirmed or override frame per board port; an inferred frame is never stored."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_port_mating (
            instance_id     TEXT NOT NULL REFERENCES system_instances(id) ON DELETE CASCADE,
            port_key        TEXT NOT NULL,
            mode            TEXT NOT NULL CHECK (mode IN ('confirmed', 'override')),
            axis            TEXT NOT NULL CHECK (axis IN ('top', 'bottom', '+x', '-x', '+y', '-y')),
            quarter_turns   SMALLINT NOT NULL DEFAULT 0 CHECK (quarter_turns BETWEEN 0 AND 3),
            geometry_digest TEXT,
            updated_by      TEXT NOT NULL,
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (instance_id, port_key)
        )
        """
    )

"""Workspace schema migration 51: net rename proposals (SB2-106, CONTRACTS_P2 §23).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """A proposal that one board rename one of its nets. One open proposal per net on an instance;
    applied and withdrawn ones stay as history. Both foreign keys are indexed (SB2-96)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_net_renames (
            id            TEXT PRIMARY KEY,
            system_id     TEXT NOT NULL REFERENCES system_projects(id) ON DELETE CASCADE,
            instance_id   TEXT NOT NULL REFERENCES system_instances(id) ON DELETE CASCADE,
            net           TEXT NOT NULL CHECK (net <> ''),
            name          TEXT NOT NULL CHECK (name <> ''),
            note          TEXT NOT NULL DEFAULT '',
            state         TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open', 'applied', 'withdrawn')),
            created_by    TEXT NOT NULL,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            closed_by     TEXT,
            closed_at     TIMESTAMPTZ,
            closed_commit TEXT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_system_net_renames_open
            ON system_net_renames(instance_id, net) WHERE state = 'open';
        CREATE INDEX IF NOT EXISTS idx_system_net_renames_system ON system_net_renames(system_id);
        """
    )

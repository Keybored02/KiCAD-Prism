"""Workspace schema migration 50: sub-ports (SB2-105, CONTRACTS_P2 §22).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """Named pad sets carved out of a connector (or a subsystem export) on an instance, and the
    link ends and export targets that name one. The references have no cascade: removing a
    sub-port re-homes its rows and refuses while an export uses it (§22.3). Each reference is
    indexed (SB2-96)."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_subports (
            id          TEXT PRIMARY KEY,
            system_id   TEXT NOT NULL REFERENCES system_projects(id) ON DELETE CASCADE,
            instance_id TEXT NOT NULL REFERENCES system_instances(id) ON DELETE CASCADE,
            port_key    TEXT NOT NULL,
            port        JSONB NOT NULL,
            name        TEXT NOT NULL CHECK (name <> ''),
            pads        JSONB NOT NULL,
            created_by  TEXT NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_system_subports_name
            ON system_subports(instance_id, port_key, lower(name));
        CREATE INDEX IF NOT EXISTS idx_system_subports_system ON system_subports(system_id);

        ALTER TABLE system_links ADD COLUMN IF NOT EXISTS a_subport_id TEXT REFERENCES system_subports(id);
        ALTER TABLE system_links ADD COLUMN IF NOT EXISTS b_subport_id TEXT REFERENCES system_subports(id);
        CREATE INDEX IF NOT EXISTS idx_system_links_a_subport ON system_links(a_subport_id)
            WHERE a_subport_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_system_links_b_subport ON system_links(b_subport_id)
            WHERE b_subport_id IS NOT NULL;

        ALTER TABLE system_exports ADD COLUMN IF NOT EXISTS target_subport_id TEXT REFERENCES system_subports(id);
        CREATE INDEX IF NOT EXISTS idx_system_exports_subport ON system_exports(target_subport_id)
            WHERE target_subport_id IS NOT NULL;
        """
    )

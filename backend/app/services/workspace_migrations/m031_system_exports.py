"""Workspace schema migration 31: system_exports (CONTRACTS_P2 §4).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """A system's published connectors: what a parent system may link to.

    An export targets either one board port of the same system (with the port
    baseline captured at creation, like a link end, so it can resolve through
    ``memberKeys``) or an export of a child assembly instance (a re-export).
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_exports (
            id                 TEXT PRIMARY KEY,
            system_id          TEXT NOT NULL REFERENCES system_projects(id) ON DELETE CASCADE,
            name               TEXT NOT NULL CHECK (btrim(name) <> '' AND length(name) <= 100),
            description        TEXT NOT NULL DEFAULT '',
            target_instance_id TEXT NOT NULL REFERENCES system_instances(id) ON DELETE CASCADE,
            target_port        JSONB,
            target_export_id   TEXT,
            created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT system_exports_one_target CHECK ((target_port IS NULL) <> (target_export_id IS NULL))
        )
        """
    )
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS system_exports_name_key ON system_exports (system_id, lower(name))"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS system_exports_target_idx ON system_exports (target_instance_id)"
    )

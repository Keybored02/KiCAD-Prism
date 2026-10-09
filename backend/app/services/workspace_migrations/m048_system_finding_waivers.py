"""Workspace schema migration 48: finding waivers (SB2-100, D-P2-56).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """A waiver accepts one warning or info finding, named by its ``finding_key`` (rule, instance,
    link, harness, end, reference and pin), with a note. Part of the system's versioned record."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_finding_waivers (
            id          TEXT PRIMARY KEY,
            system_id   TEXT NOT NULL REFERENCES system_projects(id) ON DELETE CASCADE,
            finding_key TEXT NOT NULL CHECK (finding_key <> ''),
            rule        TEXT NOT NULL,
            note        TEXT NOT NULL CHECK (btrim(note) <> ''),
            created_by  TEXT NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT system_finding_waivers_key UNIQUE (system_id, finding_key)
        );
        """
    )

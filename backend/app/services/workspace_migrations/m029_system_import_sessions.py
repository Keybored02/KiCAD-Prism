"""Workspace schema migration 29: system_import_sessions.

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """Hold an uploaded connection CSV between upload, preview and commit (§9.3).

    The upload is kept as decoded text so preview and commit re-run the same
    deterministic resolution against the system's state at that moment. A
    session is committed at most once; uncommitted sessions are pruned.
    """

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_import_sessions (
            id           TEXT PRIMARY KEY,
            system_id    TEXT NOT NULL REFERENCES system_projects(id) ON DELETE CASCADE,
            created_by   TEXT NOT NULL,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            filename     TEXT NOT NULL DEFAULT '',
            delimiter    TEXT NOT NULL CHECK (delimiter IN (',', ';', E'\\t', '|')),
            content      TEXT NOT NULL,
            row_count    INTEGER NOT NULL CHECK (row_count >= 0),
            committed_at TIMESTAMPTZ,
            committed_by TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_system_import_sessions_system
            ON system_import_sessions(system_id, created_at DESC);
        """
    )

"""Workspace schema migration 45: Git-tracked systems (CONTRACTS_P2 §21, SB2-53).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """A system's link to a repository branch, and each snapshot's commit status.

    ``known_blob`` is the manifest blob Prism last pushed or imported; ``outside_commit``
    is a branch tip whose manifest differs from it (D-P2-45). One system per branch."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_git_links (
            system_id        TEXT PRIMARY KEY REFERENCES system_projects(id) ON DELETE CASCADE,
            url              TEXT NOT NULL,
            dedup_key        TEXT NOT NULL,
            branch           TEXT NOT NULL,
            tip              TEXT,
            known_blob       TEXT,
            outside_commit   TEXT,
            last_fetched_at  TIMESTAMPTZ,
            last_error       JSONB,
            linked_by        TEXT NOT NULL,
            linked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (dedup_key, branch)
        );
        ALTER TABLE system_snapshots ADD COLUMN IF NOT EXISTS git JSONB;
        """
    )

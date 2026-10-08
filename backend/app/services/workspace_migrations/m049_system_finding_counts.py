"""Workspace schema migration 49: the last finding counts of each system (SB2-101).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """Every document build records its counts with the version it was built at, so the systems
    list can show them without building every system. A table of its own and deliberately without a
    foreign key: a referencing write would key-share-lock the system row for the rest of the read,
    and every editor's ``FOR UPDATE`` would wait on it. Deleting a system deletes its row."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_finding_counts (
            system_id  TEXT PRIMARY KEY,
            version    BIGINT NOT NULL,
            counts     JSONB NOT NULL,
            counted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )

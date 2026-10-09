"""Workspace schema migration 53: the system STEP export (SB2-109, CONTRACTS_P2 §25).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """A system's latest STEP export, with the projects whose boards it holds: it is made with its
    requester's access, and a reader downloads it only when they can see every one of them. Like the collision check (m052) it has no foreign key, so
    the worker writing it never holds a lock an editor waits on, and it is deleted with its system."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_step_exports (
            system_id  TEXT PRIMARY KEY,
            version    BIGINT NOT NULL,
            state      TEXT NOT NULL CHECK (state IN ('running', 'ready', 'failed')),
            job_id     TEXT,
            path       TEXT,
            size_bytes BIGINT,
            skipped    JSONB NOT NULL DEFAULT '[]'::jsonb,
            projects   TEXT[] NOT NULL DEFAULT '{}',
            error      TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )

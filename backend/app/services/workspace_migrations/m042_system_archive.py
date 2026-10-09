"""Workspace schema migration 42: archived systems (CONTRACTS_P2 §3.3, D-P2-31).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """A system something still references is archived instead of deleted: hidden from lists,
    refusing changes, with its snapshots kept for the parents that froze them."""

    conn.execute(
        """
        ALTER TABLE system_projects
            ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS archived_by TEXT
        """
    )

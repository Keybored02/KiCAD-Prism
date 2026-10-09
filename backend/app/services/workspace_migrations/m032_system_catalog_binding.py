"""Workspace schema migration 32: a system's catalog assembly (CONTRACTS_P2 §3.3).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """The ``assembly`` component a system publishes to, bound on first publish.

    The catalog may live in another database, so this is an opaque ID with no
    foreign key; the catalog side records the system in each revision's
    ``source_ref``.
    """

    conn.execute("ALTER TABLE system_projects ADD COLUMN IF NOT EXISTS catalog_component_id TEXT")

"""Workspace schema migration 30: snapshots carry a ``prism.system_manifest.v1``.

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """CONTRACTS_P2 §9.4: the frozen manifest beside the rendered ``document``.

    P1 snapshots keep ``manifest`` NULL and stay readable; only snapshots with
    a manifest can be published.
    """

    conn.execute(
        """
        ALTER TABLE system_snapshots
            ADD COLUMN IF NOT EXISTS manifest            JSONB,
            ADD COLUMN IF NOT EXISTS manifest_schema     TEXT,
            ADD COLUMN IF NOT EXISTS connectivity_digest TEXT
        """
    )

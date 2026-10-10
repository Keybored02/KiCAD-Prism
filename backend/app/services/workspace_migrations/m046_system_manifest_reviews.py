"""Workspace schema migration 46: manifest import reviews (CONTRACTS_P2 §21.3, SB2-54).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """A ``manifest_import`` review proposes a manifest pushed outside Prism. Like a CSV
    ``import`` review it belongs to no instance; ``to_commit`` is the outside commit."""

    conn.execute(
        """
        ALTER TABLE system_reviews DROP CONSTRAINT IF EXISTS system_reviews_kind_check;
        ALTER TABLE system_reviews ADD CONSTRAINT system_reviews_kind_check
            CHECK (kind IN ('source_update', 'baseline_unreachable', 'import', 'child_update', 'manifest_import'));
        ALTER TABLE system_reviews DROP CONSTRAINT IF EXISTS system_reviews_instance_required;
        ALTER TABLE system_reviews ADD CONSTRAINT system_reviews_instance_required
            CHECK ((kind IN ('import', 'manifest_import')) = (instance_id IS NULL));
        CREATE UNIQUE INDEX IF NOT EXISTS uq_system_reviews_open_manifest_import
            ON system_reviews(system_id) WHERE status = 'open' AND kind = 'manifest_import';
        """
    )

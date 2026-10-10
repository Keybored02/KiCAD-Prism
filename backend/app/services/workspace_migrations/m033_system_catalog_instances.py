"""Workspace schema migration 33: assembly and module instances (CONTRACTS_P2 §5.1).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """An instance is a board (project + commit) or a catalog item (component + revision).

    Board columns become nullable; a CHECK keeps each kind's columns complete.
    Catalog IDs are opaque (the catalog may live in another database).
    """

    conn.execute(
        """
        ALTER TABLE system_instances
            ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'board',
            ADD COLUMN IF NOT EXISTS catalog_component_id TEXT,
            ADD COLUMN IF NOT EXISTS catalog_revision_id TEXT,
            ADD COLUMN IF NOT EXISTS follow TEXT,
            ALTER COLUMN project_id DROP NOT NULL,
            ALTER COLUMN baseline_commit DROP NOT NULL
        """
    )
    conn.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'system_instances_kind_shape') THEN
                ALTER TABLE system_instances ADD CONSTRAINT system_instances_kind_shape CHECK (
                    (kind = 'board' AND project_id IS NOT NULL AND baseline_commit IS NOT NULL
                        AND catalog_component_id IS NULL AND catalog_revision_id IS NULL AND follow IS NULL)
                    OR (kind IN ('assembly', 'module') AND project_id IS NULL AND baseline_commit IS NULL
                        AND tracked_ref IS NULL AND catalog_component_id IS NOT NULL
                        AND catalog_revision_id IS NOT NULL AND follow IN ('pinned', 'latest_released'))
                );
            END IF;
        END $$
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS system_instances_catalog_idx ON system_instances (catalog_component_id)"
    )

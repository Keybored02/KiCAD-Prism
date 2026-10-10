"""Workspace schema migration 52: mechanical part instances and collision checks (SB2-108, CONTRACTS_P2 §24).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """``part`` instances take the catalog columns exactly as modules do. A system's last collision
    check is stored with the scene key it was computed for; like the finding counts (m049) it has no
    foreign key, so the worker writing it never holds a lock an editor waits on, and it is deleted
    with its system."""

    conn.execute(
        """
        ALTER TABLE system_instances DROP CONSTRAINT IF EXISTS system_instances_kind_shape;
        ALTER TABLE system_instances ADD CONSTRAINT system_instances_kind_shape CHECK (
            (kind = 'board' AND project_id IS NOT NULL AND baseline_commit IS NOT NULL
                AND catalog_component_id IS NULL AND catalog_revision_id IS NULL AND follow IS NULL)
            OR (kind IN ('assembly', 'module', 'part') AND project_id IS NULL AND baseline_commit IS NULL
                AND tracked_ref IS NULL AND catalog_component_id IS NOT NULL
                AND catalog_revision_id IS NOT NULL AND follow IN ('pinned', 'latest_released'))
        );

        CREATE TABLE IF NOT EXISTS system_collision_checks (
            system_id  TEXT PRIMARY KEY,
            scene_key  TEXT NOT NULL,
            version    BIGINT NOT NULL,
            result     JSONB NOT NULL,
            job_id     TEXT,
            checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )

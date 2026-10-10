"""Workspace schema migration 47: bundle frames and foreign-key indexes (SB2-96).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """``system_bundle_frames`` keeps each 3D bundle's board mid-plane so the system scene
    stops parsing three bundle files per board per request. A bundle's files never change
    for a (source, build) fingerprint pair, so a row is never stale; ``manifest_path`` lets
    a read confirm the files are still there (SB2-91) with a stat instead of a parse.

    The indexes cover the three system foreign keys whose cascades had no index to use."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_bundle_frames (
            project_id         TEXT NOT NULL,
            source_fingerprint TEXT NOT NULL,
            build_fingerprint  TEXT NOT NULL,
            manifest_path      TEXT NOT NULL CHECK (manifest_path <> ''),
            mid_plane_mm       DOUBLE PRECISION NOT NULL,
            created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (project_id, source_fingerprint, build_fingerprint)
        );
        CREATE INDEX IF NOT EXISTS idx_system_harness_wires_from_end ON system_harness_wires(from_end);
        CREATE INDEX IF NOT EXISTS idx_system_harness_wires_to_end ON system_harness_wires(to_end);
        CREATE INDEX IF NOT EXISTS idx_system_driving_mates_link ON system_driving_mates(link_id);
        """
    )

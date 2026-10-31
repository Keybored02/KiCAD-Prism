"""Repositories found on a connected Git host, and what a scan saw in each."""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    # No foreign key to tracker_connectors: that table belongs to the tracker
    # ledger. Deleting a connector clears its rows through the service.
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS ws_repo_discovery_candidates (
            id TEXT PRIMARY KEY,
            connector_id TEXT NOT NULL,
            remote_id TEXT NOT NULL,
            full_name TEXT NOT NULL,
            web_url TEXT NOT NULL DEFAULT '',
            clone_url TEXT NOT NULL DEFAULT '',
            dedup_key TEXT NOT NULL DEFAULT '',
            default_branch TEXT NOT NULL DEFAULT '',
            head_sha TEXT NOT NULL DEFAULT '',
            archived BOOLEAN NOT NULL DEFAULT FALSE,
            size_bytes BIGINT,
            branches JSONB NOT NULL DEFAULT '[]'::jsonb,
            state TEXT NOT NULL DEFAULT 'pending'
                CHECK (state IN ('pending', 'kicad', 'empty', 'no_access', 'blocked', 'error')),
            projects JSONB NOT NULL DEFAULT '[]'::jsonb,
            error TEXT NOT NULL DEFAULT '',
            scanned_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (connector_id, remote_id)
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_ws_repo_discovery_connector "
        "ON ws_repo_discovery_candidates (connector_id, full_name)"
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_ws_repo_discovery_dedup "
        "ON ws_repo_discovery_candidates (dedup_key)"
    )

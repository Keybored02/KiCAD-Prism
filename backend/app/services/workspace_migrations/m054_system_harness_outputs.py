"""Workspace schema migration 54: a contact part per harness end and coverings per segment (SB2-110,
CONTRACTS_P2 §26.1).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """The contact keeps its revision and summary like the block part (m039); coverings are a list
    on the harness, keyed by route segment, because segments are derived from the route."""

    conn.execute(
        """
        ALTER TABLE system_harness_ends ADD COLUMN IF NOT EXISTS contact_component_id TEXT;
        ALTER TABLE system_harness_ends ADD COLUMN IF NOT EXISTS contact_revision_id TEXT;
        ALTER TABLE system_harness_ends ADD COLUMN IF NOT EXISTS contact_summary JSONB;
        ALTER TABLE system_harnesses ADD COLUMN IF NOT EXISTS coverings JSONB NOT NULL DEFAULT '[]'::jsonb;
        """
    )

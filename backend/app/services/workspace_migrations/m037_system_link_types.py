"""Workspace schema migration 37: link types and B2B stack height (CONTRACTS_P2 §16).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """Every existing (P1) link becomes ``unspecified``; only ``b2b`` links carry a stack height."""

    conn.execute(
        """
        ALTER TABLE system_links
            ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'unspecified'
                CHECK (type IN ('unspecified', 'b2b')),
            ADD COLUMN IF NOT EXISTS stack_height_mm DOUBLE PRECISION
                CHECK (stack_height_mm IS NULL OR stack_height_mm > 0)
        """
    )
    conn.execute("ALTER TABLE system_links DROP CONSTRAINT IF EXISTS system_links_stack_height_b2b")
    conn.execute(
        """
        ALTER TABLE system_links ADD CONSTRAINT system_links_stack_height_b2b
            CHECK (stack_height_mm IS NULL OR type = 'b2b')
        """
    )

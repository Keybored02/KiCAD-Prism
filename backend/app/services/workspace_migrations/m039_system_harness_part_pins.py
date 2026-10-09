"""Workspace schema migration 39: a harness end's catalog part pins and summary (CONTRACTS_P2 §17.2, SB2-18).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """The pins and ``{name, mpn, manufacturer}`` of the part assigned to an end's mating block, as they
    were at assignment (both null while the block is Generic)."""

    conn.execute("ALTER TABLE system_harness_ends ADD COLUMN IF NOT EXISTS part_pins JSONB")
    conn.execute("ALTER TABLE system_harness_ends ADD COLUMN IF NOT EXISTS part_summary JSONB")

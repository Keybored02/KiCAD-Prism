"""Workspace schema migration 44: harness breakouts and waypoints (CONTRACTS_P2 §17.9, SB2-45).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """A harness's nodes, in its system's frame (mm). Breakouts chain by ``ord`` and list the
    ends they branch to; a waypoint lies ``between`` two of the harness's ends or breakouts,
    ``ord`` counting from ``between[0]``, and a pinned one is never moved by bend relaxation."""

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS system_harness_nodes (
            id           TEXT PRIMARY KEY,
            harness_id   TEXT NOT NULL REFERENCES system_harnesses(id) ON DELETE CASCADE,
            kind         TEXT NOT NULL CHECK (kind IN ('breakout', 'waypoint')),
            position_mm  DOUBLE PRECISION[] NOT NULL CHECK (cardinality(position_mm) = 3),
            pinned       BOOLEAN NOT NULL DEFAULT FALSE,
            ord          INTEGER NOT NULL CHECK (ord >= 0),
            ends         TEXT[] NOT NULL DEFAULT '{}',
            between_ids  TEXT[] CHECK (between_ids IS NULL OR cardinality(between_ids) = 2),
            CHECK ((kind = 'breakout') = (between_ids IS NULL)),
            CHECK (kind = 'waypoint' OR NOT pinned)
        );
        CREATE INDEX IF NOT EXISTS idx_system_harness_nodes_harness ON system_harness_nodes(harness_id);
        """
    )

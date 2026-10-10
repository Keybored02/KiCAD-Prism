"""Workspace schema migration 34: ``child_update`` reviews (CONTRACTS_P2 §7).

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """A subsystem's new catalog revision changed exports the parent uses.

    A ``child_update`` review stores catalog revision IDs in
    ``from_commit``/``to_commit`` (they are opaque text columns).
    """

    conn.execute("ALTER TABLE system_reviews DROP CONSTRAINT IF EXISTS system_reviews_kind_check")
    conn.execute(
        """
        ALTER TABLE system_reviews ADD CONSTRAINT system_reviews_kind_check
            CHECK (kind IN ('source_update', 'baseline_unreachable', 'import', 'child_update'))
        """
    )

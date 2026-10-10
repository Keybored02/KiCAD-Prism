"""Workspace schema migration 28: system_review_pending_changes.

Frozen once shipped. Applied deployments recorded this body in
``ws_schema_migrations``; edit nothing here, add a new migration instead.
"""

from __future__ import annotations

from typing import Any


def migrate(conn: Any) -> None:
    """Keep the silent changes a review will apply with its candidate.

    A ``source_update`` review can hold silent changes as well as items: a
    relabel or rebind on one link end while another end drifted. They take
    effect only when the review is applied (§6.2), and nothing is re-resolved
    at decision time (§1 invariant 5), so they are stored with the review:
    ``{"portUpdates": [{linkId, end, port}], "silent": [{kind, linkId, end,
    via, before, after}]}``.
    """

    conn.execute(
        """
        ALTER TABLE system_reviews
            ADD COLUMN IF NOT EXISTS pending_changes JSONB NOT NULL DEFAULT '{}'::jsonb
        """
    )

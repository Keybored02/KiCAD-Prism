"""The HTTP comment store and replay stream must commit together."""

from __future__ import annotations

import os
import tempfile
import unittest
import uuid
from contextlib import contextmanager

from app.services import comment_live_events
from app.services.comments_revisions import Editor
from app.services.comments_store_service import CommentsStoreService


TEST_DSN = os.environ.get("TEST_POSTGRES_URL", "")


@unittest.skipUnless(TEST_DSN, "disposable TEST_POSTGRES_URL required")
class CommentStreamIntegrationTests(unittest.TestCase):
    def setUp(self) -> None:
        import psycopg
        from psycopg.rows import dict_row

        self.psycopg = psycopg
        self.dict_row = dict_row
        self.schema = "test_comment_stream_" + uuid.uuid4().hex[:16]
        self.store = CommentsStoreService()
        self.store.schema = self.schema

        @contextmanager
        def connect():
            with psycopg.connect(TEST_DSN, row_factory=dict_row) as conn:
                conn.execute(f'SET search_path TO "{self.schema}", public')
                yield conn

        self.store._connect = connect
        self.project_id = "p_" + uuid.uuid4().hex[:12]
        self.path = tempfile.TemporaryDirectory()

    def tearDown(self) -> None:
        with self.psycopg.connect(TEST_DSN) as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{self.schema}" CASCADE')
        self.path.cleanup()

    def test_create_reply_edit_delete_and_snapshot_cursor(self) -> None:
        created = self.store.create_comment(
            self.project_id, self.path.name, "PCB", {"x": 1, "y": 2}, "Original", "Author",
        )
        cid = created["id"]
        initial = self.store.get_comments_file(self.project_id, self.path.name)
        self.assertEqual(initial["cursor"], 1)
        self.assertEqual(initial["comments"][0]["id"], cid)

        editor = Editor("user:a", "user", "Author")
        self.store.add_reply(self.project_id, self.path.name, cid, "Reply", "Author")
        self.store.edit_comment(
            self.project_id, self.path.name, cid, editor, expected_revision=1, content="Edited",
        )
        self.store.delete_comment(self.project_id, self.path.name, cid, editor)

        with self.store._connect() as conn:
            events = comment_live_events.changes_after(conn, self.project_id, 0)
        self.assertEqual([event["cursor"] for event in events], [1, 2, 3, 4, 5])
        self.assertEqual([event["changeKind"] for event in events], ["upsert"] * 3 + ["delete", "upsert"])
        self.assertTrue(all(event["commentId"] == cid for event in events))
        final = self.store.get_comments_file(self.project_id, self.path.name)
        self.assertEqual(final["cursor"], 5)
        self.assertEqual(final["comments"], [])


if __name__ == "__main__":
    unittest.main()

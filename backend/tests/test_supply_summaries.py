"""Kept offer summaries: used when current, recomputed when anything they are made from changes. Needs ``PRISM_DATABASE_URL``."""

from __future__ import annotations

import os
import sys
import time
import unittest
import uuid
from datetime import datetime, timezone
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
NOW = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)
ACTOR = "ana@example.com"


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class SummaryCacheTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.postgres_database import database
        from app.services.supply import parts_view, watches
        from app.services.supply.store import SupplyStore

        cls.database, cls.parts_view, cls.watches = database, parts_view, watches
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_sum_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()

    @classmethod
    def tearDownClass(cls) -> None:
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("listings", "watches", "parts", "manufacturers", "connectors"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO connectors (id, provider, display_name) VALUES ('c1', 'fake', 'Sim')")
            self.watch, _ = self.watches.add_watch(conn, "Acme", "P-1", ACTOR, tier=1)
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state, packaging) "
                "VALUES ('l1', 'c1', 'S1', %s, 'x', 'Acme', 'exact', 'cut_tape')", (self.watch.part_id,))
            conn.execute("INSERT INTO offers (listing_id, fetched_at, stock) VALUES ('l1', %s, 100)", (NOW,))

    def stock(self) -> int | None:
        with self.store.connection() as conn:
            (item,) = self.parts_view.summaries_for(conn, [self.watch.part_id])
        return item["stock"]

    def test_a_summary_is_kept_and_not_worked_out_again(self) -> None:
        # A summary is trusted once no transaction older than its reading is still open. Other test workers
        # run transactions against the same server, so wait for them to end.
        for _ in range(40):
            self.assertEqual(self.stock(), 100)
            try:
                with mock.patch.object(self.parts_view, "offers_by_part", side_effect=AssertionError("worked out again")):
                    self.assertEqual(self.stock(), 100)
                return
            except AssertionError as exc:
                if "worked out again" not in str(exc):
                    raise
                time.sleep(0.25)
        self.fail("the summary was never kept")

    def test_the_jlc_class_rides_on_the_row_without_being_kept_in_the_summary(self) -> None:
        from app.services.supply import facts

        with self.store.connection() as conn:
            (item,) = self.parts_view.summaries_for(conn, [self.watch.part_id])
            self.assertIsNone(item["jlc"])
            facts.replace(conn, self.watch.part_id, "jlcpcb", [("jlc_library", "Basic"), ("jlc_preferred", "Preferred")], NOW)
            (item,) = self.parts_view.summaries_for(conn, [self.watch.part_id])
        self.assertEqual(item["jlc"], {"library": "Basic", "preferred": True})

    def test_a_new_reading_makes_it_stale(self) -> None:
        self.assertEqual(self.stock(), 100)
        with self.store.connection() as conn:
            conn.execute("UPDATE offers SET stock = 7 WHERE listing_id = 'l1'")
        self.assertEqual(self.stock(), 7)

    def test_a_listing_leaving_the_count_a_packaging_policy_and_a_search_make_it_stale(self) -> None:
        self.assertEqual(self.stock(), 100)
        with self.store.connection() as conn:
            conn.execute("UPDATE watches SET packaging = 'tape_reel' WHERE id = %s", (self.watch.id,))
        self.assertIsNone(self.stock(), "the watch counts reels, and there is none")
        with self.store.connection() as conn:
            conn.execute("UPDATE watches SET packaging = 'any' WHERE id = %s", (self.watch.id,))
        self.assertEqual(self.stock(), 100)
        with self.store.connection() as conn:
            conn.execute("UPDATE listings SET match_state = 'rejected' WHERE id = 'l1'")
        self.assertIsNone(self.stock())

    def test_a_picked_packaging_and_a_deleted_listing_are_noticed(self) -> None:
        self.assertEqual(self.stock(), 100)
        with self.store.connection() as conn:
            conn.execute("DELETE FROM listings WHERE id = 'l1'")
        self.assertIsNone(self.stock())

    def test_a_threshold_is_not_kept_so_it_needs_no_invalidation(self) -> None:
        self.assertEqual(self.stock(), 100)
        with self.store.connection() as conn:
            self.watches.update_watch(conn, self.watch.id, ACTOR, threshold=500)
            (item,) = self.parts_view.summaries_for(conn, [self.watch.part_id])
        self.assertEqual(item["status"], "warning")

    def test_trimming_forgets_old_summaries_and_the_log_nothing_depends_on(self) -> None:
        from app.services.supply import retention

        self.assertEqual(self.stock(), 100)
        with self.store.connection() as conn:
            conn.execute("UPDATE part_summaries SET computed_at = NOW() - INTERVAL '8 days'")
            retention.trim_summaries(conn)
            self.assertEqual(conn.execute("SELECT COUNT(*) AS n FROM part_summaries").fetchone()["n"], 0)
        # The log keeps what an open transaction of another worker may still depend on; it empties once they end.
        for _ in range(40):
            with self.store.connection() as conn:
                retention.trim_summaries(conn)
                if conn.execute("SELECT COUNT(*) AS n FROM summary_dirty").fetchone()["n"] == 0:
                    break
            time.sleep(0.25)
        else:
            self.fail("the log was never trimmed")
        self.assertEqual(self.stock(), 100, "worked out again when asked")

    def test_removing_a_part_does_not_trip_the_triggers(self) -> None:
        self.assertEqual(self.stock(), 100)
        with self.store.connection() as conn:
            conn.execute("DELETE FROM parts")
            self.assertEqual(conn.execute("SELECT COUNT(*) AS n FROM part_summaries").fetchone()["n"], 0)


if __name__ == "__main__":
    unittest.main()

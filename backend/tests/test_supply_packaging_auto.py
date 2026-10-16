"""Picking a packaging by what a project buys for (plan section 12)."""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
ACTOR = "ana@example.com"
NOW = datetime(2026, 10, 16, 12, tzinfo=timezone.utc)


def listing(sku: str, packaging: str, moq: int) -> dict:
    return {"id": sku, "sku": sku, "packaging": packaging, "listing_packaging": packaging, "moq": moq}


class ChooseTests(unittest.TestCase):
    def test_prototypes_follow_the_smallest_order_and_production_follows_a_reel(self) -> None:
        from app.services.supply import packaging_auto

        listings = [listing("A-REEL", "tape_reel", 3000), listing("A-CUT", "cut_tape", 1), listing("A-DKR", "tape_reel", 2500)]
        self.assertEqual(packaging_auto.choose(listings, "prototypes")["id"], "A-CUT")
        self.assertEqual(packaging_auto.choose(listings, "production")["id"], "A-DKR", "the smallest reel")
        self.assertEqual(packaging_auto.choose([listing("T", "tray", 10), listing("B", "bulk", 100)], "production")["id"], "T", "no reel: the smallest order")


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class AutoPickTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.postgres_database import database
        from app.services.supply import packaging_auto, parts, tracking, watches
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.auto, cls.parts, cls.tracking, cls.watches = database, packaging_auto, parts, tracking, watches
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_auto_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)

    @classmethod
    def tearDownClass(cls) -> None:
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("listings", "watches", "tracked_projects", "bom_usage_projects", "parts", "manufacturers", "connectors", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
        self.cid = self.connectors.create(actor=ACTOR, provider="lcsc", daily_budget=1000)["id"]

    def part_with_listings(self, mpn: str) -> str:
        with self.store.connection() as conn:
            watch, _ = self.watches.add_watch(conn, "Acme", mpn, ACTOR, tier=1)
            for sku, packaging, moq in ((f"{mpn}-CUT", "cut_tape", 1), (f"{mpn}-REEL", "tape_reel", 3000)):
                conn.execute(
                    "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state, packaging) "
                    "VALUES (%s, %s, %s, %s, %s, 'Acme', 'exact', %s)", (sku, self.cid, sku, watch.part_id, mpn, packaging))
                conn.execute("INSERT INTO offers (listing_id, fetched_at, stock, packaging, moq, currency) VALUES (%s, %s, 100, %s, %s, 'USD')", (sku, NOW, packaging, moq))
            self.tracking.recompute(conn)
        return watch.part_id

    def picked(self, part_id: str) -> str | None:
        with self.store.connection() as conn:
            row = conn.execute("SELECT listing_id FROM packaging_picks WHERE part_id = %s", (part_id,)).fetchone()
        return row["listing_id"] if row else None

    def test_a_part_in_no_project_follows_the_smallest_order(self) -> None:
        part = self.part_with_listings("R1")
        with self.store.connection() as conn:
            self.assertEqual(self.auto.auto_pick(conn), 1)
        self.assertEqual(self.picked(part), "R1-CUT")

    def test_a_part_only_production_projects_use_follows_a_reel_and_a_persons_pick_is_left_alone(self) -> None:
        part = self.part_with_listings("R2")
        other = self.part_with_listings("R3")
        with self.store.connection() as conn:
            for project_id in ("p1", "p2"):
                conn.execute("INSERT INTO bom_usage_projects (project_id, project_name, revision_key, line_count, updated_at) VALUES (%s, %s, 'r', 1, NOW())", (project_id, project_id))
                conn.execute("INSERT INTO bom_usage (project_id, line_key, manufacturer, mpn, alias_key, match_key, quantity) VALUES (%s, 'k', 'Acme', 'R2', 'acme', 'R2', 1)", (project_id,))
                conn.execute("INSERT INTO tracked_projects (project_id, variants, buying_for, tracked_by) VALUES (%s, ARRAY['']::text[], 'production', 'x')", (project_id,))
            from app.services.supply import packaging_picks

            packaging_picks.pick(conn, other, self.cid, "R3-REEL", ACTOR)
            self.assertEqual(self.auto.policy_of(conn, part), "production")
            self.assertEqual(self.auto.auto_pick(conn), 1)
            conn.execute("UPDATE tracked_projects SET buying_for = 'prototypes' WHERE project_id = 'p2'")
            self.assertEqual(self.auto.policy_of(conn, part), "prototypes", "one prototype project is enough")
        self.assertEqual(self.picked(part), "R2-REEL")
        self.assertEqual(self.picked(other), "R3-REEL", "a person's pick stays")


if __name__ == "__main__":
    unittest.main()

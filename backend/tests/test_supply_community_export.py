"""The community export holds facts with a public source and nothing of the workspace's own."""

from __future__ import annotations

import json
import os
import sys
import unittest
import uuid
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
NOW = datetime(2026, 3, 1, 12, tzinfo=timezone.utc)


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply tests")
class CommunityExportTests(unittest.TestCase):
    def test_it_lists_confirmed_spellings_and_sourced_lifecycles_and_leaves_the_rest_out(self) -> None:
        from app.services.postgres_database import database
        from app.services.supply import community_export, parts, watches
        from app.services.supply.store import SupplyStore

        store = type("T", (SupplyStore,), {"schema": f"supply_comm_test_{uuid.uuid4().hex[:8]}"})()
        store.initialize()
        try:
            with store.connection() as conn:
                conn.execute("INSERT INTO manufacturers (id, name, name_key) VALUES ('m1', 'Texas Instruments', 'texasinstruments')")
                conn.execute("INSERT INTO manufacturer_aliases (alias_key, alias_text, manufacturer_id, status) VALUES ('ti', 'TI', 'm1', 'confirmed'), ('tx', 'TX Inst', NULL, 'pending')")
                conn.execute("INSERT INTO connectors (id, provider) VALUES ('c1', 'fake')")
                watch, _ = watches.add_watch(conn, "Texas Instruments", "LM358D", "private.person@example.com")
                conn.execute("INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) VALUES ('l1', 'c1', 'S', %s, 'x', 'x', 'exact')", (watch.part_id,))
                conn.execute("INSERT INTO offers (listing_id, fetched_at, stock, lifecycle, product_url) VALUES ('l1', %s, 777, 'nrnd', 'https://shop.example/lm358d')", (NOW,))
                data = community_export.build(conn, NOW)
            self.assertEqual(data["manufacturer_aliases"], [{"alias": "TI", "manufacturer": "Texas Instruments"}])
            self.assertEqual(data["lifecycle"], [{"manufacturer": "Texas Instruments", "mpn": "LM358D", "lifecycle": "nrnd", "source": "https://shop.example/lm358d", "seen": "2026-03-01"}])
            text = json.dumps(data)
            for private in ("private.person", "777", "TX Inst", "tracking"):
                self.assertNotIn(private, text)
        finally:
            with database.connection() as conn:
                conn.execute(f'DROP SCHEMA IF EXISTS "{store.schema}" CASCADE')


if __name__ == "__main__":
    unittest.main()

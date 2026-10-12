"""Demand: adding and closing it, netting against our own stock, and what it does to a part's assessment.

Needs ``PRISM_DATABASE_URL``. Our own stock is stubbed: it comes from the catalog.
"""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.supply import demand  # noqa: E402
from supply_api_helpers import request as _request  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()


class NetTests(unittest.TestCase):
    def test_own_stock_comes_off_the_demand_and_never_below_zero(self) -> None:
        self.assertEqual(demand.net_requirement(1000, 300), 700)
        self.assertEqual(demand.net_requirement(1000, 5000), 0)
        self.assertEqual(demand.net_requirement(1000, None), 1000)
        self.assertEqual(demand.net_requirement(-20, 0), 0, "incoming stock alone needs nothing")

    def test_coverage_is_stock_over_demand_where_both_are_known(self) -> None:
        self.assertEqual(demand.coverage(500, 1000), 0.5)
        self.assertIsNone(demand.coverage(None, 1000))
        self.assertIsNone(demand.coverage(500, 0))


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply API tests")
class DemandApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_assessment, supply_connectors, supply_demands
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply import parts
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.parts, cls.supply_demands = database, parts, supply_demands
        cls.users = {
            role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role)
            for role in ("viewer", "qa", "designer", "admin")
        }
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_demand_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_demands.router)
        cls.app.include_router(supply_assessment.router)
        supply_connectors.register_validation_redaction(cls.app)
        cls.patcher = mock.patch.object(supply_connectors, "service", cls.connectors)
        cls.patcher.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.patcher.stop()
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("demands", "offers", "listings", "watches", "parts", "manufacturers", "connectors", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO manufacturers (id, name, name_key) VALUES ('m1', 'Acme', 'acme')")
            self.part = self.parts.ensure_part(conn, "Acme", "ABC-1", "seed@example.com").id
            conn.execute("INSERT INTO connectors (id, provider) VALUES ('c1', 'fake')")
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) "
                "VALUES ('l1', 'c1', 'A', %s, 'x', 'Acme', 'exact')", (self.part,))
            conn.execute("INSERT INTO offers (listing_id, fetched_at, stock) VALUES ('l1', NOW(), 500)")

    def call(self, method: str, path: str, *, role: str = "designer", body=None):
        return _request(self.app, method, path, user=self.users[role], body=body)

    def add(self, quantity: int, **extra):
        return self.call("POST", f"/api/supply/parts/{self.part}/demands", body={"quantity": quantity} | extra)

    def own(self, stock):
        found = {} if stock is None else {("acme", "abc-1"): stock}
        return mock.patch.object(self.supply_demands.catalog_read, "own_stock", lambda pairs: found)

    def test_a_designer_adds_a_demand_and_the_part_shows_what_is_left_to_cover(self) -> None:
        created = self.add(1000, need_by="2026-12-01", note="Spring run")
        self.assertEqual(created.status, 201, created.text)
        self.assertEqual((created.json["state"], created.json["need_by"], created.json["created_by"]), ("planned", "2026-12-01", "designer@example.com"))
        self.assertEqual(self.add(-100, note="PO arriving").status, 201)
        with self.own(250):
            listed = self.call("GET", f"/api/supply/parts/{self.part}/demands", role="qa").json
        self.assertEqual(len(listed["items"]), 2)
        self.assertEqual(listed["summary"], {"open": 900, "own_stock": 250, "net": 650, "next_need_by": "2026-12-01"})

    def test_closing_keeps_the_row_but_stops_counting_it(self) -> None:
        demand_id = self.add(400).json["id"]
        self.assertEqual(self.call("POST", f"/api/supply/demands/{demand_id}/close").status, 204)
        with self.own(None):
            listed = self.call("GET", f"/api/supply/parts/{self.part}/demands").json
        self.assertEqual((listed["items"], listed["summary"]["open"]), ([], 0))
        with self.store.connection() as conn:
            row = conn.execute("SELECT state, closed_by FROM demands WHERE id = %s", (demand_id,)).fetchone()
            actions = [r["action"] for r in conn.execute("SELECT action FROM audit_events WHERE action LIKE 'demand.%' ORDER BY id").fetchall()]
        self.assertEqual((row["state"], row["closed_by"]), ("closed", "designer@example.com"))
        self.assertEqual(actions, ["demand.add", "demand.close"])

    def test_who_may_do_what_and_what_is_refused(self) -> None:
        self.assertEqual(self.add(10).status, 201)
        self.assertEqual(self.call("POST", f"/api/supply/parts/{self.part}/demands", role="qa", body={"quantity": 5}).status, 403)
        self.assertEqual(self.call("GET", f"/api/supply/parts/{self.part}/demands", role="viewer").status, 403)
        self.assertEqual(self.add(0).status, 400)
        self.assertEqual(self.call("POST", "/api/supply/parts/nope/demands", body={"quantity": 5}).status, 404)
        self.assertEqual(self.call("POST", "/api/supply/demands/nope/close").status, 404)

    def test_a_part_is_judged_against_what_is_still_needed(self) -> None:
        def findings():
            with self.own(100):
                response = self.call("GET", f"/api/supply/parts/{self.part}/assessment", role="qa")
            return {f["check"] for f in response.json["findings"]}

        self.assertNotIn("insufficient_stock", findings(), "no demand, nothing to fall short of")
        self.add(1000)
        self.assertIn("insufficient_stock", findings(), "500 in stock against 900 still to cover")
        self.add(-800)
        self.assertNotIn("insufficient_stock", findings(), "incoming stock brings the need to 100, own stock covers it")

    def test_open_demand_is_read_per_part_for_polling(self) -> None:
        self.add(300)
        with self.store.connection() as conn:
            self.assertEqual(demand.open_totals(conn, [self.part, "other"]), {self.part: 300})
            self.assertIsNone(demand.summary(conn, self.part, None)["next_need_by"])


if __name__ == "__main__":
    unittest.main()

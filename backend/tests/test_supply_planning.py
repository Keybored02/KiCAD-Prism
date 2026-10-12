"""Planning: the first date demand outruns supply. The rule needs nothing; the plan needs ``PRISM_DATABASE_URL``."""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import date
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.supply import planning  # noqa: E402
from app.services.supply.planning import Entry  # noqa: E402
from supply_api_helpers import request as _request  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()


def entry(quantity, day=None, state="planned"):
    return Entry(quantity, date.fromisoformat(day) if day else None, state)


class ShortageRuleTests(unittest.TestCase):
    def test_enough_supply_is_not_short(self) -> None:
        result = planning.shortage([entry(500, "2026-04-01"), entry(300, "2026-06-01")], 1000)
        self.assertEqual((result["short"], result["first_short_on"], result["total_short_by"]), (False, None, 0))

    def test_the_first_date_demand_so_far_passes_supply_is_the_shortage_date(self) -> None:
        result = planning.shortage([entry(600, "2026-04-01"), entry(600, "2026-06-01"), entry(600, "2026-08-01")], 1000)
        self.assertEqual((result["short"], result["first_short_on"], result["short_by"], result["total_short_by"]), (True, "2026-06-01", 200, 800))

    def test_incoming_stock_counts_from_its_own_date(self) -> None:
        late = planning.shortage([entry(1500, "2026-04-01"), entry(-1000, "2026-05-01")], 1000)
        self.assertEqual((late["first_short_on"], late["short_by"], late["total_short_by"]), ("2026-04-01", 500, 0))
        early = planning.shortage([entry(1500, "2026-04-01"), entry(-1000, "2026-03-01")], 1000)
        self.assertFalse(early["short"])
        undated = planning.shortage([entry(1500, "2026-04-01"), entry(-1000)], 1000)
        self.assertFalse(undated["short"], "incoming with no date counts from the start")

    def test_demand_with_no_date_is_added_last(self) -> None:
        result = planning.shortage([entry(400, "2026-04-01"), entry(700)], 1000)
        self.assertEqual((result["short"], result["first_short_on"], result["short_by"]), (True, None, 100))

    def test_nothing_held_and_something_needed_is_short_from_the_first_date(self) -> None:
        result = planning.shortage([entry(10, "2026-04-01")], 0)
        self.assertEqual((result["first_short_on"], result["short_by"]), ("2026-04-01", 10))


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class PlanTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_planning
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply import demand, parts
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.parts, cls.demand = database, parts, demand
        cls.users = {role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role) for role in ("viewer", "qa")}
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_plan_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_planning.router)
        cls.patcher = mock.patch.object(supply_connectors, "service", cls.connectors)
        cls.patcher.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.patcher.stop()
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("demands", "offers", "listings", "parts", "manufacturers", "connectors"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO manufacturers (id, name, name_key) VALUES ('m1', 'Acme', 'acme')")
            conn.execute("INSERT INTO connectors (id, provider) VALUES ('c1', 'fake')")

    def part(self, mpn: str, stock: int) -> str:
        with self.store.connection() as conn:
            part_id = self.parts.ensure_part(conn, "Acme", mpn, "seed@example.com").id
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) VALUES (%s, 'c1', %s, %s, 'x', 'x', 'exact')",
                (f"l-{mpn}", mpn, part_id))
            conn.execute("INSERT INTO offers (listing_id, fetched_at, stock) VALUES (%s, NOW(), %s)", (f"l-{mpn}", stock))
        return part_id

    def need(self, part_id: str, quantity: int, day: str | None = None, committed: bool = False) -> None:
        with self.store.connection() as conn:
            self.demand.add_manual(conn, part_id, quantity, "seed@example.com", need_by=date.fromisoformat(day) if day else None, committed=committed)

    def test_the_plan_lists_parts_with_demand_shortages_first_and_counts_our_own_stock(self) -> None:
        fine = self.part("FINE-1", 5000)
        tight = self.part("TIGHT-1", 400)
        self.need(fine, 1000, "2026-05-01")
        self.need(tight, 500, "2026-04-01", committed=True)
        self.need(tight, 500, "2026-07-01")
        with self.store.connection() as conn:
            plain = planning.compute(conn, None)
            with_own = planning.compute(conn, lambda pairs: {("acme", "tight-1"): 300})
        self.assertEqual([row["mpn"] for row in plain["parts"]], ["TIGHT-1", "FINE-1"])
        first = plain["parts"][0]
        self.assertEqual((first["short"], first["first_short_on"], first["short_by"], first["needed"], first["committed"]), (True, "2026-04-01", 100, 1000, 500))
        self.assertEqual(plain["short"], 1)
        covered = with_own["parts"][0]
        self.assertEqual((covered["own_stock"], covered["first_short_on"], covered["short_by"]), (300, "2026-07-01", 300))

    def test_only_readers_see_the_plan_and_an_empty_plan_is_empty(self) -> None:
        self.assertEqual(_request(self.app, "GET", "/api/supply/planning", user=self.users["qa"]).json, {"parts": [], "short": 0})
        self.assertEqual(_request(self.app, "GET", "/api/supply/planning", user=self.users["viewer"]).status, 403)


if __name__ == "__main__":
    unittest.main()

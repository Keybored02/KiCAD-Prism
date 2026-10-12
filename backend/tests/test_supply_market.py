"""Market indices over the followed parts. The metrics need nothing; the rest needs ``PRISM_DATABASE_URL``."""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import date, datetime, timezone
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.supply import market  # noqa: E402
from supply_api_helpers import request as _request  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
NOW = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


def row(stock, lifecycle="active", offers=()):
    return {"stock": stock, "lifecycle": lifecycle, "offers": list(offers)}


def offer(lead=None, dropped=False):
    return {"lead_time_days": lead, "discontinued": dropped}


class MetricTests(unittest.TestCase):
    def test_shares_and_the_median_lead_time(self) -> None:
        rows = [
            row(0, offers=[offer(84)]),
            row(500, "nrnd", offers=[offer(28), offer(56)]),
            row(900, offers=[offer()]),
            row(None, "obsolete"),
        ]
        result = market.metrics_of(rows)
        self.assertAlmostEqual(result["out_of_stock"], 1 / 3)
        self.assertEqual(result["lifecycle_risk"], 0.5)
        self.assertEqual(result["median_lead_time_days"], 56.0)

    def test_dropped_means_every_listing_of_the_part_was_dropped(self) -> None:
        rows = [row(0, offers=[offer(dropped=True), offer(dropped=True)]), row(5, offers=[offer(dropped=True), offer()]), row(5, offers=[offer()])]
        self.assertAlmostEqual(market.metrics_of(rows)["dropped"], 1 / 3)

    def test_nothing_read_gives_no_stock_shares_and_no_lead_time(self) -> None:
        result = market.metrics_of([row(None), row(None, "nrnd")])
        self.assertEqual(result, {"lifecycle_risk": 0.5})


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class MarketDatabaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_market
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply import parts, watches
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.parts, cls.watches = database, parts, watches
        cls.users = {role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role) for role in ("viewer", "qa")}
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_market_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_market.router)
        cls.patcher = mock.patch.object(supply_connectors, "service", cls.connectors)
        cls.patcher.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.patcher.stop()
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("market_indices", "offers", "listings", "watches", "parts", "manufacturers", "connectors"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO manufacturers (id, name, name_key) VALUES ('m1', 'Acme', 'acme'), ('m2', 'Globex', 'globex')")
            conn.execute("INSERT INTO connectors (id, provider) VALUES ('c1', 'fake')")

    def follow(self, maker: str, mpn: str, stock: int, lifecycle: str = "active") -> None:
        with self.store.connection() as conn:
            record, _ = self.watches.add_watch(conn, maker, mpn, "seed@example.com")
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) VALUES (%s, 'c1', %s, %s, 'x', 'x', 'exact')",
                (f"l-{mpn}", mpn, record.part_id))
            conn.execute("INSERT INTO offers (listing_id, fetched_at, stock, lifecycle) VALUES (%s, %s, %s, %s)", (f"l-{mpn}", NOW, stock, lifecycle))

    def test_a_group_needs_enough_parts_and_the_whole_set_is_always_given_its_size(self) -> None:
        for index in range(3):
            self.follow("Acme", f"A-{index}", 0 if index == 0 else 100, "nrnd" if index == 1 else "active")
        self.follow("Globex", "G-1", 50)
        with self.store.connection() as conn:
            scopes = market.compute(conn)
        self.assertEqual(set(scopes), {"all", "Acme"}, "Globex has one part, below the minimum")
        self.assertEqual((scopes["all"]["sample"], scopes["Acme"]["sample"]), (4, 3))
        self.assertAlmostEqual(scopes["Acme"]["metrics"]["out_of_stock"], 1 / 3)

    def test_a_snapshot_is_stored_once_a_day_and_compared_with_a_month_earlier(self) -> None:
        for index in range(3):
            self.follow("Acme", f"A-{index}", 100)
        with self.store.connection() as conn:
            self.assertGreater(market.snapshot(conn, date(2026, 2, 1)), 0)
            self.assertEqual(market.snapshot(conn, date(2026, 2, 1)), 0, "already stored today")
            conn.execute("UPDATE offers SET stock = 0 WHERE listing_id = 'l-A-0'")
            market.snapshot(conn, date(2026, 3, 3))
            result = market.overview(conn)
        self.assertEqual((result["day"], result["compared_with"]), ("2026-03-03", "2026-02-01"))
        metric = result["scopes"][0]["metrics"]["out_of_stock"]
        self.assertEqual((metric["before"], round(metric["value"], 2)), (0.0, 0.33))
        self.assertEqual(result["scopes"][0]["scope"], "All followed parts")

    def test_nothing_stored_yet_says_so_and_only_readers_see_it(self) -> None:
        response = _request(self.app, "GET", "/api/supply/market", user=self.users["qa"])
        self.assertEqual((response.status, response.json), (200, {"day": None, "scopes": []}))
        self.assertEqual(_request(self.app, "GET", "/api/supply/market", user=self.users["viewer"]).status, 403)


if __name__ == "__main__":
    unittest.main()

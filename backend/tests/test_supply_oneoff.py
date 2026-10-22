"""Check once: a BOM or component read at the distributors, tracked by nobody. Needs ``PRISM_DATABASE_URL``."""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
ACTOR = "ana@example.com"
SUNDAY = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class OneOffTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.postgres_database import database
        from app.services.supply import discoverer, oneoff, poller, watches
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.providers.base import ProviderConfig
        from app.services.supply.providers.fake import FakeProvider
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.discoverer, cls.oneoff, cls.poller, cls.watches = database, discoverer, oneoff, poller, watches
        cls.FakeProvider, cls.ProviderConfig = FakeProvider, ProviderConfig
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_one_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)

    @classmethod
    def tearDownClass(cls) -> None:
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("read_requests", "listings", "watches", "parts", "manufacturers", "connectors", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
        self.now = SUNDAY

    def connector(self, **overrides) -> str:
        values = dict(actor=ACTOR, provider="fake", currency="EUR", daily_budget=1000, interactive_reserve_pct=10)
        values.update(overrides)
        return self.connectors.create(**values)["id"]

    def served(self, connector_id: str, limit: int = 20) -> dict:
        clock = lambda: self.now  # noqa: E731
        provider = lambda cid: self.FakeProvider(self.ProviderConfig(connector_id=cid, currency="EUR"), clock=clock)  # noqa: E731
        discoverer = self.discoverer.Discoverer(self.connectors, store=self.store, provider_for=provider, clock=clock)
        poller = self.poller.Poller(self.connectors, store=self.store, provider_for=provider, clock=clock)
        from app.services.supply import jobs

        with self.store.connection() as conn:
            jobs.refresh_scheduled(conn, connector_id, self.now)  # what the poll job does first
        return self.oneoff.run(discoverer, poller, self.store, connector_id, limit=limit)

    def ask(self, lines, kind="bom"):
        with self.store.connection() as conn:
            return self.oneoff.request(conn, kind, lines, ACTOR)

    def progress(self, request_id: str) -> dict:
        with self.store.connection() as conn:
            return self.oneoff.progress(conn, request_id)

    def rows(self, sql: str):
        with self.store.connection() as conn:
            return conn.execute(sql).fetchall()

    def test_a_check_reads_the_parts_without_tracking_them(self) -> None:
        cid = self.connector()
        made = self.ask([("Acme", "ABC123"), ("Acme", "DEF456"), ("Acme", ""), ("", "X1")])
        self.assertEqual((made["parts"], [item["reason"] for item in made["skipped"]]), (3, ["no_mpn"]), "a part with no maker is read too")
        self.assertEqual(self.progress(made["id"])["parts"], 3)
        self.assertFalse(self.progress(made["id"])["finished"])
        self.assertEqual(self.served(cid), {"parts": 3, "done": 3})
        shown = self.progress(made["id"])
        self.assertEqual((shown["done"], shown["finished"]), (3, True))
        self.assertEqual(len(self.rows("SELECT 1 FROM offers")), 3, "all were read")
        self.assertEqual(self.rows("SELECT 1 FROM part_tiers"), [])
        self.assertEqual(self.rows("SELECT 1 FROM watches"), [])
        self.assertEqual({r["purpose"] for r in self.rows("SELECT purpose FROM call_counts")}, {"oneoff"})

    def test_a_part_that_is_already_tracked_is_left_to_its_schedule(self) -> None:
        self.connector()
        with self.store.connection() as conn:
            self.watches.add_watch(conn, "Acme", "ABC123", ACTOR, tier=1)
        made = self.ask([("Acme", "ABC123"), ("Acme", "NEW1")])
        self.assertEqual((made["parts"], made["already_tracked"]), (1, 1))

    def test_assembly_only_and_unreviewed_distributors_are_not_asked(self) -> None:
        self.connector()
        self.connectors.create(actor=ACTOR, provider="jlcpcb")
        made = self.ask([("Acme", "ABC123")])
        self.assertEqual(self.rows("SELECT COUNT(*) AS n FROM read_request_work")[0]["n"], 1)
        self.assertEqual(made["parts"], 1)

    def test_nothing_to_ask_or_nothing_named_is_refused(self) -> None:
        with self.assertRaises(self.oneoff.RequestError):
            self.ask([("Acme", "ABC123")])  # no distributor yet
        self.connector()
        with self.assertRaises(self.oneoff.RequestError):
            self.ask([("Acme", ""), ("Acme", " - ")])

    def test_an_empty_pool_on_a_working_day_waits_and_a_weekend_spares_what_it_can(self) -> None:
        cid = self.connector(daily_budget=40)  # a pool of 4 calls
        made = self.ask([("Acme", f"P{n}") for n in range(6)])
        self.now = SUNDAY.replace(day=2, hour=10)  # Monday morning: working hours, no spare
        first = self.served(cid)
        self.assertLess(first["done"], 6, "the pool of 4 calls cannot read six parts")
        stuck = self.progress(made["id"])
        self.assertFalse(stuck["finished"])
        self.assertEqual(self.rows("SELECT MAX(attempts) AS n FROM read_request_work")[0]["n"], 0, "waiting for budget is not a failed try")
        self.now = SUNDAY.replace(hour=23, minute=0)  # the last hours of a day: what is left is spare
        for _ in range(4):
            self.served(cid)
        self.assertTrue(self.progress(made["id"])["finished"])
        self.assertIn("oneoff", {r["purpose"] for r in self.rows("SELECT purpose FROM call_counts")})

    def test_a_large_check_stops_at_half_the_pool_and_leaves_the_rest_to_people(self) -> None:
        cid = self.connector(daily_budget=100)  # a pool of 10 calls
        self.ask([("Acme", f"P{n}") for n in range(20)])
        self.now = SUNDAY.replace(day=2, hour=10)  # Monday morning: working hours, no spare
        from unittest import mock

        from app.services.supply import demand

        # Scheduled work needs 95 of the 100 calls, so none are free: a check may only use the half of the pool it is allowed.
        with mock.patch.object(demand, "scheduled_rest", return_value=95):
            for _ in range(4):
                self.served(cid)
        spent = self.rows("SELECT interactive_spent AS n FROM quota_ledger")[0]["n"]
        self.assertLessEqual(spent, 5, "Read now and Fill still have the other half")
        self.assertGreater(spent, 0)

    def test_progress_for_an_unknown_request_is_a_key_error(self) -> None:
        with self.store.connection() as conn, self.assertRaises(KeyError):
            self.oneoff.progress(conn, "nope")


if __name__ == "__main__":
    unittest.main()

"""A week of polling on a fake clock against a daily budget.

Asserts what the scheduler promises: no day spends more than the budget, urgent listings are served
more often than quiet ones, and nothing is starved for good. Needs ``PRISM_DATABASE_URL``.
"""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
ACTOR = "sim@example.com"
START = datetime(2026, 3, 1, 0, 5, tzinfo=timezone.utc)
BUDGET = 100
PARTS = 90
PINNED = 4


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class SchedulerSimulationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.postgres_database import database
        from app.services.supply import parts, poller, watches
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.providers import registry
        from app.services.supply.providers.base import ProviderConfig, ProviderSpec
        from app.services.supply.providers.fake import FakeProvider
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.parts, cls.poller_module, cls.watches = database, parts, poller, watches
        cls.registry, cls.FakeProvider, cls.ProviderConfig = registry, FakeProvider, ProviderConfig
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_sim_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        registry.register(ProviderSpec(
            key="sim_batch", label="Sim", capabilities=frozenset({"offers"}), max_batch=2, stock_pooling="separate",
            credential_fields=(), factory=lambda config: FakeProvider(config), default_daily_budget=BUDGET,
        ), replace=True)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.registry.unregister("sim_batch")
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def test_a_week_never_overspends_serves_pinned_parts_most_and_starves_nothing(self) -> None:
        now = {"t": START}

        def clock() -> datetime:
            return now["t"]

        connector = self.connectors.create(
            actor=ACTOR, provider="sim_batch", currency="EUR", interactive_reserve_pct=0, daily_budget=BUDGET,
        )["id"]
        with self.store.connection() as conn:
            for index in range(PARTS):
                mpn = f"SIM-{index:03d}"
                record, _created = self.watches.add_watch(conn, "Acme", mpn, ACTOR, pinned=index < PINNED, may_create_manufacturer=True)
                sku = self.FakeProvider(self.ProviderConfig(connector_id=connector, currency="EUR")).lookup_mpn(mpn)[0].sku
                conn.execute(
                    "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) "
                    "VALUES (%s, %s, %s, %s, %s, 'Acme', 'exact')", (f"l{index}", connector, sku, record.part_id, mpn))

        def provider_for(connector_id: str):
            return self.FakeProvider(self.ProviderConfig(connector_id=connector_id, currency="EUR"), clock=clock)

        poller = self.poller_module.Poller(self.connectors, store=self.store, provider_for=provider_for, clock=clock)
        for _hour in range(7 * 24):
            poller.poll_connector(connector)
            now["t"] += timedelta(hours=1)

        with self.store.connection() as conn:
            spent = [row["spent"] for row in conn.execute("SELECT spent FROM quota_ledger WHERE connector_id = %s", (connector,)).fetchall()]
            reads = {
                row["sku"]: row["n"]
                for row in conn.execute(
                    "SELECT l.raw_mpn AS sku, COUNT(*) AS n FROM samples s JOIN listings l ON l.id = s.listing_id WHERE l.connector_id = %s GROUP BY l.raw_mpn",
                    (connector,),
                ).fetchall()
            }
        self.assertTrue(spent and max(spent) <= BUDGET, f"a day spent more than {BUDGET}: {spent}")
        self.assertEqual(len(reads), PARTS, "every listing was read at least once in the week")
        pinned = [reads[f"SIM-{index:03d}"] for index in range(PINNED)]
        quiet = [reads[f"SIM-{index:03d}"] for index in range(PINNED, PARTS)]
        self.assertGreater(min(pinned), 2 * max(quiet), f"pinned {pinned} against quiet {sorted(quiet)[-5:]}")


if __name__ == "__main__":
    unittest.main()

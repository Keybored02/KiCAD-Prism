"""Watches, stock aggregation and the poller, with a fake clock and the simulated market.

Needs ``PRISM_DATABASE_URL``. Uses a disposable schema.
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
ACTOR = "ana@example.com"
START = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


class Clock:
    def __init__(self) -> None:
        self.now = START

    def __call__(self) -> datetime:
        return self.now

    def advance(self, **delta) -> None:
        self.now += timedelta(**delta)


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class PollingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.postgres_database import database
        from app.services.supply import discovery, parts, poller, stock, watches
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.providers import registry
        from app.services.supply.providers.base import CredentialField, ProviderConfig, ProviderSpec
        from app.services.supply.providers.fake import FakeProvider
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.discovery, cls.parts, cls.poller_module = database, discovery, parts, poller
        cls.stock, cls.watches, cls.registry = stock, watches, registry
        cls.FakeProvider, cls.ProviderConfig = FakeProvider, ProviderConfig
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_poll_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)

        # A metered provider that only takes two SKUs per call, to make batching and budgets visible.
        cls.small_spec = ProviderSpec(
            key="demo_small", label="Demo small", capabilities=frozenset({"offers"}), max_batch=2,
            stock_pooling="separate", credential_fields=(), factory=lambda config: FakeProvider(config),
            default_daily_budget=100,
        )
        registry.register(cls.small_spec, replace=True)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.registry.unregister("demo_small")
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("listings", "watches", "parts", "manufacturer_aliases", "manufacturers", "connectors", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
        self.clock = Clock()
        self.provider_behaviour = None  # set by a test to wrap the provider

    # --- helpers ----------------------------------------------------------

    def connector(self, provider: str = "fake", **overrides) -> str:
        values = dict(actor=ACTOR, provider=provider, currency="EUR", interactive_reserve_pct=0)
        values.update(overrides)
        return self.connectors.create(**values)["id"]

    def provider_for(self, connector_id: str):
        inner = self.FakeProvider(self.ProviderConfig(connector_id=connector_id, currency="EUR"), clock=self.clock)
        return self.provider_behaviour(inner) if self.provider_behaviour else inner

    def poller(self):
        return self.poller_module.Poller(self.connectors, store=self.store, provider_for=self.provider_for, clock=self.clock)

    def watch(self, mpn: str = "ABC123", **kwargs):
        with self.store.connection() as conn:
            return self.watches.add_watch(conn, "Acme", mpn, ACTOR, **kwargs)

    def discover(self, watch, connector_id: str) -> None:
        service = self.discovery.DiscoveryService(lambda cid: self.provider_for(cid), self.store)
        service.discover(watch.part_id, connector_id)

    def add_listing(self, part_id: str, connector_id: str, sku: str, state: str = "exact") -> str:
        listing_id = uuid.uuid4().hex
        with self.store.connection() as conn:
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) "
                "VALUES (%s, %s, %s, %s, 'x', 'Acme', %s)", (listing_id, connector_id, sku, part_id, state))
        return listing_id

    def rows(self, sql: str, *params):
        with self.store.connection() as conn:
            return conn.execute(sql, params).fetchall()

    def state_of(self, sku: str) -> dict:
        (row,) = self.rows("SELECT l.id, l.match_state, ps.* FROM listings l LEFT JOIN poll_state ps ON ps.listing_id = l.id WHERE l.sku = %s", sku)
        return dict(row)

    # --- watches ----------------------------------------------------------

    def test_watching_creates_the_part_and_is_idempotent(self) -> None:
        first = self.watch("LM358-D", threshold=100)
        again = self.watch("lm358d")
        self.assertEqual((first.id, first.threshold, first.owner), (again.id, 100, ACTOR))
        self.assertEqual(len(self.rows("SELECT 1 FROM parts")), 1)
        self.assertEqual([w.mpn for w in self.rows_as_watches()], ["LM358-D"])

    def rows_as_watches(self):
        with self.store.connection() as conn:
            return self.watches.list_watches(conn)

    def test_changing_and_removing_a_watch(self) -> None:
        watch = self.watch()
        with self.store.connection() as conn:
            changed = self.watches.update_watch(conn, watch.id, "ben@example.com", threshold=50, pinned=True)
            self.assertEqual((changed.threshold, changed.pinned), (50, True))
            cleared = self.watches.update_watch(conn, watch.id, ACTOR, threshold=None)
            self.assertEqual((cleared.threshold, cleared.pinned), (None, True), "omitted fields are left alone")
            self.assertEqual(self.watches.update_watch(conn, watch.id, ACTOR), cleared, "no change, no audit")
            self.watches.remove_watch(conn, watch.id, ACTOR)
            with self.assertRaises(self.watches.WatchNotFound):
                self.watches.get_watch(conn, watch.id)
        actions = [r["action"] for r in self.rows("SELECT action FROM audit_events WHERE action LIKE 'watch.%%' ORDER BY id")]
        self.assertEqual(actions, ["watch.add", "watch.update", "watch.update", "watch.remove"])
        self.assertEqual(len(self.rows("SELECT 1 FROM parts")), 1, "removing a watch keeps the part")

    def test_watch_rules_are_checked(self) -> None:
        watch = self.watch()
        with self.store.connection() as conn:
            for bad in (-1, True, 1.5, "10"):
                with self.assertRaises(self.watches.WatchError, msg=repr(bad)):
                    self.watches.update_watch(conn, watch.id, ACTOR, threshold=bad)
            with self.assertRaises(self.watches.WatchError):
                self.watches.update_watch(conn, watch.id, ACTOR, pinned="yes")
            with self.assertRaises(ValueError):
                self.watches.update_watch(conn, watch.id, " ", threshold=1)
            with self.assertRaises(self.watches.WatchNotFound):
                self.watches.update_watch(conn, "missing", ACTOR, threshold=1)

    def test_pins_are_capped(self) -> None:
        original = self.watches.MAX_PINNED
        self.watches.MAX_PINNED = 2
        try:
            first, second = self.watch("P1", pinned=True), self.watch("P2", pinned=True)
            with self.assertRaises(self.watches.WatchError):
                self.watch("P3", pinned=True)
            third = self.watch("P3")
            with self.store.connection() as conn:
                with self.assertRaises(self.watches.WatchError):
                    self.watches.update_watch(conn, third.id, ACTOR, pinned=True)
                self.watches.update_watch(conn, first.id, ACTOR, pinned=True)  # already pinned: not counted twice
                self.watches.update_watch(conn, second.id, ACTOR, pinned=False)
                self.watches.update_watch(conn, third.id, ACTOR, pinned=True)
        finally:
            self.watches.MAX_PINNED = original

    # --- stock across listings --------------------------------------------

    def _offer(self, listing_id: str, stock: int, *, marketplace: bool = False) -> None:
        with self.store.connection() as conn:
            conn.execute(
                "INSERT INTO offers (listing_id, fetched_at, stock, marketplace) VALUES (%s, %s, %s, %s)",
                (listing_id, START, stock, marketplace))

    def test_stock_counts_pooled_packaging_once_and_separate_stock_together(self) -> None:
        watch = self.watch()
        pooled, separate = self.connector("fake"), self.connector("demo_small")
        for connector_id, skus in ((pooled, ("CT", "RL")), (separate, ("A", "B"))):
            for sku in skus:
                self._offer(self.add_listing(watch.part_id, connector_id, sku), 1000 if sku in ("CT", "RL", "A") else 500)
        with self.store.connection() as conn:
            result = self.stock.part_stock(conn, watch.part_id)
        self.assertEqual(result.by_connector, {pooled: 1000, separate: 1500})
        self.assertEqual((result.total, result.listings), (2500, 4))

    def test_stock_leaves_out_marketplace_unproven_and_gone_listings(self) -> None:
        watch = self.watch()
        cid = self.connector("demo_small")
        for sku, state, marketplace in (("OK", "exact", False), ("MKT", "exact", True), ("NEAR", "near", False),
                                        ("GONE", "gone", False), ("PIN", "manual", False)):
            self._offer(self.add_listing(watch.part_id, cid, sku, state), 100, marketplace=marketplace)
        with self.store.connection() as conn:
            result = self.stock.part_stock(conn, watch.part_id)
        self.assertEqual((result.total, result.listings), (200, 2))
        with self.store.connection() as conn:
            self.assertEqual(self.stock.part_stock(conn, self.watch("NOOFFERS").part_id).total, 0)

    # --- polling ----------------------------------------------------------

    def test_the_first_poll_records_the_offer_a_sample_and_the_schedule(self) -> None:
        cid = self.connector()
        watch = self.watch()
        self.discover(watch, cid)
        summary = self.poller().poll_connector(cid)
        self.assertEqual((summary.calls, summary.polled, summary.stopped), (1, 1, None))

        expected = self.provider_for(cid).get_offers(["FAKE-ABC123-CT"])[0]
        (offer,) = self.rows("SELECT * FROM offers")
        self.assertEqual((offer["stock"], offer["currency"], offer["packaging"]), (expected.stock, "EUR", "cut_tape"))
        self.assertEqual(len(offer["price_breaks"]), 4)
        (sample,) = self.rows("SELECT * FROM samples")
        self.assertEqual((sample["stock"], sample["sampled_at"]), (expected.stock, self.clock.now))
        self.assertEqual(sample["unit_price"], expected.price_breaks[0].unit_price)
        state = self.state_of("FAKE-ABC123-CT")
        self.assertGreater(state["next_poll_at"], self.clock.now)
        self.assertEqual((state["error_streak"], state["last_change_at"]), (0, self.clock.now))
        self.assertEqual(self.rows("SELECT packaging FROM listings")[0]["packaging"], "cut_tape")
        self.assertIsNotNone(self.connectors.get(cid)["last_ok_at"])

    def test_nothing_is_polled_before_it_is_due_and_the_next_run_adds_history(self) -> None:
        cid = self.connector()
        self.discover(self.watch(), cid)
        poller = self.poller()
        poller.poll_connector(cid)
        self.assertEqual(poller.poll_connector(cid).stopped, "nothing_due")
        self.clock.advance(hours=2)
        self.assertEqual(poller.poll_connector(cid).stopped, "nothing_due", "a normal listing waits 24 hours")
        self.clock.advance(hours=26)
        summary = poller.poll_connector(cid)
        self.assertEqual((summary.calls, summary.polled), (1, 1))
        self.assertEqual(len(self.rows("SELECT 1 FROM samples")), 2)

    def test_last_change_moves_only_when_the_numbers_do(self) -> None:
        cid = self.connector("csv")
        watch = self.watch()
        self.imports_file(cid, "sku,mpn,manufacturer,stock\nC1,ABC123,Acme,10\n")
        self.discover_csv(watch, cid)
        poller = self.poller_csv()
        poller.poll_connector(cid)
        first = self.state_of("C1")["last_change_at"]
        self.clock.advance(days=2)
        poller.poll_connector(cid)
        self.assertEqual(len(self.rows("SELECT 1 FROM samples")), 1, "the same upload is one observation")
        self.assertEqual(self.state_of("C1")["last_change_at"], first)
        self.clock.advance(days=1)
        self.imports_file(cid, "sku,mpn,manufacturer,stock\nC1,ABC123,Acme,7\n")
        self.clock.advance(days=2)
        poller.poll_connector(cid)
        self.assertEqual(len(self.rows("SELECT 1 FROM samples")), 2)
        self.assertGreater(self.state_of("C1")["last_change_at"], first)

    def imports_file(self, connector_id: str, text: str) -> None:
        from app.services.supply.csv_import_service import CsvImportService

        CsvImportService(self.connectors, self.store).import_file(connector_id, text.encode(), actor=ACTOR, filename="f.csv")

    def csv_provider(self, connector_id: str):
        from app.services.supply.providers.csv_provider import CsvProvider

        return CsvProvider(self.ProviderConfig(connector_id=connector_id), store=self.store)

    def discover_csv(self, watch, connector_id: str) -> None:
        self.discovery.DiscoveryService(lambda cid: self.csv_provider(cid), self.store).discover(watch.part_id, connector_id)

    def poller_csv(self):
        return self.poller_module.Poller(self.connectors, store=self.store, provider_for=self.csv_provider, clock=self.clock)

    def test_unwatched_parts_and_unproven_listings_are_not_polled(self) -> None:
        cid = self.connector()
        with self.store.connection() as conn:
            unwatched = self.parts.ensure_part(conn, "Acme", "NOTWATCHED", ACTOR)
        self.add_listing(unwatched.id, cid, "FAKE-NOTWATCHED-CT")
        watched = self.watch("WATCHED")
        self.add_listing(watched.part_id, cid, "FAKE-WATCHED-CT")
        self.add_listing(watched.part_id, cid, "FAKE-WATCHED-RL", state="near")
        summary = self.poller().poll_connector(cid)
        self.assertEqual(summary.polled, 1)
        self.assertEqual([r["sku"] for r in self.rows("SELECT l.sku FROM offers o JOIN listings l ON l.id = o.listing_id")], ["FAKE-WATCHED-CT"])

    def test_listings_are_asked_about_in_batches_within_the_budget(self) -> None:
        # 4 calls a day, 2 listings per call. At noon 3 calls have accrued; by evening, all 4.
        cid = self.connector("demo_small", daily_budget=4)
        watch = self.watch()
        for n in range(7):
            self.add_listing(watch.part_id, cid, f"FAKE-P{n}-CT")
        summary = self.poller().poll_connector(cid)
        self.assertEqual((summary.calls, summary.polled, summary.stopped), (3, 6, "budget"))
        with self.store.connection() as conn:
            spent = conn.execute("SELECT spent FROM quota_ledger WHERE connector_id = %s", (cid,)).fetchone()["spent"]
        self.assertEqual(spent, 3)
        self.clock.advance(hours=11)
        later = self.poller().poll_connector(cid)
        self.assertEqual(later.calls, 1)
        self.assertEqual(len(self.rows("SELECT 1 FROM offers WHERE listing_id IN (SELECT id FROM listings WHERE sku = 'FAKE-P6-CT')")), 1,
                         "the listing that never got a turn is asked about first")

    def test_a_connector_with_no_budget_polls_nothing_and_a_free_one_never_spends(self) -> None:
        paid = self.connector("demo_small", daily_budget=0)
        self.add_listing(self.watch("A1").part_id, paid, "FAKE-A1-CT")
        self.assertEqual(self.poller().poll_connector(paid).stopped, "budget")
        self.assertEqual(self.rows("SELECT * FROM offers"), [])

        free = self.connector("csv")
        watch = self.watch("C2")
        self.imports_file(free, "sku,mpn,manufacturer,stock\nC2,C2,Acme,3\n")
        self.discover_csv(watch, free)
        self.assertEqual(self.poller_csv().poll_connector(free).polled, 1)
        self.assertEqual(self.rows("SELECT * FROM quota_ledger WHERE connector_id = %s", free), [])

    def test_a_listing_missing_three_times_is_marked_gone(self) -> None:
        cid = self.connector()
        watch = self.watch()
        self.add_listing(watch.part_id, cid, "FAKE-ABC123-CT")
        self.add_listing(watch.part_id, cid, "FAKE-GHOST-CT")

        class DropsGhost:
            def __init__(self, inner): self.inner = inner
            def get_offers(self, skus): return [o for o in self.inner.get_offers(skus) if "GHOST" not in o.sku]

        self.provider_behaviour = DropsGhost
        poller = self.poller()
        results = []
        for _ in range(3):
            results.append(poller.poll_connector(cid))
            self.state = self.state_of("FAKE-GHOST-CT")
            if self.state["match_state"] != "gone":
                self.assertEqual(self.state["missing_streak"], len(results))
                self.assertLessEqual(self.state["next_poll_at"], self.clock.now + timedelta(hours=1, minutes=1), "retried soon")
            self.clock.advance(hours=2)
        self.assertEqual([r.gone for r in results], [0, 0, 1])
        self.assertEqual(self.state_of("FAKE-GHOST-CT")["match_state"], "gone")
        self.assertEqual(self.state_of("FAKE-ABC123-CT")["match_state"], "exact")
        self.clock.advance(days=3)
        self.assertEqual(poller.poll_connector(cid).polled, 1, "a gone listing is no longer asked about")

    def test_a_returning_listing_clears_its_misses(self) -> None:
        cid = self.connector()
        self.add_listing(self.watch().part_id, cid, "FAKE-ABC123-CT")
        calls = {"n": 0}

        class DropsOnce:
            def __init__(self, inner): self.inner = inner
            def get_offers(self, skus):
                calls["n"] += 1
                return [] if calls["n"] == 1 else self.inner.get_offers(skus)

        self.provider_behaviour = DropsOnce
        poller = self.poller()
        poller.poll_connector(cid)
        self.assertEqual(self.state_of("FAKE-ABC123-CT")["missing_streak"], 1)
        self.clock.advance(hours=2)
        poller.poll_connector(cid)
        self.assertEqual(self.state_of("FAKE-ABC123-CT")["missing_streak"], 0)

    # --- trouble ----------------------------------------------------------

    def _failing(self, error):
        class Failing:
            def __init__(self, inner): self.inner = inner
            def get_offers(self, skus): raise error
        self.provider_behaviour = Failing

    def test_a_rate_limit_holds_the_whole_connector_off(self) -> None:
        from app.services.supply.providers.base import RateLimited

        cid = self.connector()
        self.add_listing(self.watch().part_id, cid, "FAKE-ABC123-CT")
        self._failing(RateLimited("slow down", retry_after_seconds=600))
        summary = self.poller().poll_connector(cid)
        self.assertEqual(summary.stopped, "rate_limited")
        self.assertEqual(self.connectors.get(cid)["last_error_code"], "rate_limited")
        self.assertEqual(self.poller().poll_connector(cid).stopped, "cooling_down")
        self.assertEqual(self.rows("SELECT * FROM poll_state"), [], "the listing is not blamed")
        self.clock.advance(minutes=11)
        self.provider_behaviour = None
        self.assertEqual(self.poller().poll_connector(cid).polled, 1)

    def test_a_rate_limit_without_a_retry_time_waits_fifteen_minutes(self) -> None:
        from app.services.supply.providers.base import RateLimited

        cid = self.connector()
        self.add_listing(self.watch().part_id, cid, "FAKE-ABC123-CT")
        self._failing(RateLimited("slow down"))
        self.poller().poll_connector(cid)
        self.clock.advance(minutes=14)
        self.assertEqual(self.poller().poll_connector(cid).stopped, "cooling_down")
        self.clock.advance(minutes=2)
        self.provider_behaviour = None
        self.assertEqual(self.poller().poll_connector(cid).stopped, None)

    def test_rejected_credentials_pause_the_connector(self) -> None:
        from app.services.supply.providers.base import AuthError

        cid = self.connector()
        self.add_listing(self.watch().part_id, cid, "FAKE-ABC123-CT")
        self._failing(AuthError("no"))
        self.assertEqual(self.poller().poll_connector(cid).stopped, "auth_failed")
        connector = self.connectors.get(cid)
        self.assertEqual(connector["paused_reason"], "The provider rejected the credentials.")
        self.assertEqual(connector["last_error_code"], "auth_failed")
        self.assertEqual(self.poller().poll_connector(cid).stopped, "inactive")
        actor = self.rows("SELECT actor FROM audit_events WHERE action = 'connector.pause'")[0]["actor"]
        self.assertEqual(actor, "system:poller")

    def test_other_provider_errors_back_the_batch_off_and_stop_the_run(self) -> None:
        from app.services.supply.providers.base import Unavailable

        cid = self.connector("demo_small")
        watch = self.watch()
        for n in range(4):
            self.add_listing(watch.part_id, cid, f"FAKE-P{n}-CT")
        self._failing(Unavailable("down"))
        summary = self.poller().poll_connector(cid)
        self.assertEqual((summary.calls, summary.stopped), (1, "error"), "later batches are not tried")
        failed = [r for r in self.rows("SELECT * FROM poll_state")]
        self.assertEqual(len(failed), 2)
        self.assertTrue(all(r["error_streak"] == 1 and r["last_error_code"] == "unavailable" for r in failed))
        self.assertTrue(all(r["next_poll_at"] >= self.clock.now + timedelta(minutes=5) for r in failed))
        self.assertEqual(self.connectors.get(cid)["last_error_code"], "unavailable")

        self.clock.advance(minutes=6)
        self.provider_behaviour = None
        self.poller().poll_connector(cid)
        states = self.rows("SELECT error_streak, last_error_code FROM poll_state")
        self.assertEqual(len(states), 4, "the batch that was never reached is asked about too")
        self.assertTrue(all(r["error_streak"] == 0 and r["last_error_code"] == "" for r in states), "failures are forgiven")

    def test_failures_back_off_further_each_time(self) -> None:
        from app.services.supply.providers.base import Unavailable

        cid = self.connector()
        self.add_listing(self.watch().part_id, cid, "FAKE-ABC123-CT")
        self._failing(Unavailable("down"))
        waits = []
        for _ in range(3):
            self.poller().poll_connector(cid)
            waits.append(self.state_of("FAKE-ABC123-CT")["next_poll_at"] - self.clock.now)
            self.clock.advance(days=2)
        self.assertEqual(self.state_of("FAKE-ABC123-CT")["error_streak"], 3)
        self.assertGreater(waits[1], waits[0])
        self.assertGreater(waits[2], waits[1])
        self.assertLess(waits[0], timedelta(hours=1), "the first retry is soon, not a day away")

    def test_inactive_connectors_are_skipped(self) -> None:
        cid = self.connector()
        self.add_listing(self.watch().part_id, cid, "FAKE-ABC123-CT")
        self.connectors.update(cid, actor=ACTOR, enabled=False)
        self.assertEqual(self.poller().poll_connector(cid).stopped, "inactive")
        self.connectors.update(cid, actor=ACTOR, enabled=True)
        self.connectors.pause(cid, actor=ACTOR, reason="maintenance")
        self.assertEqual(self.poller().poll_connector(cid).stopped, "inactive")
        self.assertEqual(self.rows("SELECT * FROM offers"), [])

    # --- speed rises with risk -------------------------------------------

    def test_a_threshold_breach_puts_the_listing_on_the_fastest_tier(self) -> None:
        cid = self.connector()
        watch = self.watch(threshold=10_000_000)
        self.add_listing(watch.part_id, cid, "FAKE-ABC123-CT")
        self.poller().poll_connector(cid)
        state = self.state_of("FAKE-ABC123-CT")
        self.assertEqual(state["tier"], "hot")
        self.assertLessEqual(state["next_poll_at"], self.clock.now + timedelta(hours=1, minutes=45))

    def test_a_pin_and_an_obsolete_part_change_the_tier(self) -> None:
        cid = self.connector()
        pinned = self.watch("P1", pinned=True)
        self.add_listing(pinned.part_id, cid, "FAKE-P1-CT")
        eol = self.watch("EOL-1")
        self.add_listing(eol.part_id, cid, "FAKE-EOL-1-CT")
        quiet = self.watch("Q1")
        self.add_listing(quiet.part_id, cid, "FAKE-Q1-CT")
        self.poller().poll_connector(cid)
        self.assertEqual(self.state_of("FAKE-P1-CT")["tier"], "hot")
        self.assertIn(self.state_of("FAKE-EOL-1-CT")["tier"], ("warm", "hot"))
        # Everything just changed for the first time, so even a quiet part starts warm.
        self.assertEqual(self.state_of("FAKE-Q1-CT")["tier"], "warm")
        self.clock.advance(days=2)
        self.poller().poll_connector(cid)
        self.assertEqual(self.state_of("FAKE-Q1-CT")["tier"], "warm", "it moved again, being a sawtooth market")


if __name__ == "__main__":
    unittest.main()

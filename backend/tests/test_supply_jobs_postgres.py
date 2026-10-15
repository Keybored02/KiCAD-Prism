"""Scheduled discovery, the scan that queues supply jobs, the job itself, and the worker hook.

Needs ``PRISM_DATABASE_URL``. Uses a disposable schema and a fake clock.
"""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

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


class RecordingJobs:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    def enqueue(self, kind, payload=None, **kwargs):
        self.calls.append({"kind": kind, "payload": dict(payload or {}), **kwargs})
        return {"id": f"job-{len(self.calls)}"}


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class SupplyJobTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.postgres_database import database
        from app.services.supply import admission, discoverer, jobs, poller, watches
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.providers import registry
        from app.services.supply.providers.base import CredentialField, ProviderConfig, ProviderSpec
        from app.services.supply.providers.fake import FakeProvider
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.discoverer, cls.jobs, cls.poller = database, discoverer, jobs, poller
        cls.admission = admission
        cls.watches, cls.registry = watches, registry
        cls.FakeProvider, cls.ProviderConfig = FakeProvider, ProviderConfig
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_jobs_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        # A provider that can be polled but not searched.
        registry.register(ProviderSpec(
            key="demo_nosearch", label="No search", capabilities=frozenset({"offers"}), max_batch=10,
            stock_pooling="separate", credential_fields=(), factory=lambda config: FakeProvider(config),
            default_daily_budget=100,
        ), replace=True)
        # A provider with credentials and storefronts, so two connectors can share an account.
        registry.register(ProviderSpec(
            key="demo_keyed", label="Keyed", capabilities=frozenset({"search", "offers"}), max_batch=10,
            stock_pooling="separate", credential_fields=(CredentialField("api_key", "API key"),),
            factory=lambda config: FakeProvider(config), storefronts=("uk", "de"), default_daily_budget=100,
        ), replace=True)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.registry.unregister("demo_nosearch")
        cls.registry.unregister("demo_keyed")
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("listings", "watches", "parts", "manufacturer_aliases", "manufacturers", "connectors", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
        self.clock = Clock()
        self.behaviour = None

    # --- helpers ----------------------------------------------------------

    def connector(self, provider: str = "fake", **overrides) -> str:
        values = dict(actor=ACTOR, provider=provider, currency="EUR", interactive_reserve_pct=10)
        values.update(overrides)
        return self.connectors.create(**values)["id"]

    def provider_for(self, connector_id: str):
        inner = self.FakeProvider(self.ProviderConfig(connector_id=connector_id, currency="EUR"), clock=self.clock)
        return self.behaviour(inner) if self.behaviour else inner

    def discoverer_(self):
        return self.discoverer.Discoverer(self.connectors, store=self.store, provider_for=self.provider_for, clock=self.clock)

    def poller_(self):
        return self.poller.Poller(self.connectors, store=self.store, provider_for=self.provider_for, clock=self.clock)

    def watch(self, mpn: str = "ABC123", **kwargs):
        kwargs.setdefault("tier", 1)  # read daily, as a tracked project's parts are
        with self.store.connection() as conn:
            return self.watches.add_watch(conn, "Acme", mpn, ACTOR, **kwargs)[0]

    def rows(self, sql: str, *params):
        with self.store.connection() as conn:
            return conn.execute(sql, params).fetchall()

    def failing(self, error):
        class Failing:
            def __init__(self, inner): self.inner = inner
            def lookup_mpn(self, mpn, manufacturer=None): raise error
            def get_offers(self, skus): raise error
        self.behaviour = Failing

    # --- discovery --------------------------------------------------------

    def test_a_new_watch_gets_its_listings_found_once(self) -> None:
        cid = self.connector()
        self.watch()
        summary = self.discoverer_().run(cid)
        self.assertEqual((summary.searched, summary.listings, summary.stopped), (1, 1, None))
        (listing,) = self.rows("SELECT sku, match_state FROM listings")
        self.assertEqual((listing["sku"], listing["match_state"]), ("FAKE-ABC123-CT", "exact"))
        (run,) = self.rows("SELECT found, last_run_at FROM discovery_runs")
        self.assertEqual((run["found"], run["last_run_at"]), (1, self.clock.now))
        self.assertEqual(self.discoverer_().run(cid).searched, 0, "already searched")

    def test_a_part_the_distributor_carries_is_searched_again_after_a_month(self) -> None:
        cid = self.connector()
        self.watch()
        self.discoverer_().run(cid)
        self.clock.advance(days=8)
        self.assertEqual(self.discoverer_().run(cid).searched, 0, "found parts wait a month, not a week")
        self.clock.advance(days=23)
        self.assertEqual(self.discoverer_().run(cid).searched, 1)

    def test_a_part_not_found_is_searched_again_after_two_weeks(self) -> None:
        cid = self.connector()
        self.watch("NONE-1")
        self.discoverer_().run(cid)
        self.clock.advance(days=8)
        self.assertEqual(self.discoverer_().run(cid).searched, 0, "not within the week")
        self.clock.advance(days=7)
        self.assertEqual(self.discoverer_().run(cid).searched, 1, "a distributor that starts stocking it is noticed")

    def test_a_tier_two_part_not_found_is_searched_again_after_a_month(self) -> None:
        cid = self.connector()
        self.watch("NONE-2", tier=2, rate="weekly")
        self.discoverer_().run(cid)
        self.clock.advance(days=20)
        self.assertEqual(self.discoverer_().run(cid).searched, 0)
        self.clock.advance(days=11)
        self.assertEqual(self.discoverer_().run(cid).searched, 1)

    def test_a_tier_two_part_is_searched_again_every_quarter(self) -> None:
        cid = self.connector()
        self.watch("SLOW", tier=2, rate="weekly")
        self.discoverer_().run(cid)
        self.clock.advance(days=40)
        self.assertEqual(self.discoverer_().run(cid).searched, 0)
        self.clock.advance(days=51)
        self.assertEqual(self.discoverer_().run(cid).searched, 1)

    def test_a_first_search_comes_from_the_pool_and_a_repeat_from_the_committed_share(self) -> None:
        cid = self.connector()
        self.watch()
        self.discoverer_().run(cid)
        self.clock.advance(days=31)
        self.discoverer_().run(cid)
        got = {(r["purpose"], r["kind"]): int(r["n"]) for r in self.rows("SELECT purpose, kind, SUM(calls) AS n FROM call_counts GROUP BY purpose, kind")}
        self.assertEqual(got, {("oneoff", "search"): 1, ("tier1", "search"): 1})

    def test_a_part_the_distributor_does_not_carry_is_not_searched_again_at_once(self) -> None:
        cid = self.connector()
        self.watch("NONE-9")
        summary = self.discoverer_().run(cid)
        self.assertEqual((summary.searched, summary.listings), (1, 0))
        self.assertEqual(self.rows("SELECT found FROM discovery_runs")[0]["found"], 0)
        self.assertEqual(self.discoverer_().run(cid).searched, 0)

    def test_searches_spend_the_budget_and_stop_with_it(self) -> None:
        cid = self.connector(daily_budget=20)  # a pool of 2 calls for first searches
        for n in range(4):
            self.watch(f"P{n}")
        summary = self.discoverer_().run(cid)
        self.assertEqual((summary.searched, summary.stopped), (2, "budget"))
        self.assertEqual(len(self.rows("SELECT * FROM discovery_runs")), 2)
        self.assertEqual(self.rows("SELECT spent FROM quota_ledger")[0]["spent"], 2)

    def test_free_connectors_search_without_spending(self) -> None:
        cid = self.connector("csv")
        self.watch()
        provider = mock.Mock()
        provider.lookup_mpn.return_value = []
        discoverer = self.discoverer.Discoverer(self.connectors, store=self.store, provider_for=lambda _id: provider, clock=self.clock)
        self.assertEqual(discoverer.run(cid).searched, 1)
        self.assertEqual(self.rows("SELECT * FROM quota_ledger"), [])

    def test_the_run_is_limited(self) -> None:
        cid = self.connector()
        for n in range(5):
            self.watch(f"P{n}")
        self.assertEqual(self.discoverer_().run(cid, limit=3).searched, 3)
        self.assertEqual(self.discoverer_().run(cid, limit=3).searched, 2)

    def test_discovery_leaves_alone_connectors_it_cannot_or_should_not_use(self) -> None:
        self.watch()
        nosearch = self.connector("demo_nosearch")
        self.assertEqual(self.discoverer_().run(nosearch).stopped, "unsupported")
        off = self.connector("fake")
        self.connectors.update(off, actor=ACTOR, enabled=False)
        self.assertEqual(self.discoverer_().run(off).stopped, "inactive")
        self.assertEqual(self.rows("SELECT * FROM discovery_runs"), [])

    def test_a_failed_search_is_not_recorded_and_the_connector_rests(self) -> None:
        from app.services.supply.providers.base import Unavailable

        cid = self.connector()
        self.watch()
        self.failing(Unavailable("down"))
        self.assertEqual(self.discoverer_().run(cid).stopped, "error")
        self.assertEqual(self.rows("SELECT * FROM discovery_runs"), [], "a failed search is not a search")
        self.assertEqual(self.discoverer_().run(cid).stopped, "cooling_down")
        self.clock.advance(minutes=8)  # the first rest is 5 minutes plus up to half again
        self.behaviour = None
        self.assertEqual(self.discoverer_().run(cid).searched, 1)

    def test_a_rate_limited_search_waits_as_long_as_the_provider_asks(self) -> None:
        from app.services.supply.providers.base import RateLimited

        cid = self.connector()
        self.watch()
        self.failing(RateLimited("slow", retry_after_seconds=1200))
        self.assertEqual(self.discoverer_().run(cid).stopped, "rate_limited")
        self.clock.advance(minutes=19)
        self.assertEqual(self.discoverer_().run(cid).stopped, "cooling_down")
        self.clock.advance(minutes=2)
        self.behaviour = None
        self.assertEqual(self.discoverer_().run(cid).searched, 1)

    def test_rejected_credentials_during_a_search_pause_the_connector(self) -> None:
        from app.services.supply.providers.base import AuthError

        cid = self.connector()
        self.watch()
        self.failing(AuthError("no"))
        self.assertEqual(self.discoverer_().run(cid).stopped, "auth_failed")
        self.assertTrue(self.connectors.get(cid)["paused_reason"])
        self.assertEqual(self.discoverer_().run(cid).stopped, "inactive")

    def test_a_provider_error_in_a_poll_also_makes_the_connector_rest(self) -> None:
        from app.services.supply.providers.base import Unavailable

        cid = self.connector()
        watch = self.watch()
        self.discoverer_().run(cid)
        self.failing(Unavailable("down"))
        self.assertEqual(self.poller_().poll_connector(cid).stopped, "error")
        self.assertEqual(self.poller_().poll_connector(cid).stopped, "cooling_down")
        self.assertEqual(watch.part_id, self.rows("SELECT part_id FROM watches")[0]["part_id"])

    # --- the scan ---------------------------------------------------------

    def work(self) -> list[str]:
        with self.store.connection() as conn:
            return self.jobs.connectors_with_work(conn, self.clock.now)

    def test_no_watches_means_no_work(self) -> None:
        self.connector()
        self.assertEqual(self.work(), [])

    def test_a_watch_with_no_search_yet_is_work_for_a_searchable_connector_only(self) -> None:
        fake, nosearch = self.connector("fake"), self.connector("demo_nosearch")
        self.watch()
        self.assertEqual(self.work(), [fake])
        self.assertNotIn(nosearch, self.work())

    def test_due_listings_are_work_even_without_search(self) -> None:
        nosearch = self.connector("demo_nosearch")
        watch = self.watch()
        with self.store.connection() as conn:
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) "
                "VALUES ('l1', %s, 'FAKE-ABC123-CT', %s, 'x', 'Acme', 'exact')", (nosearch, watch.part_id))
        self.assertEqual(self.work(), [nosearch])
        self.poller_().poll_connector(nosearch)
        self.assertEqual(self.work(), [], "polled, so not due")
        self.clock.advance(days=2)
        self.assertEqual(self.work(), [nosearch])

    def test_work_ends_when_everything_is_searched_and_polled(self) -> None:
        cid = self.connector()
        self.watch()
        self.assertEqual(self.work(), [cid])
        self.discoverer_().run(cid)
        self.assertEqual(self.work(), [cid], "the new listing is due to be polled")
        self.poller_().poll_connector(cid)
        self.assertEqual(self.work(), [])
        self.clock.advance(days=8)
        self.assertEqual(self.work(), [cid])

    def test_inactive_and_resting_connectors_have_no_work(self) -> None:
        cid = self.connector()
        self.watch()
        self.connectors.pause(cid, actor=ACTOR, reason="maintenance")
        self.assertEqual(self.work(), [])
        self.connectors.resume(cid, actor=ACTOR)
        with self.store.connection() as conn:
            conn.execute("UPDATE connectors SET cooldown_until = %s", (self.clock.now + timedelta(minutes=5),))
        self.assertEqual(self.work(), [])
        self.clock.advance(minutes=6)
        self.assertEqual(self.work(), [cid])
        self.connectors.update(cid, actor=ACTOR, enabled=False)
        self.assertEqual(self.work(), [])

    def test_unproven_and_gone_listings_are_not_work(self) -> None:
        cid = self.connector("demo_nosearch")
        watch = self.watch()
        with self.store.connection() as conn:
            for n, state in enumerate(("near", "gone", "rejected", "manufacturer_unresolved")):
                conn.execute(
                    "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) "
                    "VALUES (%s, %s, %s, %s, 'x', 'Acme', %s)", (f"l{n}", cid, f"S{n}", watch.part_id, state))
        self.assertEqual(self.work(), [])

    def test_the_scan_queues_one_job_per_connector_with_the_right_shape(self) -> None:
        first, second = self.connector("fake"), self.connector("demo_nosearch")
        self.watch()
        queue = RecordingJobs()
        with mock.patch.object(self.jobs, "SUPPLY_RESOURCE_CAPACITY", 2):
            queued = self.jobs.schedule_due_supply_jobs(job_service=queue, store=self.store, now=self.clock.now)
        self.assertEqual(len(queued), 1, "only the searchable connector has work")
        (call,) = queue.calls
        self.assertEqual(call["kind"], "supply_poll")
        self.assertEqual(call["payload"], {"connector_id": first})
        self.assertEqual(call["artifact_key"], f"supply-poll:{first}")
        self.assertEqual(call["resources"], {"supply": 1})
        self.assertEqual((call["worker_pool"], call["requested_by"], call["max_attempts"]), ("prism", "system:supply-scheduler", 2))
        self.assertNotEqual(first, second)

    def test_connectors_on_one_account_share_one_job(self) -> None:
        def keyed(storefront: str, key: str) -> str:
            return self.connectors.create(
                actor=ACTOR, provider="demo_keyed", storefront=storefront, credentials={"api_key": key}, interactive_reserve_pct=0
            )["id"]

        uk, de = keyed("uk", "K1"), keyed("de", "K1")
        self.watch()
        queue = RecordingJobs()
        self.jobs.schedule_due_supply_jobs(job_service=queue, store=self.store, now=self.clock.now)
        (call,) = queue.calls
        self.assertEqual(sorted(call["payload"]["connector_ids"]), sorted([uk, de]))
        self.assertEqual(call["artifact_key"], f"supply-poll:{uk}", "keyed by the account's first connector, not by each connector")

    def test_parts_waiting_for_room_are_work_for_spare_budget_only(self) -> None:
        cid = self.connectors.create(
            actor=ACTOR, provider="demo_keyed", storefront="uk", credentials={"api_key": "K9"}, daily_budget=4, interactive_reserve_pct=50
        )["id"]  # a committed share of 2 calls holds 15 tier-1 parts, and a pool of 2 leaves 1 spare after its floor
        for n in range(16):
            part = self.watch(f"W{n:02d}")
            with self.store.connection() as conn:
                conn.execute("INSERT INTO discovery_runs (part_id, connector_id, last_run_at, found) VALUES (%s, %s, %s, 1)",
                             (part.part_id, cid, self.clock.now))
                conn.execute(
                    "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) "
                    "VALUES (%s, %s, %s, %s, 'x', 'Acme', 'exact')", (f"w{n}", cid, f"SKU-W{n}", part.part_id))
                conn.execute("INSERT INTO poll_state (listing_id, tier, next_poll_at) VALUES (%s, 'daily', %s)",
                             (f"w{n}", self.clock.now + timedelta(days=3)))
            with self.store.connection() as conn:
                self.admission.sync(conn)
        self.assertEqual(self.rows("SELECT COUNT(*) AS n FROM admissions WHERE state = 'waiting'")[0]["n"], 1)
        self.assertEqual(self.clock.now.weekday(), 6, "a Sunday: no working hours")
        self.assertEqual(self.work(), [cid], "spare budget is open, and a part waits for room")
        self.clock.advance(days=1, hours=-1)  # Monday 11:00, working hours: nothing is spare
        self.assertEqual(self.work(), [])

    def test_a_provider_that_reads_an_unpublished_address_does_nothing_until_its_terms_are_read(self) -> None:
        cid = self.connectors.create(actor=ACTOR, provider="jlcpcb")["id"]
        self.assertTrue(self.connectors.get(cid)["awaiting_terms"])
        self.watch()
        self.assertEqual(self.work(), [])
        self.assertEqual(self.discoverer_().run(cid).stopped, "inactive")
        self.assertEqual(self.poller_().poll_connector(cid).stopped, "inactive")
        self.connectors.confirm_terms_review(cid, actor=ACTOR)
        self.assertFalse(self.connectors.get(cid)["awaiting_terms"])
        self.assertEqual(self.work(), [], "an assembly-only distributor is read only for a project that names it")

    def test_the_scan_queues_nothing_when_there_is_nothing_to_do(self) -> None:
        self.connector()
        queue = RecordingJobs()
        self.assertEqual(self.jobs.schedule_due_supply_jobs(job_service=queue, store=self.store, now=self.clock.now), [])
        self.assertEqual(queue.calls, [])

    # --- the job ----------------------------------------------------------

    def test_the_job_searches_then_polls(self) -> None:
        cid = self.connector()
        self.watch()
        progress = []
        context = SimpleNamespace(payload={"connector_id": cid}, progress=lambda **kwargs: progress.append(kwargs["stage"]))
        with (
            mock.patch.object(self.jobs, "ConnectorService", lambda: self.connectors),
            mock.patch.object(self.jobs, "Discoverer", lambda connectors: self.discoverer_()),
            mock.patch.object(self.jobs, "Poller", lambda connectors: self.poller_()),
        ):
            result = self.jobs.run_supply_poll_job(context)
        self.assertEqual(result.details["searched"], 1)
        self.assertEqual((result.details["calls"], result.details["polled"]), (1, 1))
        self.assertEqual(progress, ["supply-discover", "supply-poll"])
        self.assertEqual(len(self.rows("SELECT * FROM offers")), 1)
        self.assertIn("polled 1 listing", result.message)

    # --- the worker -------------------------------------------------------

    def test_the_worker_has_a_supply_slot_and_a_registered_handler(self) -> None:
        from app import prism_worker
        from app.services.job_handlers import get_job_handler, load_builtin_job_handlers

        load_builtin_job_handlers()
        self.assertIs(get_job_handler("supply_poll"), self.jobs.run_supply_poll_job)
        capacities = prism_worker.PrismWorker.resource_capacities()
        self.assertEqual(capacities[self.jobs.SUPPLY_RESOURCE], self.jobs.SUPPLY_RESOURCE_CAPACITY)
        if capacities["prism_worker"] > 1:
            self.assertLess(self.jobs.SUPPLY_RESOURCE_CAPACITY, capacities["prism_worker"])

    def test_only_the_prism_pool_scans_and_not_more_than_once_a_minute(self) -> None:
        from app import prism_worker

        prism, catalog = prism_worker.PrismWorker("prism"), prism_worker.PrismWorker("catalog")
        with mock.patch("app.services.supply.jobs.schedule_due_supply_jobs") as scan:
            prism.schedule_supply_jobs()
            prism.schedule_supply_jobs()
            catalog.schedule_supply_jobs()
        scan.assert_called_once()

    def test_a_failing_scan_is_not_retried_on_every_pass(self) -> None:
        from app import prism_worker

        worker = prism_worker.PrismWorker("prism")
        with mock.patch("app.services.supply.jobs.schedule_due_supply_jobs", side_effect=RuntimeError("db down")) as scan:
            with self.assertRaises(RuntimeError):
                worker.schedule_supply_jobs()
            worker.schedule_supply_jobs()
        scan.assert_called_once()


if __name__ == "__main__":
    unittest.main()

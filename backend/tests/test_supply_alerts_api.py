"""Alerts and the overview: when they open, when they clear, who may act, what the overview counts.

Needs ``PRISM_DATABASE_URL``. Offers are written directly so each condition is exact;
one test runs the real poller to check the hook.
"""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from supply_api_helpers import request as _request  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
SEED_ACTOR = "seed@example.com"
START = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply API tests")
class SupplyAlertsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_alerts, supply_connectors, supply_parts
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply import alerts, discoverer, overview, poller
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.providers.base import ProviderConfig
        from app.services.supply.providers.fake import FakeProvider
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.alerts, cls.overview = database, alerts, overview
        cls.discoverer, cls.poller = discoverer, poller
        cls.FakeProvider, cls.ProviderConfig = FakeProvider, ProviderConfig
        cls.users = {
            role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role)
            for role in ("viewer", "qa", "designer", "admin")
        }
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_alerts_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_parts.router)
        cls.app.include_router(supply_alerts.router)
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
            for table in ("alerts", "listings", "watches", "parts", "manufacturer_aliases", "manufacturers", "connectors", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
        self.now = START
        self.cid = self.connectors.create(
            actor=SEED_ACTOR, provider="fake", currency="EUR", display_name="Sim", interactive_reserve_pct=10)["id"]

    # --- helpers ----------------------------------------------------------

    def call(self, method: str, path: str, *, role: str = "admin", body=None, query: str = ""):
        return _request(self.app, method, path, user=self.users[role], body=body, query=query)

    def watch(self, mpn: str = "ABC123", **extra) -> dict:
        response = self.call("POST", "/api/supply/watches", body={"manufacturer": "Acme", "mpn": mpn, **extra})
        self.assertIn(response.status, (200, 201), response.text)
        return response.json

    def listing(self, part_id: str, sku: str, *, stock: int, lifecycle: str = "active", state: str = "exact") -> str:
        listing_id = uuid.uuid4().hex
        with self.store.connection() as conn:
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) "
                "VALUES (%s, %s, %s, %s, 'x', 'Acme', %s)", (listing_id, self.cid, sku, part_id, state))
            conn.execute(
                "INSERT INTO offers (listing_id, fetched_at, stock, lifecycle) VALUES (%s, %s, %s, %s)",
                (listing_id, self.now, stock, lifecycle))
        return listing_id

    def set_offer(self, listing_id: str, *, stock: int | None = None, lifecycle: str | None = None, discontinued: bool | None = None) -> None:
        with self.store.connection() as conn:
            if discontinued is not None:
                conn.execute("UPDATE offers SET discontinued = %s WHERE listing_id = %s", (discontinued, listing_id))
            if stock is not None:
                conn.execute("UPDATE offers SET stock = %s WHERE listing_id = %s", (stock, listing_id))
            if lifecycle is not None:
                conn.execute("UPDATE offers SET lifecycle = %s WHERE listing_id = %s", (lifecycle, listing_id))

    def evaluate(self, *part_ids: str, after: timedelta = timedelta(0)) -> None:
        self.now = START + after
        with self.store.connection() as conn:
            self.alerts.evaluate_parts(conn, part_ids, self.now)

    def listed(self, **query) -> list[dict]:
        text = "&".join(f"{k}={v}" for k, v in query.items())
        return self.call("GET", "/api/supply/alerts", query=text).json["items"]

    def rows(self, sql: str, *params):
        with self.store.connection() as conn:
            return conn.execute(sql, params).fetchall()

    # --- opening and clearing -----------------------------------------------

    def test_a_threshold_breach_opens_only_after_a_second_look_half_an_hour_later(self) -> None:
        watch = self.watch(threshold=100)
        self.listing(watch["part_id"], "A", stock=40)
        self.evaluate(watch["part_id"])
        self.assertEqual(self.listed(), [], "one reading raises nothing")
        self.evaluate(watch["part_id"], after=timedelta(minutes=10))
        self.assertEqual(self.listed(), [], "a second look too soon is still the same moment")
        self.evaluate(watch["part_id"], after=timedelta(minutes=45))
        (alert,) = self.listed()
        self.assertEqual((alert["kind"], alert["severity"], alert["state"], alert["mpn"]), ("below_threshold", "warning", "open", "ABC123"))
        self.assertEqual(alert["detail"], {"stock": 40, "threshold": 100})

    def test_a_blip_that_clears_before_it_opens_leaves_nothing_behind(self) -> None:
        watch = self.watch(threshold=100)
        listing = self.listing(watch["part_id"], "A", stock=40)
        self.evaluate(watch["part_id"])
        self.set_offer(listing, stock=900)
        self.evaluate(watch["part_id"], after=timedelta(hours=2))
        self.assertEqual(self.rows("SELECT 1 FROM alerts"), [])

    def test_a_condition_that_clears_resolves_its_alert(self) -> None:
        watch = self.watch(threshold=100)
        listing = self.listing(watch["part_id"], "A", stock=40)
        self.evaluate(watch["part_id"])
        self.evaluate(watch["part_id"], after=timedelta(hours=1))
        self.assertEqual(len(self.listed()), 1)
        self.set_offer(listing, stock=900)
        self.evaluate(watch["part_id"], after=timedelta(hours=3))
        self.assertEqual(self.listed(), [])
        (resolved,) = self.listed(include_resolved="true")
        self.assertEqual(resolved["state"], "resolved")
        self.assertIsNotNone(resolved["resolved_at"])

    def test_out_of_stock_is_an_error_and_does_not_also_count_as_below_threshold(self) -> None:
        watch = self.watch(threshold=100)
        self.listing(watch["part_id"], "A", stock=0)
        self.evaluate(watch["part_id"])
        self.evaluate(watch["part_id"], after=timedelta(hours=1))
        (alert,) = self.listed()
        self.assertEqual((alert["kind"], alert["severity"]), ("out_of_stock", "error"))

    def test_lifecycle_severity_follows_the_value_and_a_worse_one_wakes_a_quiet_alert(self) -> None:
        watch = self.watch()
        listing = self.listing(watch["part_id"], "A", stock=5000, lifecycle="nrnd")
        self.evaluate(watch["part_id"])
        self.evaluate(watch["part_id"], after=timedelta(hours=1))
        (alert,) = self.listed()
        self.assertEqual((alert["kind"], alert["severity"]), ("lifecycle", "warning"))
        self.assertEqual(self.call("POST", f"/api/supply/alerts/{alert['id']}/acknowledge").status, 204)
        self.assertEqual(self.listed()[0]["state"], "acknowledged")
        self.evaluate(watch["part_id"], after=timedelta(hours=2))
        self.assertEqual(self.listed()[0]["state"], "acknowledged", "the same condition stays acknowledged")
        self.set_offer(listing, lifecycle="obsolete")
        self.evaluate(watch["part_id"], after=timedelta(hours=3))
        (woken,) = self.listed()
        self.assertEqual((woken["severity"], woken["state"], woken["acknowledged_by"]), ("fatal", "open", ""))

    def test_a_part_every_distributor_dropped_raises_a_lifecycle_alert_but_one_dropping_it_does_not(self) -> None:
        watch = self.watch()
        first = self.listing(watch["part_id"], "A", stock=5000)
        second = self.listing(watch["part_id"], "B", stock=5000)
        self.set_offer(first, discontinued=True)
        self.evaluate(watch["part_id"])
        self.evaluate(watch["part_id"], after=timedelta(hours=1))
        self.assertEqual(self.listed(), [], "another distributor still sells it")
        self.set_offer(second, discontinued=True)
        self.evaluate(watch["part_id"], after=timedelta(hours=2))
        self.evaluate(watch["part_id"], after=timedelta(hours=3))
        (alert,) = self.listed()
        self.assertEqual((alert["kind"], alert["severity"], alert["detail"]["dropped"]), ("lifecycle", "warning", True))

    def test_a_part_that_is_lost_opens_at_once(self) -> None:
        watch = self.watch()
        self.listing(watch["part_id"], "A", stock=10, state="gone")
        self.evaluate(watch["part_id"])
        (alert,) = self.listed()
        self.assertEqual((alert["kind"], alert["state"], alert["detail"]), ("part_lost", "open", {"problem": "gone"}))

    def test_unwatched_parts_raise_nothing_and_unwatching_clears_what_was_raised(self) -> None:
        watch = self.watch(threshold=100)
        self.listing(watch["part_id"], "A", stock=0)
        self.evaluate(watch["part_id"])
        self.evaluate(watch["part_id"], after=timedelta(hours=1))
        self.assertEqual(len(self.listed()), 1)
        self.assertEqual(self.call("DELETE", f"/api/supply/watches/{watch['id']}").status, 204)
        self.assertEqual(self.listed(), [])
        self.evaluate(watch["part_id"], after=timedelta(hours=2))
        self.assertEqual(self.listed(), [], "no watch, no alert")

    def test_changing_the_threshold_re_evaluates(self) -> None:
        watch = self.watch(threshold=10)
        self.listing(watch["part_id"], "A", stock=40)
        self.evaluate(watch["part_id"])
        self.assertEqual(self.rows("SELECT 1 FROM alerts"), [])
        self.assertEqual(self.call("PATCH", f"/api/supply/watches/{watch['id']}", body={"threshold": 100}).status, 200)
        (pending,) = self.rows("SELECT state, kind FROM alerts")
        self.assertEqual((pending["state"], pending["kind"]), ("pending", "below_threshold"), "seen once; it opens on the next look")

    def test_the_poller_looks_after_every_read(self) -> None:
        from datetime import timedelta as td

        watch = self.watch("OOS-1")
        clock_now = {"t": START}
        clock = lambda: clock_now["t"]  # noqa: E731
        provider = lambda cid: self.FakeProvider(self.ProviderConfig(connector_id=cid, currency="EUR"), clock=clock)  # noqa: E731
        self.discoverer.Discoverer(self.connectors, store=self.store, provider_for=provider, clock=clock).run(self.cid)
        poller = self.poller.Poller(self.connectors, store=self.store, provider_for=provider, clock=clock)
        poller.poll_connector(self.cid)
        self.assertEqual(self.listed(), [], "first reading")
        clock_now["t"] = START + td(days=11)  # a part watched without a tier is read weekly, on its day slot: 4 to 10 days later
        poller.poll_connector(self.cid)
        (alert,) = self.listed()
        self.assertEqual((alert["part_id"], alert["kind"]), (watch["part_id"], "out_of_stock"))

    def falling_part(self, mpn: str = "DRAIN", *, days: int = 35, start: int = 2000, step: int = 50, **watch_extra):
        """A watched part whose stock fell ``step`` a day for ``days`` days, ending at the offer's figure."""

        watch = self.watch(mpn, **watch_extra)
        listing = self.listing(watch["part_id"], "A", stock=start - step * (days - 1))
        with self.store.connection() as conn:
            for index in range(days):
                conn.execute(
                    "INSERT INTO samples (listing_id, sampled_at, stock) VALUES (%s, %s, %s)",
                    (listing, START - timedelta(days=days - index), start - step * index),
                )
        return watch

    def test_a_steady_drawdown_inside_the_horizon_raises_a_warning_after_two_looks(self) -> None:
        watch = self.falling_part()
        self.evaluate(watch["part_id"])
        self.assertEqual(self.listed(), [])
        self.evaluate(watch["part_id"], after=timedelta(hours=1))
        (alert,) = self.listed()
        self.assertEqual((alert["kind"], alert["severity"]), ("rupture_soon", "warning"))
        self.assertEqual(alert["detail"]["confidence"], "high")
        self.assertEqual(alert["detail"]["decrease_per_day"], 50.0)
        self.assertEqual(alert["detail"]["days_to_zero"], 6)

    def priced_part(self, mpn: str, first: str, last: str, *, days: int = 20):
        watch = self.watch(mpn)
        listing = self.listing(watch["part_id"], mpn, stock=500)
        with self.store.connection() as conn:
            for index in range(days):
                price = Decimal(first) + (Decimal(last) - Decimal(first)) * index / (days - 1)
                conn.execute(
                    "INSERT INTO samples (listing_id, sampled_at, stock, unit_price, currency) VALUES (%s, %s, 500, %s, 'EUR')",
                    (listing, START - timedelta(days=days - index), price),
                )
        return watch

    def test_a_rising_price_raises_a_warning_and_a_steady_one_does_not(self) -> None:
        rising = self.priced_part("PRICEY", "1.00", "1.30")
        steady = self.priced_part("STEADY", "1.00", "1.05")
        for later in (timedelta(0), timedelta(hours=1)):
            self.evaluate(rising["part_id"], after=later)
            self.evaluate(steady["part_id"], after=later)
        (alert,) = self.listed()
        self.assertEqual((alert["part_id"], alert["kind"], alert["severity"]), (rising["part_id"], "price_up", "warning"))
        self.assertEqual((alert["detail"]["was"], alert["detail"]["now"], alert["detail"]["currency"]), ("1", "1.3", "EUR"))
        self.assertEqual(alert["detail"]["change_percent"], 30.0)

    def test_a_threshold_already_crossed_is_the_alert_not_also_a_projection(self) -> None:
        watch = self.falling_part(threshold=1000)
        for later in (timedelta(0), timedelta(hours=1)):
            self.evaluate(watch["part_id"], after=later)
        self.assertEqual([a["kind"] for a in self.listed()], ["below_threshold"])

    def test_a_slow_drawdown_far_from_zero_raises_nothing(self) -> None:
        watch = self.falling_part("SLOW", start=100_000, step=10)
        for later in (timedelta(0), timedelta(hours=1)):
            self.evaluate(watch["part_id"], after=later)
        self.assertEqual(self.listed(), [])

    def test_a_projection_clears_when_the_part_is_restocked(self) -> None:
        watch = self.falling_part()
        for later in (timedelta(0), timedelta(hours=1)):
            self.evaluate(watch["part_id"], after=later)
        self.assertEqual(len(self.listed()), 1)
        with self.store.connection() as conn:
            listing = conn.execute("SELECT id FROM listings").fetchone()["id"]
            conn.execute("UPDATE offers SET stock = 5000")
            conn.execute("INSERT INTO samples (listing_id, sampled_at, stock) VALUES (%s, %s, 5000)", (listing, START))
        self.evaluate(watch["part_id"], after=timedelta(hours=3))
        self.assertEqual(self.listed(), [])

    # --- acting on alerts ----------------------------------------------------

    def open_alert(self) -> dict:
        watch = self.watch()
        self.listing(watch["part_id"], "A", stock=0)
        self.evaluate(watch["part_id"])
        self.evaluate(watch["part_id"], after=timedelta(hours=1))
        return self.listed()[0]

    def priced(self, listing_id: str, price: str) -> None:
        with self.store.connection() as conn:
            conn.execute("UPDATE offers SET currency = 'EUR', price_breaks = %s::jsonb WHERE listing_id = %s", (f'[[1, "{price}"]]', listing_id))

    def open_after_two_looks(self, part_id: str) -> list[dict]:
        self.evaluate(part_id)
        self.evaluate(part_id, after=timedelta(hours=1))
        return self.listed()

    def test_a_muted_alert_is_never_raised_and_a_bigger_price_rise_is_asked_for(self) -> None:
        watch = self.watch(threshold=100)
        self.listing(watch["part_id"], "A", stock=40)
        path = f"/api/supply/parts/{watch['part_id']}/alert-rules"
        saved = self.call("PUT", path, body={"muted": ["below_threshold"]})
        self.assertEqual((saved.status, saved.json["muted"]), (200, ["below_threshold"]), saved.text)
        self.assertEqual(self.open_after_two_looks(watch["part_id"]), [])
        self.assertEqual(self.call("GET", path).json["muted"], ["below_threshold"])
        self.assertEqual(self.call("PUT", path, body={"muted": ["part_lost"]}).status, 400, "a lost part is a fact, not an opinion")
        self.assertEqual(self.call("PUT", path, body={"muted": [], "price_rise_percent": 0}).status, 400)
        self.assertEqual(self.call("PUT", path, body={"muted": [], "target_price": "1.5"}).status, 400, "a price needs its currency")
        self.assertEqual(self.call("PUT", path, body={}, role="qa").status, 403)

    def test_a_price_over_the_target_is_an_alert_until_it_comes_down(self) -> None:
        watch = self.watch()
        listing = self.listing(watch["part_id"], "A", stock=500)
        self.priced(listing, "0.80")
        self.call("PUT", f"/api/supply/parts/{watch['part_id']}/alert-rules", body={"target_price": "0.50", "target_currency": "eur"})
        with self.store.connection() as conn:
            conn.execute("DELETE FROM alerts")  # saving the rules looked once, at the real time; the test keeps its own clock
        (alert,) = self.open_after_two_looks(watch["part_id"])
        self.assertEqual((alert["kind"], alert["detail"]["target"], alert["detail"]["price"]), ("target_price_missed", "0.5", "0.8"))
        self.priced(listing, "0.45")
        self.evaluate(watch["part_id"], after=timedelta(hours=3))
        self.assertEqual(self.listed(), [])

    def test_a_part_whose_assessment_gets_worse_raises_an_alert_that_accepting_it_quiets(self) -> None:
        watch = self.watch()
        listing = self.listing(watch["part_id"], "A", stock=500)
        self.assertEqual(self.open_after_two_looks(watch["part_id"]), [], "the first assessment is only noted")
        with self.store.connection() as conn:
            conn.execute("UPDATE offers SET fetched_at = %s WHERE listing_id = %s", (START - timedelta(days=5), listing))
        self.evaluate(watch["part_id"], after=timedelta(hours=2))
        self.evaluate(watch["part_id"], after=timedelta(hours=3))
        worse = [item for item in self.listed() if item["kind"] == "assessment_worse"]
        self.assertEqual(len(worse), 1)
        self.assertEqual((worse[0]["detail"]["was"], worse[0]["detail"]["now"]), ("ok", "warning"))
        self.assertEqual(self.call("POST", f"/api/supply/alerts/{worse[0]['id']}/acknowledge").status, 204)
        self.evaluate(watch["part_id"], after=timedelta(hours=4))
        self.assertEqual([item["state"] for item in self.listed() if item["kind"] == "assessment_worse"], [], "accepted: judged from here on, so it clears")

    def test_a_worse_assessment_is_not_raised_when_an_alert_already_says_as_much(self) -> None:
        watch = self.watch()
        listing = self.listing(watch["part_id"], "A", stock=500)
        self.open_after_two_looks(watch["part_id"])
        self.set_offer(listing, lifecycle="obsolete")
        self.evaluate(watch["part_id"], after=timedelta(hours=2))
        self.evaluate(watch["part_id"], after=timedelta(hours=3))
        self.assertEqual(sorted(item["kind"] for item in self.listed()), ["lifecycle"])

    def test_snoozing_hides_quietly_and_wakes_when_the_time_is_up(self) -> None:
        alert = self.open_alert()
        self.assertEqual(self.call("POST", f"/api/supply/alerts/{alert['id']}/snooze", body={"hours": 4}).status, 204)
        (snoozed,) = self.listed()
        self.assertEqual(snoozed["state"], "snoozed")
        self.assertIsNotNone(snoozed["snoozed_until"])
        with self.store.connection() as conn:
            conn.execute("UPDATE alerts SET snoozed_until = NOW() - INTERVAL '1 minute' WHERE id = %s", (alert["id"],))
        self.assertEqual(self.listed()[0]["state"], "open", "an expired snooze reads as open without waiting for a poll")

    def test_actions_are_audited_and_checked(self) -> None:
        alert = self.open_alert()
        for bad in (0, 721, "x"):
            self.assertEqual(self.call("POST", f"/api/supply/alerts/{alert['id']}/snooze", body={"hours": bad}).status, 422, bad)
        self.assertEqual(self.call("POST", f"/api/supply/alerts/{alert['id']}/acknowledge", role="designer").status, 204)
        self.assertEqual(self.call("POST", f"/api/supply/alerts/{alert['id']}/acknowledge").status, 409, "already acknowledged")
        self.assertEqual(self.call("POST", "/api/supply/alerts/999999/acknowledge").status, 404)
        (event,) = self.rows("SELECT actor, action FROM audit_events WHERE subject_kind = 'alert'")
        self.assertEqual((event["actor"], event["action"]), ("designer@example.com", "alert.acknowledge"))

    def test_a_cleared_alert_cannot_be_acted_on(self) -> None:
        alert = self.open_alert()
        with self.store.connection() as conn:
            conn.execute("UPDATE offers SET stock = 900")
        part_id = alert["part_id"]
        self.evaluate(part_id, after=timedelta(hours=5))
        self.assertEqual(self.call("POST", f"/api/supply/alerts/{alert['id']}/snooze", body={"hours": 2}).status, 409)

    def test_roles(self) -> None:
        alert = self.open_alert()
        for role in ("admin", "designer", "qa"):
            self.assertEqual(self.call("GET", "/api/supply/alerts", role=role).status, 200, role)
            self.assertEqual(self.call("GET", "/api/supply/overview", role=role).status, 200, role)
        self.assertEqual(self.call("GET", "/api/supply/alerts", role="viewer").status, 403)
        self.assertEqual(self.call("GET", "/api/supply/overview", role="viewer").status, 403)
        for role in ("qa", "viewer"):
            self.assertEqual(self.call("POST", f"/api/supply/alerts/{alert['id']}/acknowledge", role=role).status, 403, role)
            self.assertEqual(self.call("POST", f"/api/supply/alerts/{alert['id']}/snooze", role=role, body={"hours": 1}).status, 403, role)

    def test_the_worst_alerts_come_first(self) -> None:
        low = self.watch("LOW", threshold=100)
        lost = self.watch("LOST")
        self.listing(low["part_id"], "L", stock=5)
        self.listing(lost["part_id"], "G", stock=1, state="gone")
        for later in (timedelta(0), timedelta(hours=1)):
            self.evaluate(low["part_id"], lost["part_id"], after=later)
        self.assertEqual([a["kind"] for a in self.listed()], ["part_lost", "below_threshold"])

    # --- the overview --------------------------------------------------------

    def test_the_overview_counts_what_the_parts_list_shows(self) -> None:
        fine = self.watch("FINE")
        empty = self.watch("EMPTY")
        eol = self.watch("EOL")
        self.watch("UNREAD")
        self.listing(fine["part_id"], "F", stock=5000)
        self.listing(empty["part_id"], "E", stock=0)
        self.listing(eol["part_id"], "O", stock=300, lifecycle="obsolete")
        for pid in (empty["part_id"], eol["part_id"]):
            self.evaluate(pid)
            self.evaluate(pid, after=timedelta(hours=1))
        data = self.call("GET", "/api/supply/overview").json
        self.assertEqual(data["figures"], {"watched": 4, "at_risk": 2, "out_of_stock": 1, "lifecycle": 1, "no_data": 1, "lifecycle_active": 2, "lifecycle_nrnd": 0, "lifecycle_last_time_buy": 0, "lifecycle_obsolete": 1, "lifecycle_unknown": 1})
        self.assertEqual(data["open_alerts"], 2)
        self.assertEqual(data["connectors"], 1)
        self.assertIsNotNone(data["data_age"]["oldest"])

    def test_recent_changes_list_alerts_that_opened_or_cleared_and_listings_that_went(self) -> None:
        empty = self.watch("EMPTY")
        stock_id = self.listing(empty["part_id"], "E", stock=0)
        self.evaluate(empty["part_id"])
        self.evaluate(empty["part_id"], after=timedelta(hours=1))
        with self.store.connection() as conn:
            conn.execute("UPDATE offers SET stock = 50 WHERE listing_id = %s", (stock_id,))
            conn.execute("INSERT INTO events (at, kind, part_id, listing_id, payload) VALUES (%s, 'listing_gone', %s, %s, '{\"sku\": \"E\"}'::jsonb)",
                         (START + timedelta(hours=3), empty["part_id"], stock_id))
        self.evaluate(empty["part_id"], after=timedelta(hours=4))
        self.evaluate(empty["part_id"], after=timedelta(hours=5))
        with self.store.connection() as conn:
            changes = self.alerts.recent_changes(conn, START + timedelta(hours=6))
            self.assertEqual(self.alerts.recent_changes(conn, START + timedelta(days=60)), [], "old changes drop off")
        self.assertEqual([(c["type"], c["mpn"]) for c in changes], [("alert_cleared", "EMPTY"), ("listing_gone", "EMPTY"), ("alert_opened", "EMPTY")])
        self.assertEqual(changes[0]["alert"]["kind"], "out_of_stock")
        self.assertEqual(changes[1]["sku"], "E")

    def test_an_empty_overview(self) -> None:
        with self.store.connection() as conn:
            conn.execute("DELETE FROM connectors")
        data = self.call("GET", "/api/supply/overview").json
        self.assertEqual(data["figures"], {"watched": 0, "at_risk": 0, "out_of_stock": 0, "lifecycle": 0, "no_data": 0, "lifecycle_active": 0, "lifecycle_nrnd": 0, "lifecycle_last_time_buy": 0, "lifecycle_obsolete": 0, "lifecycle_unknown": 0})
        self.assertEqual((data["connectors"], data["data_age"]), (0, {"oldest": None, "newest": None}))

    def test_acknowledged_alerts_do_not_count_as_open(self) -> None:
        alert = self.open_alert()
        self.assertEqual(self.call("GET", "/api/supply/overview").json["open_alerts"], 1)
        self.call("POST", f"/api/supply/alerts/{alert['id']}/acknowledge")
        self.assertEqual(self.call("GET", "/api/supply/overview").json["open_alerts"], 0)


if __name__ == "__main__":
    unittest.main()

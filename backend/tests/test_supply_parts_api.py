"""The parts and watches API: roles, watch rules, the parts list, and the part detail.

Needs ``PRISM_DATABASE_URL``. Requests go through the real router into a
disposable schema. Stock and prices come from the simulated market on a fake clock.
"""

from __future__ import annotations

import json
import os
import sys
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from supply_api_helpers import request as _request  # noqa: E402

from app.services.supply import pricing  # noqa: E402
from app.services.supply.part_status import part_status, worst_lifecycle  # noqa: E402
from app.services.supply.vocabulary import Lifecycle, Status  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
SEED_ACTOR = "seed@example.com"
START = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


class PartStatusTests(unittest.TestCase):
    def test_status_from_stock_threshold_and_lifecycle(self) -> None:
        active = Lifecycle.ACTIVE
        self.assertEqual(part_status(None, None, active), Status.UNKNOWN)
        self.assertEqual(part_status(5000, None, active), Status.OK)
        self.assertEqual(part_status(0, None, active), Status.ERROR)
        self.assertEqual(part_status(100, 100, active), Status.WARNING)
        self.assertEqual(part_status(101, 100, active), Status.OK)
        self.assertEqual(part_status(5000, None, Lifecycle.NRND), Status.WARNING)
        self.assertEqual(part_status(5000, None, Lifecycle.LAST_TIME_BUY), Status.WARNING)
        self.assertEqual(part_status(5000, None, Lifecycle.OBSOLETE), Status.FATAL)
        self.assertEqual(part_status(0, None, Lifecycle.OBSOLETE), Status.FATAL, "obsolete outranks empty")

    def test_the_worst_lifecycle_is_shown(self) -> None:
        self.assertEqual(worst_lifecycle([Lifecycle.ACTIVE, Lifecycle.NRND]), Lifecycle.NRND)
        self.assertEqual(worst_lifecycle([Lifecycle.ACTIVE, Lifecycle.OBSOLETE, Lifecycle.NRND]), Lifecycle.OBSOLETE)
        self.assertEqual(worst_lifecycle([Lifecycle.UNKNOWN, Lifecycle.ACTIVE]), Lifecycle.ACTIVE)
        self.assertEqual(worst_lifecycle([]), Lifecycle.UNKNOWN)


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply API tests")
class SupplyPartsApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_parts
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply import discoverer, parts, poller, watches
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.providers.base import ProviderConfig
        from app.services.supply.providers.fake import FakeProvider
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.parts, cls.watches = database, parts, watches
        cls.discoverer, cls.poller = discoverer, poller
        cls.FakeProvider, cls.ProviderConfig = FakeProvider, ProviderConfig
        cls.AuthenticatedUser = AuthenticatedUser
        cls.users = {
            role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role)
            for role in ("viewer", "qa", "designer", "admin")
        }
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_parts_api_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_parts.router)
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
            for table in ("listings", "watches", "parts", "manufacturer_aliases", "manufacturers", "connectors", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
        self.now = START

    # --- helpers ----------------------------------------------------------

    def call(self, method: str, path: str, *, role: str = "admin", body=None, user=None, query: str = ""):
        return _request(self.app, method, path, user=user or self.users[role], body=body, query=query)

    def watch_via_api(self, mpn: str = "ABC123", *, status: int = 201, **extra) -> dict:
        response = self.call("POST", "/api/supply/watches", body={"manufacturer": "Acme", "mpn": mpn, **extra})
        self.assertEqual(response.status, status, response.text)
        return response.json

    def fake_connector(self, **overrides) -> str:
        values = dict(actor=SEED_ACTOR, provider="fake", currency="EUR", display_name="Sim", interactive_reserve_pct=10)
        values.update(overrides)
        return self.connectors.create(**values)["id"]

    def provider(self, connector_id: str):
        return self.FakeProvider(self.ProviderConfig(connector_id=connector_id, currency="EUR"), clock=lambda: self.now)

    def collect(self, connector_id: str) -> None:
        """Search for listings and read them, as the worker job would."""

        clock = lambda: self.now  # noqa: E731
        self.discoverer.Discoverer(self.connectors, store=self.store, provider_for=self.provider, clock=clock).run(connector_id)
        self.poller.Poller(self.connectors, store=self.store, provider_for=self.provider, clock=clock).poll_connector(connector_id)

    def insert_listing(self, part_id: str, connector_id: str, sku: str, *, state: str = "exact", stock: int | None = None,
                       currency: str = "EUR", price: str | None = None, fetched: datetime = START) -> str:
        listing_id = uuid.uuid4().hex
        with self.store.connection() as conn:
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) "
                "VALUES (%s, %s, %s, %s, 'x', 'Acme', %s)", (listing_id, connector_id, sku, part_id, state))
            if stock is not None:
                breaks = json.dumps([[1, price]]) if price else "[]"
                conn.execute(
                    "INSERT INTO offers (listing_id, fetched_at, stock, currency, price_breaks) VALUES (%s, %s, %s, %s, %s::jsonb)",
                    (listing_id, fetched, stock, currency, breaks))
        return listing_id

    def insert_sample(self, listing_id: str, when: datetime, stock: int) -> None:
        with self.store.connection() as conn:
            conn.execute("INSERT INTO samples (listing_id, sampled_at, stock) VALUES (%s, %s, %s)", (listing_id, when, stock))

    def part_row(self, mpn: str) -> dict:
        items = self.call("GET", "/api/supply/parts", query="scope=all").json["items"]
        return next(item for item in items if item["mpn"] == mpn)

    def test_the_list_comes_in_pages_that_do_not_overlap(self) -> None:
        for n in range(5):
            self.watch_via_api(f"PAGE{n}")
        first = self.call("GET", "/api/supply/parts", query="scope=all&limit=2").json
        second = self.call("GET", "/api/supply/parts", query=f"scope=all&limit=2&offset={first['next_offset']}").json
        last = self.call("GET", "/api/supply/parts", query=f"scope=all&limit=2&offset={second['next_offset']}").json
        names = [item["mpn"] for page in (first, second, last) for item in page["items"]]
        self.assertEqual(len(names), len(set(names)))
        self.assertEqual((first["total"], len(names)), (5, 5))
        self.assertIsNone(last["next_offset"])

    # --- roles ------------------------------------------------------------

    def test_readers_look_and_writers_watch(self) -> None:
        watch = self.watch_via_api()
        for role in ("admin", "designer", "qa"):
            self.assertEqual(self.call("GET", "/api/supply/parts", role=role).status, 200, role)
            self.assertEqual(self.call("GET", f"/api/supply/parts/{watch['part_id']}", role=role).status, 200, role)
        self.assertEqual(self.call("GET", "/api/supply/parts", role="viewer").status, 403)

        body = {"manufacturer": "Acme", "mpn": "X1"}
        self.assertEqual(self.call("POST", "/api/supply/watches", role="designer", body=body).status, 201)
        for role in ("qa", "viewer"):
            self.assertEqual(self.call("POST", "/api/supply/watches", role=role, body=body).status, 403, role)
            self.assertEqual(self.call("PATCH", f"/api/supply/watches/{watch['id']}", role=role, body={"pinned": True}).status, 403, role)
            self.assertEqual(self.call("DELETE", f"/api/supply/watches/{watch['id']}", role=role).status, 403, role)
        self.assertFalse(self.call("GET", f"/api/supply/parts/{watch['part_id']}").json["watch"]["pinned"])

    def test_a_part_is_found_by_manufacturer_and_number_without_creating_anything(self) -> None:
        watch = self.watch_via_api("ABC-123")
        found = self.call("GET", "/api/supply/part-lookup", role="qa", query="manufacturer=ACME&mpn=abc123")
        self.assertEqual((found.status, found.json), (200, {"part_id": watch["part_id"]}))
        missing = self.call("GET", "/api/supply/part-lookup", query="manufacturer=Acme&mpn=NOPE-1")
        self.assertEqual(missing.json, {"part_id": None})
        unknown = self.call("GET", "/api/supply/part-lookup", query="manufacturer=Nobody+Inc&mpn=ABC-123")
        self.assertEqual(unknown.json, {"part_id": None})
        with self.store.connection() as conn:
            self.assertEqual(conn.execute("SELECT COUNT(*) AS n FROM manufacturer_aliases WHERE status = 'pending'").fetchone()["n"], 0)
            self.assertEqual(conn.execute("SELECT COUNT(*) AS n FROM parts").fetchone()["n"], 1)
        self.assertEqual(self.call("GET", "/api/supply/part-lookup", role="viewer", query="manufacturer=Acme&mpn=ABC-123").status, 403)

    # --- read now ---------------------------------------------------------

    def test_a_part_is_read_now_from_the_interactive_reserve_and_not_again_for_fifteen_minutes(self) -> None:
        watch = self.watch_via_api("ABC-123")
        connector = self.fake_connector(daily_budget=20, interactive_reserve_pct=50)
        self.collect(connector)
        with self.store.connection() as conn:
            before = conn.execute("SELECT COUNT(*) AS n FROM samples").fetchone()["n"]
            spent_before = conn.execute("SELECT COALESCE(SUM(interactive_spent), 0) AS n FROM quota_ledger").fetchone()["n"]
        first = self.call("POST", f"/api/supply/parts/{watch['part_id']}/refresh", role="designer")
        self.assertEqual((first.status, first.json["read"], first.json["connectors"], first.json["problems"]), (200, 1, 1, []), first.text)
        with self.store.connection() as conn:
            self.assertGreater(conn.execute("SELECT COUNT(*) AS n FROM samples").fetchone()["n"], before - 1)
            self.assertEqual(conn.execute("SELECT COALESCE(SUM(interactive_spent), 0) AS n FROM quota_ledger").fetchone()["n"], spent_before + 1)
        again = self.call("POST", f"/api/supply/parts/{watch['part_id']}/refresh", role="designer")
        self.assertEqual((again.status, again.json["detail"]["code"]), (429, "read_too_soon"))
        self.assertIn("again in", again.json["detail"]["message"])
        other = self.call("POST", f"/api/supply/parts/{watch['part_id']}/refresh", role="admin")
        self.assertEqual(other.status, 200, "the wait is per person")

    def test_read_now_says_when_a_distributor_cannot_be_asked(self) -> None:
        watch = self.watch_via_api("ABC-123")
        connector = self.fake_connector()
        self.collect(connector)
        self.connectors.update(connector, actor=SEED_ACTOR, interactive_reserve_pct=0)  # nothing is left to ask with today
        response = self.call("POST", f"/api/supply/parts/{watch['part_id']}/refresh", role="designer")
        self.assertEqual(response.json["read"], 0)
        self.assertEqual(response.json["problems"], [{"connector": "Sim", "reason": "Sim has used today's allowance for asking."}])
        self.connectors.pause(connector, actor=SEED_ACTOR, reason="test")
        paused = self.call("POST", f"/api/supply/parts/{watch['part_id']}/refresh", role="admin")
        self.assertEqual(paused.json["problems"][0]["reason"], "Sim is disabled or paused.")

    def test_read_now_works_on_a_part_nobody_watches_and_a_part_nothing_lists_costs_no_wait(self) -> None:
        with self.store.connection() as conn:
            lonely = self.parts.ensure_part(conn, "Acme", "NOBODY-1", SEED_ACTOR).id
        for _ in range(2):
            response = self.call("POST", f"/api/supply/parts/{lonely}/refresh", role="designer")
            self.assertEqual((response.status, response.json["read"], response.json["connectors"]), (200, 0, 0))
        connector = self.fake_connector(daily_budget=20, interactive_reserve_pct=50)
        listing = self.insert_listing(lonely, connector, "FAKE-NOBODY-1-CT", stock=1)
        self.assertTrue(listing)
        self.assertEqual(self.call("POST", f"/api/supply/parts/{lonely}/refresh", role="designer").json["read"], 1)

    def test_who_may_read_now_and_an_unknown_part_is_not_found(self) -> None:
        watch = self.watch_via_api("ABC-123")
        for role in ("qa", "viewer"):
            self.assertEqual(self.call("POST", f"/api/supply/parts/{watch['part_id']}/refresh", role=role).status, 403, role)
        self.assertEqual(self.call("POST", "/api/supply/parts/nope/refresh", role="designer").status, 404)

    def test_tokens(self) -> None:
        reader = self.AuthenticatedUser(email="bot@example.com", name="bot", role="admin", auth_type="agent", scopes=["api:read"])
        self.assertEqual(self.call("GET", "/api/supply/parts", user=reader).status, 200)
        body = {"manufacturer": "Acme", "mpn": "X1"}
        self.assertEqual(self.call("POST", "/api/supply/watches", user=reader, body=body).status, 403)
        kicad = self.AuthenticatedUser(email="k@example.com", name="k", role="admin", auth_type="kicad_provider", scopes=["remote_symbols.read"])
        self.assertEqual(self.call("GET", "/api/supply/parts", user=kicad).status, 403)
        self.assertEqual(self.call("POST", "/api/supply/watches", user=kicad, body=body).status, 403)

    # --- watches ----------------------------------------------------------

    def test_watching_a_part_lists_it_with_nothing_read_yet(self) -> None:
        watch = self.watch_via_api("LM358-D", threshold=100)
        self.assertEqual((watch["manufacturer"], watch["mpn"], watch["threshold"], watch["pinned"], watch["owner"]),
                         ("Acme", "LM358-D", 100, False, "admin@example.com"))
        (item,) = self.call("GET", "/api/supply/parts").json["items"]
        self.assertEqual((item["mpn"], item["status"], item["stock"], item["listings"], item["tier"]), ("LM358-D", "unknown", None, 0, None))
        self.assertEqual(item["watch"], {"id": watch["id"], "threshold": 100, "pinned": False, "owner": "admin@example.com", "packaging": "any"})

    def test_the_list_says_what_open_demand_asks_of_a_part_and_by_when(self) -> None:
        from datetime import date

        from app.services.supply import demand

        self.watch_via_api("DM-1")
        part = self.part_row("DM-1")["id"]
        self.assertEqual((self.part_row("DM-1")["needed"], self.part_row("DM-1")["need_by"]), (0, None))
        with self.store.connection() as conn:
            demand.add_manual(conn, part, 500, "a@example.com", need_by=date(2026, 6, 1))
            demand.add_manual(conn, part, 200, "a@example.com", need_by=date(2026, 5, 1))
        row = self.part_row("DM-1")
        self.assertEqual((row["needed"], row["need_by"]), (700, "2026-05-01"))

    def test_a_watch_can_count_only_one_packaging(self) -> None:
        cid = self.fake_connector()
        watch = self.watch_via_api("PK-1")
        part = self.part_row("PK-1")["id"]
        cut = self.insert_listing(part, cid, "PK-CT", stock=300)
        reel = self.insert_listing(part, cid, "PK-REEL", stock=5000)
        with self.store.connection() as conn:
            conn.execute("UPDATE listings SET packaging = 'cut_tape' WHERE id = %s", (cut,))
            conn.execute("UPDATE listings SET packaging = 'tape_reel' WHERE id = %s", (reel,))
            conn.execute("UPDATE offers SET packaging = 'cut_tape' WHERE listing_id = %s", (cut,))
            conn.execute("UPDATE offers SET packaging = 'tape_reel' WHERE listing_id = %s", (reel,))
            conn.execute("UPDATE connectors SET provider = 'demo_sum' WHERE id = %s", (cid,))
        from app.services.supply.providers import registry
        from app.services.supply.providers.base import ProviderSpec

        registry.register(ProviderSpec(
            key="demo_sum", label="Sum", capabilities=frozenset({"offers"}), max_batch=10, stock_pooling="separate",
            credential_fields=(), factory=lambda config: self.FakeProvider(config)), replace=True)
        try:
            self.assertEqual(self.part_row("PK-1")["stock"], 5300)
            reply = self.call("PATCH", f"/api/supply/watches/{watch['id']}", body={"packaging": "cut_tape"})
            self.assertEqual((reply.status, reply.json["packaging"]), (200, "cut_tape"))
            self.assertEqual(self.part_row("PK-1")["stock"], 300)
            detail = self.call("GET", f"/api/supply/parts/{part}").json
            self.assertEqual((detail["stock"]["total"], detail["watch"]["packaging"]), (300, "cut_tape"))
            self.call("PATCH", f"/api/supply/watches/{watch['id']}", body={"packaging": "tape_reel"})
            self.assertEqual(self.part_row("PK-1")["stock"], 5000)
            self.assertEqual(self.call("PATCH", f"/api/supply/watches/{watch['id']}", body={"packaging": "nonsense"}).status, 422)
        finally:
            registry.unregister("demo_sum")

    def test_watching_twice_is_one_watch(self) -> None:
        first, second = self.watch_via_api("LM358-D"), self.watch_via_api("lm358d", status=200)
        self.assertEqual(first["id"], second["id"])
        self.assertEqual(self.call("GET", "/api/supply/parts").json["total"], 1)

    def test_bad_watch_requests(self) -> None:
        for body in ({}, {"manufacturer": "Acme"}, {"manufacturer": "Acme", "mpn": "X", "threshold": -1},
                     {"manufacturer": "Acme", "mpn": "X", "owner": "mallory"}, {"manufacturer": "", "mpn": "X"}):
            response = self.call("POST", "/api/supply/watches", body=body)
            self.assertEqual(response.status, 422, body)
            self.assertNotIn("mallory", json.dumps(response.json))
        blank = self.call("POST", "/api/supply/watches", body={"manufacturer": "Acme", "mpn": " - "})
        self.assertEqual((blank.status, blank.json["detail"]["code"]), (400, "invalid_request"))

    def test_changing_a_watch(self) -> None:
        watch = self.watch_via_api(threshold=50)
        path = f"/api/supply/watches/{watch['id']}"
        pinned = self.call("PATCH", path, body={"pinned": True})
        self.assertEqual((pinned.status, pinned.json["threshold"], pinned.json["pinned"]), (200, 50, True), "threshold left alone")
        cleared = self.call("PATCH", path, body={"threshold": None})
        self.assertEqual((cleared.json["threshold"], cleared.json["pinned"]), (None, True), "null clears it, pin left alone")
        self.assertEqual(self.call("PATCH", path, body={"threshold": 7}).json["threshold"], 7)
        self.assertEqual(self.call("PATCH", path, body={}).json["threshold"], 7, "an empty change changes nothing")
        for body in ({"threshold": -1}, {"owner": "x"}):
            self.assertEqual(self.call("PATCH", path, body=body).status, 422, body)
        self.assertEqual(self.call("PATCH", "/api/supply/watches/missing", body={"pinned": True}).status, 404)

    def test_the_pin_limit_is_reported(self) -> None:
        with mock.patch.object(self.watches, "MAX_PINNED", 1):
            self.watch_via_api("P1", pinned=True)
            refused = self.call("POST", "/api/supply/watches", body={"manufacturer": "Acme", "mpn": "P2", "pinned": True})
            self.assertEqual((refused.status, refused.json["detail"]["code"]), (400, "watch_error"))

    def test_removing_a_watch_keeps_the_part(self) -> None:
        watch = self.watch_via_api()
        self.assertEqual(self.call("DELETE", f"/api/supply/watches/{watch['id']}").status, 204)
        self.assertEqual(self.call("GET", "/api/supply/parts").json["items"], [])
        self.assertEqual(len(self.call("GET", "/api/supply/parts", query="scope=all").json["items"]), 1)
        self.assertEqual(self.call("DELETE", f"/api/supply/watches/{watch['id']}").status, 404)

    # --- the list ---------------------------------------------------------

    def test_scope_search_and_limit(self) -> None:
        self.watch_via_api("LM358-D")
        self.watch_via_api("TPS62840")
        with self.store.connection() as conn:
            self.parts.ensure_part(conn, "Onsemi", "NCP1117", SEED_ACTOR)
        listed = lambda **q: self.call("GET", "/api/supply/parts", query="&".join(f"{k}={v}" for k, v in q.items())).json  # noqa: E731
        self.assertEqual([i["mpn"] for i in listed()["items"]], ["LM358-D", "TPS62840"])
        self.assertEqual(listed(scope="all")["total"], 3)
        self.assertEqual([i["mpn"] for i in listed(scope="all", q="onsemi")["items"]], ["NCP1117"], "matches the manufacturer, any case")
        self.assertEqual([i["mpn"] for i in listed(q="tps")["items"]], ["TPS62840"])
        self.assertEqual(listed(q="zzz")["items"], [])
        page = listed(scope="all", limit=2)
        self.assertEqual((len(page["items"]), page["total"], page["limit"]), (2, 3, 2))
        self.assertEqual(self.call("GET", "/api/supply/parts", query="scope=nope").status, 422)
        self.assertEqual(self.call("GET", "/api/supply/parts", query="limit=0").status, 422)

    def test_search_wildcards_are_literal(self) -> None:
        self.watch_via_api("LM358-D")
        self.assertEqual(self.call("GET", "/api/supply/parts", query="q=%25").json["items"], [], "a percent sign is not everything")
        self.assertEqual(self.call("GET", "/api/supply/parts", query="q=_").json["items"], [])

    def test_a_collected_part_shows_stock_price_lifecycle_and_tier(self) -> None:
        cid = self.fake_connector()
        self.watch_via_api("ABC123")
        self.collect(cid)
        item = self.part_row("ABC123")
        expected = self.provider(cid).get_offers(["FAKE-ABC123-CT"])[0]
        self.assertEqual((item["stock"], item["listings"], item["lifecycle"], item["currency"]), (expected.stock, 1, "active", "EUR"))
        at_reference = pricing.unit_price_at(
            [(b.quantity, b.unit_price) for b in expected.price_breaks], moq=expected.moq, order_multiple=expected.order_multiple
        )
        self.assertEqual(float(item["unit_price"]), float(at_reference))
        self.assertEqual(item["price_quantity"], pricing.REFERENCE_QUANTITY)
        self.assertIn(item["status"], ("ok", "warning"))
        self.assertEqual(item["tier"], "weekly", "read on the schedule of its tracking rate")
        self.assertEqual(item["fetched_at"], self.now.isoformat())

    def test_status_follows_what_the_market_says(self) -> None:
        cid = self.fake_connector()
        for mpn in ("OOS-1", "EOL-1", "NRND-1"):
            self.watch_via_api(mpn)
        self.collect(cid)
        self.assertEqual(self.part_row("OOS-1")["status"], "error")
        self.assertEqual(self.part_row("EOL-1")["status"], "fatal")
        nrnd = self.part_row("NRND-1")
        self.assertEqual((nrnd["status"], nrnd["lifecycle"]), ("warning", "nrnd"))

    def test_the_list_can_be_narrowed_to_the_groups_the_overview_counts(self) -> None:
        cid = self.fake_connector()
        for mpn in ("OOS-1", "EOL-1", "NRND-1", "FINE-1"):
            self.watch_via_api(mpn)
        self.collect(cid)

        def only(group: str) -> list[str]:
            reply = self.call("GET", "/api/supply/parts", query=f"only={group}").json
            self.assertEqual(reply["total"], len(reply["items"]))
            return sorted(item["mpn"] for item in reply["items"])

        self.assertEqual(only("out_of_stock"), ["OOS-1"])
        self.assertEqual(only("lifecycle"), ["EOL-1", "NRND-1"])
        self.assertEqual(only("at_risk"), ["EOL-1", "NRND-1", "OOS-1"])
        self.assertEqual(len(only("")), 4)
        self.assertEqual(self.call("GET", "/api/supply/parts", query="only=nonsense").status, 422)

    def test_a_threshold_above_stock_is_a_warning(self) -> None:
        cid = self.fake_connector()
        watch = self.watch_via_api("ABC123", threshold=10_000_000)
        self.collect(cid)
        self.assertEqual(self.part_row("ABC123")["status"], "warning")
        self.call("PATCH", f"/api/supply/watches/{watch['id']}", body={"threshold": None})
        self.assertEqual(self.part_row("ABC123")["status"], "ok")

    def test_a_price_is_shown_only_when_every_offer_is_in_one_currency(self) -> None:
        cid = self.fake_connector()
        part_id = self.watch_via_api("MIXED")["part_id"]
        self.insert_listing(part_id, cid, "A", stock=10, currency="EUR", price="0.50")
        self.insert_listing(part_id, cid, "B", stock=10, currency="EUR", price="0.40")
        item = self.part_row("MIXED")
        self.assertEqual((item["unit_price"], item["currency"]), ("0.4", "EUR"), "the lowest, as a plain number")
        self.insert_listing(part_id, cid, "C", stock=10, currency="USD", price="0.30")
        item = self.part_row("MIXED")
        self.assertEqual((item["unit_price"], item["currency"]), (None, ""), "no price that compares dollars with euros")

    # --- the detail -------------------------------------------------------

    def test_the_detail_lists_every_listing_with_its_offer_and_schedule(self) -> None:
        cid = self.fake_connector()
        watch = self.watch_via_api("ABC123")
        self.collect(cid)
        near = self.insert_listing(watch["part_id"], cid, "NEARSKU", state="near")
        rejected = self.insert_listing(watch["part_id"], cid, "NOPE", state="rejected", stock=5)
        detail = self.call("GET", f"/api/supply/parts/{watch['part_id']}", role="qa").json
        self.assertEqual({key: value for key, value in detail["part"].items() if key != "first_seen"}, {"id": watch["part_id"], "mpn": "ABC123", "manufacturer": "Acme"})
        self.assertTrue(detail["part"]["first_seen"])
        self.assertEqual(detail["watch"]["id"], watch["id"])
        skus = {item["sku"]: item for item in detail["listings"]}
        self.assertEqual(sorted(skus), ["FAKE-ABC123-CT", "NEARSKU"], "a rejected listing is not shown")
        main = skus["FAKE-ABC123-CT"]
        self.assertEqual((main["counted"], main["packaging"], main["match_state"]), (True, "cut_tape", "exact"))
        self.assertEqual(len(main["offer"]["price_breaks"]), 4)
        self.assertEqual((main["offer"]["currency"], main["offer"]["moq"], main["offer"]["fetched_at"]), ("EUR", 1, self.now.isoformat()))
        self.assertEqual(main["poll"]["error_streak"], 0)
        self.assertIsNotNone(main["poll"]["next_poll_at"])
        self.assertEqual((skus["NEARSKU"]["counted"], skus["NEARSKU"]["offer"], skus["NEARSKU"]["poll"]), (False, None, None))
        self.assertEqual(detail["stock"]["total"], main["offer"]["stock"])
        self.assertEqual(detail["stock"]["by_connector"], [{"connector_id": cid, "connector_name": "Sim", "provider": "fake", "stock": main["offer"]["stock"]}])
        self.assertNotIn(rejected, [item["id"] for item in detail["listings"]])
        self.assertNotIn(near, [item["id"] for item in detail["listings"] if item["counted"]])

    def test_the_detail_of_a_part_nobody_read_yet(self) -> None:
        detail = self.call("GET", f"/api/supply/parts/{self.watch_via_api()['part_id']}").json
        self.assertEqual((detail["status"], detail["stock"]["total"], detail["stock"]["by_connector"], detail["history"], detail["listings"]),
                         ("unknown", None, [], [], []))

    def test_a_part_that_is_not_watched_still_has_a_detail(self) -> None:
        with self.store.connection() as conn:
            part = self.parts.ensure_part(conn, "Acme", "LOOSE", SEED_ACTOR)
        detail = self.call("GET", f"/api/supply/parts/{part.id}").json
        self.assertIsNone(detail["watch"])

    def test_history_carries_each_listings_last_figure_forward(self) -> None:
        cid = self.fake_connector()
        part_id = self.watch_via_api("HIST")["part_id"]
        first = self.insert_listing(part_id, cid, "A", stock=0)
        # The API looks back from the real clock, so the samples are placed relative to it.
        start = (datetime.now(timezone.utc) - timedelta(days=6)).replace(hour=9, minute=0, second=0, microsecond=0)
        day = lambda n, hour=9: (start + timedelta(days=n)).replace(hour=hour)  # noqa: E731
        for when, stock in ((day(0), 10), (day(0, 18), 12), (day(3), 25)):
            self.insert_sample(first, when, stock)
        history = self.call("GET", f"/api/supply/parts/{part_id}").json["history"]
        self.assertEqual([(h["day"], h["stock"]) for h in history],
                         [((start + timedelta(days=n)).date().isoformat(), value) for n, value in ((0, 12), (1, 12), (2, 12), (3, 25))],
                         "the last sample of a day wins and quiet days repeat it")

    def test_history_combines_listings_without_double_counting_pooled_stock(self) -> None:
        cid = self.fake_connector()  # the simulated market's stock is pooled across packaging
        part_id = self.watch_via_api("POOL")["part_id"]
        ct, rl = (self.insert_listing(part_id, cid, sku, stock=0) for sku in ("CT", "RL"))
        when = datetime.now(timezone.utc) - timedelta(days=3)
        self.insert_sample(ct, when, 1000)
        self.insert_sample(rl, when, 1000)
        history = self.call("GET", f"/api/supply/parts/{part_id}").json["history"]
        self.assertEqual([h["stock"] for h in history], [1000])

    def test_history_is_limited_to_the_recent_past(self) -> None:
        cid = self.fake_connector()
        part_id = self.watch_via_api("OLD")["part_id"]
        listing = self.insert_listing(part_id, cid, "A", stock=0)
        self.insert_sample(listing, START - timedelta(days=200), 5)
        self.insert_sample(listing, START - timedelta(days=1), 9)
        from app.services.supply import parts_view

        with self.store.connection() as conn:
            history = parts_view.part_detail(conn, part_id, now=START)["history"]
        self.assertEqual([h["stock"] for h in history], [9])

    def test_history_leaves_out_marketplace_stock_and_listings_that_disappeared(self) -> None:
        cid = self.fake_connector()
        part_id = self.watch_via_api("COVER")["part_id"]
        kept = self.insert_listing(part_id, cid, "KEPT", stock=0)
        vanished = self.insert_listing(part_id, cid, "VANISHED", state="gone", stock=0)
        resold = self.insert_listing(part_id, cid, "RESOLD", stock=0)
        start = (datetime.now(timezone.utc) - timedelta(days=4)).replace(hour=9, minute=0, second=0, microsecond=0)
        self.insert_sample(kept, start, 10)
        self.insert_sample(kept, start + timedelta(days=2), 20)
        self.insert_sample(vanished, start, 50)
        with self.store.connection() as conn:
            conn.execute("INSERT INTO samples (listing_id, sampled_at, stock, marketplace) VALUES (%s, %s, 900, TRUE)", (resold, start))
        history = self.call("GET", f"/api/supply/parts/{part_id}").json["history"]
        self.assertEqual([(h["stock"], h["listings"]) for h in history], [(50, 2), (10, 1), (20, 1)],
                         "a gone listing counts until its last reading (pooled stock takes the larger); marketplace stock never does")

    def test_older_days_come_from_the_rollups(self) -> None:
        cid = self.fake_connector()
        part_id = self.watch_via_api("ROLL")["part_id"]
        listing = self.insert_listing(part_id, cid, "A", stock=0)
        old_day = (datetime.now(timezone.utc) - timedelta(days=80)).date()
        with self.store.connection() as conn:
            conn.execute(
                "INSERT INTO samples_daily (listing_id, day, min_stock, max_stock, last_stock, sample_count) VALUES (%s, %s, 5, 40, 30, 6)",
                (listing, old_day))
        self.insert_sample(listing, datetime.now(timezone.utc) - timedelta(days=1), 7)
        history = self.call("GET", f"/api/supply/parts/{part_id}").json["history"]
        self.assertEqual((history[0]["day"], history[0]["stock"]), (old_day.isoformat(), 30))
        self.assertEqual(history[-1]["stock"], 7)

    def test_a_part_no_distributor_carries_is_an_error_not_unknown(self) -> None:
        cid = self.fake_connector()
        part_id = self.watch_via_api("NOBODY")["part_id"]
        self.assertEqual(self.part_row("NOBODY")["status"], "unknown", "not searched yet")
        with self.store.connection() as conn:
            conn.execute("INSERT INTO discovery_runs (part_id, connector_id, last_run_at, found) VALUES (%s, %s, %s, 0)", (part_id, cid, START))
        item = self.part_row("NOBODY")
        self.assertEqual((item["status"], item["problem"]), ("error", "not_found"))
        self.assertIn("No distributor", self.call("GET", f"/api/supply/parts/{part_id}").json["problem_text"])
        self.insert_listing(part_id, cid, "CANDIDATE", state="near")
        self.assertEqual(self.part_row("NOBODY")["status"], "unknown", "a candidate waiting in Review is not 'nobody carries it'")

    def test_a_part_whose_listings_all_disappeared_is_an_error(self) -> None:
        cid = self.fake_connector()
        part_id = self.watch_via_api("VANISH")["part_id"]
        self.insert_listing(part_id, cid, "A", state="gone", stock=10)
        item = self.part_row("VANISH")
        self.assertEqual((item["status"], item["problem"], item["stock"]), ("error", "gone", None))
        self.insert_listing(part_id, cid, "B", stock=10)
        self.assertEqual(self.part_row("VANISH")["status"], "ok", "one live listing is enough")

    def test_parts_that_need_a_look_come_first(self) -> None:
        cid = self.fake_connector()
        for mpn, stock in (("AAA", 5000), ("BBB", 0), ("CCC", 5000)):
            self.insert_listing(self.watch_via_api(mpn)["part_id"], cid, mpn, stock=stock)
        self.assertEqual([i["mpn"] for i in self.call("GET", "/api/supply/parts").json["items"]], ["BBB", "AAA", "CCC"])

    def test_prices_are_compared_at_one_quantity(self) -> None:
        cid = self.fake_connector()
        part_id = self.watch_via_api("QTY")["part_id"]
        with self.store.connection() as conn:
            for sku, moq, breaks in (("TAPE", 1, [[1, "0.50"], [100, "0.30"]]), ("REEL", 3000, [[3000, "0.10"]])):
                listing = self.insert_listing(part_id, cid, sku, stock=10)
                conn.execute("UPDATE offers SET moq = %s, price_breaks = %s::jsonb WHERE listing_id = %s", (moq, json.dumps(breaks), listing))
        item = self.part_row("QTY")
        self.assertEqual((item["unit_price"], item["price_quantity"]), ("0.3", 100), "the reel needs 3,000 pieces, so it is not the price at 100")
        with self.store.connection() as conn:
            conn.execute("DELETE FROM listings WHERE sku = 'TAPE'")
        item = self.part_row("QTY")
        self.assertEqual((item["unit_price"], item["price_quantity"]), ("0.1", 3000), "alone, the reel is quoted at what must be ordered")

    # --- who may name a manufacturer --------------------------------------

    def test_only_approvers_can_introduce_a_new_manufacturer(self) -> None:
        body = {"manufacturer": "TI", "mpn": "TPS1"}
        denied = self.call("POST", "/api/supply/watches", role="designer", body=body)
        self.assertEqual(denied.status, 400)
        self.assertEqual(denied.json["detail"]["code"], "unknown_manufacturer")
        with self.store.connection() as conn:
            self.assertEqual(conn.execute("SELECT COUNT(*) AS n FROM manufacturers").fetchone()["n"], 0)
        self.assertEqual(self.call("POST", "/api/supply/watches", role="admin", body=body).status, 201)
        self.assertEqual(self.call("POST", "/api/supply/watches", role="designer", body={"manufacturer": "ti", "mpn": "TPS2"}).status, 201,
                         "once it exists a designer can use it")
        names = [m["name"] for m in self.call("GET", "/api/supply/manufacturers", role="designer").json["items"]]
        self.assertEqual(names, ["TI"])

    def test_naming_a_manufacturer_distributors_reported_settles_the_listings_waiting_on_it(self) -> None:
        cid = self.fake_connector()
        part_id = self.watch_via_api("LM1")["part_id"]
        waiting = self.insert_listing(part_id, cid, "W", state="manufacturer_unresolved")
        with self.store.connection() as conn:
            conn.execute("UPDATE listings SET raw_manufacturer = 'Zeta Works' WHERE id = %s", (waiting,))
            conn.execute("INSERT INTO manufacturer_aliases (alias_key, alias_text, status) VALUES ('zeta works', 'Zeta Works', 'pending')")
        self.assertEqual(self.call("POST", "/api/supply/watches", role="admin", body={"manufacturer": "Zeta Works", "mpn": "OTHER"}).status, 201)
        with self.store.connection() as conn:
            state = conn.execute("SELECT match_state FROM listings WHERE id = %s", (waiting,)).fetchone()["match_state"]
        self.assertEqual(state, "near", "Zeta Works is a different manufacturer from the part's own (Acme)")

    def test_watching_a_watched_part_applies_what_was_asked(self) -> None:
        first = self.watch_via_api("RULES")
        second = self.watch_via_api("RULES", status=200, threshold=250, pinned=True)
        self.assertEqual(first["id"], second["id"])
        self.assertEqual((second["threshold"], second["pinned"]), (250, True))

    def test_watch_changes_are_audited_with_before_and_after(self) -> None:
        watch = self.watch_via_api("AUDIT", threshold=5)
        self.call("PATCH", f"/api/supply/watches/{watch['id']}", body={"threshold": 9})
        with self.store.connection() as conn:
            detail = conn.execute(
                "SELECT detail FROM audit_events WHERE action = 'watch.update' AND subject_id = %s", (watch["id"],)).fetchone()["detail"]
        self.assertEqual(detail, {"before": {"threshold": 5}, "after": {"threshold": 9}})

    def test_the_detail_carries_the_insight_with_its_inputs(self) -> None:
        cid = self.fake_connector()
        part_id = self.watch_via_api("TREND", threshold=100)["part_id"]
        listing = self.insert_listing(part_id, cid, "A", stock=300)
        today = datetime.now(timezone.utc)
        for index in range(12):
            self.insert_sample(listing, today - timedelta(days=12 - index), 900 - 50 * index)
        insight = self.call("GET", f"/api/supply/parts/{part_id}").json["insight"]
        self.assertEqual((insight["trend"], insight["decrease_per_day"], insight["restocks"]), ("falling", 50.0, 0))
        self.assertEqual(insight["confidence"], "medium")
        self.assertEqual(insight["inputs"]["points"], 12)
        self.assertIsNotNone(insight["days_to_zero"])
        self.assertIsNotNone(insight["days_to_threshold"])

    def test_the_insight_of_a_part_nobody_read_is_empty_not_missing(self) -> None:
        insight = self.call("GET", f"/api/supply/parts/{self.watch_via_api('NEW')['part_id']}").json["insight"]
        self.assertEqual((insight["confidence"], insight["decrease_per_day"], insight["days_to_zero"]), ("none", None, None))

    def test_unknown_parts(self) -> None:
        self.assertEqual(self.call("GET", "/api/supply/parts/missing").status, 404)


if __name__ == "__main__":
    unittest.main()

"""Testing a connector, and the capacity planner.

Needs ``PRISM_DATABASE_URL``. Requests go through the real router into a disposable schema.
"""

from __future__ import annotations

import os
import sys
import types
import unittest
import uuid
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from supply_api_helpers import request as _request  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
ACTOR = "ana@example.com"


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply API tests")
class ConnectorCheckTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply import watches
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.providers import base, registry
        from app.services.supply.providers.fake import FakeProvider
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.watches, cls.registry, cls.base = database, watches, registry, base
        cls.users = {
            role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role)
            for role in ("viewer", "qa", "designer", "admin")
        }
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_check_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_connectors.router)
        supply_connectors.register_validation_redaction(cls.app)
        cls.patcher = mock.patch.object(supply_connectors, "service", cls.connectors)
        cls.patcher.start()

        # A provider whose behaviour a test sets, so each failure code can be exercised.
        cls.behaviour = {"error": None, "calls": 0}

        class Scripted(FakeProvider):
            def lookup_mpn(self, mpn, manufacturer=None):
                cls.behaviour["calls"] += 1
                self._client = types.SimpleNamespace(last_limits=cls.behaviour.get("limits", {}))
                if cls.behaviour["error"] is not None:
                    raise cls.behaviour["error"]
                return []

        registry.register(base.ProviderSpec(
            key="demo_script", label="Scripted", capabilities=frozenset({"search", "offers"}), max_batch=2,
            stock_pooling="separate", credential_fields=(), factory=lambda config: Scripted(config),
            default_daily_budget=100, calls_per_offers_batch=2,
        ), replace=True)
        registry.register(base.ProviderSpec(
            key="demo_free", label="Free", capabilities=frozenset({"search", "offers"}), max_batch=10,
            stock_pooling="separate", credential_fields=(), factory=lambda config: FakeProvider(config),
            default_daily_budget=0, metered=False,
        ), replace=True)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.registry.unregister("demo_script")
        cls.registry.unregister("demo_free")
        cls.patcher.stop()
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("listings", "watches", "parts", "manufacturer_aliases", "manufacturers", "connectors", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
        type(self).behaviour.update(error=None, calls=0, limits={})

    # --- helpers ----------------------------------------------------------

    def call(self, method: str, path: str, *, role: str = "admin", body=None):
        return _request(self.app, method, path, user=self.users[role], body=body)

    def connector(self, provider: str = "demo_script", **overrides) -> str:
        values = dict(actor=ACTOR, provider=provider, currency="EUR", interactive_reserve_pct=50, daily_budget=100)
        if provider in ("csv", "demo_free"):
            values.pop("daily_budget")
        values.update(overrides)
        return self.connectors.create(**values)["id"]

    def rows(self, sql: str, *params):
        with self.store.connection() as conn:
            return conn.execute(sql, params).fetchall()

    # --- the test ---------------------------------------------------------

    def test_a_working_connector_answers_ok_and_spends_one_interactive_call(self) -> None:
        cid = self.connector()
        result = self.call("POST", f"/api/supply/connectors/{cid}/test")
        self.assertEqual(result.status, 200)
        self.assertEqual((result.json["ok"], result.json["code"]), (True, "ok"))
        self.assertIsInstance(result.json["took_ms"], int)
        self.assertEqual(type(self).behaviour["calls"], 1)
        (ledger,) = self.rows("SELECT spent, interactive_spent FROM quota_ledger WHERE connector_id = %s", cid)
        self.assertEqual((ledger["spent"], ledger["interactive_spent"]), (1, 1))
        (connector,) = self.rows("SELECT last_ok_at, last_error_code FROM connectors WHERE id = %s", cid)
        self.assertIsNotNone(connector["last_ok_at"])
        (event,) = self.rows("SELECT actor, detail FROM audit_events WHERE action = 'connector.test'")
        self.assertEqual((event["actor"], event["detail"]), ("admin@example.com", {"ok": True, "code": "ok"}))

    def test_the_limits_a_provider_reports_are_kept_for_the_card(self) -> None:
        cid = self.connector()
        self.assertEqual(self.call("GET", "/api/supply/connectors").json[0]["rate_limits"], {})
        type(self).behaviour["limits"] = {"x-ratelimit-remaining": "49", "x-ratelimit-limit": "50"}
        self.call("POST", f"/api/supply/connectors/{cid}/test")
        (shown,) = self.call("GET", "/api/supply/connectors").json
        self.assertEqual(shown["rate_limits"], {"x-ratelimit-remaining": "49", "x-ratelimit-limit": "50"})
        self.assertIsNotNone(shown["rate_limits_at"])

    def test_each_failure_has_its_own_safe_message_and_never_the_providers_text(self) -> None:
        cid = self.connector(interactive_reserve_pct=50, daily_budget=100)
        cases = (
            (self.base.AuthError("key sk-live-SECRET rejected"), "auth_failed", "rejected the credentials"),
            (self.base.RateLimited("429 for https://api.example.com/x?apiKey=SECRET"), "rate_limited", "rate limiting"),
            (self.base.Unavailable("connect to 10.0.0.5 failed"), "unavailable", "could not reach"),
            (self.base.EgressBlocked("host is not on the allowlist"), "egress_denied", "not allowed to reach"),
            (self.base.ProviderError("weird body with SECRET"), "provider_error", "not in the way prism expects"),
        )
        for error, code, words in cases:
            type(self).behaviour["error"] = error
            result = self.call("POST", f"/api/supply/connectors/{cid}/test").json
            self.assertEqual((result["ok"], result["code"]), (False, code), code)
            self.assertIn(words, result["message"].lower(), code)
            self.assertNotIn("SECRET", result["message"])
            self.assertNotIn("10.0.0.5", result["message"])
        (connector,) = self.rows("SELECT last_error_code, paused_reason FROM connectors WHERE id = %s", cid)
        self.assertEqual(connector["last_error_code"], "provider_error", "the last failure is recorded")
        self.assertEqual(connector["paused_reason"], "", "a test never pauses a connector")

    def test_a_success_after_a_failure_clears_the_error(self) -> None:
        cid = self.connector()
        type(self).behaviour["error"] = self.base.Unavailable("down")
        self.call("POST", f"/api/supply/connectors/{cid}/test")
        type(self).behaviour["error"] = None
        self.assertTrue(self.call("POST", f"/api/supply/connectors/{cid}/test").json["ok"])
        self.assertEqual(self.rows("SELECT last_error_code FROM connectors WHERE id = %s", cid)[0]["last_error_code"], "")

    def test_it_stops_when_the_interactive_reserve_is_used_up(self) -> None:
        cid = self.connector(daily_budget=2, interactive_reserve_pct=50)  # a reserve of one call
        self.assertTrue(self.call("POST", f"/api/supply/connectors/{cid}/test").json["ok"])
        second = self.call("POST", f"/api/supply/connectors/{cid}/test").json
        self.assertEqual((second["ok"], second["code"]), (False, "budget"))
        self.assertEqual(type(self).behaviour["calls"], 1, "no call was made")

    def test_a_paused_or_disabled_connector_is_not_called(self) -> None:
        cid = self.connector()
        self.connectors.pause(cid, actor=ACTOR, reason="maintenance")
        result = self.call("POST", f"/api/supply/connectors/{cid}/test").json
        self.assertEqual((result["ok"], result["code"]), (False, "inactive"))
        self.assertEqual((type(self).behaviour["calls"], self.rows("SELECT 1 FROM quota_ledger")), (0, []))

    def test_a_free_connector_is_tested_without_spending(self) -> None:
        cid = self.connector("demo_free")
        self.assertTrue(self.call("POST", f"/api/supply/connectors/{cid}/test").json["ok"])
        self.assertEqual(self.rows("SELECT 1 FROM quota_ledger"), [])

    def test_only_admins_test_and_a_missing_connector_is_a_404(self) -> None:
        cid = self.connector()
        for role in ("designer", "qa", "viewer"):
            self.assertEqual(self.call("POST", f"/api/supply/connectors/{cid}/test", role=role).status, 403, role)
        self.assertEqual(self.call("POST", "/api/supply/connectors/missing/test").status, 404)
        self.assertEqual(type(self).behaviour["calls"], 0)

    # --- capacity ---------------------------------------------------------

    def watch_with_listing(self, mpn: str, cid: str, tier: str | None) -> None:
        with self.store.connection() as conn:
            watch = self.watches.add_watch(conn, "Acme", mpn, ACTOR, tier=1)[0]
            listing_id = uuid.uuid4().hex
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) "
                "VALUES (%s, %s, %s, %s, 'x', 'Acme', 'exact')", (listing_id, cid, f"SKU-{mpn}", watch.part_id))
            if tier:
                conn.execute(
                    "INSERT INTO poll_state (listing_id, tier, next_poll_at) VALUES (%s, %s, NOW())", (listing_id, tier))
            conn.execute(
                "INSERT INTO discovery_runs (part_id, connector_id, last_run_at, found) VALUES (%s, %s, NOW(), 1)",
                (watch.part_id, cid))

    def test_capacity_counts_calls_a_day_and_says_when_the_budget_will_not_keep_up(self) -> None:
        cid = self.connector(daily_budget=100, interactive_reserve_pct=0)
        for index in range(3):
            self.watch_with_listing(f"DAILY{index}", cid, "daily")
        for index in range(2):
            self.watch_with_listing(f"WEEKLY{index}", cid, "weekly")
        (row,) = self.call("GET", "/api/supply/capacity").json
        # Batches of 2, two calls a batch: daily is 2 batches x 2 calls, weekly is 1 batch x 2 calls once in seven days.
        self.assertEqual((row["listings"], row["calls_per_day"], row["usable_per_day"]), (5, 5, 100))
        self.assertEqual((row["fits"], row["shortfall_pct"], row["searches_pending"]), (True, 0, 0))

        self.connectors.update(cid, actor=ACTOR, daily_budget=4)
        (tight,) = self.call("GET", "/api/supply/capacity").json
        self.assertEqual((tight["fits"], tight["usable_per_day"], tight["shortfall_pct"]), (False, 4, 20))

    def test_capacity_holds_back_the_interactive_reserve_and_plans_unpolled_listings_daily(self) -> None:
        cid = self.connector(daily_budget=100, interactive_reserve_pct=10)
        self.watch_with_listing("NEW", cid, None)
        (row,) = self.call("GET", "/api/supply/capacity").json
        self.assertEqual((row["calls_per_day"], row["usable_per_day"]), (2, 90), "1 batch x 2 calls, once a day")

    def test_capacity_says_how_many_tracked_parts_a_connector_quotes(self) -> None:
        cid = self.connector()
        self.watch_with_listing("PRICED", cid, "daily")
        self.watch_with_listing("UNPRICED", cid, "daily")
        with self.store.connection() as conn:
            listing = conn.execute("SELECT id FROM listings WHERE sku = 'SKU-PRICED'").fetchone()["id"]
            conn.execute(
                "INSERT INTO offers (listing_id, fetched_at, stock, currency, price_breaks) VALUES (%s, NOW(), 5, 'EUR', '[[1, \"0.5\"]]'::jsonb)",
                (listing,),
            )
        (row,) = self.call("GET", "/api/supply/capacity").json
        self.assertEqual(row["quotes"], {"parts": 1, "of": 2})

    def test_capacity_reports_searches_still_to_do_and_leaves_out_free_and_disabled_connectors(self) -> None:
        cid = self.connector()
        self.connector("csv")
        with self.store.connection() as conn:
            self.watches.add_watch(conn, "Acme", "UNSEARCHED", ACTOR)
        rows = self.call("GET", "/api/supply/capacity").json
        self.assertEqual([r["connector_id"] for r in rows], [cid], "a file connector has no budget to plan")
        self.assertEqual(rows[0]["searches_pending"], 1)
        self.connectors.update(cid, actor=ACTOR, enabled=False)
        self.assertEqual(self.call("GET", "/api/supply/capacity").json, [])

    def test_capacity_is_for_readers(self) -> None:
        for role in ("admin", "designer", "qa"):
            self.assertEqual(self.call("GET", "/api/supply/capacity", role=role).status, 200, role)
        self.assertEqual(self.call("GET", "/api/supply/capacity", role="viewer").status, 403)


if __name__ == "__main__":
    unittest.main()

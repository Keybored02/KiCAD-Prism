"""Forecasts end to end: made from kept readings, stored, checked when their day comes, and shown only once the model has earned it.

Needs ``PRISM_DATABASE_URL``. Readings are written by hand; no distributor is called.
"""

from __future__ import annotations

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

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
START = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)
ADMIN = "admin@example.com"


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class ForecastDbTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_forecast
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database = database
        cls.user = AuthenticatedUser(email=ADMIN, name="admin", role="admin")
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_forecast_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_forecast.router)
        cls.patcher = mock.patch.object(supply_connectors, "service", cls.connectors)
        cls.patcher.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.patcher.stop()
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        from app.services.supply import forecast_load, forecast_price, parts, watches

        forecast_load.forget()
        forecast_price.forget()
        with self.store.connection() as conn:
            for table in ("forecast_checks", "forecasts", "forecast_models", "events", "stock_events", "samples", "offers", "listings", "watches", "part_tiers",
                          "part_insights", "part_summaries", "parts", "manufacturer_aliases", "manufacturers", "connectors", "bom_usage", "bom_usage_projects"):
                conn.execute(f"DELETE FROM {table}")
        self.cid = self.connectors.create(actor=ADMIN, provider="mouser", currency="EUR", display_name="Mouser", credentials={"api_key": "k"})["id"]
        self.other = self.connectors.create(actor=ADMIN, provider="digikey", storefront="IT", currency="EUR", display_name="DigiKey",
                                            credentials={"client_id": "c", "client_secret": "s"})["id"]
        with self.store.connection() as conn:
            self.part_id = parts.ensure_part(conn, "Acme", "FALL-1", ADMIN).id
            watches.add_watch(conn, "Acme", "FALL-1", ADMIN, tier=1)

    # --- helpers ----------------------------------------------------------

    def listing(self, connector_id, sku, part_id=None):
        listing_id = uuid.uuid4().hex
        with self.store.connection() as conn:
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) VALUES (%s, %s, %s, %s, 'x', 'Acme', 'exact')",
                (listing_id, connector_id, sku, part_id or self.part_id),
            )
        return listing_id

    def readings(self, listing_id, values, first_day, *, fetched_at, price="0.50"):
        with self.store.connection() as conn:
            for index, stock in enumerate(values):
                conn.execute(
                    "INSERT INTO samples (listing_id, sampled_at, stock, unit_price, currency, moq) VALUES (%s, %s, %s, %s, 'EUR', 1) ON CONFLICT DO NOTHING",
                    (listing_id, first_day + timedelta(days=index), stock, price),
                )
            conn.execute(
                "INSERT INTO offers (listing_id, fetched_at, stock, currency, price_breaks) VALUES (%s, %s, %s, 'EUR', '[[1, \"0.50\"]]'::jsonb) "
                "ON CONFLICT (listing_id) DO UPDATE SET fetched_at = EXCLUDED.fetched_at, stock = EXCLUDED.stock",
                (listing_id, fetched_at, values[-1]),
            )

    def falling(self, listing_id, end=START):
        """3,000 falling by 100 a day for 20 days, the last reading on ``end``: 1,000 left, 10 days to go."""

        self.readings(listing_id, [3000 - 100 * i for i in range(21)], end - timedelta(days=20), fetched_at=end)

    def rows(self, sql, *params):
        with self.store.connection() as conn:
            return [dict(row) for row in conn.execute(sql, params).fetchall()]

    # --- making and keeping -------------------------------------------------

    def test_a_falling_part_gets_its_forecasts_kept_and_the_little_a_list_needs(self) -> None:
        from app.services.supply import forecast_run

        self.falling(self.listing(self.cid, "FALL-SKU"))
        with self.store.connection() as conn:
            summary = forecast_run.run_part(conn, self.part_id, START)
        self.assertTrue(summary["available"])
        self.assertEqual(summary["runout"]["median_date"], (START + timedelta(days=10)).date().isoformat())
        self.assertEqual(summary["p_out_4w"], 1.0)
        kept = {row["target"]: row for row in self.rows("SELECT * FROM forecasts WHERE subject_id = %s", self.part_id)}
        self.assertTrue({"runout", "can_buy_4w", "can_buy_8w", "out_4w", "price_30", "price_90"} <= set(kept))
        self.assertEqual(kept["runout"]["horizon_days"], 10)
        self.assertEqual(kept["can_buy_4w"]["horizon_days"], 28)

    def test_asking_again_the_same_day_replaces_the_forecast_instead_of_adding_one(self) -> None:
        from app.services.supply import forecast_run

        self.falling(self.listing(self.cid, "FALL-SKU"))
        with self.store.connection() as conn:
            forecast_run.run_part(conn, self.part_id, START)
            forecast_run.run_part(conn, self.part_id, START)
        self.assertEqual(len(self.rows("SELECT id FROM forecasts WHERE target = 'runout'")), 1)

    def test_a_part_with_a_week_of_readings_or_less_has_none(self) -> None:
        from app.services.supply import forecast_run

        self.readings(self.listing(self.cid, "SHORT"), [900, 800, 700], START - timedelta(days=2), fetched_at=START)
        with self.store.connection() as conn:
            summary = forecast_run.run_part(conn, self.part_id, START)
        self.assertFalse(summary["available"])
        self.assertEqual(self.rows("SELECT id FROM forecasts WHERE target = 'runout'"), [])

    # --- checking ----------------------------------------------------------

    def test_a_forecast_is_checked_when_its_day_comes_and_the_model_learns_from_it(self) -> None:
        from app.services.supply import forecast_run, forecasting

        listing = self.listing(self.cid, "FALL-SKU")
        self.falling(listing)
        with self.store.connection() as conn:
            forecast_run.run_part(conn, self.part_id, START)
            self.assertEqual(forecast_run.check_due(conn, START + timedelta(days=3)), 0, "its day has not come")
        # What happened: stock fell to nothing on day 10, as said.
        self.readings(listing, [1000 - 100 * i for i in range(1, 16) if 1000 - 100 * i > 0] + [0] * 6, START + timedelta(days=1), fetched_at=START + timedelta(days=16))
        later = START + timedelta(days=16)
        with self.store.connection() as conn:
            checked = forecast_run.check_due(conn, later)
            states = forecasting.update_models(conn, later)
        self.assertEqual(checked, 1, "only the runout is due; the four-week ones are not")
        check = self.rows("SELECT c.observed, c.inside, c.void FROM forecast_checks c JOIN forecasts f ON f.id = c.forecast_id WHERE f.target = 'runout'")[0]
        self.assertEqual((check["observed"], check["inside"], check["void"]), (10.0, True, False))
        self.assertEqual(states["runout"], "learning", "one check is not enough to be shown")
        model = forecasting.model_states(self.store.connection().__enter__())["runout"]
        self.assertEqual((model["checks"], model["needs"]), (1, 40))

    def test_a_forecast_about_a_day_nobody_read_is_voided_not_judged(self) -> None:
        from app.services.supply import forecast_run

        listing = self.listing(self.cid, "FALL-SKU")
        self.falling(listing)
        with self.store.connection() as conn:
            forecast_run.run_part(conn, self.part_id, START)
            forecast_run.check_due(conn, START + timedelta(days=40))
        voided = self.rows("SELECT c.void FROM forecast_checks c JOIN forecasts f ON f.id = c.forecast_id WHERE f.target = 'runout'")
        self.assertEqual([row["void"] for row in voided], [True])

    def test_a_restock_before_the_runout_voids_that_check(self) -> None:
        from app.services.supply import forecast_run

        listing = self.listing(self.cid, "FALL-SKU")
        self.falling(listing)
        with self.store.connection() as conn:
            forecast_run.run_part(conn, self.part_id, START)
        self.readings(listing, [1000 - 100 * i for i in range(1, 5)] + [5000] * 14, START + timedelta(days=1), fetched_at=START + timedelta(days=16))
        with self.store.connection() as conn:
            forecast_run.check_due(conn, START + timedelta(days=16))
        row = self.rows("SELECT c.void FROM forecast_checks c JOIN forecasts f ON f.id = c.forecast_id WHERE f.target = 'runout'")[0]
        self.assertTrue(row["void"])

    # --- states ------------------------------------------------------------

    def seed_checks(self, target, rows):
        """Checks written straight in: (made_on offset, probability, inside, observed)."""

        from app.services.supply import forecasting

        with self.store.connection() as conn:
            for index, (probability, inside, observed) in enumerate(rows):
                made = (START - timedelta(days=400 - index)).date()
                fid = forecasting.store(conn, "part", self.part_id, target, made, 10, model="t", scope=str(index), low=1, high=2, median=1.5, probability=probability)
                forecasting.record_check(conn, fid, made, observed=observed, inside=inside)

    def test_a_model_is_shown_when_enough_checks_say_it_holds_and_paused_when_the_latest_say_it_does_not(self) -> None:
        from app.services.supply import forecasting

        self.seed_checks("runout", [(None, i % 5 != 0, 5.0) for i in range(45)])
        with self.store.connection() as conn:
            self.assertEqual(forecasting.update_models(conn, START)["runout"], "shown")
            first = forecasting.model_states(conn)["runout"]
        self.assertEqual((first["checks"], first["score"]), (45, 0.8))
        self.seed_checks("price_30", [(None, False, 1.0) for _ in range(45)])
        with self.store.connection() as conn:
            states = forecasting.update_models(conn, START)
            miss = forecasting.model_states(conn)["price_30"]
        self.assertEqual(states["price_30"], "learning", "never shown, so it is still learning, with its record said")
        self.assertIn("held 0%", miss["reason"])
        # The shown model starts missing: the last thirty checks all fall outside.
        with self.store.connection() as conn:
            for index in range(30):
                made = (START - timedelta(days=100 - index)).date()
                fid = forecasting.store(conn, "part", self.part_id, "runout", made, 10, model="t", scope=f"late{index}", low=1, high=2, median=1.5)
                forecasting.record_check(conn, fid, made, observed=9.0, inside=False)
            self.assertEqual(forecasting.update_models(conn, START)["runout"], "paused")

    def test_chances_are_judged_on_calibration(self) -> None:
        from app.services.supply import forecasting

        self.seed_checks("can_buy_4w", [(0.7, None, 1.0 if i % 10 < 7 else 0.0) for i in range(70)])
        with self.store.connection() as conn:
            self.assertEqual(forecasting.update_models(conn, START)["can_buy_4w"], "shown")
            curve = forecasting.reliability(conn, "can_buy_4w")
        self.assertEqual([(round(b["said"], 1), round(b["happened"], 1)) for b in curve], [(0.7, 0.7)])

    def test_a_backtest_replays_past_days_from_the_readings_up_to_each_and_checks_them(self) -> None:
        from app.services.supply import forecast_backtest, forecasting

        listing = self.listing(self.cid, "FALL-SKU")
        # 60 days: falling 100 a day to zero on day 30, then a restock of 5,000 and falling again.
        values = [3000 - 100 * i for i in range(31)] + [5000 - 100 * i for i in range(1, 30)]
        self.readings(listing, values, START - timedelta(days=59), fetched_at=START)
        with self.store.connection() as conn:
            result = forecast_backtest.run(conn, (START - timedelta(days=50)).date(), START + timedelta(days=1))
        checks = self.rows("SELECT COUNT(*) AS n FROM forecast_checks c JOIN forecasts f ON f.id = c.forecast_id WHERE f.target = 'runout' AND NOT c.void")
        self.assertGreater(result["kept"], 20)
        self.assertGreater(checks[0]["n"], 3, "the runouts made in the first falling run were judged")
        first = self.rows("SELECT made_on FROM forecasts WHERE target = 'can_buy_4w' ORDER BY made_on LIMIT 1")[0]["made_on"]
        self.assertEqual(first, (START - timedelta(days=50)).date())

    # --- the API ------------------------------------------------------------

    def get(self, path, query=""):
        return _request(self.app, "GET", path, user=self.user, query=query)

    def test_the_part_forecast_comes_as_dates_and_words_with_each_models_state(self) -> None:
        from app.services.supply import forecast_view

        self.falling(self.listing(self.cid, "FALL-SKU"))
        with self.store.connection() as conn:
            found = forecast_view.part(conn, self.part_id, START, quantity=100)
        self.assertTrue(found["available"])
        self.assertEqual(found["runout"]["median"], (START + timedelta(days=10)).date().isoformat())
        self.assertEqual(found["runout"]["state"]["state"], "learning")
        self.assertEqual(found["runout"]["state"]["needs"], 40)
        self.assertEqual(found["weeks"][0]["word"], "Almost certain", "100 can be bought next week")
        self.assertEqual(found["weeks"][3]["word"], "Very unlikely", "and not in a month")
        self.assertEqual(found["quantity"], 100)
        self.assertTrue(found["price"]["h90"]["flat"])
        self.assertEqual(found["path"][0]["day"], START.date().isoformat())

    def test_the_forecast_endpoint_and_the_track_record(self) -> None:
        self.falling(self.listing(self.cid, "FALL-SKU"), end=datetime.now(timezone.utc))
        reply = self.get(f"/api/supply/parts/{self.part_id}/forecast", "quantity=50")
        self.assertEqual(reply.status, 200, reply.text)
        self.assertEqual(reply.json["quantity"], 50)
        self.assertEqual(self.get("/api/supply/parts/nope/forecast").status, 404)
        record = self.get("/api/supply/forecasts/track-record").json
        self.assertEqual({m["target"] for m in record["models"]}, {"runout", "back_in", "out_4w", "can_buy_4w", "can_buy_8w", "price_30", "price_90", "lead_90", "eol_12"})
        self.assertTrue(all(m["state"] == "learning" for m in record["models"]))
        self.assertEqual(self.get(f"/api/supply/parts/{self.part_id}/forecast", "quantity=0").status, 422)

    # --- the alert ----------------------------------------------------------

    def test_the_likely_out_alert_waits_for_a_shown_model_and_two_runs_in_a_row(self) -> None:
        from app.services.supply import alerts, forecasting

        with self.store.connection() as conn:
            conn.execute("UPDATE part_tiers SET rate = 'daily' WHERE part_id = %s", (self.part_id,))
            for offset, probability in ((1, 0.8), (0, 0.9)):
                forecasting.store(conn, "part", self.part_id, "out_4w", (START - timedelta(days=offset)).date(), 28, model="t", probability=probability)
            self.assertEqual(alerts._likely_out(conn, [self.part_id]), {}, "the model is still learning")
            conn.execute("INSERT INTO forecast_models (target, state) VALUES ('out_4w', 'shown') ON CONFLICT (target) DO UPDATE SET state = 'shown'")
            self.assertEqual(alerts._likely_out(conn, [self.part_id])[self.part_id]["chance"], 0.8)
            forecasting.store(conn, "part", self.part_id, "out_4w", (START + timedelta(days=1)).date(), 28, model="t", probability=0.2)
            self.assertIsNone(alerts._likely_out(conn, [self.part_id])[self.part_id]["chance"], "one calm run clears it")

    # --- a project ----------------------------------------------------------

    def test_a_project_is_judged_on_every_line_and_names_what_holds_it_back(self) -> None:
        from app.services.supply import forecast_project

        self.falling(self.listing(self.cid, "FALL-SKU"))
        from app.services.supply import parts

        with self.store.connection() as conn:
            steady = parts.ensure_part(conn, "Acme", "STEADY-1", ADMIN).id
            conn.execute("INSERT INTO bom_usage_projects (project_id, project_name, revision_key, line_count, updated_at) VALUES ('p1', 'Board', 'r', 2, NOW())")
            for key, mpn in (("a", "FALL-1"), ("b", "STEADY-1"), ("c", "UNTRACKED")):
                conn.execute(
                    "INSERT INTO bom_usage (project_id, line_key, manufacturer, mpn, alias_key, match_key, quantity) VALUES ('p1', %s, 'Acme', %s, 'acme', %s, 2)",
                    (key, mpn, mpn.upper().replace("-", "")),
                )
            conn.execute("INSERT INTO watches (id, part_id, owner) VALUES ('w1', %s, 'x') ON CONFLICT DO NOTHING", (steady,)) if False else None
        steady_listing = self.listing(self.other, "STEADY-SKU", steady)
        self.readings(steady_listing, [9000] * 21, START - timedelta(days=20), fetched_at=START)
        with self.store.connection() as conn:
            conn.execute("INSERT INTO part_tiers (part_id, tier, rate, reasons) VALUES (%s, 1, 'daily', '[]'::jsonb) ON CONFLICT DO NOTHING", (steady,))
            small = forecast_project.forecast(conn, "p1", "", 100, START)
            big = forecast_project.forecast(conn, "p1", "", 600, START)
        self.assertTrue(small["available"])
        self.assertEqual(small["lines"], 3)
        self.assertEqual(small["unknown_lines"], 1, "the number nobody tracks is left out and counted")
        self.assertGreater(small["weeks"][1], 0.9, "200 pieces of the falling part are there next week")
        self.assertLess(small["weeks"][8], 0.1, "but not in two months")
        self.assertEqual(small["holding_back"][0]["mpn"], "FALL-1")
        self.assertLess(big["weeks"][2], small["weeks"][2] + 1e-9, "more boards are never easier")
        self.assertEqual(big["boards"], 600)


if __name__ == "__main__":
    unittest.main()

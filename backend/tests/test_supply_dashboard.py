"""The Dashboard's figures and the Insights page's counts, from the facts kept for each tracked part (plan section 15)."""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
NOW = datetime(2026, 3, 20, 12, 0, tzinfo=timezone.utc)


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class DashboardTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.postgres_database import database
        from app.services.supply import dashboard, insights_page, part_insights, parts_view, watches
        from app.services.supply.store import SupplyStore

        cls.database, cls.dashboard, cls.insights_page, cls.part_insights, cls.parts_view, cls.watches = (
            database, dashboard, insights_page, part_insights, parts_view, watches,
        )
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_dash_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()

    @classmethod
    def tearDownClass(cls) -> None:
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("part_insights", "figure_history", "samples", "offers", "listings", "watches", "part_tiers", "parts", "manufacturers", "connectors", "alerts"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO manufacturers (id, name, name_key) VALUES ('m1', 'Acme', 'acme')")
            conn.execute("INSERT INTO connectors (id, provider, storefront) VALUES ('c1', 'fake', 'a'), ('c2', 'fake', 'b')")

    def follow(self, mpn: str, stocks: list[int], holders: tuple[str, ...] = ("c1",)) -> str:
        """A tracked part with one reading a day for each stock figure, ending today, at each of the connectors."""

        with self.store.connection() as conn:
            record, _ = self.watches.add_watch(conn, "Acme", mpn, "seed@example.com")
            for connector in holders:
                listing = f"l-{mpn}-{connector}"
                conn.execute(
                    "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) VALUES (%s, %s, %s, %s, 'x', 'x', 'exact')",
                    (listing, connector, f"{mpn}-{connector}", record.part_id),
                )
                conn.execute("INSERT INTO offers (listing_id, fetched_at, stock, lead_time_days) VALUES (%s, %s, %s, 30)", (listing, NOW, stocks[-1]))
                for offset, stock in enumerate(stocks):
                    day = NOW - timedelta(days=len(stocks) - 1 - offset)
                    conn.execute("INSERT INTO samples (listing_id, sampled_at, stock) VALUES (%s, %s, %s)", (listing, day, stock))
            return record.part_id

    def test_the_kept_facts_say_when_stock_runs_out_and_who_holds_it(self) -> None:
        falling = self.follow("FALL-1", [1000, 900, 800, 700, 600, 500, 400, 300, 200])
        steady = self.follow("STEADY-1", [500] * 9, holders=("c1", "c2"))
        with self.store.connection() as conn:
            self.assertEqual(self.part_insights.renew(conn, NOW), 2)
            self.assertEqual(self.part_insights.renew(conn, NOW), 0, "fresh")
            kept = self.part_insights.of_parts(conn, [falling, steady])
            self.assertEqual((kept[falling]["trend"], kept[falling]["holders"], kept[falling]["lead_days"]), ("falling", 1, 30))
            self.assertEqual(kept[falling]["days_to_zero"], 2)
            self.assertEqual((kept[steady]["trend"], kept[steady]["holders"]), ("steady", 2))
            self.assertEqual(self.part_insights.matching(conn, "runs_out_2w"), {falling})
            self.assertEqual(self.part_insights.matching(conn, "one_distributor"), {falling})
            self.assertEqual(self.part_insights.matching(conn, "steady"), {steady})

    def test_the_parts_list_narrows_to_a_finding_and_carries_the_trend_line(self) -> None:
        falling = self.follow("FALL-1", [1000, 900, 800, 700, 600, 500, 400, 300, 200])
        self.follow("STEADY-1", [500] * 9, holders=("c1", "c2"))
        with self.store.connection() as conn:
            self.part_insights.renew(conn, NOW)
            found = self.parts_view.list_parts(conn, scope="watched", only="draining")
        self.assertEqual([item["id"] for item in found["items"]], [falling])
        self.assertEqual(len(found["items"][0]["spark"]), 9)
        self.assertEqual(found["items"][0]["runs_out_days"], 2)

    def test_the_dashboard_counts_the_runway_the_holders_and_each_figure_once_a_day(self) -> None:
        self.follow("FALL-1", [1000, 900, 800, 700, 600, 500, 400, 300, 200])
        self.follow("STEADY-1", [500] * 9, holders=("c1", "c2"))
        self.follow("GONE-1", [0, 0, 0])
        with self.store.connection() as conn:
            self.part_insights.renew(conn, NOW)
            self.assertEqual(self.dashboard.snapshot_figures(conn, NOW), 6)
            self.assertEqual(self.dashboard.snapshot_figures(conn, NOW), 0, "stored once a day")
            result = self.dashboard.build(conn, NOW)
        self.assertEqual(result["figures"]["watched"], 3)
        self.assertEqual(result["figure_history"]["watched"], [3])
        self.assertEqual(result["runway"]["out_now"], 1)
        self.assertEqual(result["runway"]["runs_out_2w"], 1)
        self.assertEqual(result["runway"]["steady"], 1)
        self.assertEqual(result["holders"]["none"], 1)
        self.assertEqual(result["holders"]["one"], 1)
        self.assertEqual(result["holders"]["two"], 1)
        self.assertEqual(sum(item["count"] for item in result["statuses"]), 3)

    def test_the_insights_page_counts_findings_and_draws_only_parts_with_a_rate_and_a_lead_time(self) -> None:
        falling = self.follow("FALL-1", [1000, 900, 800, 700, 600, 500, 400, 300, 200])
        self.follow("STEADY-1", [500] * 9)
        with self.store.connection() as conn:
            self.part_insights.renew(conn, NOW)
            page = self.insights_page.build(conn)
        self.assertEqual(page["tracked"], 2)
        self.assertEqual(page["counts"]["draining"], 1)
        self.assertEqual([(point["part_id"], point["days_to_zero"], point["lead_days"]) for point in page["scatter"]], [(falling, 2, 30)])
        self.assertEqual(page["scatter_missing"], {"no_rate": 1, "no_lead_time": 0})
        self.assertEqual(page["distributors"]["repricing"], [])


if __name__ == "__main__":
    unittest.main()

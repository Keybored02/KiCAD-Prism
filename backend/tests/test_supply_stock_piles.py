"""Stock of a distributor's listings of one part: cut tape and custom reel are one pile, any other packaging adds."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply import stock  # noqa: E402


def row(provider: str, packaging: str | None, count: int, connector: str = "c1") -> dict:
    return {"connector_id": connector, "provider": provider, "stock": count, "marketplace": False, "packaging": packaging, "fetched_at": 0}


class PileTests(unittest.TestCase):
    def test_cut_tape_and_custom_reel_are_one_pile_and_a_full_reel_adds(self) -> None:
        # Farnell's shapes in the dev data: the same 11,140 on both, and a reel of its own in some parts.
        self.assertEqual(stock.connector_stock("farnell", [row("farnell", "cut_tape", 11140), row("farnell", "custom_reel", 11140)]), 11140)
        self.assertEqual(stock.connector_stock("farnell", [row("farnell", "cut_tape", 11140), row("farnell", "custom_reel", 11140), row("farnell", "tape_reel", 5000)]), 16140)
        self.assertEqual(stock.connector_stock("farnell", [row("farnell", "cut_tape", 2264), row("farnell", "custom_reel", 2250)]), 2264, "the largest of the pile")

    def test_named_packagings_each_add(self) -> None:
        self.assertEqual(stock.connector_stock("mouser", [row("mouser", "tray", 100), row("mouser", "tube", 50), row("mouser", None, 7)]), 157)
        self.assertEqual(stock.connector_stock("farnell", [row("farnell", "cut_tape", 300), row("farnell", "tape_reel", 4000)]), 4300)

    def test_an_unknown_packaging_joins_the_cut_tape_pile_so_a_guess_never_doubles_stock(self) -> None:
        self.assertEqual(stock.connector_stock("farnell", [row("farnell", "cut_tape", 300), row("farnell", "unknown", 300)]), 300)
        self.assertEqual(stock.connector_stock("farnell", [row("farnell", "unknown", 50)]), 50)
        self.assertEqual(stock.connector_stock("farnell", [row("farnell", "other", 80), row("farnell", None, 90), row("farnell", "tray", 10)]), 100)

    def test_a_provider_that_pools_its_stock_counts_the_largest_of_all(self) -> None:
        self.assertEqual(stock.connector_stock("digikey", [row("digikey", "cut_tape", 900), row("digikey", "tape_reel", 900), row("digikey", "custom_reel", 400)]), 900)

    def test_a_part_adds_across_distributors_and_leaves_out_marketplace_and_other_packaging_than_a_watch_counts(self) -> None:
        rows = [row("farnell", "cut_tape", 100), row("farnell", "custom_reel", 100), row("tme", "cut_tape", 30, "c2"), {**row("tme", "tray", 500, "c2"), "marketplace": True}]
        self.assertEqual(stock.aggregate(rows).total, 130)
        self.assertEqual(stock.aggregate(rows, "custom_reel").total, 100)

    def test_the_sql_for_what_counts_names_the_providers_a_pick_limits(self) -> None:
        sql = stock.counted_listing_sql()
        self.assertIn("'lcsc'", sql)
        self.assertIn("'jlcpcb'", sql)
        self.assertNotIn("'farnell'", sql)


if __name__ == "__main__":
    unittest.main()

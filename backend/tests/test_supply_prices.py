"""Price moves: the cheapest price per day and when a rise counts. No database."""

from __future__ import annotations

import sys
import unittest
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply import prices  # noqa: E402

TODAY = date(2026, 3, 1)


def points(*values, currency="EUR", every=1, end=TODAY):
    return [(end - timedelta(days=every * (len(values) - 1 - i)), Decimal(v), currency) for i, v in enumerate(values)]


class PriceTrendTests(unittest.TestCase):
    def test_the_first_and_latest_price_make_the_move(self) -> None:
        result = prices.trend(points("1.00", "1.10", "1.25", every=5), TODAY)
        self.assertEqual(result, {"currency": "EUR", "was": "1", "now": "1.25", "change_percent": 25.0, "days": 10})

    def test_too_few_too_close_or_too_old_says_nothing(self) -> None:
        self.assertIsNone(prices.trend(points("1.00"), TODAY))
        self.assertIsNone(prices.trend(points("1.00", "2.00", every=3), TODAY), "six days is under a week")
        self.assertIsNone(prices.trend(points("1.00", "2.00", every=10, end=TODAY - timedelta(days=5)), TODAY), "last reading is old")

    def test_a_fall_is_reported_as_a_negative_change(self) -> None:
        self.assertEqual(prices.trend(points("2.00", "1.00", every=10), TODAY)["change_percent"], -50.0)

    def test_the_series_keeps_the_cheapest_per_day_in_the_main_currency(self) -> None:
        day = TODAY
        mixed = [(day, Decimal("1.20"), "EUR"), (day, Decimal("1.10"), "EUR"), (day, Decimal("9"), "USD"),
                 (day - timedelta(days=1), Decimal("1.00"), "EUR")]
        self.assertEqual(prices.series(mixed), [(day - timedelta(days=1), Decimal("1.00"), "EUR"), (day, Decimal("1.10"), "EUR")])
        self.assertEqual(prices.series([]), [])


if __name__ == "__main__":
    unittest.main()

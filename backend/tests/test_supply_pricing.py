"""Unit price at a reference quantity, and the part status rules around missing data."""

from __future__ import annotations

import sys
import unittest
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply import pricing  # noqa: E402
from app.services.supply.part_status import PROBLEM_GONE, PROBLEM_NOT_FOUND, part_problem, part_status  # noqa: E402
from app.services.supply.vocabulary import Lifecycle, Status  # noqa: E402

D = Decimal


class PricingTests(unittest.TestCase):
    def test_order_quantity_respects_minimum_and_multiple(self) -> None:
        self.assertEqual(pricing.order_quantity(100, 1, 1), 100)
        self.assertEqual(pricing.order_quantity(100, 3000, 1), 3000)
        self.assertEqual(pricing.order_quantity(100, 1, 250), 250)
        self.assertEqual(pricing.order_quantity(100, 10, 3), 102)
        self.assertEqual(pricing.order_quantity(0, 0, 0), 1, "never less than one piece")

    def test_the_break_at_or_below_the_order_quantity_applies(self) -> None:
        breaks = [(1, D("0.50")), (10, D("0.40")), (100, D("0.30")), (1000, D("0.20"))]
        self.assertEqual(pricing.unit_price_at(breaks), D("0.30"))
        self.assertEqual(pricing.unit_price_at(breaks, wanted=99), D("0.40"))
        self.assertEqual(pricing.unit_price_at(breaks, wanted=5000), D("0.20"))
        self.assertEqual(pricing.unit_price_at(breaks, moq=1000), D("0.20"), "a minimum order moves the quantity up")

    def test_no_break_means_no_price(self) -> None:
        self.assertIsNone(pricing.unit_price_at([]))
        self.assertIsNone(pricing.unit_price_at([(500, D("0.10"))]), "the cheapest break starts above what would be ordered")
        self.assertEqual(pricing.unit_price_at([(500, D("0.10"))], moq=500), D("0.10"))


class StatusProblemTests(unittest.TestCase):
    def test_a_problem_makes_an_unread_part_an_error(self) -> None:
        self.assertEqual(part_status(None, None, Lifecycle.UNKNOWN), Status.UNKNOWN)
        self.assertEqual(part_status(None, None, Lifecycle.UNKNOWN, PROBLEM_NOT_FOUND), Status.ERROR)
        self.assertEqual(part_status(None, None, Lifecycle.UNKNOWN, PROBLEM_GONE), Status.ERROR)

    def test_when_the_problem_applies(self) -> None:
        def problem(**facts):
            return part_problem(**{"has_counted": False, "has_gone": False, "has_listings": False, "was_searched": False, **facts})

        self.assertIsNone(problem(), "never asked: just not read yet")
        self.assertEqual(problem(was_searched=True), PROBLEM_NOT_FOUND)
        self.assertIsNone(problem(was_searched=True, has_listings=True), "candidates waiting in Review")
        self.assertEqual(problem(has_gone=True, has_listings=True), PROBLEM_GONE)
        self.assertIsNone(problem(has_counted=True, has_gone=True), "a live listing remains")
        self.assertIsNone(problem(has_counted=True, was_searched=True))


if __name__ == "__main__":
    unittest.main()

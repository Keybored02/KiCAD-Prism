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


class QuotedQuantityTests(unittest.TestCase):
    def test_a_price_quoted_up_to_a_quantity_does_not_price_a_larger_order(self) -> None:
        quoted = [(1, D("0.50"))]
        self.assertEqual(pricing.unit_price_at(quoted, wanted=1, up_to=1), D("0.50"))
        self.assertIsNone(pricing.unit_price_at(quoted, wanted=100, up_to=1), "Avnet quoted one piece, not a hundred")
        self.assertIsNone(pricing.unit_price_at(quoted, wanted=1, moq=10, up_to=1), "the minimum order is past the quote")
        self.assertEqual(pricing.unit_price_at(quoted, wanted=100), D("0.50"), "without a limit the last break holds")

    def test_an_offer_can_only_limit_its_price_at_or_above_its_last_break(self) -> None:
        from datetime import datetime, timezone

        from app.services.supply.models import Offer, PriceBreak

        now = datetime(2026, 3, 1, tzinfo=timezone.utc)
        Offer(provider="avnet", sku="S", mpn="M", manufacturer="A", stock=1, fetched_at=now, currency="EUR",
              price_breaks=(PriceBreak(10, D("1")),), price_up_to=10)
        with self.assertRaises(ValueError):
            Offer(provider="avnet", sku="S", mpn="M", manufacturer="A", stock=1, fetched_at=now, currency="EUR",
                  price_breaks=(PriceBreak(10, D("1")),), price_up_to=5)
        with self.assertRaises(ValueError):
            Offer(provider="avnet", sku="S", mpn="M", manufacturer="A", stock=1, fetched_at=now, price_up_to=5)

    def test_a_headline_and_a_purchase_leave_a_quote_out_beyond_its_quantity(self) -> None:
        from app.services.supply import bom_lookup, headline_price
        from app.services.supply.fx import Rates

        offer = {"marketplace": False, "currency": "EUR", "price_breaks": [[1, "0.50"]], "moq": 1, "order_multiple": 1, "price_up_to": 1,
                 "stock": 5000, "connector_id": "c1", "connector_name": "Avnet", "provider": "avnet", "sku": "S", "product_url": ""}
        rates = Rates(None, {})
        self.assertIsNotNone(headline_price.quote(offer, 1, "EUR", rates))
        self.assertIsNone(headline_price.quote(offer, 100, "EUR", rates))
        self.assertIsNone(bom_lookup._best_purchase([offer], 100, rates, "EUR"), "no price for 100 from a quote for one")  # noqa: SLF001


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

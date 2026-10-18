"""The ways of buying one crystal (``ABS07-32.768KHZ-7-T``), from what DigiKey, Farnell and Mouser answered on 2026-10-18."""

from __future__ import annotations

import json
import unittest
from datetime import datetime, timezone
from pathlib import Path

from app.services.supply.offer_lines import offer_lines
from app.services.supply.providers import digikey, farnell, mouser

FIXTURES = Path(__file__).parent / "fixtures" / "supply"
NOW = datetime(2026, 10, 18, tzinfo=timezone.utc)


def _answers(name: str) -> list[dict]:
    return [call["answer"] for call in json.loads((FIXTURES / f"{name}_live_abs07_32_768khz_7_t.json").read_text(encoding="utf-8"))["calls"]]


def _row(offer, connector_id: str, name: str, order_multiple: int | None = None) -> dict:
    """An offer as the list reads it from the database."""

    return {
        "connector_id": connector_id, "provider": offer.provider, "connector_name": name, "sku": offer.sku, "stock": offer.stock,
        "marketplace": False, "packaging": offer.packaging.value, "reel_size": offer.reel_size, "packaging_inferred": False,
        "moq": offer.moq, "order_multiple": order_multiple or offer.order_multiple, "currency": offer.currency, "product_url": offer.product_url,
        "price_breaks": [[item.quantity, str(item.unit_price)] for item in offer.price_breaks],
    }


class OfferLineTests(unittest.TestCase):
    def test_digikey_cut_tape_and_digi_reel_are_one_way_of_buying_and_the_reel_is_another(self) -> None:
        answer = next(a for a in _answers("digikey") if "Product" in a)
        rows = [_row(digikey._offer(sku, answer, NOW), "dk", "DigiKey") for sku in ("535-9543-1-ND", "535-9543-2-ND", "535-9543-6-ND")]  # noqa: SLF001
        lines = offer_lines(rows)
        self.assertEqual([(line["packaging"], line["moq"]) for line in lines], [("cut_tape", 1), ("tape_reel", 3000)])
        self.assertEqual(lines[0]["skus"], ["535-9543-1-ND", "535-9543-6-ND"], "both numbers are kept")
        self.assertEqual(lines[0]["also_packaging"], ["custom_reel"])
        self.assertEqual(lines[1]["skus"], ["535-9543-2-ND"])

    def test_mouser_one_number_with_a_reel_in_its_price_table_is_cut_tape_and_a_reel(self) -> None:
        answer = _answers("mouser")[0]
        part = answer["SearchResults"]["Parts"][0]
        offer = mouser._offer(part["MouserPartNumber"], part, NOW)  # noqa: SLF001
        self.assertEqual((offer.packaging.value, offer.reel_size), ("several", 3000))
        lines = offer_lines([_row(offer, "mo", "Mouser")])
        self.assertEqual([(line["packaging"], line["moq"], line["reel_size"]) for line in lines], [("cut_tape", 1, None), ("tape_reel", 3000, 3000)])
        self.assertEqual(lines[0]["also_packaging"], ["custom_reel"])
        self.assertTrue(all(item[0] < 3000 for item in lines[0]["price_breaks"]))
        self.assertTrue(all(item[0] >= 3000 for item in lines[1]["price_breaks"]))
        self.assertEqual({line["sku"] for line in lines}, {"815-ABS07-32.768K7T"})

    def test_farnell_keeps_cut_tape_re_reel_and_reel_apart(self) -> None:
        products = farnell._products(_answers("farnell")[0])  # noqa: SLF001
        rows = [_row(farnell._offer(p["sku"], p, "EUR", NOW, "it.farnell.com"), "fa", "Farnell") for p in products]  # noqa: SLF001
        lines = offer_lines(rows)
        self.assertEqual([(line["sku"], line["packaging"], line["moq"]) for line in lines], [
            ("1838935", "cut_tape", 5), ("1838935RL", "custom_reel", 100), ("3573150", "tape_reel", 3000),
        ])
        # The distributor answers the same prices for the cut length and the re-reeled one; nothing is invented to tell them apart.
        self.assertEqual(lines[0]["price_breaks"], lines[1]["price_breaks"])

    def test_different_prices_or_stock_are_never_merged(self) -> None:
        base = {
            "connector_id": "c", "provider": "digikey", "connector_name": "DigiKey", "stock": 5, "marketplace": False, "reel_size": None,
            "packaging_inferred": False, "moq": 1, "order_multiple": 1, "currency": "EUR", "product_url": "", "price_breaks": [[1, "0.5"]],
        }
        rows = [{**base, "sku": "A-1-ND", "packaging": "cut_tape"}, {**base, "sku": "A-6-ND", "packaging": "custom_reel", "price_breaks": [[1, "0.6"]]}]
        self.assertEqual(len(offer_lines(rows)), 2)
        rows = [{**base, "sku": "A-1-ND", "packaging": "cut_tape"}, {**base, "sku": "A-6-ND", "packaging": "custom_reel", "stock": 4}]
        self.assertEqual(len(offer_lines(rows)), 2)
        rows = [{**base, "sku": "T-1", "packaging": "tube"}, {**base, "sku": "T-2", "packaging": "tube"}]
        self.assertEqual(len(offer_lines(rows)), 2, "only a length of tape is one way of buying under two numbers")


if __name__ == "__main__":
    unittest.main()

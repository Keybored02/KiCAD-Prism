"""LCSC adapter. The answers are trimmed copies of what wmsc.lcsc.com returned for C2040 and C25804."""

from __future__ import annotations

import sys
import unittest
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.supply.providers import lcsc, registry, unrecognised  # noqa: E402
from app.services.supply.providers.base import ProviderConfig, ProviderError  # noqa: E402
from test_supply_distributors import FakeClient  # noqa: E402

NOW = datetime(2026, 10, 12, 12, 0, tzinfo=timezone.utc)
PATH = "/ftps/wm/product/detail"


def product(**change):
    base = {
        "productCode": "C2040", "productModel": "RP2040", "brandNameEn": "Raspberry Pi",
        "productIntroEn": "ARM Cortex-M0+ 32 Bit 133MHz LQFN-56(7x7) Microcontrollers ",
        "pdfUrl": "https://datasheet.lcsc.com/datasheet/pdf/3dad1d8f987a4e00bfc677055df1f959.pdf?productCode=C2040",
        "minBuyNumber": 1, "split": 1, "stockNumber": 48974, "productCycle": "normal", "isRohsCert": None,
        "productPriceList": [
            {"ladder": 1, "productPrice": "0.9", "usdPrice": 0.9},
            {"ladder": 10, "productPrice": "0.8", "usdPrice": 0.8},
        ],
    }
    return base | change


def answer(result):
    return {"code": 200, "msg": None, "result": result, "ok": True}


def provider(client):
    return lcsc.LcscProvider(
        ProviderConfig(connector_id="c1"), client=client, clock=lambda: NOW,
        monotonic=lambda: 0.0, sleep=lambda _s: None,
    )


class LcscTests(unittest.TestCase):
    def setUp(self) -> None:
        unrecognised._seen.clear()

    def test_the_spec_needs_no_credentials(self) -> None:
        spec = registry.get_spec("lcsc")
        self.assertEqual((spec.required_credentials, spec.max_batch), ((), 1))

    def test_an_offer_carries_stock_prices_and_the_page(self) -> None:
        client = FakeClient({PATH: [answer(product())]})
        (offer,) = provider(client).get_offers(["c2040"])
        self.assertEqual(client.calls[0]["params"], {"productCode": "C2040"})
        self.assertEqual((offer.sku, offer.mpn, offer.manufacturer, offer.stock), ("C2040", "RP2040", "Raspberry Pi", 48974))
        self.assertEqual(offer.currency, "USD")
        self.assertEqual([(b.quantity, b.unit_price) for b in offer.price_breaks], [(1, Decimal("0.9")), (10, Decimal("0.8"))])
        self.assertEqual(offer.product_url, "https://www.lcsc.com/product-detail/C2040.html")
        self.assertFalse(offer.discontinued)
        self.assertIsNone(offer.rohs)

    def test_order_rules_and_rohs(self) -> None:
        client = FakeClient({PATH: [answer(product(productCode="C25804", minBuyNumber=100, split=100, stockNumber=0, isRohsCert=True))]})
        (offer,) = provider(client).get_offers(["C25804"])
        self.assertEqual((offer.moq, offer.order_multiple, offer.stock, offer.rohs), (100, 100, 0, True))

    def test_a_dropped_part_is_marked_and_a_new_word_is_logged_once(self) -> None:
        client = FakeClient({PATH: [
            answer(product(productCycle="stop_product", stockNumber=0)),
            answer(product(productCycle="mystery")),
            answer(product(productCycle="mystery")),
        ]})
        dropped, odd, again = (provider(client).get_offers(["C2040"])[0] for _ in range(3))
        self.assertTrue(dropped.discontinued)
        self.assertFalse(odd.discontinued)
        self.assertEqual(len(unrecognised._seen), 1)
        self.assertEqual(again.stock, 48974)

    def test_an_unknown_code_is_left_out(self) -> None:
        client = FakeClient({PATH: [answer(None)]})
        self.assertEqual(provider(client).get_offers(["C99999999"]), [])

    def test_a_failed_answer_is_an_error(self) -> None:
        client = FakeClient({PATH: [{"code": 500, "msg": "Something went wrong", "result": None}]})
        with self.assertRaises(ProviderError):
            provider(client).get_offers(["C2040"])

    def test_only_an_lcsc_number_can_be_looked_up(self) -> None:
        client = FakeClient({PATH: [answer(product())]})
        self.assertEqual(provider(client).lookup_mpn("RP2040"), [])
        self.assertEqual(client.calls, [])
        (match,) = provider(client).lookup_mpn(" c2040 ")
        self.assertEqual((match.sku, match.mpn, match.manufacturer), ("C2040", "RP2040", "Raspberry Pi"))
        self.assertEqual(match.product_url, "https://www.lcsc.com/product-detail/C2040.html")

    def test_part_data_has_the_description_and_datasheet(self) -> None:
        client = FakeClient({PATH: [answer(product()), answer(product())]})
        (match,) = provider(client).lookup_mpn("C2040")
        data = provider(client).get_part_data(match)
        self.assertIn("Cortex-M0+", data.description)
        self.assertTrue(data.datasheet_url.startswith("https://datasheet.lcsc.com/"))


if __name__ == "__main__":
    unittest.main()

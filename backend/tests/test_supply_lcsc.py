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
SEARCH_PATH = "/api/eda/product/search"


def product(**change):
    base = {
        "productCode": "C2040", "productModel": "RP2040", "brandNameEn": "Raspberry Pi",
        "productIntroEn": "ARM Cortex-M0+ 32 Bit 133MHz LQFN-56(7x7) Microcontrollers ",
        "pdfUrl": "https://datasheet.lcsc.com/datasheet/pdf/3dad1d8f987a4e00bfc677055df1f959.pdf?productCode=C2040",
        "minBuyNumber": 1, "split": 1, "stockNumber": 48974, "productCycle": "normal", "isRohsCert": None,
        "paramVOList": [{"paramNameEn": "Resistance", "paramValueEn": "10kΩ"}, {"paramNameEn": "Tolerance", "paramValueEn": "±1%"}],
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

    def test_a_refusal_is_the_bot_filter_not_a_rejected_credential(self) -> None:
        from app.services.supply.providers.base import AuthError, Blocked

        client = FakeClient({PATH: [AuthError("HTTP 403")]})
        with self.assertRaises(Blocked):
            provider(client).get_offers(["C2040"])

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

    def test_a_price_without_dollars_is_taken_only_when_the_answer_names_dollars(self) -> None:
        euro = product(productPriceList=[{"ladder": 1, "productPrice": "0.8"}], currencyType="EUR")
        (offer,) = provider(FakeClient({PATH: [answer(euro)]})).get_offers(["C2040"])
        self.assertEqual((offer.price_breaks, offer.currency), ((), ""), "a price in another currency is never read as dollars")
        named = product(productPriceList=[{"ladder": 1, "productPrice": "0.8"}], currencyType="USD")
        (offer,) = provider(FakeClient({PATH: [answer(named)]})).get_offers(["C2040"])
        self.assertEqual([(b.quantity, b.unit_price) for b in offer.price_breaks], [(1, Decimal("0.8"))])

    def test_the_alternate_parts_lcsc_lists_are_kept_with_their_package(self) -> None:
        listed = product(alternatePartList=[
            {"productCode": "c52953348", "productModel": "74AHC1G08GV", "brandNameEn": "MDD", "encapStandard": "SOT-23-5L"},
            {"productCode": "C1", "productModel": " ", "brandNameEn": "x"},
            "not an item",
        ])
        (offer,) = provider(FakeClient({PATH: [answer(listed)]})).get_offers(["C2040"])
        self.assertEqual([(a.manufacturer, a.mpn, a.sku, a.note) for a in offer.alternates], [("MDD", "74AHC1G08GV", "C52953348", "SOT-23-5L")])
        (plain,) = provider(FakeClient({PATH: [answer(product())]})).get_offers(["C2040"])
        self.assertEqual(plain.alternates, (), "LCSC carries the list, so no alternates is something it said")

    def test_a_connector_in_euros_asks_lcsc_for_euros_and_takes_its_own_euro_price(self) -> None:
        euro = product(currencyType="EUR", productPriceList=[
            {"ladder": 1, "productPrice": "0.9", "usdPrice": 0.9, "currencyPrice": 0.83},
            {"ladder": 10, "productPrice": "0.8", "usdPrice": 0.8, "currencyPrice": 0.74},
        ])
        client = FakeClient({PATH: [answer(euro)]})
        asking = lcsc.LcscProvider(ProviderConfig(connector_id="c1", currency="eur"), client=client, clock=lambda: NOW, monotonic=lambda: 0.0, sleep=lambda _s: None)
        (offer,) = asking.get_offers(["C2040"])
        self.assertEqual(client.calls[0]["headers"], {"Cookie": "currencyCode=EUR"})
        self.assertEqual((offer.currency, [(b.quantity, b.unit_price) for b in offer.price_breaks]), ("EUR", [(1, Decimal("0.83")), (10, Decimal("0.74"))]))

    def test_when_lcsc_answers_in_dollars_anyway_the_dollar_price_is_used(self) -> None:
        client = FakeClient({PATH: [answer(product(currencyType="USD"))]})
        asking = lcsc.LcscProvider(ProviderConfig(connector_id="c1", currency="EUR"), client=client, clock=lambda: NOW, monotonic=lambda: 0.0, sleep=lambda _s: None)
        (offer,) = asking.get_offers(["C2040"])
        self.assertEqual((offer.currency, offer.price_breaks[0].unit_price), ("USD", Decimal("0.9")))
        plain = FakeClient({PATH: [answer(product())]})
        provider(plain).get_offers(["C2040"])
        self.assertNotIn("headers", plain.calls[0], "no cookie for a dollar connector")

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

    def test_a_manufacturer_number_is_searched_at_easyeda(self) -> None:
        # Trimmed from what easyeda.com answered for LM358DR on 2026-10-12.
        found = {"code": 200, "msg": None, "result": {"total": 3, "productList": [
            {"number": "C5423", "mpn": "LM358DR", "manufacturer": "TI", "package": "SOIC-8", "stock": 144115},
            {"number": "C350551", "mpn": "LM358DRG4", "manufacturer": "TI", "package": "SOIC-8", "stock": 0},
            {"number": "", "mpn": "broken", "manufacturer": "X"},
        ]}}
        client = FakeClient({SEARCH_PATH: [found]})
        matches = provider(client).lookup_mpn("LM358DR", "Texas Instruments")
        self.assertEqual(client.calls[0]["params"], {"keyword": "LM358DR", "currentPage": 1, "pageSize": lcsc.SEARCH_PAGE_SIZE})
        self.assertEqual([(m.sku, m.mpn, m.manufacturer) for m in matches], [("C5423", "LM358DR", "TI"), ("C350551", "LM358DRG4", "TI")], "a longer form of the number is kept")
        self.assertEqual(matches[0].product_url, "https://www.lcsc.com/product-detail/C5423.html")

    def test_a_search_that_finds_nothing_or_fails(self) -> None:
        empty = {"code": 200, "msg": None, "result": {"total": 0, "productList": []}}
        self.assertEqual(provider(FakeClient({SEARCH_PATH: [empty]})).lookup_mpn("NOSUCH-1"), [])
        with self.assertRaises(ProviderError):
            provider(FakeClient({SEARCH_PATH: [{"code": 500, "result": None}]})).lookup_mpn("LM358DR")

    def test_an_lcsc_number_is_read_directly(self) -> None:
        client = FakeClient({PATH: [answer(product())]})
        (match,) = provider(client).lookup_mpn(" c2040 ")
        self.assertEqual((match.sku, match.mpn, match.manufacturer), ("C2040", "RP2040", "Raspberry Pi"))
        self.assertEqual(match.product_url, "https://www.lcsc.com/product-detail/C2040.html")
        self.assertTrue(match.datasheet_url.startswith("https://datasheet.lcsc.com/"))
        self.assertEqual(match.parameters, (("Resistance", "10kΩ"), ("Tolerance", "±1%")))

    def test_part_data_has_the_description_and_datasheet(self) -> None:
        client = FakeClient({PATH: [answer(product()), answer(product())]})
        (match,) = provider(client).lookup_mpn("C2040")
        data = provider(client).get_part_data(match)
        self.assertIn("Cortex-M0+", data.description)
        self.assertTrue(data.datasheet_url.startswith("https://datasheet.lcsc.com/"))


if __name__ == "__main__":
    unittest.main()

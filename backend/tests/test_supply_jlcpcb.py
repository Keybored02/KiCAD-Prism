"""JLCPCB adapter. The C25804 answer is a real recording; the LM358DR one is built from it (see its _source)."""

from __future__ import annotations

import json
import sys
import unittest
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.supply.providers import jlcpcb, registry  # noqa: E402
from app.services.supply.providers.base import AuthError, Blocked, ProviderConfig  # noqa: E402
from test_supply_distributors import FakeClient  # noqa: E402

NOW = datetime(2026, 10, 15, 12, 0, tzinfo=timezone.utc)
PATH = "/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList"
FIXTURES = Path(__file__).resolve().parent / "fixtures" / "supply"


def recorded(name: str) -> dict:
    return json.loads((FIXTURES / f"jlcpcb_live_{name}.json").read_text(encoding="utf-8"))["answer"]


def provider(client):
    return jlcpcb.JlcpcbProvider(ProviderConfig(connector_id="c1"), client=client, clock=lambda: NOW, monotonic=lambda: 0.0, sleep=lambda _s: None)


class JlcpcbTests(unittest.TestCase):
    def test_the_spec_is_assembly_only_needs_no_key_and_waits_for_the_terms(self) -> None:
        spec = registry.get_spec("jlcpcb")
        self.assertEqual((spec.required_credentials, spec.max_batch, spec.assembly_only), ((), 1, True))
        self.assertEqual(spec.default_daily_budget, 1000)

    def test_an_offer_keeps_assembly_stock_apart_with_prices_and_the_part_class(self) -> None:
        client = FakeClient({PATH: [recorded("c25804")]})
        (offer,) = provider(client).get_offers(["c25804"])
        self.assertEqual(client.calls[0]["json"], {"keyword": "C25804", "currentPage": 1, "pageSize": jlcpcb.PAGE_SIZE})
        self.assertEqual((offer.sku, offer.mpn, offer.manufacturer, offer.stock), ("C25804", "0603WAF1002T5E", "UNI-ROYAL(Uniroyal Elec)", 32272410))
        self.assertTrue(offer.marketplace, "assembly stock is never added to a total")
        self.assertEqual(offer.currency, "USD")
        self.assertEqual((offer.price_breaks[0].quantity, offer.price_breaks[0].unit_price), (1, Decimal("0.0052")))
        self.assertEqual(dict(offer.facts), {"jlc_library": "Basic"})
        self.assertTrue(offer.rohs)
        self.assertEqual(offer.product_url, "https://jlcpcb.com/partdetail/26547-0603WAF1002T5E/C25804")
        self.assertTrue(offer.datasheet_url.endswith("C25804.pdf"))

    def test_a_search_keeps_only_the_same_number_and_leaves_consignment_entries_out(self) -> None:
        client = FakeClient({PATH: [recorded("lm358dr")]})
        matches = provider(client).lookup_mpn("LM358DR")
        self.assertEqual([(m.sku, m.manufacturer) for m in matches], [("C5423", "Texas Instruments")])

    def test_a_search_brings_the_whole_offer_with_each_match_so_it_is_also_a_read(self) -> None:
        client = FakeClient({PATH: [recorded("lm358dr")]})
        matches = provider(client).lookup_mpn("LM358DR")
        self.assertTrue(matches)
        self.assertTrue(all(match.offer is not None and match.offer.sku == match.sku and match.offer.marketplace for match in matches))
        self.assertTrue(jlcpcb.SPEC.search_reads_offers)

    def test_extended_and_preferred_are_facts(self) -> None:
        client = FakeClient({PATH: [recorded("lm358dr")]})
        (offer,) = provider(client).get_offers(["C5423"])
        self.assertEqual(dict(offer.facts), {"jlc_library": "Extended", "jlc_preferred": "Preferred"})

    def test_a_part_nobody_lists_gives_nothing(self) -> None:
        client = FakeClient({PATH: [recorded("zzznosuchpart123"), recorded("zzznosuchpart123")]})
        self.assertEqual(provider(client).lookup_mpn("ZZZNOSUCHPART123"), [])
        self.assertEqual(provider(client).get_offers(["C1"]), [])

    def test_a_refusal_is_a_block_not_a_bad_key(self) -> None:
        class Refusing:
            def request_json(self, *args, **kwargs):
                raise AuthError("rejected (HTTP 403)")

        with self.assertRaises(Blocked):
            provider(Refusing()).lookup_mpn("LM358DR")

    def test_a_json_refusal_is_tried_once_more_and_only_a_second_one_is_a_block(self) -> None:
        client = FakeClient({PATH: [AuthError("rejected (HTTP 403)"), recorded("lm358dr")]})
        self.assertTrue(provider(client).lookup_mpn("LM358DR"), "the retry answered")
        self.assertEqual(len(client.calls), 2)
        twice = FakeClient({PATH: [AuthError("rejected (HTTP 403)"), AuthError("rejected (HTTP 403)")]})
        with self.assertRaises(Blocked):
            provider(twice).lookup_mpn("LM358DR")
        self.assertEqual(len(twice.calls), 2)

    def test_a_retry_is_a_call_the_provider_says_it_made(self) -> None:
        retried = provider(FakeClient({PATH: [AuthError("rejected (HTTP 403)"), recorded("lm358dr")]}))
        retried.lookup_mpn("LM358DR")
        self.assertEqual(retried.extra_calls, 1)
        clean = provider(FakeClient({PATH: [recorded("lm358dr")]}))
        clean.lookup_mpn("LM358DR")
        self.assertEqual(clean.extra_calls, 0, "reset at each public call")
        refused = provider(FakeClient({PATH: [AuthError("rejected (HTTP 403)"), AuthError("rejected (HTTP 403)")]}))
        with self.assertRaises(Blocked):
            refused.lookup_mpn("LM358DR")
        self.assertEqual(refused.extra_calls, 1, "the second request counts even when it was refused too")

    def test_a_web_page_is_a_block_at_once_and_the_client_keeps_no_cookies(self) -> None:
        page = FakeClient({PATH: [Blocked("answered a web page (HTTP 403)")]})
        with self.assertRaises(Blocked):
            provider(page).lookup_mpn("LM358DR")
        self.assertEqual(len(page.calls), 1, "no retry")
        from app.services.supply.http_client import SafeHttpClient

        self.assertFalse(SafeHttpClient(("jlcpcb.com",), transport=object(), keep_cookies=False)._keep_cookies)  # noqa: SLF001

    def test_each_call_waits_between_three_quarters_and_one_and_a_half_times_the_pace(self) -> None:
        sleeps = []
        clock = {"t": 0.0}

        def sleep(seconds):
            sleeps.append(seconds)
            clock["t"] += seconds

        from app.services.supply import pacing

        pacer = pacing.Pacer(jlcpcb.PACE_SECONDS, monotonic=lambda: clock["t"], sleep=sleep)
        for _ in range(60):
            pacer.wait()
        low, high = 0.75 * jlcpcb.PACE_SECONDS, 1.5 * jlcpcb.PACE_SECONDS
        self.assertTrue(all(low <= gap <= high for gap in sleeps), (min(sleeps), max(sleeps)))


if __name__ == "__main__":
    unittest.main()

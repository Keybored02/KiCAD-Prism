"""Saving calls: DigiKey reads a part's packagings from one answer, and Mouser and TME look up several numbers per call.

The provider tests need no database. The poller and discoverer tests need ``PRISM_DATABASE_URL``.
"""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.supply.providers import digikey, mouser, tme  # noqa: E402
from test_supply_digikey_farnell import NOW, TOKEN, dk_details, dk_product, dk_provider, variation  # noqa: E402
from test_supply_distributors import FakeClient, mouser_provider, product as tme_product, ok as tme_ok, tme_provider  # noqa: E402
from test_supply_distributors import TOKEN as TME_TOKEN  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
DETAILS = "/products/v4/search/{}/productdetails"


class DigiKeyGroupTests(unittest.TestCase):
    def three_packagings(self):
        return dk_product([
            variation("296-1395-1-ND", "Cut Tape (CT)", stock=5000),
            variation("296-1395-2-ND", "Tape & Reel (TR)", stock=2500),
            variation("296-1395-6-ND", "Digi-Reel", stock=5000),
        ])

    def test_all_packagings_of_a_product_come_from_one_answer(self) -> None:
        skus = ["296-1395-1-ND", "296-1395-2-ND", "296-1395-6-ND"]
        client = FakeClient({"/v1/oauth2/token": [TOKEN], DETAILS.format(skus[0]): [dk_details(self.three_packagings())]})
        provider = dk_provider(client)
        offers = provider.get_offers(skus)
        self.assertEqual([(o.sku, o.stock) for o in offers], [(skus[0], 5000), (skus[1], 2500), (skus[2], 5000)])
        self.assertEqual(provider.last_batch_calls, 1)
        self.assertEqual(len([call for call in client.calls if call["path"].endswith("productdetails")]), 1)

    def test_a_number_the_answer_does_not_list_gets_a_call_of_its_own(self) -> None:
        other = dk_product([variation("999-1-ND", "Tray", stock=7)])
        client = FakeClient({
            "/v1/oauth2/token": [TOKEN],
            DETAILS.format("296-1395-1-ND"): [dk_details(self.three_packagings())],
            DETAILS.format("999-1-ND"): [dk_details(other)],
        })
        provider = dk_provider(client)
        offers = provider.get_offers(["296-1395-1-ND", "999-1-ND", "296-1395-2-ND"])
        self.assertEqual([o.sku for o in offers], ["296-1395-1-ND", "999-1-ND", "296-1395-2-ND"])
        self.assertEqual(provider.last_batch_calls, 2)

    def test_the_spec_says_listings_are_read_by_part(self) -> None:
        self.assertTrue(digikey.SPEC.groups_by_part)
        self.assertEqual(digikey.SPEC.search_batch, 1)


class MouserSearchBatchTests(unittest.TestCase):
    def part(self, number, maker="Texas Instruments", sku=None):
        return {"MouserPartNumber": sku or f"595-{number}", "ManufacturerPartNumber": number, "Manufacturer": maker,
                "Description": "d", "ProductDetailUrl": "https://www.mouser.it/x", "DataSheetUrl": "", "ProductAttributes": []}

    def test_twelve_numbers_take_two_calls_and_each_part_goes_to_its_number(self) -> None:
        numbers = [f"LM{n}DR" for n in range(358, 370)]
        first = {"Errors": [], "SearchResults": {"Parts": [self.part(n) for n in numbers[:10]] + [self.part("LM358DRG4")]}}
        second = {"Errors": [], "SearchResults": {"Parts": [self.part(numbers[10]), self.part(numbers[10], "Other Maker", "123-LM368DR")]}}
        client = FakeClient({"/api/v1/search/partnumber": [first, second]})
        found = mouser_provider(client).lookup_mpns(numbers + ["AB"])
        self.assertEqual(len(client.calls), 2)
        self.assertEqual(client.calls[0]["json"]["SearchByPartRequest"]["mouserPartNumber"], "|".join(numbers[:10]))
        self.assertEqual([m.sku for m in found["LM358DR"]], ["595-LM358DR"])
        self.assertEqual(len(found["LM368DR"]), 2, "two makers of one number are both returned")
        self.assertEqual(found["LM369DR"], [], "asked, nothing found")
        self.assertEqual(found["AB"], [], "too short to ask, but still answered")
        self.assertNotIn("LM358DRG4", found)

    def test_the_spec_names_the_batch(self) -> None:
        self.assertEqual(mouser.SPEC.search_batch, 10)


class TmeSearchBatchTests(unittest.TestCase):
    def test_several_numbers_are_one_call_and_a_product_goes_only_to_numbers_it_lists(self) -> None:
        client = FakeClient({"/auth/token": [TME_TOKEN], "/products": [tme_ok([
            tme_product("LM358D-TI", mpns=("LM358DR", "LM358D")),
            tme_product("LM324-TI", mpns=("LM324DR",)),
            tme_product("OTHER", mpns=("ZZZ",)),
        ])]})
        found = tme_provider(client).lookup_mpns(["LM358DR", "LM324DR", "NOTHING"])
        search = [call for call in client.calls if call["path"] == "/products"]
        self.assertEqual(len(search), 1)
        self.assertEqual([value for key, value in search[0]["params"] if key == "mpns[]"], ["LM358DR", "LM324DR", "NOTHING"])
        self.assertEqual([(m.sku, m.mpn) for m in found["LM358DR"]], [("LM358D-TI", "LM358DR")])
        self.assertEqual([m.sku for m in found["LM324DR"]], ["LM324-TI"])
        self.assertEqual(found["NOTHING"], [])

    def test_the_spec_names_the_batch(self) -> None:
        self.assertEqual(tme.SPEC.search_batch, 50)


class Clock:
    def __init__(self) -> None:
        self.now = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)

    def __call__(self) -> datetime:
        return self.now


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class SchedulingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.postgres_database import database
        from app.services.supply import discoverer, poller, watches
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.models import Offer, PartMatch
        from app.services.supply.providers import registry
        from app.services.supply.providers.base import ProviderSpec
        from app.services.supply.providers.fake import FakeProvider
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.discoverer, cls.poller, cls.watches = database, discoverer, poller, watches
        cls.Offer, cls.PartMatch, cls.registry = Offer, PartMatch, registry
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_batch_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        base = ProviderSpec(
            key="demo_grouped", label="Demo grouped", capabilities=frozenset({"offers", "search"}), max_batch=1,
            stock_pooling="separate", credential_fields=(), factory=lambda config: FakeProvider(config),
            default_daily_budget=100, groups_by_part=True, search_batch=3,
        )
        registry.register(base, replace=True)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.registry.unregister("demo_grouped")
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("listings", "watches", "parts", "manufacturer_aliases", "manufacturers", "connectors", "quota_ledger", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
        self.clock = Clock()
        self.cid = self.connectors.create(actor="a@example.com", provider="demo_grouped", currency="EUR", interactive_reserve_pct=10)["id"]
        self.asked: list = []

    def rows(self, sql, *params):
        with self.store.connection() as conn:
            return [dict(r) for r in conn.execute(sql, params).fetchall()]

    def watch(self, mpn):
        with self.store.connection() as conn:
            return self.watches.add_watch(conn, "Acme", mpn, "a@example.com", tier=1)[0]

    def listing(self, part_id, sku):
        with self.store.connection() as conn:
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) "
                "VALUES (%s, %s, %s, %s, 'x', 'Acme', 'exact')", (uuid.uuid4().hex, self.cid, sku, part_id))

    def spent(self):
        return sum(r["spent"] for r in self.rows("SELECT spent FROM quota_ledger WHERE connector_id = %s", self.cid))

    def provider(self, calls_per_group=1):
        outer = self

        class Stub:
            last_batch_calls = 1

            def get_offers(self, skus):
                outer.asked.append(list(skus))
                self.last_batch_calls = calls_per_group
                return [outer.Offer(provider="demo_grouped", sku=s, mpn="x", manufacturer="Acme", stock=10, fetched_at=outer.clock.now) for s in skus]

            def lookup_mpns(self, mpns):
                outer.asked.append(list(mpns))
                from app.services.supply.identity import match_key
                return {match_key(m): ([] if m.startswith("NONE") else
                        [outer.PartMatch(provider="demo_grouped", sku=f"S-{m}", mpn=m, manufacturer="Acme")]) for m in mpns}

            def lookup_mpn(self, mpn, manufacturer=None):
                outer.asked.append([mpn])
                return []

        return Stub()

    # --- polling by part ------------------------------------------------------

    def test_listings_of_a_part_are_read_in_one_call_and_siblings_come_with_it(self) -> None:
        a, b = self.watch("AAA"), self.watch("BBB")
        for sku in ("A-1", "A-2", "A-3"):
            self.listing(a.part_id, sku)
        for sku in ("B-1", "B-2"):
            self.listing(b.part_id, sku)
        summary = self.poller.Poller(self.connectors, store=self.store, provider_for=lambda _c: self.provider(), clock=self.clock).poll_connector(self.cid)
        self.assertEqual(sorted(sorted(group) for group in self.asked), [["A-1", "A-2", "A-3"], ["B-1", "B-2"]])
        self.assertEqual((summary.calls, summary.polled, self.spent()), (2, 5, 2))
        self.assertEqual(len(self.rows("SELECT 1 FROM poll_state")), 5)

    def test_a_listing_not_yet_due_is_read_with_its_due_sibling(self) -> None:
        a = self.watch("AAA")
        self.listing(a.part_id, "A-1")
        self.listing(a.part_id, "A-2")
        poller = self.poller.Poller(self.connectors, store=self.store, provider_for=lambda _c: self.provider(), clock=self.clock)
        poller.poll_connector(self.cid)
        with self.store.connection() as conn:
            conn.execute("UPDATE poll_state SET next_poll_at = %s WHERE listing_id = (SELECT id FROM listings WHERE sku = 'A-1')", (self.clock.now - timedelta(hours=1),))
        self.asked.clear()
        poller.poll_connector(self.cid)
        self.assertEqual([sorted(group) for group in self.asked], [["A-1", "A-2"]], "the sibling is not left for a call of its own")

    def test_extra_calls_a_group_needed_are_counted(self) -> None:
        a = self.watch("AAA")
        self.listing(a.part_id, "A-1")
        self.listing(a.part_id, "A-2")
        summary = self.poller.Poller(self.connectors, store=self.store, provider_for=lambda _c: self.provider(calls_per_group=2), clock=self.clock).poll_connector(self.cid)
        self.assertEqual((summary.calls, self.spent()), (2, 2))

    def test_capacity_counts_a_grouped_provider_in_parts(self) -> None:
        from app.services.supply import capacity

        a = self.watch("AAA")
        for sku in ("A-1", "A-2", "A-3"):
            self.listing(a.part_id, sku)
        with self.store.connection() as conn:
            (row,) = [item for item in capacity.connector_capacity(conn) if item["connector_id"] == self.cid]
        self.assertEqual(row["listings"], 3)
        self.assertAlmostEqual(row["calls_per_day"], 1.0, places=3, msg="one call a day reads all of a part's listings")

    # --- searching by group ---------------------------------------------------

    def test_a_group_of_parts_is_one_search_call_and_each_part_is_recorded(self) -> None:
        for mpn in ("AAA", "BBB", "CCC", "DDD"):
            self.watch(mpn)
        self.watch("NONE-1")
        summary = self.discoverer.Discoverer(self.connectors, store=self.store, provider_for=lambda _c: self.provider(), clock=self.clock).run(self.cid)
        self.assertEqual(len(self.asked), 2, "five parts in groups of three")
        self.assertEqual((summary.searched, summary.listings, self.spent()), (5, 4, 2))
        self.assertEqual(len(self.rows("SELECT 1 FROM discovery_runs")), 5)
        self.assertEqual(len(self.rows("SELECT 1 FROM listings WHERE match_state = 'exact'")), 4)

    def test_the_budget_is_charged_per_group(self) -> None:
        for mpn in ("AAA", "BBB", "CCC", "DDD"):
            self.watch(mpn)
        with self.store.connection() as conn:
            conn.execute("UPDATE connectors SET daily_budget = 1")
        summary = self.discoverer.Discoverer(self.connectors, store=self.store, provider_for=lambda _c: self.provider(), clock=self.clock).run(self.cid)
        self.assertEqual((summary.searched, summary.stopped), (3, "budget"))

    def test_tier_one_parts_are_searched_again_after_two_weeks_when_not_found_and_a_month_when_found(self) -> None:
        self.watch("AAA")
        self.watch("NONE-1")
        discoverer = self.discoverer.Discoverer(self.connectors, store=self.store, provider_for=lambda _c: self.provider(), clock=self.clock)
        discoverer.run(self.cid)
        self.clock.now += timedelta(days=8)
        self.assertEqual(discoverer.run(self.cid).searched, 0, "nobody is searched for again within the week")
        self.clock.now += timedelta(days=7)
        self.assertEqual(discoverer.run(self.cid).searched, 1, "the part nobody carried")
        self.clock.now += timedelta(days=16)
        self.assertEqual(discoverer.run(self.cid).searched, 2, "the part that was found, after a month, and the other one again")


if __name__ == "__main__":
    unittest.main()

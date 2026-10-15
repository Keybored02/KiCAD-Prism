"""Tracking tiers: which parts are followed, at what rate, and why.

Needs ``PRISM_DATABASE_URL``. Uses a disposable schema.
"""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
ACTOR = "ana@example.com"
NOW = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)


def component(reference: str, maker: str, mpn: str) -> dict:
    return {
        "componentUid": f"cmp:{reference}", "reference": reference,
        "fields": {"Manufacturer": maker, "Manufacturer Part Number": mpn, "DNP": "No", "In BOM": "Yes"},
    }


class PureTests(unittest.TestCase):
    def test_tier_one_is_daily_and_tier_two_is_weekly_or_monthly(self) -> None:
        from app.services.supply import tracking

        self.assertEqual(tracking.check_tier(1, "weekly"), (1, "daily"))
        self.assertEqual(tracking.check_tier(2, "monthly"), (2, "monthly"))
        for tier, rate in ((2, "daily"), (3, "weekly"), (0, "daily"), ("1", "daily")):
            with self.assertRaises(tracking.TrackingError):
                tracking.check_tier(tier, rate)


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class TrackingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.postgres_database import database
        from app.services.supply import component_watches, parts, tracking, usage, watches
        from app.services.supply.store import SupplyStore

        cls.database, cls.parts, cls.tracking, cls.usage, cls.watches = database, parts, tracking, usage, watches
        cls.component_watches = component_watches
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_track_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()

    @classmethod
    def tearDownClass(cls) -> None:
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("bom_usage_projects", "tracked_projects", "listings", "watches", "parts", "manufacturer_aliases",
                          "manufacturers", "component_watches", "connectors", "audit_events"):
                conn.execute(f"DELETE FROM {table}")

    def project(self, project_id: str, base: list[dict], variants: dict[str, list[dict]] | None = None) -> None:
        lines = self.usage.lines_from_components(base)
        named = {name: self.usage.lines_from_components(items) for name, items in (variants or {}).items()}
        with self.store.connection() as conn:
            self.usage.store_project(conn, project_id, project_id, "r1", lines, NOW, variant_lines=named)

    def track(self, project_id: str, variants=("",), **kwargs):
        with self.store.connection() as conn:
            return self.tracking.track_project(conn, project_id, variants, ACTOR, **kwargs)

    def tier(self, maker: str, mpn: str):
        with self.store.connection() as conn:
            part = self.parts.find_part(conn, maker, mpn)
            return self.tracking.tier_of(conn, part.id) if part else None

    def test_tracking_a_project_puts_its_parts_in_tier_one_with_the_project_as_reason(self) -> None:
        self.project("p1", [component("R1", "Acme", "R-1"), component("C1", "Acme", "C-1")])
        result = self.track("p1")
        self.assertEqual((result["parts_created"], result["skipped"]), (2, []))
        got = self.tier("Acme", "R-1")
        self.assertEqual((got["tier"], got["rate"]), (1, "daily"))
        self.assertEqual(got["reasons"], [{"kind": "project", "ref": "p1", "variant": ""}])

    def test_only_the_chosen_variants_are_tracked(self) -> None:
        self.project(
            "p1", [component("R1", "Acme", "R-1")],
            {"Fit extra": [component("R1", "Acme", "R-1"), component("U9", "Acme", "U-9")]},
        )
        self.track("p1")
        self.assertIsNone(self.tier("Acme", "U-9"), "the variant was not chosen")
        self.track("p1", variants=("", "Fit extra"))
        self.assertEqual(self.tier("Acme", "U-9")["tier"], 1)
        self.track("p1", variants=("Fit extra",))
        self.assertEqual(self.tier("Acme", "R-1")["reasons"], [{"kind": "project", "ref": "p1", "variant": "Fit extra"}])

    def test_an_unknown_variant_or_unread_project_is_refused(self) -> None:
        self.project("p1", [component("R1", "Acme", "R-1")])
        with self.assertRaises(self.tracking.TrackingError):
            self.track("p1", variants=("nope",))
        with self.assertRaises(self.tracking.TrackingError):
            self.track("never-read")

    def test_untracking_drops_parts_nothing_else_follows_and_keeps_the_rest(self) -> None:
        self.project("p1", [component("R1", "Acme", "R-1"), component("C1", "Acme", "C-1")])
        self.track("p1")
        with self.store.connection() as conn:
            self.watches.add_watch(conn, "Acme", "C-1", ACTOR)
            self.assertTrue(self.tracking.untrack_project(conn, "p1", ACTOR))
        self.assertIsNone(self.tier("Acme", "R-1"))
        kept = self.tier("Acme", "C-1")
        self.assertEqual((kept["tier"], kept["rate"], [r["kind"] for r in kept["reasons"]]), (2, "weekly", ["person"]))

    def test_the_highest_tier_wins_and_every_source_is_a_reason(self) -> None:
        self.project("p1", [component("R1", "Acme", "R-1")])
        with self.store.connection() as conn:
            watch, _ = self.watches.add_watch(conn, "Acme", "R-1", ACTOR, tier=2, rate="monthly")
        self.assertEqual(self.tier("Acme", "R-1")["rate"], "monthly")
        self.track("p1")
        got = self.tier("Acme", "R-1")
        self.assertEqual((got["tier"], got["rate"]), (1, "daily"))
        self.assertEqual(sorted(r["kind"] for r in got["reasons"]), ["person", "project"])
        with self.store.connection() as conn:
            self.tracking.untrack_project(conn, "p1", ACTOR)
        self.assertEqual(self.tier("Acme", "R-1")["rate"], "monthly", "back to the person's choice")
        with self.store.connection() as conn:
            self.watches.update_watch(conn, watch.id, ACTOR, tier=1)
        self.assertEqual(self.tier("Acme", "R-1")["tier"], 1)

    def test_a_person_adding_a_watch_never_lowers_one_and_a_weekly_beats_a_monthly(self) -> None:
        with self.store.connection() as conn:
            self.watches.add_watch(conn, "Acme", "R-1", ACTOR, tier=1)
            self.watches.add_watch(conn, "Acme", "R-1", ACTOR, tier=2, rate="monthly")
            self.watches.add_watch(conn, "Acme", "R-2", ACTOR, tier=2, rate="monthly")
            self.watches.add_watch(conn, "Acme", "R-2", ACTOR, tier=2, rate="weekly")
        self.assertEqual(self.tier("Acme", "R-1")["tier"], 1)
        self.assertEqual(self.tier("Acme", "R-2")["rate"], "weekly")

    def test_removing_a_watch_leaves_tier_three(self) -> None:
        with self.store.connection() as conn:
            watch, _ = self.watches.add_watch(conn, "Acme", "R-1", ACTOR)
            self.watches.remove_watch(conn, watch.id, ACTOR)
        self.assertIsNone(self.tier("Acme", "R-1"))

    def test_a_component_watch_follows_its_tier_and_its_alternates_follow_tier_two(self) -> None:
        identities = lambda ids: {i: ("Acme", "OWN-1") for i in ids}  # noqa: E731
        with self.store.connection() as conn:
            self.component_watches.set_watch(conn, "cmp-1", ACTOR, identities, include_alternates=False, tier=1)
        got = self.tier("Acme", "OWN-1")
        self.assertEqual((got["tier"], [r["kind"] for r in got["reasons"]]), (1, ["component"]))

    def test_recompute_writes_nothing_when_nothing_changed(self) -> None:
        self.project("p1", [component("R1", "Acme", "R-1")])
        self.track("p1")
        with self.store.connection() as conn:
            self.assertEqual(self.tracking.recompute(conn), {"added": 0, "changed": 0, "removed": 0})

    def test_a_new_revision_brings_its_new_parts_into_tier_one(self) -> None:
        self.project("p1", [component("R1", "Acme", "R-1")])
        self.track("p1")
        lines = self.usage.lines_from_components([component("R1", "Acme", "R-1"), component("R2", "Acme", "R-2")])
        with self.store.connection() as conn:
            self.usage.store_project(conn, "p1", "p1", "r2", lines, NOW)
            self.assertEqual(self.tracking.sync_projects(conn), {"parts_created": 1})
            self.assertEqual(self.tracking.sync_projects(conn), {"parts_created": 0})
        self.assertEqual(self.tier("Acme", "R-2")["tier"], 1)

    def test_the_migration_puts_existing_watches_in_tier_two_and_turns_a_packaging_policy_into_a_pick(self) -> None:
        from app.services.supply import schema_migrations

        with self.store.connection() as conn:
            connector = "mig-c"
            conn.execute("INSERT INTO connectors (id, provider, display_name) VALUES (%s, 'fake', 'Sim')", (connector,))
            watch, _ = self.watches.add_watch(conn, "Acme", "OLD-1", ACTOR, packaging="tape_reel")
            for sku, packaging in (("B-CT", "cut_tape"), ("A-REEL", "tape_reel"), ("C-REEL", "tape_reel")):
                conn.execute(
                    "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state, packaging) "
                    "VALUES (%s, %s, %s, %s, 'x', 'Acme', 'exact', %s)", (sku, connector, sku, watch.part_id, packaging))
            # Back to how the data looked before tiers: a watch with a packaging policy and nothing derived from it.
            conn.execute("DELETE FROM part_tiers")
            conn.execute("DELETE FROM packaging_picks")
            conn.execute("UPDATE watches SET origin = 'legacy'")
            schema_migrations._m035_tracking(conn)
            tier = self.tracking.tier_of(conn, watch.part_id)
            picks = conn.execute("SELECT listing_id, picked_by FROM packaging_picks").fetchall()
        self.assertEqual((tier["tier"], tier["rate"], [r["kind"] for r in tier["reasons"]]), (2, "weekly", ["legacy"]))
        self.assertEqual([(r["listing_id"], r["picked_by"]) for r in picks], [("A-REEL", "migration")], "the first listing of that packaging, by SKU")

    def test_a_part_without_a_manufacturer_is_skipped(self) -> None:
        self.project("p1", [component("R1", "", "R-1"), component("R2", "Acme", "R-2")])
        result = self.track("p1")
        self.assertEqual([item["reason"] for item in result["skipped"]], ["no_manufacturer"])
        with self.store.connection() as conn:
            self.assertEqual(self.tracking.counts(conn), {"tier1": 1, "tier2": 0})


if __name__ == "__main__":
    unittest.main()

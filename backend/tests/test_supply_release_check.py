"""The supply check before a release, and the snapshot frozen at publish. Needs ``PRISM_DATABASE_URL``."""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from supply_api_helpers import request as _request  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
NOW = datetime.now(timezone.utc)


def lines(components):
    from app.services.supply import usage

    return usage.lines_from_components(components)


def component(reference, maker="", mpn="", **fields):
    values = {"Manufacturer": maker, "Manufacturer Part Number": mpn, "DNP": "No", "In BOM": "Yes", **fields}
    return {"reference": reference, "fields": values}


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply tests")
class ReleaseCheckTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_release
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply import parts, release_check, sources
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.parts, cls.release_check, cls.sources = database, parts, release_check, sources
        cls.users = {
            role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role)
            for role in ("viewer", "qa", "designer", "admin")
        }
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_release_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_release.router)
        supply_connectors.register_validation_redaction(cls.app)
        cls.patcher = mock.patch.object(supply_connectors, "service", cls.connectors)
        cls.patcher.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.patcher.stop()
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("component_sources", "waivers", "listings", "watches", "parts", "manufacturer_aliases", "manufacturers", "connectors", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO manufacturers (id, name, name_key) VALUES ('m1', 'Acme', 'acme')")
        self.cid = self.connectors.create(actor="seed@example.com", provider="fake", currency="EUR", display_name="Sim", interactive_reserve_pct=0)["id"]

    def part(self, mpn: str, *, stock: int, lifecycle: str = "active") -> str:
        with self.store.connection() as conn:
            part = self.parts.ensure_part(conn, "Acme", mpn, "seed@example.com")
            listing_id = uuid.uuid4().hex
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) VALUES (%s, %s, %s, %s, 'x', 'Acme', 'exact')",
                (listing_id, self.cid, f"S-{mpn}", part.id))
            conn.execute("INSERT INTO offers (listing_id, fetched_at, stock, lifecycle) VALUES (%s, %s, %s, %s)", (listing_id, NOW, stock, lifecycle))
        return part.id

    def bom(self):
        return [
            component("R1", "Acme", "GOOD-1"), component("R2", "Acme", "GOOD-1"),
            component("U1", "Acme", "OBS-1"),
            component("C1", "Acme", "UNKNOWN-9"),
            component("J1"),
        ]

    def test_the_check_reports_health_the_parts_that_need_a_look_and_what_is_not_tracked(self) -> None:
        self.part("GOOD-1", stock=5000)
        self.part("OBS-1", stock=0, lifecycle="obsolete")
        with self.store.connection() as conn:
            result = self.release_check.check(conn, lines(self.bom()), NOW)
        self.assertEqual((result["parts"], result["tracked"], result["not_tracked"]), (3, 2, 1), "a line with no number is not a line")
        self.assertEqual(result["status"], "fatal")
        self.assertEqual(result["needing_a_look"], 1)
        (attention,) = result["attention"]
        self.assertEqual((attention["mpn"], attention["status"]), ("OBS-1", "fatal"))
        self.assertIn("obsolete", {f["check"] for f in attention["findings"]})
        good = next(row for row in result["lines"] if row["mpn"] == "GOOD-1")
        self.assertEqual((good["quantity"], good["status"]), (2, "ok"))
        self.assertLessEqual(result["health"], 4.0, "a fatal line caps the BOM")

    def test_a_waived_finding_no_longer_needs_a_look(self) -> None:
        self.part("OBS-1", stock=500, lifecycle="obsolete")
        from app.services.supply.assessment import waivers
        from app.services.supply.assessment.checks import Finding
        from app.services.supply.vocabulary import Status

        with self.store.connection() as conn:
            part_id = conn.execute("SELECT id FROM parts").fetchone()["id"]
            waivers.propose(conn, part_id, Finding("obsolete", Status.FATAL, "x", "obsolete"), "Last-time stock bought", "qa@example.com", approver=True)
            result = self.release_check.check(conn, lines([component("U1", "Acme", "OBS-1")]), NOW)
        self.assertEqual((result["needing_a_look"], result["status"]), (0, "ok"))
        self.assertEqual(result["lines"][0]["waived"], 1)

    def test_a_draft_that_cannot_be_built_does_not_cost_the_snapshot(self) -> None:
        self.part("GOOD-1", stock=5000)
        with self.store.connection() as conn, mock.patch.object(self.release_check.compliance_draft, "build", side_effect=RuntimeError("boom")):
            made = self.release_check.freeze(conn, "prj_1", "bld_nodraft", "vx", "c" * 40, "qa@example.com", lines([component("R1", "Acme", "GOOD-1")]), {}, NOW)
            snapshot = self.release_check.get_snapshot(conn, "prj_1", "bld_nodraft")
        self.assertIsNotNone(made)
        self.assertEqual((snapshot["status"], snapshot["compliance"]), ("ok", None))

    def test_the_snapshot_keeps_the_check_and_the_approved_parts_and_can_never_change(self) -> None:
        self.part("GOOD-1", stock=5000)
        with self.store.connection() as conn:
            self.sources.add_source(conn, "cmp-1", "Acme", "ALT-1", "qa@example.com", approver=True)
            self.sources.add_source(conn, "cmp-1", "Acme", "ALT-2", "designer@example.com", approver=False)
            ids = {("acme", "GOOD1"): "cmp-1"}
            first = self.release_check.freeze(conn, "prj_1", "bld_1", "v1", "a" * 40, "qa@example.com", lines([component("R1", "Acme", "GOOD-1")]), ids, NOW)
            again = self.release_check.freeze(conn, "prj_1", "bld_1", "v1", "a" * 40, "qa@example.com", [], {}, NOW)
            snapshot = self.release_check.get_snapshot(conn, "prj_1", "bld_1")
        self.assertIsNotNone(first)
        self.assertIsNone(again, "a build is frozen once")
        self.assertEqual((snapshot["tag"], snapshot["status"], snapshot["assessment"]["parts"]), ("v1", "ok", 1))
        self.assertEqual([(a["mpn"], a["approval"]) for a in snapshot["avl"]["cmp-1"]["alternates"]], [("ALT-1", "approved")])
        draft = snapshot["compliance"]
        self.assertEqual([(item["mpn"], item["quantity"]) for item in draft["parts"]], [("GOOD-1", 1)])
        project = SimpleNamespace(id="prj_1", name="One")
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=project):
            frozen = _request(self.app, "GET", "/api/supply/projects/prj_1/releases/bld_1/compliance", user=self.users["qa"])
            as_csv = _request(self.app, "GET", "/api/supply/projects/prj_1/releases/bld_1/compliance", user=self.users["qa"], query="format=csv")
            missing = _request(self.app, "GET", "/api/supply/projects/prj_1/releases/nope/compliance", user=self.users["qa"])
            with self.store.connection() as conn:
                conn.execute("ALTER TABLE release_snapshots DISABLE TRIGGER trg_release_snapshots_frozen")
                conn.execute("UPDATE release_snapshots SET compliance = NULL")
                conn.execute("ALTER TABLE release_snapshots ENABLE TRIGGER trg_release_snapshots_frozen")
            old = _request(self.app, "GET", "/api/supply/projects/prj_1/releases/bld_1/compliance", user=self.users["qa"])
        self.assertEqual((frozen.status, frozen.json["tag"], len(frozen.json["draft"]["parts"])), (200, "v1", 1))
        self.assertEqual((as_csv.status, as_csv.headers["content-type"].startswith("text/csv")), (200, True))
        self.assertIn("GOOD-1", as_csv.text)
        self.assertEqual((missing.status, old.status), (404, 404))
        with self.store.connection() as conn, self.assertRaises(Exception) as caught:
            conn.execute("UPDATE release_snapshots SET tag = 'v2'")
        self.assertIn("cannot be changed", str(caught.exception))
        with self.assertRaises(self.release_check.SnapshotNotFound), self.store.connection() as conn:
            self.release_check.get_snapshot(conn, "prj_1", "missing")

    def request(self, path: str, role: str = "designer", query: str = ""):
        return _request(self.app, "GET", f"/api/supply/projects/{path}", user=self.users[role], query=query)

    BOM_CSV = "Reference,Qty,Manufacturer,MPN\nR1 R2,2,Acme,GOOD-1\nU1,1,Acme,OBS-1\nJ1,1,,\n"

    def test_the_endpoint_checks_the_bom_the_release_build_exported(self) -> None:
        self.part("GOOD-1", stock=5000)
        self.part("OBS-1", stock=0, lifecycle="obsolete")
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=SimpleNamespace(id="prj_1")), \
                mock.patch("app.api.supply_release._build_of_project"), \
                mock.patch("app.api.supply_release.release_source.build_bom_text", return_value=self.BOM_CSV):
            response = self.request("prj_1/release-builds/b1/check")
        self.assertEqual(response.status, 200, response.text)
        self.assertEqual((response.json["available"], response.json["status"], response.json["parts"]), (True, "fatal", 2))
        self.assertEqual((response.json["without_number"], response.json["needing_a_look"]), (1, 1))

    def test_a_build_with_no_bom_says_so(self) -> None:
        from app.services.supply import release_source

        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=SimpleNamespace(id="p")), \
                mock.patch("app.api.supply_release._build_of_project"), \
                mock.patch("app.api.supply_release.release_source.build_bom_text", side_effect=release_source.NoBuildBom("This build exported no BOM file.")):
            response = self.request("p/release-builds/b/check")
        self.assertEqual(response.json, {"available": False, "reason": "This build exported no BOM file."})

    def test_reading_the_release_bom_keeps_its_lines_without_tracking_anything(self) -> None:
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=SimpleNamespace(id="prj_5", name="Five")), \
                mock.patch("app.api.supply_release._build_of_project"), \
                mock.patch("app.api.supply_release.release_source.build_bom_text", return_value=self.BOM_CSV):
            response = _request(self.app, "POST", "/api/supply/projects/prj_5/release-builds/b1/read-bom", user=self.users["qa"])
        self.assertEqual((response.status, response.json["parts"], response.json["without_number"]), (200, 2, 1))
        with self.store.connection() as conn:
            kept = conn.execute("SELECT mpn, quantity FROM bom_usage WHERE project_id = 'prj_5' ORDER BY mpn").fetchall()
            self.assertEqual([(r["mpn"], r["quantity"]) for r in kept], [("GOOD-1", 2), ("OBS-1", 1)])
            self.assertEqual(conn.execute("SELECT COUNT(*) AS n FROM tracked_projects").fetchone()["n"], 0)
            self.assertEqual(conn.execute("SELECT COUNT(*) AS n FROM part_tiers").fetchone()["n"], 0)
        viewer = _request(self.app, "POST", "/api/supply/projects/prj_5/release-builds/b1/read-bom", user=self.users["viewer"])
        self.assertEqual(viewer.status, 403)

    def test_the_project_health_rolls_up_the_stored_bom_lines(self) -> None:
        from app.services.supply import usage

        self.part("GOOD-1", stock=5000)
        project = SimpleNamespace(id="prj_9")
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=project):
            self.assertEqual(self.request("prj_9/bom-health").json, {"available": False})
            with self.store.connection() as conn:
                usage.store_project(conn, "prj_9", "Nine", "rev1", usage.lines_from_components([
                    component("R1", "Acme", "GOOD-1"), component("R2", "Acme", "GOOD-1"), component("C1", "Acme", "UNKNOWN-9"),
                ]), NOW)
            response = self.request("prj_9/bom-health", query="build_quantity=10")
        self.assertEqual(response.status, 200, response.text)
        rollup = response.json["rollup"]
        self.assertEqual((response.json["available"], rollup["lines"], rollup["tracked"], rollup["not_tracked"], rollup["can_build"]), (True, 2, 1, 1, 2500))
        self.assertEqual(rollup["health_status"], "ok")
        with self.store.connection() as conn:
            conn.execute(
                "INSERT INTO bom_usage_variants (project_id, variant, line_key, manufacturer, mpn, quantity) VALUES ('prj_9', 'Lite', 'k', 'Acme', 'GOOD-1', 1)")
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=project):
            lite = self.request("prj_9/bom-health", query="variant=Lite").json
            nothing = self.request("prj_9/bom-health", query="variant=Nope").json
        self.assertEqual((lite["available"], lite["variant"], lite["variants"], lite["rollup"]["lines"]), (True, "Lite", ["Lite"], 1))
        self.assertEqual(nothing, {"available": False})

    def test_the_project_page_lists_parts_builds_releases_and_what_changed_since(self) -> None:
        from app.services.supply import demand, usage

        good = self.part("GOOD-1", stock=5000)
        flaky = self.part("FLAKY-1", stock=900)
        project = SimpleNamespace(id="prj_8")
        with self.store.connection() as conn:
            usage.store_project(conn, "prj_8", "Eight", "rev1", usage.lines_from_components([
                component("R1", "Acme", "GOOD-1"), component("U1", "Acme", "FLAKY-1"), component("C1", "Acme", "UNKNOWN-9"),
            ]), NOW)
            demand.replace_from_source(conn, "bom_watch", "prj_8/Pilot", {good: 10}, "a@example.com")
            demand.replace_from_source(conn, "bom_watch", "prj_80/Other", {good: 10}, "a@example.com")
            conn.execute(
                "INSERT INTO release_snapshots (id, project_id, build_id, tag, commit_sha, created_by, health, status, assessment, avl) "
                "VALUES ('s1', 'prj_8', 'b1', 'v1', 'abc', 'a@example.com', 9.0, 'ok', %s::jsonb, '{}'::jsonb)",
                ('{"parts": 2, "needing_a_look": 0, "lines": [{"part_id": "%s", "manufacturer": "Acme", "mpn": "FLAKY-1", "status": "ok"}]}' % flaky,),
            )
            conn.execute("UPDATE offers SET lifecycle = 'obsolete', stock = 0 WHERE listing_id IN (SELECT id FROM listings WHERE part_id = %s)", (flaky,))
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=project):
            body = self.request("prj_8/supply").json
        self.assertTrue(body["available"])
        self.assertEqual(body["parts"][0]["mpn"], "FLAKY-1", "the worst part comes first")
        self.assertEqual({part["mpn"] for part in body["parts"]}, {"GOOD-1", "FLAKY-1", "UNKNOWN-9"})
        self.assertEqual([(build["name"], build["parts"]) for build in body["builds"]], [("Pilot", 1)], "another project's build is not listed")
        (release,) = body["releases"]
        self.assertEqual(release["tag"], "v1")
        self.assertEqual([item["mpn"] for item in release["changed_since"]], ["FLAKY-1"])
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=SimpleNamespace(id="prj_0")):
            self.assertFalse(self.request("prj_0/supply").json["available"])

    def test_a_tracked_projects_cost_is_stored_once_a_day_and_shown_on_its_page(self) -> None:
        from app.services.supply import project_supply, usage

        self.part("GOOD-1", stock=5000)
        project = SimpleNamespace(id="prj_7")

        def clear() -> None:
            with self.store.connection() as conn:
                for table in ("tracked_projects", "bom_cost_history", "bom_usage_projects"):
                    conn.execute(f"DELETE FROM {table}")

        clear()
        self.addCleanup(clear)
        with self.store.connection() as conn:
            usage.store_project(conn, "prj_7", "Seven", "rev1", usage.lines_from_components([component("R1", "Acme", "GOOD-1")]), NOW)
            self.assertEqual(project_supply.snapshot_costs(conn, NOW), 0, "a project nobody tracks has no history")
            conn.execute("UPDATE offers SET currency = 'EUR', price_breaks = '[[1, \"0.5\"]]'::jsonb")
            conn.execute("INSERT INTO tracked_projects (project_id, variants, tracked_by) VALUES ('prj_7', '{\"\"}', 'a@example.com')")
            self.assertEqual(project_supply.snapshot_costs(conn, NOW), 1)
            self.assertEqual(project_supply.snapshot_costs(conn, NOW), 0, "once a day")
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=project):
            history = self.request("prj_7/supply").json["cost_history"]
        self.assertEqual([(point["cost_per_board"], point["complete"]) for point in history], [("0.5000", True)])

    def test_the_cost_export_prices_the_bom_and_names_nothing_to_order_from(self) -> None:
        from app.services.supply import usage

        self.part("GOOD-1", stock=5000)
        project = SimpleNamespace(id="prj_6", name="Six")
        with self.store.connection() as conn:
            conn.execute("UPDATE offers SET currency = 'EUR', price_breaks = '[[1, \"0.5\"]]'::jsonb")
            usage.store_project(conn, "prj_6", "Six", "rev1", usage.lines_from_components([
                component("R1", "Acme", "GOOD-1"), component("R2", "Acme", "GOOD-1"), component("C1", "Acme", "UNKNOWN-9"),
            ]), NOW)
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=project):
            response = self.request("prj_6/cost-export", query="build_quantity=10")
            missing = self.request("prj_0/cost-export")
        self.assertEqual(response.status, 200)
        text = response.text
        self.assertIn("GOOD-1", text)
        self.assertIn("Total", text)
        self.assertIn("10.00", text, "2 per board x 10 boards x 0.50")
        for word in ("S-GOOD", "sku", "http", "Distributor"):
            self.assertNotIn(word.lower(), text.lower().replace("list prices without", ""), word)
        self.assertEqual(missing.status, 404)

    def test_the_trade_classification_lists_what_distributors_state_and_what_is_missing(self) -> None:
        from app.services.supply import facts, usage

        good = self.part("GOOD-1", stock=5000)
        self.part("OTHER-1", stock=5000)
        project = SimpleNamespace(id="prj_5", name="Five")
        with self.store.connection() as conn:
            facts.replace(conn, good, "digikey", [("eccn", "EAR99"), ("hts_us", "8542.33.0001")], NOW)
            facts.replace(conn, good, "mouser", [("eccn", "3A001"), ("hts_eu", "8542339000")], NOW)
            usage.store_project(conn, "prj_5", "Five", "rev1", usage.lines_from_components([
                component("R1", "Acme", "GOOD-1"), component("R2", "Acme", "OTHER-1"), component("C1", "Acme", "UNKNOWN-9"),
            ]), NOW)
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=project):
            report = self.request("prj_5/trade").json["report"]
            csv_text = self.request("prj_5/trade", query="format=csv").text
        by_mpn = {item["mpn"]: item for item in report["parts"]}
        self.assertEqual(by_mpn["GOOD-1"]["control"], "disputed")
        self.assertEqual(sorted(by_mpn["GOOD-1"]["eccn"]), ["3A001", "EAR99"])
        self.assertEqual((by_mpn["GOOD-1"]["hts_us"], by_mpn["GOOD-1"]["hts_eu"]), (["8542.33.0001"], ["8542339000"]))
        self.assertEqual(by_mpn["OTHER-1"]["control"], "unknown")
        self.assertIn("No distributor gives an export control class.", by_mpn["OTHER-1"]["gaps"])
        self.assertTrue(by_mpn["UNKNOWN-9"]["gaps"])
        self.assertEqual((report["summary"]["disputed"], report["summary"]["unknown"]), (1, 2))
        self.assertIn("Disputed", csv_text)

    def test_suggestions_name_what_the_bom_lacks_and_prism_knows(self) -> None:
        from app.services.supply import bom_suggestions, usage

        good = self.part("GOOD-1", stock=5000)
        project = SimpleNamespace(id="prj_4", name="Four")
        with self.store.connection() as conn:
            conn.execute("UPDATE parts SET datasheet_url = 'https://example.com/good1.pdf' WHERE id = %s", (good,))
            conn.execute(
                "INSERT INTO listings (id, connector_id, sku, raw_mpn, raw_manufacturer, match_state) "
                "SELECT %s, c.id, 'C12345', 'LCSCPART-1', 'Acme', 'near' FROM connectors c LIMIT 1", (uuid.uuid4().hex,))
            conn.execute("UPDATE connectors SET provider = 'lcsc' WHERE id = (SELECT connector_id FROM listings WHERE sku = 'C12345')")
            usage.store_project(conn, "prj_4", "Four", "rev1", usage.lines_from_components([
                component("R1", "", "GOOD-1"),
                component("R2", "Acme", "GOOD-1", Datasheet="https://example.com/mine.pdf", **{"Prism ID": "c-1"}),
                component("U1", "", "", LCSC="C12345"),
                component("U2", "", "", LCSC="C99999"),
                component("D1", "Acme", "OTHER-2", Datasheet="~"),
            ]), NOW)
            rows = usage.project_rows(conn, "prj_4")
            items = bom_suggestions.build(conn, rows, library=lambda: {("acme", "OTHER2"): "comp-77"})
        by_kind = {}
        for item in items:
            by_kind.setdefault(item["kind"], []).append(item)
        self.assertEqual([(i["references"], i["suggested"]) for i in by_kind["manufacturer"]], [("R1", "Acme")])
        self.assertEqual([(i["references"], i["suggested"]) for i in by_kind["lcsc_part"]], [("U1", "Acme LCSCPART-1")])
        self.assertEqual([(i["references"], i["suggested"]) for i in by_kind["datasheet"]], [("R1", "https://example.com/good1.pdf")])
        self.assertEqual([(i["references"], i["suggested"]) for i in by_kind["prism_id"]], [("D1", "comp-77")])
        self.assertEqual(bom_suggestions.summary(items), {"manufacturer": 1, "lcsc_part": 1, "datasheet": 1, "prism_id": 1})
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=project):
            answer = self.request("prj_4/suggestions").json
        self.assertTrue(answer["available"])
        self.assertEqual(answer["counts"]["manufacturer"], 1)

    def test_one_class_is_none_controlled_or_unknown(self) -> None:
        from app.services.supply import trade

        self.assertEqual([trade.control_of(item) for item in ([], ["EAR99"], ["ear99 "], ["5A992.c"], ["EAR99", "3A001"])],
                         ["unknown", "none", "none", "controlled", "disputed"])

    def test_the_compliance_draft_lists_each_part_with_what_is_known_and_what_is_missing(self) -> None:
        from app.services.supply import compliance_draft, usage

        from app.services.supply import facts

        known = self.part("GOOD-1", stock=10)
        self.part("PLAIN-1", stock=10)
        with self.store.connection() as conn:
            conn.execute("UPDATE offers SET rohs = TRUE, reach_affected = FALSE WHERE listing_id IN (SELECT id FROM listings WHERE part_id = %s)", (known,))
            facts.replace(conn, known, "digikey", [("rohs_status", "RoHS Compliant By Exemption"), ("reach_status", "REACH Unaffected")], NOW)
            usage.store_project(conn, "prj_7", "Seven", "rev1", usage.lines_from_components([
                component("R1", "Acme", "GOOD-1"), component("R2", "Acme", "GOOD-1"), component("U1", "Acme", "PLAIN-1"),
                component("C1", "Acme", "=EVIL()"), component("J1", "Acme", ""),
            ]), NOW)
        project = SimpleNamespace(id="prj_7", name="Seven")
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=project):
            response = self.request("prj_7/compliance-draft")
            csv_response = self.request("prj_7/compliance-draft", query="format=csv")
            empty = mock.patch("app.api.supply_release.usage.project_rows", return_value=[])
            with empty:
                self.assertEqual(self.request("prj_7/compliance-draft").json, {"available": False, "draft": None})
                self.assertEqual(self.request("prj_7/compliance-draft", query="format=csv").status, 404)
        by_mpn = {item["mpn"]: item for item in response.json["draft"]["parts"]}
        self.assertEqual((by_mpn["GOOD-1"]["rohs"], by_mpn["GOOD-1"]["reach"], by_mpn["GOOD-1"]["quantity"], by_mpn["GOOD-1"]["references"]), ("compliant", "not affected", 2, "R1 R2"))
        self.assertEqual((by_mpn["GOOD-1"]["rohs_stated"], by_mpn["GOOD-1"]["reach_stated"]),
                         ("RoHS Compliant By Exemption (DigiKey)", "REACH Unaffected (DigiKey)"))
        self.assertIn("RoHS compliant by exemption: name the exemption in the declaration.", by_mpn["GOOD-1"]["gaps"])
        self.assertEqual(by_mpn["PLAIN-1"]["rohs_stated"], "")
        self.assertIn("No RoHS statement from any distributor.", by_mpn["PLAIN-1"]["gaps"])
        self.assertIn("Prism does not track this part, so nothing is known about it.", by_mpn["=EVIL()"]["gaps"])
        self.assertEqual(response.json["draft"]["summary"]["parts"], 3, "the line without a part number is not a distinct part")
        self.assertEqual(csv_response.status, 200)
        self.assertTrue(csv_response.headers["content-type"].startswith("text/csv"))
        self.assertIn("'=EVIL()", csv_response.text)
        self.assertNotIn(",=EVIL()", csv_response.text)
        self.assertEqual(compliance_draft.to_csv({"parts": []}).strip(), ",".join(compliance_draft.HEADER))
        summary = response.json["draft"]["summary"]
        self.assertEqual((summary["candidate_list_loaded"], summary["note"]), (False, compliance_draft.LIST_NOT_LOADED))
        self.assertFalse(any(compliance_draft.LIST_NOT_LOADED in gap for item in by_mpn.values() for gap in item["gaps"]), "said once, not per part")
        self.assertIn(compliance_draft.LIST_NOT_LOADED, csv_response.text)

    def test_who_may_look_and_a_project_the_caller_cannot_open_is_not_found(self) -> None:
        self.assertEqual(self.request("p/release-builds/b/check", role="viewer").status, 403)
        from fastapi import HTTPException

        with mock.patch("app.api.supply_release.get_project_for_role_or_404", side_effect=HTTPException(status_code=404, detail="Project not found")):
            self.assertEqual(self.request("p/release-check").status, 404)
            self.assertEqual(self.request("p/releases/b/supply").status, 404)

    def test_the_snapshot_job_freezes_the_release_bom_and_the_status_follows(self) -> None:
        from app.services.supply import release_snapshot

        self.part("GOOD-1", stock=5000)
        with mock.patch("app.services.supply.release_snapshot.supply_store", self.store), \
                mock.patch("app.services.supply.release_snapshot.release_source.build_bom_text", return_value=self.BOM_CSV), \
                mock.patch("app.services.supply.release_snapshot.catalog_read.component_ids_by_part", return_value={}):
            queue = mock.Mock()
            self.assertTrue(release_snapshot.queue("prj_1", "bld_9", "v9", "b" * 40, "qa@example.com", job_service=queue))
            self.assertEqual(release_snapshot.status_of(self.conn(), "prj_1", "bld_9")["state"], "queued")
            self.assertEqual(queue.enqueue.call_args.kwargs["artifact_key"], "supply-snapshot:bld_9")
            self.assertEqual(release_snapshot.take("prj_1", "bld_9", "v9", "b" * 40, "qa@example.com"), "taken")
            self.assertEqual(release_snapshot.status_of(self.conn(), "prj_1", "bld_9")["state"], "taken")
            self.assertEqual(release_snapshot.take("prj_1", "bld_9", "v9", "b" * 40, "qa@example.com"), "taken", "asking twice is harmless")
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=SimpleNamespace(id="prj_1")):
            response = self.request("prj_1/releases/bld_9/supply")
            status = self.request("prj_1/releases/bld_9/supply-status")
        self.assertEqual((response.status, response.json["tag"], status.json["state"]), (200, "v9", "taken"))

    def test_a_build_without_a_bom_records_why_there_is_no_snapshot(self) -> None:
        from app.services.supply import release_snapshot, release_source

        with mock.patch("app.services.supply.release_snapshot.supply_store", self.store), \
                mock.patch("app.services.supply.release_snapshot.release_source.build_bom_text", side_effect=release_source.NoBuildBom("This build exported no BOM file.")):
            self.assertEqual(release_snapshot.take("prj_1", "bld_x", "vx", "c" * 40, "qa@example.com"), "failed")
            self.assertEqual(release_snapshot.status_of(self.conn(), "prj_1", "bld_x"), {"state": "failed", "reason": "This build exported no BOM file."})
        self.assertEqual(release_snapshot.status_of(self.conn(), "prj_1", "never"), {"state": "none", "reason": ""})

    def test_queueing_never_raises_and_says_when_it_could_not(self) -> None:
        from app.services.supply import release_snapshot

        with mock.patch("app.services.supply.release_snapshot.supply_store", self.store):
            broken = mock.Mock()
            broken.enqueue.side_effect = RuntimeError("down")
            self.assertFalse(release_snapshot.queue("prj_1", "bld_q", "vq", "d" * 40, "qa@example.com", job_service=broken))
            self.assertEqual(release_snapshot.status_of(self.conn(), "prj_1", "bld_q")["state"], "failed")

    def conn(self):
        return self.store.connection().__enter__()

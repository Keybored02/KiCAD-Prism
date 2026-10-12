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
            result = self.release_check.check(conn, self.bom(), NOW)
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
            result = self.release_check.check(conn, [component("U1", "Acme", "OBS-1")], NOW)
        self.assertEqual((result["needing_a_look"], result["status"]), (0, "ok"))
        self.assertEqual(result["lines"][0]["waived"], 1)

    def test_the_snapshot_keeps_the_check_and_the_approved_parts_and_can_never_change(self) -> None:
        self.part("GOOD-1", stock=5000)
        with self.store.connection() as conn:
            self.sources.add_source(conn, "cmp-1", "Acme", "ALT-1", "qa@example.com", approver=True)
            self.sources.add_source(conn, "cmp-1", "Acme", "ALT-2", "designer@example.com", approver=False)
            ids = {("acme", "GOOD1"): "cmp-1"}
            first = self.release_check.freeze(conn, "prj_1", "bld_1", "v1", "a" * 40, "qa@example.com", [component("R1", "Acme", "GOOD-1")], ids, NOW)
            again = self.release_check.freeze(conn, "prj_1", "bld_1", "v1", "a" * 40, "qa@example.com", [], {}, NOW)
            snapshot = self.release_check.get_snapshot(conn, "prj_1", "bld_1")
        self.assertIsNotNone(first)
        self.assertIsNone(again, "a build is frozen once")
        self.assertEqual((snapshot["tag"], snapshot["status"], snapshot["assessment"]["parts"]), ("v1", "ok", 1))
        self.assertEqual([(a["mpn"], a["approval"]) for a in snapshot["avl"]["cmp-1"]["alternates"]], [("ALT-1", "approved")])
        with self.store.connection() as conn, self.assertRaises(Exception) as caught:
            conn.execute("UPDATE release_snapshots SET tag = 'v2'")
        self.assertIn("cannot be changed", str(caught.exception))
        with self.assertRaises(self.release_check.SnapshotNotFound), self.store.connection() as conn:
            self.release_check.get_snapshot(conn, "prj_1", "missing")

    def request(self, path: str, role: str = "designer", query: str = ""):
        return _request(self.app, "GET", f"/api/supply/projects/{path}", user=self.users[role], query=query)

    def test_the_endpoint_reads_the_projects_index_for_a_project_the_caller_can_open(self) -> None:
        self.part("GOOD-1", stock=5000)
        project = SimpleNamespace(id="prj_1")
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=project), \
                mock.patch("app.api.supply_release.semantic_index_service.get_existing", return_value={"components": [component("R1", "Acme", "GOOD-1")]}) as index:
            response = self.request("prj_1/release-check", query="commit=abc")
        self.assertEqual(response.status, 200, response.text)
        self.assertEqual((response.json["available"], response.json["status"]), (True, "ok"))
        index.assert_called_once_with(project, "abc")

    def test_a_revision_without_a_read_bom_says_so(self) -> None:
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=SimpleNamespace(id="p")), \
                mock.patch("app.api.supply_release.semantic_index_service.get_existing", return_value=None):
            response = self.request("p/release-check")
        self.assertEqual(response.json["available"], False)
        self.assertIn("has not been read", response.json["reason"])

    def test_who_may_look_and_a_project_the_caller_cannot_open_is_not_found(self) -> None:
        self.assertEqual(self.request("p/release-check", role="viewer").status, 403)
        from fastapi import HTTPException

        with mock.patch("app.api.supply_release.get_project_for_role_or_404", side_effect=HTTPException(status_code=404, detail="Project not found")):
            self.assertEqual(self.request("p/release-check").status, 404)
            self.assertEqual(self.request("p/releases/b/supply").status, 404)

    def test_publishing_freezes_a_snapshot_and_never_fails_the_release(self) -> None:
        from app.services.supply import publish_hook

        self.part("GOOD-1", stock=5000)
        project_row = {"id": "prj_1"}
        with mock.patch("app.services.workspace_service.workspace.get_project_by_id", return_value=project_row), \
                mock.patch("app.services.project_service._workspace_row_to_project", return_value=SimpleNamespace(id="prj_1")), \
                mock.patch("app.services.semantic_index_service.get_existing", return_value={"components": [component("R1", "Acme", "GOOD-1")]}), \
                mock.patch("app.services.supply.catalog_read.component_ids_by_part", return_value={}), \
                mock.patch("app.services.supply.store.supply_store", self.store):
            snapshot_id = publish_hook.freeze_after_publish("prj_1", "bld_9", "v9", "b" * 40, "qa@example.com")
        self.assertIsNotNone(snapshot_id)
        with mock.patch("app.api.supply_release.get_project_for_role_or_404", return_value=SimpleNamespace(id="prj_1")):
            response = self.request("prj_1/releases/bld_9/supply")
        self.assertEqual((response.status, response.json["tag"]), (200, "v9"))
        with mock.patch("app.services.workspace_service.workspace.get_project_by_id", side_effect=RuntimeError("down")):
            self.assertIsNone(publish_hook.freeze_after_publish("prj_1", "bld_10", "v10", "c" * 40, "qa@example.com"))


if __name__ == "__main__":
    unittest.main()

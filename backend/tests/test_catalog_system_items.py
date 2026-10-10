"""SB2-02: catalog kinds (``module``/``assembly``), their release gates, and viewer browsing (CONTRACTS_P2 §3)."""

from __future__ import annotations

import os
import tempfile
import unittest
import unittest.mock
import uuid
from pathlib import Path

from app.api.catalog_admin import router as catalog_router
from app.api.catalog_system_items import router as system_items_router
from app.core.roles import CATALOG_BROWSE_ROLES, CATALOG_READ_ROLES
from app.services.catalog import system_items
from app.services.catalog.locking import NoopCatalogLocks
from app.services.catalog.postgres_runtime import PostgresCatalogRuntime
from app.services.catalog.revision_kernel import CatalogRevisionKernel

CATALOG_ROUTES = [*catalog_router.routes, *system_items_router.routes]
POSTGRES_URL = os.environ.get("TEST_POSTGRES_URL", "").strip()

INTERFACE = {"schema": "prism.system_export_interface.v1", "exports": [
    {"id": "sxp_" + "1" * 32, "name": "PWR_IN", "reference": "J20", "pinCount": 2,
     "pins": [{"pad": "1", "nets": ["/VBUS"], "powerNet": True}, {"pad": "2", "nets": ["GND"], "powerNet": True}]},
]}


def source_ref(**overrides) -> dict:
    return {"kind": "system_snapshot", "systemId": "sys_" + "a" * 32, "snapshotId": "ssn_" + "b" * 32,
            "fullDigest": "sha256:f", "connectivityDigest": "sha256:c", "openReviewCount": 0,
            "hierarchyValid": True, "children": [], **overrides}


class ViewerBrowseRoutesTest(unittest.TestCase):
    """D-P2-24: viewers browse the catalog; operational reads stay on the reader roles."""

    BROWSE = {
        ("GET", "/api/catalog/components"), ("GET", "/api/catalog/categories"),
        ("GET", "/api/catalog/workflow/summary"), ("GET", "/api/catalog/release-queue"),
        ("GET", "/api/catalog/assets/search"), ("GET", "/api/catalog/components/{component_id}"),
        ("GET", "/api/catalog/components/{component_id}/revisions"),
        ("GET", "/api/catalog/components/{component_id}/revisions/compare"),
        ("GET", "/api/catalog/components/{component_id}/revisions/{revision_id}"),
        ("GET", "/api/catalog/components/{component_id}/audit"),
        ("GET", "/api/catalog/components/{component_id}/audit/verify"),
        ("GET", "/api/catalog/components/{component_id}/usage"),
        ("GET", "/api/catalog/components/{component_id}/mates-with"),
        ("GET", "/api/catalog/components/{component_id}/models"),
        ("GET", "/api/catalog/components/{component_id}/module-connectors"),
        ("GET", "/api/catalog/components/{component_id}/connector-geometry"),
        ("GET", "/api/catalog/components/{component_id}/models/{asset_id}/preview.svg"),
        ("GET", "/api/catalog/models/{key}.glb"),
        ("GET", "/api/catalog/components/{component_id}/reviews"),
        ("GET", "/api/catalog/components/{component_id}/releases"),
        ("GET", "/api/catalog/previews/{preview_id}"), ("GET", "/api/catalog/assets/{asset_id}/content"),
        ("GET", "/api/catalog/components/{component_id}/validation"), ("GET", "/api/catalog/metadata/fields"),
        ("GET", "/api/catalog/metadata/grid-preferences"), ("PUT", "/api/catalog/metadata/grid-preferences"),
        ("GET", "/api/catalog/metadata/grid"), ("GET", "/api/catalog/metadata/export.csv"),
    }

    def dependency(self, route) -> str:
        names = [d.call.__name__ for d in route.dependant.dependencies if d.call.__name__.startswith("require_")]
        self.assertEqual(len(names), 1, route.path)
        return names[0]

    def test_exactly_the_browse_routes_admit_viewers(self) -> None:
        self.assertEqual(CATALOG_BROWSE_ROLES - CATALOG_READ_ROLES, {"viewer"})
        opened = {(sorted(r.methods)[0], r.path) for r in CATALOG_ROUTES
                  if self.dependency(r) == "require_catalog_browser"}
        self.assertEqual(opened, self.BROWSE)
        for method, path in {(sorted(r.methods)[0], r.path) for r in CATALOG_ROUTES} - self.BROWSE:
            if method != "GET":
                continue
            with self.subTest(route=path):
                route = next(r for r in CATALOG_ROUTES if r.path == path and "GET" in r.methods)
                self.assertNotEqual(self.dependency(route), "require_catalog_browser")
        for sensitive in ("/api/catalog/inventory/export.csv", "/api/catalog/health", "/api/catalog/import-sessions",
                          "/api/catalog/jobs/{job_id}", "/api/catalog/validation/runs/{run_id}"):
            route = next(r for r in CATALOG_ROUTES if r.path == sensitive)
            self.assertEqual(self.dependency(route), "require_catalog_reader", sensitive)


@unittest.skipUnless(POSTGRES_URL, "TEST_POSTGRES_URL is required for catalog integration tests")
class SystemItemsTest(unittest.TestCase):
    def setUp(self) -> None:
        from app.services.component_catalog_service_postgres import ComponentCatalogPostgresService

        self.tempdir = tempfile.TemporaryDirectory()
        self.service = ComponentCatalogPostgresService(
            store_root=Path(self.tempdir.name) / "components", database_url=POSTGRES_URL,
        )
        self.service.initialize()
        self.created: list[str] = []

    def tearDown(self) -> None:
        for component_id in self.created:
            self.service.deactivate_component(component_id, actor="test@local", reason="SB2-02 test cleanup")
        self.service.close()
        self.tempdir.cleanup()

    def assembly(self, **ref) -> dict:
        created = self.service.system_items.create_system_item(
            kind="assembly", ipn=f"IPN-{uuid.uuid4().hex[:8]}", name="CNDH Stack", description="2x OBC on CMBD",
            manufacturer="In-house", datasheet_url="https://prism.example/systems/sys_x",
            interface=INTERFACE, source_ref=source_ref(**ref), actor="author@example.com",
        )
        self.created.append(created["componentId"])
        return created

    def release(self, component_id: str) -> None:
        for stage, actor, role in (("in_progress", "author@example.com", "designer"),
                                   ("qa_review", "author@example.com", "designer"),
                                   ("done", "qa@example.com", "qa"),
                                   ("released", "qa@example.com", "admin")):
            self.service.set_release_status(component_id, stage, actor=actor, actor_role=role)

    def test_an_assembly_is_a_kinded_component_with_its_payload(self) -> None:
        created = self.assembly()
        component = self.service.get_component(created["componentId"])
        self.assertEqual((component["kind"], component["identity_kind"]), ("assembly", "provisional_ipn"))
        self.assertEqual(component["interface"], INTERFACE)
        self.assertEqual(component["source_ref"]["snapshotId"], "ssn_" + "b" * 32)
        listed = self.service.list_components(kind="assembly", include_inactive=False, page_size=500)
        self.assertIn(created["componentId"], [c["id"] for c in listed["items"]])
        parts = self.service.list_components(kind="part", page_size=500)
        self.assertNotIn(created["componentId"], [c["id"] for c in parts["items"]])

    def test_release_follows_the_workflow_and_the_assembly_gates(self) -> None:
        created = self.assembly()
        self.release(created["componentId"])
        component = self.service.get_component(created["componentId"])
        self.assertEqual(component["release_status"], "released")
        # Not a KiCad library part, so the DBL export and the provider leave it out.
        self.assertFalse(system_items.is_library_part(component))

        again = self.service.system_items.add_system_revision(created["componentId"], interface=INTERFACE,
                                                 source_ref=source_ref(snapshotId="ssn_" + "c" * 32),
                                                 actor="author@example.com")
        self.assertNotEqual(again["revisionId"], created["revisionId"])
        latest = self.service.get_component(created["componentId"])
        self.assertEqual(latest["source_ref"]["snapshotId"], "ssn_" + "c" * 32)
        # SB2-122: either revision knows where the chain stands: v1 released, v2 newest and not released yet.
        first = self.service.system_items.system_revision(created["revisionId"])
        self.assertEqual((first["version"], first["latestReleasedVersion"], first["newestVersion"]), (1, 1, 2))
        self.assertNotEqual(first["newestReleaseStatus"], "released")

    def test_gates_fail_closed(self) -> None:
        released_child = self.assembly()
        self.release(released_child["componentId"])
        unreleased_child = self.assembly()
        cases = {
            "open reviews": dict(openReviewCount=2),
            "hierarchy": dict(hierarchyValid=False),
            "unreleased child": dict(children=[{"componentId": unreleased_child["componentId"],
                                                "revisionId": unreleased_child["revisionId"]}]),
            "source snapshot": dict(kind="git_commit"),
        }
        for reason, ref in cases.items():
            with self.subTest(gate=reason):
                created = self.assembly(**ref)
                with self.assertRaises(ValueError) as caught:
                    self.release(created["componentId"])
                self.assertIn(reason, str(caught.exception))
        ok = self.assembly(children=[{"componentId": released_child["componentId"],
                                      "revisionId": released_child["revisionId"]}])
        self.release(ok["componentId"])

    def test_a_part_cannot_take_a_published_revision(self) -> None:
        part = self.service.create_manual_component(
            value="10k", description="r", datasheet="https://example.com/r.pdf", manufacturer="Prism",
            manufacturer_part_number=f"PG-{uuid.uuid4().hex[:8]}", actor="author@example.com",
        )
        self.created.append(str(part["id"]))
        with self.assertRaises(ValueError):
            self.service.system_items.add_system_revision(str(part["id"]), interface=INTERFACE, source_ref=source_ref())

    def test_new_columns_do_not_change_existing_revision_hashes(self) -> None:
        """An empty payload is left out of the manifest, so pre-migration hashes still verify."""
        part = self.service.create_manual_component(
            value="1k", description="r", datasheet="https://example.com/r.pdf", manufacturer="Prism",
            manufacturer_part_number=f"PG-{uuid.uuid4().hex[:8]}", actor="author@example.com",
        )
        self.created.append(str(part["id"]))
        kernel = CatalogRevisionKernel(NoopCatalogLocks())
        with PostgresCatalogRuntime(database_url=POSTGRES_URL).connect() as conn:
            revision_id = conn.execute("SELECT current_revision_id FROM components WHERE id = %s",
                                       (str(part["id"]),)).fetchone()["current_revision_id"]
            row = kernel.revision_row(conn, revision_id)
            stored = row["manifest_hash"]
            self.assertEqual(kernel.revision_manifest_hash(conn, revision_id), stored)
            # Same revision as a pre-migration row (no payload columns) hashes identically.
            legacy = {k: v for k, v in row.items() if k not in ("interface_json", "source_ref_json")}
            with unittest.mock.patch.object(kernel, "revision_row", return_value=legacy):
                self.assertEqual(kernel.revision_manifest_hash(conn, revision_id), stored)
            # A set payload is covered by the hash.
            with unittest.mock.patch.object(kernel, "revision_row", return_value={**row, "interface_json": '{"x":1}'}):
                self.assertNotEqual(kernel.revision_manifest_hash(conn, revision_id), stored)

    def test_item_metadata_requires_a_system_kind_and_an_ipn(self) -> None:
        with self.assertRaises(ValueError):
            system_items.item_metadata(kind="part", ipn="X", name="n", description="d", manufacturer="m",
                                       datasheet_url="https://x")
        with self.assertRaises(ValueError):
            system_items.item_metadata(kind="assembly", ipn=" ", name="n", description="d", manufacturer="m",
                                       datasheet_url="https://x")


class LibraryPartTest(unittest.TestCase):
    def test_only_parts_are_kicad_library_parts(self) -> None:
        self.assertTrue(system_items.is_library_part({"kind": "part"}))
        self.assertTrue(system_items.is_library_part({}), "rows from before kinds are parts")
        self.assertFalse(system_items.is_library_part({"kind": "module"}))
        self.assertFalse(system_items.is_library_part({"kind": "assembly"}))


if __name__ == "__main__":
    unittest.main()

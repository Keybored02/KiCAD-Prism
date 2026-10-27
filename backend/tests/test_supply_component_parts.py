"""A component's main part and its alternates (``component_parts``), against a real catalog.

Needs ``TEST_POSTGRES_URL``: the table refers to catalog components, so these tests run where the catalog lives.
"""

from __future__ import annotations

import sys
import tempfile
import unittest
import unittest.mock
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from supply_api_helpers import request as _request  # noqa: E402
from support.postgres import CATALOG_URL, requires_scratch_postgres  # noqa: E402

AUTHOR = "author@example.com"


@requires_scratch_postgres("component parts")
class ComponentPartsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_component_parts, supply_connectors
        from app.core.security import AuthenticatedUser
        from app.services.component_catalog_service_postgres import ComponentCatalogPostgresService
        from app.services.supply import component_parts
        from app.services.supply.store import SupplyStore

        cls.tempdir = tempfile.TemporaryDirectory()
        cls.catalog = ComponentCatalogPostgresService(store_root=Path(cls.tempdir.name) / "components", database_url=CATALOG_URL)
        cls.catalog.initialize()
        cls.store = type("CatalogSupplyStore", (SupplyStore,), {"url": CATALOG_URL})()
        cls.store._initialized = True  # the catalog service above ran the ledger, supply tables included
        cls.cp = component_parts
        cls.users = {role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role) for role in ("viewer", "designer", "qa", "admin")}
        cls.app = FastAPI()
        cls.app.include_router(supply_component_parts.router)
        cls.service_patch = unittest.mock.patch.object(supply_connectors, "service", type("S", (), {"store": cls.store})())
        cls.service_patch.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.service_patch.stop()
        cls.tempdir.cleanup()

    def _component(self) -> dict:
        token = uuid.uuid4().hex[:10]
        component = self.catalog.create_manual_component(
            value="10k", description="Component parts test", datasheet="https://example.com/r.pdf",
            manufacturer=f"Maker {token}", manufacturer_part_number=f"CP-{token}", actor=AUTHOR,
        )
        self.addCleanup(self.catalog.deactivate_component, str(component["id"]), actor=AUTHOR, reason="component parts test cleanup")
        return component

    def _parts(self, component_id: str) -> list[dict]:
        with self.store.connection() as conn:
            self.cp.sync_main(conn, [component_id])
            return self.cp.parts_of(conn, component_id)

    def _call(self, role: str, method: str, path: str, body=None):
        return _request(self.app, method, path, user=self.users[role], body=body)

    def test_the_main_part_follows_the_current_revision(self) -> None:
        component = self._component()
        (main,) = self._parts(str(component["id"]))
        self.assertEqual((main["role"], main["approval"], main["mpn"]), ("main", "approved", component["mpn"]))

        renamed = f"{component['mpn']}-B"
        self.catalog.update_component_metadata(str(component["id"]), {"mpn": renamed}, actor=AUTHOR, expected_revision_id=component["revision_id"])
        (main,) = self._parts(str(component["id"]))
        self.assertEqual(main["mpn"], renamed, "the old main part is no longer the component's")

    def test_an_alternate_counts_only_once_qa_approves_it(self) -> None:
        component = self._component()
        component_id = str(component["id"])
        with self.store.connection() as conn:
            self.cp.sync_main(conn, [component_id])
            main_id = self.cp.parts_of(conn, component_id)[0]["part_id"]
            proposed = self.cp.propose_alternate(conn, component_id, component["manufacturer"], f"ALT-{uuid.uuid4().hex[:8]}", AUTHOR)
            self.assertEqual(self.cp.counted_parts(conn, [component_id]), {component_id: [main_id]}, "a pending alternate does not count")
            self.cp.decide(conn, component_id, proposed["part_id"], True, "qa@example.com")
            self.assertEqual(self.cp.counted_parts(conn, [component_id]), {component_id: [main_id, proposed["part_id"]]})
            self.assertEqual(self.cp.components_of(conn, [proposed["part_id"]]), {proposed["part_id"]: [component_id]})
            self.cp.decide(conn, component_id, proposed["part_id"], False, "qa@example.com")
            self.assertEqual(self.cp.counted_parts(conn, [component_id]), {component_id: [main_id]}, "a rejected alternate stops counting")

    def test_the_main_part_cannot_also_be_an_alternate_and_an_alternate_is_not_proposed_twice(self) -> None:
        component = self._component()
        component_id = str(component["id"])
        with self.store.connection() as conn:
            self.cp.sync_main(conn, [component_id])
            with self.assertRaisesRegex(self.cp.ComponentPartError, "main part"):
                self.cp.propose_alternate(conn, component_id, component["manufacturer"], component["mpn"], AUTHOR)
            number = f"ALT-{uuid.uuid4().hex[:8]}"
            self.cp.propose_alternate(conn, component_id, component["manufacturer"], number, AUTHOR)
            with self.assertRaisesRegex(self.cp.ComponentPartError, "already an alternate"):
                self.cp.propose_alternate(conn, component_id, component["manufacturer"], number, AUTHOR)

    def test_an_approved_alternate_becomes_the_main_part_when_the_revision_names_it(self) -> None:
        component = self._component()
        component_id = str(component["id"])
        number = f"ALT-{uuid.uuid4().hex[:8]}"
        with self.store.connection() as conn:
            self.cp.sync_main(conn, [component_id])
            proposed = self.cp.propose_alternate(conn, component_id, component["manufacturer"], number, AUTHOR)
        self.catalog.update_component_metadata(component_id, {"mpn": number}, actor=AUTHOR, expected_revision_id=component["revision_id"])
        (main,) = self._parts(component_id)
        self.assertEqual((main["part_id"], main["role"], main["approval"]), (proposed["part_id"], "main", "approved"))

    def test_an_unknown_component_is_refused(self) -> None:
        with self.store.connection() as conn:
            with self.assertRaisesRegex(self.cp.ComponentPartError, "no such component"):
                self.cp.propose_alternate(conn, "no-such-component", "Maker", f"X-{uuid.uuid4().hex[:8]}", AUTHOR)

    def test_designers_propose_qa_decides_and_viewers_see_nothing(self) -> None:
        component = self._component()
        base = f"/api/supply/components/{component['id']}"
        self.assertEqual(self._call("viewer", "GET", f"{base}/parts").status, 403)
        listed = self._call("designer", "GET", f"{base}/parts")
        self.assertEqual((listed.status, [part["role"] for part in listed.json["parts"]]), (200, ["main"]))

        proposed = self._call("designer", "POST", f"{base}/alternates", {"manufacturer": component["manufacturer"], "mpn": f"ALT-{uuid.uuid4().hex[:8]}"})
        self.assertEqual(proposed.status, 200)
        alternate = proposed.json["parts"][1]
        self.assertEqual(alternate["approval"], "pending")

        decision = f"{base}/alternates/{alternate['part_id']}/decision"
        self.assertEqual(self._call("designer", "POST", decision, {"approve": True}).status, 403, "designers do not decide")
        approved = self._call("qa", "POST", decision, {"approve": True})
        self.assertEqual((approved.status, approved.json["parts"][1]["approval"]), (200, "approved"))

        self.assertEqual(self._call("qa", "DELETE", f"{base}/alternates/{alternate['part_id']}").status, 204)
        self.assertEqual([part["role"] for part in self._call("qa", "GET", f"{base}/parts").json["parts"]], ["main"])
        self.assertEqual(self._call("qa", "DELETE", f"{base}/alternates/{alternate['part_id']}").json["detail"]["code"], "component_part_error")


if __name__ == "__main__":
    unittest.main()

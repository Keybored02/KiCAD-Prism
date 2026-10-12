"""The approved parts list: who proposes, who approves, what is audited.

Needs ``PRISM_DATABASE_URL``.
"""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from supply_api_helpers import request as _request  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()
COMPONENT = "cmp_1"


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply API tests")
class SupplySourcesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_sources
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database = database
        cls.users = {
            role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role)
            for role in ("viewer", "qa", "designer", "admin")
        }
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_sources_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_sources.router)
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
            for table in ("component_sources", "parts", "manufacturer_aliases", "manufacturers", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO manufacturers (id, name, name_key) VALUES ('m1', 'Acme', 'acme'), ('m2', 'Globex', 'globex')")

    def call(self, method: str, path: str, *, role: str = "admin", body=None):
        return _request(self.app, method, path, user=self.users[role], body=body)

    def add(self, mpn: str = "ALT-1", manufacturer: str = "Globex", role: str = "designer"):
        return self.call("POST", f"/api/supply/components/{COMPONENT}/sources", role=role,
                         body={"manufacturer": manufacturer, "mpn": mpn})

    def listed(self) -> list[dict]:
        return self.call("GET", f"/api/supply/components/{COMPONENT}/sources", role="qa").json["items"]

    def audited(self) -> list[str]:
        with self.store.connection() as conn:
            return [r["action"] for r in conn.execute("SELECT action FROM audit_events WHERE action LIKE 'source.%' ORDER BY id").fetchall()]

    def test_a_designer_proposes_and_it_waits_for_approval(self) -> None:
        response = self.add()
        self.assertEqual((response.status, response.json["approval"]), (201, "pending"))
        (item,) = self.listed()
        self.assertEqual((item["manufacturer"], item["mpn"], item["approval"], item["rank"]), ("Globex", "ALT-1", "pending", 1))
        self.assertEqual(item["decided_by"], "")

    def test_an_approver_who_adds_approves_in_the_same_step(self) -> None:
        self.assertEqual(self.add(role="qa").json["approval"], "approved")
        (item,) = self.listed()
        self.assertEqual(item["decided_by"], "qa@example.com")

    def test_only_an_approver_can_add_a_manufacturer_that_is_new(self) -> None:
        self.assertEqual(self.add(manufacturer="Nobody Inc", role="designer").status, 400)
        self.assertEqual(self.add(manufacturer="Nobody Inc", role="qa").status, 201)

    def test_approve_reject_and_rank(self) -> None:
        first, second = self.add("ALT-1").json["id"], self.add("ALT-2").json["id"]
        self.assertEqual(self.call("POST", f"/api/supply/sources/{first}/approve", role="qa").status, 204)
        self.assertEqual(self.call("POST", f"/api/supply/sources/{second}/reject", role="admin").status, 204)
        self.assertEqual(self.call("PATCH", f"/api/supply/sources/{first}", role="qa", body={"rank": 2}).status, 204)
        items = self.listed()
        self.assertEqual([(i["mpn"], i["approval"], i["rank"]) for i in items], [("ALT-1", "approved", 2), ("ALT-2", "rejected", 2)],
                         "rejected ones go last")
        self.assertEqual(self.audited(), ["source.add", "source.add", "source.approve", "source.reject", "source.rank"])

    def test_who_may_do_what(self) -> None:
        source = self.add().json["id"]
        for role in ("designer", "viewer"):
            self.assertEqual(self.call("POST", f"/api/supply/sources/{source}/approve", role=role).status, 403, role)
            self.assertEqual(self.call("PATCH", f"/api/supply/sources/{source}", role=role, body={"rank": 2}).status, 403, role)
        self.assertEqual(self.call("GET", f"/api/supply/components/{COMPONENT}/sources", role="viewer").status, 403)
        self.assertEqual(self.add(mpn="ALT-9", role="qa").status, 201)
        self.assertEqual(self.add(mpn="ALT-8", role="viewer").status, 403)

    def test_the_same_part_cannot_be_listed_twice(self) -> None:
        self.add()
        again = self.add(mpn="alt 1")
        self.assertEqual(again.status, 400)
        self.assertEqual(again.json["detail"]["message"], "That part is already on the list.")

    def test_a_proposer_may_withdraw_their_own_pending_part_but_not_an_approved_one(self) -> None:
        pending = self.add("ALT-1").json["id"]
        approved = self.add("ALT-2").json["id"]
        self.call("POST", f"/api/supply/sources/{approved}/approve", role="qa")
        self.assertEqual(self.call("DELETE", f"/api/supply/sources/{approved}", role="designer").status, 400)
        self.assertEqual(self.call("DELETE", f"/api/supply/sources/{pending}", role="designer").status, 204)
        self.assertEqual(self.call("DELETE", f"/api/supply/sources/{approved}", role="qa").status, 204)
        self.assertEqual(self.listed(), [])

    def test_an_unknown_source_is_not_found(self) -> None:
        self.assertEqual(self.call("POST", "/api/supply/sources/nope/approve", role="qa").status, 404)

    def test_lists_are_per_component(self) -> None:
        self.add()
        other = self.call("GET", "/api/supply/components/cmp_2/sources", role="qa")
        self.assertEqual(other.json["items"], [])


if __name__ == "__main__":
    unittest.main()

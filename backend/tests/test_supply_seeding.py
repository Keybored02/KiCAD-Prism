"""Seeding listings from the catalog's vendor fields. Needs ``PRISM_DATABASE_URL``."""

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


def component(mpn="LM358DR", vendor="Mouser Electronics", sku="595-LM358DR", manufacturer="Acme", kind="mpn"):
    return {"mpn": mpn, "vendor": vendor, "vendor_part_number": sku, "manufacturer": manufacturer, "identity_kind": kind}


class ConnectorMatchTests(unittest.TestCase):
    def test_a_vendor_name_points_at_exactly_one_active_connector(self) -> None:
        from app.services.supply.seeding import connector_for

        def connector(provider, label, name, **extra):
            return {"id": name, "provider": provider, "provider_label": label, "display_name": name,
                    "enabled": True, "paused_reason": "", **extra}

        mouser, tme_at, tme_pl = connector("mouser", "Mouser", "Mouser"), connector("tme", "TME", "TME AT"), connector("tme", "TME", "TME PL")
        self.assertIs(connector_for("Mouser Electronics", [mouser, tme_at]), mouser)
        self.assertIs(connector_for("mouser", [mouser]), mouser)
        self.assertIsNone(connector_for("TME", [tme_at, tme_pl]), "two TME connectors: no guess")
        self.assertIs(connector_for("TME Electronic Components", [tme_at]), tme_at)
        self.assertIsNone(connector_for("Farnell", [mouser, tme_at]))
        self.assertIsNone(connector_for("TM", [tme_at]), "too short to mean anything")
        self.assertIsNone(connector_for("Mouser", [connector("mouser", "Mouser", "Mouser", enabled=False)]))
        self.assertIsNone(connector_for("Mouser", [connector("mouser", "Mouser", "Mouser", paused_reason="auth")]))


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply API tests")
class SeedingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_seed
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.supply_seed = database, supply_seed
        cls.users = {
            role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role)
            for role in ("viewer", "qa", "designer", "admin")
        }
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_seed_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_seed.router)
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
            for table in ("listings", "parts", "manufacturer_aliases", "manufacturers", "connectors", "audit_events"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO manufacturers (id, name, name_key) VALUES ('m1', 'Acme', 'acme')")
        # The simulated provider is called "Fake" and a vendor name has to contain it.
        self.cid = self.connectors.create(actor="seed@example.com", provider="fake", currency="EUR", display_name="Fake shop")["id"]

    def seed(self, items, role="designer"):
        with mock.patch.object(self.supply_seed, "_catalog_components", return_value=iter(items)):
            return _request(self.app, "POST", "/api/supply/seed/catalog", user=self.users[role], body=None)

    def listings(self):
        with self.store.connection() as conn:
            return conn.execute("SELECT sku, match_state, matched_by, raw_mpn FROM listings").fetchall()

    def test_a_component_naming_a_connected_vendor_gets_a_manual_listing(self) -> None:
        response = self.seed([component(vendor="Fake Electronics", sku="FAKE-LM358DR-CT")])
        self.assertEqual(response.status, 200, response.text)
        self.assertEqual(response.json, {"considered": 1, "added": 1, "already": 0, "no_connector": 0, "unknown_manufacturer": 0})
        (row,) = self.listings()
        self.assertEqual((row["sku"], row["match_state"], row["matched_by"], row["raw_mpn"]), ("FAKE-LM358DR-CT", "manual", "catalog", "LM358DR"))

    def test_running_it_again_changes_nothing(self) -> None:
        item = component(vendor="Fake", sku="FAKE-LM358DR-CT")
        self.seed([item])
        again = self.seed([item])
        self.assertEqual((again.json["added"], again.json["already"]), (0, 1))
        self.assertEqual(len(self.listings()), 1)

    def test_what_cannot_be_seeded_is_counted_not_created(self) -> None:
        response = self.seed([
            component(vendor="Farnell"),
            component(manufacturer="Nobody Inc", vendor="Fake"),
            component(vendor="Fake", sku=""),
            component(vendor="Fake", kind="provisional_ipn"),
            component(vendor="", sku="X-1"),
        ])
        self.assertEqual(response.json, {"considered": 2, "added": 0, "already": 0, "no_connector": 1, "unknown_manufacturer": 1})
        self.assertEqual(self.listings(), [])
        with self.store.connection() as conn:
            self.assertEqual(conn.execute("SELECT COUNT(*) AS n FROM manufacturers").fetchone()["n"], 1)
            self.assertEqual(conn.execute("SELECT COUNT(*) AS n FROM watches").fetchone()["n"], 0)

    def test_who_may_seed(self) -> None:
        for role, status in (("admin", 200), ("designer", 200), ("qa", 403), ("viewer", 403)):
            self.assertEqual(self.seed([], role).status, status, role)


if __name__ == "__main__":
    unittest.main()

"""Local inventory sources (decision D15): the sync into ``inventory_levels`` and the API.

Prism ships no reader for a stock server at the moment, so the sync is exercised through ``TableReader``, an
``InventoryReader`` that serves rows shaped like a stock server's lists. The tests need ``TEST_POSTGRES_URL``: stock lands on catalog components.
"""

from __future__ import annotations

import dataclasses
import json
import os
import sys
import tempfile
import unittest
import unittest.mock
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from supply_api_helpers import request as _request  # noqa: E402
from support.postgres import CATALOG_URL, requires_scratch_postgres  # noqa: E402

AUTHOR = "author@example.com"
NOW = datetime(2026, 10, 28, 12, 0, tzinfo=timezone.utc)
HOST = "stock.example.com"


def _token() -> str:
    # Built at run time: no token-shaped literal in the repository.
    return "-".join(("test", uuid.uuid4().hex))


def _text(value: Any) -> str:
    return "" if value is None else str(value).strip()


class TableReader:
    """An ``InventoryReader`` over tables of rows (``part/``, ``company/part/manufacturer/``, ``company/part/``, ``stock/location/``,
    ``stock/``) as a stock server lists them. ``fail`` is raised by a read; ``asked`` keeps the category of each read."""

    def __init__(self, tables: dict[str, list[dict]], *, fail: Exception | None = None) -> None:
        self.tables = tables
        self.fail = fail
        self.asked: list[int | None] = []

    def close(self) -> None:
        pass

    def read(self, category: int | None):
        from app.services.supply.inventory.base import STATUS_NAMES, STATUS_OK, InventoryRead, Location, Part, StockRecord

        self.asked.append(category)
        if self.fail is not None:
            raise self.fail
        rows = lambda name: self.tables.get(name, [])  # noqa: E731
        mpns: dict[int, list[tuple[str, str]]] = {}
        for row in rows("company/part/manufacturer/"):
            detail = row.get("manufacturer_detail")
            mpns.setdefault(row["part"], []).append((_text(detail.get("name")) if isinstance(detail, dict) else "", _text(row.get("MPN"))))
        skus: dict[int, list[tuple[str, str]]] = {}
        for row in rows("company/part/"):
            detail = row.get("supplier_detail")
            skus.setdefault(row["part"], []).append((_text(detail.get("name")) if isinstance(detail, dict) else "", _text(row.get("SKU"))))
        parts = {
            row["pk"]: Part(
                pk=row["pk"], name=_text(row.get("name")), ipn=_text(row.get("IPN")), units=_text(row.get("units")),
                mpns=tuple(mpns.get(row["pk"], ())), skus=tuple(skus.get(row["pk"], ())),
            )
            for row in rows("part/")
        }
        locations = {
            row["pk"]: Location(pk=row["pk"], pathstring=_text(row.get("pathstring")), external=row.get("external") is True)
            for row in rows("stock/location/")
        }
        stock = [
            StockRecord(
                pk=row["pk"], part=row["part"], quantity=float(row.get("quantity") or 0), allocated=float(row.get("allocated") or 0),
                status=row.get("status", STATUS_OK), status_text=_text(row.get("status_text")) or STATUS_NAMES.get(row.get("status", STATUS_OK), ""),
                location=row.get("location"), batch=_text(row.get("batch")), updated="",
            )
            for row in rows("stock/")
        ]
        return InventoryRead(server="Stores", api_version=1, parts=parts, locations=locations, stock=stock)


@requires_scratch_postgres("inventory sources")
class InventoryKindTests(unittest.TestCase):
    def test_push_pushes_and_csv_is_fed_and_no_server_is_read_yet(self) -> None:
        from app.services.supply.inventory import registry, sources

        self.assertEqual(
            [(spec.kind, spec.pulled, spec.pushed) for spec in registry.list_specs()],
            [("csv", False, False), ("push", False, True)],
        )
        self.assertEqual(sources._kind("push"), "push")
        for kind in ("csv", "inventree", "partdb"):
            with self.assertRaises(sources.SourceError):
                sources._kind(kind)


class InventorySyncTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_inventory
        from app.core.errors import install_error_handlers
        from app.core.security import AuthenticatedUser
        from app.services.component_catalog_service_postgres import ComponentCatalogPostgresService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.tempdir = tempfile.TemporaryDirectory()
        cls.catalog = ComponentCatalogPostgresService(store_root=Path(cls.tempdir.name) / "components", database_url=CATALOG_URL)
        cls.catalog.initialize()
        cls.store = type("CatalogSupplyStore", (SupplyStore,), {"url": CATALOG_URL})()
        cls.store._initialized = True
        cls.ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.users = {role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role) for role in ("viewer", "designer", "qa", "admin")}
        cls.app = FastAPI()
        install_error_handlers(cls.app)
        cls.app.include_router(supply_inventory.router)
        service = type("S", (), {"store": cls.store, "keyring": lambda self: cls.ring})()
        cls.service_patch = unittest.mock.patch.object(supply_connectors, "service", service)
        cls.service_patch.start()
        # No reader ships, so the sync is read through a kind of the tests' own (the table's check still names this one).
        from app.services.supply.inventory import registry
        from app.services.supply.inventory.base import InventorySourceSpec

        reading = InventorySourceSpec(
            kind="inventree", label="Test server", level_source="inventree", factory=lambda url, token: TableReader({}), categories=True,
        )
        cls.kind_patch = unittest.mock.patch.dict(registry._specs, {"inventree": reading})
        cls.kind_patch.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.kind_patch.stop()
        cls.service_patch.stop()
        cls.tempdir.cleanup()

    def _component(self, *, mpn: str | None = None, sap_code: str = "", manufacturer: str = "") -> dict:
        token = uuid.uuid4().hex[:10]
        component = self.catalog.create_manual_component(
            value="10k", description="Inventory test", datasheet="https://example.com/r.pdf",
            manufacturer=manufacturer or f"Maker {token}", manufacturer_part_number=mpn or f"INV-{token}", sap_code=sap_code, actor=AUTHOR,
        )
        self.addCleanup(self.catalog.deactivate_component, str(component["id"]), actor=AUTHOR, reason="inventory test cleanup")
        return component

    def _source(self, category_id: int | None = 7) -> str:
        from app.services.supply.inventory import sources

        with self.store.connection() as conn:
            row = sources.create(
                conn, self.ring, AUTHOR, display_name="Stock", url=f"https://{HOST}", token=_token(), category_id=category_id, kind="inventree",
            )
        self.addCleanup(self._drop_source, row["id"])
        return row["id"]

    def _drop_source(self, source_id: str) -> None:
        from app.services.supply.inventory import sources

        with self.store.connection() as conn:
            if conn.execute("SELECT 1 FROM inventory_sources WHERE id = %s", (source_id,)).fetchone():
                sources.delete(conn, source_id, AUTHOR)

    def _sync(self, source_id: str, server: TableReader, now: datetime = NOW) -> dict:
        from app.services.supply.inventory import sync

        return sync.sync(self.store, self.ring, source_id, client_factory=lambda url, token: server, now=now)

    def _levels(self, source_id: str) -> list[dict]:
        with self.store.connection() as conn:
            return [dict(row) for row in conn.execute(
                "SELECT component_id, source_record_id, quantity, allocated, inventory_status, fetch_status, location_path, external, batch "
                "FROM inventory_levels WHERE source_id = %s ORDER BY source_record_id", (source_id,)).fetchall()]

    def _unmatched(self, source_id: str) -> dict[str, str]:
        with self.store.connection() as conn:
            return {row["remote_part"]: row["reason"] for row in conn.execute(
                "SELECT remote_part, reason FROM inventory_unmatched WHERE source_id = %s", (source_id,)).fetchall()}

    def _server(self, sap: str, mpn: str, shared: str, stock: list[dict]) -> TableReader:
        return TableReader({
            "part/": [
                {"pk": 1, "name": "By SAP code", "IPN": sap}, {"pk": 2, "name": "By MPN", "IPN": ""},
                {"pk": 3, "name": "Shared MPN", "IPN": ""}, {"pk": 4, "name": "Unknown", "IPN": "99999999"},
            ],
            "company/part/manufacturer/": [
                {"pk": 11, "part": 2, "MPN": mpn, "manufacturer_detail": {"name": "Unknown manufacturer"}},
                {"pk": 12, "part": 3, "MPN": shared, "manufacturer_detail": {"name": "Unknown manufacturer"}},
            ],
            "stock/location/": [{"pk": 50, "pathstring": "WH1/A/01"}, {"pk": 51, "pathstring": "EXT/VENDOR1", "external": True}],
            "stock/": stock,
        })

    def test_stock_lands_on_components_matched_by_sap_code_then_mpn(self) -> None:
        sap = str(uuid.uuid4().int)[:9]
        by_sap = self._component(sap_code=sap)
        by_mpn = self._component()
        shared = f"SHARED-{uuid.uuid4().hex[:8]}"
        self._component(mpn=shared)
        self._component(mpn=shared)
        source_id = self._source()
        stock = [
            {"pk": 101, "part": 1, "quantity": 400, "allocated": 100, "status": 10, "location": 50, "batch": "L1"},
            {"pk": 102, "part": 1, "quantity": 50, "status": 75, "status_text": "On hold", "location": 51},
            {"pk": 103, "part": 2, "quantity": 7, "status": 10, "location": 50},
            {"pk": 104, "part": 3, "quantity": 9, "status": 10},
            {"pk": 105, "part": 4, "quantity": 3, "status": 10},
        ]
        result = self._sync(source_id, self._server(sap, by_mpn["mpn"], shared, stock))
        self.assertEqual((result["status"], result["matched"], result["unmatched"]), ("ok", 2, 2))
        levels = self._levels(source_id)
        self.assertEqual(
            [(row["component_id"], row["source_record_id"], row["quantity"], row["allocated"], row["inventory_status"], row["location_path"], row["external"]) for row in levels],
            [
                (str(by_sap["id"]), "101", 400.0, 100.0, "available", "WH1/A/01", False),
                (str(by_sap["id"]), "102", 50.0, 0.0, "on hold", "EXT/VENDOR1", True),
                (str(by_mpn["id"]), "103", 7.0, 0.0, "available", "WH1/A/01", False),
            ],
        )
        self.assertEqual(self._unmatched(source_id), {"3": "mpn_shared", "4": "no_component"})

    def test_the_whole_inventory_matches_by_prism_id_and_by_a_distributor_number(self) -> None:
        from app.services.supply import parts

        by_id = self._component()
        by_sku = self._component()
        sku = f"KIT-{uuid.uuid4().hex[:10]}"
        with self.store.connection() as conn:
            part = parts.ensure_part(conn, by_sku["manufacturer"], by_sku["mpn"], AUTHOR)
            conn.execute(
                "INSERT INTO component_parts (component_id, part_id, role, approval, created_by) VALUES (%s, %s, 'alternate', 'approved', %s) "
                "ON CONFLICT DO NOTHING", (str(by_sku["id"]), part.id, AUTHOR),
            )
            connector = uuid.uuid4().hex
            conn.execute("INSERT INTO supply_connectors (id, provider, display_name) VALUES (%s, 'csv', %s)", (connector, f"inv {connector[:6]}"))
            conn.execute(
                "INSERT INTO supply_listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) VALUES (%s, %s, %s, %s, 'x', 'x', 'exact')",
                (uuid.uuid4().hex, connector, sku, part.id),
            )
        self.addCleanup(self._drop_connector, connector)
        source_id = self._source(category_id=None)
        with self.store.connection() as conn:
            from app.services.supply.inventory import sync

            self.assertIn(source_id, sync.due(conn, NOW), "a source without a category is read, whole")
        server = TableReader({
            "part/": [{"pk": 1, "name": "By id", "IPN": str(by_id["id"])}, {"pk": 2, "name": "By SKU", "IPN": ""}],
            "company/part/": [{"pk": 7, "part": 2, "SKU": sku.lower(), "supplier_detail": {"name": "Somewhere"}}],
            "stock/": [{"pk": 201, "part": 1, "quantity": 5, "status": 10}, {"pk": 202, "part": 2, "quantity": 6, "status": 10}],
        })
        result = self._sync(source_id, server)
        self.assertEqual((result["status"], result["matched"], result["unmatched"]), ("ok", 2, 0))
        self.assertEqual(
            [(row["component_id"], row["source_record_id"]) for row in self._levels(source_id)],
            [(str(by_id["id"]), "201"), (str(by_sku["id"]), "202")],
        )
        self.assertEqual(server.asked, [None], "a source without a category reads the whole inventory")

    def _drop_connector(self, connector: str) -> None:
        with self.store.connection() as conn:
            conn.execute("DELETE FROM supply_connectors WHERE id = %s", (connector,))

    def test_a_read_replaces_the_stock_and_a_failed_read_keeps_it_stale(self) -> None:
        from app.services.supply.providers.base import ProviderError, Unavailable

        sap = str(uuid.uuid4().int)[:9]
        self._component(sap_code=sap)
        source_id = self._source()
        first = [{"pk": 201, "part": 1, "quantity": 5, "status": 10}, {"pk": 202, "part": 1, "quantity": 6, "status": 10}]
        self._sync(source_id, self._server(sap, "X", "Y", first))
        self._sync(source_id, self._server(sap, "X", "Y", first[:1]), NOW + timedelta(days=1))
        self.assertEqual([row["source_record_id"] for row in self._levels(source_id)], ["201"], "a record that left stock is gone")

        result = self._sync(source_id, TableReader({}, fail=Unavailable("down")), NOW + timedelta(days=2))
        self.assertEqual(result["status"], "error")
        self.assertEqual([(row["source_record_id"], row["fetch_status"]) for row in self._levels(source_id)], [("201", "error")])
        result = self._sync(
            source_id, TableReader(self._server(sap, "X", "Y", []).tables, fail=ProviderError("stock stopped at 0 of 9 rows")), NOW + timedelta(days=2),
        )
        self.assertEqual(result["status"], "error", "a short page is a failed read")
        self.assertEqual([(row["source_record_id"], row["fetch_status"]) for row in self._levels(source_id)], [("201", "error")],
                         "not an empty inventory")

        from app.services.supply import dashboard

        with self.store.connection() as conn:
            conn.execute(
                "INSERT INTO supply_connectors (id, provider, storefront, display_name, last_ok_at, last_error_at) VALUES ('c-down', 'fake', 'XA', 'Down shop', %s, %s), "
                "('c-ok', 'fake', 'XB', 'Fine shop', %s, %s)", (NOW, NOW + timedelta(hours=1), NOW + timedelta(hours=1), NOW))
            self.addCleanup(self._drop_connectors)
            feeds = dashboard.failing_feeds(conn)
        stores = [feed for feed in feeds if feed["kind"] == "stores"]
        self.assertEqual([feed["name"] for feed in stores], ["Stock"])
        self.assertEqual(stores[0]["since"][:10], (NOW + timedelta(days=1)).date().isoformat(), "the last good read")
        self.assertEqual([(feed["name"], feed["since"][:10]) for feed in feeds if feed["kind"] == "connector"], [("Down shop", NOW.date().isoformat())])

    def _drop_connectors(self) -> None:
        with self.store.connection() as conn:
            conn.execute("DELETE FROM supply_connectors WHERE id IN ('c-down', 'c-ok')")

    def test_a_person_s_link_answers_an_unmatched_part(self) -> None:
        from app.services.supply.inventory import sync

        component = self._component()
        source_id = self._source()
        stock = [{"pk": 301, "part": 4, "quantity": 3, "status": 10}]
        self._sync(source_id, self._server("", "X", "Y", stock))
        self.assertEqual(self._unmatched(source_id), {"4": "no_component"})
        with self.store.connection() as conn:
            sync.link(conn, source_id, "4", str(component["id"]), AUTHOR)
        self._sync(source_id, self._server("", "X", "Y", stock))
        self.assertEqual((self._unmatched(source_id), [row["component_id"] for row in self._levels(source_id)]), ({}, [str(component["id"])]))

    def test_a_link_made_while_the_read_fails_stays_listed_as_linked(self) -> None:
        from app.services.supply.inventory import sync

        component, other = self._component(), self._component()
        source_id = self._source()
        stock = [{"pk": 302, "part": 5, "quantity": 7, "status": 10}]
        self._sync(source_id, self._server("", "X", "Y", stock))

        def counted() -> int:
            with self.store.connection() as conn:
                return conn.execute("SELECT unmatched FROM inventory_sources WHERE id = %s", (source_id,)).fetchone()["unmatched"]

        before = counted()
        with self.store.connection() as conn:
            sync.link(conn, source_id, "5", str(other["id"]), AUTHOR)
            sync.link(conn, source_id, "5", str(component["id"]), AUTHOR)
            sync.fail(conn, source_id, "unavailable: cannot connect", NOW)
            (row,) = sync.unmatched(conn, source_id)
        self.assertEqual(counted(), before - 1, "it no longer needs a person, counted once however often it is linked")
        self.assertEqual((row["remote_part"], row["linked_component_id"], row["linked_mpn"]), ("5", str(component["id"]), component["mpn"]))
        self._sync(source_id, self._server("", "X", "Y", stock))
        self.assertEqual(self._unmatched(source_id), {}, "the read lands it on the component")

    def test_a_new_server_token_or_category_reads_the_source_again_and_marks_its_stock_stale(self) -> None:
        from app.services.supply.inventory import sources

        sap = str(uuid.uuid4().int)[:9]
        self._component(sap_code=sap)
        source_id = self._source()
        self._sync(source_id, self._server(sap, "X", "Y", [{"pk": 401, "part": 1, "quantity": 5, "status": 10}]))
        with self.store.connection() as conn:
            sources.update(conn, self.ring, source_id, AUTHOR, display_name="Stores")
            self.assertIsNotNone(sources.get(conn, source_id)["last_sync_at"], "a new name changes nothing that was read")
            sources.update(conn, self.ring, source_id, AUTHOR, category_id=8)
            self.assertIsNone(sources.get(conn, source_id)["last_sync_at"], "due now")
        self.assertEqual([(row["source_record_id"], row["fetch_status"]) for row in self._levels(source_id)], [("401", "error")],
                         "kept, marked stale, until the next read replaces it")

    def test_a_read_under_settings_changed_while_it_ran_stores_nothing(self) -> None:
        from app.services.supply.inventory import sources
        from app.services.supply.providers.base import Unavailable

        sap = str(uuid.uuid4().int)[:9]
        self._component(sap_code=sap)
        source_id = self._source()
        self._sync(source_id, self._server(sap, "X", "Y", [{"pk": 501, "part": 1, "quantity": 5, "status": 10}]))
        store, ring = self.store, self.ring

        def edited_meanwhile(server: TableReader) -> TableReader:
            # The edit lands between reading the source's settings and storing what was read under them.
            class Edited(type(server)):  # type: ignore[misc]
                def read(self, category):
                    if not getattr(self, "edited", False):
                        self.edited = True
                        with store.connection() as conn:
                            sources.update(conn, ring, source_id, AUTHOR, category_id=9)
                    return super().read(category)

            server.__class__ = Edited
            return server

        result = self._sync(source_id, edited_meanwhile(self._server(sap, "X", "Y", [{"pk": 502, "part": 1, "quantity": 7, "status": 10}])),
                            NOW + timedelta(days=1))
        self.assertEqual(result["status"], "error")
        self.assertIn("superseded", result["error"])
        self.assertEqual([(row["source_record_id"], row["fetch_status"]) for row in self._levels(source_id)], [("501", "error")],
                         "the old category's stock is not published as fresh")

        class EditedThenDown(TableReader):
            def read(self, category):
                with store.connection() as conn:
                    sources.update(conn, ring, source_id, AUTHOR, category_id=10)
                raise Unavailable("down")

        self.assertIn("superseded", self._sync(source_id, EditedThenDown({}), NOW + timedelta(days=2))["error"])
        with self.store.connection() as conn:
            self.assertIsNone(sources.get(conn, source_id)["last_sync_at"], "the failed old read does not settle the new settings' read")

    def test_two_components_with_one_mpn_are_told_apart_by_any_spelling_of_the_maker(self) -> None:
        from app.services.supply import parts

        mpn = f"LM-{uuid.uuid4().hex[:8]}"
        ti, other = self._component(mpn=mpn, manufacturer="Texas Instruments"), self._component(mpn=mpn)
        with self.store.connection() as conn:
            maker = parts.ensure_manufacturer(conn, "Texas Instruments", AUTHOR)
            conn.execute(
                "INSERT INTO supply_manufacturer_aliases (alias_key, alias_text, manufacturer_id, status, confirmed_by) "
                "VALUES ('ti', 'TI', %s, 'confirmed', %s) ON CONFLICT (alias_key) DO NOTHING", (maker, AUTHOR))
        source_id = self._source()
        server = TableReader({
            "part/": [{"pk": 9, "name": "Op amp", "IPN": ""}],
            "company/part/manufacturer/": [{"pk": 19, "part": 9, "MPN": mpn, "manufacturer_detail": {"name": "TI"}}],
            "stock/location/": [{"pk": 50, "pathstring": "WH1/A/01"}],
            "stock/": [{"pk": 901, "part": 9, "quantity": 12, "status": 10, "location": 50}],
        })
        self._sync(source_id, server)
        self.assertEqual([row["component_id"] for row in self._levels(source_id)], [str(ti["id"])], "TI is Texas Instruments")
        self.assertNotEqual(str(ti["id"]), str(other["id"]))

    def test_parts_set_aside_stay_aside_across_reads_and_come_back_on_restore(self) -> None:
        from app.services.supply.inventory import sources, sync

        source_id = self._source()
        stock = [{"pk": 501, "part": 4, "quantity": 3, "status": 10}, {"pk": 502, "part": 3, "quantity": 8, "status": 10}]
        self._sync(source_id, self._server("", "X", "Y", stock))
        with self.store.connection() as conn:
            before = sync.unmatched_counts(conn, source_id)
            self.assertEqual(sync.set_ignored(conn, source_id, ["4", "4", "999"], True, AUTHOR), 1, "a part the source doesn't list is left alone")
            after = sync.unmatched_counts(conn, source_id)
            self.assertEqual((after["waiting"], after["ignored"]), (before["waiting"] - 1, 1))
            self.assertEqual(sources.get(conn, source_id)["unmatched"], after["waiting"], "the source's count follows")
            self.assertEqual([row["remote_part"] for row in sync.unmatched(conn, source_id, group="ignored")], ["4"])
            self.assertNotIn("4", [row["remote_part"] for row in sync.unmatched(conn, source_id)])
        self._sync(source_id, self._server("", "X", "Y", stock), NOW + timedelta(days=1))
        with self.store.connection() as conn:
            self.assertEqual(sync.unmatched_counts(conn, source_id)["ignored"], 1, "a read keeps it aside")
            self.assertEqual(sources.get(conn, source_id)["unmatched"], after["waiting"])
            self.assertEqual(sync.set_ignored(conn, source_id, ["4"], False, AUTHOR), 1)
            self.assertEqual(sync.unmatched_counts(conn, source_id)["waiting"], before["waiting"])
            reason = sync.unmatched(conn, source_id, group="no_component")
            self.assertTrue(all(row["reason"] == "no_component" for row in reason))
            with self.assertRaises(sources.SourceError):
                sync.unmatched(conn, source_id, group="everything")
        path = f"/api/supply/inventory-sources/{source_id}/unmatched"
        refused = _request(self.app, "POST", f"{path}/ignore", user=self.users["designer"], body={"remote_parts": ["3"], "ignore": True})
        self.assertEqual(refused.status, 403, "QA and administrators decide")
        done = _request(self.app, "POST", f"{path}/ignore", user=self.users["qa"], body={"remote_parts": ["3"], "ignore": True})
        self.assertEqual((done.status, done.json), (200, {"changed": 1}))
        self.assertEqual(_request(self.app, "GET", f"{path}/counts", user=self.users["designer"]).json["ignored"], 1)
        self.assertEqual([row["remote_part"] for row in _request(self.app, "GET", path, user=self.users["designer"], query="group=ignored").json], ["3"])

    def test_only_due_sources_are_read(self) -> None:
        from app.services.supply.inventory import sync

        source_id = self._source()
        with self.store.connection() as conn:
            self.assertIn(source_id, sync.due(conn, NOW))
            conn.execute("UPDATE inventory_sources SET last_sync_at = %s WHERE id = %s", (NOW - timedelta(hours=2), source_id))
            self.assertNotIn(source_id, sync.due(conn, NOW), "read two hours ago, every 24 hours")

    def test_admins_add_push_sources_and_no_server_kind_can_be_added(self) -> None:
        body = {"display_name": "Stores", "kind": "push"}
        self.assertEqual(_request(self.app, "POST", "/api/supply/inventory-sources", user=self.users["designer"], body=body).status, 403)
        made = _request(self.app, "POST", "/api/supply/inventory-sources", user=self.users["admin"], body=body)
        self.assertEqual(made.status, 201)
        self.addCleanup(self._drop_source, made.json["id"])
        self.assertEqual((made.json["kind"], made.json["base_url"], made.json["has_token"]), ("push", "", False))
        listed = _request(self.app, "GET", "/api/supply/inventory-sources", user=self.users["designer"])
        self.assertIn(made.json["id"], [row["id"] for row in listed.json])
        server = _request(self.app, "POST", "/api/supply/inventory-sources", user=self.users["admin"], body={**body, "kind": "inventree", "base_url": f"https://{HOST}"})
        self.assertEqual(server.status, 422, "Prism reads no stock server at the moment")

    def test_qa_links_an_unmatched_part_and_its_stock_lands_at_once(self) -> None:
        from app.services.supply.inventory import registry

        component = self._component()
        source_id = self._source()
        server = self._server("", "X", "Y", [{"pk": 401, "part": 4, "quantity": 8, "status": 10}])
        self._sync(source_id, server)
        path = f"/api/supply/inventory-sources/{source_id}/unmatched/4/link"
        self.assertEqual(_request(self.app, "POST", path, user=self.users["designer"], body={"component_id": str(component["id"])}).status, 403)
        missing = _request(self.app, "POST", path, user=self.users["qa"], body={"component_id": "no-such-component"})
        self.assertEqual((missing.status, missing.json["code"]), (400, "invalid_source"))
        reading = dataclasses.replace(registry.get_spec("inventree"), factory=lambda url, token: server)
        with unittest.mock.patch.dict(registry._specs, {"inventree": reading}):
            linked = _request(self.app, "POST", path, user=self.users["qa"], body={"component_id": str(component["id"])})
        self.assertEqual((linked.status, linked.json["matched"], linked.json["unmatched"]), (200, 1, 0))
        self.assertEqual([row["component_id"] for row in self._levels(source_id)], [str(component["id"])])

    def test_local_stock_splits_available_held_and_at_vendor(self) -> None:
        from app.api import supply_component_parts

        sap = str(uuid.uuid4().int)[:9]
        component = self._component(sap_code=sap)
        source_id = self._source()
        stock = [
            {"pk": 501, "part": 1, "quantity": 400, "allocated": 100, "status": 10, "location": 50},
            {"pk": 502, "part": 1, "quantity": 50, "status": 75, "status_text": "On hold", "location": 50},
            {"pk": 503, "part": 1, "quantity": 30, "status": 10, "location": 51},
        ]
        self._sync(source_id, self._server(sap, "X", "Y", stock))
        app = type(self.app)()
        app.include_router(supply_component_parts.router)
        answer = _request(app, "GET", f"/api/supply/components/{component['id']}/local-stock", user=self.users["designer"])
        self.assertEqual(answer.status, 200)
        self.assertEqual((answer.json["available"], answer.json["held"], answer.json["at_vendor"]), (300.0, 50.0, 30.0))
        self.assertEqual([(row["location"], row["status"], row["external"]) for row in answer.json["rows"]], [
            ("WH1/A/01", "available", False), ("WH1/A/01", "on hold", False), ("EXT/VENDOR1", "available", True),
        ])
        self.assertEqual(_request(app, "GET", f"/api/supply/components/{component['id']}/local-stock", user=self.users["viewer"]).status, 403)
        from app.api import supply_bom
        from app.services.supply.inventory import levels

        with self.store.connection() as conn:
            self.assertEqual(levels.available_by_component(conn, [str(component["id"]), "no-stock"]), {str(component["id"]): 300.0})
        bom = type(self.app)()
        bom.include_router(supply_bom.router)
        body = {"components": [{"key": str(component["id"]), "manufacturer": component["manufacturer"], "mpn": component["mpn"], "quantity": 1}]}
        status = _request(bom, "POST", "/api/supply/bom/components-status", user=self.users["designer"], body=body).json["items"][str(component["id"])]
        self.assertEqual((status["local_available"], status["status"], status["watched"]), (300.0, "unknown", False), "local stock shows on an untracked component")
        self.assertEqual(status["stores"], {"state": "stock", "available": 300.0, "since": None})
        self.assertEqual(answer.json["stores"]["state"], "stock")
        with self.store.connection() as conn:
            self.assertEqual(levels.stores_state(conn, ["no-stock"])["no-stock"]["state"], "none", "connected, nothing held")
            conn.execute("UPDATE inventory_sources SET last_status = 'error' WHERE id = %s", (source_id,))
            down = levels.stores_state(conn, [str(component["id"]), "no-stock"])
        self.assertEqual({state["state"] for state in down.values()}, {"down"}, "a failing feed makes every answer unsure")
        self.assertTrue(down[str(component["id"])]["since"], "it says when the stock was last read")
        self.assertEqual(down[str(component["id"])]["available"], 300.0, "the last figures stay")

    def test_stores_are_not_connected_without_a_source_or_any_stock(self) -> None:
        from app.services.supply.inventory import levels

        class Empty:
            def execute(self, *_args):
                return self

            def fetchall(self):
                return []

            def fetchone(self):
                return None

        with unittest.mock.patch.object(levels.component_parts, "library_present", return_value=True), \
                unittest.mock.patch.object(levels, "available_by_component", return_value={}):
            self.assertEqual(levels.stores_state(Empty(), ["c1"]), {"c1": {"state": "not_connected", "available": None, "since": None}})


if __name__ == "__main__":
    unittest.main()

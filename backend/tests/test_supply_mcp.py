"""The read-only MCP endpoint: protocol basics, the tools, and who may ask. Needs ``PRISM_DATABASE_URL``."""

from __future__ import annotations

import json
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


def rpc(method: str, params=None, request_id=1):
    return {"jsonrpc": "2.0", "id": request_id, "method": method, **({} if params is None else {"params": params})}


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply tests")
class McpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors, supply_mcp
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply import parts, usage
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.database, cls.parts, cls.usage = database, parts, usage
        cls.users = {role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role) for role in ("viewer", "qa", "designer", "admin")}
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_mcp_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()
        ring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.connectors = ConnectorService(cls.store, keyring_factory=lambda: ring, allow_dev=lambda: True)
        cls.app = FastAPI()
        cls.app.include_router(supply_mcp.router)
        cls.patcher = mock.patch.object(supply_connectors, "service", cls.connectors)
        cls.patcher.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.patcher.stop()
        from support.postgres import APPLICATION_URL, drop_schema

        drop_schema(cls.store.schema, url=APPLICATION_URL)

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("supply_bom_usage_projects", "supply_listings", "supply_watches", "supply_parts", "supply_manufacturer_aliases", "supply_manufacturers", "supply_connectors"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO supply_manufacturers (id, name, name_key) VALUES ('m1', 'Acme', 'acme')")
            conn.execute("INSERT INTO supply_connectors (id, provider) VALUES ('c1', 'fake')")

    def ask(self, message, role="designer"):
        response = _request(self.app, "POST", "/api/supply/mcp", user=self.users[role], body=message)
        return response

    def call_tool(self, name: str, arguments: dict, role="designer"):
        response = self.ask(rpc("tools/call", {"name": name, "arguments": arguments}), role)
        self.assertEqual(response.status, 200, response.text)
        return response.json["result"]

    def stocked(self, mpn: str, stock: int) -> str:
        with self.store.connection() as conn:
            part = self.parts.ensure_part(conn, "Acme", mpn, "seed@example.com").id
            conn.execute(
                "INSERT INTO supply_listings (id, connector_id, sku, part_id, raw_mpn, raw_manufacturer, match_state) VALUES (%s, 'c1', %s, %s, 'x', 'x', 'exact')",
                (f"l-{mpn}", mpn, part))
            conn.execute("INSERT INTO supply_offers (listing_id, fetched_at, stock) VALUES (%s, %s, %s)", (f"l-{mpn}", NOW, stock))
        return part

    def test_it_introduces_itself_and_lists_three_read_only_tools(self) -> None:
        init = self.ask(rpc("initialize", {"protocolVersion": "2025-03-26"})).json["result"]
        self.assertEqual((init["protocolVersion"], "tools" in init["capabilities"]), ("2025-03-26", True))
        tools = self.ask(rpc("tools/list")).json["result"]["tools"]
        self.assertEqual(sorted(tool["name"] for tool in tools), ["best_alternate", "part_status", "parts_at_risk"])
        self.assertEqual(self.ask(rpc("ping")).json["result"], {})

    def test_a_notification_gets_no_answer_and_bad_requests_get_errors(self) -> None:
        self.assertEqual(self.ask({"jsonrpc": "2.0", "method": "notifications/initialized"}).status, 202)
        self.assertEqual(self.ask(rpc("nope")).json["error"]["code"], -32601)
        self.assertEqual(self.ask({"hello": "world"}).json["error"]["code"], -32600)
        self.assertEqual(self.ask(rpc("tools/call", {"name": "delete_everything"})).json["error"]["code"], -32602)

    def test_only_someone_who_reads_supply_may_ask(self) -> None:
        self.assertEqual(self.ask(rpc("tools/list"), role="viewer").status, 403)

    def test_part_status_says_how_a_part_stands_and_an_unknown_part_is_an_error_result(self) -> None:
        self.stocked("ABC-1", 0)
        status = json.loads(self.call_tool("part_status", {"manufacturer": "Acme", "mpn": "ABC-1"})["content"][0]["text"])
        self.assertEqual((status["mpn"], status["stock"], status["status"]), ("ABC-1", 0, "error"))
        unknown = self.call_tool("part_status", {"manufacturer": "Acme", "mpn": "NOPE"})
        self.assertTrue(unknown["isError"])

    def test_parts_at_risk_lists_what_needs_a_look_in_a_project_the_caller_may_open(self) -> None:
        self.stocked("OK-1", 5000)
        self.stocked("OUT-1", 0)
        with self.store.connection() as conn:
            self.usage.store_project(conn, "prj_1", "One", "rev1", self.usage.lines_from_components([
                {"reference": "R1", "fields": {"Manufacturer": "Acme", "Manufacturer Part Number": "OK-1", "DNP": "No", "In BOM": "Yes"}},
                {"reference": "R2", "fields": {"Manufacturer": "Acme", "Manufacturer Part Number": "OUT-1", "DNP": "No", "In BOM": "Yes"}},
            ]), NOW)
        with mock.patch("app.api.supply_mcp.get_project_for_role_or_404", return_value=SimpleNamespace(id="prj_1")):
            result = self.call_tool("parts_at_risk", {"project_id": "prj_1"})
        listed = json.loads(result["content"][0]["text"])
        self.assertEqual([item["mpn"] for item in listed["at_risk"]], ["OUT-1"])
        with mock.patch("app.api.supply_mcp.get_project_for_role_or_404", side_effect=Exception("not found")):
            self.assertTrue(self.call_tool("parts_at_risk", {"project_id": "prj_1"})["isError"])


if __name__ == "__main__":
    unittest.main()

"""The supply connector HTTP API: roles, token scopes, error mapping, redaction.

Needs ``PRISM_DATABASE_URL``. Requests go through the real router into a
``ConnectorService`` on a disposable schema.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import unittest
import uuid
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()


def _request(app, method: str, path: str, *, user, body=None):
    """One ASGI request without adding httpx to Prism's runtime/test lock."""

    from app.core.security import get_current_user

    payload = b"" if body is None else json.dumps(body).encode()
    messages: list[dict] = []
    sent = False

    async def receive() -> dict:
        nonlocal sent
        if sent:
            return {"type": "http.disconnect"}
        sent = True
        return {"type": "http.request", "body": payload, "more_body": False}

    async def send(message: dict) -> None:
        messages.append(message)

    app.dependency_overrides[get_current_user] = lambda: user
    try:
        asyncio.run(app({
            "type": "http", "http_version": "1.1", "method": method, "scheme": "http",
            "path": path, "raw_path": path.encode(), "query_string": b"",
            "headers": [(b"content-type", b"application/json")],
            "client": ("test", 1), "server": ("test", 80), "root_path": "",
        }, receive, send))
    finally:
        app.dependency_overrides.pop(get_current_user, None)
    start = next(m for m in messages if m["type"] == "http.response.start")
    data = b"".join(m.get("body", b"") for m in messages if m["type"] == "http.response.body")
    return SimpleNamespace(
        status=start["status"],
        text=data.decode("utf-8", "replace"),
        json=json.loads(data) if data else None,
    )


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply API tests")
class SupplyConnectorsApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from fastapi import FastAPI

        from app.api import supply_connectors
        from app.core.security import AuthenticatedUser
        from app.services.postgres_database import database
        from app.services.supply.connectors import ConnectorService
        from app.services.supply.providers import registry
        from app.services.supply.providers.base import CredentialField, ProviderSpec
        from app.services.supply.providers.fake import FakeProvider
        from app.services.supply.store import SupplyStore
        from app.services.trackers.secrets import CredentialKeyring

        cls.module = supply_connectors
        cls.database = database
        cls.registry = registry
        cls.users = {
            role: AuthenticatedUser(email=f"{role}@example.com", name=role, role=role)
            for role in ("viewer", "qa", "designer", "admin")
        }
        cls.AuthenticatedUser = AuthenticatedUser

        schema = f"supply_api_test_{uuid.uuid4().hex[:8]}"
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": schema})()
        cls.store.initialize()
        cls.keyring = CredentialKeyring({"t": os.urandom(32)}, "t")
        cls.allow_dev = True
        cls.locked = False

        def keyring():
            if cls.locked:
                from app.services.trackers.secrets import SecretStoreLocked

                raise SecretStoreLocked("locked")
            return cls.keyring

        registry.register(ProviderSpec(
            key="demo_keyed", label="Demo keyed", capabilities=frozenset({"search"}),
            max_batch=10, stock_pooling="separate",
            credential_fields=(CredentialField("api_key", "API key"),),
            factory=lambda config: FakeProvider(config),
        ), replace=True)

        cls.service = ConnectorService(cls.store, keyring_factory=keyring, allow_dev=lambda: cls.allow_dev)
        cls.app = FastAPI()
        cls.app.include_router(supply_connectors.router)
        supply_connectors.register_validation_redaction(cls.app)
        cls.patcher = mock.patch.object(supply_connectors, "service", cls.service)
        cls.patcher.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.patcher.stop()
        cls.registry.unregister("demo_keyed")
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        type(self).allow_dev = True
        type(self).locked = False
        with self.store.connection() as conn:
            conn.execute("DELETE FROM connectors")
            conn.execute("DELETE FROM audit_events")

    def call(self, method: str, path: str, *, role: str = "admin", body=None, user=None):
        return _request(self.app, method, path, user=user or self.users[role], body=body)

    def _create(self, **overrides):
        body = {"provider": "fake"}
        body.update(overrides)
        response = self.call("POST", "/api/supply/connectors", body=body)
        self.assertEqual(response.status, 201, response.text)
        return response.json

    # --- registration -----------------------------------------------------

    def test_main_registers_the_router_and_its_redaction(self) -> None:
        source = (Path(__file__).resolve().parents[1] / "app" / "main.py").read_text(encoding="utf-8")
        self.assertIn("app.include_router(supply_connectors_router)", source)
        self.assertLess(
            source.index("register_validation_redaction(app)"),
            source.index("register_supply_validation_redaction(app)"),
            "supply redaction must wrap the tracker handler, so it is registered after it",
        )
        paths = set(self.app.openapi()["paths"])
        for path in ("/api/supply/providers", "/api/supply/connectors", "/api/supply/connectors/{connector_id}",
                     "/api/supply/connectors/{connector_id}/credentials"):
            self.assertIn(path, paths)

    # --- roles ------------------------------------------------------------

    def test_readers_are_admin_designer_and_qa_not_viewer(self) -> None:
        for path in ("/api/supply/providers", "/api/supply/connectors"):
            for role in ("admin", "designer", "qa"):
                self.assertEqual(self.call("GET", path, role=role).status, 200, f"{role} {path}")
            self.assertEqual(self.call("GET", path, role="viewer").status, 403, path)

    def test_only_admin_may_change_connectors(self) -> None:
        connector = self._create()
        cid = connector["id"]
        writes = [
            ("POST", "/api/supply/connectors", {"provider": "fake"}),
            ("PATCH", f"/api/supply/connectors/{cid}", {"enabled": False}),
            ("PUT", f"/api/supply/connectors/{cid}/credentials", {"credentials": {"api_key": "x"}}),
            ("POST", f"/api/supply/connectors/{cid}/pause", {"reason": "x"}),
            ("POST", f"/api/supply/connectors/{cid}/resume", None),
            ("POST", f"/api/supply/connectors/{cid}/terms-review", None),
            ("DELETE", f"/api/supply/connectors/{cid}", None),
        ]
        for role in ("designer", "qa", "viewer"):
            for method, path, body in writes:
                self.assertEqual(self.call(method, path, role=role, body=body).status, 403, f"{role} {method} {path}")
        self.assertEqual(len(self.service.list()), 1, "nothing was changed by the forbidden calls")

    def test_token_scopes_and_provider_tokens(self) -> None:
        read_only = self.AuthenticatedUser(
            email="bot@example.com", name="bot", role="admin", auth_type="agent", scopes=["api:read"])
        self.assertEqual(self.call("GET", "/api/supply/connectors", user=read_only).status, 200)
        self.assertEqual(
            self.call("POST", "/api/supply/connectors", user=read_only, body={"provider": "fake"}).status, 403)
        no_scope = self.AuthenticatedUser(
            email="bot@example.com", name="bot", role="admin", auth_type="agent", scopes=["other"])
        self.assertEqual(self.call("GET", "/api/supply/connectors", user=no_scope).status, 403)
        kicad = self.AuthenticatedUser(
            email="kicad@example.com", name="kicad", role="admin", auth_type="kicad_provider",
            scopes=["remote_symbols.read"])
        self.assertEqual(self.call("GET", "/api/supply/connectors", user=kicad).status, 403)
        self.assertEqual(
            self.call("POST", "/api/supply/connectors", user=kicad, body={"provider": "fake"}).status, 403)

    # --- providers --------------------------------------------------------

    def test_providers_list_describes_the_setup_form(self) -> None:
        from app.core.config import settings

        providers = {item["key"]: item for item in self.call("GET", "/api/supply/providers").json}
        self.assertEqual(providers["demo_keyed"]["credential_fields"],
                         [{"name": "api_key", "label": "API key", "secret": True}])
        self.assertNotIn("fake", providers, "the simulated provider is hidden unless enabled")
        with mock.patch.object(settings, "SUPPLY_ENABLE_SIMULATED_PROVIDER", True):
            shown = {item["key"] for item in self.call("GET", "/api/supply/providers").json}
        self.assertIn("fake", shown)

    # --- lifecycle --------------------------------------------------------

    def test_create_then_readers_see_it_without_secrets(self) -> None:
        created = self._create(provider="demo_keyed", credentials={"api_key": "TOPSECRET-KEY"}, currency="eur")
        self.assertEqual(created["created_by"], "admin@example.com")
        self.assertEqual(created["credentials"], {"api_key": True})
        listed = self.call("GET", "/api/supply/connectors", role="qa")
        self.assertEqual(listed.status, 200)
        self.assertEqual([item["id"] for item in listed.json], [created["id"]])
        self.assertNotIn("TOPSECRET-KEY", listed.text)
        self.assertEqual(listed.json[0]["usage_today"], {"spent": 0, "interactive_spent": 0})

    def test_update_pause_resume_terms_credentials_delete(self) -> None:
        cid = self._create(provider="demo_keyed", credentials={"api_key": "one"})["id"]
        path = f"/api/supply/connectors/{cid}"
        patched = self.call("PATCH", path, body={"daily_budget": 250, "enabled": False, "currency": "gbp"})
        self.assertEqual((patched.status, patched.json["daily_budget"], patched.json["enabled"], patched.json["currency"]),
                         (200, 250, False, "GBP"))
        paused = self.call("POST", f"{path}/pause", body={"reason": "over budget"})
        self.assertEqual(paused.json["paused_reason"], "over budget")
        self.assertEqual(self.call("POST", f"{path}/resume").json["paused_reason"], "")
        reviewed = self.call("POST", f"{path}/terms-review", role="admin")
        self.assertEqual(reviewed.json["terms_reviewed_by"], "admin@example.com")
        replaced = self.call("PUT", f"{path}/credentials", body={"credentials": {"api_key": "two"}})
        self.assertEqual(replaced.status, 200)
        self.assertNotIn("two", replaced.text)
        self.assertEqual(self.call("DELETE", path).status, 204)
        self.assertEqual(self.call("GET", path.rsplit("/", 1)[0], role="admin").json, [])
        self.assertEqual(self.call("DELETE", path).status, 404)

    def test_usage_today_reflects_the_ledger(self) -> None:
        from datetime import datetime, timezone

        from app.services.supply import ledger

        cid = self._create(daily_budget=100)["id"]
        with self.store.connection() as conn:
            ledger.try_spend(conn, cid, 5, interactive=False, daily_budget=100, reserve_pct=10,
                             now=datetime.now(timezone.utc).replace(hour=23, minute=59))
        usage = self.call("GET", "/api/supply/connectors", role="designer").json[0]["usage_today"]
        self.assertEqual(usage, {"spent": 5, "interactive_spent": 0})

    # --- errors -----------------------------------------------------------

    def test_error_mapping(self) -> None:
        self._create(provider="demo_keyed", credentials={"api_key": "k"})
        duplicate = self.call("POST", "/api/supply/connectors",
                              body={"provider": "demo_keyed", "credentials": {"api_key": "k"}})
        self.assertEqual((duplicate.status, duplicate.json["detail"]["code"]), (409, "duplicate"))

        missing = self.call("POST", "/api/supply/connectors", body={"provider": "demo_keyed"})
        self.assertEqual((missing.status, missing.json["detail"]["code"]), (400, "invalid_credentials"))

        unknown = self.call("POST", "/api/supply/connectors", body={"provider": "nope"})
        self.assertEqual((unknown.status, unknown.json["detail"]["code"]), (400, "unknown_provider"))

        type(self).allow_dev = False
        disabled = self.call("POST", "/api/supply/connectors", body={"provider": "fake"})
        self.assertEqual((disabled.status, disabled.json["detail"]["code"]), (403, "provider_disabled"))

        self.assertEqual(self.call("PATCH", "/api/supply/connectors/missing", body={"enabled": True}).status, 404)
        self.assertEqual(self.call("POST", "/api/supply/connectors/missing/resume").status, 404)

    def test_locked_keyring_is_a_503_without_detail(self) -> None:
        type(self).locked = True
        response = self.call("POST", "/api/supply/connectors",
                             body={"provider": "demo_keyed", "credentials": {"api_key": "k"}})
        self.assertEqual(response.status, 503)
        self.assertEqual(response.json["detail"], "Credential encryption is locked")

    def test_request_models_are_strict(self) -> None:
        cid = self._create()["id"]
        for method, path, body in (
            ("POST", "/api/supply/connectors", {"provider": "fake", "created_by": "mallory@example.com"}),
            ("PATCH", f"/api/supply/connectors/{cid}", {"provider": "other"}),
            ("POST", f"/api/supply/connectors/{cid}/pause", {"reason": ""}),
        ):
            self.assertEqual(self.call(method, path, body=body).status, 422, f"{method} {path} {body}")

    def test_validation_errors_do_not_echo_the_request(self) -> None:
        response = self.call("POST", "/api/supply/connectors",
                             body={"provider": "demo_keyed", "credentials": {"api_key": 987654321}})
        self.assertEqual(response.status, 422)
        self.assertNotIn("987654321", response.text)
        self.assertNotIn("input", json.dumps(response.json))

    def test_redaction_wraps_the_previous_handler_and_leaves_other_routes_alone(self) -> None:
        from fastapi import FastAPI
        from fastapi.exceptions import RequestValidationError
        from fastapi.responses import JSONResponse

        app = FastAPI()

        async def other(request, exc):
            return JSONResponse(status_code=422, content={"handled_by": "previous"})

        app.add_exception_handler(RequestValidationError, other)
        self.module.register_validation_redaction(app)

        @app.get("/elsewhere/{number}")
        async def elsewhere(number: int):
            return number

        app.include_router(self.module.router)
        outside = _request(app, "GET", "/elsewhere/abc", user=self.users["admin"])
        self.assertEqual(outside.json, {"handled_by": "previous"})
        inside = _request(app, "POST", "/api/supply/connectors", user=self.users["admin"],
                          body={"provider": 5})
        self.assertEqual(inside.status, 422)
        self.assertNotIn("handled_by", inside.json)


if __name__ == "__main__":
    unittest.main()

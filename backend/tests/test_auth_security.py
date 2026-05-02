from __future__ import annotations

import asyncio
import sys
import unittest
from pathlib import Path

from fastapi import HTTPException


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.security import AuthenticatedUser, require_admin, require_remote_symbol_reader  # noqa: E402
from app.services import provider_auth_service  # noqa: E402


class AuthSecurityTests(unittest.TestCase):
    def test_kicad_provider_token_cannot_access_admin_api(self) -> None:
        user = AuthenticatedUser(
            email="admin@example.com",
            name="Admin",
            role="admin",
            auth_type="kicad_provider",
            client_id="kicad-prism-kicad",
            scopes=["remote_symbols.read"],
        )

        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(require_admin(user))

        self.assertEqual(ctx.exception.status_code, 403)

    def test_service_admin_token_can_access_admin_api(self) -> None:
        user = AuthenticatedUser(
            email="client@service.local",
            name="PLM Client",
            role="admin",
            auth_type="service_client",
            client_id="prism_client",
            scopes=["api:read", "api:write"],
        )

        resolved = asyncio.run(require_admin(user))
        self.assertEqual(resolved.client_id, "prism_client")

    def test_remote_symbol_reader_requires_scope_for_bearer_tokens(self) -> None:
        user = AuthenticatedUser(
            email="client@service.local",
            name="PLM Client",
            role="viewer",
            auth_type="service_client",
            client_id="prism_client",
            scopes=["api:write"],
        )

        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(require_remote_symbol_reader(user))

        self.assertEqual(ctx.exception.status_code, 403)

    def test_remote_provider_scope_defaults_to_remote_symbols_read(self) -> None:
        self.assertEqual(provider_auth_service.normalize_provider_scope(""), "remote_symbols.read")

    def test_remote_provider_rejects_unknown_scopes(self) -> None:
        with self.assertRaises(HTTPException) as ctx:
            provider_auth_service.normalize_provider_scope("remote_symbols.read api:read")

        self.assertEqual(ctx.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()

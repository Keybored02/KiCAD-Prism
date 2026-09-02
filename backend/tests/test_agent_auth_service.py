"""The agent sign-in service: PKCE, single-use codes, scopes, and revocation.

These exercise the real token and authorization-code storage, so they need a
database. They are skipped when PRISM_DATABASE_URL is unset, the same way the
application decides it has one.
"""

from __future__ import annotations

import base64
import hashlib
import os
import secrets
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

DATABASE_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()

# Sign-in only exists with auth on and a session secret. setdefault does not
# override a value the suite already set, so whether these run is decided by the
# real setting below, not by forcing the env here.
os.environ.setdefault("SESSION_SECRET", "test-secret-at-least-32-characters-long-x")

from app.core.config import settings  # noqa: E402
from app.services import agent_auth_service  # noqa: E402
from app.services.auth_service import ResolvedSessionUser  # noqa: E402

_AUTH_ON = bool(settings.AUTH_ENABLED and settings.SESSION_SECRET)


def _pkce() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).rstrip(b"=").decode()
    return verifier, challenge


def _user(email: str = "agent-test@example.com", role: str = "designer") -> ResolvedSessionUser:
    return ResolvedSessionUser(email=email, name="Agent Tester", picture="", role=role)


@unittest.skipUnless(DATABASE_URL, "PRISM_DATABASE_URL is required for agent auth tests")
@unittest.skipUnless(_AUTH_ON, "agent sign-in requires AUTH_ENABLED with a SESSION_SECRET")
class AgentAuthServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.component_catalog_service import catalog_service

        catalog_service.initialize()
        cls.catalog = catalog_service

    REDIRECT = "http://127.0.0.1:53999/cb"

    def _issue(self, *, scope: str = "api:read", label: str = "unit-agent") -> tuple[str, str]:
        verifier, challenge = _pkce()
        code = agent_auth_service.issue_authorization_code(
            _user(), redirect_uri=self.REDIRECT, scope=scope, code_challenge=challenge, agent_label=label
        )
        return code, verifier

    def test_full_flow_issues_a_scoped_token(self) -> None:
        code, verifier = self._issue(scope="api:read")
        result = agent_auth_service.exchange_authorization_code(
            code=code, redirect_uri=self.REDIRECT, code_verifier=verifier
        )
        self.assertEqual(result["scope"], "api:read")
        self.assertEqual(result["token_type"], "Bearer")
        payload = agent_auth_service.validate_agent_token(result["access_token"])
        self.assertEqual(payload["email"], "agent-test@example.com")
        self.assertEqual(payload["type"], "agent")

    def test_wrong_pkce_verifier_is_rejected(self) -> None:
        code, _verifier = self._issue()
        with self.assertRaises(Exception):
            agent_auth_service.exchange_authorization_code(
                code=code, redirect_uri=self.REDIRECT, code_verifier="not-the-verifier"
            )

    def test_a_code_can_be_exchanged_only_once(self) -> None:
        code, verifier = self._issue()
        agent_auth_service.exchange_authorization_code(
            code=code, redirect_uri=self.REDIRECT, code_verifier=verifier
        )
        with self.assertRaises(Exception):
            agent_auth_service.exchange_authorization_code(
                code=code, redirect_uri=self.REDIRECT, code_verifier=verifier
            )

    def test_redirect_uri_mismatch_is_rejected(self) -> None:
        code, verifier = self._issue()
        with self.assertRaises(Exception):
            agent_auth_service.exchange_authorization_code(
                code=code, redirect_uri="http://127.0.0.1:1/cb", code_verifier=verifier
            )

    def test_only_loopback_redirects_are_allowed(self) -> None:
        _verifier, challenge = _pkce()
        with self.assertRaises(Exception):
            agent_auth_service.validate_authorization_request(
                redirect_uri="https://evil.example.com/cb",
                response_type="code",
                state="s",
                scope="",
                code_challenge=challenge,
                code_challenge_method="S256",
            )

    def test_only_s256_pkce_is_accepted(self) -> None:
        _verifier, challenge = _pkce()
        with self.assertRaises(Exception):
            agent_auth_service.validate_authorization_request(
                redirect_uri=self.REDIRECT,
                response_type="code",
                state="s",
                scope="",
                code_challenge=challenge,
                code_challenge_method="plain",
            )

    def test_unsupported_scope_is_rejected(self) -> None:
        with self.assertRaises(Exception):
            agent_auth_service.normalize_agent_scope("admin:everything")

    def test_registry_records_and_revokes(self) -> None:
        code, verifier = self._issue(label="registry-agent")
        token = agent_auth_service.exchange_authorization_code(
            code=code, redirect_uri=self.REDIRECT, code_verifier=verifier
        )["access_token"]
        payload = agent_auth_service.validate_agent_token(token)
        jti = str(payload["jti"])

        listed = self.catalog.list_agent_tokens(email="agent-test@example.com")
        self.assertIn(jti, {row["jti"] for row in listed})

        self.assertTrue(agent_auth_service.revoke_agent_token_by_jti(jti))
        with self.assertRaises(Exception):
            agent_auth_service.validate_agent_token(token)
        remaining = self.catalog.list_agent_tokens(email="agent-test@example.com")
        self.assertNotIn(jti, {row["jti"] for row in remaining})

    def test_revoking_an_unknown_jti_returns_false(self) -> None:
        self.assertFalse(agent_auth_service.revoke_agent_token_by_jti("no-such-jti"))


if __name__ == "__main__":
    unittest.main()

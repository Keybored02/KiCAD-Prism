"""The /api/agent routes: consent, code exchange, and token management.

Drives the real app with a signed-in session cookie, so it needs a database and
is skipped without PRISM_DATABASE_URL.
"""

from __future__ import annotations

import base64
import hashlib
import os
import secrets
import sys
import unittest
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from unittest.mock import patch  # noqa: E402

DATABASE_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()

# Patched onto settings in setUpClass rather than read from the environment, so
# these run under CI's AUTH_ENABLED=false instead of silently skipping and going
# green without exercising the sign-in routes.
TEST_SECRET = "test-secret-at-least-32-characters-long-x"

from app.core.config import settings  # noqa: E402


def _pkce() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).rstrip(b"=").decode()
    return verifier, challenge


@unittest.skipUnless(DATABASE_URL, "PRISM_DATABASE_URL is required for agent API tests")
class AgentApiTests(unittest.TestCase):
    REDIRECT = "http://127.0.0.1:53998/cb"

    @classmethod
    def setUpClass(cls) -> None:
        from starlette.testclient import TestClient

        # Auth on for the whole class: the sign-in routes require it, session
        # cookies need the secret, and the app reads both live. Patch before the
        # session store initialises so it sees the enabled posture.
        #
        # AUTH_ENABLED is a property over AUTH_ENABLED_OVERRIDE; patch the real field,
        # not the property (which cannot be cleanly unpatched on teardown).
        cls._patchers = [
            patch.object(settings, "AUTH_ENABLED_OVERRIDE", True),
            patch.object(settings, "SESSION_SECRET", TEST_SECRET),
        ]
        for patcher in cls._patchers:
            patcher.start()

        import app.main as main
        from app.services import access_service, session_store_service

        session_store_service.initialize_session_store()
        cls.main = main
        cls.access_service = access_service
        cls.session_store_service = session_store_service
        cls.TestClient = TestClient

    @classmethod
    def tearDownClass(cls) -> None:
        for patcher in getattr(cls, "_patchers", []):
            patcher.stop()

    def _client_for(self, email: str, role: str):
        from app.core.session import SESSION_COOKIE_NAME, create_session_token

        self.access_service.upsert_user(email=email, name=email.split("@")[0])
        self.access_service.upsert_user_role(email, role, updated_by=email)
        session_id, _ = self.session_store_service.create_session(email=email, name="Tester", picture="")
        client = self.TestClient(self.main.app)
        client.cookies.set(SESSION_COOKIE_NAME, create_session_token(session_id))
        return client

    def _obtain_token(self, client, *, email: str, label: str = "api-agent", scope: str = "api:read"):
        verifier, challenge = _pkce()
        form = {
            "redirect_uri": self.REDIRECT,
            "state": "state-xyz",
            "code_challenge": challenge,
            "code_challenge_method": "S256",
            "label": label,
            "scope": scope,
        }
        consent = client.get("/api/agent/authorize", params=form)
        self.assertEqual(consent.status_code, 200)
        self.assertIn("Authorize", consent.text)

        submit = client.post("/api/agent/authorize", data=form, follow_redirects=False)
        self.assertEqual(submit.status_code, 303)
        location = submit.headers["location"]
        self.assertTrue(location.startswith(self.REDIRECT + "?code="))
        code = parse_qs(urlparse(location).query)["code"][0]

        exchange = self.TestClient(self.main.app).post(
            "/api/agent/token",
            data={"code": code, "redirect_uri": self.REDIRECT, "code_verifier": verifier},
        )
        self.assertEqual(exchange.status_code, 200)
        return exchange.json()["access_token"]

    def test_consent_to_token_to_use_to_revoke(self) -> None:
        client = self._client_for("api-owner@example.com", "designer")
        token = self._obtain_token(client, email="api-owner@example.com", label="my-laptop")

        bearer = self.TestClient(self.main.app)
        listed = bearer.get("/api/agent/tokens", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(listed.status_code, 200)
        self.assertIn("my-laptop", [row["label"] for row in listed.json()])
        jti = listed.json()[0]["jti"]

        revoked = client.delete(f"/api/agent/tokens/{jti}")
        self.assertEqual(revoked.status_code, 200)

        after = bearer.get("/api/agent/tokens", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(after.status_code, 401)

    def test_a_user_cannot_revoke_another_users_token(self) -> None:
        owner = self._client_for("owner2@example.com", "designer")
        token = self._obtain_token(owner, email="owner2@example.com")
        jti = (
            self.TestClient(self.main.app)
            .get("/api/agent/tokens", headers={"Authorization": f"Bearer {token}"})
            .json()[0]["jti"]
        )

        intruder = self._client_for("intruder@example.com", "designer")
        forbidden = intruder.delete(f"/api/agent/tokens/{jti}")
        self.assertEqual(forbidden.status_code, 403)

    def test_admin_can_revoke_any_token_and_see_all(self) -> None:
        owner = self._client_for("owner3@example.com", "designer")
        token = self._obtain_token(owner, email="owner3@example.com")
        jti = (
            self.TestClient(self.main.app)
            .get("/api/agent/tokens", headers={"Authorization": f"Bearer {token}"})
            .json()[0]["jti"]
        )

        admin = self._client_for("admin@example.com", "admin")
        everyone = admin.get("/api/agent/tokens", params={"all_users": "true"})
        self.assertEqual(everyone.status_code, 200)
        self.assertIn(jti, {row["jti"] for row in everyone.json()})

        revoked = admin.delete(f"/api/agent/tokens/{jti}")
        self.assertEqual(revoked.status_code, 200)

    def test_non_loopback_redirect_is_rejected(self) -> None:
        client = self._client_for("api-owner4@example.com", "designer")
        _verifier, challenge = _pkce()
        response = client.get(
            "/api/agent/authorize",
            params={
                "redirect_uri": "https://evil.example.com/cb",
                "state": "s",
                "code_challenge": challenge,
                "code_challenge_method": "S256",
            },
        )
        self.assertEqual(response.status_code, 400)

    def test_revoking_an_unknown_token_is_404(self) -> None:
        client = self._client_for("api-owner5@example.com", "designer")
        self.assertEqual(client.delete("/api/agent/tokens/nope").status_code, 404)

    # -- signing the panel in with the agent's existing sign-in ------------

    def _bootstrap(self, token: str, next_url: str = "http://testserver/panel"):
        return self.TestClient(self.main.app).post(
            "/oauth/session/bootstrap-from-agent",
            json={"agent_token": token, "next_url": next_url},
        )

    def test_an_agent_token_signs_the_panel_in_as_the_same_user(self) -> None:
        """The whole point: sign in once in the plugin, not again in the panel."""
        email = "panel-user@example.com"
        token = self._obtain_token(self._client_for(email, "designer"), email=email)

        response = self._bootstrap(token)
        self.assertEqual(response.status_code, 200)
        nonce_url = response.json()["nonce_url"]
        self.assertIn("/oauth/bootstrap?token=", nonce_url)

        # Following it sets a session cookie and lands on the requested page.
        browser = self.TestClient(self.main.app)
        landed = browser.get(nonce_url, follow_redirects=False)
        self.assertEqual(landed.status_code, 302)
        self.assertEqual(landed.headers["location"], "http://testserver/panel")

        from app.core.session import SESSION_COOKIE_NAME

        self.assertIn(SESSION_COOKIE_NAME, landed.cookies)
        # And the session is that user's, not a guest or the agent.
        browser.cookies.set(SESSION_COOKIE_NAME, landed.cookies[SESSION_COOKIE_NAME])
        me = browser.get("/api/auth/me")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["email"], email)

    def test_the_handoff_url_cannot_be_used_twice(self) -> None:
        """Single use, so a leaked URL is spent rather than a standing key."""
        email = "panel-once@example.com"
        token = self._obtain_token(self._client_for(email, "designer"), email=email)
        nonce_url = self._bootstrap(token).json()["nonce_url"]

        first = self.TestClient(self.main.app).get(nonce_url, follow_redirects=False)
        self.assertEqual(first.status_code, 302)
        second = self.TestClient(self.main.app).get(nonce_url, follow_redirects=False)
        self.assertNotEqual(second.status_code, 302)

    def test_a_revoked_agent_token_buys_no_session(self) -> None:
        """Revoking the agent's access must revoke this route with it."""
        email = "panel-revoked@example.com"
        client = self._client_for(email, "designer")
        token = self._obtain_token(client, email=email)

        jti = self.TestClient(self.main.app).get(
            "/api/agent/tokens",
            headers={"Authorization": f"Bearer {token}"},
        ).json()[0]["jti"]
        self.assertEqual(client.delete(f"/api/agent/tokens/{jti}").status_code, 200)

        self.assertNotEqual(self._bootstrap(token).status_code, 200)

    def test_a_forged_agent_token_buys_no_session(self) -> None:
        self.assertNotEqual(self._bootstrap("v1.not.a.real.token").status_code, 200)
        self.assertNotEqual(self._bootstrap("").status_code, 200)

    def test_the_handoff_cannot_be_aimed_off_this_origin(self) -> None:
        """Otherwise it would be a redirector that hands out session cookies."""
        email = "panel-offsite@example.com"
        token = self._obtain_token(self._client_for(email, "designer"), email=email)
        response = self._bootstrap(token, next_url="https://evil.example.com/steal")
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()

"""Admin routes for KiCad path libraries.

The tests drive the real application with personal access tokens: an admin's
token may read and write libraries, a viewer's token is refused by
``require_admin``. Fetch and removal jobs are recorded, not queued.
"""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from app.services import access_service, kicad_libraries, kicad_library_fetch, personal_tokens  # noqa: E402

DATABASE_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()

try:
    import starlette.testclient  # noqa: F401

    HAS_TEST_CLIENT = True
except RuntimeError:
    HAS_TEST_CLIENT = False

TEST_SECRET = "test-secret-at-least-32-characters-long-x"
BASE = "https://prism.test"
ROOT = "/api/v1/settings/kicad-libraries"


def unique(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


@unittest.skipUnless(DATABASE_URL, "PRISM_DATABASE_URL is required for the KiCad library route tests")
@unittest.skipUnless(HAS_TEST_CLIENT, "starlette.testclient needs httpx2 or httpx")
class KicadLibraryRouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from starlette.testclient import TestClient

        cls._patchers = [
            patch.object(settings, "AUTH_ENABLED_OVERRIDE", True),
            patch.object(settings, "PASSWORD_AUTH_ENABLED", True),
            patch.object(settings, "SESSION_SECRET", TEST_SECRET),
            patch.object(settings, "PUBLIC_BASE_URL", BASE),
            patch.object(settings, "KICAD_3D_LIBRARY_ENABLED", False),
            patch.object(settings, "PRISM_KICAD_LIBRARY_MOUNT_ROOT", ""),
        ]
        for patcher in cls._patchers:
            patcher.start()

        import app.main as main

        cls.main = main
        cls.TestClient = TestClient

    @classmethod
    def tearDownClass(cls) -> None:
        for patcher in getattr(cls, "_patchers", []):
            patcher.stop()

    def setUp(self) -> None:
        self.client = self.TestClient(self.main.app)
        self._emails: list[str] = []
        self.fetches: list[str] = []
        self.removals: list[str] = []
        for target, name, effect in (
            (kicad_library_fetch, "request_fetch", lambda name, **_: self.fetches.append(name)),
            (kicad_library_fetch, "request_removal", lambda library, **_: self.removals.append(library.name)),
        ):
            patcher = patch.object(target, name, side_effect=effect)
            patcher.start()
            self.addCleanup(patcher.stop)
        self.addCleanup(self._cleanup)
        kicad_libraries.forget_rows()
        self.addCleanup(kicad_libraries.forget_rows)

        _viewer, viewer_token = self._user("viewer")
        self.admin_email, admin_token = self._user("admin")
        self.viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
        self.admin = {"Authorization": f"Bearer {admin_token}"}
        self.names: list[str] = []

    def _user(self, role: str) -> tuple[str, str]:
        email = f"{unique('kicad-library-route')}@example.test"
        access_service.upsert_user(email=email, name=email.split("@")[0])
        access_service.upsert_user_role(email, role, updated_by=email)
        scopes = ["admin"] if role == "admin" else ["api:read"]
        _row, token = personal_tokens.create(email, "kicad library route tests", scopes, 30)
        self._emails.append(email)
        return email, token

    def _cleanup(self) -> None:
        from app.services.postgres_database import database

        with database.connection() as conn:
            conn.execute("SET search_path TO workspace, public")
            conn.execute("DELETE FROM ws_kicad_libraries WHERE updated_by = ANY(%s)", (self._emails,))

    def declare(self, **overrides) -> dict:
        name = unique("lib")
        variable = "VAR_" + uuid.uuid4().hex[:8].upper()
        body = {"name": name, "variables": [variable], "git": "https://example.org/lib.git", "ref": "v1", **overrides}
        response = self.client.post(ROOT, json=body, headers=self.admin)
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_a_non_admin_is_refused_by_every_route(self) -> None:
        for method, path, body in (
            ("get", ROOT, None),
            ("post", ROOT, {"name": "x", "variables": ["X"], "git": "https://e/x.git", "ref": "v1"}),
            ("post", f"{ROOT}/check", {"git": "https://e/x.git"}),
            ("patch", f"{ROOT}/x", {"ref": "v2"}),
            ("post", f"{ROOT}/x/fetch", None),
            ("delete", f"{ROOT}/x", None),
        ):
            with self.subTest(method=method, path=path):
                response = getattr(self.client, method)(path, headers=self.viewer_headers, **({"json": body} if body else {}))
                self.assertEqual(response.status_code, 403, response.text)

    def test_the_routes_need_a_sign_in(self) -> None:
        self.assertEqual(self.client.get(ROOT).status_code, 401)

    def test_declare_lists_and_queues_a_fetch(self) -> None:
        created = self.declare()
        self.assertEqual((created["state"], created["ready"], created["locked"]), ("pending", False, False))
        self.assertEqual(created["updatedBy"], self.admin_email)
        self.assertEqual(self.fetches, [created["name"]])
        listing = self.client.get(ROOT, headers=self.admin).json()
        self.assertIn(created["name"], [row["name"] for row in listing["libraries"]])
        self.assertFalse(listing["pathLibrariesEnabled"])

    def test_audit_identity_is_the_callers_not_the_bodys(self) -> None:
        created = self.declare(updatedBy="someone@else.test")
        self.assertEqual(created["updatedBy"], self.admin_email)

    def test_bad_input_is_refused_with_a_message(self) -> None:
        for body in ({"git": "http://example.org/x.git"}, {"variables": []}, {"ref": ""}, {"name": "a b"}):
            with self.subTest(body=body):
                fields = {"name": unique("lib"), "variables": ["V_X"], "git": "https://example.org/x.git", "ref": "v1", **body}
                response = self.client.post(ROOT, json=fields, headers=self.admin)
                self.assertEqual(response.status_code, 422, response.text)
                self.assertTrue(response.json()["detail"])
        self.assertEqual(self.fetches, [])

    def test_a_path_library_needs_the_mount_root(self) -> None:
        body = {"name": unique("lib"), "variables": ["P_LIB"], "path": "lsf"}
        self.assertEqual(self.client.post(ROOT, json=body, headers=self.admin).status_code, 422)
        with patch.object(settings, "PRISM_KICAD_LIBRARY_MOUNT_ROOT", "/mnt/libs"):
            created = self.client.post(ROOT, json=body, headers=self.admin)
            self.assertEqual(created.status_code, 201, created.text)
            self.assertEqual(self.fetches, [])  # nothing to fetch for a folder
            self.assertTrue(self.client.get(ROOT, headers=self.admin).json()["pathLibrariesEnabled"])
            escape = {**body, "name": unique("lib"), "variables": ["P_TWO"], "path": "../etc"}
            self.assertEqual(self.client.post(ROOT, json=escape, headers=self.admin).status_code, 422)

    def test_a_variable_has_one_owner(self) -> None:
        first = self.declare()
        clash = {"name": unique("lib"), "variables": first["variables"], "git": "https://example.org/y.git", "ref": "v1"}
        response = self.client.post(ROOT, json=clash, headers=self.admin)
        self.assertEqual(response.status_code, 409, response.text)
        self.assertIn(first["name"], response.json()["detail"])

    def test_a_new_ref_fetches_again_but_new_variables_do_not(self) -> None:
        created = self.declare()
        name = created["name"]
        self.fetches.clear()
        renamed = self.client.patch(f"{ROOT}/{name}", json={"variables": [*created["variables"], "EXTRA_VAR"]}, headers=self.admin)
        self.assertEqual(renamed.status_code, 200, renamed.text)
        self.assertEqual(self.fetches, [])
        moved = self.client.patch(f"{ROOT}/{name}", json={"ref": "v2"}, headers=self.admin)
        self.assertEqual((moved.json()["ref"], moved.json()["state"]), ("v2", "pending"))
        self.assertEqual(self.fetches, [name])

    def test_update_of_an_unknown_library_is_404(self) -> None:
        self.assertEqual(self.client.patch(f"{ROOT}/{unique('nope')}", json={"ref": "v2"}, headers=self.admin).status_code, 404)

    def test_fetch_again_resets_a_failure_and_queues(self) -> None:
        name = self.declare()["name"]
        kicad_library_fetch.kicad_library_store.record_fetch(name, state="failed", error="boom")
        self.fetches.clear()
        again = self.client.post(f"{ROOT}/{name}/fetch", headers=self.admin)
        self.assertEqual((again.status_code, again.json()["state"], again.json()["error"]), (200, "pending", None))
        self.assertEqual(self.fetches, [name])

    def test_a_path_library_has_nothing_to_fetch(self) -> None:
        with patch.object(settings, "PRISM_KICAD_LIBRARY_MOUNT_ROOT", "/mnt/libs"):
            name = unique("lib")
            body = {"name": name, "variables": ["P_LIB2"], "path": "lsf"}
            self.assertEqual(self.client.post(ROOT, json=body, headers=self.admin).status_code, 201)
            self.assertEqual(self.client.post(f"{ROOT}/{name}/fetch", headers=self.admin).status_code, 422)

    def test_delete_forgets_the_library_and_queues_its_removal(self) -> None:
        name = self.declare()["name"]
        self.assertEqual(self.client.delete(f"{ROOT}/{name}", headers=self.admin).status_code, 204)
        self.assertEqual(self.removals, [name])
        self.assertNotIn(name, [row["name"] for row in self.client.get(ROOT, headers=self.admin).json()["libraries"]])
        self.assertEqual(self.client.delete(f"{ROOT}/{name}", headers=self.admin).status_code, 404)

    def test_the_stock_library_is_listed_and_locked(self) -> None:
        with patch.object(settings, "KICAD_3D_LIBRARY_ENABLED", True):
            rows = self.client.get(ROOT, headers=self.admin).json()["libraries"]
            stock = rows[0]
            self.assertEqual((stock["name"], stock["locked"]), (kicad_libraries.STOCK_NAME, True))
            self.assertIn("KICAD10_3DMODEL_DIR", stock["variables"])
            for method, path, body in (
                ("patch", f"{ROOT}/{stock['name']}", {"ref": "x"}),
                ("post", f"{ROOT}/{stock['name']}/fetch", None),
                ("delete", f"{ROOT}/{stock['name']}", None),
            ):
                with self.subTest(method=method):
                    response = getattr(self.client, method)(path, headers=self.admin, **({"json": body} if body else {}))
                    self.assertEqual(response.status_code, 409, response.text)
                    self.assertEqual(response.json()["code"], "library-locked")

    def test_the_stock_variables_cannot_be_claimed(self) -> None:
        with patch.object(settings, "KICAD_3D_LIBRARY_ENABLED", True):
            body = {"name": unique("lib"), "variables": ["KICAD10_3DMODEL_DIR"], "git": "https://e/x.git", "ref": "v1"}
            self.assertEqual(self.client.post(ROOT, json=body, headers=self.admin).status_code, 409)

    def test_check_reports_what_the_remote_says(self) -> None:
        answer = {"reachable": True, "defaultBranch": "main", "tags": ["v1"], "branches": ["main"], "refFound": True}
        with patch.object(kicad_library_fetch, "check_remote", return_value=answer) as check:
            response = self.client.post(f"{ROOT}/check", json={"git": "https://e/x.git", "ref": "v1"}, headers=self.admin)
        self.assertEqual(response.json(), {**answer, "error": None})
        check.assert_called_once_with("https://e/x.git", "v1")


if __name__ == "__main__":
    unittest.main()

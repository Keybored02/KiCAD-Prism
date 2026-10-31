"""The repository discovery routes: who may scan, what each role sees, and the refusals."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI  # noqa: E402

from app.api import repo_discovery  # noqa: E402
from app.core.errors import install_error_handlers  # noqa: E402
from tests.support.asgi import request  # noqa: E402

SOURCE = {"id": "cn_gl", "provider": "gitlab", "displayName": "Acme GitLab", "host": "git.example.com"}


def view(name: str, state: str = "kicad", **extra) -> dict:
    return {
        "id": f"id-{name}",
        "fullName": name,
        "webUrl": f"https://git.example.com/{name}",
        "cloneUrl": f"https://git.example.com/{name}.git",
        "defaultBranch": "main",
        "archived": False,
        "state": state,
        "projects": [
            {"name": "psu", "relative_path": ".", "project_key": ".::psu.kicad_pro", "has_schematic": True, "has_pcb": True, "imported": False}
        ]
        if state == "kicad"
        else [],
        "importedCount": 0,
        "repositoryImported": False,
        "sizeBytes": 1048576,
        "branches": ["main", "dev"],
        "error": "Prism has no access" if state != "kicad" else "",
        "scannedAt": None,
        **extra,
    }


def make_app() -> FastAPI:
    app = FastAPI()
    install_error_handlers(app)
    app.include_router(repo_discovery.router)
    return app


class RepoDiscoveryRoutes(unittest.TestCase):
    def setUp(self) -> None:
        self.app = make_app()
        for target, value in (
            (repo_discovery.service, "discovery_sources"),
            (repo_discovery.discovery, "start_scan_job"),
            (repo_discovery.discovery, "candidate_views"),
        ):
            patcher = mock.patch.object(target, value)
            setattr(self, value, patcher.start())
            self.addCleanup(patcher.stop)
        self.discovery_sources.return_value = [SOURCE]
        self.start_scan_job.return_value = "job-1"
        self.candidate_views.return_value = [
            view("hw/psu"),
            view("hw/private", "no_access"),
            view("hw/odd", "error"),
            view("hw/docs", "empty"),
        ]

    def call(self, method: str, path: str, user: str = "designer"):
        return request(self.app, method, f"/api/repo-discovery{path}", user=user)

    def test_viewers_and_qa_cannot_use_any_route(self) -> None:
        for role in ("viewer", "qa"):
            for method, path in (
                ("GET", "/sources"),
                ("POST", "/sources/cn_gl/scan"),
                ("GET", "/sources/cn_gl/candidates"),
            ):
                with self.subTest(role=role, route=f"{method} {path}"):
                    self.assertEqual(self.call(method, path, role).status, 403)
        self.start_scan_job.assert_not_called()

    def test_a_designer_lists_the_sources(self) -> None:
        response = self.call("GET", "/sources")
        self.assertEqual((response.status, response.json), (200, [SOURCE]))

    def test_a_designer_starts_a_scan_as_themselves(self) -> None:
        response = self.call("POST", "/sources/cn_gl/scan")
        self.assertEqual((response.status, response.json), (200, {"job_id": "job-1", "status": "started"}))
        self.start_scan_job.assert_called_once_with("cn_gl", requested_by="designer@example.com")

    def test_scanning_a_host_that_is_not_a_source_is_refused(self) -> None:
        response = self.call("POST", "/sources/cn_github/scan")
        self.assertEqual(response.status, 404)
        self.assertEqual(response.json["code"], "not_a_source")
        self.start_scan_job.assert_not_called()

    def test_a_designer_does_not_see_access_problems(self) -> None:
        body = self.call("GET", "/sources/cn_gl/candidates").json
        self.assertEqual([item["fullName"] for item in body["candidates"]], ["hw/psu", "hw/docs"])
        self.assertEqual(body["hiddenCount"], 2)
        self.assertTrue(all(item["error"] == "" for item in body["candidates"]))

    def test_an_admin_sees_everything_with_the_reasons(self) -> None:
        body = self.call("GET", "/sources/cn_gl/candidates", user="admin").json
        self.assertEqual(len(body["candidates"]), 4)
        self.assertEqual(body["hiddenCount"], 0)
        self.assertEqual(body["candidates"][1]["error"], "Prism has no access")

    def test_candidates_of_an_unknown_host_are_refused(self) -> None:
        self.assertEqual(self.call("GET", "/sources/nope/candidates").status, 404)

class TheApplicationExposesTheRouter(unittest.TestCase):
    def test_main_registers_it(self) -> None:
        source = (Path(__file__).resolve().parents[1] / "app" / "main.py").read_text(encoding="utf-8")
        self.assertIn("app.include_router(repo_discovery_router)", source)


if __name__ == "__main__":
    unittest.main()

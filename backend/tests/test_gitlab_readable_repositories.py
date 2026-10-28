"""Repository discovery lists what a GitLab token can read, not only what it can publish to."""

from __future__ import annotations

import json
import unittest
from unittest import mock

from app.services.trackers import providers

ROOT = "https://git.example.com/api/v4"
CONNECTOR = {"provider": "gitlab", "instance_kind": "self-hosted", "base_url": "https://git.example.com"}
MATERIAL = {"accessToken": "glpat-fixture-not-a-credential"}


class _Raw:
    def __init__(self, payload, *, link: str = "") -> None:
        self.status_code = 200
        self.headers = {"link": link} if link else {}
        self.content = json.dumps(payload).encode()
        self.reason = "ok"
        self.url = ""
        self.text = self.content.decode()

    def json(self):
        return json.loads(self.content.decode())


def _project(project_id: int, path: str, **extra) -> dict:
    return {
        "id": project_id,
        "path_with_namespace": path,
        "visibility": "private",
        "archived": False,
        "empty_repo": False,
        "default_branch": "main",
        "web_url": f"https://git.example.com/{path}",
        "ssh_url_to_repo": f"git@git.example.com:{path}.git",
        "http_url_to_repo": f"https://git.example.com/{path}.git",
        **extra,
    }


def _run(lister, pages: list[_Raw]):
    """Run ``lister`` against a fake forge that answers with ``pages`` in order."""
    calls: list[dict] = []
    queue = list(pages)

    def send(method, url, **kwargs):  # noqa: ANN001
        calls.append({"method": method, "url": url, "params": kwargs.get("params")})
        return queue.pop(0)

    with mock.patch("app.services.trackers.http.requests.request", send):
        result = lister(CONNECTOR, MATERIAL)
    return result, calls


class ReadableRepositoryListing(unittest.TestCase):
    def run_readable(self, pages: list[_Raw]):
        return _run(providers.GITLAB.list_readable_repositories, pages)

    def test_reads_at_reporter_level_and_keeps_archived_projects(self) -> None:
        _, calls = self.run_readable([_Raw([])])
        params = calls[0]["params"]
        self.assertEqual(calls[0]["url"], f"{ROOT}/projects")
        self.assertEqual(params["min_access_level"], 20)
        self.assertEqual(params["membership"], "true")
        self.assertNotIn("archived", params)
        # ``simple`` hides archived and empty_repo, which discovery needs.
        self.assertNotIn("simple", params)

    def test_returns_clone_urls_branch_and_flags(self) -> None:
        repositories, _ = self.run_readable(
            [
                _Raw(
                    [
                        _project(1, "hw/psu"),
                        _project(2, "hw/old/board", archived=True),
                        _project(3, "hw/new", empty_repo=True, default_branch=None, visibility="public"),
                    ]
                )
            ]
        )
        first, archived, empty = repositories
        self.assertEqual(first["fullName"], "hw/psu")
        self.assertEqual(first["sshUrl"], "git@git.example.com:hw/psu.git")
        self.assertEqual(first["cloneUrl"], "https://git.example.com/hw/psu.git")
        self.assertEqual(first["defaultBranch"], "main")
        self.assertTrue(first["private"])
        self.assertTrue(archived["archived"])
        self.assertTrue(empty["emptyRepo"])
        self.assertEqual(empty["defaultBranch"], "")
        self.assertFalse(empty["private"])

    def test_follows_the_next_page_link(self) -> None:
        next_url = f"{ROOT}/projects?page=2"
        repositories, calls = self.run_readable(
            [
                _Raw([_project(1, "a/one")], link=f'<{next_url}>; rel="next"'),
                _Raw([_project(2, "a/two")]),
            ]
        )
        self.assertEqual([item["fullName"] for item in repositories], ["a/one", "a/two"])
        self.assertEqual(calls[1]["url"], next_url)
        self.assertIsNone(calls[1]["params"])

    def test_stops_at_the_cap(self) -> None:
        with mock.patch.object(providers, "GITLAB_READABLE_REPOSITORY_LIMIT", 2):
            repositories, calls = self.run_readable(
                [
                    _Raw(
                        [_project(1, "a/one"), _project(2, "a/two"), _project(3, "a/three")],
                        link=f'<{ROOT}/projects?page=2>; rel="next"',
                    )
                ]
            )
        self.assertEqual(len(repositories), 2)
        self.assertEqual(len(calls), 1)


class TheIssuePickerIsUnchanged(unittest.TestCase):
    def test_still_asks_for_developer_access_and_skips_archived(self) -> None:
        picked, calls = _run(providers.GITLAB.list_repositories, [_Raw([_project(1, "hw/psu")])])
        params = calls[0]["params"]
        self.assertEqual(params["min_access_level"], 30)
        self.assertEqual(params["archived"], "false")
        self.assertEqual(params["simple"], "true")
        self.assertEqual(picked[0]["fullName"], "hw/psu")


class WhichHostsCanBeDiscovered(unittest.TestCase):
    def test_providers(self) -> None:
        self.assertTrue(providers.can_list_readable_repositories("gitlab"))
        self.assertTrue(providers.can_list_readable_repositories("gitea"))
        self.assertFalse(providers.can_list_readable_repositories("github"))
        self.assertFalse(providers.can_list_readable_repositories("nope"))
        self.assertFalse(providers.can_list_readable_repositories(None))


if __name__ == "__main__":
    unittest.main()

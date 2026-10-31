"""Repository discovery on Gitea and Forgejo: the lister, and storing the read token on a linking-only host."""

from __future__ import annotations

import json
import unittest
from contextlib import contextmanager
from unittest import mock

from app.services.trackers import providers
from app.services.trackers.connector_service import ConnectorService
from app.services.trackers.migrations import (
    migrate_tracker_webhook_oauth_tables,
    migrate_workspace_tracker_tables,
)
from test_tracker_tr_21 import _settings
from app.services.comments_schema_migrations import COMMENTS_LEDGER  # noqa: E402
from support.postgres import requires_scratch_postgres, scratch_schema  # noqa: E402

BASE = "http://192.168.1.15:38417"
ROOT = f"{BASE}/api/v1"
CONNECTOR = {"provider": "gitea", "instance_kind": "self-hosted", "base_url": BASE}
MATERIAL = {"accessToken": "gitea-fixture-not-a-credential"}


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


def _repo(repo_id: int, path: str, **extra) -> dict:
    return {
        "id": repo_id,
        "full_name": path,
        "private": True,
        "archived": False,
        "empty": False,
        "default_branch": "main",
        "html_url": f"{BASE}/{path}",
        "ssh_url": f"ssh://git@192.168.1.15:38422/{path}.git",
        "clone_url": f"{BASE}/{path}.git",
        "size": 512,
        **extra,
    }


def _search(pages: list[_Raw]):
    calls: list[dict] = []
    queue = list(pages)

    def send(method, url, **kwargs):  # noqa: ANN001
        calls.append({"url": url, "params": kwargs.get("params"), "headers": kwargs.get("headers")})
        return queue.pop(0)

    with mock.patch("app.services.trackers.http.requests.request", send):
        result = providers.GITEA.list_readable_repositories(CONNECTOR, MATERIAL)
    return result, calls


class GiteaRepositoryListing(unittest.TestCase):
    def test_searches_with_the_token_and_returns_clone_urls_and_flags(self) -> None:
        repositories, calls = _search(
            [
                _Raw(
                    {
                        "ok": True,
                        "data": [
                            _repo(1, "Team-Italia/psu"),
                            _repo(2, "Team-Italia/old", archived=True),
                            _repo(3, "Team-Italia/new", empty=True, default_branch="", private=False),
                        ],
                    }
                )
            ]
        )
        self.assertEqual(calls[0]["url"], f"{ROOT}/repos/search")
        self.assertEqual(calls[0]["headers"]["Authorization"], f"token {MATERIAL['accessToken']}")
        first, archived, empty = repositories
        self.assertEqual(first["fullName"], "Team-Italia/psu")
        self.assertEqual(first["sshUrl"], "ssh://git@192.168.1.15:38422/Team-Italia/psu.git")
        self.assertEqual(first["cloneUrl"], f"{BASE}/Team-Italia/psu.git")
        self.assertEqual(first["defaultBranch"], "main")
        # Gitea reports KiB.
        self.assertEqual(first["sizeBytes"], 512 * 1024)
        self.assertTrue(first["private"])
        self.assertTrue(archived["archived"])
        self.assertTrue(empty["emptyRepo"])
        self.assertFalse(empty["private"])
        self.assertEqual(empty["defaultBranch"], "")

    def test_follows_the_next_page_link(self) -> None:
        next_url = f"{ROOT}/repos/search?page=2&limit=50"
        repositories, calls = _search(
            [
                _Raw({"ok": True, "data": [_repo(1, "a/one")]}, link=f'<{next_url}>; rel="next"'),
                _Raw({"ok": True, "data": [_repo(2, "a/two")]}),
            ]
        )
        self.assertEqual([item["fullName"] for item in repositories], ["a/one", "a/two"])
        self.assertEqual(calls[1]["url"], next_url)
        self.assertIsNone(calls[1]["params"])

    def test_stops_at_the_cap(self) -> None:
        with mock.patch.object(providers, "GITEA_READABLE_REPOSITORY_LIMIT", 2):
            repositories, calls = _search(
                [
                    _Raw(
                        {"ok": True, "data": [_repo(1, "a/1"), _repo(2, "a/2"), _repo(3, "a/3")]},
                        link=f'<{ROOT}/repos/search?page=2>; rel="next"',
                    )
                ]
            )
        self.assertEqual(len(repositories), 2)
        self.assertEqual(len(calls), 1)

    def test_an_empty_answer_is_no_repositories(self) -> None:
        self.assertEqual(_search([_Raw({"ok": True, "data": []})])[0], [])

    def test_gitea_is_a_discovery_host_that_does_not_publish_issues(self) -> None:
        self.assertTrue(providers.can_list_readable_repositories("gitea"))
        self.assertFalse(providers.is_issue_provider("gitea"))
        self.assertEqual(providers.credential_kit("gitea").credential_fields, ("accessToken",))
        self.assertIsNone(providers.credential_kit("unknown"))


@requires_scratch_postgres("tracker persistence tests")
class GiteaReadTokenStorage(unittest.TestCase):
    def setUp(self) -> None:
        self.scratch = scratch_schema(self, "giteadisc", ledgers=(COMMENTS_LEDGER,), then=(
            migrate_workspace_tracker_tables, migrate_tracker_webhook_oauth_tables,
        ))
        self.schema = self.scratch.name
        self.connectors = ConnectorService(
            connect=self._factory,
            settings=_settings(),
            comments_schema=self.schema,
            workspace_schema=self.schema,
        )

    @contextmanager
    def _factory(self):
        conn = self.scratch.connect()
        try:
            yield conn
        finally:
            conn.close()

    def _gitea(self, **credentials) -> dict:
        return self.connectors.create(
            actor_user_id="u_admin",
            provider="gitea",
            instance_kind="self-hosted",
            display_name="Taverna Gitea",
            base_url=BASE,
            credentials=credentials or None,
        )

    def test_a_connection_without_a_token_is_not_a_source(self) -> None:
        created = self._gitea(oauthClientId="app", oauthClientSecret="secret")
        self.assertFalse(created["credentialConfigured"])
        self.assertTrue(created["capabilities"]["discovery"])
        self.assertEqual(self.connectors.discovery_sources(), [])

    def test_a_stored_token_makes_it_a_source_and_never_leaks(self) -> None:
        created = self._gitea(accessToken="t0ken-value")
        self.assertTrue(created["credentialConfigured"])
        self.assertNotIn("t0ken-value", json.dumps(created))
        self.assertEqual(created["status"], "linking-only")
        self.assertFalse(created["paused"])
        self.assertEqual(
            self.connectors.discovery_sources(),
            [{"id": created["id"], "provider": "gitea", "displayName": "Taverna Gitea", "host": "192.168.1.15"}],
        )

    def test_adding_a_token_later_keeps_the_oauth_client_and_pauses_nothing(self) -> None:
        created = self._gitea(oauthClientId="app", oauthClientSecret="secret")
        updated = self.connectors.update(created["id"], actor_user_id="u_admin", credentials={"accessToken": "later"})
        self.assertTrue(updated["credentialConfigured"])
        self.assertTrue(updated["oauthClientConfigured"])
        self.assertFalse(updated["paused"])
        self.assertEqual(len(self.connectors.discovery_sources()), 1)

    def test_listing_hands_the_decrypted_token_to_the_lister(self) -> None:
        created = self._gitea(accessToken="t0ken-value")
        seen: list[tuple] = []

        def lister(row, material):  # noqa: ANN001
            seen.append((row["base_url"], dict(material)))
            return [{"id": "1", "fullName": "a/b"}]

        with mock.patch(
            "app.services.trackers.connector_service.readable_lister", return_value=lister
        ):
            listed = self.connectors.list_readable_repositories(created["id"])
        self.assertEqual(listed, [{"id": "1", "fullName": "a/b"}])
        self.assertEqual(seen, [(BASE, {"accessToken": "t0ken-value"})])

    def test_listing_without_a_token_is_refused(self) -> None:
        created = self._gitea(oauthClientId="app", oauthClientSecret="secret")
        from app.services.trackers.errors import ProviderError

        with self.assertRaises(ProviderError):
            self.connectors.list_readable_repositories(created["id"])


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import unittest
from unittest import mock

from app.services import repository_hosts
from app.services.repository_hosts import remote_hostname, repository_provider


class RemoteHostnameTests(unittest.TestCase):
    def test_reads_every_remote_spelling(self) -> None:
        self.assertEqual(remote_hostname("https://github.com/org/repo.git"), "github.com")
        self.assertEqual(remote_hostname("git@gitlab.acme.io:hw/board.git"), "gitlab.acme.io")
        self.assertEqual(remote_hostname("ssh://git@git.acme.test:2222/hw/board.git"), "git.acme.test")
        self.assertEqual(remote_hostname("https://www.GitHub.com/org/repo"), "github.com")

    def test_no_remote_has_no_host(self) -> None:
        self.assertIsNone(remote_hostname(None))
        self.assertIsNone(remote_hostname("  "))


class RepositoryProviderTests(unittest.TestCase):
    def test_a_code_host_connection_names_the_provider(self) -> None:
        connectors = {"git.acme.test": "gitea", "gitlab.acme.io": "gitlab"}
        self.assertEqual(repository_provider("https://git.acme.test/hw/board.git", connectors=connectors), "gitea")
        self.assertEqual(repository_provider("git@gitlab.acme.io:hw/board.git", connectors=connectors), "gitlab")

    def test_built_in_forge_hosts_need_no_connection(self) -> None:
        self.assertEqual(repository_provider("https://github.com/org/repo", connectors={}), "github")
        self.assertEqual(repository_provider("https://gitlab.com/group/sub/repo", connectors={}), "gitlab")

    def test_registered_forge_host_is_used(self) -> None:
        with mock.patch.object(repository_hosts.settings, "PRISM_FORGE_HOSTS", "git.corp.test=gitlab"):
            self.assertEqual(repository_provider("https://git.corp.test/hw/board", connectors={}), "gitlab")

    def test_an_unknown_host_is_not_guessed_from_its_name(self) -> None:
        self.assertIsNone(repository_provider("https://gitlab.unknown.test/hw/board", connectors={}))

    def test_a_broken_forge_host_setting_gives_no_provider(self) -> None:
        with mock.patch.object(repository_hosts.settings, "PRISM_FORGE_HOSTS", "not a pair"):
            self.assertIsNone(repository_provider("https://git.corp.test/hw/board", connectors={}))


if __name__ == "__main__":
    unittest.main()

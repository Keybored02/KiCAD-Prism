"""A pasted web address on a connected host is read by the host's own SSH address, because Prism has no password for HTTP."""

from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI  # noqa: E402

from app.api import projects as projects_api  # noqa: E402
from app.core.errors import install_error_handlers  # noqa: E402
from app.services import repo_discovery_service as discovery  # noqa: E402
from app.services.trackers.connector_service import ConnectorService  # noqa: E402
from tests.support.asgi import request  # noqa: E402

DATABASE_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()

WEB = "http://192.168.1.15:38417/Team-Italia/TT130601"
SSH = "ssh://git@192.168.1.15:38422/Team-Italia/TT130601.git"
SOURCE = {"id": "cn_g", "provider": "gitea", "displayName": "Gitea", "host": "192.168.1.15"}


class PreferredCloneUrl(unittest.TestCase):
    def setUp(self) -> None:
        for target, name, value in (
            (ConnectorService, "discovery_sources", mock.Mock(return_value=[SOURCE])),
            (discovery, "_stored_clone_url", mock.Mock(return_value=None)),
            (discovery, "_live_clone_url", mock.Mock(return_value=None)),
        ):
            patcher = mock.patch.object(target, name, value)
            setattr(self, name, patcher.start())
            self.addCleanup(patcher.stop)
        # Whatever this machine's .env allows, the default policy is what decides the address is valid.
        strict = discovery.git_remote_access.RemoteUrlPolicy.build(allowed_hosts="", allow_insecure_http=True)
        patcher = mock.patch.object(discovery.git_remote_access, "remote_url_policy", return_value=strict)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_a_web_address_becomes_the_stored_ssh_address(self) -> None:
        self._stored_clone_url.return_value = SSH
        self.assertEqual(discovery.preferred_clone_url(WEB), SSH)
        self._stored_clone_url.assert_called_once_with("cn_g", "Team-Italia/TT130601")
        self._live_clone_url.assert_not_called()

    def test_a_repository_never_scanned_is_looked_up_on_the_host(self) -> None:
        self._live_clone_url.return_value = SSH
        self.assertEqual(discovery.preferred_clone_url(WEB), SSH)

    def test_the_dot_git_suffix_does_not_change_which_repository_is_meant(self) -> None:
        self._stored_clone_url.return_value = SSH
        discovery.preferred_clone_url(WEB + ".git")
        self._stored_clone_url.assert_called_once_with("cn_g", "Team-Italia/TT130601")

    def test_an_address_the_host_does_not_list_is_left_as_pasted(self) -> None:
        self.assertEqual(discovery.preferred_clone_url(WEB), WEB)

    def test_another_host_is_left_alone_without_any_lookup(self) -> None:
        url = "https://github.com/org/repo"
        self.assertEqual(discovery.preferred_clone_url(url), url)
        self._stored_clone_url.assert_not_called()
        self._live_clone_url.assert_not_called()

    def test_ssh_and_scp_addresses_are_never_rewritten(self) -> None:
        for url in (SSH, "git@192.168.1.15:Team-Italia/TT130601.git"):
            self.assertEqual(discovery.preferred_clone_url(url), url)
        ConnectorService.discovery_sources.assert_not_called()

    def test_a_host_or_organisation_address_is_not_a_repository(self) -> None:
        for url in ("http://192.168.1.15:38417", "http://192.168.1.15:38417/Team-Italia"):
            self.assertEqual(discovery.preferred_clone_url(url), url)
        self._stored_clone_url.assert_not_called()

    def test_an_address_the_import_policy_refuses_is_left_for_the_import_to_refuse(self) -> None:
        self.assertEqual(discovery.preferred_clone_url("not a url"), "not a url")

    def test_not_being_able_to_read_the_connected_hosts_does_not_stop_the_import(self) -> None:
        ConnectorService.discovery_sources.side_effect = RuntimeError("database is down")
        self.assertEqual(discovery.preferred_clone_url(WEB), WEB)


class LookingUpOnTheHost(unittest.TestCase):
    ITEM = {"id": "9", "fullName": "Team-Italia/TT130601", "sshUrl": SSH, "cloneUrl": "http://192.168.1.15:38417/Team-Italia/TT130601.git"}

    def lookup(self, listing, path="team-italia/tt130601"):
        with mock.patch.object(ConnectorService, "list_readable_repositories", listing), mock.patch.object(
            discovery, "choose_clone_url", side_effect=lambda item: item["sshUrl"]
        ):
            return discovery._live_clone_url("cn_g", path)

    def test_finds_the_repository_ignoring_case_and_uses_the_address_the_scan_would(self) -> None:
        self.assertEqual(self.lookup(mock.Mock(return_value=[self.ITEM])), SSH)

    def test_a_repository_the_host_does_not_list_is_nothing(self) -> None:
        self.assertIsNone(self.lookup(mock.Mock(return_value=[self.ITEM]), path="Team-Italia/Other"))

    def test_a_host_that_cannot_be_listed_is_nothing_not_an_error(self) -> None:
        self.assertIsNone(self.lookup(mock.Mock(side_effect=RuntimeError("token expired"))))


@unittest.skipUnless(DATABASE_URL, "PRISM_DATABASE_URL is required")
class StoredAddress(unittest.TestCase):
    def setUp(self) -> None:
        from app.services.workspace_service import workspace

        workspace.initialize()
        for connector in ("cn_pref", "cn_pref_other"):
            discovery.delete_for_connector(connector)
            self.addCleanup(discovery.delete_for_connector, connector)
        item = {"id": "1", "fullName": "Team-Italia/TT130601", "htmlUrl": "", "cloneUrl": SSH, "sshUrl": ""}
        with mock.patch.object(discovery, "choose_clone_url", side_effect=lambda listed: listed["cloneUrl"]):
            discovery.sync_listing("cn_pref", [item])

    def test_matches_ignoring_case_within_the_connection(self) -> None:
        self.assertEqual(discovery._stored_clone_url("cn_pref", "team-italia/tt130601"), SSH)

    def test_does_not_match_another_connection_or_another_repository(self) -> None:
        self.assertIsNone(discovery._stored_clone_url("cn_pref_other", "Team-Italia/TT130601"))
        self.assertIsNone(discovery._stored_clone_url("cn_pref", "Team-Italia/Other"))


class BothImportRoutesUseIt(unittest.TestCase):
    def setUp(self) -> None:
        self.app = FastAPI()
        install_error_handlers(self.app)
        self.app.include_router(projects_api.router, prefix="/api/projects")
        for target, name in (
            (projects_api.repo_discovery_service, "preferred_clone_url"),
            (projects_api.project_import_service, "start_analyze_job"),
            (projects_api.project_import_service, "start_import_job"),
        ):
            patcher = mock.patch.object(target, name)
            setattr(self, name, patcher.start())
            self.addCleanup(patcher.stop)
        self.preferred_clone_url.return_value = SSH
        self.start_analyze_job.return_value = "job-a"
        self.start_import_job.return_value = "job-i"

    def test_analyze_starts_on_the_resolved_address(self) -> None:
        response = request(self.app, "POST", "/api/projects/analyze", body={"url": WEB, "ref": "dev"})
        self.assertEqual((response.status, response.json), (200, {"job_id": "job-a", "status": "started"}))
        self.preferred_clone_url.assert_called_once_with(WEB)
        self.start_analyze_job.assert_called_once_with(SSH, "dev", requested_by="designer@example.com")

    def test_import_starts_on_the_resolved_address(self) -> None:
        body = {"url": WEB, "import_type": "type2", "selected_paths": ["a::a.kicad_pro"], "ref": "main"}
        response = request(self.app, "POST", "/api/projects/import", body=body)
        self.assertEqual((response.status, response.json), (200, {"job_id": "job-i", "status": "started"}))
        self.assertEqual(self.start_import_job.call_args.kwargs["repo_url"], SSH)
        self.assertEqual(self.start_import_job.call_args.kwargs["selected_paths"], ["a::a.kicad_pro"])


if __name__ == "__main__":
    unittest.main()

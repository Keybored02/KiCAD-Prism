"""Repository discovery: reading each repository like an import would, and listing what is left to import."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import repo_discovery_service as discovery  # noqa: E402
from app.services.git_failures import GitAccessError  # noqa: E402
from app.services.job_runtime import JobCancelled  # noqa: E402
from app.services.project_import_service import DiscoveredProject  # noqa: E402

DATABASE_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()

SSH = "git@git.example.com:hw/psu.git"
HTTPS = "https://git.example.com/hw/psu.git"


def listed(remote_id: str = "1", path: str = "hw/psu", **extra) -> dict:
    return {
        "id": remote_id,
        "fullName": path,
        "htmlUrl": f"https://git.example.com/{path}",
        "sshUrl": f"git@git.example.com:{path}.git",
        "cloneUrl": f"https://git.example.com/{path}.git",
        "defaultBranch": "main",
        "archived": False,
        **extra,
    }


def candidate(**extra) -> dict:
    return {"id": "c1", "full_name": "hw/psu", "clone_url": HTTPS, "state": "pending", "head_sha": "", **extra}


def project(name: str = "psu", path: str = ".") -> DiscoveredProject:
    return DiscoveredProject(
        name=name,
        relative_path=path,
        full_path="",
        has_schematic=True,
        has_pcb=True,
        has_project_file=True,
        project_file=f"{name}.kicad_pro",
    )


class ChoosingTheCloneUrl(unittest.TestCase):
    def choose(self, *, key: bool, trusted: bool) -> str:
        with mock.patch.object(discovery.git_access_service, "describe_key") as describe, mock.patch.object(
            discovery.git_access_service, "is_host_trusted", return_value=trusted
        ):
            describe.return_value.exists = key
            return discovery.choose_clone_url(listed())

    def test_ssh_when_there_is_a_key_and_the_host_is_trusted(self) -> None:
        self.assertEqual(self.choose(key=True, trusted=True), SSH)

    def test_https_without_a_key(self) -> None:
        self.assertEqual(self.choose(key=False, trusted=True), HTTPS)

    def test_https_when_the_host_key_is_not_pinned(self) -> None:
        self.assertEqual(self.choose(key=True, trusted=False), HTTPS)


class InspectingARepository(unittest.TestCase):
    def inspect(self, row: dict, *, head=("main", "abc"), found=None, clone_error=None):
        with mock.patch.object(discovery.git_remote_access, "read_remote_head", return_value=head) as read, mock.patch.object(
            discovery, "clone_and_discover_projects", side_effect=clone_error, return_value=found or []
        ) as clone:
            result = discovery.inspect_repository(row, lambda: None)
        return result, read, clone

    def test_a_repository_with_projects_is_kicad(self) -> None:
        result, _, _ = self.inspect(candidate(), found=[project("psu"), project("amp", "amp")])
        self.assertEqual(result.state, "kicad")
        self.assertEqual(result.head_sha, "abc")
        self.assertEqual(result.default_branch, "main")
        self.assertEqual([item["name"] for item in result.projects], ["psu", "amp"])
        self.assertEqual(result.projects[1]["project_key"], "amp::amp.kicad_pro")

    def test_a_repository_without_projects_is_empty_of_kicad(self) -> None:
        result, _, _ = self.inspect(candidate(), found=[])
        self.assertEqual((result.state, result.projects), ("empty", []))

    def test_a_repository_with_no_commits_is_not_cloned(self) -> None:
        result, _, clone = self.inspect(candidate(), head=(None, None))
        self.assertEqual(result.state, "empty")
        clone.assert_not_called()

    def test_an_unchanged_head_is_skipped(self) -> None:
        result, _, clone = self.inspect(candidate(state="kicad", head_sha="abc"))
        self.assertIsNone(result)
        clone.assert_not_called()

    def test_a_changed_head_is_read_again(self) -> None:
        result, _, clone = self.inspect(candidate(state="kicad", head_sha="old"), found=[project()])
        self.assertEqual(result.head_sha, "abc")
        clone.assert_called_once()

    def test_a_failed_read_is_tried_again_even_at_the_same_head(self) -> None:
        result, _, clone = self.inspect(candidate(state="error", head_sha="abc"), found=[project()])
        self.assertEqual(result.state, "kicad")
        clone.assert_called_once()

    def test_a_repository_prism_cannot_read_is_no_access(self) -> None:
        error = GitAccessError("Prism has no access", reason="repository-not-found")
        result, _, _ = self.inspect(candidate(), clone_error=error)
        self.assertEqual((result.state, result.error), ("no_access", "Prism has no access"))

    def test_an_access_failure_on_the_head_read_is_no_access(self) -> None:
        with mock.patch.object(
            discovery.git_remote_access,
            "read_remote_head",
            side_effect=GitAccessError("needs credentials", reason="credentials-required"),
        ):
            result = discovery.inspect_repository(candidate(), lambda: None)
        self.assertEqual(result.state, "no_access")

    def test_any_other_failure_is_an_error_not_a_crash(self) -> None:
        result, _, _ = self.inspect(candidate(), clone_error=RuntimeError("disk full"))
        self.assertEqual((result.state, result.error), ("error", "disk full"))

    def test_cancellation_is_not_swallowed(self) -> None:
        with self.assertRaises(JobCancelled):
            self.inspect(candidate(), clone_error=JobCancelled("stop"))

    def test_a_blocked_url_is_never_contacted(self) -> None:
        with mock.patch.object(discovery.git_remote_access, "read_remote_head") as read:
            result = discovery.inspect_repository(candidate(state="blocked", error="host not allowed"), lambda: None)
        self.assertEqual((result.state, result.error), ("blocked", "host not allowed"))
        read.assert_not_called()


@unittest.skipUnless(DATABASE_URL, "PRISM_DATABASE_URL is required")
class StoredCandidates(unittest.TestCase):
    CONNECTOR = "cn_test"

    def setUp(self) -> None:
        from app.services.workspace_service import workspace

        workspace.initialize()
        discovery.delete_for_connector(self.CONNECTOR)
        self.addCleanup(discovery.delete_for_connector, self.CONNECTOR)
        patcher = mock.patch.object(discovery, "choose_clone_url", side_effect=lambda item: item["cloneUrl"])
        patcher.start()
        self.addCleanup(patcher.stop)

    def rows(self) -> dict[str, dict]:
        return {row["full_name"]: row for row in discovery.candidate_rows(self.CONNECTOR)}

    def test_sync_adds_updates_and_drops(self) -> None:
        discovery.sync_listing(self.CONNECTOR, [listed("1", "hw/psu"), listed("2", "hw/amp")])
        self.assertEqual(sorted(self.rows()), ["hw/amp", "hw/psu"])
        self.assertEqual(self.rows()["hw/psu"]["state"], "pending")

        discovery.record_inspection(self.rows()["hw/psu"]["id"], discovery.Inspection(state="kicad", head_sha="abc"))
        discovery.sync_listing(self.CONNECTOR, [listed("1", "hw/psu-renamed", archived=True), listed("3", "hw/new")])
        rows = self.rows()
        self.assertEqual(sorted(rows), ["hw/new", "hw/psu-renamed"])
        # Still listed: what the last scan found survives, the host's facts update.
        self.assertEqual(rows["hw/psu-renamed"]["state"], "kicad")
        self.assertEqual(rows["hw/psu-renamed"]["head_sha"], "abc")
        self.assertTrue(rows["hw/psu-renamed"]["archived"])

    def test_sync_leaves_other_connectors_alone(self) -> None:
        self.addCleanup(discovery.delete_for_connector, "cn_other")
        discovery.sync_listing("cn_other", [listed("1", "other/repo")])
        discovery.sync_listing(self.CONNECTOR, [listed("1", "hw/psu")])
        discovery.sync_listing(self.CONNECTOR, [])
        self.assertEqual(self.rows(), {})
        self.assertEqual(len(discovery.candidate_rows("cn_other")), 1)

    def test_a_url_the_policy_refuses_is_blocked_until_it_is_allowed(self) -> None:
        discovery.sync_listing(self.CONNECTOR, [listed("1", "hw/psu", cloneUrl="http://git.example.com/hw/psu.git")])
        row = self.rows()["hw/psu"]
        self.assertEqual(row["state"], "blocked")
        self.assertTrue(row["error"])
        discovery.sync_listing(self.CONNECTOR, [listed("1", "hw/psu")])
        self.assertEqual(self.rows()["hw/psu"]["state"], "pending")

    def test_dismissing_and_restoring(self) -> None:
        discovery.sync_listing(self.CONNECTOR, [listed("1", "hw/psu")])
        candidate_id = self.rows()["hw/psu"]["id"]
        self.assertTrue(discovery.set_dismissed(candidate_id, True))
        self.assertTrue(self.rows()["hw/psu"]["dismissed"])
        self.assertTrue(discovery.set_dismissed(candidate_id, False))
        self.assertFalse(self.rows()["hw/psu"]["dismissed"])
        self.assertFalse(discovery.set_dismissed("missing", True))

    def test_scan_records_each_result_and_counts_unchanged(self) -> None:
        discovery.sync_listing(
            self.CONNECTOR,
            [listed("1", "hw/a"), listed("2", "hw/b"), listed("3", "hw/c"), listed("4", "hw/d")],
        )

        def inspect(row, check):  # noqa: ANN001
            check()
            return {
                "hw/a": discovery.Inspection(state="kicad", head_sha="1", projects=[{"name": "a"}]),
                "hw/b": discovery.Inspection(state="no_access", error="denied"),
                "hw/c": None,
                "hw/d": discovery.Inspection(state="error", error="boom"),
            }[row["full_name"]]

        steps: list[tuple[int, int]] = []
        counts = discovery.scan(self.CONNECTOR, inspect=inspect, workers=2, progress=lambda d, t: steps.append((d, t)))
        self.assertEqual(counts, {"unchanged": 1, "kicad": 1, "no_access": 1, "error": 1})
        self.assertEqual(steps[-1], (4, 4))
        rows = self.rows()
        self.assertEqual(rows["hw/a"]["projects"], [{"name": "a"}])
        self.assertEqual(rows["hw/b"]["error"], "denied")
        self.assertEqual(rows["hw/c"]["state"], "pending")
        self.assertIsNotNone(rows["hw/a"]["scanned_at"])

    def test_a_cancelled_scan_stops_and_raises(self) -> None:
        discovery.sync_listing(self.CONNECTOR, [listed(str(n), f"hw/r{n}") for n in range(6)])

        def cancel() -> None:
            raise JobCancelled("stop")

        with self.assertRaises(JobCancelled):
            discovery.scan(
                self.CONNECTOR,
                inspect=lambda row, check: discovery.Inspection(state="empty"),
                workers=1,
                check_cancelled=cancel,
            )

    def test_the_list_says_how_much_of_each_is_imported(self) -> None:
        from app.services.workspace_service import workspace

        discovery.sync_listing(self.CONNECTOR, [listed("1", "hw/psu"), listed("2", "hw/amp")])
        rows = self.rows()
        keys = {"hw/psu": [("psu", "."), ("amp", "amp")], "hw/amp": [("amp", ".")]}
        for name, found in keys.items():
            discovery.record_inspection(
                rows[name]["id"],
                discovery.Inspection(
                    state="kicad",
                    projects=[
                        {"name": n, "relative_path": p, "project_key": f"{p}::{n}.kicad_pro",
                         "has_schematic": True, "has_pcb": True}
                        for n, p in found
                    ],
                ),
            )

        with tempfile.TemporaryDirectory() as clone:
            # The repository was imported by hand, under the other spelling of the URL.
            repo_id = workspace.register_repository(
                name="psu", url="git@git.example.com:hw/psu.git", clone_path_abs=clone, import_type="multi"
            )
            self.addCleanup(workspace.delete_repository, repo_id)
            workspace.register_project(
                repo_id=repo_id, name="psu", relative_path=".", project_file_rel="psu.kicad_pro"
            )
            views = {view["fullName"]: view for view in discovery.candidate_views(self.CONNECTOR)}

        self.assertTrue(views["hw/psu"]["repositoryImported"])
        self.assertEqual(views["hw/psu"]["importedCount"], 1)
        self.assertEqual(len(views["hw/psu"]["projects"]), 2)
        self.assertFalse(views["hw/amp"]["repositoryImported"])
        self.assertEqual(views["hw/amp"]["importedCount"], 0)


if __name__ == "__main__":
    unittest.main()

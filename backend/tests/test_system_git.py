"""SB2-53: a linked system commits its manifest on snapshot (CONTRACTS_P2 §21, D-P2-42..45).

Each test links the fixture system to a local bare repository. The import URL policy
refuses local paths, so the service's remote resolver is swapped for one that only
asks ``ls-remote``; everything after it (clone, fetch, plumbing commit, leased push,
outside-change detection) is the code a worker runs.
"""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
from pathlib import Path
from unittest import mock

from test_system_snapshots import DESIGNER, SnapshotCase

from fastapi import FastAPI
from test_system_api import _request

from app.api import systems as systems_api
from app.services.systems import git_tracking
from app.services.systems import service as service_module
from app.services.systems.service_git import resolve_remote
from app.services.systems.visibility import etag
from app.services.systems.service_base import Caller
from app.services.systems.service_git import Remote
from app.services.systems.store import Conflict, NotFound

AUTHOR = Caller(role="designer", email="ada@example.com", name="Ada Lovelace")
_ENV = {"GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_SYSTEM": os.devnull, "GIT_TERMINAL_PROMPT": "0",
        "GIT_AUTHOR_NAME": "Outside", "GIT_AUTHOR_EMAIL": "outside@example.com",
        "GIT_COMMITTER_NAME": "Outside", "GIT_COMMITTER_EMAIL": "outside@example.com"}


def git(*args: str) -> str:
    return subprocess.run(["git", *args], env={**os.environ, **_ENV}, check=True, capture_output=True,
                          text=True).stdout.strip()


def local_remote(url: str) -> Remote:
    heads = git("ls-remote", "--symref", url, "HEAD")
    default = next((line.split()[1].removeprefix("refs/heads/") for line in heads.splitlines()
                    if line.startswith("ref:")), None)
    return Remote(url=url, dedup_key=url, default_branch=default)


class GitCase(SnapshotCase):
    def setUp(self) -> None:
        super().setUp()
        scratch = tempfile.TemporaryDirectory()
        self.addCleanup(scratch.cleanup)
        self.root = Path(scratch.name)
        patcher = mock.patch.dict(os.environ, {**_ENV, "PRISM_SYSTEM_REPOS_ROOT": str(self.root / "clones")})
        patcher.start()
        self.addCleanup(patcher.stop)
        self.upstream = self.root / "upstream.git"
        git("init", "--quiet", "--bare", "--initial-branch=main", str(self.upstream))
        self.author = self.root / "author"
        git("clone", "--quiet", str(self.upstream), str(self.author))
        self.queued: list[tuple] = []
        self.service._git_remote = local_remote
        self.service._git_enqueue_sync = lambda *a, **k: self.queued.append(("sync", *a)) or {"id": "job_s"}
        self.service._git_enqueue_commit = lambda *a, **k: self.queued.append(("commit", *a)) or {"id": "job_c"}

    # ------------------------------------------------------------------ helpers

    def outside_commit(self, path: str, text: str, message: str = "outside") -> str:
        git("-C", str(self.author), "pull", "--quiet", "--ff-only", "origin", "main") if self.branch_exists() else None
        target = self.author / path
        target.write_text(text)
        git("-C", str(self.author), "add", path)
        git("-C", str(self.author), "commit", "--quiet", "-m", message)
        git("-C", str(self.author), "push", "--quiet", "origin", "HEAD:main")
        return git("-C", str(self.author), "rev-parse", "HEAD")

    def branch_exists(self) -> bool:
        return bool(git("ls-remote", str(self.upstream), "refs/heads/main"))

    def link(self, branch: str | None = None) -> dict:
        result = self.service.set_git_link(DESIGNER, self.sid, self.version(), str(self.upstream), branch)
        git_tracking.sync(self.connect, self.sid)
        return result.body

    def take(self, name: str, caller: Caller = AUTHOR, note: str = "") -> dict:
        return self.service.create_snapshot(caller, self.sid, self.version(), name, note).body

    def commit(self, snapshot: dict) -> dict:
        return git_tracking.commit_snapshot(self.connect, self.sid, snapshot["id"])

    def show(self, rev: str) -> str:
        return git("--git-dir", str(self.upstream), "show", "-s", "--format=%an <%ae>|%cn <%ce>|%P|%B", rev)

    def remote_manifest(self) -> dict:
        return json.loads(git("--git-dir", str(self.upstream), "show", f"main:{git_tracking.MANIFEST_FILE}"))

    def meta(self, snapshot_id: str) -> dict:
        return next(s for s in self.service.list_snapshots(DESIGNER, self.sid) if s["id"] == snapshot_id)


class CommitOnSnapshotTest(GitCase):
    def test_a_snapshot_commits_the_manifest_onto_the_branch_and_keeps_other_files(self) -> None:
        readme = self.outside_commit("README.md", "the avionics stack\n", "readme")
        link = self.link()
        self.assertEqual((link["branch"], link["knownBlob"], link["outsideCommit"]), ("main", None, None))
        self.assertEqual(self.service.git_link(DESIGNER, self.sid)["tip"], readme)

        snapshot = self.take("CDR", note="Critical design review")
        self.assertEqual(snapshot["git"], {"state": "queued"})
        self.assertEqual(self.queued[-1], ("commit", self.sid, snapshot["id"]))
        state = self.commit(snapshot)
        self.assertEqual(state["state"], "pushed")
        self.assertEqual(self.meta(snapshot["id"])["git"], {"state": "pushed", "commit": state["commit"],
                                                           "branch": "main"})

        manifest = self.service.snapshot_manifest(DESIGNER, self.sid, snapshot["id"])
        written = git("--git-dir", str(self.upstream), "show", f"main:{git_tracking.MANIFEST_FILE}") + "\n"
        self.assertEqual(written.encode(), git_tracking.manifest_bytes(manifest))
        self.assertEqual(git("--git-dir", str(self.upstream), "show", "main:README.md"), "the avionics stack")
        author, committer, parent, message = self.show(state["commit"]).split("|", 3)
        self.assertEqual(author, "Ada Lovelace <ada@example.com>")
        self.assertEqual(committer, "KiCAD Prism <prism@kicad-prism.invalid>")
        self.assertEqual(parent, readme)
        self.assertEqual(message.strip(), f"Snapshot CDR\n\nCritical design review\n\nPrism-System: {self.sid}\n"
                                          f"Prism-Snapshot: {snapshot['id']}")
        link = self.service.git_link(DESIGNER, self.sid)
        self.assertEqual(link["tip"], state["commit"])
        self.assertEqual(link["knownBlob"], git("--git-dir", str(self.upstream), "rev-parse",
                                                f"main:{git_tracking.MANIFEST_FILE}"))

        second = self.take("PDR")
        pushed = self.commit(second)
        self.assertEqual(self.show(pushed["commit"]).split("|")[2], state["commit"])
        self.assertEqual(self.remote_manifest()["meta"]["snapshot"]["name"], "PDR")
        self.assertEqual(self.commit(second), pushed, "a retried job finds the snapshot already pushed")
        events = self.conn.execute("SELECT actor, kind, payload FROM system_audit_events WHERE system_id = %s "
                                   "AND kind LIKE 'snapshot_commit%%' ORDER BY seq", (self.sid,)).fetchall()
        self.assertEqual([(e["actor"], e["kind"], e["payload"]["commit"]) for e in events],
                         [("system:git", "snapshot_committed", state["commit"]),
                          ("system:git", "snapshot_committed", pushed["commit"])])

    def test_an_empty_repository_gets_a_root_commit_on_the_named_branch(self) -> None:
        link = self.link(branch="systems")
        self.assertEqual(link["branch"], "systems")
        state = self.commit(self.take("CDR"))
        self.assertEqual(state["state"], "pushed")
        self.assertEqual(self.show(state["commit"]).split("|")[2], "", "no parent")
        self.assertEqual(git("--git-dir", str(self.upstream), "rev-parse", "refs/heads/systems"), state["commit"])

    def test_an_unlinked_system_has_no_git_status_and_queues_nothing(self) -> None:
        self.assertEqual(self.take("CDR")["git"], None)
        self.assertEqual(self.queued, [])
        self.assertIsNone(self.service.git_link(DESIGNER, self.sid))

    def test_unrelated_outside_pushes_are_kept_and_the_commit_goes_on_top(self) -> None:
        self.link()
        first = self.commit(self.take("CDR"))
        snapshot = self.take("PDR")
        real_push, raced = git_tracking.push, []

        def racing_push(*args, **kwargs):
            if not raced:  # someone pushes another file between Prism's fetch and its push
                raced.append(self.outside_commit("NOTES.md", "harness notes\n"))
            return real_push(*args, **kwargs)

        with mock.patch.object(git_tracking, "push", side_effect=racing_push):
            state = self.commit(snapshot)
        self.assertEqual(state["state"], "pushed")
        self.assertEqual(self.show(state["commit"]).split("|")[2], raced[0])
        self.assertEqual(git("--git-dir", str(self.upstream), "show", "main:NOTES.md"), "harness notes")
        self.assertNotEqual(first["commit"], raced[0])

    def test_an_older_snapshot_never_lands_over_a_newer_one(self) -> None:
        self.link()
        older, newer = self.take("CDR"), self.take("PDR")
        self.assertEqual(self.commit(newer)["state"], "pushed")
        self.assertEqual(self.commit(older), {"state": "skipped"})
        self.assertEqual(self.remote_manifest()["meta"]["snapshot"]["name"], "PDR")


class OutsideChangeTest(GitCase):
    def test_an_outside_manifest_change_refuses_commits_and_snapshots(self) -> None:
        self.link()
        self.commit(self.take("CDR"))
        queued = self.take("PDR")
        outside = self.outside_commit(git_tracking.MANIFEST_FILE, '{"edited": "by hand"}\n')

        state = self.commit(queued)
        self.assertEqual(state, {"state": "refused", "reason": "outside-change", "commit": outside})
        self.assertEqual(self.remote_manifest(), {"edited": "by hand"}, "Prism never overwrites it")
        self.assertEqual(self.service.git_link(DESIGNER, self.sid)["outsideCommit"], outside)
        with self.assertRaisesRegex(Conflict, "git_outside_change"):
            self.take("FRR")
        with self.assertRaisesRegex(Conflict, "git_outside_change"):
            self.service.retry_snapshot_git(DESIGNER, self.sid, queued["id"])

    def test_a_fetch_finds_the_outside_change_and_a_manifest_already_there_counts(self) -> None:
        outside = self.outside_commit(git_tracking.MANIFEST_FILE, "{}\n")
        self.link()
        self.assertEqual(self.service.git_link(DESIGNER, self.sid)["outsideCommit"], outside)
        with self.assertRaisesRegex(Conflict, "git_outside_change"):
            self.take("CDR")

    def test_removing_the_manifest_outside_is_an_outside_change(self) -> None:
        self.link()
        self.commit(self.take("CDR"))
        git("-C", str(self.author), "pull", "--quiet", "origin", "main")
        git("-C", str(self.author), "rm", "--quiet", git_tracking.MANIFEST_FILE)
        git("-C", str(self.author), "commit", "--quiet", "-m", "remove")
        git("-C", str(self.author), "push", "--quiet", "origin", "HEAD:main")
        self.assertEqual(git_tracking.sync(self.connect, self.sid)["outcome"], "outside_change")


class LinkTest(GitCase):
    def test_link_changes_are_versioned_audited_and_one_branch_has_one_system(self) -> None:
        version = self.version()
        self.link()
        self.assertEqual(self.version(), version + 1)
        self.assertEqual(self.queued, [("sync", self.sid)])
        other = self.store.create_system(name="Other", folder_id=None, actor="user:t")
        self.conn.commit()
        with self.assertRaisesRegex(Conflict, "git_link_in_use"):
            self.service.set_git_link(DESIGNER, other["id"], other["version"], str(self.upstream), "main")
        self.service.set_git_link(DESIGNER, other["id"], other["version"], str(self.upstream), "other")

        clone = git_tracking.clone_path(self.sid)
        self.assertTrue((clone / "HEAD").exists())
        self.service.remove_git_link(DESIGNER, self.sid, self.version())
        self.assertFalse(clone.exists())
        self.assertIsNone(self.service.git_link(DESIGNER, self.sid))
        with self.assertRaises(NotFound):
            self.service.remove_git_link(DESIGNER, self.sid, self.version())
        kinds = [r["kind"] for r in self.conn.execute(
            "SELECT kind FROM system_audit_events WHERE system_id = %s AND kind LIKE 'git_%%' ORDER BY seq",
            (self.sid,)).fetchall()]
        self.assertEqual(kinds, ["git_linked", "git_unlinked"])

    def test_an_unreachable_remote_fails_the_commit_with_a_reason_and_can_be_retried(self) -> None:
        self.link()
        snapshot = self.take("CDR")
        moved = self.root / "moved.git"
        self.upstream.rename(moved)
        state = self.commit(snapshot)
        self.assertEqual(state["state"], "failed")
        self.assertTrue(state["reason"])
        self.upstream = moved
        self.conn.execute("UPDATE system_git_links SET url = %s, dedup_key = %s", (str(moved), str(moved)))
        self.conn.commit()
        self.assertEqual(self.service.retry_snapshot_git(DESIGNER, self.sid, snapshot["id"]), {"jobId": "job_c"})
        self.assertEqual(self.meta(snapshot["id"])["git"], {"state": "queued"})
        self.assertEqual(self.commit(snapshot)["state"], "pushed")
        self.assertEqual(git_tracking.author_of({"git": {"author": {"name": "", "email": "x@y.z"}},
                                                 "created_by": "user:x@y.z"}).name, "x")


class GitApiTest(GitCase):
    def setUp(self) -> None:
        super().setUp()
        patcher = mock.patch.object(service_module, "service", self.service)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.app = FastAPI()
        self.app.include_router(systems_api.router, prefix="/api/systems")

    def call(self, method: str, path: str, **kwargs):
        return _request(self.app, method, f"/api/systems/{self.sid}{path}", **kwargs)

    def test_link_routes_need_designer_and_if_match_and_snapshots_answer_409(self) -> None:
        self.assertIsNone(self.call("GET", "/git", user="viewer").json)
        body = {"url": str(self.upstream)}
        self.assertEqual(self.call("PUT", "/git", body=body).status, 428)
        current = etag(self.sid, self.version())
        self.assertEqual(self.call("PUT", "/git", body=body, headers={"If-Match": current}, user="viewer").status, 403)
        linked = self.call("PUT", "/git", body=body, headers={"If-Match": current})
        self.assertEqual((linked.status, linked.json["branch"]), (200, "main"))
        self.assertEqual(self.call("POST", "/git/fetch").json, {"jobId": "job_s"})

        outside = self.outside_commit(git_tracking.MANIFEST_FILE, "{}\n")
        git_tracking.sync(self.connect, self.sid)
        refused = self.call("POST", "/snapshots", body={"name": "CDR"},
                            headers={"If-Match": etag(self.sid, self.version())})
        self.assertEqual(refused.status, 409)
        self.assertIn(outside, refused.json["detail"])
        self.assertEqual(self.call("DELETE", "/git", headers={"If-Match": etag(self.sid, self.version())}).status, 204)

    def test_the_import_url_policy_refuses_local_paths(self) -> None:
        self.service._git_remote = resolve_remote
        put = self.call("PUT", "/git", body={"url": str(self.upstream)},
                        headers={"If-Match": etag(self.sid, self.version())})
        self.assertEqual(put.status, 422)
        self.assertTrue(put.json["detail"].startswith("git_url_invalid"))


if __name__ == "__main__":
    import unittest

    unittest.main()

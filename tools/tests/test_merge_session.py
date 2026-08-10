"""Merging two branches on the machine that holds the working tree.

This is the first part of the feature that WRITES, so the tests are mostly about what it
must refuse and what it must put back. The ordering is the safety property: everything is
built and validated in memory first, so a selection that cannot produce a sound board
costs nothing and needs no rollback.

The rule inherited from `checkout.pull` matters most here: a stash the user did not ask
for, that did not result in a merge, is just their work gone missing.
"""

from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parents[1]
REPO = TOOLS.parent
sys.path.insert(0, str(TOOLS))
sys.path.insert(0, str(REPO / "backend"))

from prism_agent import merge_session as ms  # noqa: E402
from prism_agent import merge_tokens  # noqa: E402

BOARD = REPO / "data" / "projects" / "type1" / "test board" / "Git test.kicad_pcb"


def git(repo: Path, *args: str, check: bool = True) -> str:
    return subprocess.run(
        ["git", "-C", str(repo), *args],
        capture_output=True,
        text=True,
        check=check,
    ).stdout.strip()


def drop_footprint(text: str, which: int) -> str:
    from app.services import sexp_splice as sp
    from app.services import span_index as si

    _, index = si.build_pcb_index(text)
    footprints = sorted(
        (a for a in index.values() if a.kind == "footprint"), key=lambda a: a.offset
    )
    victim = footprints[which]
    return sp.apply_edits(text, [sp.delete(victim.offset, victim.end_offset, text)])


def count_footprints(text: str) -> int:
    from app.services import span_index as si

    _, index = si.build_pcb_index(text)
    return len([a for a in index.values() if a.kind == "footprint"])


class MergingBranches(unittest.TestCase):
    """A real repository, two branches, one board."""

    @classmethod
    def setUpClass(cls) -> None:
        if not BOARD.is_file():
            raise unittest.SkipTest("no sample board checked out")

    def setUp(self) -> None:
        self.work = Path(tempfile.mkdtemp())
        self.repo = self.work / "proj"
        self.repo.mkdir()
        git(self.work, "init", "-q", "-b", "main", str(self.repo))
        git(self.repo, "config", "user.email", "test@example.com")
        git(self.repo, "config", "user.name", "Test")

        self.base_text = BOARD.read_text(encoding="utf-8")
        self.board = self.repo / "board.kicad_pcb"
        self.board.write_text(self.base_text, encoding="utf-8")
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-qm", "base")

        # theirs removes one part; ours removes a different one
        git(self.repo, "checkout", "-q", "-b", "feature")
        self.board.write_text(drop_footprint(self.base_text, 5), encoding="utf-8")
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-qm", "remove a part")

        git(self.repo, "checkout", "-q", "main")
        self.board.write_text(drop_footprint(self.base_text, 0), encoding="utf-8")
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-qm", "remove another part")

    def take_theirs(self, plan):
        entry = next(f for f in plan.files if f.kind == "pcb")
        return entry, {
            entry.path: [
                {"key": d.key, "resolution": "theirs"}
                for d in entry.decisions
                if d.classification == "only_theirs"
            ]
        }

    def diverge_text(self, base: str, theirs: str, ours: str) -> None:
        """Add a text file that already differs on both branches.

        Rewinds both branches and rebuilds them, because the file has to exist in the
        merge base for the two sides to have anything to disagree about.
        """
        notes = self.repo / "notes.md"

        git(self.repo, "checkout", "-q", "main")
        git(self.repo, "reset", "-q", "--hard", "HEAD~1")
        base_board = self.board.read_text(encoding="utf-8")
        notes.write_text(base, encoding="utf-8")
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-qm", "add notes")

        git(self.repo, "checkout", "-q", "-B", "feature")
        self.board.write_text(drop_footprint(base_board, 5), encoding="utf-8")
        notes.write_text(theirs, encoding="utf-8")
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-qm", "theirs")

        git(self.repo, "checkout", "-q", "main")
        self.board.write_text(drop_footprint(base_board, 0), encoding="utf-8")
        notes.write_text(ours, encoding="utf-8")
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-qm", "ours")

    # -- planning is read-only ---------------------------------------------

    def test_a_plan_finds_the_common_ancestor(self) -> None:
        plan = ms.plan(self.repo, "feature")
        self.assertEqual(plan.base_sha, git(self.repo, "merge-base", "HEAD", "feature"))
        self.assertEqual(len(plan.files), 1)
        self.assertEqual(plan.files[0].kind, "pcb")

    def test_planning_does_not_touch_the_tree(self) -> None:
        # Safe to call while the user has KiCad open on the project.
        before = self.board.read_text(encoding="utf-8")
        ms.plan(self.repo, "feature")
        self.assertEqual(self.board.read_text(encoding="utf-8"), before)
        self.assertEqual(git(self.repo, "status", "--porcelain"), "")

    def test_an_unknown_branch_is_refused(self) -> None:
        with self.assertRaises(ms.MergeError):
            ms.plan(self.repo, "no-such-branch")

    def test_a_branch_already_merged_is_refused(self) -> None:
        with self.assertRaises(ms.MergeError) as caught:
            ms.plan(self.repo, "main")
        self.assertIn("already", str(caught.exception).lower())

    def test_a_directory_that_is_not_a_repo_is_refused(self) -> None:
        with self.assertRaises(ms.MergeError):
            ms.plan(self.work, "feature")

    # -- building is still in memory ---------------------------------------

    def test_building_produces_text_without_writing_it(self) -> None:
        plan = ms.plan(self.repo, "feature")
        _, decisions = self.take_theirs(plan)
        before = self.board.read_text(encoding="utf-8")

        built = ms.build(plan, decisions)
        self.assertEqual(len(built), 1)
        self.assertEqual(self.board.read_text(encoding="utf-8"), before)

    def test_the_merge_honours_both_deletions(self) -> None:
        plan = ms.plan(self.repo, "feature")
        entry, decisions = self.take_theirs(plan)

        self.assertEqual(count_footprints(self.base_text), 10)
        self.assertEqual(count_footprints(entry.ours), 9)
        self.assertEqual(count_footprints(entry.theirs), 9)

        built = ms.build(plan, decisions)
        self.assertEqual(count_footprints(built[0].text), 8)

    def test_staging_nothing_keeps_our_board_exactly(self) -> None:
        plan = ms.plan(self.repo, "feature")
        built = ms.build(plan, {})
        self.assertEqual(built[0].text, plan.files[0].ours)

    # -- committing --------------------------------------------------------

    def test_a_merge_commit_has_two_parents(self) -> None:
        # History must record that these branches came together, or the NEXT merge
        # computes its base from the wrong place.
        plan = ms.plan(self.repo, "feature")
        _, decisions = self.take_theirs(plan)

        result = ms.commit(self.repo, "feature", decisions)
        self.assertTrue(result["ok"])
        parents = git(self.repo, "log", "-1", "--format=%P").split()
        self.assertEqual(len(parents), 2)

    def test_the_merge_leaves_no_merge_in_progress(self) -> None:
        plan = ms.plan(self.repo, "feature")
        _, decisions = self.take_theirs(plan)
        ms.commit(self.repo, "feature", decisions)
        self.assertEqual(
            git(self.repo, "rev-parse", "--verify", "MERGE_HEAD", check=False), ""
        )

    def test_the_committed_board_is_the_merged_one(self) -> None:
        plan = ms.plan(self.repo, "feature")
        _, decisions = self.take_theirs(plan)
        ms.commit(self.repo, "feature", decisions)
        self.assertEqual(count_footprints(self.board.read_text(encoding="utf-8")), 8)

    def test_the_commit_message_can_be_given(self) -> None:
        plan = ms.plan(self.repo, "feature")
        _, decisions = self.take_theirs(plan)
        ms.commit(self.repo, "feature", decisions, message="Bring in the RF changes")
        self.assertIn("RF changes", git(self.repo, "log", "-1", "--format=%s"))

    # -- text files --------------------------------------------------------

    def test_a_text_file_git_can_merge_is_left_to_git(self) -> None:
        # Line-based merging is what git is good at. Second-guessing it here would be
        # worse than useless: two people appending to opposite ends of a BOM script
        # both get their line.
        self.diverge_text("A\nB\nC\n", "A\nB\nC\ntheirs\n", "ours\nA\nB\nC\n")
        plan = ms.plan(self.repo, "feature")
        entry, decisions = self.take_theirs(plan)
        del entry

        ms.commit(self.repo, "feature", decisions)
        merged = (self.repo / "notes.md").read_text(encoding="utf-8")
        self.assertIn("ours", merged)
        self.assertIn("theirs", merged)

    def test_a_text_conflict_is_refused_and_names_the_file(self) -> None:
        self.diverge_text("one\ntwo\n", "one\nTHEIRS\n", "one\nOURS\n")
        plan = ms.plan(self.repo, "feature")
        _, decisions = self.take_theirs(plan)

        with self.assertRaises(ms.MergeError) as caught:
            ms.commit(self.repo, "feature", decisions)

        # Carried as data, not just prose, so the UI can offer a choice per file
        # rather than making someone read a sentence and go to a terminal.
        self.assertEqual(caught.exception.conflicts, ["notes.md"])

    def test_a_refused_text_conflict_leaves_no_markers_behind(self) -> None:
        # git writes <<<<<<< into the working file before we refuse. Leaving that
        # there would hand the user a broken file they never asked to edit.
        self.diverge_text("one\ntwo\n", "one\nTHEIRS\n", "one\nOURS\n")
        plan = ms.plan(self.repo, "feature")
        _, decisions = self.take_theirs(plan)

        with self.assertRaises(ms.MergeError):
            ms.commit(self.repo, "feature", decisions)

        notes = (self.repo / "notes.md").read_text(encoding="utf-8")
        self.assertNotIn("<<<<<<<", notes)
        self.assertEqual(notes, "one\nOURS\n")

    def test_choosing_a_side_settles_a_text_conflict(self) -> None:
        self.diverge_text("one\ntwo\n", "one\nTHEIRS\n", "one\nOURS\n")
        plan = ms.plan(self.repo, "feature")
        _, decisions = self.take_theirs(plan)

        result = ms.commit(
            self.repo, "feature", decisions, text_choices={"notes.md": "theirs"}
        )
        self.assertTrue(result["ok"])
        self.assertEqual(
            (self.repo / "notes.md").read_text(encoding="utf-8"), "one\nTHEIRS\n"
        )
        self.assertEqual(result["text_resolved"], {"notes.md": "theirs"})

    def test_keeping_ours_settles_a_text_conflict_too(self) -> None:
        self.diverge_text("one\ntwo\n", "one\nTHEIRS\n", "one\nOURS\n")
        plan = ms.plan(self.repo, "feature")
        _, decisions = self.take_theirs(plan)

        ms.commit(self.repo, "feature", decisions, text_choices={"notes.md": "ours"})
        self.assertEqual(
            (self.repo / "notes.md").read_text(encoding="utf-8"), "one\nOURS\n"
        )

    def test_a_settled_text_conflict_still_produces_a_merge_commit(self) -> None:
        self.diverge_text("one\ntwo\n", "one\nTHEIRS\n", "one\nOURS\n")
        plan = ms.plan(self.repo, "feature")
        _, decisions = self.take_theirs(plan)

        ms.commit(self.repo, "feature", decisions, text_choices={"notes.md": "theirs"})
        self.assertEqual(len(git(self.repo, "log", "-1", "--format=%P").split()), 2)

    # -- refusing ----------------------------------------------------------

    def test_uncommitted_work_is_refused_without_consent(self) -> None:
        self.board.write_text(
            self.board.read_text(encoding="utf-8") + "\n", encoding="utf-8"
        )
        with self.assertRaises(ms.MergeError) as caught:
            ms.commit(self.repo, "feature", {})
        self.assertIn("uncommitted", str(caught.exception).lower())

    def test_a_refused_merge_leaves_the_edit_alone(self) -> None:
        # The whole point of refusing rather than proceeding.
        marked = self.board.read_text(encoding="utf-8") + "\n; my edit\n"
        self.board.write_text(marked, encoding="utf-8")
        with self.assertRaises(ms.MergeError):
            ms.commit(self.repo, "feature", {})
        self.assertEqual(self.board.read_text(encoding="utf-8"), marked)

    def test_a_refused_merge_leaves_nothing_in_progress(self) -> None:
        self.board.write_text(
            self.board.read_text(encoding="utf-8") + "\n", encoding="utf-8"
        )
        with self.assertRaises(ms.MergeError):
            ms.commit(self.repo, "feature", {})
        self.assertEqual(
            git(self.repo, "rev-parse", "--verify", "MERGE_HEAD", check=False), ""
        )

    def test_uncommitted_work_can_be_set_aside(self) -> None:
        self.board.write_text(
            self.board.read_text(encoding="utf-8") + "\n", encoding="utf-8"
        )
        result = ms.commit(self.repo, "feature", {}, stash_message="mid-route")
        self.assertTrue(result["ok"])
        self.assertTrue(git(self.repo, "stash", "list"))

    def test_a_merge_in_progress_is_refused(self) -> None:
        git(self.repo, "merge", "--no-commit", "--no-ff", "feature", check=False)
        try:
            with self.assertRaises(ms.MergeError) as caught:
                ms.commit(self.repo, "feature", {})
            self.assertIn("in progress", str(caught.exception).lower())
        finally:
            git(self.repo, "merge", "--abort", check=False)

    def test_a_detached_head_is_refused(self) -> None:
        git(self.repo, "checkout", "-q", "--detach")
        with self.assertRaises(ms.MergeError) as caught:
            ms.commit(self.repo, "feature", {})
        self.assertIn("branch", str(caught.exception).lower())

    def test_aborting_without_a_merge_says_so(self) -> None:
        with self.assertRaises(ms.MergeError):
            ms.abort(self.repo)


class CorsHeaders(unittest.TestCase):
    """What the browser is allowed to send us.

    A preflight that omits a header the client actually sends still returns 204, so
    nothing looks wrong from here: the agent answers, the route works under curl, and
    every Python test passes. The browser then silently refuses to send the real
    request, and the page reports a network failure it cannot explain.

    This cost an hour of live debugging. The rule it encodes: every custom header the
    client sends must appear in the allow-list, and the two must be checked together.
    """

    def test_every_header_the_client_sends_is_allowed(self) -> None:
        import re

        from prism_agent import server

        source = Path(server.__file__).read_text(encoding="utf-8")
        match = re.search(r'"Access-Control-Allow-Headers",\s*\n?\s*"([^"]+)"', source)
        self.assertIsNotNone(match, "the allow-list should be a literal we can read")
        allowed = {h.strip().lower() for h in match.group(1).split(",")}

        # What frontend/src/lib/merge-agent.ts puts on its requests.
        for header in ("authorization", "content-type", "x-prism-merge"):
            self.assertIn(
                header,
                allowed,
                f"the page sends {header} but the agent does not allow it, so the "
                "browser will block the request without a usable error",
            )


class SessionTokens(unittest.TestCase):
    """One tab, one merge, and never the agent's own key."""

    def setUp(self) -> None:
        self.sessions = merge_tokens.Sessions()

    def test_a_session_starts_unclaimed(self) -> None:
        session = self.sessions.create("/tmp/x", "feature")
        self.assertTrue(session.claim_key)
        self.assertFalse(session.token)
        self.assertFalse(session.claimed)

    def test_claiming_exchanges_the_key_for_a_token(self) -> None:
        session = self.sessions.create("/tmp/x", "feature")
        claimed = self.sessions.claim(session.id, session.claim_key)
        self.assertIsNotNone(claimed)
        self.assertTrue(claimed.token)
        self.assertFalse(claimed.claim_key, "the key must be spent")

    def test_a_key_can_only_be_claimed_once(self) -> None:
        # A replayed link means someone else already holds the session.
        session = self.sessions.create("/tmp/x", "feature")
        key = session.claim_key
        self.assertIsNotNone(self.sessions.claim(session.id, key))
        self.assertIsNone(self.sessions.claim(session.id, key))

    def test_a_wrong_key_claims_nothing(self) -> None:
        session = self.sessions.create("/tmp/x", "feature")
        self.assertIsNone(self.sessions.claim(session.id, "not-the-key"))

    def test_an_unknown_session_claims_nothing(self) -> None:
        self.assertIsNone(self.sessions.claim("no-such-session", "key"))

    def test_a_session_token_authorises_only_its_own_session(self) -> None:
        first = self.sessions.create("/tmp/a", "feature")
        second = self.sessions.create("/tmp/b", "feature")
        claimed = self.sessions.claim(first.id, first.claim_key)

        self.assertIsNotNone(self.sessions.authorise(first.id, claimed.token))
        self.assertIsNone(self.sessions.authorise(second.id, claimed.token))

    def test_an_unclaimed_session_authorises_nothing(self) -> None:
        session = self.sessions.create("/tmp/x", "feature")
        self.assertIsNone(self.sessions.authorise(session.id, ""))

    def test_an_expired_session_is_refused(self) -> None:
        session = self.sessions.create("/tmp/x", "feature")
        claimed = self.sessions.claim(session.id, session.claim_key)
        claimed.created -= merge_tokens.SESSION_TTL + 1
        self.assertIsNone(self.sessions.authorise(session.id, claimed.token))

    def test_a_stale_link_cannot_be_claimed(self) -> None:
        session = self.sessions.create("/tmp/x", "feature")
        session.created -= merge_tokens.CLAIM_TTL + 1
        self.assertIsNone(self.sessions.claim(session.id, session.claim_key))

    def test_closing_a_session_revokes_its_token(self) -> None:
        session = self.sessions.create("/tmp/x", "feature")
        claimed = self.sessions.claim(session.id, session.claim_key)
        self.sessions.close(session.id)
        self.assertIsNone(self.sessions.authorise(session.id, claimed.token))

    def test_the_session_remembers_what_it_is_for(self) -> None:
        # A token is scoped to one merge: it cannot be pointed at another project.
        session = self.sessions.create("/home/me/proj", "feature")
        claimed = self.sessions.claim(session.id, session.claim_key)
        self.assertEqual(claimed.repo, "/home/me/proj")
        self.assertEqual(claimed.theirs_ref, "feature")


if __name__ == "__main__":
    unittest.main()

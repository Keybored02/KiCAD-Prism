"""SB2-97: the system limits hold on every path that changes a system's contents."""

from __future__ import annotations

import unittest
from unittest import mock

from test_system_child_drift import ChildDriftCase
import test_system_git as git_tests
from test_system_snapshots import DESIGNER

from app.services.systems import git_tracking, hierarchy, store_instances
from app.services.systems.store import Invalid


class ManifestImportLimitsTest(git_tests.GitCase):
    # The manifest-import helpers, without inheriting (and re-running) that class's tests.
    push_edited = git_tests.ManifestImportTest.push_edited
    open_review = git_tests.ManifestImportTest.open_review
    decide = git_tests.ManifestImportTest.decide
    rename = git_tests.ManifestImportTest.rename

    def outside_review(self) -> dict:
        self.link()
        self.commit(self.take("CDR"))
        self.push_edited(self.rename)
        git_tracking.sync(self.connect, self.sid)
        return self.open_review()

    def assert_refused_whole(self, review: dict, pattern: str) -> None:
        before = self.service.document(DESIGNER, self.sid).body
        with self.assertRaisesRegex(Invalid, pattern):
            self.decide(review, "accept")
        after = self.service.document(DESIGNER, self.sid).body
        self.assertEqual(after["system"]["name"], "Fixture")
        self.assertEqual(len(after["instances"]), len(before["instances"]))
        self.assertEqual(self.open_review()["id"], review["id"], "the review stays open")

    def test_an_import_over_the_flattened_board_limit_is_refused(self) -> None:
        review = self.outside_review()
        with mock.patch.object(hierarchy, "MAX_BOARDS", 3):  # the fixture system has 4 boards
            self.assert_refused_whole(review, "more than 3 boards")

    def test_an_import_over_the_direct_instance_limit_is_refused(self) -> None:
        review = self.outside_review()
        with mock.patch.object(store_instances, "MAX_INSTANCES", 3):
            self.assert_refused_whole(review, "instances_per_system")


class AdvanceRaceTest(ChildDriftCase):
    """Bus = CNDH-A (4 boards) + PDU. The child's V2 adds a fifth board, so the bus would hold 6."""

    def test_a_board_added_between_the_check_and_the_apply_blocks_the_advance(self) -> None:
        self.service.add_instance(DESIGNER, self.sid, self.version(), project_id="prj_pay", label="PAY-2",
                                  baseline_commit=self.commits["mini_payload"]["F0"], tracked_ref=None, pinned=False)
        v2 = self.publish_next("V2")
        real, calls = hierarchy.resolve, []

        def resolve(*args, **kwargs):
            result = real(*args, **kwargs)
            calls.append(args[0])
            if len(calls) == 1:  # right after the unlocked check: another editor adds a board
                bus = self.bus_doc()["system"]
                self.service.add_instance(DESIGNER, self.bus, bus["version"], project_id="prj_obc", label="SPARE",
                                          baseline_commit=self.commits["mini_obc"]["F0"], tracked_ref=None,
                                          pinned=False)
            return result

        with mock.patch.object(hierarchy, "MAX_BOARDS", 6), mock.patch.object(hierarchy, "resolve", side_effect=resolve):
            result = self.advance(v2["revisionId"])
        self.assertEqual(result["outcome"], "advance_blocked")
        self.assertNotEqual(self.cndh_instance()["catalog_revision_id"], v2["revisionId"])
        self.assertEqual(self.service.hierarchy(DESIGNER, self.bus)["boardCount"], 6, "the bus still reads")

    def test_without_a_race_the_advance_goes_through(self) -> None:
        self.service.add_instance(DESIGNER, self.sid, self.version(), project_id="prj_pay", label="PAY-2",
                                  baseline_commit=self.commits["mini_payload"]["F0"], tracked_ref=None, pinned=False)
        v2 = self.publish_next("V2")
        with mock.patch.object(hierarchy, "MAX_BOARDS", 6):
            result = self.advance(v2["revisionId"])
        self.assertNotEqual(result["outcome"], "advance_blocked")


if __name__ == "__main__":
    unittest.main()

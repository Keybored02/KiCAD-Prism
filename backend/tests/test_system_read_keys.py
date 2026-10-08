"""SB2-98: the document carries its findings on request, and digests of what the 3D scene and the
system nets depend on, so readers re-read those only when they change."""

from __future__ import annotations

import unittest

from test_system_snapshots import DESIGNER, SnapshotCase


class ReadKeysTest(SnapshotCase):
    def document(self, **kwargs) -> dict:
        return self.service.document(DESIGNER, self.sid, **kwargs).body

    def first_link(self) -> dict:
        return next(link for link in self.document()["links"] if link["rows"])

    def put_rows(self, link: dict, rows: list[dict]) -> None:
        self.service.replace_rows(DESIGNER, self.sid, self.version(), link["id"], rows)

    def rows_of(self, link: dict) -> list[dict]:
        return [{"pinA": r["pinA"], "pinB": r["pinB"], "signal": r["signal"]} for r in link["rows"]]

    def test_validation_comes_with_the_document_only_when_asked(self) -> None:
        self.assertNotIn("validation", self.document())
        with_findings = self.document(include_validation=True)
        self.assertEqual(with_findings["validation"]["counts"], with_findings["findingCounts"])

    def test_a_signal_label_moves_neither_key(self) -> None:
        # Saving rows re-captures their net baselines; settle them first (this fixture has drift).
        link = self.first_link()
        self.put_rows(link, self.rows_of(link))
        before = self.document()
        link = self.first_link()
        rows = self.rows_of(link)
        rows[0]["signal"] = rows[0]["signal"] + "_renamed"
        self.put_rows(link, rows)
        after = self.document()
        self.assertNotEqual(after["system"]["version"], before["system"]["version"])
        self.assertEqual((after["sceneKey"], after["netsKey"]), (before["sceneKey"], before["netsKey"]))

    def test_a_removed_row_moves_the_nets_key(self) -> None:
        before = self.document()
        link = self.first_link()
        self.put_rows(link, self.rows_of(link)[1:])
        self.assertNotEqual(self.document()["netsKey"], before["netsKey"])

    def test_a_moved_board_moves_the_scene_key_only(self) -> None:
        before = self.document()
        instance = before["instances"][0]["id"]
        self.service.set_pose(DESIGNER, self.sid, self.version(), instance,
                              {"translationMm": [10, 0, 0], "rotation": [0, 0, 0, 1]})
        after = self.document()
        self.assertNotEqual(after["sceneKey"], before["sceneKey"])
        self.assertEqual(after["netsKey"], before["netsKey"])

    def test_snapshots_do_not_freeze_the_read_keys(self) -> None:
        snapshot = self.snapshot()
        frozen = self.service.get_snapshot(DESIGNER, self.sid, snapshot["id"])["document"]
        self.assertNotIn("sceneKey", frozen)
        self.assertNotIn("netsKey", frozen)


if __name__ == "__main__":
    unittest.main()

"""SB2-101: the systems list says how many boards a system holds through its subsystems, its last
snapshot, its git branch and its last finding counts."""

from __future__ import annotations

import unittest

from test_system_assemblies import AssemblyCase
from test_system_snapshots import DESIGNER


class SystemListTest(AssemblyCase):
    def summary(self, system_id: str) -> dict:
        return next(s for s in self.service.list_systems(DESIGNER) if s["id"] == system_id)

    def test_boards_are_counted_through_subsystems(self) -> None:
        publication = self.child()
        bus, version = self.parent()
        a = self.add(bus, version, "CNDH-A", publication["componentId"])
        self.add(bus, a.version, "CNDH-B", publication["componentId"], follow="pinned")
        listed = self.summary(bus)
        self.assertEqual((listed["instanceCount"], listed["subsystemCount"], listed["boardTotal"]), (0, 2, 8))
        self.assertEqual(self.service.document(DESIGNER, bus).body["system"]["boardTotal"], 8)
        self.assertEqual(self.summary(self.sid)["boardTotal"], 4)

    def test_the_last_snapshot_and_counts_of_this_version(self) -> None:
        self.assertIsNone(self.summary(self.sid)["lastSnapshot"])
        self.assertIsNone(self.summary(self.sid)["findingCounts"], "never built at this version")
        self.service.document(DESIGNER, self.sid)
        counts = self.summary(self.sid)["findingCounts"]
        self.assertEqual(set(counts) >= {"error", "warning", "info"}, True)
        self.snapshot("CDR")
        self.assertEqual(self.summary(self.sid)["lastSnapshot"]["name"], "CDR")
        self.service.update_system(DESIGNER, self.sid, self.version(), {"description": "moved on"})
        self.assertIsNone(self.summary(self.sid)["findingCounts"], "counts of an older version are not shown")
        self.assertIsNone(self.summary(self.sid)["git"])

    def test_deleting_a_system_deletes_its_counts(self) -> None:
        # No foreign key on purpose (it would make editors wait on readers), so no cascade either.
        body = self.service.create_system(DESIGNER, name="Short-lived", description="", folder_id=None).body
        self.service.document(DESIGNER, body["id"])
        count = "SELECT count(*) AS n FROM system_finding_counts WHERE system_id = %s"
        self.assertEqual(self.conn.execute(count, (body["id"],)).fetchone()["n"], 1)
        self.conn.commit()
        self.service.delete_system(DESIGNER, body["id"], body["version"])
        self.assertEqual(self.conn.execute(count, (body["id"],)).fetchone()["n"], 0)


if __name__ == "__main__":
    unittest.main()

"""SB2-45: stored harness nodes into the tree and the curves (CONTRACTS_P2 §17.9).

``placement_cases.json`` ``harnessNodes`` is shared with
``frontend/.../placement/harness-nodes.test.ts``.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from app.services.systems.placement import harness_curves, harness_nodes, harness_topology

CASES = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" / "placement_cases.json").read_text())
MM = CASES["tolerance"]["mm"]


def run(i: dict) -> dict:
    tree = harness_topology.topology(i["ends"], i["wires"], harness_nodes.breakouts(i["nodes"]))
    split = harness_nodes.segment_waypoints(tree, i["nodes"])
    return {"breakouts": harness_nodes.breakouts(i["nodes"]), "tree": tree, "split": split,
            "curves": harness_curves.harness_curves(i["posed"], tree, split["waypoints"], split["pinned"])}


class ReplayTest(unittest.TestCase):
    def test_every_case_replays(self) -> None:
        self.assertGreaterEqual(len(CASES["harnessNodes"]), 4)
        for c in CASES["harnessNodes"]:
            got, want = run(c["input"]), c["expected"]
            with self.subTest(case=c["name"]):
                self.assertEqual(got["breakouts"], want["breakouts"])
                self.assertEqual([s["id"] for s in got["tree"]["segments"]], [s["id"] for s in want["tree"]["segments"]])
                self.assertEqual(got["split"], want["split"])
                for a, b in zip(got["curves"], want["curves"]):
                    self.assertEqual(a["segmentId"], b["segmentId"])
                    self.assertAlmostEqual(a["lengthMm"], b["lengthMm"], delta=0.01)
                    self.assertEqual(a["tightBend"] is None, b["tightBend"] is None)


class RuleTest(unittest.TestCase):
    def by(self, name: str) -> dict:
        return next(c["expected"] for c in CASES["harnessNodes"] if c["name"].startswith(name))

    def test_reversed_waypoints_run_from_the_segment_start(self) -> None:
        split = self.by("two ends")["split"]
        self.assertEqual(split["waypoints"]["e1~e2"], [[40.0, 5.0, 40.0], [100.0, 25.0, 40.0]])

    def test_breakouts_chain_by_order(self) -> None:
        self.assertEqual([b["id"] for b in self.by("breakouts chain")["breakouts"]], ["b2", "b1"])

    def test_pinned_waypoint_stays_and_reports(self) -> None:
        pinned = next(c for c in self.by("breakouts chain")["curves"] if c["segmentId"] == "b2~b1")
        free = next(c for c in self.by("the same waypoint")["curves"] if c["segmentId"] == "b2~b1")
        self.assertIn([70.0, 30.0, 40.0], pinned["controlMm"])
        self.assertIsNotNone(pinned["tightBend"])
        self.assertNotIn([70.0, 30.0, 40.0], free["controlMm"])
        self.assertIsNone(free["tightBend"])

    def test_unused(self) -> None:
        self.assertEqual(self.by("a waypoint between")["split"]["unused"], ["x1"])


if __name__ == "__main__":
    unittest.main()

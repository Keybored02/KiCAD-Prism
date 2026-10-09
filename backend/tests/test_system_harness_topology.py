"""SB2-42: harness topology, breakouts and per-segment wire sets (CONTRACTS_P2 §17.7).

Goldens on the fixture's 3-end harness WH-001 (``placement_cases.json``
``harnessTopologies``), shared with ``frontend/.../placement/harness-topology.test.ts``.
Every case is replayed, and the rules are checked by hand.
"""

from __future__ import annotations

import json
import math
import unittest
from pathlib import Path

from app.services.systems.placement import harness_spec as spec
from app.services.systems.placement.harness_topology import topology

CASES = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" / "placement_cases.json").read_text())
MM = CASES["tolerance"]["mm"]


def run(spec_case: dict) -> dict:
    i = spec_case["input"]
    return topology(i["ends"], i["wires"], i["breakouts"])


def case(prefix: str) -> dict:
    return next(c for c in CASES["harnessTopologies"] if c["name"].startswith(prefix))


class ReplayTest(unittest.TestCase):
    def test_every_case_replays(self) -> None:
        self.assertGreaterEqual(len(CASES["harnessTopologies"]), 6)
        for spec_case in CASES["harnessTopologies"]:
            with self.subTest(case=spec_case["name"]):
                got, expected = run(spec_case), spec_case["expected"]
                self.assertEqual([(n["id"], n["kind"]) for n in got["nodes"]], [(n["id"], n["kind"]) for n in expected["nodes"]])
                for a, e in zip(got["nodes"], expected["nodes"]):
                    for x, y in zip(a["positionMm"], e["positionMm"]):
                        self.assertLessEqual(abs(x - y), MM)
                self.assertEqual([(s["id"], s["wires"], s["assumedGauge"]) for s in got["segments"]],
                                 [(s["id"], s["wires"], s["assumedGauge"]) for s in expected["segments"]])
                for a, e in zip(got["segments"], expected["segments"]):
                    self.assertAlmostEqual(a["diameterMm"], e["diameterMm"], delta=MM)
                self.assertEqual(got["unplaced"], expected["unplaced"])


class RuleTest(unittest.TestCase):
    def test_the_automatic_breakout_is_the_weighted_centroid_lifted(self) -> None:
        spec_case = case("WH-001")
        ends = spec_case["input"]["ends"]
        weights = {"e1": 3, "e2": 2, "e3": 1}  # wires touching each end: w1 w2 w3 / w1 w2 / w3
        centre = [sum(weights[e["id"]] * e["legMm"][k] for e in ends) / 6 for k in range(3)]
        mean = [sum(e["outward"][k] for e in ends) / 3 for k in range(3)]
        size = math.sqrt(sum(c * c for c in mean))
        lifted = [centre[k] + spec.BREAKOUT_LIFT_MM * mean[k] / size for k in range(3)]
        [auto] = [n for n in run(spec_case)["nodes"] if n["kind"] == "breakout"]
        for got, want in zip(auto["positionMm"], lifted):
            self.assertAlmostEqual(got, want, delta=1e-6)

    def test_each_segment_carries_the_wires_that_cross_it(self) -> None:
        segments = {s["id"]: s for s in run(case("WH-001"))["segments"]}
        self.assertEqual(segments["e1~auto"]["wires"], ["w1", "w2", "w3"], "the splice's trunk carries all three")
        self.assertEqual(segments["e3~auto"]["wires"], ["w3"])
        user = {s["id"]: s["wires"] for s in run(case("user breakouts"))["segments"]}
        self.assertEqual(user["e3~b1"], ["w3"], "e3 is assigned to b1 although b2 is nearer")
        self.assertEqual(user["b1~b2"], ["w1", "w2"], "w3 left at b1")

    def test_bundle_diameter(self) -> None:
        segments = {s["id"]: s for s in run(case("given gauges"))["segments"]}
        od20, od22 = spec.WIRE_OD_MM["20"], spec.WIRE_OD_MM["22"]
        self.assertAlmostEqual(segments["e1~auto"]["diameterMm"],
                               spec.PACKING_FACTOR * math.sqrt(2 * od20 ** 2 + od22 ** 2), delta=1e-6)
        self.assertFalse(segments["e1~auto"]["assumedGauge"])
        assumed = {s["id"]: s for s in run(case("WH-001"))["segments"]}
        self.assertAlmostEqual(assumed["e3~auto"]["diameterMm"], spec.PACKING_FACTOR * spec.WIRE_OD_MM["24"], delta=1e-6)
        self.assertTrue(assumed["e3~auto"]["assumedGauge"])
        self.assertEqual({s["diameterMm"] for s in run(case("no wires"))["segments"]}, {0.0})

    def test_two_ends_make_one_run_and_unplaced_wires_are_listed(self) -> None:
        self.assertEqual([s["id"] for s in run(case("two ends"))["segments"]], ["e1~e2"])
        self.assertEqual(run(case("an end without a pose"))["unplaced"], ["w3"])


if __name__ == "__main__":
    unittest.main()

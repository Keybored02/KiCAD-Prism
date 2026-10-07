"""SB2-43: harness curves, bend radius and arc length (CONTRACTS_P2 §17.8).

``placement_cases.json`` ``harnessCurves`` is shared with
``frontend/.../placement/harness-curves.test.ts``. Property tests check the
rules on seeded random polygons: the minimum radius is either respected or
reported, fixed points never move, and the curve is never shorter than its chord.
"""

from __future__ import annotations

import json
import math
import random
import unittest
from pathlib import Path

from app.services.systems.placement import harness_spec as spec
from app.services.systems.placement.harness_curves import curve, harness_curves, tightest

CASES = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" / "placement_cases.json").read_text())
MM = CASES["tolerance"]["mm"]


def run(c: dict):
    i = c["input"]
    if c["op"] == "curve":
        return [curve(i["points"], i["movable"], i["diameterMm"])]
    return harness_curves(i["ends"], i["tree"], i["waypoints"])


class ReplayTest(unittest.TestCase):
    def test_every_case_replays(self) -> None:
        self.assertGreaterEqual(len(CASES["harnessCurves"]), 6)
        for c in CASES["harnessCurves"]:
            expected = c["expected"] if isinstance(c["expected"], list) else [c["expected"]]
            for got, want in zip(run(c), expected):
                with self.subTest(case=c["name"], segment=want.get("segmentId")):
                    self.assertEqual(len(got["samplesMm"]), len(want["samplesMm"]))
                    for a, b in zip(got["samplesMm"], want["samplesMm"]):
                        self.assertLessEqual(max(abs(x - y) for x, y in zip(a, b)), MM)
                    self.assertAlmostEqual(got["lengthMm"], want["lengthMm"], delta=0.01)
                    self.assertEqual(got["tightBend"] is None, want["tightBend"] is None)


class RuleTest(unittest.TestCase):
    def test_named_cases(self) -> None:
        by = {c["name"]: c["expected"] for c in CASES["harnessCurves"]}
        straight = by["facing ends, a waypoint on the line: straight"]
        self.assertEqual((straight["lengthMm"], straight["minRadiusMm"], straight["tightBend"]), (200.0, None, None))
        gentle = by["a gentle waypoint is left alone"]
        self.assertEqual(gentle["controlMm"][4], [100.0, 15.0, 0.0])
        pulled = by["a sharp waypoint is pulled in until the bend clears 6 d"]
        self.assertEqual(pulled["controlMm"][4], [100.0, 30.0, 0.0], "halfway to the neighbours' midpoint, once")
        self.assertGreaterEqual(pulled["minRadiusMm"], 6 * 1.4)
        for segment in by["WH-001 without waypoints: each leg turns tighter than 6 d (reported)"]:
            self.assertIsNotNone(segment["tightBend"])
            self.assertLess(segment["tightBend"]["radiusMm"], segment["minRadiusAllowedMm"])

    def test_the_minimum_radius_is_respected_or_reported(self) -> None:
        rng = random.Random(20261008)
        for trial in range(60):
            points = [[0.0, 0.0, 0.0], [5.0, 0.0, 0.0], [10.0, 0.0, 0.0], [15.0, 0.0, 0.0]]
            waypoints = [[rng.uniform(20, 180), rng.uniform(-60, 60), rng.uniform(-60, 60)] for _ in range(rng.randint(1, 3))]
            waypoints.sort()
            tail = [[200.0, 0.0, 0.0], [195.0, 0.0, 0.0], [190.0, 0.0, 0.0], [185.0, 0.0, 0.0]][::-1]
            control = points + waypoints + tail
            movable = [False] * 4 + [True] * len(waypoints) + [False] * 4
            diameter = rng.uniform(1.0, 4.0)
            with self.subTest(trial=trial):
                got = curve(control, movable, diameter)
                allowed = spec.MIN_BEND_RADIUS_FACTOR * diameter
                radius, _ = tightest(got["samplesMm"])
                if got["tightBend"] is None:
                    self.assertGreaterEqual(radius, allowed - 1e-6, "no report means every bend clears 6 d")
                else:
                    self.assertLess(got["tightBend"]["radiusMm"], allowed)
                    self.assertAlmostEqual(got["tightBend"]["radiusMm"], radius, delta=1e-6)
                fixed = [i for i, free in enumerate(movable) if not free]
                for i in fixed:
                    self.assertEqual(got["controlMm"][i], [float(c) for c in control[i]], "fixed points never move")
                self.assertGreaterEqual(got["lengthMm"], math.dist(control[0], control[-1]) - 1e-6)
                for a, b in zip(got["samplesMm"], got["samplesMm"][1:]):
                    self.assertGreater(math.dist(a, b), 0.0)

    def test_samples_follow_the_chord_error(self) -> None:
        got = by_name("a sharp waypoint is pulled in until the bend clears 6 d")
        # Every sample lies on the curve through the relaxed control points; the run starts and ends on its ends.
        self.assertEqual(got["samplesMm"][0], [0.0, 0.0, 0.0])
        self.assertEqual(got["samplesMm"][-1], [200.0, 0.0, 0.0])


def by_name(name: str) -> dict:
    return next(c["expected"] for c in CASES["harnessCurves"] if c["name"] == name)


if __name__ == "__main__":
    unittest.main()

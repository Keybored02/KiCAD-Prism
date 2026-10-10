"""SB2-46: harness routes, lengths and board collisions (CONTRACTS_P2 §17.10).

``placement_cases.json`` ``harnessChecks`` is shared with
``frontend/.../placement/harness-checks.test.ts``.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from app.services.systems.placement import harness_checks, harness_route

CASES = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" / "placement_cases.json").read_text())


def harness_case(name: str) -> dict:
    return next(c for c in CASES["harnessChecks"] if c["name"].startswith(name))


class ReplayTest(unittest.TestCase):
    def test_every_case_replays(self) -> None:
        self.assertGreaterEqual(len(CASES["harnessChecks"]), 6)
        for c in CASES["harnessChecks"]:
            i, want = c["input"], c["expected"]
            with self.subTest(case=c["name"]):
                if c["op"] == "span":
                    self.assertEqual(list(harness_checks.span_box_distance(i["a"], i["b"], i["lo"], i["hi"])), want)
                    continue
                routed = harness_route.route(i["harness"], i["worlds"].get)
                self.assertEqual([c["segmentId"] for c in routed["curves"]], want["segments"])
                for got, expected in zip(routed["curves"], want["lengthsMm"]):
                    self.assertAlmostEqual(got["lengthMm"], expected, delta=0.01)
                self.assertEqual(harness_checks.collisions(routed, i["boards"]), want["collisions"])
                lengths = harness_checks.lengths(routed, i["allowancePct"])
                self.assertAlmostEqual(lengths["estimatedMm"], want["lengths"]["estimatedMm"], delta=0.01)
                self.assertEqual(sorted(lengths["wires"]), sorted(want["lengths"]["wires"]))


class RuleTest(unittest.TestCase):
    def test_span_distances(self) -> None:
        by = {c["name"]: c["expected"][0] for c in CASES["harnessChecks"] if c["op"] == "span"}
        self.assertEqual(by["a span through the box"], 0.0)
        self.assertAlmostEqual(by["a span passing above the box"], 4.0, places=9)
        self.assertAlmostEqual(by["a span past a corner"], 3.577708764, places=6)
        self.assertEqual(by["a span ending short of the box"], 3.0)

    def test_the_standing_board_is_hit_and_the_mated_boards_are_not(self) -> None:
        hits = harness_case("WH-style")["expected"]["collisions"]
        self.assertEqual([(h["segmentId"], h["board"]) for h in hits], [("e2~auto", "/wall"), ("e3~auto", "/wall")])
        self.assertTrue(all(h["distanceMm"] < h["radiusMm"] and h["spans"] for h in hits))

    def test_lengths_add_end_depths_and_the_allowance(self) -> None:
        default, own = harness_case("WH-style")["expected"], harness_case("the same with")["expected"]
        bundle = default["lengths"]["bundleMm"]
        self.assertAlmostEqual(bundle, sum(default["lengthsMm"]) + 3 * 8.0, delta=1e-6)  # three 8 mm housings
        self.assertAlmostEqual(default["lengths"]["estimatedMm"], bundle * 1.10, places=6)
        self.assertAlmostEqual(own["lengths"]["estimatedMm"], bundle * 1.25, places=6)
        w1 = default["lengths"]["wires"]["w1"]["lengthMm"]
        self.assertAlmostEqual(w1, default["lengthsMm"][0] + default["lengthsMm"][1] + 16.0, delta=1e-6)

    def test_a_board_near_an_end_is_exempt_for_the_first_boot(self) -> None:
        c = harness_case("WH-style")["input"]
        routed = harness_route.route(c["harness"], c["worlds"].get)
        # Grown 30 mm up, e1's own board swallows the start of its leg: only spans past the boot count.
        own = next(b for b in c["boards"] if b["id"] == "/a")
        grown = {**own, "minMm": [own["minMm"][0], -20.0, own["minMm"][2]],
                 "maxMm": [own["maxMm"][0], own["maxMm"][1], 30.0]}
        hit = harness_checks.collisions(routed, [grown])
        self.assertTrue(hit)
        first = routed["curves"][0]["samplesMm"]
        exempt = harness_checks._exempt(first, True)
        self.assertGreater(exempt, 0)
        self.assertTrue(all(i >= exempt for i in hit[0]["spans"]))


if __name__ == "__main__":
    unittest.main()

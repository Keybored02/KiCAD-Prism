"""SB2-12: mating-frame inference and connector frames (CONTRACTS_P2 §14.4, §15.1).

``placement_cases.json`` is shared with the TypeScript twin
(``frontend/src/features/system-builder/placement/frames.test.ts``). Here every
case is replayed, and its meaning is asserted by hand: which way the mating
axis and pad 1 point, and how sure the inference is.
"""

from __future__ import annotations

import json
import math
import unittest
from pathlib import Path

from app.services.systems.placement.frames import connector_frame, infer, quaternion

CASES = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" / "placement_cases.json").read_text())
MM, UNIT = CASES["tolerance"]["mm"], CASES["tolerance"]["unit"]


def case(name: str) -> dict:
    return next(c for c in CASES["frames"] if c["name"] == name)


class GoldenReplayTest(unittest.TestCase):
    def assert_close(self, actual, expected, tolerance: float, label: str) -> None:
        self.assertEqual(len(actual), len(expected), label)
        for a, e in zip(actual, expected):
            self.assertLessEqual(abs(a - e), tolerance, f"{label}: {actual} != {expected}")

    def test_every_case_replays(self) -> None:
        self.assertGreaterEqual(len(CASES["frames"]), 14)
        for spec in CASES["frames"]:
            with self.subTest(case=spec["name"]):
                self.assertEqual(infer(spec["geometry"]), spec["expected"]["inference"])
                frame = connector_frame(spec["geometry"], spec["thicknessMm"], spec["stored"])
                expected = spec["expected"]["frame"]
                if expected is None:
                    self.assertIsNone(frame)
                    continue
                self.assertEqual((frame["axis"], frame["quarterTurns"]), (expected["axis"], expected["quarterTurns"]))
                self.assert_close(frame["originMm"], expected["originMm"], MM, "origin")
                for key in ("xAxis", "yAxis", "zAxis", "rotation"):
                    self.assert_close(frame[key], expected[key], UNIT, key)


class MeaningTest(unittest.TestCase):
    def frame(self, name: str) -> dict:
        spec = case(name)
        return connector_frame(spec["geometry"], spec["thicknessMm"], spec["stored"])

    def test_vertical_headers_mate_along_the_board_normal_with_pad_one_at_minus_x(self) -> None:
        top = self.frame("vertical header, top")
        self.assertEqual(infer(case("vertical header, top")["geometry"])["confidence"], "high")
        self.assertEqual(top["originMm"], [50.0, -13.81, 0.8])  # pad centroid on the front surface
        self.assertEqual([round(c, 9) + 0.0 for c in top["zAxis"]], [0.0, 0.0, 1.0])
        self.assertEqual([round(c, 9) + 0.0 for c in top["xAxis"]], [0.0, -1.0, 0.0])  # pad 1 is at y = -10, above
        bottom = self.frame("vertical header, bottom, 90°")
        self.assertEqual((bottom["axis"], bottom["originMm"][2]), ("bottom", -0.8))
        self.assertEqual([round(c, 9) + 0.0 for c in bottom["zAxis"]], [0.0, 0.0, -1.0])

    def test_right_angle_headers_mate_toward_the_body_in_the_footprint_frame(self) -> None:
        self.assertEqual([round(c, 9) + 0.0 for c in self.frame("right-angle header, top")["zAxis"]], [1.0, 0.0, 0.0])
        turned = self.frame("right-angle header, top, 90°")
        self.assertEqual(turned["axis"], "+x")  # footprint frame: unchanged by rotating the footprint
        self.assertEqual([round(c, 9) + 0.0 for c in turned["zAxis"]], [0.0, 1.0, 0.0])
        mirrored = self.frame("right-angle header, bottom, 180°")
        self.assertEqual(mirrored["axis"], "-x")  # the back side stores the footprint mirrored
        self.assertEqual([round(c, 9) + 0.0 for c in mirrored["zAxis"]], [1.0, 0.0, 0.0])
        self.assertEqual(infer(case("JST PH side entry, top, -90°")["geometry"])["axis"], "-y")

    def test_mezzanines_without_a_keyword_infer_at_medium(self) -> None:
        for name, side in (("DF40 mezzanine without a keyword, top", "top"),
                           ("DF40 mezzanine without a keyword, bottom, 45°", "bottom")):
            self.assertEqual(infer(case(name)["geometry"]),
                             {"axis": side, "confidence": "medium", "reasons": ["body_over_pads"]})

    def test_square_arrays_use_the_footprint_x_axis(self) -> None:
        x = self.frame("2x2 header (square array), top, 30°")["xAxis"]
        self.assertAlmostEqual(x[0], math.cos(math.radians(30)), places=9)
        self.assertAlmostEqual(x[1], math.sin(math.radians(30)), places=9)

    def test_uncertain_footprints_need_details_and_overrides_still_work(self) -> None:
        for name, reason in (("no courtyard and no keyword", "no_courtyard"),
                             ("vertical name on a right-angle body", "name_conflicts_geometry"),
                             ("one pad", "too_few_pads")):
            with self.subTest(case=name):
                inferred = infer(case(name)["geometry"])
                self.assertEqual((inferred["axis"], inferred["confidence"]), (None, "low"))
                self.assertIn(reason, inferred["reasons"])
                self.assertIsNone(connector_frame(case(name)["geometry"], 1.6))
        overridden = self.frame("override on an ambiguous footprint")
        self.assertEqual((overridden["axis"], overridden["quarterTurns"]), ("top", 1))

    def test_quarter_turns_rotate_about_the_mating_axis(self) -> None:
        spec = case("right-angle header, top")
        base = connector_frame(spec["geometry"], 1.6)
        for turns in range(4):
            turned = connector_frame(spec["geometry"], 1.6, {"axis": "+x", "quarterTurns": turns})
            self.assertEqual(turned["zAxis"], base["zAxis"])
            angle = math.degrees(math.atan2(sum(a * b for a, b in zip(turned["xAxis"], base["yAxis"])),
                                            sum(a * b for a, b in zip(turned["xAxis"], base["xAxis"]))))
            self.assertAlmostEqual(angle % 360, 90.0 * turns, places=6)

    def test_quaternions_are_unit_and_canonical(self) -> None:
        self.assertEqual(quaternion([1, 0, 0], [0, 1, 0], [0, 0, 1]), [0.0, 0.0, 0.0, 1.0])
        flipped = quaternion([1, 0, 0], [0, -1, 0], [0, 0, -1])  # 180° about x: w = 0, x leads
        self.assertEqual([round(c, 12) + 0.0 for c in flipped], [1.0, 0.0, 0.0, 0.0])
        for spec in CASES["frames"]:
            frame = spec["expected"]["frame"]
            if frame:
                self.assertAlmostEqual(sum(c * c for c in frame["rotation"]), 1.0, places=12)
                self.assertGreaterEqual(frame["rotation"][3], 0.0)


if __name__ == "__main__":
    unittest.main()

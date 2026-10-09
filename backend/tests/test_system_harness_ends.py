"""SB2-41: harness end poses and exit legs (CONTRACTS_P2 §17.6).

``placement_cases.json`` ``harnessEnds`` is shared with
``frontend/.../placement/harness-ends.test.ts``; every case is replayed and its
meaning checked: the leg is one boot along the outward axis from the exit, the
outward axis is the connector's mating axis, the exit sits the housing depth
beyond the mating plane, and a connector without a frame has no end.
"""

from __future__ import annotations

import json
import math
import unittest
from pathlib import Path

from app.services.systems.placement import harness_spec as spec
from app.services.systems.placement.frames import connector_frame
from app.services.systems.placement.harness_ends import alignment_pose, board_end
from app.services.systems.placement.poses import compose, rotate

CASES = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" / "placement_cases.json").read_text())
MM, UNIT = CASES["tolerance"]["mm"], CASES["tolerance"]["unit"]
MEANING = 1e-6


def run(i: dict):
    return board_end(i["boardWorld"], i["geometry"], i["thicknessMm"], i["stored"], i["quarterTurns"], i["housing"],
                     i["bodyMm"])


class HarnessEndTest(unittest.TestCase):
    def close(self, actual, expected, tolerance, label) -> None:
        for a, e in zip(actual, expected):
            self.assertLessEqual(abs(a - e), tolerance, f"{label}: {actual} != {expected}")

    def test_every_case_replays(self) -> None:
        self.assertGreaterEqual(len(CASES["harnessEnds"]), 8)
        for spec_case in CASES["harnessEnds"]:
            with self.subTest(case=spec_case["name"]):
                got, expected = run(spec_case["input"]), spec_case["expected"]
                if expected is None:
                    self.assertIsNone(got)
                    continue
                for key in ("exitMm", "legMm"):
                    self.close(got[key], expected[key], MM, key)
                self.close(got["outward"], expected["outward"], UNIT, "outward")
                self.close(got["pose"]["rotation"], expected["pose"]["rotation"], UNIT, "rotation")
                self.assertEqual((got["modeled"], round(got["depthMm"], 6), round(got["matingPlaneMm"], 6)),
                                 (expected["modeled"], round(expected["depthMm"], 6), round(expected["matingPlaneMm"], 6)))

    def test_every_end_means_what_it_says(self) -> None:
        for spec_case in CASES["harnessEnds"]:
            i, got = spec_case["input"], spec_case["expected"]
            if got is None:
                continue
            with self.subTest(case=spec_case["name"]):
                frame = connector_frame(i["geometry"], i["thicknessMm"], i["stored"])
                world = compose(i["boardWorld"], {"translationMm": frame["originMm"], "rotation": frame["rotation"]})
                axis = rotate(world["rotation"], [0.0, 0.0, 1.0])
                self.close(got["outward"], axis, MEANING, "outward is the mating axis")
                self.close([got["legMm"][k] - got["exitMm"][k] for k in range(3)], [spec.BOOT_MM * a for a in axis],
                           MEANING, "leg = exit + boot")
                along = sum((got["exitMm"][k] - world["translationMm"][k]) * axis[k] for k in range(3))
                self.assertAlmostEqual(along, got["matingPlaneMm"] + got["depthMm"], delta=MEANING)
                if not i["housing"]:
                    self.assertEqual((got["depthMm"], got["modeled"]), (spec.HOUSING_DEPTH_MM, False))

    def test_named_cases(self) -> None:
        by = {c["name"]: c["expected"] for c in CASES["harnessEnds"]}
        self.assertEqual(by["connector body bounds set the mating plane"]["matingPlaneMm"], 8.5)
        self.assertEqual(by["a housing model aligned by a quarter turn sets the depth"]["depthMm"], 14.0)
        self.assertEqual(by["a scaled, flipped housing model"]["depthMm"], 0.0, "inside out: exit on the mating face")
        self.assertIsNone(by["no frame: details needed"])

    def test_alignment_rotates_z_then_y_then_x(self) -> None:
        pose, scale = alignment_pose({"offsetMm": [1, 2, 3], "rotationDeg": [90, 0, 90], "scale": 2})
        # Rx first: x stays x; then Rz: x → y.
        self.close(rotate(pose["rotation"], [1.0, 0.0, 0.0]), [0.0, 1.0, 0.0], 1e-9, "x")
        self.close(rotate(pose["rotation"], [0.0, 1.0, 0.0]), [0.0, 0.0, 1.0], 1e-9, "y")
        self.assertEqual((pose["translationMm"], scale), ([1.0, 2.0, 3.0], 2.0))
        self.assertTrue(math.isclose(sum(c * c for c in pose["rotation"]), 1.0))


if __name__ == "__main__":
    unittest.main()

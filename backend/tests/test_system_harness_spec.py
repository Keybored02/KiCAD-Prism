"""SB2-40: the frozen harness geometry numbers (CONTRACTS_P2 §17.5, D-P2-35)."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from app.services.systems.placement import harness_spec as spec

GOLDEN = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" / "harness_spec.json").read_text())


class HarnessSpecTest(unittest.TestCase):
    def test_the_library_equals_the_frozen_file(self) -> None:
        names = {"bootMm": "BOOT_MM", "housingDepthMm": "HOUSING_DEPTH_MM", "breakoutLiftMm": "BREAKOUT_LIFT_MM",
                 "chordErrorMm": "CHORD_ERROR_MM", "catmullRomAlpha": "CATMULL_ROM_ALPHA",
                 "minBendRadiusFactor": "MIN_BEND_RADIUS_FACTOR", "bendRelaxIterations": "BEND_RELAX_ITERATIONS",
                 "packingFactor": "PACKING_FACTOR", "ringSegments": "RING_SEGMENTS", "breakoutBlendMm": "BREAKOUT_BLEND_MM",
                 "lengthAllowance": "LENGTH_ALLOWANCE", "lengthMismatchTolerance": "LENGTH_MISMATCH_TOLERANCE",
                 "boardCollisionMarginMm": "BOARD_COLLISION_MARGIN_MM", "defaultGaugeAwg": "DEFAULT_GAUGE_AWG"}
        for key, name in names.items():
            self.assertEqual(getattr(spec, name), GOLDEN[key], key)
        self.assertEqual(spec.WIRE_OD_MM, GOLDEN["wireSpec"]["outsideDiameterMm"])

    def test_the_table_is_the_nasa_one_in_mm(self) -> None:
        inches = {"24": 0.045, "20": 0.060, "16": 0.079, "00": 0.546}  # NEPP AS22759/16, spot-checked
        for gauge, value in inches.items():
            self.assertAlmostEqual(spec.WIRE_OD_MM[gauge], value * 25.4, places=9)
        ods = [spec.WIRE_OD_MM[g] for g in ("24", "22", "20", "18", "16", "14", "12", "10", "8", "6", "4", "2", "1", "0", "00")]
        self.assertEqual(ods, sorted(ods), "thicker gauge, bigger wire")

    def test_an_unknown_or_missing_gauge_is_assumed_24(self) -> None:
        self.assertEqual(spec.wire_od_mm("22"), (1.3208, False))
        self.assertEqual(spec.wire_od_mm(20), (1.524, False))
        self.assertEqual(spec.wire_od_mm("22 AWG"), (1.3208, False))
        for gauge in (None, "", "26", "28"):
            self.assertEqual(spec.wire_od_mm(gauge), (1.143, True), gauge)


if __name__ == "__main__":
    unittest.main()

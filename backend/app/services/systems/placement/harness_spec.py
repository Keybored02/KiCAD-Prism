"""Harness geometry numbers, frozen in SB2-40 (CONTRACTS_P2 §17.5, D-P2-35).

The TypeScript twin is ``frontend/.../placement/harness-spec.ts``; both equal
``backend/tests/fixtures/system_builder/harness_spec.json``.
"""

from __future__ import annotations

from typing import Optional

BOOT_MM = 10.0  # straight exit leg along the end's outward axis
HOUSING_DEPTH_MM = 8.0  # mating face to cable exit when the housing has no model
BREAKOUT_LIFT_MM = 10.0  # an N-end breakout rises this far along the mean outward normal
CHORD_ERROR_MM = 0.2  # adaptive sampling of the centripetal Catmull-Rom curve
CATMULL_ROM_ALPHA = 0.5
MIN_BEND_RADIUS_FACTOR = 6.0  # r_min = factor × bundle diameter
BEND_RELAX_ITERATIONS = 8
PACKING_FACTOR = 1.2  # bundle d = k · √Σ dᵢ²
RING_SEGMENTS = 12
BREAKOUT_BLEND_MM = 5.0
LENGTH_ALLOWANCE = 0.10  # estimated total = arc length × (1 + allowance)
LENGTH_MISMATCH_TOLERANCE = 0.15  # SYS-V13 when the cut length differs by more
BOARD_COLLISION_MARGIN_MM = 1.0
DEFAULT_GAUGE_AWG = "24"

# M22759/16 finished wire diameter, nominal (NASA NEPP AS22759/16 table, inches × 25.4).
WIRE_OD_MM = {
    "24": 1.143, "22": 1.3208, "20": 1.524, "18": 1.8034, "16": 2.0066, "14": 2.3622, "12": 2.8956,
    "10": 3.5306, "8": 5.0546, "6": 6.35, "4": 7.9248, "2": 9.8552, "1": 10.9474, "0": 12.1666, "00": 13.8684,
}


def wire_od_mm(gauge: Optional[object]) -> tuple[float, bool]:
    """A wire's outside diameter and whether it is assumed: no gauge, or one M22759/16 doesn't make,
    takes the default gauge's diameter (§17.5)."""
    key = None if gauge is None else str(gauge).strip().upper().removesuffix("AWG").strip()
    if key in WIRE_OD_MM:
        return WIRE_OD_MM[key], False
    return WIRE_OD_MM[DEFAULT_GAUGE_AWG], True

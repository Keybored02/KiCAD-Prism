"""SB2-48b: connectors placed on a module's faces (CONTRACTS_P2 §3.6, D-P2-40).

``placement_cases.json`` ``modulePorts`` is shared with
``frontend/.../placement/module-ports.test.ts``; every case is replayed and its
meaning checked: the face frame is right-handed with z the normal, the
footprint pose puts the part's mating frame exactly on the face frame (so the
mating axis points out of the face and pad 1 lies on the face's −x side), and
bad placements are refused.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from app.services.systems.placement.frames import _cross, _normalize
from app.services.systems.placement.mate import _frame_pose
from app.services.systems.placement.module_ports import face_frame, footprint_pose, part_frame, placement_from
from app.services.systems.placement.poses import compose, rotate

CASES = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" / "placement_cases.json").read_text())
MM, UNIT = CASES["tolerance"]["mm"], CASES["tolerance"]["unit"]
MEANING = 1e-6


class ModulePortTest(unittest.TestCase):
    def close(self, actual, expected, tolerance, label) -> None:
        for a, e in zip(actual, expected):
            self.assertLessEqual(abs(a - e), tolerance, f"{label}: {actual} != {expected}")

    def test_every_case_replays(self) -> None:
        self.assertGreaterEqual(len(CASES["modulePorts"]), 8)
        for case in CASES["modulePorts"]:
            with self.subTest(case=case["name"]):
                placement, geometry = case["input"]["placement"], case["input"]["geometry"]
                face, pose = face_frame(placement), footprint_pose(placement, geometry)
                for key in ("originMm", "xAxis", "yAxis", "zAxis", "rotation"):
                    self.close(face[key], case["expected"]["face"][key], MM if key == "originMm" else UNIT, key)
                self.close(pose["translationMm"], case["expected"]["footprintPose"]["translationMm"], MM, "pose")
                self.close(pose["rotation"], case["expected"]["footprintPose"]["rotation"], UNIT, "pose rotation")

    def test_the_part_frame_lands_on_the_face(self) -> None:
        for case in CASES["modulePorts"]:
            with self.subTest(case=case["name"]):
                placement, geometry = case["input"]["placement"], case["input"]["geometry"]
                face = face_frame(placement)
                self.close(face["zAxis"], _normalize(placement["normal"]), MEANING, "z is the normal")
                self.close(_cross(face["zAxis"], face["xAxis"]), face["yAxis"], MEANING, "right-handed")
                frame = part_frame(geometry, placement["axis"])
                placed = compose(footprint_pose(placement, geometry), _frame_pose(frame))
                self.close(placed["translationMm"], face["originMm"], MEANING, "origin on the face")
                self.close(rotate(placed["rotation"], [0, 0, 1]), face["zAxis"], MEANING, "mating axis out of the face")
                pad_one = next(p for p in geometry["pads"] if p["pad"] == "1")["positionMm"]
                in_module = rotate(footprint_pose(placement, geometry)["rotation"], [pad_one[0], pad_one[1], 0.0])
                in_module = [a + b for a, b in zip(in_module, footprint_pose(placement, geometry)["translationMm"])]
                offset = [a - b for a, b in zip(in_module, face["originMm"])]
                self.assertLess(sum(a * b for a, b in zip(offset, face["xAxis"])), MEANING, "pad 1 on −x")

    def test_quarter_turns_rotate_x_into_y(self) -> None:
        base = placement_from({"originMm": [0, 0, 0], "normal": [0, 0, 1], "quarterTurns": 0})
        turned = face_frame(dict(base, quarterTurns=1))
        self.close(turned["xAxis"], face_frame(base)["yAxis"], MEANING, "x → y")

    def test_bad_placements_are_refused(self) -> None:
        good = {"originMm": [0, 0, 0], "normal": [0, 0, 2], "quarterTurns": 0}
        self.assertEqual(placement_from(good)["normal"], [0.0, 0.0, 1.0])
        for bad, message in (
            (dict(good, normal=[0, 0, 0]), "non-zero"),
            (dict(good, originMm=[0, 0]), "3 numbers"),
            (dict(good, quarterTurns=4), "quarterTurns"),
            (dict(good, quarterTurns=True), "quarterTurns"),
            (dict(good, axis="sideways"), "axis"),
            (dict(good, originMm=[float("nan"), 0, 0]), "finite"),
        ):
            with self.subTest(message=message), self.assertRaisesRegex(ValueError, message):
                placement_from(bad)

    def test_a_footprint_without_pads_has_no_pose(self) -> None:
        placement = placement_from({"originMm": [0, 0, 0], "normal": [0, 0, 1], "quarterTurns": 0})
        self.assertIsNone(footprint_pose(placement, {"pads": []}))


if __name__ == "__main__":
    unittest.main()

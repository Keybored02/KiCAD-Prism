"""SB2-11: extractor v6 connector geometry (CONTRACTS_P2 §14.2, §14.6).

Positions are checked against KiCad 10.0.6's own exports recorded under
``fixtures/system_builder/p2/evidence/geometry`` (``p2/geometry_evidence.py``):
the position file (page origin, y up: the board frame) and IPC-D-356 (every
pad centre, 0.0001 in from the aux origin). The transform itself is checked
by hand on rotated and bottom-side footprints.
"""

from __future__ import annotations

import csv
import re
import unittest
from pathlib import Path
from types import SimpleNamespace

from test_system_interface_extractor import extract

from app.services.systems.interface_extractor import (
    EXTRACTOR_VERSION,
    _footprint_geometry,
    interface_digest,
)

EVIDENCE = Path(__file__).resolve().parent / "fixtures" / "system_builder" / "p2" / "evidence" / "geometry"
SOURCES = Path(__file__).resolve().parent / "fixtures" / "system_builder" / "sources"
D356_UNIT_MM = 0.0001 * 25.4


def _aux_origin(board: str, step: str) -> tuple[float, float]:
    text = (SOURCES / board / step / f"{board}.kicad_pcb").read_text()
    found = re.search(r"\(aux_axis_origin ([-\d.]+) ([-\d.]+)\)", text)
    return (float(found.group(1)), float(found.group(2))) if found else (0.0, 0.0)


class EvidenceTest(unittest.TestCase):
    def boards(self) -> list[tuple[str, str]]:
        found = sorted(tuple(p.relative_to(EVIDENCE).parts) for p in EVIDENCE.glob("*/*") if p.is_dir())
        self.assertEqual(found, [("mini_obc", "F0"), ("mini_power", "F0")])
        return found

    def test_footprint_poses_match_the_position_file(self) -> None:
        for board, step in self.boards():
            payload = extract(f"{board}/{step}")
            by_ref = {c["reference"]: c for c in payload["components"]}
            checked = 0
            for row in csv.DictReader((EVIDENCE / board / step / "positions.csv").open()):
                component = by_ref.get(row["Ref"])
                if component is None:
                    continue  # no electrical pins in the schematic
                geometry = component["geometry"]
                with self.subTest(board=board, reference=row["Ref"]):
                    self.assertAlmostEqual(geometry["positionMm"][0], float(row["PosX"]), places=4)
                    self.assertAlmostEqual(geometry["positionMm"][1], float(row["PosY"]), places=4)
                    self.assertAlmostEqual(geometry["rotationDeg"], float(row["Rot"]), places=4)
                    self.assertEqual(geometry["side"], row["Side"])
                    self.assertEqual(geometry["footprintName"], row["Package"])
                checked += 1
            self.assertGreaterEqual(checked, 3, board)

    def test_pad_centres_match_ipc_d356(self) -> None:
        for board, step in self.boards():
            payload = extract(f"{board}/{step}")
            aux_x, aux_y = _aux_origin(board, step)
            pads = {(c["reference"], p["pad"]): p["positionMm"]
                    for c in payload["components"] if c["geometry"] for p in c["geometry"]["pads"]}
            checked = 0
            for line in (EVIDENCE / board / step / "pads.d356").read_text().splitlines():
                if line[:3] not in ("317", "327"):
                    continue
                key = (line[20:26].strip(), line[27:31].strip())
                if key not in pads:
                    continue
                x, y = (int(v) * D356_UNIT_MM for v in re.search(r"X([+-]\d{6})Y([+-]\d{6})", line).groups())
                with self.subTest(board=board, pad=key):
                    # d356 prints 0.0001 in (0.00254 mm); the extractor keeps 1e-4 mm.
                    self.assertLess(abs(pads[key][0] - (x + aux_x)), 0.0026)
                    self.assertLess(abs(pads[key][1] - (y - aux_y)), 0.0026)
                checked += 1
            self.assertGreaterEqual(checked, 8, board)

    def test_thickness_and_boardless_projects(self) -> None:
        self.assertGreaterEqual(int(EXTRACTOR_VERSION), 6)  # geometry arrived in v6
        self.assertAlmostEqual(extract("mini_obc/F0")["boardThicknessMm"], 1.6)
        payload = extract("mini_payload/F0")
        self.assertIsNone(payload["boardThicknessMm"])
        self.assertTrue(all(c["geometry"] is None for c in payload["components"]))


def _pad(number: str, x: float, y: float, kind: str = "THRU_HOLE") -> SimpleNamespace:
    return SimpleNamespace(number=number, at_x=x, at_y=y, size_x=1.7, size_y=1.7,
                           shape=SimpleNamespace(name="RECT"), pad_type=SimpleNamespace(name=kind))


def _line(layer: str, x0: float, y0: float, x1: float, y1: float) -> object:
    return type("FpLine", (), {"layer": layer, "start_x": x0, "start_y": y0, "end_x": x1, "end_y": y1})()


def _model(path: str, hidden: bool = False) -> SimpleNamespace:
    sexp = ["model", path] + ([["hide", "yes"]] if hidden else [])
    return SimpleNamespace(path=path, offset=(0.0, 0.0, 0.2), rotate=(-90.0, 0.0, 0.0), scale=(1.0, 1.0, 1.0),
                           to_sexp=lambda: sexp)


def _footprint(angle: float, layer: str = "F.Cu", models=()) -> SimpleNamespace:
    courtyard = layer.replace("Cu", "CrtYd")
    lines = [_line(courtyard, -1.0, -1.0, 1.0, -1.0), _line(courtyard, 1.0, -1.0, 1.0, 8.6),
             _line(layer.replace("Cu", "SilkS"), -5.0, -5.0, 5.0, 5.0)]
    return SimpleNamespace(at_x=10.0, at_y=20.0, at_angle=angle, layer=layer, library_link="Lib:Hdr_1x04_Vertical",
                           pads=[_pad("2", 0.0, 2.54), _pad("1", 0.0, 0.0), _pad("", 0.0, 7.62, "NP_THRU_HOLE")],
                           iter_objects=lambda: iter(lines), models=list(models))


class TransformTest(unittest.TestCase):
    def pads(self, geometry: dict) -> dict:
        return {p["pad"]: p["positionMm"] for p in geometry["pads"]}

    def test_unrotated_front(self) -> None:
        geometry = _footprint_geometry(_footprint(0.0))
        self.assertEqual((geometry["side"], geometry["positionMm"], geometry["rotationDeg"]), ("top", [10.0, -20.0], 0.0))
        self.assertEqual([p["pad"] for p in geometry["pads"]], ["", "1", "2"])  # natural order, mechanical first
        self.assertEqual(self.pads(geometry)["2"], [10.0, -22.54])  # KiCad y down, board frame y up
        self.assertTrue(geometry["pads"][0]["tht"])
        self.assertEqual(geometry["courtyard"], {"minMm": [-1.0, -8.6], "maxMm": [1.0, 1.0]})
        self.assertEqual(geometry["footprintName"], "Hdr_1x04_Vertical")

    def test_rotations_are_counter_clockwise_in_the_board_frame(self) -> None:
        # Pad 2 sits 2.54 mm below pad 1 on screen: board-frame direction (0, -1) at 0°,
        # (+1, 0) after +90° (counter-clockwise), (-1, 0) after -90°.
        cases = {90.0: [12.54, -20.0], -90.0: [7.46, -20.0], 180.0: [10.0, -17.46]}
        for angle, expected in cases.items():
            with self.subTest(angle=angle):
                geometry = _footprint_geometry(_footprint(angle))
                self.assertEqual(self.pads(geometry)["2"], expected)
                self.assertEqual(self.pads(geometry)["1"], [10.0, -20.0])
                self.assertEqual(geometry["courtyard"], {"minMm": [-1.0, -8.6], "maxMm": [1.0, 1.0]},
                                 "the courtyard stays in the footprint frame")

    def test_bottom_side_uses_the_stored_mirrored_coordinates(self) -> None:
        geometry = _footprint_geometry(_footprint(90.0, "B.Cu"))
        self.assertEqual(geometry["side"], "bottom")
        self.assertEqual(self.pads(geometry)["2"], [12.54, -20.0])
        self.assertIsNotNone(geometry["courtyard"])

    def test_first_visible_model_is_recorded_unresolved(self) -> None:
        geometry = _footprint_geometry(_footprint(0.0, models=[_model("hidden.step", True),
                                                               _model("${KIPRJMOD}/packages3D/ADM6.stp")]))
        self.assertEqual(geometry["model"], {"path": "${KIPRJMOD}/packages3D/ADM6.stp", "offsetMm": [0.0, 0.0, 0.2],
                                             "rotationDeg": [-90.0, 0.0, 0.0], "scale": [1.0, 1.0, 1.0]})
        self.assertIsNone(_footprint_geometry(_footprint(0.0))["model"])

    def test_geometry_changes_the_artifact_digest(self) -> None:
        payload = extract("mini_obc/F0")
        moved = {**payload, "components": [dict(c) for c in payload["components"]]}
        j6 = next(c for c in moved["components"] if c["reference"] == "J6")
        j6["geometry"] = {**j6["geometry"], "positionMm": [51.0, -10.0]}
        self.assertNotEqual(interface_digest(moved), interface_digest(payload))


if __name__ == "__main__":
    unittest.main()

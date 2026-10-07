"""SB2-21: the P2 geometry fixture boards (plan §8), read by Prism's extractor.

The boards (``fixtures/system_builder/p2/sources``) come from
``p2/geometry_fixtures.py``; their kicad-cli 10.0.6 evidence is in
``p2/evidence/fixtures``; the hand-written goldens are in
``p2/goldens/geometry_fixtures.json``. These tests check the evidence says every
board is clean, and that the extractor and the frame inference agree with the goldens.
"""

from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path

from app.services.systems.interface_extractor import extract_interface
from app.services.systems.placement.frames import infer

P2 = Path(__file__).resolve().parent / "fixtures" / "system_builder" / "p2"
GOLDEN = json.loads((P2 / "goldens" / "geometry_fixtures.json").read_text())
RECORD = json.loads((P2 / "evidence" / "fixtures" / "record.json").read_text())


def extract(snapshot: str) -> dict:
    board, step = snapshot.split("/")
    return extract_interface(P2 / "sources" / board / step / f"{board}.kicad_pro", project_id=f"prj_{board}", commit=None)


def geometry(payload: dict, reference: str) -> dict:
    return next(c for c in payload["components"] if c["reference"] == reference)["geometry"]


def pads(payload: dict, reference: str) -> dict[str, list[float]]:
    return {p["pad"]: p["positionMm"] for p in geometry(payload, reference)["pads"] if p["pad"]}


class EvidenceTest(unittest.TestCase):
    def test_every_board_is_clean_in_kicad_cli(self) -> None:
        self.assertEqual(RECORD["kicad"], "10.0.6")
        self.assertEqual(sorted(RECORD["boards"]), sorted(GOLDEN["frames"]))
        for snapshot, entry in RECORD["boards"].items():
            with self.subTest(snapshot=snapshot):
                checks = entry["checks"]
                self.assertEqual({name: check["exitCode"] for name, check in checks.items()},
                                 dict.fromkeys(("drc", "erc", "glb", "netlist", "step"), 0))
                self.assertEqual((checks["erc"]["violations"], checks["drc"]["violations"]), ({}, {}))
                self.assertEqual((checks["step"]["missingModels"], checks["glb"]["missingModels"]), ([], []))

    def test_committed_sources_are_the_recorded_ones(self) -> None:
        for snapshot, entry in RECORD["boards"].items():
            for path, digest in entry["files"].items():
                with self.subTest(path=path):
                    self.assertEqual(hashlib.sha256((P2 / path).read_bytes()).hexdigest(), digest)


class ExtractorTest(unittest.TestCase):
    def test_frames_match_the_goldens(self) -> None:
        for snapshot, expected in GOLDEN["frames"].items():
            payload = extract(snapshot)
            self.assertAlmostEqual(payload["boardThicknessMm"], GOLDEN["boardThicknessMm"])
            for reference, axis in expected.items():
                with self.subTest(snapshot=snapshot, reference=reference):
                    inferred = infer(geometry(payload, reference))
                    self.assertEqual(inferred["axis"], axis, inferred)
                    # low = details needed; the Samtec mezzanines infer from geometry alone (medium)
                    self.assertEqual(inferred["confidence"], GOLDEN["frameConfidence"][snapshot][reference])

    def test_mated_pairs_line_up_pin_for_pin(self) -> None:
        base = extract(GOLDEN["mezzanine"]["base"])
        top = extract(GOLDEN["mezzanine"]["top"])
        for a, b in GOLDEN["mezzanine"]["pairs"]:
            with self.subTest(pair=a):
                lower, upper = pads(base, a), pads(top, b)
                self.assertEqual(sorted(lower), sorted(upper))
                worst = max(abs(x - y) for pad in lower for x, y in zip(lower[pad], upper[pad]))
                self.assertLessEqual(worst, 1e-6, "the top board sits directly over the base, unflipped")

    def test_the_shifted_commit_moves_one_connector(self) -> None:
        before, after = extract(GOLDEN["mezzanine"]["top"]), extract(GOLDEN["mezzanineShifted"]["top"])
        moved = GOLDEN["mezzanineShifted"]["moved"]
        for reference in ("J1", "J2"):
            delta = moved["deltaMm"] if reference == moved["reference"] else [0.0, 0.0]
            offsets = {tuple(round(b - a, 6) for a, b in zip(pads(before, reference)[n], pads(after, reference)[n]))
                       for n in pads(before, reference)}
            self.assertEqual(offsets, {tuple(delta)}, reference)

    def test_extractor_pads_match_the_placed_pads(self) -> None:
        """The extractor's board frame (y up) against the pads KiCad placed (page, y down)."""
        for snapshot in GOLDEN["frames"]:
            placed = json.loads((P2 / "evidence" / "fixtures" / snapshot / "pads.json").read_text())
            payload = extract(snapshot)
            for reference, entry in placed.items():
                with self.subTest(snapshot=snapshot, reference=reference):
                    got = pads(payload, reference)
                    self.assertEqual({n: [round(x, 4), round(-y, 4)] for n, (x, y) in got.items()},
                                     {n: [x, y] for n, (x, y) in entry["pads"].items()})


if __name__ == "__main__":
    unittest.main()

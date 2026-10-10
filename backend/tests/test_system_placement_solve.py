"""SB2-36: the tree solve, driving mates and SYS-V11 mate checks (CONTRACTS_P2 §14.9).

``placement_cases.json`` ``solves`` is shared with ``frontend/.../placement/solve.test.ts``.
Every case is replayed here, and the rules are asserted by hand: the misplacement
fixture (``mezz_top/F1``) yields V11 with exactly its 1.5 mm, the most rows drive,
an override wins, a manual move is "overridden" rather than a mismatch.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from app.services.systems.placement import solve

CASES = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" / "placement_cases.json").read_text())
MM, UNIT = CASES["tolerance"]["mm"], CASES["tolerance"]["unit"]
GOLDEN = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" / "p2" / "goldens"
                     / "geometry_fixtures.json").read_text())


def resolve(end: dict) -> dict:
    return {**CASES["mateEnds"][end["end"]], **{k: v for k, v in end.items() if k != "end"}} if "end" in end else end


def run(spec: dict) -> dict:
    i = spec["input"]
    mates = [{**m, "a": {**m["a"], "end": resolve(m["a"]["end"])}, "b": {**m["b"], "end": resolve(m["b"]["end"])}}
             for m in i["mates"]]
    return solve.solve([tuple(x) for x in i["items"]], i["stored"], [tuple(c) for c in i["connections"]], mates,
                       i["overrides"])


def case(prefix: str) -> dict:
    return next(c for c in CASES["solves"] if c["name"].startswith(prefix))


class ReplayTest(unittest.TestCase):
    def assert_pose(self, got: dict, expected: dict, label: str) -> None:
        self.assertEqual(got["source"], expected["source"], label)
        for a, e in zip(got["translationMm"], expected["translationMm"]):
            self.assertLessEqual(abs(a - e), MM, label)
        for a, e in zip(got["rotation"], expected["rotation"]):
            self.assertLessEqual(abs(a - e), UNIT, label)

    def test_every_case_replays(self) -> None:
        self.assertGreaterEqual(len(CASES["solves"]), 11)
        for spec in CASES["solves"]:
            with self.subTest(case=spec["name"]):
                got, expected = run(spec), spec["expected"]
                self.assertEqual(sorted(got["poses"]), sorted(expected["poses"]))
                for key, pose in expected["poses"].items():
                    self.assert_pose(got["poses"][key], pose, key)
                self.assertEqual({k: (v["linkId"], v["from"], v["overridden"]) for k, v in got["driving"].items()},
                                 {k: (v["linkId"], v["from"], v["overridden"]) for k, v in expected["driving"].items()})
                for key, entry in expected["driving"].items():
                    self.assert_pose(got["driving"][key]["autoPose"], entry["autoPose"], f"{key} auto")
                self.assertEqual((got["roots"], got["unusable"], got["ignoredOverrides"]),
                                 (expected["roots"], expected["unusable"], expected["ignoredOverrides"]))
                self.assertEqual([m["linkId"] for m in got["mismatches"]], [m["linkId"] for m in expected["mismatches"]])
                for m, e in zip(got["mismatches"], expected["mismatches"]):
                    for key in ("lateralMm", "axialMm", "angleDeg"):
                        self.assertAlmostEqual(m[key], e[key], delta=MM)


class RuleTest(unittest.TestCase):
    def test_the_misplacement_fixture_yields_v11_with_the_exact_offset(self) -> None:
        got = run(case("misplacement fixture"))
        self.assertEqual(got["driving"]["top"]["linkId"], "lnk_j1", "equal rows: the lower reference drives")
        [mismatch] = got["mismatches"]
        self.assertEqual(mismatch["linkId"], "lnk_j2")
        self.assertAlmostEqual(mismatch["lateralMm"], GOLDEN["mezzanineShifted"]["residualMm"]["J2"], delta=0.01)
        self.assertAlmostEqual(mismatch["axialMm"], 0.0, delta=0.01)
        z = got["poses"]["top"]["translationMm"][2] - got["poses"]["base"]["translationMm"][2]
        self.assertAlmostEqual(z, GOLDEN["mezzanine"]["topPoseInBaseFrame"]["translationMm"][2], delta=0.01)

    def test_the_aligned_commit_has_no_mismatch(self) -> None:
        self.assertEqual(run(case("the aligned commit"))["mismatches"], [])

    def test_more_rows_drive_and_an_override_wins(self) -> None:
        rows = run(case("the mate with more rows"))
        self.assertEqual((rows["driving"]["top"]["linkId"], [m["linkId"] for m in rows["mismatches"]]),
                         ("lnk_j2", ["lnk_j1"]))
        override = run(case("a driving override"))
        self.assertEqual(override["driving"]["top"]["linkId"], "lnk_j1")

    def test_an_unconfirmed_end_places_nothing(self) -> None:
        got = run(case("an unconfirmed end"))
        self.assertEqual((got["unusable"], got["driving"], {p["source"] for p in got["poses"].values()}),
                         (["lnk_j1"], {}, {"default"}))

    def test_a_manual_move_is_overridden_not_a_mismatch(self) -> None:
        got = run(case("a manual pose"))
        self.assertTrue(got["driving"]["top"]["overridden"])
        self.assertEqual(got["poses"]["top"]["source"], "manual")
        self.assertEqual(got["driving"]["top"]["autoPose"]["source"], "auto")
        # Only the fixture's real 1.5 mm design miss is reported, not the 100 mm hand move.
        self.assertEqual([round(m["lateralMm"], 6) for m in got["mismatches"]], [1.5])

    def test_roots_and_groups(self) -> None:
        self.assertEqual(run(case("the root is the most-connected"))["roots"], ["base"])
        got = run(case("two mated groups"))
        self.assertEqual(got["roots"], ["base", "edge_a"])
        self.assertEqual(got["poses"]["loose"]["source"], "default")
        self.assertEqual(got["poses"]["edge_b"]["source"], "auto")

    def test_an_assembly_member_carries_its_board_offset(self) -> None:
        got = run(case("an assembly member"))
        inside = case("an assembly member")["input"]["mates"][0]["b"]["inMember"]
        from app.services.systems.placement.poses import compose
        board = compose(got["poses"]["cdh"], inside)
        # The board inside the assembly lands where a bare top board would: over the base, 8.6 up.
        self.assertAlmostEqual(board["translationMm"][2] - got["poses"]["base"]["translationMm"][2], 8.6, delta=MM)
        for a, e in zip(board["translationMm"][:2], got["poses"]["base"]["translationMm"][:2]):
            self.assertAlmostEqual(a, e, delta=MM)

    def test_ignored_overrides_say_why(self) -> None:
        reasons = {o["member"]: o["reason"] for o in run(case("an override naming no usable mate"))["ignoredOverrides"]}
        self.assertEqual(reasons, {"b": "not_a_usable_mate", "c": "unreachable"})
        self.assertEqual(run(case("every member overridden"))["ignoredOverrides"][0]["reason"], "root")


if __name__ == "__main__":
    unittest.main()

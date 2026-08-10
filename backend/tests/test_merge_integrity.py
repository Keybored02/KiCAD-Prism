"""Structural soundness of a merged design, checked before it reaches disk.

Two failure directions matter here and they are not symmetric.

A FALSE NEGATIVE writes a broken board. A FALSE POSITIVE blocks a merge that was fine,
and if it happens on ordinary boards people stop trusting the gate entirely. The second
is the one that actually bit during development: an early version reported 11405 orphan
nets on a real 9MB board because it assumed every board carries a numeric net table.
KiCad 20260206 dropped that table and references nets by name.

So the first test class runs the checker over every real board in the repo and demands
silence. The rest prove it still catches what it exists to catch.
"""

from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import merge_integrity as mi  # noqa: E402
from app.services import sexp_splice as sp  # noqa: E402
from app.services import span_index as si  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
BOARD = REPO / "data" / "projects" / "type1" / "test board" / "Git test.kicad_pcb"


def real_boards() -> list[Path]:
    root = REPO / "data" / "projects"
    return sorted(root.rglob("*.kicad_pcb")) if root.is_dir() else []


def real_schematics() -> list[Path]:
    root = REPO / "data" / "projects"
    return sorted(root.rglob("*.kicad_sch"))[:5] if root.is_dir() else []


def board_text() -> str:
    return BOARD.read_text(encoding="utf-8")


class ValidDesignsPassSilently(unittest.TestCase):
    """The direction that makes the gate usable rather than ignored."""

    def test_real_boards_have_no_structural_problems(self) -> None:
        boards = real_boards()
        if not boards:
            self.skipTest("no sample boards checked out")

        for board in boards:
            with self.subTest(board=board.name):
                found = mi.check_pcb(
                    board.read_text(encoding="utf-8", errors="replace")
                )
                self.assertEqual(
                    found, [], f"{board.name}: {mi.describe(found)}\n{found[:3]}"
                )

    def test_real_schematics_have_no_structural_problems(self) -> None:
        schematics = real_schematics()
        if not schematics:
            self.skipTest("no sample schematics checked out")

        for schematic in schematics:
            with self.subTest(schematic=schematic.name):
                found = mi.check_sch(
                    schematic.read_text(encoding="utf-8", errors="replace")
                )
                self.assertEqual(found, [], f"{schematic.name}: {mi.describe(found)}")

    def test_a_name_addressed_board_is_not_all_orphans(self) -> None:
        # The regression that motivated this class. KiCad 20260206 references nets by
        # name and carries no numeric table; checking indices against an absent table
        # called every track on the board an orphan.
        name_addressed = [
            b
            for b in real_boards()
            if not si.net_table(
                si.build_pcb_index(b.read_text(encoding="utf-8", errors="replace"))[0]
            )
        ]
        if not name_addressed:
            self.skipTest("no name-addressed boards checked out")

        for board in name_addressed:
            with self.subTest(board=board.name):
                found = mi.check_pcb(
                    board.read_text(encoding="utf-8", errors="replace")
                )
                orphans = [v for v in found if v.kind == mi.ORPHAN_NET]
                self.assertEqual(
                    orphans, [], "a board with no net table has no orphans"
                )


class Unparseable(unittest.TestCase):
    """The only finding that makes every other check moot."""

    def test_a_truncated_board_is_caught(self) -> None:
        if not BOARD.is_file():
            self.skipTest("no sample board checked out")
        text = board_text()
        found = mi.check_pcb(text[: text.rindex(")")])
        self.assertEqual([v.kind for v in found], [mi.UNPARSEABLE])

    def test_nothing_else_is_reported_alongside(self) -> None:
        # Reporting orphan nets in a file that will not parse would be noise in front of
        # the only fact that matters.
        found = mi.check_pcb("(kicad_pcb")
        self.assertEqual(len(found), 1)

    def test_a_schematic_passed_as_a_board_is_caught(self) -> None:
        found = mi.check_pcb("(kicad_sch (version 20241229))")
        self.assertEqual([v.kind for v in found], [mi.UNPARSEABLE])


class Nets(unittest.TestCase):
    """The failure a naive splice produces most easily."""

    def test_a_track_on_a_net_that_does_not_exist(self) -> None:
        if not BOARD.is_file():
            self.skipTest("no sample board checked out")
        text = board_text()
        _, index = si.build_pcb_index(text)
        segment = next(a for a in index.values() if a.kind == "segment")

        damaged = sp.apply_edits(
            text,
            [
                sp.replace(
                    segment.offset,
                    segment.end_offset,
                    re.sub(r"\(net \d+\)", "(net 9999)", segment.slice(text)),
                )
            ],
        )
        found = mi.check_pcb(damaged)
        self.assertIn(mi.ORPHAN_NET, [v.kind for v in found])

    def test_a_pad_disagreeing_with_the_net_table(self) -> None:
        # Pads carry the net NAME inline alongside the index. A pad calling net 19 "GND"
        # while the table calls it something else is a silent short waiting to happen.
        board = (
            "(kicad_pcb\n"
            '\t(net 0 "")\n'
            '\t(net 1 "GND")\n'
            '\t(footprint "L:R"\n'
            '\t\t(uuid "fp-1")\n'
            "\t\t(at 0 0)\n"
            '\t\t(property "Reference" "R1" (at 0 0 0) (uuid "p1"))\n'
            '\t\t(pad "1" smd rect (at 0 0) (size 1 1) (net 1 "+5V"))\n'
            "\t)\n"
            ")\n"
        )
        found = mi.check_pcb(board)
        self.assertIn(mi.NET_NAME_MISMATCH, [v.kind for v in found])

    def test_a_pad_agreeing_with_the_net_table_is_fine(self) -> None:
        board = (
            "(kicad_pcb\n"
            '\t(net 0 "")\n'
            '\t(net 1 "GND")\n'
            '\t(footprint "L:R"\n'
            '\t\t(uuid "fp-1")\n'
            "\t\t(at 0 0)\n"
            '\t\t(property "Reference" "R1" (at 0 0 0) (uuid "p1"))\n'
            '\t\t(pad "1" smd rect (at 0 0) (size 1 1) (net 1 "GND"))\n'
            "\t)\n"
            ")\n"
        )
        self.assertEqual(mi.check_pcb(board), [])

    def test_the_message_names_the_component(self) -> None:
        # "pad on R1" tells someone where to look; "pad on a footprint" does not.
        board = (
            "(kicad_pcb\n"
            '\t(net 1 "GND")\n'
            '\t(footprint "L:R"\n'
            '\t\t(uuid "fp-1")\n'
            "\t\t(at 0 0)\n"
            '\t\t(property "Reference" "R42" (at 0 0 0) (uuid "p1"))\n'
            '\t\t(pad "1" smd rect (at 0 0) (size 1 1) (net 7 "X"))\n'
            "\t)\n"
            ")\n"
        )
        found = mi.check_pcb(board)
        self.assertTrue(any("R42" in v.detail for v in found), found)


class DuplicateUuids(unittest.TestCase):
    """Both branches descend from one base, so the same object can arrive twice."""

    def test_two_footprints_with_one_uuid(self) -> None:
        if not BOARD.is_file():
            self.skipTest("no sample board checked out")
        text = board_text()
        _, index = si.build_pcb_index(text)
        footprint = sorted(
            (a for a in index.values() if a.kind == "footprint"),
            key=lambda a: a.offset,
        )[0]

        duplicated = sp.apply_edits(
            text,
            [
                sp.Edit(
                    footprint.end_offset,
                    footprint.end_offset,
                    "\n\t" + footprint.slice(text),
                )
            ],
        )
        found = mi.check_pcb(duplicated)
        self.assertIn(mi.DUPLICATE_UUID, [v.kind for v in found])

    def test_the_same_uuid_in_different_footprints_is_fine(self) -> None:
        # Footprint graphics are keyed by parent, so two footprints may each hold a
        # graphic with the same local uuid without any ambiguity.
        board = (
            "(kicad_pcb\n"
            '\t(footprint "L:A" (uuid "fp-1") (at 0 0)\n'
            '\t\t(fp_line (start 0 0) (end 1 1) (layer "F.SilkS") (uuid "g-1"))\n'
            "\t)\n"
            '\t(footprint "L:B" (uuid "fp-2") (at 5 5)\n'
            '\t\t(fp_line (start 0 0) (end 1 1) (layer "F.SilkS") (uuid "g-1"))\n'
            "\t)\n"
            ")\n"
        )
        found = [v for v in mi.check_pcb(board) if v.kind == mi.DUPLICATE_UUID]
        self.assertEqual(found, [])

    def test_two_graphics_in_one_footprint_sharing_a_uuid(self) -> None:
        board = (
            "(kicad_pcb\n"
            '\t(footprint "L:A" (uuid "fp-1") (at 0 0)\n'
            '\t\t(fp_line (start 0 0) (end 1 1) (layer "F.SilkS") (uuid "g-1"))\n'
            '\t\t(fp_line (start 2 2) (end 3 3) (layer "F.SilkS") (uuid "g-1"))\n'
            "\t)\n"
            ")\n"
        )
        found = mi.check_pcb(board)
        self.assertIn(mi.DUPLICATE_UUID, [v.kind for v in found])


class Layers(unittest.TestCase):
    """Partial staging can leave a track on a layer the board no longer has."""

    def test_a_track_on_a_layer_not_in_the_stackup(self) -> None:
        if not BOARD.is_file():
            self.skipTest("no sample board checked out")
        text = board_text()
        _, index = si.build_pcb_index(text)
        segment = next(a for a in index.values() if a.kind == "segment")

        damaged = sp.apply_edits(
            text,
            [
                sp.replace(
                    segment.offset,
                    segment.end_offset,
                    segment.slice(text).replace('"F.Cu"', '"In7.Cu"'),
                )
            ],
        )
        found = mi.check_pcb(damaged)
        self.assertIn(mi.MISSING_LAYER, [v.kind for v in found])

    def test_a_board_with_no_stackup_is_not_judged(self) -> None:
        # Nothing to check against, and inventing a default would be guessing.
        board = '(kicad_pcb\n\t(segment (start 0 0) (end 1 0) (layer "F.Cu"))\n)\n'
        found = [v for v in mi.check_pcb(board) if v.kind == mi.MISSING_LAYER]
        self.assertEqual(found, [])


class Footprints(unittest.TestCase):
    """Presence of a library name, not whether it resolves here."""

    def test_a_footprint_with_no_library(self) -> None:
        board = '(kicad_pcb\n\t(footprint (uuid "fp-1") (at 0 0))\n)\n'
        found = mi.check_pcb(board)
        self.assertIn(mi.MISSING_LIB_ID, [v.kind for v in found])

    def test_a_library_this_machine_lacks_is_not_a_problem(self) -> None:
        # Normal for a board somebody else drew. Blocking on it would punish the wrong
        # person for not having a colleague's local library.
        board = (
            '(kicad_pcb\n\t(footprint "SomeoneElse:Part" (uuid "fp-1") (at 0 0))\n)\n'
        )
        found = [v for v in mi.check_pcb(board) if v.kind == mi.MISSING_LIB_ID]
        self.assertEqual(found, [])


class Describing(unittest.TestCase):
    """What a refusal message says."""

    def test_nothing_wrong_says_so(self) -> None:
        self.assertIn("No structural problems", mi.describe([]))

    def test_findings_are_counted_by_kind(self) -> None:
        summary = mi.describe(
            [
                mi.Violation(mi.ORPHAN_NET, "a"),
                mi.Violation(mi.ORPHAN_NET, "b"),
                mi.Violation(mi.DUPLICATE_UUID, "c"),
            ]
        )
        self.assertIn("2 orphan_net", summary)
        self.assertIn("1 duplicate_uuid", summary)


if __name__ == "__main__":
    unittest.main()

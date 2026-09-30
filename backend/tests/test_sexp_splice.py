"""Splicing bytes into a KiCad file without disturbing the ones nobody edited.

This is the write path for semantic merge, so the properties worth guarding are not
"does it produce nice output" but "can it ever produce a file KiCad cannot open".

The identity law is the load-bearing one: splicing nothing must return the input
unchanged, byte for byte. Everything else in the merge feature rests on it, because it
is what lets us promise that an untouched region of a merged board is literally the same
bytes KiCad already accepted.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import sexp_splice as splice  # noqa: E402
from app.services.sexp_splice import Edit, SpliceError  # noqa: E402

# A real board, not a fixture: the point is to prove this survives what KiCad actually
# writes. Skipped rather than failed when absent, so the suite still runs on a checkout
# without sample projects.
BOARD = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "projects"
    / "type1"
    / "test board"
    / "Git test.kicad_pcb"
)


class Identity(unittest.TestCase):
    """Splicing nothing changes nothing."""

    def test_no_edits_returns_the_input(self) -> None:
        text = "(kicad_pcb\n\t(version 20241229)\n)\n"
        self.assertEqual(splice.apply_edits(text, []), text)

    def test_no_edits_on_a_real_board_is_byte_exact(self) -> None:
        if not BOARD.is_file():
            self.skipTest("no sample board checked out")
        text = BOARD.read_text(encoding="utf-8")
        self.assertEqual(splice.apply_edits(text, []), text)

    def test_replacing_a_range_with_itself_is_byte_exact(self) -> None:
        # A decision that resolves to "keep ours" produces exactly this shape, and it
        # must not perturb the file.
        text = "(kicad_pcb\n\t(general\n\t\t(thickness 1.6)\n\t)\n)\n"
        start = text.index("(general")
        end = text.index(")\n)", start) + 1
        edit = Edit(offset=start, end_offset=end, replacement=text[start:end])
        self.assertEqual(splice.apply_edits(text, [edit]), text)


class Ordering(unittest.TestCase):
    """Offsets refer to the original text, whatever order the edits arrive in."""

    def test_edits_apply_back_to_front(self) -> None:
        text = "ABCDEF"
        out = splice.apply_edits(
            text,
            [
                Edit(0, 1, "one"),  # grows the file before the later edit's offset
                Edit(5, 6, "six"),
            ],
        )
        self.assertEqual(out, "oneBCDEsix")

    def test_input_order_does_not_matter(self) -> None:
        text = "ABCDEF"
        forward = splice.apply_edits(text, [Edit(0, 1, "one"), Edit(5, 6, "six")])
        backward = splice.apply_edits(text, [Edit(5, 6, "six"), Edit(0, 1, "one")])
        self.assertEqual(forward, backward)

    def test_a_growing_edit_does_not_shift_a_later_one(self) -> None:
        # The bug this guards: applying front to back would leave the second edit
        # pointing into the middle of the text the first one inserted.
        text = "(a)(b)"
        out = splice.apply_edits(text, [Edit(0, 3, "(aaaaaaaaaa)"), Edit(3, 6, "(bb)")])
        self.assertEqual(out, "(aaaaaaaaaa)(bb)")


class Overlap(unittest.TestCase):
    """Overlapping edits are our bug, and must fail loudly rather than corrupt."""

    def test_overlapping_ranges_are_refused(self) -> None:
        with self.assertRaises(SpliceError):
            splice.apply_edits("ABCDEF", [Edit(0, 4, "x"), Edit(2, 6, "y")])

    def test_a_node_and_its_child_are_refused(self) -> None:
        # Staging a footprint AND one of its silk lines. The caller must drop the
        # descendant first; reaching apply_edits with both is a bug.
        text = "(footprint (fp_line))"
        with self.assertRaises(SpliceError):
            splice.apply_edits(
                text, [Edit(0, len(text), "(footprint)"), Edit(11, 20, "")]
            )

    def test_touching_but_not_overlapping_is_allowed(self) -> None:
        # Adjacent siblings: one ends exactly where the next begins.
        out = splice.apply_edits("ABCDEF", [Edit(0, 3, "x"), Edit(3, 6, "y")])
        self.assertEqual(out, "xy")

    def test_several_insertions_at_one_point_are_allowed(self) -> None:
        # Two footprints appended at the same place. Zero-width, so nothing overlaps.
        out = splice.apply_edits("()", [Edit(1, 1, "a"), Edit(1, 1, "b")])
        self.assertEqual(len(out), 4)

    def test_a_reversed_range_is_refused(self) -> None:
        with self.assertRaises(SpliceError):
            Edit(offset=10, end_offset=4, replacement="")

    def test_a_negative_offset_is_refused(self) -> None:
        with self.assertRaises(SpliceError):
            Edit(offset=-1, end_offset=4, replacement="")

    def test_an_edit_past_the_end_is_refused(self) -> None:
        with self.assertRaises(SpliceError):
            splice.apply_edits("short", [Edit(0, 500, "x")])


class Deleting(unittest.TestCase):
    """Removing a node should not leave a hole where it was."""

    def test_delete_without_text_leaves_the_whitespace(self) -> None:
        text = "(a)\n\t(b)\n"
        out = splice.apply_edits(text, [splice.delete(5, 8)])
        self.assertEqual(out, "(a)\n\t\n")

    def test_delete_with_text_swallows_the_blank_line(self) -> None:
        # A leftover blank line is harmless to KiCad but shows up in the diff as a
        # change nobody made, which defeats the point of splicing.
        text = "(a)\n\t(b)\n"
        out = splice.apply_edits(text, [splice.delete(5, 8, text)])
        self.assertEqual(out, "(a)\n")

    def test_deleting_a_real_footprint_still_parses(self) -> None:
        if not BOARD.is_file():
            self.skipTest("no sample board checked out")
        from kicad_monkey import parse_sexp_with_spans

        text = BOARD.read_text(encoding="utf-8")
        _, spans = parse_sexp_with_spans(text)
        footprints = sorted(
            (
                s
                for s in spans.values()
                if text[s.offset : s.offset + 10] == "(footprint"
            ),
            key=lambda s: s.offset,
        )
        self.assertTrue(footprints, "sample board has no footprints")

        victim = footprints[0]
        out = splice.apply_edits(
            text, [splice.delete(victim.offset, victim.end_offset, text)]
        )
        _, after = parse_sexp_with_spans(out)
        remaining = [
            s for s in after.values() if out[s.offset : s.offset + 10] == "(footprint"
        ]
        self.assertEqual(len(remaining), len(footprints) - 1)


class Inserting(unittest.TestCase):
    """Adding a node as the last child of another."""

    def test_insert_lands_inside_the_parent(self) -> None:
        text = "(kicad_pcb\n\t(general)\n)\n"
        parent_end = text.index(")\n", text.index("(general")) + 1
        # (general) ends at its own paren; insert into the outer node instead.
        outer_end = len(text) - 1
        edit = splice.insert_into(text, outer_end, '(net 1 "GND")', "\t")
        out = splice.apply_edits(text, [edit])
        self.assertIn('(net 1 "GND")', out)
        self.assertTrue(out.rstrip().endswith(")"))
        del parent_end

    def test_insert_uses_the_given_indent(self) -> None:
        text = "(a\n\t(b)\n)\n"
        edit = splice.insert_into(text, len(text) - 1, "(c)", "\t")
        out = splice.apply_edits(text, [edit])
        self.assertIn("\t(c)\n", out)

    def test_insert_refuses_a_parent_that_does_not_close(self) -> None:
        with self.assertRaises(SpliceError):
            splice.insert_into("(a\n\t(b)\n", 4, "(c)", "\t")

    def test_indent_of_reads_what_the_file_actually_uses(self) -> None:
        # KiCad writes tabs, but a hand-edited or tool-generated file may not, so this
        # must reflect the file rather than assume.
        tabs = "(a\n\t\t(b)\n)"
        self.assertEqual(splice.indent_of(tabs, tabs.index("(b)")), "\t\t")

        spaces = "(a\n    (b)\n)"
        self.assertEqual(splice.indent_of(spaces, spaces.index("(b)")), "    ")

    def test_indent_of_a_line_with_no_indent(self) -> None:
        self.assertEqual(splice.indent_of("(a)\n(b)", 4), "")


if __name__ == "__main__":
    unittest.main()

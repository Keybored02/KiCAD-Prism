"""Building a merged file from staged decisions.

The properties here are the ones the whole feature rests on:

  - **identity**: staging nothing returns our file BYTE for byte, so a merge nobody
    contributed to cannot perturb anything
  - **untouched bytes**: a region nobody staged is identical to a file KiCad already
    accepted, so corruption can only come from a spliced range
  - **net remapping**: an index copied verbatim silently reconnects a track to a
    different net, producing a wrong board that opens cleanly and passes most checks

That last one is the quietest failure in the feature, so it gets the most tests.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import merge3_service as m3  # noqa: E402
from app.services import merge_patch_service as mp  # noqa: E402
from app.services import sexp_splice as sp  # noqa: E402
from app.services import span_index as si  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
BOARD = REPO / "data" / "projects" / "type1" / "test board" / "Git test.kicad_pcb"


def footprint(uuid: str, ref: str = "R1", x: float = 10.0, net: int = 1) -> str:
    return (
        '\t(footprint "Lib:R_0805"\n'
        f'\t\t(uuid "{uuid}")\n'
        f"\t\t(at {x} 20)\n"
        '\t\t(layer "F.Cu")\n'
        f'\t\t(property "Reference" "{ref}"\n\t\t\t(at 0 0 0)\n\t\t\t(uuid "p-{uuid}")\n\t\t)\n'
        f'\t\t(pad "1" smd rect (at 0 0) (size 1 1) (net {net} "N{net}"))\n'
        "\t)\n"
    )


def board(*bodies: str, nets: tuple = ((0, ""), (1, "N1"))) -> str:
    net_lines = "".join(f'\t(net {i} "{n}")\n' for i, n in nets)
    return (
        "(kicad_pcb\n"
        "\t(version 20241229)\n"
        '\t(generator "pcbnew")\n'
        '\t(layers\n\t\t(0 "F.Cu" signal)\n\t\t(31 "B.Cu" signal)\n\t)\n'
        + net_lines
        + "".join(bodies)
        + ")\n"
    )


def split(base_text: str, drop_first: bool, drop_index: int):
    """Two divergent boards made by deleting different footprints from one base."""
    _, index = si.build_pcb_index(base_text)
    footprints = sorted(
        (a for a in index.values() if a.kind == "footprint"), key=lambda a: a.offset
    )
    victim = footprints[0 if drop_first else drop_index]
    return sp.apply_edits(
        base_text, [sp.delete(victim.offset, victim.end_offset, base_text)]
    )


class Identity(unittest.TestCase):
    """Staging nothing must change nothing."""

    def test_no_decisions_returns_ours_byte_for_byte(self) -> None:
        base = board(footprint("fp-1"), footprint("fp-2"))
        ours = board(footprint("fp-1", x=99.0), footprint("fp-2"))
        theirs = board(footprint("fp-1"), footprint("fp-2", ref="R9"))

        result = mp.build_merged_pcb(base, ours, theirs, [])
        self.assertTrue(result.ok, result.detail)
        self.assertEqual(result.text, ours)

    def test_resolving_everything_to_ours_changes_nothing(self) -> None:
        base = board(footprint("fp-1"), footprint("fp-2"))
        ours = board(footprint("fp-1", x=99.0), footprint("fp-2"))
        theirs = board(footprint("fp-1"), footprint("fp-2", ref="R9"))

        decisions = m3.diff3_pcb(base, ours, theirs)
        staged = [mp.Staged(d.key, mp.OURS) for d in decisions]

        result = mp.build_merged_pcb(base, ours, theirs, staged, decisions)
        self.assertTrue(result.ok, result.detail)
        self.assertEqual(result.text, ours)

    def test_identity_holds_on_a_real_board(self) -> None:
        if not BOARD.is_file():
            self.skipTest("no sample board checked out")
        base = BOARD.read_text(encoding="utf-8")
        ours = split(base, True, 0)
        theirs = split(base, False, 5)

        result = mp.build_merged_pcb(base, ours, theirs, [])
        self.assertTrue(result.ok, result.detail)
        self.assertEqual(result.text, ours)


class TakingTheirs(unittest.TestCase):
    """The ordinary case, and what it must leave alone."""

    def test_their_edit_lands(self) -> None:
        base = board(footprint("fp-1", ref="R1"))
        ours = board(footprint("fp-1", ref="R1"))
        theirs = board(footprint("fp-1", ref="R42"))

        decisions = m3.diff3_pcb(base, ours, theirs)
        staged = [mp.Staged(d.key, mp.THEIRS) for d in decisions]

        result = mp.build_merged_pcb(base, ours, theirs, staged, decisions)
        self.assertTrue(result.ok, result.detail)
        self.assertIn("R42", result.text)

    def test_their_deletion_removes_it_here(self) -> None:
        base = board(footprint("fp-1"), footprint("fp-2"))
        ours = board(footprint("fp-1"), footprint("fp-2"))
        theirs = board(footprint("fp-2"))

        decisions = m3.diff3_pcb(base, ours, theirs)
        staged = [mp.Staged(d.key, mp.THEIRS) for d in decisions]

        result = mp.build_merged_pcb(base, ours, theirs, staged, decisions)
        self.assertTrue(result.ok, result.detail)
        _, index = si.build_pcb_index(result.text)
        self.assertNotIn("fp-1", index)
        self.assertIn("fp-2", index)

    def test_a_footprint_only_they_have_is_added(self) -> None:
        base = board(footprint("fp-1"))
        ours = board(footprint("fp-1"))
        theirs = board(footprint("fp-1"), footprint("fp-2", ref="R2", x=50.0))

        decisions = m3.diff3_pcb(base, ours, theirs)
        staged = [mp.Staged(d.key, mp.THEIRS) for d in decisions]

        result = mp.build_merged_pcb(base, ours, theirs, staged, decisions)
        self.assertTrue(result.ok, result.detail)
        _, index = si.build_pcb_index(result.text)
        self.assertIn("fp-2", index)

    def test_untouched_regions_keep_their_exact_bytes(self) -> None:
        # The property that makes the corruption guarantee meaningful.
        base = board(footprint("fp-1"), footprint("fp-2", ref="R2", x=50.0))
        ours = board(footprint("fp-1"), footprint("fp-2", ref="R2", x=50.0))
        theirs = board(
            footprint("fp-1", ref="R99"), footprint("fp-2", ref="R2", x=50.0)
        )

        decisions = m3.diff3_pcb(base, ours, theirs)
        staged = [mp.Staged(d.key, mp.THEIRS) for d in decisions]
        result = mp.build_merged_pcb(base, ours, theirs, staged, decisions)
        self.assertTrue(result.ok, result.detail)

        # fp-2 was never staged, so its bytes must be exactly as ours had them.
        _, ours_index = si.build_pcb_index(ours)
        _, merged_index = si.build_pcb_index(result.text)
        self.assertEqual(
            ours_index["fp-2"].slice(ours), merged_index["fp-2"].slice(result.text)
        )


class Nets(unittest.TestCase):
    """The quietest failure: a track reconnected to the wrong net."""

    def setUp(self) -> None:
        # GND is net 3 on their board and net 7 on ours. Copying an index verbatim
        # would connect their track to whatever ours calls 3.
        self.theirs_root = si.build_pcb_index(
            '(kicad_pcb (net 0 "") (net 3 "GND") (net 4 "VCC"))'
        )[0]
        self.ours_root = si.build_pcb_index('(kicad_pcb (net 0 "") (net 7 "GND"))')[0]

    def test_a_track_index_is_translated_through_the_name(self) -> None:
        out = mp._remap_nets("(segment (net 3))", self.theirs_root, self.ours_root, [])
        self.assertIn("(net 7)", out)
        self.assertNotIn("(net 3)", out)

    def test_a_pad_keeps_its_index_and_name_consistent(self) -> None:
        # A pad whose index and name disagree is a silent short.
        out = mp._remap_nets(
            '(pad "1" smd rect (net 3 "GND"))', self.theirs_root, self.ours_root, []
        )
        self.assertIn('(net 7 "GND")', out)

    def test_a_net_we_do_not_have_is_allocated_and_reported(self) -> None:
        additions: list[str] = []
        out = mp._remap_nets(
            "(segment (net 4))", self.theirs_root, self.ours_root, additions
        )
        self.assertIn("(net 8)", out)  # next free index on our side
        self.assertEqual(additions, ["VCC"])

    def test_net_name_nodes_are_not_rewritten(self) -> None:
        # A zone carries both `(net N)` and `(net_name "...")`. Rewriting the latter as
        # though it were an index would corrupt the zone.
        out = mp._remap_nets(
            '(zone (net 3) (net_name "GND"))', self.theirs_root, self.ours_root, []
        )
        self.assertIn("(net 7)", out)
        self.assertIn('(net_name "GND")', out)

    def test_a_name_addressed_board_is_left_alone(self) -> None:
        # KiCad 20260206 references nets by name and has no table. Names are already
        # stable across branches, so there is nothing to remap.
        empty = si.build_pcb_index("(kicad_pcb (version 20260206))")[0]
        donor = '(segment (net "/CAN_A_L"))'
        self.assertEqual(mp._remap_nets(donor, empty, empty, []), donor)

    def test_a_new_net_is_added_to_the_table(self) -> None:
        base = board(footprint("fp-1", net=1))
        ours = board(footprint("fp-1", net=1))
        theirs = board(
            footprint("fp-1", net=1),
            footprint("fp-2", ref="R2", x=50.0, net=2),
            nets=((0, ""), (1, "N1"), (2, "N2")),
        )

        decisions = m3.diff3_pcb(base, ours, theirs)
        staged = [mp.Staged(d.key, mp.THEIRS) for d in decisions]
        result = mp.build_merged_pcb(base, ours, theirs, staged, decisions)

        self.assertTrue(result.ok, result.detail)
        merged_root, _ = si.build_pcb_index(result.text)
        self.assertIn("N2", si.net_table(merged_root).values())


class Dependencies(unittest.TestCase):
    """A child cannot be spliced into a footprint that is not there."""

    def test_staging_a_parent_and_its_child_does_not_overlap(self) -> None:
        # Splicing the footprint already carries its graphics. Letting both through
        # would produce overlapping edits, which apply_edits refuses outright.
        base = board(footprint("fp-1"))
        ours = board(footprint("fp-1"))
        theirs = board(
            '\t(footprint "Lib:R_0805"\n'
            '\t\t(uuid "fp-1")\n'
            "\t\t(at 10 20)\n"
            '\t\t(layer "F.Cu")\n'
            '\t\t(property "Reference" "R1"\n\t\t\t(at 0 0 0)\n\t\t\t(uuid "p-fp-1")\n\t\t)\n'
            '\t\t(fp_line (start 0 0) (end 1 1) (layer "F.SilkS") (uuid "g-1"))\n'
            '\t\t(pad "1" smd rect (at 0 0) (size 1 1) (net 1 "N1"))\n'
            "\t)\n"
        )

        decisions = m3.diff3_pcb(base, ours, theirs)
        staged = [mp.Staged(d.key, mp.THEIRS) for d in decisions]

        result = mp.build_merged_pcb(base, ours, theirs, staged, decisions)
        self.assertTrue(result.ok, result.detail)

    def test_an_unknown_key_is_skipped_with_a_reason(self) -> None:
        base = ours = theirs = board(footprint("fp-1"))
        result = mp.build_merged_pcb(
            base, ours, theirs, [mp.Staged("no-such-object", mp.THEIRS)]
        )
        self.assertTrue(result.ok)
        self.assertEqual(len(result.skipped), 1)
        self.assertIn("no such change", result.skipped[0][1])


class Refusals(unittest.TestCase):
    """A patch that cannot be built must carry no text to write."""

    def test_a_failed_patch_has_no_text(self) -> None:
        result = mp.build_merged_pcb("(nonsense", "(nonsense", "(nonsense", [])
        self.assertFalse(result.ok)
        self.assertIsNone(result.text)

    def test_an_unknown_resolution_is_skipped(self) -> None:
        base = board(footprint("fp-1"))
        ours = board(footprint("fp-1"))
        theirs = board(footprint("fp-1", ref="R42"))

        decisions = m3.diff3_pcb(base, ours, theirs)
        staged = [mp.Staged(d.key, "sideways") for d in decisions]

        result = mp.build_merged_pcb(base, ours, theirs, staged, decisions)
        self.assertTrue(result.skipped)


class OnRealBoards(unittest.TestCase):
    """Against what KiCad actually writes."""

    def setUp(self) -> None:
        if not BOARD.is_file():
            self.skipTest("no sample board checked out")
        self.base = BOARD.read_text(encoding="utf-8")
        self.ours = split(self.base, True, 0)
        self.theirs = split(self.base, False, 5)

    def test_a_real_merge_honours_both_deletions(self) -> None:
        decisions = m3.diff3_pcb(self.base, self.ours, self.theirs)
        staged = [
            mp.Staged(d.key, mp.THEIRS)
            for d in decisions
            if d.classification == m3.ONLY_THEIRS
        ]
        result = mp.build_merged_pcb(
            self.base, self.ours, self.theirs, staged, decisions
        )
        self.assertTrue(result.ok, result.detail)

        def count(text: str) -> int:
            _, index = si.build_pcb_index(text)
            return len([a for a in index.values() if a.kind == "footprint"])

        # Base has 10; each side removed a different one; the merge honours both.
        self.assertEqual(count(self.base), 10)
        self.assertEqual(count(result.text), 8)

    def test_the_merged_board_is_structurally_sound(self) -> None:
        from app.services import merge_integrity

        decisions = m3.diff3_pcb(self.base, self.ours, self.theirs)
        staged = [
            mp.Staged(d.key, mp.THEIRS)
            for d in decisions
            if d.classification == m3.ONLY_THEIRS
        ]
        result = mp.build_merged_pcb(
            self.base, self.ours, self.theirs, staged, decisions
        )
        self.assertTrue(result.ok, result.detail)
        self.assertEqual(merge_integrity.check_pcb(result.text), [])


if __name__ == "__main__":
    unittest.main()

"""What two branches each did to every object, and whether both can be honoured.

The cases that matter here are not the obvious ones. A conflict that both sides clearly
disagree on is easy; the dangerous cases are the near-misses:

  - two people editing DIFFERENT fields of one footprint is not a conflict, and must not
    resolve to one side, because that silently discards the other's edit
  - two people routing DIFFERENT nets through the same coordinates share a synthesized
    key but are not the same object, so picking one loses a real connection
  - a delete on one side against an edit on the other overlaps on no field at all, yet
    is a genuine conflict only a human can settle

Each of those would produce a plausible-looking board that quietly lost somebody's work.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import merge3_service as m3  # noqa: E402

BOARD_HEAD = '(kicad_pcb\n\t(version 20241229)\n\t(generator "pcbnew")\n'


def board(*bodies: str, nets: tuple = ()) -> str:
    """A minimal but real .kicad_pcb, so the actual extractor parses it."""
    net_lines = "".join(f'\t(net {i} "{n}")\n' for i, n in nets)
    return BOARD_HEAD + net_lines + "".join(bodies) + ")\n"


def footprint(uuid: str, ref: str = "R1", x: float = 10.0, y: float = 20.0) -> str:
    return (
        '\t(footprint "Resistor_SMD:R_0805"\n'
        '\t\t(layer "F.Cu")\n'
        f'\t\t(uuid "{uuid}")\n'
        f"\t\t(at {x} {y})\n"
        f'\t\t(property "Reference" "{ref}"\n'
        "\t\t\t(at 0 0 0)\n"
        '\t\t\t(layer "F.SilkS")\n'
        f'\t\t\t(uuid "p-{uuid}")\n'
        "\t\t)\n"
        '\t\t(property "Value" "10k"\n'
        "\t\t\t(at 0 0 0)\n"
        '\t\t\t(layer "F.Fab")\n'
        f'\t\t\t(uuid "v-{uuid}")\n'
        "\t\t)\n"
        "\t)\n"
    )


def segment(sx: float, sy: float, ex: float, ey: float, net: int = 1) -> str:
    return (
        f"\t(segment\n\t\t(start {sx} {sy})\n\t\t(end {ex} {ey})\n"
        f'\t\t(width 0.25)\n\t\t(layer "F.Cu")\n\t\t(net {net})\n\t)\n'
    )


def by_kind(decisions: list, kind: str) -> list:
    return [d for d in decisions if d.kind == kind]


class NothingToDecide(unittest.TestCase):
    """Cases where only one side acted, or both acted identically."""

    def test_an_untouched_board_yields_no_decisions(self) -> None:
        text = board(footprint("fp-1"))
        self.assertEqual(m3.diff3_pcb(text, text, text), [])

    def test_only_we_changed_it(self) -> None:
        base = board(footprint("fp-1"))
        ours = board(footprint("fp-1", x=99.0))
        decisions = by_kind(m3.diff3_pcb(base, ours, base), "footprint")
        self.assertEqual(len(decisions), 1)
        self.assertEqual(decisions[0].classification, m3.ONLY_OURS)
        self.assertFalse(decisions[0].needs_input)

    def test_only_they_changed_it(self) -> None:
        base = board(footprint("fp-1"))
        theirs = board(footprint("fp-1", x=99.0))
        decisions = by_kind(m3.diff3_pcb(base, base, theirs), "footprint")
        self.assertEqual(decisions[0].classification, m3.ONLY_THEIRS)
        self.assertEqual(decisions[0].default, "theirs")
        self.assertFalse(decisions[0].needs_input)

    def test_both_made_the_same_edit(self) -> None:
        base = board(footprint("fp-1"))
        moved = board(footprint("fp-1", x=99.0))
        decisions = by_kind(m3.diff3_pcb(base, moved, moved), "footprint")
        self.assertEqual(decisions[0].classification, m3.BOTH_SAME)
        self.assertFalse(decisions[0].needs_input)

    def test_both_deleted_it(self) -> None:
        base = board(footprint("fp-1"), footprint("fp-2"))
        without = board(footprint("fp-2"))
        decisions = by_kind(m3.diff3_pcb(base, without, without), "footprint")
        self.assertEqual(decisions[0].classification, m3.BOTH_SAME)
        self.assertEqual(decisions[0].default, "remove")


class BothEdited(unittest.TestCase):
    """The case that silently loses work if it is got wrong."""

    def test_different_fields_keeps_both_edits(self) -> None:
        # Ours moves the part, theirs renames it. Resolving to either side alone would
        # discard the other person's edit without saying so.
        base = board(footprint("fp-1", ref="R1", x=10.0))
        ours = board(footprint("fp-1", ref="R1", x=99.0))
        theirs = board(footprint("fp-1", ref="R42", x=10.0))

        decision = by_kind(m3.diff3_pcb(base, ours, theirs), "footprint")[0]
        self.assertEqual(decision.classification, m3.BOTH_FIELDS)
        self.assertEqual(decision.default, "both")
        self.assertEqual(decision.merged_fields.get("x"), "ours")
        self.assertEqual(decision.merged_fields.get("reference"), "theirs")

    def test_the_same_field_differently_is_a_conflict(self) -> None:
        base = board(footprint("fp-1", x=10.0))
        ours = board(footprint("fp-1", x=50.0))
        theirs = board(footprint("fp-1", x=70.0))

        decision = by_kind(m3.diff3_pcb(base, ours, theirs), "footprint")[0]
        self.assertEqual(decision.classification, m3.CONFLICT)
        self.assertTrue(decision.needs_input)
        self.assertIn("x", decision.conflicting_fields)
        self.assertEqual(decision.conflicting_fields["x"]["ours"], 50.0)
        self.assertEqual(decision.conflicting_fields["x"]["theirs"], 70.0)

    def test_a_field_only_one_side_moved_is_not_conflicting(self) -> None:
        # Both "changed" the object, but only ours moved x. Theirs still holds the base
        # value there, so x is not in dispute.
        base = board(footprint("fp-1", ref="R1", x=10.0))
        ours = board(footprint("fp-1", ref="R1", x=50.0))
        theirs = board(footprint("fp-1", ref="R9", x=10.0))

        decision = by_kind(m3.diff3_pcb(base, ours, theirs), "footprint")[0]
        self.assertNotIn("x", decision.conflicting_fields)


class DeleteVersusEdit(unittest.TestCase):
    """No field overlaps, yet only a human can settle it."""

    def test_we_deleted_it_they_edited_it(self) -> None:
        base = board(footprint("fp-1"), footprint("fp-2"))
        ours = board(footprint("fp-2"))
        theirs = board(footprint("fp-1", x=99.0), footprint("fp-2"))

        decision = by_kind(m3.diff3_pcb(base, ours, theirs), "footprint")[0]
        self.assertEqual(decision.classification, m3.CONFLICT)
        self.assertTrue(decision.needs_input)
        self.assertIn("deleted", decision.detail.lower())

    def test_they_deleted_it_we_edited_it(self) -> None:
        base = board(footprint("fp-1"), footprint("fp-2"))
        ours = board(footprint("fp-1", x=99.0), footprint("fp-2"))
        theirs = board(footprint("fp-2"))

        decision = by_kind(m3.diff3_pcb(base, ours, theirs), "footprint")[0]
        self.assertEqual(decision.classification, m3.CONFLICT)

    def test_defaults_to_ours_so_a_blind_accept_never_deletes(self) -> None:
        # Taking the default must never be the destructive choice.
        base = board(footprint("fp-1"), footprint("fp-2"))
        ours = board(footprint("fp-1", x=99.0), footprint("fp-2"))
        theirs = board(footprint("fp-2"))

        decision = by_kind(m3.diff3_pcb(base, ours, theirs), "footprint")[0]
        self.assertEqual(decision.default, "ours")


class GeometryKeys(unittest.TestCase):
    """Tracks have no uuid, so their key is their position. Same place != same object."""

    def test_two_nets_routed_through_one_place_is_a_collision(self) -> None:
        # Not a conflict: neither engineer edited the other's track. They independently
        # put different nets in the same spot. Picking one drops a real connection.
        base = board(nets=((1, "GND"), (2, "VCC")))
        ours = board(segment(0, 0, 10, 0, net=1), nets=((1, "GND"), (2, "VCC")))
        theirs = board(segment(0, 0, 10, 0, net=2), nets=((1, "GND"), (2, "VCC")))

        decision = by_kind(m3.diff3_pcb(base, ours, theirs), "segment")[0]
        self.assertEqual(decision.classification, m3.KEY_COLLISION)
        self.assertIn("both", decision.resolutions)
        self.assertEqual(decision.default, "both")

    def test_the_same_net_in_the_same_place_is_not_a_collision(self) -> None:
        # Both drew the identical track. Nothing to decide.
        base = board(nets=((1, "GND"),))
        drawn = board(segment(0, 0, 10, 0, net=1), nets=((1, "GND"),))
        decisions = by_kind(m3.diff3_pcb(base, drawn, drawn), "segment")
        for decision in decisions:
            self.assertNotEqual(decision.classification, m3.KEY_COLLISION)

    def test_a_track_added_by_one_side_only_is_not_a_collision(self) -> None:
        base = board(nets=((1, "GND"),))
        ours = board(segment(0, 0, 10, 0, net=1), nets=((1, "GND"),))
        decision = by_kind(m3.diff3_pcb(base, ours, base), "segment")[0]
        self.assertEqual(decision.classification, m3.ONLY_OURS)


class Summary(unittest.TestCase):
    """What the UI header reports before anything renders."""

    def test_counts_what_needs_a_human(self) -> None:
        base = board(footprint("fp-1", x=10.0), footprint("fp-2"))
        ours = board(footprint("fp-1", x=50.0), footprint("fp-2", x=1.0))
        theirs = board(footprint("fp-1", x=70.0), footprint("fp-2"))

        decisions = m3.diff3_pcb(base, ours, theirs)
        summary = m3.summarise(decisions)
        self.assertEqual(summary["total"], len(decisions))
        self.assertEqual(summary["needs_input"], 1)  # fp-1 only
        self.assertIn(m3.CONFLICT, summary["by_classification"])

    def test_an_unchanged_board_summarises_to_nothing(self) -> None:
        text = board(footprint("fp-1"))
        summary = m3.summarise(m3.diff3_pcb(text, text, text))
        self.assertEqual(summary["total"], 0)
        self.assertEqual(summary["needs_input"], 0)


class Serialisation(unittest.TestCase):
    """The decision list crosses to the browser, so it must be JSON-able."""

    def test_a_decision_round_trips_through_json(self) -> None:
        import json

        base = board(footprint("fp-1", x=10.0))
        ours = board(footprint("fp-1", x=50.0))
        theirs = board(footprint("fp-1", x=70.0))

        payload = [d.to_dict() for d in m3.diff3_pcb(base, ours, theirs)]
        restored = json.loads(json.dumps(payload))
        self.assertEqual(restored[0]["classification"], m3.CONFLICT)
        self.assertIn("resolutions", restored[0])
        self.assertIn("needs_input", restored[0])


if __name__ == "__main__":
    unittest.main()

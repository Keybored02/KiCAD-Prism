"""Deciding that two objects are the same object, when the uuid does not say so.

This module guesses, and everything else in the merge feature refuses to. That makes the
tests here unusual: most of them are about what must NOT match. A wrong pairing splices
the wrong object into somebody's board, and no later gate catches it - the file parses,
passes integrity, and opens in KiCad. It is simply not their board.

Two properties carry most of that safety and both come from KiCad's own engine:

  - an object with no identifying properties can never reach the threshold
  - scoring is symmetric, so the answer cannot depend on which file was read first
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import identity_match as im  # noqa: E402


def footprint(key: str, x=10.0, y=20.0, lib_id="Lib:R_0805", ref="R1") -> dict:
    return {
        "type": "footprint",
        "uuid": key,
        "x": x,
        "y": y,
        "lib_id": lib_id,
        "reference": ref,
    }


def track(key: str, net="GND", layer="F.Cu", x=0.0, y=0.0) -> dict:
    return {
        "type": "segment",
        "uuid": key,
        "x": x,
        "y": y,
        "net_name": net,
        "layer": layer,
        "start_x": x,
        "start_y": y,
        "end_x": x + 5,
        "end_y": y,
    }


class WhatMustNotMatch(unittest.TestCase):
    """The direction that matters. A false match is unrecoverable."""

    def test_an_object_with_no_identifying_properties_never_matches(self) -> None:
        # Position and bbox together reach only 0.60, under the 0.85 threshold. This is
        # deliberate: two unrelated graphics at the same coordinates would otherwise
        # match at the maximum possible score.
        bare = {"type": "gr_line", "uuid": "a", "x": 5.0, "y": 5.0}
        matches = im.reconcile(
            [im.describe("a", bare)], [im.describe("b", dict(bare, uuid="b"))]
        )
        self.assertEqual(matches, [])

    def test_different_types_never_match(self) -> None:
        a = im.describe("a", footprint("a"))
        b = im.describe("b", {"type": "zone", "uuid": "b", "x": 10.0, "y": 20.0})
        self.assertEqual(im.score(a, b), 0.0)

    def test_a_different_part_in_the_same_place_does_not_match(self) -> None:
        # Same coordinates, different library part. Someone swapped a resistor for a
        # capacitor; that is a delete and an add, not a move.
        a = im.describe("a", footprint("a", lib_id="Lib:R_0805", ref="R1"))
        b = im.describe("b", footprint("b", lib_id="Lib:C_0603", ref="C1"))
        self.assertLess(im.score(a, b), im.THRESHOLD)

    def test_the_same_part_somewhere_else_does_not_match(self) -> None:
        # Same library id and reference, but metres away. Without positional agreement
        # this is not enough: two identical decoupling caps are not the same object.
        a = im.describe("a", footprint("a", x=10.0, y=20.0))
        b = im.describe("b", footprint("b", x=900.0, y=900.0))
        self.assertLess(im.score(a, b), im.THRESHOLD)

    def test_two_tracks_crossing_in_an_x_are_not_the_same_track(self) -> None:
        # Found on a real 9MB board: the ONLY false match in 39.8 million pairs. Two
        # tracks forming an X share a net, a layer, a midpoint and a bounding box, so a
        # box-based comparison scored them a perfect match. Comparing endpoints instead
        # of the box around them is what separates them.
        a = {
            "type": "segment",
            "x": 93.0,
            "y": 108.825,
            "start_x": 91.8,
            "start_y": 107.625,
            "end_x": 94.2,
            "end_y": 110.025,
            "layer": "F.Cu",
            "net_name": "GND",
        }
        b = dict(a, start_y=110.025, end_y=107.625)  # the other diagonal

        self.assertLess(
            im.score(im.describe("a", a), im.describe("b", b)), im.THRESHOLD
        )

    def test_the_same_track_drawn_backwards_still_matches(self) -> None:
        # The other half of the endpoint fix: direction carries no meaning, so A-to-B
        # and B-to-A must be recognised as one track.
        a = {
            "type": "segment",
            "x": 93.0,
            "y": 108.825,
            "start_x": 91.8,
            "start_y": 107.625,
            "end_x": 94.2,
            "end_y": 110.025,
            "layer": "F.Cu",
            "net_name": "GND",
        }
        backwards = dict(
            a,
            start_x=a["end_x"],
            start_y=a["end_y"],
            end_x=a["start_x"],
            end_y=a["start_y"],
        )

        self.assertEqual(
            im.score(im.describe("a", a), im.describe("b", backwards)), 1.0
        )

    def test_a_missing_property_is_not_agreement(self) -> None:
        # Two footprints that both lack a reference have not agreed about anything. The
        # blank is dropped rather than recorded, so it cannot count towards a match.
        a = im.describe("a", footprint("a", ref=""))
        b = im.describe("b", footprint("b", ref=""))

        self.assertEqual(len(a.key_props), 1, "the blank reference must be dropped")
        self.assertEqual(a.key_props, b.key_props)
        self.assertEqual(im._key_prop_overlap((), ()), 0.0)


class WhatShouldMatch(unittest.TestCase):
    """The case this module exists for: a uuid that churned."""

    def test_the_same_footprint_with_a_new_uuid_is_recovered(self) -> None:
        # Everything about it is identical except the uuid. Reporting this as a delete
        # plus an add loses the history of a part nobody touched.
        matches = im.reconcile(
            [im.describe("old-uuid", footprint("old-uuid"))],
            [im.describe("new-uuid", footprint("new-uuid"))],
        )
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0].ours_key, "old-uuid")
        self.assertEqual(matches[0].theirs_key, "new-uuid")

    def test_a_track_matches_on_net_and_layer(self) -> None:
        matches = im.reconcile(
            [im.describe("t1", track("t1"))], [im.describe("t2", track("t2"))]
        )
        self.assertEqual(len(matches), 1)

    def test_a_track_on_a_different_net_does_not(self) -> None:
        a = im.describe("t1", track("t1", net="GND"))
        b = im.describe("t2", track("t2", net="+5V"))
        self.assertLess(im.score(a, b), im.THRESHOLD)


class Symmetry(unittest.TestCase):
    """The answer must not depend on which file was read first."""

    def test_scoring_is_symmetric(self) -> None:
        a = im.describe("a", footprint("a"))
        b = im.describe("b", footprint("b", ref="R2"))
        self.assertEqual(im.score(a, b), im.score(b, a))

    def test_overlap_uses_max_not_min(self) -> None:
        # A set that is a strict subset of the other must not score as a full match:
        # min() would call one shared property out of three "perfect agreement".
        one = (("lib_id", "Lib:R"),)
        three = (("lib_id", "Lib:R"), ("reference", "R1"), ("value", "10k"))
        self.assertAlmostEqual(im._key_prop_overlap(one, three), 1 / 3)
        self.assertAlmostEqual(im._key_prop_overlap(three, one), 1 / 3)

    def test_reconciling_is_order_independent(self) -> None:
        ours = [
            im.describe("a", footprint("a", x=0.0, ref="R1")),
            im.describe("b", footprint("b", x=50.0, ref="R2")),
        ]
        theirs = [
            im.describe("x", footprint("x", x=0.0, ref="R1")),
            im.describe("y", footprint("y", x=50.0, ref="R2")),
        ]

        forward = im.reconcile(ours, theirs)
        reversed_input = im.reconcile(list(reversed(ours)), list(reversed(theirs)))
        self.assertEqual(
            {(m.ours_key, m.theirs_key) for m in forward},
            {(m.ours_key, m.theirs_key) for m in reversed_input},
        )


class BestFirst(unittest.TestCase):
    """Global best-first, not per-item greedy."""

    def test_the_better_pairing_wins_over_input_order(self) -> None:
        # "a" is considered first and is a passable match for BOTH candidates, but "b"
        # is a perfect match for one of them. Per-item greedy would let "a" take it and
        # leave "b" unmatched; sorting globally gives each its best partner.
        ours = [
            im.describe("a", footprint("a", x=0.0, ref="R1")),
            im.describe("b", footprint("b", x=0.0, ref="R2")),
        ]
        theirs = [
            im.describe("y", footprint("y", x=0.0, ref="R2")),
            im.describe("z", footprint("z", x=0.0, ref="R1")),
        ]

        pairs = {(m.ours_key, m.theirs_key) for m in im.reconcile(ours, theirs)}
        self.assertIn(("a", "z"), pairs)
        self.assertIn(("b", "y"), pairs)

    def test_nothing_is_matched_twice(self) -> None:
        ours = [im.describe("a", footprint("a"))]
        theirs = [
            im.describe("x", footprint("x")),
            im.describe("y", footprint("y")),
        ]
        matches = im.reconcile(ours, theirs)
        self.assertEqual(len(matches), 1)

    def test_results_are_deterministic(self) -> None:
        ours = [im.describe(k, footprint(k)) for k in ("a", "b")]
        theirs = [im.describe(k, footprint(k)) for k in ("x", "y")]
        first = im.reconcile(ours, theirs)
        second = im.reconcile(ours, theirs)
        self.assertEqual(
            [(m.ours_key, m.theirs_key) for m in first],
            [(m.ours_key, m.theirs_key) for m in second],
        )


class Inferring(unittest.TestCase):
    """The entry point the merge engine calls."""

    def test_only_the_given_keys_are_considered(self) -> None:
        # The caller passes what the exact pass could not match. A uuid match must never
        # be second-guessed here.
        ours_items = {"a": footprint("a"), "matched": footprint("matched", x=99.0)}
        theirs_items = {"x": footprint("x"), "matched": footprint("matched", x=99.0)}

        matches = im.infer(ours_items, theirs_items, ["a"], ["x"])
        self.assertEqual(len(matches), 1)
        self.assertEqual((matches[0].ours_key, matches[0].theirs_key), ("a", "x"))

    def test_a_missing_key_is_skipped_not_raised(self) -> None:
        matches = im.infer({"a": footprint("a")}, {}, ["a", "gone"], ["nope"])
        self.assertEqual(matches, [])

    def test_nothing_to_match_is_not_an_error(self) -> None:
        self.assertEqual(im.infer({}, {}, [], []), [])


class OnRealBoards(unittest.TestCase):
    """Against what KiCad actually writes."""

    def test_a_real_footprint_gets_useful_key_properties(self) -> None:
        from app.services import pcb_diff_service as pcb

        board = (
            Path(__file__).resolve().parents[2]
            / "data"
            / "projects"
            / "type1"
            / "test board"
            / "Git test.kicad_pcb"
        )
        if not board.is_file():
            self.skipTest("no sample board checked out")

        items = pcb._extract_all_pcb(pcb._parse_sexp(board.read_text(encoding="utf-8")))
        footprints = [i for i in items.values() if i["type"] == "footprint"]
        self.assertTrue(footprints)

        descriptor = im.describe(footprints[0]["uuid"], footprints[0])
        names = {name for name, _ in descriptor.key_props}
        self.assertIn("lib_id", names)

    def test_no_two_distinct_objects_on_a_real_board_match(self) -> None:
        """The check that matters most, over every type rather than just footprints.

        Every distinct pair of same-type objects on a real board is a pair we know is
        NOT the same object, because they coexist in one file. Any score above the
        threshold is a false positive we would act on.

        The full sweep over four boards is 74 million pairs and takes minutes, so the
        committed test uses the small board. The X-crossing case above is the one real
        failure that sweep found, kept as a unit test so it cannot come back.
        """
        from app.services import pcb_diff_service as pcb

        board = (
            Path(__file__).resolve().parents[2]
            / "data"
            / "projects"
            / "type1"
            / "test board"
            / "Git test.kicad_pcb"
        )
        if not board.is_file():
            self.skipTest("no sample board checked out")

        items = pcb._extract_all_pcb(pcb._parse_sexp(board.read_text(encoding="utf-8")))

        by_type: dict[str, list] = {}
        for key, item in items.items():
            by_type.setdefault(item["type"], []).append(im.describe(key, item))

        for kind, group in by_type.items():
            for i, a in enumerate(group):
                for b in group[i + 1 :]:
                    self.assertLess(
                        im.score(a, b),
                        im.THRESHOLD,
                        f"two different {kind} objects would be matched as one: "
                        f"{a.key} and {b.key}",
                    )


class InTheMergeEngine(unittest.TestCase):
    """What the fallback does once it is wired into a real three-way diff."""

    def board(self, *footprints: str) -> str:
        return "(kicad_pcb\n\t(version 20241229)\n" + "".join(footprints) + ")\n"

    def part(self, uuid: str, ref: str = "R1", x: float = 10.0) -> str:
        return (
            '\t(footprint "Lib:R_0805"\n'
            f'\t\t(uuid "{uuid}")\n'
            f"\t\t(at {x} 20)\n"
            '\t\t(layer "F.Cu")\n'
            f'\t\t(property "Reference" "{ref}"\n'
            f'\t\t\t(at 0 0 0)\n\t\t\t(uuid "p-{uuid}")\n\t\t)\n'
            "\t)\n"
        )

    def test_a_churned_uuid_becomes_one_decision_not_two(self) -> None:
        from app.services import merge3_service as m3

        # Identical part, new id. Without the fallback this is a delete plus an
        # unrelated add, and the reader loses the history of a part nobody moved.
        base = self.board(self.part("old-id"))
        theirs = self.board(self.part("new-id"))

        decisions = [
            d for d in m3.diff3_pcb(base, base, theirs) if d.kind == "footprint"
        ]
        self.assertEqual(len(decisions), 1)
        self.assertTrue(decisions[0].inferred_identity)

    def test_an_inferred_identity_always_asks(self) -> None:
        from app.services import merge3_service as m3

        base = self.board(self.part("old-id"))
        theirs = self.board(self.part("new-id"))

        decision = next(
            d for d in m3.diff3_pcb(base, base, theirs) if d.kind == "footprint"
        )
        self.assertTrue(
            decision.needs_input,
            "an identity we worked out ourselves must be confirmed by a person",
        )
        self.assertIn("same object", decision.detail)

    def test_genuinely_different_parts_are_not_paired(self) -> None:
        from app.services import merge3_service as m3

        # A resistor removed and a capacitor added elsewhere. Two events, not one.
        base = self.board(self.part("r-1", ref="R1", x=10.0))
        theirs = self.board(
            '\t(footprint "Lib:C_0603"\n'
            '\t\t(uuid "c-1")\n'
            "\t\t(at 90 90)\n"
            '\t\t(layer "F.Cu")\n'
            '\t\t(property "Reference" "C1"\n'
            '\t\t\t(at 0 0 0)\n\t\t\t(uuid "p-c-1")\n\t\t)\n'
            "\t)\n"
        )

        decisions = [
            d for d in m3.diff3_pcb(base, base, theirs) if d.kind == "footprint"
        ]
        self.assertEqual(len(decisions), 2)
        self.assertFalse(any(d.inferred_identity for d in decisions))

    def test_the_pairing_is_reported_for_review(self) -> None:
        from app.services import merge3_service as m3

        base = self.board(self.part("old-id"))
        theirs = self.board(self.part("new-id"))

        payload = next(
            d.to_dict()
            for d in m3.diff3_pcb(base, base, theirs)
            if d.kind == "footprint"
        )
        self.assertTrue(payload["inferred_identity"])
        self.assertEqual(payload["inferred_from"], "new-id")
        self.assertGreaterEqual(payload["inferred_score"], im.THRESHOLD)


if __name__ == "__main__":
    unittest.main()

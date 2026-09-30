"""The ways a merge can discard somebody's work without saying so.

These are the failures that do not look like failures. Every other gate in the feature
catches a BROKEN board: it will not parse, or it fails integrity, or KiCad refuses to
open it. Nothing catches a board that is merely WRONG - one that opens perfectly and is
missing an edit somebody made.

All three cases here were found by reading KiCad's own native merge engine (commit
a00c25e5, May 2026) against ours. Their comments name the traps; these tests prove we
fall into them.
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import merge3_service as m3  # noqa: E402


class StaleBaseline(unittest.TestCase):
    """When the two sides disagree about what the ancestor was.

    KiCad's comment on the guard we are missing:

        "The no-op detectors require matching `before` values on both sides; without
        that check a stale baseline (e.g., theirs computed against a different
        ancestor) would silently override a real edit on the other side."
    """

    def test_disagreeing_baselines_never_discard_an_edit(self) -> None:
        # Ours genuinely moved the part (10 -> 50). Theirs did not touch it, but
        # recorded a different ancestor value (99). Judged against THEIRS' baseline,
        # our real edit looks like the losing side of a no-op and vanishes.
        ours_base = {"type": "footprint", "x": 10.0}
        theirs_base = {"type": "footprint", "x": 99.0}
        ours = {"type": "footprint", "x": 50.0}
        theirs = {"type": "footprint", "x": 99.0}

        overlap = m3._overlapping_fields(
            ours_base, ours, theirs, ["x"], theirs_base=theirs_base
        )
        self.assertIn(
            "x",
            overlap,
            "the sides disagree about the ancestor, so this must reach a human",
        )

    def test_agreeing_baselines_still_auto_merge(self) -> None:
        # The guard must not make everything a conflict. When both sides agree on the
        # ancestor and one of them did not move, there is nothing to arbitrate.
        base = {"type": "footprint", "x": 10.0}
        ours = {"type": "footprint", "x": 10.0}
        theirs = {"type": "footprint", "x": 50.0}

        self.assertEqual(
            m3._overlapping_fields(base, ours, theirs, ["x"], theirs_base=base), {}
        )

    def test_a_real_disagreement_is_still_a_conflict(self) -> None:
        base = {"type": "footprint", "x": 10.0}
        ours = {"type": "footprint", "x": 50.0}
        theirs = {"type": "footprint", "x": 70.0}

        overlap = m3._overlapping_fields(base, ours, theirs, ["x"], theirs_base=base)
        self.assertIn("x", overlap)

    def test_a_missing_baseline_is_not_treated_as_agreement(self) -> None:
        # No ancestor record at all. We cannot prove either side is a no-op, so we
        # must not assume it.
        ours = {"type": "footprint", "x": 10.0}
        theirs = {"type": "footprint", "x": 99.0}

        overlap = m3._overlapping_fields(None, ours, theirs, ["x"], theirs_base=None)
        self.assertIn("x", overlap)


class UndescribableChange(unittest.TestCase):
    """A difference we detected but cannot name.

    KiCad's comment:

        "A coarse MODIFIED record with no property deltas and no child edits means the
        change was caught by semantic operator== alone - something PROPERTY_MANAGER
        cannot serialize. Resolving as MERGE_PROPS with zero props would silently lose
        that change; flag a conflict instead."
    """

    def test_both_changed_with_no_nameable_field_is_not_agreement(self) -> None:
        # The diff engine says both sides edited this. Every field we know how to
        # compare agrees. Something changed that our comparable-key list cannot see,
        # and calling it "both made the same change" throws one side away.
        item = {"type": "footprint", "x": 1.0, "reference": "R1"}

        decision = m3._classify(
            key="fp-1",
            kind="footprint",
            ours_action=m3.CHANGED,
            theirs_action=m3.CHANGED,
            base_item=dict(item),
            ours_item=dict(item),
            theirs_item=dict(item),
            comparable=["x", "reference"],
        )

        self.assertNotEqual(
            decision.classification,
            m3.BOTH_SAME,
            "a change we cannot describe must not be resolved as agreement",
        )
        self.assertTrue(decision.needs_input)

    def test_it_says_why_rather_than_showing_a_bare_conflict(self) -> None:
        item = {"type": "footprint", "x": 1.0}
        decision = m3._classify(
            key="fp-1",
            kind="footprint",
            ours_action=m3.CHANGED,
            theirs_action=m3.CHANGED,
            base_item=dict(item),
            ours_item=dict(item),
            theirs_item=dict(item),
            comparable=["x"],
        )
        self.assertEqual(decision.classification, m3.UNDESCRIBABLE)
        self.assertTrue(decision.detail)

    def test_one_sided_changes_are_unaffected(self) -> None:
        # Only one side acted, so there is nothing to lose by taking it.
        item = {"type": "footprint", "x": 1.0}
        decision = m3._classify(
            key="fp-1",
            kind="footprint",
            ours_action=m3.CHANGED,
            theirs_action=m3.KEPT,
            base_item=dict(item),
            ours_item=dict(item),
            theirs_item=dict(item),
            comparable=["x"],
        )
        self.assertEqual(decision.classification, m3.ONLY_OURS)

    def test_a_genuinely_identical_edit_is_still_agreement(self) -> None:
        # Both sides made the SAME describable change. That really is agreement, and
        # the fix must not turn it into a conflict.
        base = {"type": "footprint", "x": 1.0}
        moved = {"type": "footprint", "x": 9.0}
        decision = m3._classify(
            key="fp-1",
            kind="footprint",
            ours_action=m3.CHANGED,
            theirs_action=m3.CHANGED,
            base_item=base,
            ours_item=dict(moved),
            theirs_item=dict(moved),
            comparable=["x"],
        )
        self.assertEqual(decision.classification, m3.BOTH_SAME)


class UncomparableType(unittest.TestCase):
    """An item type we have no comparable keys for.

    Latent rather than live: every type the extractor emits is covered today. But
    `comparable_keys.get(kind, [])` means a new or renamed type silently becomes
    uncomparable, and every change to it would read as agreement. It fails in the
    quiet direction, which is the same class of bug as the one above.
    """

    def test_an_unknown_type_does_not_auto_resolve(self) -> None:
        decision = m3._classify(
            key="x-1",
            kind="some_future_type",
            ours_action=m3.CHANGED,
            theirs_action=m3.CHANGED,
            base_item={"type": "some_future_type"},
            ours_item={"type": "some_future_type"},
            theirs_item={"type": "some_future_type"},
            comparable=[],  # what .get(kind, []) returns for an unknown type
        )
        self.assertNotEqual(decision.classification, m3.BOTH_SAME)
        self.assertTrue(decision.needs_input)

    def test_the_whole_pipeline_covers_every_type_it_emits(self) -> None:
        # The guard above is the safety net; this is the check that we do not need it.
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
        emitted = {item["type"] for item in items.values()}
        uncovered = emitted - set(pcb._PCB_COMPARABLE_KEYS)
        self.assertEqual(
            uncovered, set(), f"these types would be uncomparable: {sorted(uncovered)}"
        )


if __name__ == "__main__":
    unittest.main()

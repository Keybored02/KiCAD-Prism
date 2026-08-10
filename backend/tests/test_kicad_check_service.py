"""Asking KiCad whether a merged design is sound.

The design decision worth guarding here is that the DRC gate is a DELTA. The sample board
in this repo carries 17 warnings right now, and real boards carry violations for long
stretches of a design. An absolute check would block every merge on every board, which
teaches people to click through the gate, which is worse than having no gate.

The other property is asymmetry: a file KiCad cannot open is unconditionally fatal, while
electrical violations are reportable. Someone can fix a DRC error after merging. Nobody
can fix a board that will not load, because they cannot open it.

Tests that need kicad-cli skip when it is absent rather than failing, so the suite still
runs on a machine without KiCad.
"""

from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import kicad_check_service as kc  # noqa: E402
from app.services import sexp_splice as sp  # noqa: E402
from app.services import span_index as si  # noqa: E402

BOARD = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "projects"
    / "type1"
    / "test board"
    / "Git test.kicad_pcb"
)


def violation(kind="track_dangling", severity=kc.WARNING, uuid="u1", pos=(1.0, 2.0)):
    return kc.Violation(
        kind=kind,
        severity=severity,
        description="",
        uuids=(uuid,),
        positions=(pos,),
    )


def result(*violations, ran=True):
    return kc.CheckResult(
        ran=ran,
        ok=not any(v.severity == kc.ERROR for v in violations),
        violations=list(violations),
    )


class TheGateIsADelta(unittest.TestCase):
    """Only what the merge ADDED. Pure logic, no kicad-cli needed."""

    def test_pre_existing_violations_do_not_block(self) -> None:
        # The whole point. This board was already failing; that is not the merge's fault.
        existing = violation(uuid="already-broken", severity=kc.ERROR)
        gate = kc.gate(result(existing), result(existing))

        self.assertFalse(gate.blocked)
        self.assertEqual(gate.new_errors, [])
        self.assertEqual(gate.pre_existing, 1)

    def test_a_new_error_blocks(self) -> None:
        gate = kc.gate(result(), result(violation(severity=kc.ERROR)))
        self.assertTrue(gate.blocked)
        self.assertEqual(len(gate.new_errors), 1)

    def test_a_new_warning_does_not_block(self) -> None:
        gate = kc.gate(result(), result(violation(severity=kc.WARNING)))
        self.assertFalse(gate.blocked)
        self.assertEqual(len(gate.new_warnings), 1)

    def test_fixing_a_violation_is_not_a_regression(self) -> None:
        gate = kc.gate(result(violation(severity=kc.ERROR)), result())
        self.assertFalse(gate.blocked)
        self.assertEqual(gate.new_errors, [])

    def test_a_new_violation_among_old_ones_is_still_caught(self) -> None:
        old = violation(uuid="old")
        gate = kc.gate(
            result(old),
            result(old, violation(uuid="new", severity=kc.ERROR)),
        )
        self.assertTrue(gate.blocked)
        self.assertEqual(len(gate.new_errors), 1)
        self.assertEqual(gate.pre_existing, 1)

    def test_reordered_findings_are_not_new(self) -> None:
        # KiCad reorders its report between runs. Comparing by list index would call
        # every violation new the moment one earlier in the list was fixed.
        first, second = violation(uuid="a"), violation(uuid="b")
        gate = kc.gate(result(first, second), result(second, first))
        self.assertEqual(gate.new_warnings, [])
        self.assertEqual(gate.pre_existing, 2)

    def test_the_same_rule_at_a_different_place_is_new(self) -> None:
        # Same kind, different object: a real second occurrence, not the same one.
        gate = kc.gate(
            result(violation(uuid="here")),
            result(violation(uuid="there")),
        )
        self.assertEqual(len(gate.new_warnings), 1)

    def test_everything_is_new_when_the_baseline_could_not_run(self) -> None:
        # Over-reporting is recoverable by a human; under-reporting is not.
        gate = kc.gate(
            kc.CheckResult(ran=False, ok=True),
            result(violation(severity=kc.ERROR)),
        )
        self.assertTrue(gate.blocked)
        self.assertIn("compare", gate.detail.lower())

    def test_a_check_that_did_not_run_neither_blocks_nor_lies(self) -> None:
        gate = kc.gate(result(), kc.CheckResult(ran=False, ok=True, detail="no kicad"))
        self.assertFalse(gate.ran)
        self.assertFalse(gate.blocked)


class Fingerprints(unittest.TestCase):
    """What makes two findings across two runs the same finding."""

    def test_position_is_rounded(self) -> None:
        # Floating point output is not bit stable between runs.
        a = violation(pos=(1.00000001, 2.0))
        b = violation(pos=(1.00000002, 2.0))
        self.assertEqual(a.fingerprint, b.fingerprint)

    def test_severity_is_not_part_of_identity(self) -> None:
        # A rule promoted from warning to error is the same violation, and should not
        # read as one disappearing and another appearing.
        a = violation(severity=kc.WARNING)
        b = violation(severity=kc.ERROR)
        self.assertEqual(a.fingerprint, b.fingerprint)

    def test_different_uuids_are_different_findings(self) -> None:
        self.assertNotEqual(
            violation(uuid="a").fingerprint, violation(uuid="b").fingerprint
        )


class WithoutKiCad(unittest.TestCase):
    """A machine with no KiCad installed must not be blocked from merging."""

    def test_can_open_reports_it_could_not_check(self) -> None:
        # Not ok=True: the caller must say validation was SKIPPED, not that it passed.
        original = kc.kicad_cli.resolve_optional
        kc.kicad_cli.resolve_optional = lambda: None
        try:
            outcome = kc.can_open(BOARD if BOARD.is_file() else __file__)
            self.assertFalse(outcome.ran)
            self.assertFalse(outcome.ok)
        finally:
            kc.kicad_cli.resolve_optional = original

    def test_drc_does_not_block_when_kicad_is_missing(self) -> None:
        if not BOARD.is_file():
            self.skipTest("no sample board checked out")
        original = kc.kicad_cli.resolve_optional
        kc.kicad_cli.resolve_optional = lambda: None
        try:
            outcome = kc.drc(BOARD)
            self.assertFalse(outcome.ran)
            self.assertTrue(outcome.ok, "a missing optional tool must not fail a merge")
        finally:
            kc.kicad_cli.resolve_optional = original

    def test_a_missing_file_is_reported_not_raised(self) -> None:
        outcome = kc.can_open(Path(tempfile.gettempdir()) / "nope.kicad_pcb")
        self.assertFalse(outcome.ran)
        self.assertFalse(outcome.ok)

    def test_an_unsupported_extension_is_declined(self) -> None:
        outcome = kc.can_open(__file__)
        self.assertFalse(outcome.ran)


class AgainstRealKiCad(unittest.TestCase):
    """The parts only KiCad can answer. Slow, and skipped without it."""

    @classmethod
    def setUpClass(cls) -> None:
        if not kc.available():
            raise unittest.SkipTest("kicad-cli is not installed")
        if not BOARD.is_file():
            raise unittest.SkipTest("no sample board checked out")
        cls.tmp = Path(tempfile.mkdtemp())
        cls.good = cls.tmp / "good.kicad_pcb"
        shutil.copy(BOARD, cls.good)

    @classmethod
    def tearDownClass(cls) -> None:
        shutil.rmtree(getattr(cls, "tmp", ""), ignore_errors=True)

    def test_kicad_opens_a_real_board(self) -> None:
        outcome = kc.can_open(self.good)
        self.assertTrue(outcome.ran)
        self.assertTrue(outcome.ok, outcome.detail)

    def test_kicad_refuses_a_truncated_board(self) -> None:
        # The failure this feature must never produce. One missing paren is enough.
        text = self.good.read_text(encoding="utf-8")
        broken = self.tmp / "broken.kicad_pcb"
        broken.write_text(text[: text.rindex(")")], encoding="utf-8")

        outcome = kc.can_open(broken)
        self.assertTrue(outcome.ran)
        self.assertFalse(outcome.ok)

    def test_the_failure_names_the_real_problem(self) -> None:
        # kicad-cli prints an ANSI-coloured deprecation notice alongside the real error.
        # Showing that to someone whose merge just failed would bury the reason.
        text = self.good.read_text(encoding="utf-8")
        broken = self.tmp / "broken2.kicad_pcb"
        broken.write_text(text[: text.rindex(")")], encoding="utf-8")

        detail = kc.can_open(broken).detail
        self.assertNotIn("\x1b", detail)
        self.assertNotIn("deprecated", detail.lower())
        self.assertIn("load", detail.lower())

    def test_drc_runs_and_reports_findings(self) -> None:
        outcome = kc.drc(self.good)
        self.assertTrue(outcome.ran, outcome.detail)

    def test_an_unchanged_board_introduces_nothing(self) -> None:
        # The delta property, end to end against real KiCad: this board has real
        # warnings, and none of them may be blamed on a merge that changed nothing.
        baseline = kc.drc(self.good)
        self.assertTrue(baseline.ran)

        copy = self.tmp / "copy.kicad_pcb"
        shutil.copy(self.good, copy)

        gate = kc.gate(baseline, kc.drc(copy))
        self.assertFalse(gate.blocked)
        self.assertEqual(gate.new_errors, [])
        self.assertEqual(gate.new_warnings, [])
        self.assertEqual(gate.pre_existing, len(baseline.violations))

    def test_deleting_a_footprint_is_reported_as_new(self) -> None:
        baseline = kc.drc(self.good)
        text = self.good.read_text(encoding="utf-8")
        _, index = si.build_pcb_index(text)
        footprints = sorted(
            (a for a in index.values() if a.kind == "footprint"),
            key=lambda a: a.offset,
        )
        self.assertTrue(footprints)

        damaged = self.tmp / "damaged.kicad_pcb"
        damaged.write_text(
            sp.apply_edits(
                text, [sp.delete(footprints[0].offset, footprints[0].end_offset, text)]
            ),
            encoding="utf-8",
        )

        gate = kc.gate(baseline, kc.drc(damaged))
        self.assertTrue(
            gate.new_errors or gate.new_warnings,
            "removing a footprint should introduce a finding",
        )


if __name__ == "__main__":
    unittest.main()

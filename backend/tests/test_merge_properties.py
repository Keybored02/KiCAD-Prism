"""The evidence for "a merge can never write a broken file".

The unit tests elsewhere check cases someone thought of. These check the claim itself,
over randomised staging on real boards, because the dangerous combinations are the ones
nobody would think to write down: take this footprint but not its silk, this track but
not the net it belongs to, this deletion and that edit together.

Randomised but SEEDED. A property test that fails once and then cannot be reproduced is
worse than no test, so every subset here is derived from a fixed seed and the seed is
reported on failure.

Two speeds:
  - structural properties run on every subset (pure, fast)
  - the KiCad-opens property runs on a handful, because each one is a subprocess

`hypothesis` is deliberately not a dependency. The generator here is a few lines and
this repo has no other use for it.
"""

from __future__ import annotations

import random
import re
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import kicad_check_service as kc  # noqa: E402
from app.services import merge3_service as m3  # noqa: E402
from app.services import merge_integrity as mi  # noqa: E402
from app.services import merge_patch_service as mp  # noqa: E402
from app.services import sexp_splice as sp  # noqa: E402
from app.services import span_index as si  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
BOARD = REPO / "data" / "projects" / "type1" / "test board" / "Git test.kicad_pcb"

SEED = 20260718
SUBSETS = 40
KICAD_SUBSETS = 3


def divergent(base: str, ours_drop: int, theirs_drop: int) -> tuple[str, str]:
    """Two boards that parted ways: each deleted a different footprint."""
    _, index = si.build_pcb_index(base)
    footprints = sorted(
        (a for a in index.values() if a.kind == "footprint"), key=lambda a: a.offset
    )
    ours = sp.apply_edits(
        base,
        [
            sp.delete(
                footprints[ours_drop].offset, footprints[ours_drop].end_offset, base
            )
        ],
    )
    theirs = sp.apply_edits(
        base,
        [
            sp.delete(
                footprints[theirs_drop].offset, footprints[theirs_drop].end_offset, base
            )
        ],
    )
    return ours, theirs


def _zone_outline(text: str) -> str:
    """A zone with its computed pour removed, leaving what the engineer drew.

    Everything up to the first `filled_polygon` is the outline, net, layer and fill
    settings; everything after is copper KiCad worked out for itself.

    Each pour is removed by matching its parens, rather than truncating at the first
    one. Truncating leaves the two sides cut at different depths - one mid-node, one at
    the zone's own closing paren - so the same outline compares unequal to itself.
    Whitespace is then collapsed, because removing a node legitimately changes the
    indentation around it without changing what it says.
    """
    parts = []
    i = 0
    while True:
        start = text.find("(filled_polygon", i)
        if start < 0:
            parts.append(text[i:])
            break
        parts.append(text[i:start])

        depth = 0
        j = start
        while j < len(text):
            if text[j] == "(":
                depth += 1
            elif text[j] == ")":
                depth -= 1
                if depth == 0:
                    j += 1
                    break
            j += 1
        i = j

    return re.sub(r"\s+", " ", "".join(parts)).strip()


def subsets(decisions: list, count: int, seed: int):
    """Deterministic random staging selections, plus the two extremes."""
    # noqa: S311 - generating test inputs, not keys. Seeded ON PURPOSE: a property
    # failure that cannot be reproduced is worse than no test at all.
    rng = random.Random(seed)  # noqa: S311
    yield []  # identity
    yield [mp.Staged(d.key, d.default) for d in decisions]  # everything, as defaulted

    for _ in range(count):
        chosen = [d for d in decisions if rng.random() < 0.5]
        yield [
            mp.Staged(d.key, rng.choice(d.resolutions) if d.resolutions else d.default)
            for d in chosen
        ]


class MergeProperties(unittest.TestCase):
    """Claims that must hold for ANY staging selection, not just chosen ones."""

    @classmethod
    def setUpClass(cls) -> None:
        if not BOARD.is_file():
            raise unittest.SkipTest("no sample board checked out")
        cls.base = BOARD.read_text(encoding="utf-8")
        cls.ours, cls.theirs = divergent(cls.base, 0, 5)
        cls.decisions = m3.diff3_pcb(cls.base, cls.ours, cls.theirs)

    def test_there_is_something_to_stage(self) -> None:
        # Guards the vacuous pass: every property below would hold trivially over an
        # empty decision list.
        self.assertGreater(len(self.decisions), 5)

    def test_any_subset_produces_a_parseable_board(self) -> None:
        """The central claim of the feature."""
        for number, staged in enumerate(subsets(self.decisions, SUBSETS, SEED)):
            with self.subTest(subset=number, seed=SEED, staged=len(staged)):
                result = mp.build_merged_pcb(
                    self.base, self.ours, self.theirs, staged, self.decisions
                )
                if not result.ok:
                    # A refusal is a legitimate outcome. What is NOT legitimate is
                    # returning text that does not parse.
                    self.assertIsNone(result.text, "a refused patch must carry no text")
                    continue
                self.assertIsNotNone(result.text)
                si.build_pcb_index(result.text)  # raises if unparseable

    def test_any_subset_produces_a_structurally_sound_board(self) -> None:
        for number, staged in enumerate(subsets(self.decisions, SUBSETS, SEED)):
            with self.subTest(subset=number, seed=SEED):
                result = mp.build_merged_pcb(
                    self.base, self.ours, self.theirs, staged, self.decisions
                )
                if not result.ok:
                    continue
                self.assertEqual(
                    mi.check_pcb(result.text),
                    [],
                    f"subset {number} (seed {SEED}) produced an unsound board",
                )

    def test_staging_nothing_is_always_ours_exactly(self) -> None:
        result = mp.build_merged_pcb(
            self.base, self.ours, self.theirs, [], self.decisions
        )
        self.assertTrue(result.ok, result.detail)
        self.assertEqual(result.text, self.ours)

    def test_unstaged_objects_keep_our_exact_bytes(self) -> None:
        """Corruption can only originate inside a range we spliced.

        "Unstaged" has to account for the tree in BOTH directions. A footprint whose silk
        line was staged legitimately changes, because the line lives inside the
        footprint's own byte range: staging a child rewrites part of its parent. The
        first version of this test only excluded nodes whose PARENT was staged, and
        correctly flagged a footprint with nine staged children as an unexplained change.

        ZONES are the one deliberate exception. Their copper pour is derived data,
        computed around the routing that existed when KiCad filled it, so ANY merge that
        moves copper invalidates every pour on the board. The builder clears them and
        lets KiCad recompute; keeping a pour that was poured around different traces
        would ship copper overlapping tracks it was never meant to touch. Their outline
        is still checked, because that IS the engineer's decision.
        """
        _, ours_index = si.build_pcb_index(self.ours)

        for number, staged in enumerate(subsets(self.decisions, 10, SEED + 1)):
            with self.subTest(subset=number, seed=SEED + 1):
                result = mp.build_merged_pcb(
                    self.base, self.ours, self.theirs, staged, self.decisions
                )
                if not result.ok:
                    continue

                touched = {item.key for item in staged}
                # A node is "involved" if it, its parent, or any of its children were
                # staged. Only the genuinely untouched must be byte-identical.
                involved = set(touched)
                for key in touched:
                    anchor = ours_index.get(key)
                    if anchor and anchor.parent_key:
                        involved.add(anchor.parent_key)

                _, merged_index = si.build_pcb_index(result.text)

                for key, anchor in ours_index.items():
                    if key in involved or anchor.parent_key in involved:
                        continue
                    merged = merged_index.get(key)
                    if merged is None:
                        continue  # a parent was replaced; not this property's business

                    if anchor.kind == "zone":
                        # The pour may be cleared (it is derived data the merge
                        # invalidates), but the OUTLINE is the engineer's decision and
                        # must survive byte for byte. A merge that applied no edits
                        # clears nothing, so the pour's presence is not asserted either
                        # way - only that it never CHANGES into a different pour, which
                        # would be copper nobody poured.
                        self.assertEqual(
                            _zone_outline(anchor.slice(self.ours)),
                            _zone_outline(merged.slice(result.text)),
                            f"{key}: the zone outline must not change",
                        )
                        after = merged.slice(result.text)
                        if "(filled_polygon" in after:
                            self.assertEqual(
                                anchor.slice(self.ours),
                                after,
                                f"{key}: a pour that survived must be ours, unaltered",
                            )
                        continue

                    self.assertEqual(
                        anchor.slice(self.ours),
                        merged.slice(result.text),
                        f"{key} was not staged but its bytes changed",
                    )

    def test_a_refusal_never_carries_text(self) -> None:
        # The invariant that makes a failed merge safe: a caller cannot write what does
        # not exist.
        for number, staged in enumerate(subsets(self.decisions, SUBSETS, SEED + 2)):
            with self.subTest(subset=number):
                result = mp.build_merged_pcb(
                    self.base, self.ours, self.theirs, staged, self.decisions
                )
                if not result.ok:
                    self.assertIsNone(result.text)

    def test_every_applied_decision_is_one_that_existed(self) -> None:
        keys = {d.key for d in self.decisions}
        for staged in subsets(self.decisions, 10, SEED + 3):
            result = mp.build_merged_pcb(
                self.base, self.ours, self.theirs, staged, self.decisions
            )
            for key in result.applied:
                self.assertIn(key, keys)


class KiCadOpensTheResult(unittest.TestCase):
    """The authoritative check, on a sample of subsets. One subprocess each."""

    @classmethod
    def setUpClass(cls) -> None:
        if not BOARD.is_file():
            raise unittest.SkipTest("no sample board checked out")
        if not kc.available():
            raise unittest.SkipTest("kicad-cli is not installed")
        cls.base = BOARD.read_text(encoding="utf-8")
        cls.ours, cls.theirs = divergent(cls.base, 0, 5)
        cls.decisions = m3.diff3_pcb(cls.base, cls.ours, cls.theirs)
        cls.tmp = Path(tempfile.mkdtemp())

    def test_sampled_subsets_open_in_kicad(self) -> None:
        sampled = list(subsets(self.decisions, KICAD_SUBSETS, SEED))
        for number, staged in enumerate(sampled):
            result = mp.build_merged_pcb(
                self.base, self.ours, self.theirs, staged, self.decisions
            )
            if not result.ok:
                continue

            with self.subTest(subset=number, seed=SEED):
                path = self.tmp / f"merged-{number}.kicad_pcb"
                path.write_text(result.text, encoding="utf-8")
                outcome = kc.can_open(path)
                self.assertTrue(
                    outcome.ok,
                    f"subset {number} (seed {SEED}) produced a board KiCad "
                    f"cannot open: {outcome.detail}",
                )


if __name__ == "__main__":
    unittest.main()

"""Locating objects in the bytes of a KiCad file, using the diff engine's own keys.

The parity tests here guard the worst failure mode semantic merge has. If a key is
derived even slightly differently from `pcb_diff_service`, a decision about object X
would splice object Y, and NOTHING would look wrong: the file parses, opens in KiCad,
and passes DRC. It would simply contain the wrong thing.

Every other corruption gate catches broken files. Only this catches wrong ones, so it
runs against real boards rather than fixtures, and it asserts exact equality in both
directions rather than "close enough".
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import pcb_diff_service as pcb  # noqa: E402
from app.services import span_index as si  # noqa: E402
from app.services.span_index import SpanIndexError  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
BOARDS = [
    REPO / "data" / "projects" / "type1" / "test board" / "Git test.kicad_pcb",
    REPO
    / "data"
    / "projects"
    / "type1"
    / "satnogs-comms-hardware"
    / "satnogs-comms.kicad_pcb",
]


def _boards() -> list[Path]:
    return [b for b in BOARDS if b.is_file()]


class KeyParity(unittest.TestCase):
    """The span index and the diff engine must agree on every key, exactly."""

    def test_keys_match_the_extractor_on_real_boards(self) -> None:
        boards = _boards()
        if not boards:
            self.skipTest("no sample boards checked out")

        for board in boards:
            with self.subTest(board=board.name):
                text = board.read_text(encoding="utf-8", errors="replace")
                _, index = si.build_pcb_index(text)
                items = pcb._extract_all_pcb(pcb._parse_sexp(text))

                missing = set(items) - set(index)
                self.assertFalse(
                    missing,
                    f"{len(missing)} objects the diff engine can name are not "
                    f"addressable: {sorted(missing)[:5]}",
                )

                extra = set(index) - set(items)
                self.assertFalse(
                    extra,
                    f"{len(extra)} keys the diff engine never produces: "
                    f"{sorted(extra)[:5]}",
                )

    def test_a_board_yields_a_useful_number_of_anchors(self) -> None:
        # Guards the silent-empty case: an indexer that returned {} would pass every
        # parity check above by vacuous agreement if the extractor also broke.
        boards = _boards()
        if not boards:
            self.skipTest("no sample boards checked out")
        _, index = si.build_pcb_index(
            boards[0].read_text(encoding="utf-8", errors="replace")
        )
        self.assertGreater(len(index), 50)


class Slicing(unittest.TestCase):
    """An anchor must address the exact bytes of its object."""

    def test_every_anchor_slices_to_a_balanced_expression(self) -> None:
        boards = _boards()
        if not boards:
            self.skipTest("no sample boards checked out")
        text = boards[0].read_text(encoding="utf-8", errors="replace")
        _, index = si.build_pcb_index(text)

        for key, anchor in index.items():
            fragment = anchor.slice(text)
            self.assertTrue(fragment.startswith("("), f"{key} does not start a node")
            self.assertTrue(fragment.endswith(")"), f"{key} does not end a node")
            self.assertEqual(
                fragment.count("("), fragment.count(")"), f"{key} is unbalanced"
            )

    def test_a_footprint_slice_names_its_library(self) -> None:
        boards = _boards()
        if not boards:
            self.skipTest("no sample boards checked out")
        text = boards[0].read_text(encoding="utf-8", errors="replace")
        _, index = si.build_pcb_index(text)

        footprints = [a for a in index.values() if a.kind == "footprint"]
        self.assertTrue(footprints)
        self.assertTrue(footprints[0].slice(text).startswith("(footprint"))

    def test_children_are_strictly_nested_in_their_parent(self) -> None:
        # This is what makes splicing composable: edits at different depths can be
        # applied in one pass because a child's range never escapes its parent's.
        boards = _boards()
        if not boards:
            self.skipTest("no sample boards checked out")
        text = boards[0].read_text(encoding="utf-8", errors="replace")
        _, index = si.build_pcb_index(text)

        checked = 0
        for anchor in index.values():
            if not anchor.parent_key:
                continue
            parent = index.get(anchor.parent_key)
            if parent is None:
                continue
            self.assertGreaterEqual(anchor.offset, parent.offset)
            self.assertLessEqual(anchor.end_offset, parent.end_offset)
            checked += 1
        self.assertGreater(checked, 0, "no parented anchors were checked")


class Keys(unittest.TestCase):
    """The synthesized geometry keys, which are the subtle ones."""

    def test_segment_direction_is_normalised(self) -> None:
        # A->B and B->A are the same track. Without this, redrawing a trace in the
        # opposite direction would read as a delete plus an add.
        forward = ["segment", ["start", "1.0", "2.0"], ["end", "3.0", "4.0"]]
        backward = ["segment", ["start", "3.0", "4.0"], ["end", "1.0", "2.0"]]
        self.assertEqual(si.segment_key(forward), si.segment_key(backward))

    def test_segment_key_excludes_the_net(self) -> None:
        # KiCad renumbers net indices on every footprint add/remove. If net were part
        # of identity, a renumber would read as every track being replaced.
        with_net = [
            "segment",
            ["start", "1.0", "2.0"],
            ["end", "3.0", "4.0"],
            ["net", "7"],
        ]
        without = ["segment", ["start", "1.0", "2.0"], ["end", "3.0", "4.0"]]
        self.assertEqual(si.segment_key(with_net), si.segment_key(without))

    def test_segment_key_includes_layer_and_width(self) -> None:
        base = ["segment", ["start", "1.0", "2.0"], ["end", "3.0", "4.0"]]
        top = base + [["layer", "F.Cu"]]
        bottom = base + [["layer", "B.Cu"]]
        self.assertNotEqual(si.segment_key(top), si.segment_key(bottom))

    def test_uuid_falls_back_to_tstamp(self) -> None:
        # KiCad 6 and earlier wrote tstamp. Those files still open, so dropping the
        # fallback would make merge silently skip every object in an older board.
        self.assertEqual(si._uuid(["footprint", ["tstamp", "abc"]]), "abc")
        self.assertEqual(si._uuid(["footprint", ["uuid", "xyz"]]), "xyz")

    def test_uuid_prefers_uuid_over_tstamp(self) -> None:
        node = ["footprint", ["tstamp", "old"], ["uuid", "new"]]
        self.assertEqual(si._uuid(node), "new")

    def test_net_table_maps_index_to_name(self) -> None:
        root = ["kicad_pcb", ["net", "0", ""], ["net", "1", "GND"], ["net", "2", "+5V"]]
        self.assertEqual(si.net_table(root), {"0": "", "1": "GND", "2": "+5V"})


class Rejection(unittest.TestCase):
    """Refuse to index what we cannot address."""

    def test_a_schematic_is_not_a_board(self) -> None:
        with self.assertRaises(SpanIndexError):
            si.build_pcb_index("(kicad_sch (version 20241229))")

    def test_a_board_is_not_a_schematic(self) -> None:
        with self.assertRaises(SpanIndexError):
            si.build_sch_index("(kicad_pcb (version 20241229))")

    def test_unparseable_text_is_refused(self) -> None:
        with self.assertRaises(SpanIndexError):
            si.build_pcb_index("(kicad_pcb (version 20241229)")  # unclosed

    def test_empty_text_is_refused(self) -> None:
        with self.assertRaises(SpanIndexError):
            si.build_pcb_index("")


class Schematics(unittest.TestCase):
    """The schematic side, which has no synthesized keys."""

    def test_symbols_and_wires_are_indexed(self) -> None:
        text = (
            "(kicad_sch\n"
            '\t(symbol (lib_id "Device:R") (uuid "sym-1"))\n'
            '\t(wire (pts (xy 0 0) (xy 10 0)) (uuid "wire-1"))\n'
            '\t(junction (at 5 0) (uuid "j-1"))\n'
            ")\n"
        )
        _, index = si.build_sch_index(text)
        self.assertIn("sym-1", index)
        self.assertIn("wire-1", index)
        self.assertIn("j-1", index)
        self.assertEqual(index["sym-1"].kind, "symbol")

    def test_a_real_schematic_indexes(self) -> None:
        candidates = sorted(
            (REPO / "data" / "projects").rglob("*.kicad_sch")
            if (REPO / "data" / "projects").is_dir()
            else []
        )
        if not candidates:
            self.skipTest("no sample schematics checked out")
        text = candidates[0].read_text(encoding="utf-8", errors="replace")
        _, index = si.build_sch_index(text)
        for key, anchor in index.items():
            fragment = anchor.slice(text)
            self.assertTrue(fragment.startswith("("), key)
            self.assertEqual(fragment.count("("), fragment.count(")"), key)


if __name__ == "__main__":
    unittest.main()

"""The ICD block-diagram layout (``systems/layout.py``), mirroring the canvas's tests."""

from __future__ import annotations

import unittest

from app.services.systems import icd
from app.services.systems import layout as system_layout


def instance(label: str, restricted: bool = False) -> dict:
    return {"id": f"sin_{label}", "label": label, "restricted": restricted, "projectName": label.lower(),
            "baselineCommit": "a" * 40, "trackedRef": "main", "pinned": False,
            # A redacted document nulls a restricted board's ports.
            **({"ports": None} if restricted else {})}


def link(lid: str, a: tuple[str, str], b: tuple[str, str], name: str = "") -> dict:
    def end(board, ref):
        return {"instanceId": f"sin_{board}", "port": {"portKey": f"{board}:{ref}", "reference": ref}}
    return {"id": lid, "name": name, "harness": None, "a": end(*a), "b": end(*b), "rows": []}


def document(instances: list[dict], links: list[dict]) -> dict:
    return {"system": {"name": "Stack", "description": ""}, "instances": instances, "links": links,
            "openReviewCount": 0, "validation": {"findings": [], "notEvaluated": []}}


JTYU = document(
    [instance("OBC-1"), instance("OBC-2"), instance("CMBD")],
    [link("l1", ("OBC-1", "J14"), ("CMBD", "J12")), link("l2", ("OBC-1", "J15"), ("CMBD", "J10")),
     link("l3", ("OBC-1", "J16"), ("CMBD", "J11")), link("l4", ("OBC-2", "J14"), ("CMBD", "J13")),
     link("l5", ("OBC-2", "J15"), ("CMBD", "J14")), link("l6", ("OBC-2", "J16"), ("CMBD", "J15"))],
)


class LayoutTest(unittest.TestCase):
    def test_hub_in_the_middle_with_neighbours_on_opposite_sides(self) -> None:
        boards, _ = system_layout.layout(JTYU)
        cmbd, one, two = boards["sin_CMBD"], boards["sin_OBC-1"], boards["sin_OBC-2"]
        self.assertEqual(cmbd.column, 0)
        self.assertEqual(sorted([one.column, two.column]), [-1, 1])
        self.assertLess(min(one.x, two.x), cmbd.x)
        self.assertGreater(max(one.x, two.x), cmbd.x)

    def test_only_linked_ports_are_rows_and_rows_name_their_partner(self) -> None:
        boards, _ = system_layout.layout(JTYU)
        self.assertEqual(sorted(r.reference for r in boards["sin_OBC-1"].rows), ["J14", "J15", "J16"])
        j12 = next(r for r in boards["sin_CMBD"].rows if r.reference == "J12")
        self.assertEqual([(p.board_label, p.reference) for p in j12.partners], [("OBC-1", "J14")])

    def test_jtyu_bundles_are_straight_and_never_cross(self) -> None:
        _, wires = system_layout.layout(JTYU)
        self.assertTrue(all(len(w.points) == 2 for w in wires))
        self.assertEqual(system_layout.crossings(wires), 0)

    def test_a_bundle_numbered_in_a_different_order_is_untangled(self) -> None:
        doc = document([instance("A"), instance("B")], [
            link("x", ("A", "J1"), ("B", "J4")), link("y", ("A", "J2"), ("B", "J3")),
            link("z", ("A", "J3"), ("B", "J1")), link("w", ("A", "J4"), ("B", "J2")),
        ])
        _, wires = system_layout.layout(doc)
        self.assertEqual(system_layout.crossings(wires), 0)

    def test_a_chain_of_boards_routes_through_lanes_without_crossing(self) -> None:
        doc = document([instance("A"), instance("B"), instance("C")], [
            link("x", ("A", "J1"), ("B", "J1")), link("y", ("A", "J2"), ("B", "J2")),
            link("z", ("B", "J3"), ("C", "J1")), link("w", ("B", "J4"), ("C", "J2")),
            link("v", ("B", "J5"), ("C", "J3")),
        ])
        boards, wires = system_layout.layout(doc)
        self.assertEqual(boards["sin_B"].column, 0)
        self.assertEqual(system_layout.crossings(wires), 0)

    def test_restricted_ends_share_one_row_and_self_links_loop(self) -> None:
        doc = document([instance("A"), instance("R", restricted=True)], [
            link("x", ("A", "J1"), ("R", "J9")), link("y", ("A", "J2"), ("R", "J8")),
            link("z", ("A", "J3"), ("A", "J4")),
        ])
        boards, wires = system_layout.layout(doc)
        self.assertEqual([(r.reference, len(r.partners)) for r in boards["sin_R"].rows], [("restricted", 2)])
        loop = next(w for w in wires if w.link_id == "z")
        self.assertEqual(len(loop.points), 4)
        self.assertGreater(loop.points[1][0], boards["sin_A"].x + system_layout.BOARD_WIDTH)

    def test_unconnected_boards_do_not_overlap(self) -> None:
        doc = document([instance("A"), instance("B"), instance("C")], [link("x", ("A", "J1"), ("B", "J1"))])
        boards, _ = system_layout.layout(doc)
        spans = sorted((b.y, b.y + b.height) for b in boards.values() if b.x == boards["sin_C"].x)
        for (top, bottom), (next_top, _) in zip(spans, spans[1:]):
            self.assertLessEqual(bottom, next_top)


class IcdDiagramTest(unittest.TestCase):
    def test_the_icd_draws_the_shared_layout(self) -> None:
        html = icd.render_html(JTYU, source="live", generated_at="2026-09-30T00:00:00+00:00")
        self.assertEqual(html.count("<polyline"), 6)
        self.assertIn("↔ OBC-1 J14", html)
        self.assertIn('class="swatch"', html)
        self.assertNotIn("<script", html)


if __name__ == "__main__":
    unittest.main()


class IcdContentTest(unittest.TestCase):
    """SB2-73: contents, a connections overview linking to each connection, findings beside it, modules apart."""

    def test_contents_overview_and_findings_beside_their_connection(self) -> None:
        module = {**instance("IMU"), "kind": "module", "catalog": {"version": 3, "releaseStatus": "open", "identity": "MOD-1"},
                  "ports": [{"portKey": "IMU:A", "reference": "A", "exposed": True}]}
        doc = document([instance("OBC-1"), instance("CMBD"), module],
                       [link("l1", ("OBC-1", "J14"), ("CMBD", "J12"), name="Main stack")])
        doc["validation"]["findings"] = [{"rule": "SYS-V03", "name": "pin_missing", "severity": "error", "instanceId": None,
                                          "linkId": "l1", "rowId": None, "end": "a", "reference": "J14", "pin": "3",
                                          "detail": None, "redacted": False}]
        html = icd.render_html(doc, source="live", generated_at="2026-10-08T14:01:44+00:00")
        self.assertIn('<nav class="toc" aria-label="Contents"><a href="#boards">Boards</a><a href="#modules">Modules</a>', html)
        self.assertIn("<b>1</b><span>Modules</span>", html)
        self.assertNotIn("<span>Subsystems</span>", html)
        self.assertIn("1 module pins an unreleased revision.", html)
        self.assertIn('<a href="#link-l1">Main stack</a>', html)
        connection = html[html.index('<section class="link" id="link-l1">'):]
        self.assertIn('<ul class="link-findings"><li><span class="chip error">SYS-V03</span> pin missing', connection)
        self.assertIn("8 Oct 2026, 14:01 UTC", html)

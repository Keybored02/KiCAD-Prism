"""SB2-71: the ICD's block diagram lays a system out exactly as the Diagram tab does.

``tests/fixtures/system_builder/layout_parity.json`` holds the expected layout, written by the
canvas's own implementation (``frontend/.../system-layout-parity.test.ts`` with
``UPDATE_LAYOUT_PARITY=1``); both suites check it.
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

from app.services.systems import layout as system_layout

FIXTURE = Path(__file__).parent / "fixtures" / "system_builder" / "layout_parity.json"


def summarise(document: dict, positions: dict) -> dict:
    boards, links = system_layout.layout_inputs(document)
    placed = system_layout.layout_system(boards, links, positions)

    def num(value: float):
        value = round(value, 3)
        return int(value) if value == int(value) else value

    blocks = {block.id: {"column": block.column, "x": num(block.x), "y": num(block.y),
                         "rows": [row.key for row in block.rows],
                         "hidden": [port["portKey"] for port in block.hidden_ports]}
              for block in placed.values()}
    wires = [{"linkId": wire.link_id, "kind": wire.kind, "lane": num(wire.lane), "loopOffset": num(wire.loop_offset),
              "source": f"{wire.source['board']}:{wire.source['rowKey']}:{wire.source['side']}",
              "target": f"{wire.target['board']}:{wire.target['rowKey']}:{wire.target['side']}"}
             for wire in system_layout.route_wires(placed, links)]
    return {"blocks": blocks, "wires": wires}


class LayoutParityTest(unittest.TestCase):
    def test_the_icd_lays_out_like_the_canvas(self) -> None:
        for case in json.loads(FIXTURE.read_text())["cases"]:
            with self.subTest(case["name"]):
                self.assertEqual(summarise(case["document"], case["positions"]), case["expected"])


if __name__ == "__main__":
    unittest.main()

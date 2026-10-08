"""SB2-19: harnesses and link types in the ICD and the connection CSV (CONTRACTS_P2 §17.4).

The fixture's WH-001 label becomes one 3-end harness (PWR J3 → PAY J11 and
PAY J12, with a splice on PWR J3 pin 3). The CSV must name each wire's ends,
end pins and mated pads, and importing it must round-trip the harness.
"""

from __future__ import annotations

import csv
import io

from test_system_import import DESIGNER, ImportCase

from app.services.systems import csv_import, icd


class HarnessCsvCase(ImportCase):
    def setUp(self) -> None:
        super().setUp()
        self.harness = self.service.harness_from_label(DESIGNER, self.sid, self.version(), "WH-001").body
        ends = {e["mates"]["port"]["reference"]: e for e in self.harness["ends"]}
        self.pwr, self.j11, self.j12 = ends["J3"], ends["J11"], ends["J12"]
        # A crossover on PAY J11: end pin 1 lands on pad 2 and pin 2 on pad 1.
        self.service.update_harness_end(DESIGNER, self.sid, self.version(), self.harness["id"], self.j11["id"],
                                        {"pinMap": {"1": "2", "2": "1"}})
        wires = [{"id": w["id"], "from": w["from"], "to": w["to"], "signal": w["signal"], "gaugeAwg": 24,
                  "colour": "red" if i == 0 else None, "label": f"W{i}"}
                 for i, w in enumerate(self.body()["wires"])]
        self.harness = self.service.replace_wires(DESIGNER, self.sid, self.version(), self.harness["id"], wires).body

    def body(self) -> dict:
        return self.service.list_harnesses(DESIGNER, self.sid)[0]

    def export(self) -> str:
        return icd.render_csv(self.service._icd_source(DESIGNER, self.sid, None)[0])

    def wire_rows(self, text: str) -> list[dict]:
        return [r for r in csv.DictReader(io.StringIO(text)) if r["from_end"]]

    def shape(self, harness: dict) -> tuple:
        """What a round trip must keep: ends (ordinal, mate, pin map) and wires by end ordinal."""
        ordinal = {e["id"]: e["ordinal"] for e in harness["ends"]}
        ends = sorted((e["ordinal"], e["mates"]["instanceId"], e["mates"]["port"]["reference"], e["pinMap"])
                      for e in harness["ends"])
        wires = sorted((ordinal[w["from"]["end"]], w["from"]["pin"], ordinal[w["to"]["end"]], w["to"]["pin"],
                        w["signal"], w["gaugeAwg"], w["colour"], w["label"]) for w in harness["wires"])
        return harness["name"], harness["label"], ends, wires


class HarnessCsvTest(HarnessCsvCase):
    def test_wire_rows_name_ends_end_pins_and_pads(self) -> None:
        text = self.export()
        self.assertEqual(next(csv.reader(io.StringIO(text)))[-7:],
                         ["from_end", "from_end_pin", "to_end", "to_end_pin", "gauge_awg", "colour", "wire_label"])
        rows = self.wire_rows(text)
        self.assertEqual(len(rows), 3)
        self.assertTrue(all(r["link_id"] == self.harness["id"] and r["harness"] == "WH-001" for r in rows))
        to_j11 = [r for r in rows if r["b_connector"] == "J11"]
        # End pin and pad differ where the pin map crosses over.
        self.assertEqual(sorted((r["to_end_pin"], r["b_pin"]) for r in to_j11), [("1", "2"), ("2", "1")])
        self.assertEqual({r["gauge_awg"] for r in rows}, {"24"})
        links = [r for r in csv.DictReader(io.StringIO(text)) if not r["from_end"]]
        self.assertTrue(links and all(r[c] == "" for r in links for c in icd.WIRE_COLUMNS))

    def test_reimporting_the_export_changes_nothing(self) -> None:
        before = self.shape(self.body())
        upload = self.upload(self.export())
        column_map = upload["suggestedColumnMap"]
        self.assertEqual(set(column_map), set(csv_import.TARGETS))
        preview = self.preview(upload["importId"], column_map)
        wires = [e for bucket in ("matched", "needsReview") for e in preview[bucket] if e.get("kind") == "wire"]
        self.assertEqual((len(wires), {e["action"] for e in wires}, preview["conflict"], preview["unresolved"]),
                         (3, {"update"}, [], []))
        report = self.commit(upload["importId"], column_map)
        self.assertEqual(report["harnessesCreated"], [])
        self.assertEqual(self.shape(self.body()), before)

    def test_a_deleted_harness_comes_back_from_its_export(self) -> None:
        text = self.export()
        before = self.shape(self.body())
        self.service.delete_harness(DESIGNER, self.sid, self.version(), self.harness["id"])
        upload = self.upload(text)
        column_map = upload["suggestedColumnMap"]
        preview = self.preview(upload["importId"], column_map)
        wires = [e for bucket in ("matched", "needsReview") for e in preview[bucket] if e.get("kind") == "wire"]
        self.assertEqual({e["action"] for e in wires}, {"create"})
        report = self.commit(upload["importId"], column_map)
        self.assertEqual(len(report["harnessesCreated"]), 1)
        if report["reviewId"]:
            review = next(r for r in self.service.list_reviews(DESIGNER, self.sid, "open") if r["id"] == report["reviewId"])
            for item in review["items"]:
                self.service.decide(DESIGNER, self.sid, self.version(), review["id"], item["id"], "accept", None)
        self.assertEqual(self.shape(self.body()), before)

    def test_rows_that_contradict_a_harness_are_refused(self) -> None:
        header, *lines = self.export().splitlines()
        columns = header.split(",")
        rows = [dict(zip(columns, line.split(","))) for line in lines]
        wire = next(r for r in rows if r["from_end"] and r["b_connector"] == "J11")

        def row(**changes) -> dict:
            return {**wire, "row_id": "", **changes}

        cases = [
            (row(from_end="Plug"), "unresolved", "end_label_invalid"),
            (row(from_end="End 1", to_end="End 1"), "conflict", "same_end"),
            (row(b_pin=wire["to_end_pin"]), "conflict", "pin_map_mismatch"),
            (row(b_connector="J12", b_pin="1"), "conflict", "end_mate_mismatch"),
            (row(from_end="End 9"), "conflict", "end_not_found"),
            (row(gauge_awg="thick"), "unresolved", "gauge_invalid"),
            (row(link_name="WH-002"), "conflict", "port_already_mated"),  # a new harness on J3 again
            (row(), "conflict", "duplicate_existing"),
        ]
        text = header + "\r\n" + "\r\n".join(",".join(r[c] for c in columns) for r, _b, _r in cases) + "\r\n"
        upload = self.upload(text)
        preview = self.preview(upload["importId"], upload["suggestedColumnMap"])
        found = {e["line"]: (bucket, e["reason"]) for bucket in csv_import.BUCKETS for e in preview[bucket]}
        self.assertEqual([found[line] for line in range(2, 2 + len(cases))], [(b, r) for _row, b, r in cases])


class IcdTest(HarnessCsvCase):
    def test_icd_shows_harnesses_and_board_to_board_pairs(self) -> None:
        link = self.links["L-J2J1"]
        self.service.update_link(DESIGNER, self.sid, self.version(), link, {"type": "b2b", "stackHeightMm": 8.5})
        port = self.store.get_link(self.sid, link)["a_port"]["portKey"]
        self.service.set_mating(DESIGNER, self.sid, self.version(), self.instances["OBC-A"], port,
                                {"mode": "override", "axis": "top", "quarterTurns": 1})
        html, _name, _version = self.service.icd(DESIGNER, self.sid, "html")
        b2b = html[html.index(">Board-to-board mating</h2>"):html.index(">Harnesses</h2>")]
        self.assertIn("Vertical, top side · turned 90° <span class=\"meta\">(set by hand)</span>", b2b)
        self.assertIn("not confirmed", b2b)  # the PWR end has no stored frame
        self.assertIn("8.5 mm", b2b)
        section = html[html.index(">Harnesses</h2>"):html.index(">Findings</h2>")]
        self.assertIn("WH-001", section)
        self.assertIn("1 → 2, 2 → 1", section)  # the crossover
        self.assertIn("End 1 pin 3 joins 2 wires", section)  # the splice
        self.assertIn("board-to-board · stack 8.5 mm", html)

"""SB2-110 (CONTRACTS_P2 §26): contact parts, coverings and the harness manufacturing outputs."""

from __future__ import annotations

import csv
import io
import re
import unittest

import yaml
from test_system_mates import DESIGNER, MatesCase

from app.services.systems import harness_drawing, harness_outputs
from app.services.systems import manifest as manifest_io
from app.services.systems.manifest_schema import connectivity_view, full_view
from app.services.systems.store import Invalid, NotFound

HOUSING = {"componentId": "cmp_h", "revisionId": "r", "name": "M80-4615042", "mpn": "M80-4615042", "manufacturer": "Harwin"}
CONTACT = {"componentId": "cmp_c", "revisionId": "r", "name": "Crimp contact", "mpn": "M80-0130001", "manufacturer": "Harwin"}


def model(segments=True) -> dict:
    wires = [
        {"id": "w2", "from": {"end": "a", "pin": "3"}, "to": {"end": "b", "pin": "2"}, "signal": "PWR_C&DH_Red",
         "gaugeAwg": 24, "colour": "orange", "label": "", "netFrom": ["PWR_C&DH_Red"], "netTo": ["IN"], "cutMm": 178},
        {"id": "w1", "from": {"end": "a", "pin": "1"}, "to": {"end": "b", "pin": "15"}, "signal": "=MAIN",
         "gaugeAwg": 24, "colour": "red", "label": "J4-1", "netFrom": ["PWR"], "netTo": ["IN"], "cutMm": 178},
        {"id": "w3", "from": {"end": "a", "pin": "1"}, "to": {"end": "c", "pin": "1"}, "signal": "=MAIN",
         "gaugeAwg": 26, "colour": "Teal", "label": "", "netFrom": ["PWR"], "netTo": [], "cutMm": None},
    ]
    return {
        "system": {"name": "Bus", "version": 7},
        "harness": {"id": "h", "name": "C&DH power", "label": None, "cutLengthMm": None, "bundleMm": 161.6,
                    "estimatedMm": 177.7},
        "ends": [{"id": "a", "name": "HPDRM J4", "pins": [str(n) for n in range(1, 6)], "part": HOUSING, "contact": CONTACT},
                 {"id": "b", "name": "LPDRM J1", "pins": [str(n) for n in range(1, 27)], "part": None, "contact": CONTACT},
                 {"id": "c", "name": "End 3", "pins": ["1", "2"], "part": None, "contact": None}],
        "wires": wires,
        "segments": [{"id": "a~shd_1", "from": "a", "to": "shd_1", "lengthMm": 40.0, "wires": ["w1", "w2", "w3"]},
                     {"id": "shd_1~b", "from": "shd_1", "to": "b", "lengthMm": 106.0, "wires": ["w1", "w2"]},
                     {"id": "shd_1~c", "from": "shd_1", "to": "c", "lengthMm": 30.0, "wires": ["w3"]}] if segments else None,
        "coverings": [{"segmentId": "*", "part": None, "description": "PET braid 6 mm"},
                      {"segmentId": "shd_1~b", "part": None, "description": "Heat-shrink"},
                      {"segmentId": "gone~x", "part": None, "description": "Old sleeve"}],
    }


def rows(content: bytes) -> list[dict]:
    return list(csv.DictReader(io.StringIO(content.decode())))


class OutputsTest(unittest.TestCase):
    def test_wiring_list_orders_and_numbers_wires(self) -> None:
        listed = rows(harness_outputs.wiring_csv(model()))
        self.assertEqual([(r["wire"], r["from_cavity"], r["to_end"], r["to_cavity"]) for r in listed],
                         [("W1", "1", "LPDRM J1", "15"), ("W2", "1", "End 3", "1"), ("W3", "3", "LPDRM J1", "2")])
        self.assertEqual((listed[0]["signal"], listed[0]["cut_length_mm"], listed[1]["cut_length_mm"]),
                         ("'=MAIN", "178", ""))  # a formula-like cell is defused; no cut length stays empty

    def test_bom_counts_housings_contacts_wire_splices_coverings_and_labels(self) -> None:
        bom = harness_outputs.bom_rows(model())
        by_kind = {}
        for row in bom:
            by_kind.setdefault(row["kind"], []).append(row)
        self.assertEqual([(r["mpn"], r["description"], r["where"]) for r in by_kind["housing"]],
                         [("M80-4615042", "5-way housing", "HPDRM J4"), ("", "Generic 26-way (no part)", "LPDRM J1"),
                          ("", "Generic 2-way (no part)", "End 3")])
        [contact] = by_kind["contact"]
        self.assertEqual((contact["mpn"], contact["qty"], contact["where"]), ("M80-0130001", 4, "HPDRM J4, LPDRM J1"))
        self.assertEqual([(r["description"], r["qty"], r["unit"]) for r in by_kind["wire"]],
                         [("24 AWG orange wire", 0.18, "m"), ("24 AWG red wire", 0.18, "m"),
                          ("1 wire(s) without a cut length", 1, "each")])
        self.assertEqual([(r["where"], r["description"]) for r in by_kind["splice"]], [("HPDRM J4 1", "2 wires in one cavity")])
        self.assertEqual([(r["description"], r["qty"], r["where"]) for r in by_kind["covering"]],
                         [("PET braid 6 mm", 0.17, "whole bundle"), ("Heat-shrink", 0.11, "B1 – LPDRM J1"),
                          ("Old sleeve", "", "gone~x (unrouted)")])
        self.assertEqual(by_kind["label"][0]["qty"], 1)
        self.assertEqual([r["item"] for r in bom], list(range(1, len(bom) + 1)))

    def test_wireviz_yaml_is_a_cable_per_end_pair_and_gauge_and_escapes_text(self) -> None:
        doc = yaml.safe_load(harness_outputs.wireviz_yaml(model()))
        self.assertEqual(sorted(doc["connectors"]), ["X1", "X2", "X3"])
        x1 = doc["connectors"]["X1"]
        self.assertEqual((x1["type"], x1["mpn"], x1["manufacturer"], x1["pins"][:2], x1["pinlabels"][0], x1["pinlabels"][2]),
                         ("M80-4615042", "M80-4615042", "Harwin", [1, 2], "=MAIN", "PWR_C&amp;DH_Red"))
        self.assertEqual(x1["additional_components"], [{"type": "Crimp contact", "mpn": "M80-0130001",
                                                        "manufacturer": "Harwin", "qty": 1, "qty_multiplier": "populated"}])
        self.assertEqual(doc["connectors"]["X3"]["type"], "Generic")
        w1 = doc["cables"]["W1"]  # a -> b, 24 AWG
        self.assertEqual((w1["wirecount"], w1["gauge"], w1["colors"], w1["length"]), (2, "24 AWG", ["RD", "OG"], 0.178))
        self.assertNotIn("colors", doc["cables"]["W2"])  # "Teal" is no WireViz code
        self.assertEqual(doc["connections"][0], [{"X1": [1]}, {"W1": [1]}, {"X2": [15]}])
        self.assertEqual(doc["metadata"]["title"], "C&amp;DH power")
        # Coverings ride on the first cable, by segment length (the bundle's for "*").
        self.assertEqual([(c["type"], c.get("qty"), c.get("unit")) for c in w1["additional_components"]],
                         [("Covering (whole bundle)", 0.17, "m"), ("Covering (B1 – LPDRM J1)", 0.11, "m"), ("Covering (gone~x)", 1, None)])

    def test_wireviz_keeps_pin_names_unique_and_unambiguous(self) -> None:
        wire = model()["wires"][0]
        m = {**model(), "coverings": [],
             "ends": [{"id": "a", "name": "J1", "pins": ["1", "01", "A1", "2"], "part": None, "contact": None},
                      {"id": "b", "name": "J2", "pins": ["1", "2", "3"], "part": None, "contact": None}],
             "wires": [{**wire, "id": "x", "from": {"end": "a", "pin": "01"}, "to": {"end": "b", "pin": "1"}, "signal": "A1",
                        "gaugeAwg": 22, "colour": "red/white"},
                       {**wire, "id": "y", "from": {"end": "a", "pin": "1"}, "to": {"end": "b", "pin": "2"}, "signal": "2",
                        "gaugeAwg": 26, "colour": "black"}]}
        doc = yaml.safe_load(harness_outputs.wireviz_yaml(m))
        x1 = doc["connectors"]["X1"]
        self.assertEqual(x1["pins"], [1, "01", "A1", 2])  # "01" stays text: no clash with 1
        self.assertEqual(x1["pinlabels"][:2], ["2\u200b", "A1\u200b"])  # a label naming a pin is set apart
        self.assertEqual(sorted((c["gauge"], c.get("colors")) for c in doc["cables"].values()),
                         [("22 AWG", ["RDWH"]), ("26 AWG", ["BK"])])  # one cable per gauge; stripes

    def test_drawing_draws_ends_segments_and_title_with_or_without_a_route(self) -> None:
        svg = harness_drawing.drawing_svg(model()).decode()
        for text in ("HPDRM J4", "LPDRM J1", "End 3", "106 mm", "Heat-shrink", "PET braid 6 mm", "C&amp;DH power",
                     "Bus v7", "162 mm", ">B1<", "B1 – LPDRM J1", "Bill of materials"):
            self.assertIn(text, svg)
        self.assertEqual(svg.count("<circle cx") - svg.count("r='3'"), 1)  # the breakout; the rest are cavity ports
        flat = harness_drawing.drawing_svg({**model(segments=False),
                                            "harness": {**model()["harness"], "bundleMm": None}}).decode()
        self.assertIn("not routed", flat)
        self.assertNotIn("106 mm", flat)

    def test_drawing_tags_every_wire_for_tracing(self) -> None:
        svg = harness_drawing.drawing_svg(model()).decode()
        tags = re.findall(r"data-w='([^']*)'", svg)
        for number in ("W1", "W2", "W3"):
            # its fan, its tag, its cavity rows, the wire list and every sheath it runs through
            self.assertGreaterEqual(sum(number in t.split() for t in tags), 5, number)
        self.assertIn("data-w='W1 W2'", svg)  # HPDRM J4 cavity 1 is a splice: one row, two wires
        segments = dict(re.findall(r"data-w='([^']*)' data-segment='([^']*)'", svg)[i][::-1] for i in range(3))
        self.assertEqual(segments["shd_1~c"], "W2")  # End 3's branch carries only the wire to End 3

    def test_drawing_hangs_an_in_line_end_off_a_tap(self) -> None:
        m = model()
        m["segments"] = [{"id": "a~c", "from": "a", "to": "c", "lengthMm": 40.0, "wires": ["w1", "w2", "w3"]},
                         {"id": "c~b", "from": "c", "to": "b", "lengthMm": 90.0, "wires": ["w1", "w2"]}]
        svg = harness_drawing.drawing_svg(m).decode()
        self.assertIn("data-segment='tap:c~stub'", svg)
        self.assertIn("90 mm", svg)
        self.assertNotIn(">B1<", svg)

    def test_drawing_renders_as_a_pdf(self) -> None:
        pdf = harness_outputs.drawing_pdf(harness_drawing.drawing_svg(model()))
        self.assertTrue(pdf.startswith(b"%PDF"))


class ContactCoveringTest(MatesCase):
    def harness(self) -> dict:
        harness = self.service.link_to_harness(DESIGNER, self.sid, self.version(), self.link).body
        a, b = harness["ends"]
        return self.service.replace_wires(DESIGNER, self.sid, self.version(), harness["id"], [
            {"from": {"end": a["id"], "pin": "1"}, "to": {"end": b["id"], "pin": "1"}, "gaugeAwg": 26, "colour": "red"},
            {"from": {"end": a["id"], "pin": "2"}, "to": {"end": b["id"], "pin": "2"}, "gaugeAwg": 26, "colour": "black",
             "label": "GND"}]).body

    def test_a_contact_and_coverings_round_trip_and_feed_the_outputs(self) -> None:
        harness = self.harness()
        end = harness["ends"][0]
        body = self.service.update_harness_end(DESIGNER, self.sid, self.version(), harness["id"], end["id"],
                                               {"contact": {"componentId": "cmp_blank"}}).body
        self.assertEqual(body["ends"][0]["contact"]["componentId"], "cmp_blank")  # a contact needs no pins
        body = self.service.set_coverings(DESIGNER, self.sid, self.version(), harness["id"], [
            {"segmentId": "*", "description": "PET braid"},
            {"segmentId": "x~y", "componentId": "cmp_housing", "description": ""}]).body
        self.assertEqual([(c["segmentId"], (c["part"] or {}).get("mpn"), c["description"]) for c in body["coverings"]],
                         [("*", None, "PET braid"), ("x~y", "JST-H", "")])

        before = manifest_io.build(self.store, self.sid, created_by="user:t", created_at="2026-10-09T00:00:00+00:00")
        h = before.harnesses[0]
        self.assertEqual((h.ends[0].contactPart.componentId, [c.segmentId for c in h.coverings]), ("cmp_blank", ["*", "x~y"]))
        self.assertNotIn("coverings", connectivity_view(before)["harnesses"][0])
        self.conn.commit()
        self.store.delete_system(self.sid)
        self.conn.commit()
        manifest_io.import_manifest(self.store, before, actor="user:importer")
        self.conn.commit()
        after = manifest_io.build(self.store, self.sid, created_by="user:t", created_at="2026-10-09T00:00:00+00:00")
        self.assertEqual(full_view(after), full_view(before))

        content, media, name = self.service.harness_output(DESIGNER, self.sid, harness["id"], "bom.csv")
        self.assertEqual(media, "text/csv; charset=utf-8")
        self.assertTrue(name.endswith(f"-v{self.version()}-bom.csv"))
        bom = rows(content)
        self.assertEqual([(r["kind"], r["qty"]) for r in bom if r["kind"] in ("contact", "label")], [("contact", "2"), ("label", "1")])
        for output in ("wiring.csv", "wireviz.yaml", "drawing.svg"):
            self.assertTrue(self.service.harness_output(DESIGNER, self.sid, harness["id"], output)[0])

    def test_unset_fields_leave_older_digests_alone_and_refusals(self) -> None:
        harness = self.harness()
        manifest = manifest_io.build(self.store, self.sid, created_by="user:t", created_at="2026-10-09T00:00:00+00:00")
        view = full_view(manifest)["harnesses"][0]
        self.assertNotIn("coverings", view)
        self.assertNotIn("contactPart", view["ends"][0])
        with self.assertRaises(Invalid):
            self.service.set_coverings(DESIGNER, self.sid, self.version(), harness["id"], [{"segmentId": "*"}])
        with self.assertRaises(NotFound):
            self.service.set_coverings(DESIGNER, self.sid, self.version(), harness["id"],
                                       [{"segmentId": "*", "componentId": "cmp_missing"}])
        with self.assertRaises(NotFound):
            self.service.update_harness_end(DESIGNER, self.sid, self.version(), harness["id"], "she_nope",
                                            {"contact": {"componentId": "cmp_blank"}})
        with self.assertRaises(Invalid):
            self.service.harness_output(DESIGNER, self.sid, harness["id"], "drawing.dxf")


if __name__ == "__main__":
    unittest.main()

"""SB2-105 (CONTRACTS_P2 §22.2, §22.5): sub-ports as export targets, in the manifest and in the ICD CSV."""

from __future__ import annotations

import copy
import unittest

from test_system_import import PLAIN_MAP
from test_system_subports import SubportCase
from test_system_snapshots import DESIGNER

from app.services.systems import icd, manifest as manifest_io
from app.services.systems.manifest_schema import Manifest, digests, full_view, reference_problems
from app.services.systems.store import Conflict

NOW = "2026-10-09T12:00:00+00:00"


class SubportExportTest(SubportCase):
    def spare(self) -> list[str]:
        """Pads of OBC-A J7 no row uses (rows sit on 1–18)."""
        count = self.j7()["port"]["pinCount"]
        pads = [str(n) for n in range(19, count + 1)]
        if not pads:
            self.skipTest("J7 has no spare pads")
        return pads

    def export(self, name: str, subport_id: str | None, port: dict | None = None) -> dict:
        end = port or self.j7()
        return self.service.create_export(DESIGNER, self.sid, self.version(), name=name, description="",
                                          instance_id=end["instanceId"], port_key=end["port"]["portKey"],
                                          child_export_id=None, subport_id=subport_id).body

    def test_a_sub_port_is_exported_while_the_rest_stays_linked(self) -> None:
        with self.assertRaisesRegex(Conflict, "export_port_linked"):
            self.export("J7", None)
        sub = self.carve("AUX", self.spare())["subport"]
        export = self.export("OBC AUX", sub["id"])
        self.assertEqual((export["subportId"], export["subport"]["name"]), (sub["id"], "AUX"))
        body = self.service.export_interface(DESIGNER, self.sid)
        [entry] = body["exports"]
        self.assertEqual((entry["reference"], entry["subport"]), ("J7.AUX", True))
        self.assertEqual([p["pad"] for p in entry["pins"]], sub["pads"])
        self.assertEqual(entry["pinCount"], len(sub["pads"]))
        html = self.service.icd(DESIGNER, self.sid, "html")[0]
        self.assertIn("J7.AUX", html, "the ICD's block diagram shows the exported sub-port beside the linked J7")
        with self.assertRaisesRegex(Conflict, "subport_exported"):
            self.service.delete_subport(DESIGNER, self.sid, self.version(), self.j7()["instanceId"], sub["id"])
        with self.assertRaisesRegex(Conflict, "this port is already exported"):
            self.export("again", sub["id"])

    def test_a_whole_exported_connector_is_not_split(self) -> None:
        link = self.link("L-J2J1")
        self.service.delete_link(DESIGNER, self.sid, self.version(), link["id"])
        self.export("J2", None, port=link["a"])
        with self.assertRaisesRegex(Conflict, "port_exported"):
            self.carve("PWR", ["1"], port=link["a"])


class SubportManifestTest(SubportCase):
    def build(self) -> Manifest:
        manifest = manifest_io.build(self.store, self.sid, created_by="user:t", created_at=NOW)
        self.conn.commit()
        return manifest

    def test_sub_ports_round_trip_through_the_manifest(self) -> None:
        plain = digests(self.build())
        body = self.carve("PWR", ["1", "2", "3"])
        before = self.build()
        self.assertNotEqual(digests(before)["connectivity"], plain["connectivity"])
        [obc] = [i for i in before.instances if i.id == self.instances["OBC-A"]]
        self.assertEqual([(s.id, s.name, s.pads) for s in obc.subports], [(body["subport"]["id"], "PWR", ["1", "2", "3"])])
        moved = next(link for link in before.links if link.id == body["moves"][0]["newLinkId"])
        self.assertEqual(moved.a.subportId, body["subport"]["id"])
        self.assertEqual(reference_problems(before), [])
        self.store.delete_system(self.sid)
        self.conn.commit()
        manifest_io.import_manifest(self.store, before, actor="user:importer")
        self.conn.commit()
        self.assertEqual(full_view(self.build()), full_view(before))

    def test_a_row_on_the_wrong_end_is_a_reference_problem(self) -> None:
        body = self.carve("PWR", ["1", "2", "3"])
        raw = self.build().model_dump(mode="json", by_alias=True)
        broken = copy.deepcopy(raw)
        moved = next(link for link in broken["links"] if link["id"] == body["moves"][0]["newLinkId"])
        moved["a"]["subportId"] = None  # its rows' pads now sit on the remainder, inside PWR
        with self.assertRaisesRegex(ValueError, "pin 1 is not on end a"):
            Manifest.model_validate(broken)


class SubportCsvTest(SubportCase):
    def test_the_icd_csv_names_sub_ports_and_reimports_unchanged(self) -> None:
        self.carve("PWR", ["1", "2", "3"])
        text = icd.render_csv(self.service._icd_source(DESIGNER, self.sid, None)[0])
        self.assertIn(",J7.PWR,", text)
        before = {link["id"]: sorted((r["pin_a"], r["pin_b"], r["signal"]) for r in link["rows"])
                  for link in self.store.list_links(self.sid)}
        upload = self.service.upload_import(DESIGNER, self.sid, filename="icd.csv", raw=text.encode(), delimiter=None)
        boards = dict(self.instances)
        preview = self.service.preview_import(DESIGNER, self.sid, upload["importId"], upload["suggestedColumnMap"],
                                              boards, None).body
        self.assertEqual(preview["counts"]["unresolved"], 0, preview["unresolved"][:2])
        self.assertEqual(preview["counts"]["conflict"], 0, preview["conflict"][:2])
        report = self.service.commit_import(DESIGNER, self.sid, self.version(), upload["importId"],
                                            upload["suggestedColumnMap"], boards, None).body
        self.assertEqual((report["created"], report["linksCreated"]), (0, []))
        self.conn.commit()
        after = {link["id"]: sorted((r["pin_a"], r["pin_b"], r["signal"]) for r in link["rows"])
                 for link in self.store.list_links(self.sid)}
        self.assertEqual(after, before)

    def test_a_plain_wiring_list_lands_on_the_end_holding_each_pad(self) -> None:
        body = self.carve("PWR", ["1", "2", "3"])
        self.service.delete_link(DESIGNER, self.sid, self.version(), body["moves"][0]["newLinkId"])
        text = ("from_board,from_connector,from_pin,to_board,to_connector,to_pin,signal,harness\n"
                "OBC-A,J7,2,PAY,J4,2,X,\nOBC-A,J7.PWR,5,PAY,J4,5,Y,\n")
        upload = self.service.upload_import(DESIGNER, self.sid, filename="w.csv", raw=text.encode(), delimiter=None)
        preview = self.service.preview_import(DESIGNER, self.sid, upload["importId"], PLAIN_MAP,
                                              dict(self.instances), None).body
        self.assertEqual([e["from"]["subportId"] for e in preview["matched"] + preview["needsReview"]],
                         [body["subport"]["id"]])
        self.assertEqual([e["reason"] for e in preview["unresolved"]], ["pin_not_on_subport"])


class ChildExportSplitTest(unittest.TestCase):
    """A parent splits a subsystem's export (§22.2): the re-export publishes only the sub-port's pads."""

    def test_a_re_exported_sub_port_of_a_child_export(self) -> None:
        from app.services.systems import exports

        child = exports.as_interface({"exports": [{
            "id": "sxp_" + "1" * 32, "name": "CMBD J1", "reference": "J1", "libId": "L", "footprint": "F",
            "pins": [{"pad": str(n), "nets": [f"N{n}"]} for n in range(1, 7)]}]})
        component = child["components"][0]
        sub = {"id": "spt_" + "2" * 32, "instance_id": "sin_c", "port_key": component["portKey"],
               "port": {"portKey": component["portKey"], "memberKeys": [component["portKey"]]},
               "name": "PWR", "pads": ["1", "2"]}
        re_export = {"id": "sxp_" + "3" * 32, "name": "Bus PWR", "description": "", "target_instance_id": "sin_c",
                     "target_port": None, "target_export_id": component["portKey"], "target_subport_id": sub["id"]}
        remainder = {**re_export, "id": "sxp_" + "4" * 32, "name": "Bus SIG", "target_subport_id": None}
        body = exports.interface([re_export, remainder], {}, {"sin_c": child}, {}, [sub])
        pwr, sig = body["exports"]
        self.assertEqual((pwr["reference"], [p["pad"] for p in pwr["pins"]], pwr["subport"]), ("J1.PWR", ["1", "2"], True))
        self.assertEqual((sig["reference"], [p["pad"] for p in sig["pins"]], sig["subport"]),
                         ("J1", ["3", "4", "5", "6"], True))
        parent = exports.as_interface(body)
        self.assertTrue(all(c["export"]["subport"] for c in parent["components"]))


if __name__ == "__main__":
    unittest.main()

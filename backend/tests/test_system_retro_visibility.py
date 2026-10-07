"""Retrospective D1/D2 (RETRO-M0-M3): parent snapshots with assemblies, and redaction through exports.

Bus = CNDH-A (the fixture system published as an assembly; its export PWR_IN is OBC-A J6) plus PDU,
linked PDU J1 ↔ CNDH-A PWR_IN.
"""

from __future__ import annotations

import unittest

from test_system_assemblies import AssemblyCase
from test_system_publish import ADMIN
from test_system_snapshots import DESIGNER, VIEWER

from app.services.systems.store import Conflict


class ParentWithAssemblyCase(AssemblyCase):
    def setUp(self) -> None:
        super().setUp()
        publication = self.child()
        self.bus, version = self.parent()
        added = self.add(self.bus, version, "CNDH-A", publication["componentId"])
        self.assembly_id = added.body["id"]
        pdu = self.service.add_instance(DESIGNER, self.bus, added.version, project_id="prj_pwr", label="PDU",
                                        baseline_commit=self.commits["mini_power"]["F0"], tracked_ref=None, pinned=False)
        doc = self.service.document(DESIGNER, self.bus).body
        self.export_id = next(i for i in doc["instances"] if i["id"] == self.assembly_id)["ports"][0]["portKey"]
        j1 = next(p["portKey"] for i in doc["instances"] if i["id"] == pdu.body["id"] for p in i["ports"] if p["reference"] == "J1")
        self.link = self.service.create_link(DESIGNER, self.bus, doc["system"]["version"],
                                             a={"instanceId": pdu.body["id"], "portKey": j1},
                                             b={"instanceId": self.assembly_id, "portKey": self.export_id},
                                             name="Bus power", harness=None).body
        self.service.replace_rows(DESIGNER, self.bus, self.version_of(self.bus), self.link["id"],
                                  [{"pinA": "1", "pinB": "1", "signal": "VIN"}])

    def version_of(self, system_id: str) -> int:
        return self.service.document(DESIGNER, system_id).body["system"]["version"]

    def hide_obc_a(self) -> None:
        """Move the project behind the export (OBC-A, inside the child) to a folder only admins see."""
        project = next(i["projectId"] for i in self.service.document(DESIGNER, self.sid).body["instances"]
                       if i["label"] == "OBC-A")
        self.conn.execute("INSERT INTO ws_folders (id, visibility_mode, allowed_roles)"
                          " VALUES ('fld_admins', 'roles', '[\"admin\"]') ON CONFLICT DO NOTHING")
        self.conn.execute("UPDATE ws_projects SET folder_id = 'fld_admins' WHERE id = %s", (project,))
        self.conn.commit()

    def bus_row(self, document: dict) -> dict:
        [link] = [link for link in document["links"] if link["id"] == self.link["id"]]
        [row] = link["rows"]
        return row


class ParentSnapshotTest(ParentWithAssemblyCase):
    def test_a_parent_snapshot_with_an_assembly_reads_and_renders(self) -> None:
        snapshot = self.service.create_snapshot(DESIGNER, self.bus, self.version_of(self.bus), "P1", "").body
        for caller in (DESIGNER, VIEWER):
            read = self.service.get_snapshot(caller, self.bus, snapshot["id"])
            self.assertTrue(any(i.get("kind") == "assembly" for i in read["document"]["instances"]))
            self.service.snapshot_manifest(caller, self.bus, snapshot["id"])
            content, _name, _version = self.service.icd(caller, self.bus, "csv", snapshot["id"])
            self.assertIn("Bus power", content)


class ExportRedactionTest(ParentWithAssemblyCase):
    def test_a_hidden_board_behind_an_export_hides_its_nets_in_the_parent(self) -> None:
        seen = self.bus_row(self.service.document(VIEWER, self.bus).body)
        self.assertTrue(seen["netB"], "visible before the board is hidden")
        self.hide_obc_a()

        admin = self.bus_row(self.service.document(ADMIN, self.bus).body)
        self.assertTrue(admin["netB"], "a reader who may see OBC-A keeps its nets")
        document = self.service.document(VIEWER, self.bus).body
        row = self.bus_row(document)
        self.assertIsNone(row["netB"])
        self.assertIsNone(row["observedB"])
        self.assertEqual(row["redactedEnds"], ["b"])
        self.assertTrue(row["netA"], "the parent's own board keeps its nets")
        # The assembly itself stays: its label, its export and the pin numbers.
        [assembly] = [i for i in document["instances"] if i["id"] == self.assembly_id]
        self.assertFalse(assembly["restricted"])
        self.assertEqual([p["reference"] for p in assembly["ports"]], ["PWR_IN"])
        self.assertEqual(row["pinB"], "1")

        # The assembly's interface keeps the export's pads but not their nets.
        _state, interface = self.service.interface(VIEWER, self.bus, self.assembly_id, None)
        [export] = [c for c in interface["components"] if c["portKey"] == self.export_id]
        self.assertTrue(export["redacted"])
        self.assertTrue(export["pins"])
        self.assertTrue(all(pin["nets"] is None for pin in export["pins"]))
        _state, full = self.service.interface(ADMIN, self.bus, self.assembly_id, None)
        self.assertTrue(any(pin["nets"] for c in full["components"] for pin in c["pins"]))

        # A snapshot taken now redacts the same way when a viewer reads it.
        snapshot = self.service.create_snapshot(DESIGNER, self.bus, self.version_of(self.bus), "P2", "").body
        frozen = self.bus_row(self.service.get_snapshot(VIEWER, self.bus, snapshot["id"])["document"])
        self.assertIsNone(frozen["netB"])
        self.assertTrue(self.bus_row(self.service.get_snapshot(ADMIN, self.bus, snapshot["id"])["document"])["netB"])

        # The ICD a viewer downloads carries no net of the hidden side.
        hidden_nets = set(admin["netB"])
        for snapshot_id in (None, snapshot["id"]):
            content, _name, _version = self.service.icd(VIEWER, self.bus, "csv", snapshot_id)
            line = next(text for text in content.splitlines() if "Bus power" in text)
            self.assertFalse(hidden_nets & set(line.split(",")), line)


class DeletePublishedSystemTest(AssemblyCase):
    """Retro D3 / D-P2-29: a system whose snapshots back catalog revisions is not deleted from under them."""

    def delete_child(self) -> None:
        self.service.delete_system(DESIGNER, self.sid, self.version())

    def test_deleting_a_published_system_is_refused_until_retired_and_unused(self) -> None:
        publication = self.child()
        with self.assertRaisesRegex(Conflict, "published_in_catalog: .*v1.*retire the catalog component"):
            self.delete_child()
        bus, version = self.parent()
        added = self.add(bus, version, "CNDH-A", publication["componentId"])
        self.catalog.deactivate_component(publication["componentId"], actor="t@local", reason="retro D3 test")
        with self.assertRaisesRegex(Conflict, "1 parent instance.*remove them from their parent systems"):
            self.delete_child()
        self.service.remove_instance(DESIGNER, bus, added.version, added.body["id"], cascade=True)
        self.delete_child()
        self.assertFalse(any(s["id"] == self.sid for s in self.service.list_systems(DESIGNER)))
        self.sid = None  # deleted: nothing for tearDown to unbind


if __name__ == "__main__":
    unittest.main()

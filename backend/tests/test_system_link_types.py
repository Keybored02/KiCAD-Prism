"""SB2-13: link types, B2B rules and stack height (CONTRACTS_P2 §16) on the P1 fixture system."""

from __future__ import annotations

from system_builder_db import FixtureSystemCase

from app.services.systems import manifest as manifest_io
from app.services.systems.jobs import extract_and_store
from app.services.systems.service import Caller, SystemService
from app.services.systems.store import Conflict, Invalid

DESIGNER = Caller(role="designer", email="designer@example.com")


class LinkTypeTest(FixtureSystemCase):
    def setUp(self) -> None:
        super().setUp()
        self.service = SystemService(connect=self.connect, project_loader=self.projects.get,
                                     enqueue=lambda *a, **k: {"job_id": "j", "status": "queued"})
        for board, project_id in (("mini_obc", "prj_obc"), ("mini_payload", "prj_pay"), ("mini_power", "prj_pwr")):
            extract_and_store(self.projects[project_id], self.commits[board]["F0"], self.connect)
        self.link = self.store.get_link(self.sid, next(iter(self.links.values())))

    def update(self, link_id: str, **fields):
        return self.service.update_link(DESIGNER, self.sid, self.version(), link_id, fields)

    def other_port(self) -> dict:
        """An exposed port that no fixture link uses, on a board other than the link's ends."""
        used = {(link["a_instance_id"], link["a_port"]["portKey"]) for link in self.store.list_links(self.sid)} | \
               {(link["b_instance_id"], link["b_port"]["portKey"]) for link in self.store.list_links(self.sid)}
        for label, instance_id in self.instances.items():
            for port in self.service.mating(DESIGNER, self.sid, instance_id)["ports"]:
                if (instance_id, port["portKey"]) not in used and instance_id != self.link["a_instance_id"]:
                    return {"instanceId": instance_id, "portKey": port["portKey"]}
        raise AssertionError("no free port in the fixture")

    def test_p1_links_are_unspecified_and_type_changes_keep_rows(self) -> None:
        document = self.service.document(DESIGNER, self.sid).body
        self.assertEqual({link["type"] for link in document["links"]}, {"unspecified"})
        self.assertTrue(all(link["stackHeightMm"] is None for link in document["links"]))
        rows = len(self.link["rows"])
        body = self.update(self.link["id"], type="b2b", stackHeightMm=8.0).body
        self.assertEqual((body["type"], body["stackHeightMm"], len(body["rows"])), ("b2b", 8.0, rows))
        self.assertEqual([e["payload"]["after"] for e in self.events("link_type_changed")], ["b2b"])
        back = self.update(self.link["id"], type="unspecified").body
        self.assertEqual((back["type"], back["stackHeightMm"], len(back["rows"])), ("unspecified", None, rows))

    def test_stack_height_is_b2b_only(self) -> None:
        with self.assertRaises(Invalid):
            self.update(self.link["id"], stackHeightMm=5.0)
        self.update(self.link["id"], type="b2b")
        self.assertEqual(self.update(self.link["id"], stackHeightMm=5.0).body["stackHeightMm"], 5.0)
        self.assertIsNone(self.update(self.link["id"], stackHeightMm=None).body["stackHeightMm"])
        with self.assertRaises(Invalid):
            self.update(self.link["id"], type="harness")

    def test_a_port_mates_in_one_b2b_link_only(self) -> None:
        self.update(self.link["id"], type="b2b")
        shared = {"instanceId": self.link["a_instance_id"], "portKey": self.link["a_port"]["portKey"]}
        other = self.other_port()
        with self.assertRaises(Conflict) as refused:
            self.service.create_link(DESIGNER, self.sid, self.version(), a=shared, b=other, name="second",
                                     harness=None, link_type="b2b")
        self.assertTrue(str(refused.exception).startswith("port_already_mated"))
        plain = self.service.create_link(DESIGNER, self.sid, self.version(), a=shared, b=other, name="doc",
                                         harness=None).body  # an unspecified link keeps P1 freedom
        with self.assertRaises(Conflict):
            self.update(plain["id"], type="b2b")

    def test_the_manifest_round_trips_type_and_stack_height(self) -> None:
        self.update(self.link["id"], type="b2b", stackHeightMm=11.5)
        before = manifest_io.build(self.store, self.sid, created_by="user:t", created_at="2026-09-30T00:00:00+00:00")
        [b2b] = [link for link in before.links if link.type == "b2b"]
        self.assertEqual((b2b.id, b2b.stackHeightMm), (self.link["id"], 11.5))
        self.store.delete_system(self.sid)
        self.conn.commit()
        manifest_io.import_manifest(self.store, before, actor="user:importer")
        self.conn.commit()
        after = manifest_io.build(self.store, self.sid, created_by="user:t", created_at="2026-09-30T00:00:00+00:00")
        self.assertEqual(after.links, before.links)

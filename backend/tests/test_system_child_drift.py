"""SB2-07: a subsystem's new revision against its parents (CONTRACTS_P2 §7, §8.4 V14/V15)."""

from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest import mock

from test_system_assemblies import AssemblyCase
from test_system_snapshots import DESIGNER

from app.services.systems import child_drift
from app.services.systems import service as service_module
from app.services.systems import validation
from app.services.systems.store import Conflict


class ChildDriftCase(AssemblyCase):
    """Bus = CNDH-A (follows released revisions of the fixture system) + PDU, linked PDU J1 ↔ CNDH-A PWR_IN."""

    def setUp(self) -> None:
        super().setUp()
        self.publication = self.child()  # v1 released: PWR_IN = OBC-A J6
        self.bus, version = self.parent()
        added = self.add(self.bus, version, "CNDH-A", self.publication["componentId"])
        self.cndh = added.body["id"]
        pdu = self.service.add_instance(DESIGNER, self.bus, added.version, project_id="prj_pwr", label="PDU",
                                        baseline_commit=self.commits["mini_power"]["F0"], tracked_ref=None,
                                        pinned=False)
        self.pdu = pdu.body["id"]
        doc = self.bus_doc()
        self.export_id = next(i for i in doc["instances"] if i["id"] == self.cndh)["ports"][0]["portKey"]
        j1 = next(p["portKey"] for i in doc["instances"] if i["id"] == self.pdu for p in i["ports"] if p["reference"] == "J1")
        link = self.service.create_link(DESIGNER, self.bus, doc["system"]["version"],
                                        a={"instanceId": self.pdu, "portKey": j1},
                                        b={"instanceId": self.cndh, "portKey": self.export_id},
                                        name="Bus power", harness=None).body
        self.link_id = link["id"]
        self.service.replace_rows(DESIGNER, self.bus, self.bus_doc()["system"]["version"], self.link_id,
                                  # Pin 3 carries /PWR_GOOD on OBC J6 and /AUX_A on J5: retargeting changes it.
                                  [{"pinA": "1", "pinB": "1", "signal": "V"}, {"pinA": "3", "pinB": "3", "signal": "PG"}])

    def bus_doc(self) -> dict:
        return self.service.document(DESIGNER, self.bus).body

    def cndh_instance(self) -> dict:
        return self.store.get_instance(self.bus, self.cndh)

    def publish_next(self, name: str, *, release: bool = True) -> dict:
        _, publication = self.publish(self.snapshot(name)["id"])
        if release:
            self.release(publication["componentId"])
        return publication

    def child_export(self) -> dict:
        return self.document()["exports"][0]

    def advance(self, revision_id: str) -> dict:
        return self.service.advance_child("system:detection", self.bus, self.cndh, revision_id,
                                          auto_kind="child_auto_advanced")


class ChildDriftTest(ChildDriftCase):
    def test_an_internal_child_change_auto_advances_the_parent(self) -> None:
        self.service.update_export(DESIGNER, self.sid, self.version(), self.child_export()["id"],
                                   {"description": "internal wording only"})
        v2 = self.publish_next("V2")
        result = self.advance(v2["revisionId"])
        self.assertEqual(result["outcome"], "auto_advanced")
        self.assertEqual(self.cndh_instance()["catalog_revision_id"], v2["revisionId"])
        with self.connect() as conn:
            kinds = [e["kind"] for e in service_module.SystemStore(conn).history(self.bus)]
        self.assertIn("child_auto_advanced", kinds)
        self.assertEqual(self.advance(v2["revisionId"])["outcome"], "at_revision")

    def test_a_changed_export_opens_a_review_that_applies_the_new_revision(self) -> None:
        # Move PWR_IN to OBC-B J5: same export ID, different pins' nets.
        self.service.update_export(DESIGNER, self.sid, self.version(), self.child_export()["id"],
                                   {"instanceId": self.instances["OBC-B"], "portKey": self.port_key("OBC-B", "J5")})
        v2 = self.publish_next("V2")
        result = self.advance(v2["revisionId"])
        self.assertEqual(result["outcome"], "review_opened")
        self.assertEqual(self.cndh_instance()["catalog_revision_id"], self.publication["revisionId"])
        [review] = [r for r in self.service.list_reviews(DESIGNER, self.bus, "open") if r["kind"] == "child_update"]
        self.assertEqual((review["fromCommit"], review["toCommit"]), (self.publication["revisionId"], v2["revisionId"]))
        self.assertTrue(review["items"])
        for item in review["items"]:
            self.service.decide(DESIGNER, self.bus, self.bus_doc()["system"]["version"], review["id"], item["id"],
                                "accept", None)
        self.assertEqual(self.cndh_instance()["catalog_revision_id"], v2["revisionId"])
        rows = next(l for l in self.bus_doc()["links"] if l["id"] == self.link_id)["rows"]
        self.assertTrue(all(r["netB"] == r["observedB"]["nets"] for r in rows))
        self.assertEqual(self.advance(v2["revisionId"])["outcome"], "at_revision")

    def test_a_child_review_edited_mid_flight_is_re_evaluated(self) -> None:
        self.service.update_export(DESIGNER, self.sid, self.version(), self.child_export()["id"],
                                   {"instanceId": self.instances["OBC-B"], "portKey": self.port_key("OBC-B", "J5")})
        v2 = self.publish_next("V2")
        self.advance(v2["revisionId"])
        [review] = [r for r in self.service.list_reviews(DESIGNER, self.bus, "open") if r["kind"] == "child_update"]
        # Add pin 4 (/AUX_C on J6, /AUX_B on J5) while the review is open.
        self.service.replace_rows(DESIGNER, self.bus, self.bus_doc()["system"]["version"], self.link_id,
                                  [{"pinA": "1", "pinB": "1", "signal": "V"}, {"pinA": "3", "pinB": "3", "signal": "PG"},
                                   {"pinA": "4", "pinB": "4", "signal": "X"}])
        with self.assertRaisesRegex(Conflict, "review_stale"):
            self.service.decide(DESIGNER, self.bus, self.bus_doc()["system"]["version"], review["id"],
                                review["items"][0]["id"], "accept", None)
        [fresh] = [r for r in self.service.list_reviews(DESIGNER, self.bus, "open") if r["kind"] == "child_update"]
        self.assertNotEqual(fresh["id"], review["id"])
        self.assertEqual(fresh["toCommit"], v2["revisionId"])
        self.assertIn("4", [pin for item in fresh["items"] for pin in item["pins"]])

    def test_a_delayed_older_release_never_rolls_the_parent_back(self) -> None:
        """Retro D4: release jobs can arrive out of order; only the newest release auto-advances."""
        exports = self.child_export()["id"]
        self.service.update_export(DESIGNER, self.sid, self.version(), exports, {"description": "v2 wording"})
        v2 = self.publish_next("V2")
        self.service.update_export(DESIGNER, self.sid, self.version(), exports, {"description": "v3 wording"})
        v3 = self.publish_next("V3")
        self.assertEqual(self.advance(v3["revisionId"])["outcome"], "auto_advanced")
        late = self.advance(v2["revisionId"])
        self.assertEqual(late["outcome"], "superseded")
        self.assertEqual(self.cndh_instance()["catalog_revision_id"], v3["revisionId"])
        # A manual rebase may still go back on purpose.
        result = self.service.rebase_child(DESIGNER, self.bus, self.bus_doc()["system"]["version"], self.cndh,
                                           v2["revisionId"])
        self.assertEqual(result.body["outcome"], "auto_advanced")
        self.assertEqual(self.cndh_instance()["catalog_revision_id"], v2["revisionId"])

    def test_an_automatic_check_skips_an_instance_that_stopped_following(self) -> None:
        self.service.update_export(DESIGNER, self.sid, self.version(), self.child_export()["id"], {"description": "x"})
        v2 = self.publish_next("V2")
        with self.connect() as conn:  # pinned between the job's listing and its run
            conn.execute("UPDATE system_instances SET follow = 'pinned' WHERE id = %s", (self.cndh,))
            conn.commit()
        self.assertEqual(self.advance(v2["revisionId"])["outcome"], "not_following")
        self.assertEqual(self.cndh_instance()["catalog_revision_id"], self.publication["revisionId"])

    def test_keep_pinned_stops_following(self) -> None:
        self.service.update_export(DESIGNER, self.sid, self.version(), self.child_export()["id"],
                                   {"instanceId": self.instances["OBC-B"], "portKey": self.port_key("OBC-B", "J5")})
        v2 = self.publish_next("V2")
        self.advance(v2["revisionId"])
        [review] = [r for r in self.service.list_reviews(DESIGNER, self.bus, "open") if r["kind"] == "child_update"]
        self.service.keep_pinned(DESIGNER, self.bus, self.bus_doc()["system"]["version"], review["id"])
        instance = self.cndh_instance()
        self.assertEqual((instance["follow"], instance["catalog_revision_id"]), ("pinned", self.publication["revisionId"]))
        [doc] = [i for i in self.bus_doc()["instances"] if i["id"] == self.cndh]
        self.assertTrue(doc["updateAvailable"])

    def test_manual_rebase_to_a_revision(self) -> None:
        self.service.update_export(DESIGNER, self.sid, self.version(), self.child_export()["id"], {"description": "x"})
        v2 = self.publish_next("V2", release=False)
        result = self.service.rebase_child(DESIGNER, self.bus, self.bus_doc()["system"]["version"], self.cndh,
                                           v2["revisionId"])
        self.assertEqual(result.body["outcome"], "auto_advanced")
        # The pinned revision is unreleased: SYS-V14.
        findings = self.service.validation_report(DESIGNER, self.bus).body["findings"]
        self.assertEqual([(f["rule"], f["detail"]["reason"]) for f in findings if f["rule"] == "SYS-V14"],
                         [("SYS-V14", "unreleased")])
        with self.assertRaisesRegex(Conflict, "already pins"):
            self.service.rebase_child(DESIGNER, self.bus, self.bus_doc()["system"]["version"], self.cndh,
                                      v2["revisionId"])

    def test_release_triggers_the_parent_check(self) -> None:
        self.service.update_export(DESIGNER, self.sid, self.version(), self.child_export()["id"], {"description": "y"})
        _, v2 = self.publish(self.snapshot("V2")["id"])
        with mock.patch("app.services.systems.child_drift.enqueue_child_check") as enqueue:
            self.release(v2["componentId"])
        enqueue.assert_called_once_with(v2["componentId"], v2["revisionId"])
        # The job the release queued, run as the worker would.
        context = SimpleNamespace(payload={"componentId": v2["componentId"], "revisionId": v2["revisionId"]},
                                  progress=lambda **_: None)
        with mock.patch.object(service_module, "service", self.service), \
                mock.patch("app.services.systems.jobs.workspace_connection", self.connect):
            self.assertEqual(child_drift.followers(self.connect, v2["componentId"]), [(self.bus, self.cndh)])
            result = child_drift.run_child_check_job(context)
        self.assertEqual(result.details["outcomes"], {"auto_advanced": 1})


class ChildFindingTest(unittest.TestCase):
    def test_v14_and_v15(self) -> None:
        findings = validation.child_findings([
            {"instanceId": "a", "releaseStatus": "open", "openReviewCount": 0, "blocked": False},
            {"instanceId": "b", "releaseStatus": "released", "openReviewCount": 2, "blocked": True},
            {"instanceId": "c", "releaseStatus": "released", "openReviewCount": 0, "blocked": False},
        ])
        self.assertEqual([(f["rule"], f["instanceId"], f["detail"].get("reason")) for f in findings],
                         [("SYS-V14", "a", "unreleased"), ("SYS-V14", "b", "open_reviews"), ("SYS-V15", "b", None)])


if __name__ == "__main__":
    unittest.main()

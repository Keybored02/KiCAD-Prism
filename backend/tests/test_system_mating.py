"""SB2-12: stored mating frames (CONTRACTS_P2 §15.2–§15.3) on the P1 fixture boards.

The fixture headers are ``PinHeader_…_Vertical`` footprints without courtyard
graphics, so their frames infer at ``medium`` (``name_vertical``, ``no_courtyard``).
"""

from __future__ import annotations

from system_builder_db import FixtureSystemCase

from app.services.systems import manifest as manifest_io
from app.services.systems import interface_cache
from app.services.systems.jobs import extract_and_store
from app.services.systems.service import Caller, SystemService
from app.services.systems.store import Conflict, Invalid

DESIGNER = Caller(role="designer", email="designer@example.com")
VIEWER = Caller(role="viewer", email="viewer@example.com")


class MatingTest(FixtureSystemCase):
    def setUp(self) -> None:
        super().setUp()
        self.service = SystemService(connect=self.connect, project_loader=self.projects.get,
                                     enqueue=lambda *a, **k: {"job_id": "j", "status": "queued"})
        for board, project_id in (("mini_obc", "prj_obc"), ("mini_payload", "prj_pay"), ("mini_power", "prj_pwr")):
            extract_and_store(self.projects[project_id], self.commits[board]["F0"], self.connect)
        self.obc = self.instances["OBC-A"]

    def port(self, reference: str, instance: str | None = None) -> dict:
        ports = self.service.mating(VIEWER, self.sid, instance or self.obc)["ports"]
        return next(p for p in ports if p["reference"] == reference)

    def findings(self, rule: str) -> list[dict]:
        return [f for f in self.service.validation_report(DESIGNER, self.sid).body["findings"] if f["rule"] == rule]

    def test_ports_list_their_inference(self) -> None:
        body = self.service.mating(VIEWER, self.sid, self.obc)
        self.assertEqual(body["boardThicknessMm"], 1.6)
        j6 = self.port("J6")
        self.assertEqual(j6["inferred"], {"axis": "top", "confidence": "medium",
                                          "reasons": ["name_vertical", "no_courtyard"]})
        self.assertIsNone(j6["stored"])
        self.assertTrue(j6["hasGeometry"])

    def test_confirm_override_and_clear_are_versioned_and_audited(self) -> None:
        key = self.port("J6")["portKey"]
        version = self.version()
        confirmed = self.service.set_mating(DESIGNER, self.sid, version, self.obc, key, {"mode": "confirmed"})
        self.assertEqual(confirmed.version, version + 1)
        self.assertEqual(confirmed.body["stored"], {"mode": "confirmed", "axis": "top", "quarterTurns": 0,
                                                    "stale": False})
        overridden = self.service.set_mating(DESIGNER, self.sid, confirmed.version, self.obc, key,
                                             {"mode": "override", "axis": "bottom", "quarterTurns": 3})
        self.assertEqual(overridden.body["stored"]["axis"], "bottom")
        cleared = self.service.set_mating(DESIGNER, self.sid, overridden.version, self.obc, key, None)
        self.assertIsNone(cleared.body["stored"])
        kinds = [e["payload"]["after"] for e in self.events("mating_updated")]
        self.assertEqual([k and k["mode"] for k in reversed(kinds)], ["confirmed", "override", None])

    def test_refusals(self) -> None:
        key = self.port("J6")["portKey"]
        with self.assertRaises(Invalid):
            self.service.set_mating(DESIGNER, self.sid, self.version(), self.obc, key,
                                    {"mode": "override", "axis": "sideways", "quarterTurns": 0})
        with self.assertRaises(Invalid):
            self.service.set_mating(DESIGNER, self.sid, self.version(), self.obc, key,
                                    {"mode": "confirmed", "axis": "+x", "quarterTurns": 1})
        with self.assertRaises(Invalid):
            self.service.set_mating(DESIGNER, self.sid, self.version(), self.obc, "/not-a-port", {"mode": "confirmed"})
        # A connector with fewer than two pad positions cannot be inferred: confirm is 409, override works.
        interface_cache.interfaces.clear()  # a direct artifact write bypasses the SB2-93 cache
        self.conn.execute(
            """UPDATE system_interface_artifacts SET payload = jsonb_set(payload, '{components}',
                 (SELECT jsonb_agg(CASE WHEN c->>'reference' = 'J6'
                    THEN jsonb_set(c, '{geometry,pads}', jsonb_build_array(c->'geometry'->'pads'->0)) ELSE c END)
                  FROM jsonb_array_elements(payload->'components') c))
               WHERE project_id = 'prj_obc'"""
        )
        self.conn.commit()
        with self.assertRaises(Conflict) as refused:
            self.service.set_mating(DESIGNER, self.sid, self.version(), self.obc, key, {"mode": "confirmed"})
        self.assertTrue(str(refused.exception).startswith("mating_not_inferable"))
        self.service.set_mating(DESIGNER, self.sid, self.version(), self.obc, key,
                                {"mode": "override", "axis": "top", "quarterTurns": 0})

    def test_a_moved_footprint_makes_the_frame_stale(self) -> None:
        key = self.port("J6")["portKey"]
        self.service.set_mating(DESIGNER, self.sid, self.version(), self.obc, key, {"mode": "confirmed"})
        self.assertEqual(self.findings("SYS-V17"), [])
        interface_cache.interfaces.clear()  # a direct artifact write bypasses the SB2-93 cache
        self.conn.execute(
            """UPDATE system_interface_artifacts SET payload = jsonb_set(payload, '{components}',
                 (SELECT jsonb_agg(CASE WHEN c->>'reference' = 'J6'
                    THEN jsonb_set(c, '{geometry,positionMm}', '[51.0, -10.0]'::jsonb) ELSE c END)
                  FROM jsonb_array_elements(payload->'components') c))
               WHERE project_id = 'prj_obc'"""
        )
        self.conn.commit()
        self.assertTrue(self.port("J6")["stored"]["stale"])
        [stale] = self.findings("SYS-V17")
        self.assertEqual((stale["severity"], stale["instanceId"], stale["reference"], stale["detail"]["portKey"]),
                         ("info", self.obc, "J6", key))

    def test_the_manifest_round_trips_stored_frames(self) -> None:
        key = self.port("J6")["portKey"]
        self.service.set_mating(DESIGNER, self.sid, self.version(), self.obc, key,
                                {"mode": "override", "axis": "+y", "quarterTurns": 2})
        before = manifest_io.build(self.store, self.sid, created_by="user:t", created_at="2026-09-30T00:00:00+00:00")
        [record] = before.mating
        self.assertEqual((record.instanceId, record.portKey, record.mode, record.frame.axis, record.frame.quarterTurns),
                         (self.obc, key, "override", "+y", 2))
        self.assertTrue(record.geometryDigest.startswith("sha256:"))
        self.store.delete_system(self.sid)
        self.conn.commit()
        manifest_io.import_manifest(self.store, before, actor="user:importer")
        self.conn.commit()
        after = manifest_io.build(self.store, self.sid, created_by="user:t", created_at="2026-09-30T00:00:00+00:00")
        self.assertEqual(after.mating, before.mating)

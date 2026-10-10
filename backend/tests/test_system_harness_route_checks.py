"""SB2-46: harness lengths and SYS-V12/V13/V20 from the server's route (CONTRACTS_P2 §17.10).

OBC-A and PWR get the SB2-21 Samtec boards (real outlines and connector geometry); a two-end
harness joins their J1s. PAY gets a board too and is posed across the cable's middle.
"""

from __future__ import annotations

import test_system_auto_placement as auto_placement
from test_system_scene import SceneCase
from test_system_snapshots import DESIGNER

from app.services.systems import icd
from app.services.systems.drift import _port_baseline
from app.services.systems.placement import harness_route


class HarnessRouteChecksTest(SceneCase):
    # The SB2-37 helpers, without its tests.
    replace_artifact = auto_placement.AutoPlacementTest.replace_artifact
    component = auto_placement.AutoPlacementTest.component
    scene = auto_placement.AutoPlacementTest.scene
    occurrence = auto_placement.AutoPlacementTest.occurrence

    def setUp(self) -> None:
        super().setUp()
        self.base, self.top = self.instances["OBC-A"], self.instances["PWR"]
        self.replace_artifact(self.base, "mezz_base/F0")
        self.replace_artifact(self.top, "mezz_top/F1")
        with self.store.mutation(self.sid, expected_version=None, actor="user:t") as change:
            harness = self.store.create_harness(change, name="WH-R")
            ends = [self.store.add_harness_end(change, harness["id"], mates_instance_id=instance,
                                               mates_port=_port_baseline(self.component(instance, "J1")),
                                               pin_count=4)["ends"][-1]["id"]
                    for instance in (self.base, self.top)]
            self.store.replace_wires(change, harness["id"], [
                {"from": {"end": ends[0], "pin": str(n)}, "to": {"end": ends[1], "pin": str(n)}, "gaugeAwg": 22}
                for n in (1, 2)])
        self.conn.commit()
        self.harness = harness["id"]

    def findings(self, rule: str) -> list[dict]:
        report = self.service.validation_report(DESIGNER, self.sid).body
        return [f for f in report["findings"] if f["rule"] == rule]

    def doc(self) -> dict:
        document = self.service.document(DESIGNER, self.sid).body
        return next(h for h in document["harnesses"] if h["id"] == self.harness)

    def test_lengths_reach_the_document_and_the_icd(self) -> None:
        lengths = self.doc()["lengths"]
        self.assertTrue(lengths["complete"])
        self.assertGreater(lengths["bundleMm"], 16.0)  # two 8 mm housings and the cable between
        self.assertAlmostEqual(lengths["estimatedMm"], round(lengths["bundleMm"] * 1.1, 1), delta=0.11)
        self.assertEqual(len(lengths["wires"]), 2)
        document = self.service.document(DESIGNER, self.sid).body
        html = icd.render_html(document, source="live", generated_at="2026-10-08T00:00:00Z")
        self.assertIn(f"estimated {lengths['estimatedMm']:g} mm", html)
        self.assertIn("<th>Length (mm)</th>", html)

    def test_a_cut_length_far_from_the_estimate_is_v13(self) -> None:
        estimate = self.doc()["lengths"]["estimatedMm"]
        self.assertEqual(self.findings("SYS-V13"), [])
        with self.store.mutation(self.sid, expected_version=None, actor="user:t") as change:
            self.store.update_harness(change, self.harness, {"cutLengthMm": round(estimate * 1.1, 1)})
        self.conn.commit()
        self.assertEqual(self.findings("SYS-V13"), [], "10 % off is within the 15 % tolerance")
        with self.store.mutation(self.sid, expected_version=None, actor="user:t") as change:
            self.store.update_harness(change, self.harness, {"cutLengthMm": round(estimate * 1.5, 1)})
        self.conn.commit()
        [found] = self.findings("SYS-V13")
        self.assertEqual((found["severity"], found["detail"]["harnessId"]), ("warning", self.harness))
        self.assertAlmostEqual(found["detail"]["differencePct"], 50.0, delta=0.2)

    def test_a_board_across_the_cable_is_v12(self) -> None:
        pay = self.instances["PAY"]
        hit = lambda: {f["detail"]["occurrence"] for f in self.findings("SYS-V12")}
        self.replace_artifact(pay, "mezz_base/F0")
        scene = self.scene()
        worlds = {o["path"]: o["worldMatrix"] for o in scene["occurrences"]}
        [harness] = [h for h in scene["harnesses"] if h["id"] == self.harness]
        routed = harness_route.route(harness, worlds.get)
        samples = routed["curves"][0]["samplesMm"]
        middle = samples[len(samples) // 2]
        bounds = self.occurrence(scene, pay)["boundsMm"]
        centre = [(bounds["minMm"][k] + bounds["maxMm"][k]) / 2 for k in range(3)]
        self.service.set_pose(DESIGNER, self.sid, self.version(), pay,
                              {"translationMm": [middle[k] - centre[k] for k in range(3)], "rotation": [0, 0, 0, 1]})
        pay_path = self.occurrence(self.scene(), pay)["path"]
        self.assertIn(pay_path, hit())
        for found in self.findings("SYS-V12"):
            self.assertEqual(found["detail"]["harnessId"], self.harness)
            self.assertLess(found["detail"]["distanceMm"], found["detail"]["radiusMm"])
        # Lifted well clear above the cable, PAY no longer collides.
        self.service.set_pose(DESIGNER, self.sid, self.version(), pay,
                              {"translationMm": [middle[0] - centre[0], middle[1] - centre[1], 500.0], "rotation": [0, 0, 0, 1]})
        self.assertNotIn(pay_path, hit())

    def test_tight_bends_are_info(self) -> None:
        for found in self.findings("SYS-V20"):
            self.assertEqual(found["severity"], "info")
            self.assertLess(found["detail"]["radiusMm"], found["detail"]["minRadiusMm"])

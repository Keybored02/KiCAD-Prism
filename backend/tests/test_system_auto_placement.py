"""SB2-37: auto placement from B2B mates, in the scene and in validation (CONTRACTS_P2 §14.9).

The P1 fixture system (OBC-A, OBC-B, PAY, PWR) has its OBC artifact replaced by the SB2-21
Samtec base board (``mezz_base/F0``) and PWR's by the shifted top board (``mezz_top/F1``).
OBC-A J1/J2 then mate PWR J1/J2 through two B2B links with the D-P2-34 stack of 7.00 mm.
"""

from __future__ import annotations

import json
from pathlib import Path

from test_system_scene import SceneCase
from test_system_snapshots import DESIGNER, VIEWER

from app.services.systems import mating as mating_module
from app.services.systems.drift import _port_baseline
from app.services.systems.interface_extractor import EXTRACTOR_VERSION, extract_interface
from app.services.systems.placement import poses

P2 = Path(__file__).resolve().parent / "fixtures" / "system_builder" / "p2"
GOLDEN = json.loads((P2 / "goldens" / "geometry_fixtures.json").read_text())


class AutoPlacementTest(SceneCase):
    def setUp(self) -> None:
        super().setUp()
        self.base, self.top = self.instances["OBC-A"], self.instances["PWR"]
        self.replace_artifact(self.base, "mezz_base/F0")
        self.replace_artifact(self.top, "mezz_top/F1")
        with self.store.mutation(self.sid, expected_version=None, actor="user:t") as change:
            self.links = {ref: self.store.create_link(
                change, a_instance_id=self.base, a_port=_port_baseline(self.component(self.base, ref)), b_instance_id=self.top,
                b_port=_port_baseline(self.component(self.top, ref)), name=f"stack {ref}", link_type="b2b",
                stack_height_mm=GOLDEN["mezzanine"]["matedHeightMm"])["id"] for ref in ("J1", "J2")}
        self.conn.commit()

    def replace_artifact(self, instance_id: str, snapshot: str) -> None:
        row = self.store.get_instance(self.sid, instance_id)
        board, step = snapshot.split("/")
        payload = extract_interface(P2 / "sources" / board / step / f"{board}.kicad_pro",
                                    project_id=row["project_id"], commit=row["baseline_commit"])
        self.conn.execute("DELETE FROM system_interface_artifacts WHERE project_id = %s AND commit = %s",
                          (row["project_id"], row["baseline_commit"]))
        self.store.put_interface(payload)
        self.conn.commit()

    def component(self, instance_id: str, reference: str) -> dict:
        row = self.store.get_instance(self.sid, instance_id)
        artifact = self.store.get_interface(row["project_id"], row["baseline_commit"], EXTRACTOR_VERSION)
        return next(c for c in artifact["components"] if c["reference"] == reference)

    def confirm(self, *pairs: tuple[str, str]) -> None:
        with self.store.mutation(self.sid, expected_version=None, actor="user:t") as change:
            for instance_id, reference in pairs:
                found = self.component(instance_id, reference)
                self.store.set_mating(change, instance_id, found["portKey"],
                                      mating_module.record_for(found, "confirmed", None, None))
        self.conn.commit()

    def confirm_all(self) -> None:
        self.confirm(*[(i, r) for i in (self.base, self.top) for r in ("J1", "J2")])

    def scene(self, caller=DESIGNER) -> dict:
        return self.service.scene(caller, self.sid)

    def occurrence(self, scene: dict, instance_id: str) -> dict:
        return next(o for o in scene["occurrences"] if o["instanceId"] == instance_id)

    def relative(self, scene: dict) -> dict:
        """PWR's pose in OBC-A's frame."""
        base, top = self.occurrence(scene, self.base)["pose"], self.occurrence(scene, self.top)["pose"]
        x, y, z, w = base["rotation"]
        inverse = {"translationMm": [-c for c in poses.rotate([-x, -y, -z, w], base["translationMm"])],
                   "rotation": [-x, -y, -z, w]}
        return poses.compose(inverse, top)

    def driven(self, scene: dict) -> dict:
        """The one of the pair placed through a mate (the root is whichever has more links)."""
        [found] = [self.occurrence(scene, i) for i in (self.base, self.top) if self.occurrence(scene, i)["mate"]]
        return found

    def v11(self) -> list[dict]:
        return [f for f in self.service.validation_report(DESIGNER, self.sid).body["findings"] if f["rule"] == "SYS-V11"]

    # ------------------------------------------------------------------

    def test_unconfirmed_frames_place_nothing(self) -> None:
        scene = self.scene()
        self.assertEqual({self.occurrence(scene, i)["pose"]["source"] for i in (self.base, self.top)}, {"default"})
        self.assertEqual(sorted(scene["placement"]["unusable"]), sorted(self.links.values()))
        self.assertEqual(self.v11(), [])

    def test_confirmed_mates_stack_the_top_board_and_raise_v11_on_the_shifted_pair(self) -> None:
        self.confirm_all()
        scene = self.scene()
        pwr = self.driven(scene)
        self.assertEqual(pwr["pose"]["source"], "auto")
        self.assertEqual(pwr["mate"]["linkId"], self.links["J1"], "equal rows: J1 drives (lower reference)")
        self.assertFalse(pwr["mate"]["overridden"])
        relative = self.relative(scene)
        expected = GOLDEN["mezzanine"]["topPoseInBaseFrame"]
        for got, want in zip(relative["translationMm"], expected["translationMm"]):
            self.assertAlmostEqual(got, want, delta=0.01)
        for got, want in zip(relative["rotation"], expected["rotation"]):
            self.assertAlmostEqual(got, want, delta=1e-6)
        self.assertEqual(scene["placement"]["unusable"], [])
        [mismatch] = scene["placement"]["mismatches"]
        self.assertEqual(mismatch["linkId"], self.links["J2"])
        self.assertAlmostEqual(mismatch["lateralMm"], GOLDEN["mezzanineShifted"]["residualMm"]["J2"], delta=0.01)

        [finding] = self.v11()
        self.assertEqual((finding["linkId"], finding["severity"]), (self.links["J2"], "warning"))
        self.assertAlmostEqual(finding["detail"]["lateralMm"], 1.5, delta=0.01)
        # Viewers see the same placement.
        self.assertEqual(self.occurrence(self.scene(VIEWER), pwr["instanceId"])["pose"], pwr["pose"])

    def test_a_driving_override_moves_the_mismatch_to_the_other_pair(self) -> None:
        self.confirm_all()
        driven = self.driven(self.scene())["instanceId"]
        result = self.service.set_driving_mate(DESIGNER, self.sid, self.version(), driven, self.links["J2"])
        self.assertEqual(result.body, {"instanceId": driven, "linkId": self.links["J2"]})
        scene = self.scene()
        self.assertEqual(self.occurrence(scene, driven)["mate"]["linkId"], self.links["J2"])
        self.assertEqual([m["linkId"] for m in scene["placement"]["mismatches"]], [self.links["J1"]])
        self.assertAlmostEqual(self.relative(scene)["translationMm"][0], -1.5, delta=0.01)
        self.assertEqual(self.service.driving_mates(VIEWER, self.sid)["drivingMates"],
                         [{"instanceId": driven, "linkId": self.links["J2"]}])
        kinds = [e["kind"] for e in self.store.history(self.sid)]
        self.assertIn("driving_mate_updated", kinds)
        self.service.set_driving_mate(DESIGNER, self.sid, self.version(), driven, None)
        self.assertEqual(self.occurrence(self.scene(), driven)["mate"]["linkId"], self.links["J1"])

    def test_a_driving_override_must_be_one_of_the_instances_b2b_links(self) -> None:
        from app.services.systems.store import Invalid

        other = next(link for link in self.store.list_links(self.sid) if link["type"] != "b2b")
        with self.assertRaises(Invalid):
            self.service.set_driving_mate(DESIGNER, self.sid, self.version(), other["a_instance_id"], other["id"])
        with self.assertRaises(Invalid):
            self.service.set_driving_mate(DESIGNER, self.sid, self.version(), self.instances["PAY"], self.links["J1"])

    def test_a_manual_move_is_overridden_and_keeps_its_auto_pose(self) -> None:
        self.confirm_all()
        driven = self.driven(self.scene())
        auto, key = driven["pose"], driven["instanceId"]
        self.service.set_pose(DESIGNER, self.sid, self.version(), key,
                              {"translationMm": [0.0, 0.0, 50.0], "rotation": [0.0, 0.0, 0.0, 1.0]})
        pwr = self.occurrence(self.scene(), key)
        self.assertEqual(pwr["pose"]["source"], "manual")
        self.assertTrue(pwr["mate"]["overridden"])
        self.assertEqual(pwr["mate"]["autoPose"], {k: auto[k] for k in ("translationMm", "rotation")})
        self.assertEqual(len(self.v11()), 1, "still only the real 1.5 mm miss, not the hand move")

    def test_placement_lists_the_solve_by_instance(self) -> None:
        # SB2-39: the link page reads this instead of the scene.
        empty = self.service.placement(VIEWER, self.sid)
        self.assertEqual((empty["driving"], sorted(empty["unusable"])), ({}, sorted(self.links.values())))
        self.confirm_all()
        got = self.service.placement(VIEWER, self.sid)
        [driven] = list(got["driving"])
        self.assertIn(driven, (self.base, self.top))
        self.assertEqual(got["driving"][driven]["linkId"], self.links["J1"])
        self.assertEqual(got["roots"], [({self.base, self.top} - {driven}).pop()])
        self.assertEqual([m["linkId"] for m in got["mismatches"]], [self.links["J2"]])
        self.assertEqual(got["drivingMates"], {})

    def test_link_mate_returns_both_connectors_for_the_preview(self) -> None:
        self.confirm(( self.base, "J1"))
        got = self.service.link_mate(VIEWER, self.sid, self.links["J1"])
        self.assertEqual(got["stackHeightMm"], 7.0)
        self.assertEqual((got["a"]["instanceId"], got["b"]["instanceId"]), (self.base, self.top))
        self.assertEqual(got["a"]["geometry"], self.component(self.base, "J1")["geometry"])
        self.assertAlmostEqual(got["a"]["thicknessMm"], 1.6)
        self.assertEqual(got["a"]["stored"]["mode"], "confirmed")
        self.assertIsNone(got["b"]["stored"])
        self.assertEqual(got["b"]["inferred"]["axis"], "bottom")
        from app.services.systems.store import Invalid
        other = next(link for link in self.store.list_links(self.sid) if link["type"] != "b2b")
        with self.assertRaises(Invalid):
            self.service.link_mate(VIEWER, self.sid, other["id"])

    def test_a_stale_frame_stops_placing(self) -> None:
        self.confirm_all()
        self.replace_artifact(self.top, "mezz_top/F0")  # J2 moved back: its stored digest no longer matches
        scene = self.scene()
        self.assertIn(self.links["J2"], scene["placement"]["unusable"])
        self.assertEqual(self.driven(scene)["mate"]["linkId"], self.links["J1"])
        self.assertEqual(scene["placement"]["mismatches"], [])


if __name__ == "__main__":
    import unittest

    unittest.main()

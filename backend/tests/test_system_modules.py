"""SB2-49: module instances in systems (CONTRACTS_P2 §5.6).

The module is the made-up two-connector IMU of SB2-48 (D-P2-38): unit A "POWER/SERIAL" (pads 1–6)
and unit B "AUX" (pads 7–9), each placed as the SB2-21 fixture's 2×5 header on the module's model.
It joins the P1 fixture system (OBC-A, OBC-B, PAY, PWR): its connectors are ports, a harness wires
one to OBC-A, and a B2B link mates the other to OBC-A's J6, placed by the connector part's frame.
"""

from __future__ import annotations

import math
import uuid

from test_catalog_modules import CONNECTOR, STEP, module_symbol
from test_system_publish import PublishCase
from test_system_snapshots import DESIGNER, VIEWER

from app.services.systems import modules
from app.services.systems.interface_extractor import EXTRACTOR_VERSION
from app.services.systems.jobs import extract_and_store
from app.services.systems.placement import poses
from app.services.systems.placement.frames import connector_frame
from app.services.systems.placement.mate import _frame_pose
from app.services.systems.placement.module_ports import part_frame
from app.services.systems.store import Invalid

# A on the module's top face; B on its −x face, a quarter turn.
PLACEMENTS = {"A": {"originMm": [0.0, 0.0, 10.0], "normal": [0.0, 0.0, 1.0], "quarterTurns": 0},
              "B": {"originMm": [-12.0, 0.0, 4.0], "normal": [-1.0, 0.0, 0.0], "quarterTurns": 1}}


class ModuleInstanceTest(PublishCase):
    def setUp(self) -> None:
        super().setUp()
        for board, project_id in (("mini_obc", "prj_obc"), ("mini_payload", "prj_pay"), ("mini_power", "prj_pwr")):
            extract_and_store(self.projects[project_id], self.commits[board]["F0"], self.connect)
        self.module_id = self.module()

    def tearDown(self) -> None:
        for component_id in getattr(self, "made", []):
            self.catalog.deactivate_component(component_id, actor="t@local", reason="SB2-49 test cleanup")
        super().tearDown()

    def module(self) -> str:
        self.made = []
        # Symbols are stored per library name in the shared catalog database: one library per test.
        self.library = f"T{uuid.uuid4().hex[:8]}"
        created = self.catalog.create_manual_component(
            kind="module", value="TEST_IMU", description="Made-up two-connector IMU", datasheet="https://example.com/imu.pdf",
            manufacturer="Example Sensors", manufacturer_part_number=f"IMU-{uuid.uuid4().hex[:8]}", actor="author@example.com")
        module_id = str(created["id"])
        self.made.append(module_id)
        self.catalog.import_symbol_library(module_id, upload_name="TEST_IMU.kicad_sym", payload=module_symbol().encode(),
                                           target_library=self.library, selected_symbol="TEST_IMU", actor="author@example.com")
        self.catalog.attach_auxiliary_asset(module_id, asset_type="3dmodel", upload_name=STEP.name, payload=STEP.read_bytes(),
                                            target_library="Test", actor="author@example.com")
        part = self.catalog.create_manual_component(
            value="Conn_Custom_2x05", description="Made-up 2x05 header", datasheet="https://example.com/c.pdf",
            manufacturer="Test", manufacturer_part_number=f"HDR-{uuid.uuid4().hex[:8]}", actor="author@example.com")
        self.part_id = str(part["id"])
        self.made.append(self.part_id)
        self.catalog.import_footprint(self.part_id, upload_name=CONNECTOR.name, payload=CONNECTOR.read_bytes(),
                                      target_library="Test", selected_footprint="Conn_Custom_2x05", actor="author@example.com")
        for key, placement in PLACEMENTS.items():
            self.catalog.system_items.set_module_connector(module_id, key, self.part_id, placement, actor="author@example.com")
        for stage, actor, role in (("in_progress", "author@example.com", "designer"),
                                   ("qa_review", "author@example.com", "designer"),
                                   ("done", "qa@example.com", "qa"), ("released", "qa@example.com", "admin")):
            self.catalog.set_release_status(module_id, stage, actor=actor, actor_role=role)
        return module_id

    def add(self) -> dict:
        return self.service.add_catalog_instance(DESIGNER, self.sid, self.version(), kind="module", label="IMU",
                                                 component_id=self.module_id, revision_id=None,
                                                 follow="latest_released").body

    def obc_port(self, reference: str) -> str:
        interface = self.store.get_interface("prj_obc", self.commits["mini_obc"]["F0"], EXTRACTOR_VERSION)
        return next(c["portKey"] for c in interface["components"] if c["reference"] == reference)

    def test_a_module_joins_with_its_connectors_as_ports(self) -> None:
        imu = self.add()
        self.assertEqual((imu["kind"], imu["follow"]), ("module", "latest_released"))
        document = self.service.document(VIEWER, self.sid).body
        [doc] = [i for i in document["instances"] if i["id"] == imu["id"]]
        self.assertEqual([(p["portKey"], p["reference"], p["pinCount"], p["candidateReason"]) for p in doc["ports"]],
                         [("A", "POWER/SERIAL", 6, "module"), ("B", "AUX", 3, "module")])
        self.assertEqual(doc["catalog"]["releaseStatus"], "released")
        with self.assertRaisesRegex(Invalid, "is a module, not a assembly"):
            self.service.add_catalog_instance(DESIGNER, self.sid, self.version(), kind="assembly", label="X",
                                              component_id=self.module_id, revision_id=None, follow="pinned")

    def test_module_ports_carry_signals_geometry_and_their_pose(self) -> None:
        interface = self.service._module_interface(self.add()["catalogRevisionId"])
        a = modules.component(interface, "A")
        self.assertEqual([(p["pad"], p["nets"], p["powerNet"]) for p in a["pins"]][:3],
                         [("1", ["VIN"], True), ("2", ["GND"], True), ("3", ["RX_P"], False)])
        self.assertEqual(a["pins"][5]["nets"], [], "an unnamed pin has no net")
        self.assertEqual((a["boardThicknessMm"], a["matingFrame"]["axis"]), (0.0, part_frame(a["geometry"])["axis"]))
        # The footprint pose puts the part's mating frame on the face: its origin at the placement's origin.
        placed = poses.compose(a["footprintPose"], _frame_pose(connector_frame(a["geometry"], 0.0, a["matingFrame"])))
        for got, want in zip(placed["translationMm"], PLACEMENTS["A"]["originMm"]):
            self.assertAlmostEqual(got, want, places=6)

    def test_a_harness_wires_the_module_to_a_board(self) -> None:
        imu = self.add()
        harness = self.service.create_harness(DESIGNER, self.sid, self.version(), {
            "name": "IMU-OBC", "ends": [{"instanceId": imu["id"], "portKey": "A"},
                                        {"instanceId": self.instances["OBC-A"], "portKey": self.obc_port("J6")}]}).body
        [a_end, obc_end] = harness["ends"]
        self.assertEqual(a_end["mates"]["port"]["portKey"], "A")
        wired = self.service.replace_wires(DESIGNER, self.sid, self.version(), harness["id"], [
            {"from": {"end": a_end["id"], "pin": "1"}, "to": {"end": obc_end["id"], "pin": "1"}, "signal": "VIN"}]).body
        [wire] = wired["wires"]
        self.assertEqual(wire["netFrom"], ["VIN"], "the module pin's signal is its net")
        scene = self.service.scene(VIEWER, self.sid)
        [drawn] = [h for h in scene["harnesses"] if h["id"] == harness["id"]]
        module_end = next(e for e in drawn["ends"] if e["reference"] == "POWER/SERIAL")
        self.assertEqual(module_end["connector"]["thicknessMm"], 0.0)
        self.assertIn("inOccurrence", module_end["connector"], "the connector's pose on the module rides along")
        [occurrence] = [o for o in scene["occurrences"] if o["instanceId"] == imu["id"]]
        self.assertEqual(occurrence["kind"], "module")

    def test_a_system_net_traces_from_the_board_through_the_harness_to_the_module_pin(self) -> None:
        """SB2-50's acceptance: the OBC net and the IMU signal are one system net, joined by the wire."""
        imu = self.add()
        obc_port = self.obc_port("J6")
        harness = self.service.create_harness(DESIGNER, self.sid, self.version(), {
            "name": "IMU-OBC", "ends": [{"instanceId": self.instances["OBC-A"], "portKey": obc_port},
                                        {"instanceId": imu["id"], "portKey": "A"}]}).body
        obc_end, imu_end = harness["ends"]
        obc_net = next(p["nets"][0] for p in self.store.get_interface_component(
            "prj_obc", self.commits["mini_obc"]["F0"], EXTRACTOR_VERSION, obc_port)["pins"] if p["pad"] == "1" and p["nets"])
        self.service.replace_wires(DESIGNER, self.sid, self.version(), harness["id"], [
            {"from": {"end": obc_end["id"], "pin": "1"}, "to": {"end": imu_end["id"], "pin": "3"}, "signal": "RX_P"}])
        groups = self.service.nets(VIEWER, self.sid, search="RX_P", members=True)["groups"]
        [group] = [g for g in groups if any(m["net"] == "RX_P" for m in g["members"])]
        imu_path = f"/{imu['id']}"
        self.assertIn({"occurrence": imu_path, "net": "RX_P"}, group["members"])
        self.assertIn({"occurrence": f"/{self.instances['OBC-A']}", "net": obc_net}, group["members"])
        [hop] = [h for h in self.service.net(VIEWER, self.sid, group["groupId"])["hops"] if h["kind"] == "wire"]
        self.assertEqual({hop["from"]["occurrence"], hop["to"]["occurrence"]}, {f"/{self.instances['OBC-A']}", imu_path})

    def test_a_b2b_link_mates_the_module_by_its_connector_part(self) -> None:
        imu = self.add()
        # §15.2: a mate places only between confirmed frames; the module's is its catalog placement.
        self.service.set_mating(DESIGNER, self.sid, self.version(), self.instances["OBC-A"], self.obc_port("J6"),
                                {"mode": "confirmed"})
        link = self.service.create_link(DESIGNER, self.sid, self.version(),
                                        a={"instanceId": self.instances["OBC-A"], "portKey": self.obc_port("J6")},
                                        b={"instanceId": imu["id"], "portKey": "B"}, name="IMU stack", harness=None,
                                        link_type="b2b", stack_height_mm=5.0).body
        scene = self.service.scene(VIEWER, self.sid)
        self.assertNotIn(link["id"], scene["placement"]["unusable"])
        worlds = {o["instanceId"]: o for o in scene["occurrences"]}
        imu_occurrence = worlds[imu["id"]]
        self.assertEqual(imu_occurrence["mate"]["linkId"], link["id"], "the link drives the module's pose")
        # The two mating frames face each other 5 mm apart.
        interface = self.service._module_interface(imu["catalogRevisionId"])
        b = modules.component(interface, "B")
        imu_frame = poses.compose(poses.compose(imu_occurrence["pose"], b["footprintPose"]),
                                  _frame_pose(connector_frame(b["geometry"], 0.0, b["matingFrame"])))
        obc = self.store.get_interface_component("prj_obc", self.commits["mini_obc"]["F0"], EXTRACTOR_VERSION,
                                                 self.obc_port("J6"))
        obc_world = worlds[self.instances["OBC-A"]]["pose"]
        obc_frame = poses.compose(obc_world, _frame_pose(connector_frame(obc["geometry"], obc["boardThicknessMm"])))
        z_imu = poses.rotate(imu_frame["rotation"], [0, 0, 1])
        z_obc = poses.rotate(obc_frame["rotation"], [0, 0, 1])
        self.assertAlmostEqual(sum(p * q for p, q in zip(z_imu, z_obc)), -1.0, places=6)
        gap = [p - q for p, q in zip(imu_frame["translationMm"], obc_frame["translationMm"])]
        self.assertAlmostEqual(math.hypot(*gap), 5.0, places=4)

    def release(self) -> str:
        """Walk the module's current revision to released (resuming where it is); its revision ID."""
        stages = (("in_progress", "author@example.com", "designer"), ("qa_review", "author@example.com", "designer"),
                  ("done", "qa@example.com", "qa"), ("released", "qa@example.com", "admin"))
        names = [stage for stage, _actor, _role in stages]
        current = self.catalog.get_component(self.module_id)["release_status"]
        for stage, actor, role in stages[names.index(current) + 1 if current in names else 0:]:
            self.catalog.set_release_status(self.module_id, stage, actor=actor, actor_role=role)
        return str(self.catalog.get_component(self.module_id)["current_revision_id"])

    def revise(self, symbol: str) -> str:
        """A new released revision of the module with ``symbol``."""
        self.catalog.import_symbol_library(self.module_id, upload_name="TEST_IMU.kicad_sym", payload=symbol.encode(),
                                           target_library=self.library, selected_symbol="TEST_IMU", actor="author@example.com")
        return self.release()

    def test_a_released_revision_with_the_same_connectors_advances_silently(self) -> None:
        """SB2-51: a module revision compares as its connectors, like an assembly's exports (D-P2-4)."""
        imu = self.add()
        self.service.create_harness(DESIGNER, self.sid, self.version(), {
            "name": "IMU-OBC", "ends": [{"instanceId": imu["id"], "portKey": "A"},
                                        {"instanceId": self.instances["OBC-A"], "portKey": self.obc_port("J6")}]})
        revision = self.revise(module_symbol().replace("(length 2.54)", "(length 3.81)"))  # graphics only
        self.assertNotEqual(revision, imu["catalogRevisionId"])
        outcome = self.service.advance_child("system:detection", self.sid, imu["id"], revision,
                                             auto_kind="child_auto_advanced")
        if outcome["outcome"] != "auto_advanced":
            print("ITEMS", self.store.open_source_review(imu["id"]))
        self.assertEqual(outcome["outcome"], "auto_advanced")
        self.assertEqual(self.store.get_instance(self.sid, imu["id"])["catalog_revision_id"], revision)

    def test_a_renamed_signal_on_a_wired_pin_opens_a_review(self) -> None:
        imu = self.add()
        harness = self.service.create_harness(DESIGNER, self.sid, self.version(), {
            "name": "IMU-OBC", "ends": [{"instanceId": imu["id"], "portKey": "A"},
                                        {"instanceId": self.instances["OBC-A"], "portKey": self.obc_port("J6")}]}).body
        self.service.replace_wires(DESIGNER, self.sid, self.version(), harness["id"], [
            {"from": {"end": harness["ends"][0]["id"], "pin": "3"}, "to": {"end": harness["ends"][1]["id"], "pin": "1"},
             "signal": "RX_P"}])
        revision = self.revise(module_symbol().replace('"RX_P"', '"RX_PLUS"'))
        outcome = self.service.advance_child("system:detection", self.sid, imu["id"], revision,
                                             auto_kind="child_auto_advanced")
        state = {"wires": [(w["netFrom"], w["netTo"]) for w in self.service.list_harnesses(VIEWER, self.sid)[-1]["wires"]],
                 "pin3": modules.component(self.service._module_interface(revision), "A")["pins"][2]["nets"],
                 "revisions": (imu["catalogRevisionId"], revision)}
        self.assertEqual(outcome["outcome"], "review_opened", state)
        self.assertEqual(self.store.get_instance(self.sid, imu["id"])["catalog_revision_id"], imu["catalogRevisionId"],
                         "the pinned revision stays until the review is applied")
        review = self.store.open_source_review(imu["id"])
        self.assertEqual((review["kind"], review["to_commit"]), ("child_update", revision))

    def test_module_frames_are_not_edited_in_the_system(self) -> None:
        imu = self.add()
        with self.assertRaisesRegex(Invalid, "connector placement in the catalog"):
            self.service.mating(VIEWER, self.sid, imu["id"])


class ModuleHarnessRouteTest(__import__("unittest").TestCase):
    """A module end (connector at ``inOccurrence`` on its occurrence) routes like a board end posed there
    (§5.6); ``harness-route.test.ts`` checks the TypeScript twin the same way."""

    def test_in_occurrence_composes_onto_the_occurrence(self) -> None:
        import json
        from pathlib import Path

        from app.services.systems.placement import harness_route

        cases = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" / "placement_cases.json").read_text())
        geometry = cases["modulePorts"][0]["input"]["geometry"]
        at = {"translationMm": [5.0, -3.0, 12.0], "rotation": poses.canonical_rotation([0.0, 0.3826834, 0.0, 0.9238795])}

        def harness(module_end: dict) -> dict:
            far = {"id": "e2", "ordinal": 1, "occurrence": "/b",
                   "connector": {"geometry": geometry, "thicknessMm": 1.6, "stored": {"axis": "top", "quarterTurns": 0}}}
            return {"id": "h", "level": None, "ends": [{"id": "e1", "ordinal": 0, **module_end}, far],
                    "wires": [{"id": "w", "from": "e1", "to": "e2", "gaugeAwg": 24}], "nodes": []}

        stored = {"axis": "top", "quarterTurns": 0}
        board = poses.matrix({"translationMm": [80.0, 0.0, 0.0], "rotation": [0.0, 0.0, 0.0, 1.0]})
        as_module = harness_route.route(harness({"occurrence": "/m", "connector": {
            "geometry": geometry, "thicknessMm": 0.0, "stored": stored, "inOccurrence": at}}),
            {"/m": poses.matrix(poses.IDENTITY), "/b": board}.get)
        as_board = harness_route.route(harness({"occurrence": "/m", "connector": {
            "geometry": geometry, "thicknessMm": 0.0, "stored": stored}}), {"/m": poses.matrix(at), "/b": board}.get)
        for got, want in zip(as_module["ends"]["e1"]["legMm"], as_board["ends"]["e1"]["legMm"]):
            self.assertAlmostEqual(got, want, places=6)  # the goldens' mm tolerance (pose round trips round at 1e-9)

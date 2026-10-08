"""SB2-48: catalog modules, their connector interface, models and release gates (CONTRACTS_P2 §3.5).

The module here is made up (D-P2-38): a small sensor with one 15-way Micro-D socket and generic
pin names. Its model is a committed open-hardware STEP (a terminal block from the USB-PD fixture),
since the gates only need one to exist.
"""

from __future__ import annotations

import copy
import os
import tempfile
import unittest
import uuid
from pathlib import Path

from app.services.catalog import module_interface

POSTGRES_URL = os.environ.get("TEST_POSTGRES_URL", "").strip()
HEADER = Path(__file__).resolve().parents[2] / "fixtures" / "release-studio" / "usb-pd" / "packages3D" / "796638-2.step"

SIGNALS = {"1": "", "2": "", "3": "RESET_N", "4": "SYNC", "5": "RX_P", "6": "RX_N", "7": "TX_N", "8": "TX_P",
           "9": "GND", "10": "PPS_N", "11": "", "12": "PPS_P", "13": "INHIBIT", "14": "VIN", "15": "GND"}
INTERFACE = {"units": [{"key": "J1", "name": "J1", "description": "Power and serial (15-way Micro-D socket)",
                        "pins": [{"pad": pad, "name": signal or "NC", "signal": signal,
                                  "powerNet": signal in ("VIN", "GND")} for pad, signal in reversed(SIGNALS.items())]}]}


class NormalizeTest(unittest.TestCase):
    def test_canonical_form(self) -> None:
        clean = module_interface.normalize(INTERFACE)
        self.assertEqual(clean["schema"], "prism.module_interface.v1")
        [unit] = clean["units"]
        self.assertEqual([p["pad"] for p in unit["pins"]][:3], ["1", "2", "3"], "pads in natural order")
        self.assertEqual(unit["pins"][13], {"pad": "14", "name": "VIN", "signal": "VIN", "powerNet": True})
        self.assertEqual(module_interface.normalize(clean), clean, "idempotent")

    def test_refusals(self) -> None:
        def broken(change):
            value = copy.deepcopy(INTERFACE)
            change(value)
            return value

        cases = {
            "no connectors": {"units": []},
            "bad key": broken(lambda v: v["units"][0].update(key="J 1")),
            "duplicate key": broken(lambda v: v["units"].append(copy.deepcopy(v["units"][0]))),
            "no pins": broken(lambda v: v["units"][0].update(pins=[])),
            "duplicate pad": broken(lambda v: v["units"][0]["pins"].append({"pad": "1"})),
            "empty pad": broken(lambda v: v["units"][0]["pins"].append({"pad": " "})),
            "long signal": broken(lambda v: v["units"][0]["pins"][0].update(signal="x" * 121)),
            "not an object": [],
        }
        for reason, value in cases.items():
            with self.subTest(case=reason), self.assertRaises(ValueError):
                module_interface.normalize(value)


@unittest.skipUnless(POSTGRES_URL, "TEST_POSTGRES_URL is required for catalog integration tests")
class ModuleItemsTest(unittest.TestCase):
    def setUp(self) -> None:
        from app.services.component_catalog_service_postgres import ComponentCatalogPostgresService

        self.tempdir = tempfile.TemporaryDirectory()
        self.service = ComponentCatalogPostgresService(
            store_root=Path(self.tempdir.name) / "components", database_url=POSTGRES_URL)
        self.service.initialize()
        self.created: list[str] = []

    def tearDown(self) -> None:
        for component_id in self.created:
            self.service.deactivate_component(component_id, actor="test@local", reason="SB2-48 test cleanup")
        self.service.close()
        self.tempdir.cleanup()

    def module(self) -> dict:
        created = self.service.system_items.create_module(
            ipn=f"MOD-{uuid.uuid4().hex[:8]}", name="Test IMU", description="Made-up 15-way sensor module",
            manufacturer="Example Sensors", datasheet_url="https://example.com/imu.pdf", interface=INTERFACE,
            actor="author@example.com")
        self.created.append(created["componentId"])
        return created

    def release(self, component_id: str) -> None:
        for stage, actor, role in (("in_progress", "author@example.com", "designer"),
                                   ("qa_review", "author@example.com", "designer"),
                                   ("done", "qa@example.com", "qa"),
                                   ("released", "qa@example.com", "admin")):
            self.service.set_release_status(component_id, stage, actor=actor, actor_role=role)

    def test_a_module_carries_its_connectors(self) -> None:
        created = self.module()
        component = self.service.get_component(created["componentId"])
        self.assertEqual((component["kind"], component["identity_kind"]), ("module", "provisional_ipn"))
        self.assertEqual(component["interface"], module_interface.normalize(INTERFACE))
        self.assertEqual(component["source_ref"], {"kind": "module"})
        with self.assertRaises(ValueError):
            self.service.system_items.create_module(ipn="MOD-X", name="", description="", manufacturer="m",
                                                    datasheet_url="https://x", interface={"units": []})

    def test_release_needs_a_step_model_and_models_work_on_modules(self) -> None:
        created = self.module()
        component_id = created["componentId"]
        with self.assertRaises(ValueError) as caught:
            self.release(component_id)
        self.assertIn("STEP model", str(caught.exception))
        self.service.attach_auxiliary_asset(component_id, asset_type="3dmodel", upload_name=HEADER.name,
                                            payload=HEADER.read_bytes(), target_library="Test", actor="author@example.com")
        [model] = self.service.system_items.list_models(component_id)
        self.assertIsNone(model["glb"])
        aligned = self.service.system_items.set_model_alignment(
            component_id, model["assetId"], {"offsetMm": [0, 0, 1], "rotationDeg": [0, 0, 0], "scale": 1},
            actor="author@example.com")
        self.assertEqual(aligned[0]["alignment"]["offsetMm"], [0.0, 0.0, 1.0])
        self.release(component_id)
        self.assertEqual(self.service.get_component(component_id)["release_status"], "released")

    def test_revising_the_interface_makes_a_new_revision_with_the_models(self) -> None:
        created = self.module()
        component_id = created["componentId"]
        self.service.attach_auxiliary_asset(component_id, asset_type="3dmodel", upload_name=HEADER.name,
                                            payload=HEADER.read_bytes(), target_library="Test", actor="author@example.com")
        changed = copy.deepcopy(INTERFACE)
        changed["units"][0]["pins"][0]["signal"] = "SPARE"
        revised = self.service.system_items.revise_module(component_id, interface=changed, actor="author@example.com")
        self.assertNotEqual(revised["revisionId"], created["revisionId"])
        component = self.service.get_component(component_id)
        self.assertIn("SPARE", [p["signal"] for p in component["interface"]["units"][0]["pins"]])
        self.assertEqual(len(self.service.system_items.list_models(component_id)), 1, "the model carries over")

    def test_only_modules_take_an_interface_revision(self) -> None:
        part = self.service.create_manual_component(
            value="conn", description="c", datasheet="https://example.com/c.pdf", manufacturer="Test",
            manufacturer_part_number=f"MD-{uuid.uuid4().hex[:8]}", actor="author@example.com")
        self.created.append(str(part["id"]))
        with self.assertRaises(ValueError):
            self.service.system_items.revise_module(str(part["id"]), interface=INTERFACE)


if __name__ == "__main__":
    unittest.main()

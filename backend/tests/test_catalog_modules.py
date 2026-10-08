"""SB2-48: catalog modules, their symbol-derived interface, models and release gates (CONTRACTS_P2 §3.5).

The module here is made up (D-P2-38): a small sensor with two connectors, drawn as a two-unit
KiCad symbol (D-P2-39). Its model is a committed open-hardware STEP (a terminal block from the
USB-PD fixture), since the gate only needs one to exist.
"""

from __future__ import annotations

import os
import tempfile
import unittest
import uuid
from pathlib import Path

from app.services.catalog import module_interface

POSTGRES_URL = os.environ.get("TEST_POSTGRES_URL", "").strip()
STEP = Path(__file__).resolve().parents[2] / "fixtures" / "release-studio" / "usb-pd" / "packages3D" / "796638-2.step"


def _pin(kind: str, number: str, name: str, y: float) -> str:
    return (f'(pin {kind} line (at -5.08 {y} 0) (length 2.54) (name "{name}" (effects (font (size 1.27 1.27)))) '
            f'(number "{number}" (effects (font (size 1.27 1.27)))))')


def module_symbol(*, common_pin: bool = False, repeat_pad: bool = False) -> str:
    """A made-up IMU: unit A "POWER/SERIAL" (pads 1–6), unit B "AUX" (pads 7–9)."""
    unit_a = [("power_in", "1", "VIN"), ("power_in", "2", "GND"), ("input", "3", "RX_P"), ("input", "4", "RX_N"),
              ("output", "5", "TX_P"), ("output", "6", "~")]
    unit_b = [("output", "7", "PPS"), ("input", "8", "SYNC"), ("power_out", "9" if not repeat_pad else "1", "GND")]
    body = lambda pins: " ".join(_pin(k, n, name, -2.54 * i) for i, (k, n, name) in enumerate(pins))
    common = f'(symbol "TEST_IMU_0_1" {_pin("passive", "10", "SHIELD", 5.08)})' if common_pin else ""
    return f'''(kicad_symbol_lib (version 20241209) (generator "prism_test")
  (symbol "TEST_IMU" (in_bom yes) (on_board yes)
    (property "Reference" "U" (at 0 0 0) (effects (font (size 1.27 1.27))))
    (property "Value" "TEST_IMU" (at 0 0 0) (effects (font (size 1.27 1.27))))
    {common}
    (symbol "TEST_IMU_1_1" (unit_name "POWER/SERIAL") {body(unit_a)})
    (symbol "TEST_IMU_2_1" (unit_name "AUX") {body(unit_b)})
  )
)
'''


class FromSymbolTest(unittest.TestCase):
    def write(self, text: str) -> Path:
        handle = tempfile.NamedTemporaryFile("w", suffix=".kicad_sym", delete=False)
        handle.write(text)
        handle.close()
        self.addCleanup(os.unlink, handle.name)
        return Path(handle.name)

    def test_units_are_connectors_and_pin_names_are_signals(self) -> None:
        derived = module_interface.from_symbol_file(self.write(module_symbol()))
        self.assertEqual(derived["schema"], "prism.module_interface.v1")
        self.assertEqual([(u["key"], u["unit"], u["name"], len(u["pins"])) for u in derived["units"]],
                         [("A", 1, "POWER/SERIAL", 6), ("B", 2, "AUX", 3)])
        a, b = derived["units"]
        self.assertEqual(a["pins"][0], {"pad": "1", "name": "VIN", "signal": "VIN", "powerNet": True})
        self.assertEqual(a["pins"][5]["signal"], "", "KiCad's ~ is no name")
        self.assertEqual([p["powerNet"] for p in b["pins"]], [False, False, True], "power_out is a power net")

    def test_common_pins_and_repeated_pads_are_refused(self) -> None:
        with self.assertRaisesRegex(ValueError, "common to all units"):
            module_interface.from_symbol_file(self.write(module_symbol(common_pin=True)))
        with self.assertRaisesRegex(ValueError, "pad 1 appears twice"):
            module_interface.from_symbol_file(self.write(module_symbol(repeat_pad=True)))

    def test_unit_letters_follow_kicad(self) -> None:
        self.assertEqual([module_interface.unit_key(n) for n in (1, 2, 26, 27, 28)], ["A", "B", "Z", "AA", "AB"])


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

    def module(self) -> str:
        created = self.service.create_manual_component(
            kind="module", value="TEST_IMU", description="Made-up two-connector IMU", datasheet="https://example.com/imu.pdf",
            manufacturer="Example Sensors", manufacturer_part_number=f"IMU-{uuid.uuid4().hex[:8]}", actor="author@example.com")
        component_id = str(created["id"])
        self.created.append(component_id)
        return component_id

    def attach(self, component_id: str, asset_type: str, name: str, payload: bytes) -> None:
        if asset_type == "symbol":
            self.service.import_symbol_library(component_id, upload_name=name, payload=payload, target_library="Test",
                                               selected_symbol="TEST_IMU", actor="author@example.com")
            return
        self.service.attach_auxiliary_asset(component_id, asset_type=asset_type, upload_name=name, payload=payload,
                                            target_library="Test", actor="author@example.com")

    def release(self, component_id: str) -> None:
        for stage, actor, role in (("in_progress", "author@example.com", "designer"),
                                   ("qa_review", "author@example.com", "designer"),
                                   ("done", "qa@example.com", "qa"),
                                   ("released", "qa@example.com", "admin")):
            self.service.set_release_status(component_id, stage, actor=actor, actor_role=role)

    def test_the_symbol_becomes_the_interface_and_release_needs_it_and_a_model(self) -> None:
        component_id = self.module()
        self.assertEqual(self.service.get_component(component_id)["kind"], "module")
        with self.assertRaisesRegex(ValueError, "no symbol"):
            self.release(component_id)
        self.attach(component_id, "symbol", "TEST_IMU.kicad_sym", module_symbol().encode())
        component = self.service.get_component(component_id)
        self.assertEqual([u["key"] for u in component["interface"]["units"]], ["A", "B"])
        self.assertEqual(component["source_ref"], {"kind": "module"})
        with self.assertRaisesRegex(ValueError, "STEP model"):
            self.release(component_id)
        self.attach(component_id, "3dmodel", STEP.name, STEP.read_bytes())
        self.assertEqual([u["key"] for u in self.service.get_component(component_id)["interface"]["units"]], ["A", "B"],
                         "attaching the model keeps the interface")
        [model] = self.service.system_items.list_models(component_id)
        aligned = self.service.system_items.set_model_alignment(
            component_id, model["assetId"], {"offsetMm": [0, 0, 1], "rotationDeg": [0, 0, 0], "scale": 1},
            actor="author@example.com")
        self.assertEqual(aligned[0]["alignment"]["offsetMm"], [0.0, 0.0, 1.0])
        self.release(component_id)
        self.assertEqual(self.service.get_component(component_id)["release_status"], "released")

    def test_a_bad_symbol_says_why_at_release(self) -> None:
        component_id = self.module()
        self.attach(component_id, "symbol", "TEST_IMU.kicad_sym", module_symbol(common_pin=True).encode())
        self.attach(component_id, "3dmodel", STEP.name, STEP.read_bytes())
        with self.assertRaisesRegex(ValueError, "common to all units"):
            self.release(component_id)

    def test_parts_stay_parts(self) -> None:
        part = self.service.create_manual_component(
            value="conn", description="c", datasheet="https://example.com/c.pdf", manufacturer="Test",
            manufacturer_part_number=f"MD-{uuid.uuid4().hex[:8]}", actor="author@example.com")
        self.created.append(str(part["id"]))
        self.assertEqual(self.service.get_component(str(part["id"])).get("interface") or {}, {})
        with self.assertRaises(ValueError):
            self.service.create_manual_component(kind="assembly", value="x", description="d", datasheet="https://x",
                                                 manufacturer="m", manufacturer_part_number="X", actor="a")


if __name__ == "__main__":
    unittest.main()

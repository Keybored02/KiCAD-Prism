"""SB2-51b: a published assembly carries a generated multi-unit symbol (CONTRACTS_P2 §3.3, D-P2-41).

One unit per export, one pin per pad, numbered by pad and named by its net. The fixture system's
CDR snapshot exports PWR_IN (OBC-A J6); a second publish with a second export replaces the symbol.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from test_system_assemblies import AssemblyCase
from test_system_snapshots import DESIGNER

from app.services.catalog import assembly_symbol, module_interface

KICAD_CLI = shutil.which("kicad-cli") or (
    "/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli"
    if os.path.exists("/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli") else None)


class GeneratorTest(unittest.TestCase):
    def test_units_are_exports_and_pins_are_pads_named_by_net(self) -> None:
        interface = {"exports": [
            {"id": "e1", "name": "PWR_IN", "pins": [{"pad": "2", "nets": ["/PWR/VIN_28V"], "powerNet": True},
                                                    {"pad": "1", "nets": ["/PWR/GND"], "powerNet": True},
                                                    {"pad": "10", "nets": [], "powerNet": False}]},
            {"id": "e2", "name": "DEBUG \"UART\"", "pins": [{"pad": "1", "nets": ["/DBG_TX"], "powerNet": False}]},
            {"id": "e3", "name": "GONE", "resolved": False, "pins": []},
        ]}
        text = assembly_symbol.symbol_library("IPN-1", interface)
        with tempfile.NamedTemporaryFile("w", suffix=".kicad_sym", delete=False) as handle:
            handle.write(text)
        self.addCleanup(os.unlink, handle.name)
        derived = module_interface.from_symbol_file(Path(handle.name))
        self.assertEqual([(u["key"], u["name"]) for u in derived["units"]], [("A", "PWR_IN"), ("B", 'DEBUG "UART"')])
        self.assertEqual([(p["pad"], p["name"], p["powerNet"]) for p in derived["units"][0]["pins"]],
                         [("1", "GND", True), ("2", "VIN_28V", True), ("10", "", False)])
        self.assertEqual(assembly_symbol.symbol_name(" IPN 1/2 "), "IPN_1_2")
        with self.assertRaisesRegex(ValueError, "at least one export"):
            assembly_symbol.symbol_library("X", {"exports": []})


class PublishedSymbolTest(AssemblyCase):
    def symbols(self, component_id: str) -> list[dict]:
        return [a for a in self.catalog.get_component(component_id)["assets"] if a["asset_type"] == "symbol"]

    def symbol_path(self, component_id: str) -> Path:
        """The symbol asset's stored file (content-addressed once a library name is reused)."""
        [symbol] = self.symbols(component_id)
        self.assertEqual(symbol["target_library"], assembly_symbol.LIBRARY)
        with self.catalog._connect() as conn:
            row = conn.execute("SELECT canonical_path FROM assets WHERE id = %s", (symbol["id"],)).fetchone()
        return Path(str(row["canonical_path"]))

    def test_a_publish_carries_the_assembly_symbol_and_the_next_replaces_it(self) -> None:
        publication = self.child(release=False)
        derived = module_interface.from_symbol_file(self.symbol_path(publication["componentId"]))
        interface = self.catalog.get_component(publication["componentId"])["interface"]
        [export] = interface["exports"]
        self.assertEqual([u["name"] for u in derived["units"]], ["PWR_IN"])
        self.assertEqual([p["pad"] for p in derived["units"][0]["pins"]],
                         sorted((str(p["pad"]) for p in export["pins"]), key=lambda pad: (len(pad), pad)))
        nets = {str(p["pad"]): (p.get("nets") or [""])[0].rsplit("/", 1)[-1] for p in export["pins"]}
        self.assertTrue(all(pin["name"] == nets[pin["pad"]] for pin in derived["units"][0]["pins"]))

        self.export("SPARE", "OBC-B", "J6")
        _, again = self.publish(self.snapshot("CDR-2")["id"])
        self.assertEqual(again["componentId"], publication["componentId"])
        self.assertEqual(len(self.symbols(again["componentId"])), 1, "the new publish replaces the symbol")
        derived = module_interface.from_symbol_file(self.symbol_path(again["componentId"]))
        self.assertEqual(sorted(u["name"] for u in derived["units"]), ["PWR_IN", "SPARE"])

    @unittest.skipUnless(KICAD_CLI, "kicad-cli is needed to open the symbol in KiCad")
    def test_kicad_opens_the_generated_symbol(self) -> None:
        publication = self.child(release=False)
        path = self.symbol_path(publication["componentId"])
        with tempfile.TemporaryDirectory() as out:
            upgraded = subprocess.run([KICAD_CLI, "sym", "upgrade", "--force", "--output", f"{out}/s.kicad_sym", str(path)],
                                      capture_output=True, text=True, timeout=120)
            self.assertEqual(upgraded.returncode, 0, upgraded.stderr)
            drawn = subprocess.run([KICAD_CLI, "sym", "export", "svg", "--output", out, f"{out}/s.kicad_sym"],
                                   capture_output=True, text=True, timeout=120)
            self.assertEqual(drawn.returncode, 0, drawn.stderr)
            self.assertTrue(list(Path(out).glob("*.svg")), "KiCad drew the symbol")


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import sys
import unittest
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.component_catalog_service import ComponentCatalogService  # noqa: E402
from app.services.component_catalog_service_pg import (  # noqa: E402
    _discover_symbol_names_in_text,
    _rewrite_footprint_payload,
    _rewrite_symbol_payload,
)


class ComponentCatalogServiceHelperTests(unittest.TestCase):
    def test_symbol_name_discovery_ignores_pin_unit_suffixes(self) -> None:
        text = """
        (kicad_symbol_lib
          (version 20211014)
          (generator "KiCAD Prism")
          (symbol "R"
            (property "Reference" "R" (at 0 0 0) (effects (font (size 1.27 1.27))))
          )
          (symbol "R_1_1"
            (pin passive line (at 0 0 0) (length 2.54))
          )
        )
        """
        self.assertEqual(_discover_symbol_names_in_text(text), ["R"])

    def test_symbol_rewrite_injects_metadata_and_footprint(self) -> None:
        payload = b"""(kicad_symbol_lib (version 20211014) (generator \"KiCAD Prism\")\n  (symbol \"R\"\n    (property \"Reference\" \"R\" (at 0 0 0)\n      (effects (font (size 1.27 1.27)))\n    )\n    (property \"Value\" \"OLD\" (at 0 0 0)\n      (effects (font (size 1.27 1.27)))\n    )\n  )\n)\n"""
        component = {
            "value": "10k",
            "description": "General purpose resistor",
            "datasheet_url": "https://example.com/r.pdf",
            "manufacturer": "Acme",
            "mpn": "ACME-R-10K",
            "vendor": "",
            "vendor_part_number": "",
            "mass_g": "",
            "rqjc_c_w": "",
            "rqjc_top_c_w": "",
            "temp_max_c": "",
            "temp_min_c": "",
            "power_dissipation_w": "",
            "rate": "",
            "sap_code": "",
        }
        rendered = _rewrite_symbol_payload(payload, "remote_prism_smd:R_0603_1608Metric", component).decode("utf-8")
        self.assertIn('(property "Value" "10k"', rendered)
        self.assertIn('(property "Manufacturer" "Acme"', rendered)
        self.assertIn('(property "Footprint" "remote_prism_smd:R_0603_1608Metric"', rendered)
        self.assertIn('(property "SAP Code" ""', rendered)

    def test_footprint_rewrite_points_model_into_remote_library(self) -> None:
        payload = b"""(footprint \"R_0603_1608Metric\"\n  (model \"old/path/to/model.step\")\n)\n"""
        asset = {
            "target_name": "R_0603_1608Metric",
            "name": "R_0603_1608Metric.kicad_mod",
        }
        rendered = _rewrite_footprint_payload(payload, asset).decode("utf-8")
        self.assertIn('${KIPRJMOD}/RemoteLibrary/remote_3d/R_0603_1608Metric.step', rendered)

    def test_csv_required_columns_match_manual_mandatory_fields(self) -> None:
        service = ComponentCatalogService()
        normalized = service._normalize_csv_row(  # type: ignore[attr-defined]
            {
                "Value": "10k",
                "Datasheet": "https://example.com/r.pdf",
                "Description": "General purpose resistor",
                "Manufacturer": "Acme",
                "Manufacturer Part Number": "ACME-R-10K",
            },
            2,
        )
        self.assertEqual(normalized["value"], "10k")
        self.assertEqual(normalized["manufacturer_part_number"], "ACME-R-10K")

        with self.assertRaises(ValueError):
            service._normalize_csv_row(  # type: ignore[attr-defined]
                {
                    "Value": "10k",
                    "Datasheet": "",
                    "Description": "General purpose resistor",
                    "Manufacturer": "Acme",
                    "Manufacturer Part Number": "ACME-R-10K",
                },
                3,
            )


if __name__ == "__main__":
    unittest.main()

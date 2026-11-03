"""Whether two manufacturer spellings are one maker, on the spellings distributors really gave for the dev parts."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services.supply.makers import canonical_key, same_maker  # noqa: E402


class SameMakerTests(unittest.TestCase):
    def test_spellings_of_one_maker(self) -> None:
        for one, two in [
            ("STANLEY", "STANLEY ELECTRIC CO., LTD."), ("Stanley Electric", "Stanley Electric Co"),
            ("KOA", "KOA Speer Electronics, Inc."), ("KOA Speer", "KOA"),
            ("TE Connectivity", "TE Connectivity / Holsworthy"), ("TE Connectivity", "TE Connectivity Passive Product"),
            ("ADI", "Analog Devices"), ("ADI", "Analog Devices Inc."), ("Analog Devices Inc.", "ANALOG DEVICES"),
            ("TI", "Texas Instruments"), ("Texas Instruments Inc.", "TEXAS INSTRUMENTS"),
            ("Nexperia", "Nexperia USA Inc."), ("DIODES", "Diodes Incorporated"), ("DIODES INC.", "DIODES INCORPORATED"),
            ("SKYWORKS", "Skyworks Solutions, Inc."), ("ECS", "ECS INC INTERNATIONAL"), ("muRata", "Murata Electronics"),
            ("onsemi", "ONSEMI"), ("onsemi", "ON Semiconductor"), ("Vishay", "Vishay Siliconix"), ("Siliconix", "Vishay Siliconix"),
            ("Maxim Integrated", "Analog Devices Inc./Maxim Integrated"),
            ("Renesas", "Renasas"), ("W" + chr(0xFFFD) + "rth Elektronik", "Wurth Elektronik"), ("W" + chr(0xFC) + "rth Elektronik", "Wurth Elektronik"),
            ("KYOCERA AVX", "AVX"),
            ("NXP Semicon", "NXP USA Inc."), ("NXP Semicon", "NXP Semiconductors"), ("NXP Semicon", "NXP"),
        ]:
            self.assertTrue(same_maker(one, two), f"{one} / {two}")

    def test_a_known_makers_name_cut_short_is_still_that_maker(self) -> None:
        self.assertTrue(same_maker("Analog Devices Inc./Maxim Integrated", "MAXIM"))
        self.assertFalse(same_maker("NXP Semicon", "Nexperia"))
        self.assertFalse(same_maker("TI Foo", "Texas Instruments"))

    def test_different_makers_stay_different(self) -> None:
        for one, two in [
            ("onsemi", "UMW"), ("onsemi", "TECH PUBLIC"), ("muRata", "RFMi"), ("Nexperia", "NXP USA Inc."),
            ("Texas Instruments", "Thomas Industries"), ("TI", "Thomas Industries"), ("Semiconductor", "ON Semiconductor"),
            ("Linear Technology", "Analog Devices"), ("Maxim", "Analog Devices"), ("", "Acme"), ("Acme", ""),
            ("Diodes", "Rohm Semiconductor"), ("Rohm", "Roam"), ("UMW", "TI"), ("Power Integrations", "Monolithic Power Systems"),
        ]:
            self.assertFalse(same_maker(one, two), f"{one} / {two}")

    def test_a_callers_own_aliases_count(self) -> None:
        self.assertFalse(same_maker("Linear Technology", "Analog Devices"))
        self.assertTrue(same_maker("Linear Technology", "Analog Devices", {"linear technology": "ad", "analog devices": "ad"}))
        self.assertEqual(canonical_key("ADI"), canonical_key("Analog Devices Inc."))


if __name__ == "__main__":
    unittest.main()


class ClassifyByMakerTests(unittest.TestCase):
    """The prod cases: the same number under a maker spelling the part's own name does not spell."""

    @staticmethod
    def _state(part_maker: str, spelling: str, known: frozenset[str] = frozenset()) -> str:
        from app.services.supply import parts
        from app.services.supply.discovery import classify
        from app.services.supply.identity import match_key
        from app.services.supply.models import PartMatch

        part = parts.PartRecord("p", "m", part_maker, "LPC1112FHN33/202,5", match_key("LPC1112FHN33/202,5"))
        match = PartMatch(provider="lcsc", sku="C1", mpn="LPC1112FHN33/202,5", manufacturer=spelling)
        return classify(part, match, parts.Resolution(None, "pending"), known)[0]

    def test_a_cut_short_maker_name_matches_the_makers_usual_spellings(self) -> None:
        self.assertEqual(self._state("NXP Semicon", "NXP USA Inc."), "exact")

    def test_a_spelling_the_part_carries_matches_by_its_words(self) -> None:
        self.assertEqual(self._state("Analog Devices", "MAXIM", frozenset({"analog devices inc /maxim integrated"})), "exact")
        self.assertEqual(self._state("Analog Devices", "MAXIM"), "near")

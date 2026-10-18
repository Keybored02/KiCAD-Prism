"""What each distributor says about packaging, read from recorded answers, and the guesses made when it says nothing."""

from __future__ import annotations

import json
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.supply.providers import packaging_hints  # noqa: E402
from app.services.supply.vocabulary import Packaging  # noqa: E402

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "supply"
NOW = datetime(2026, 10, 17, tzinfo=timezone.utc)


def recorded(name: str) -> dict:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


class PackagingReadingTests(unittest.TestCase):
    def test_lcsc_names_a_reel_and_its_size(self) -> None:
        from app.services.supply.providers import lcsc

        detail = next(call["answer"] for call in recorded("lcsc_live_74ahc1g09gv.json")["calls"] if call["path"] == "/ftps/wm/product/detail")
        offer = lcsc._offer(detail["result"] if "result" in detail else detail, NOW)  # noqa: SLF001
        self.assertEqual((offer.packaging, offer.reel_size), (Packaging.TAPE_REEL, 3000))

    def test_tme_names_a_reel_and_its_size(self) -> None:
        from app.services.supply.providers import tme

        packaging, size = tme._packing({"packing": {"elements": [{"id": "RL1", "translation": "Reel", "amount": 2500}]}})  # noqa: SLF001
        self.assertEqual((packaging, size), (Packaging.TAPE_REEL, 2500))
        self.assertEqual(tme._packing({"packing": {"elements": [{"id": "CT2", "translation": "Cardboard", "amount": 2}]}})[0], Packaging.OTHER)  # noqa: SLF001
        self.assertEqual(tme._packing({})[0], Packaging.UNKNOWN)  # noqa: SLF001

    def test_farnell_names_it_in_the_unit(self) -> None:
        from app.services.supply.providers import farnell

        for unit, expected in (("EACH (SUPPLIED ON CUT TAPE)", Packaging.CUT_TAPE), ("EACH (SUPPLIED ON FULL REEL)", Packaging.TAPE_REEL),
                               ("UNITÀ", Packaging.UNKNOWN), ("CONFEZIONE DA", Packaging.UNKNOWN)):
            self.assertEqual(farnell._packaging({"unitOfMeasure": unit}), expected, unit)  # noqa: SLF001

    def test_words_and_guesses(self) -> None:
        self.assertEqual(packaging_hints.from_text("Digi-Reel"), Packaging.CUSTOM_REEL)
        self.assertEqual(packaging_hints.from_text("Tape & Reel (TR)"), Packaging.TAPE_REEL)
        self.assertEqual(packaging_hints.from_text("Tube"), Packaging.TUBE)
        self.assertEqual(packaging_hints.from_text(""), Packaging.UNKNOWN)
        self.assertEqual(packaging_hints.infer("296-1395-1-ND", 1, 1), Packaging.CUT_TAPE)
        self.assertEqual(packaging_hints.infer("296-1395-6-ND", 1, 1), Packaging.CUSTOM_REEL)
        self.assertEqual(packaging_hints.infer("ABC123-CT", 1, 1), Packaging.CUT_TAPE)
        self.assertEqual(packaging_hints.infer("XYZ", 3000, 3000), Packaging.TAPE_REEL, "a whole reel ordered by the reel")
        self.assertEqual(packaging_hints.infer("XYZ", 3000, 1), Packaging.UNKNOWN)
        self.assertEqual(packaging_hints.infer("XYZ", 3000, 1, 3000), Packaging.TAPE_REEL, "priced only from a whole reel up")
        self.assertEqual(packaging_hints.infer("XYZ", 3000, 1, 1), Packaging.UNKNOWN)

    def test_farnell_reads_the_unit_in_every_store_language(self) -> None:
        """Units as the stores answered on 2026-10-18 for one diode sold as cut tape and as a full reel."""

        from app.services.supply.providers import farnell

        cut = ["EACH (SUPPLIED ON CUT TAPE)", "STÜCK (GURTABSCHNITT)", "PIÈCE (FOURNIE EN BANDE DÉCOUPÉE)", "CADA (EMPAQUETADO EN CINTA CORTADA)",
               "TAPE EN REEL, AFGESNEDEN", "STYCK (LEVERERAS I KLIPPT REMSA)", "STYK (LEVERET PÅ KLIPPET BÅND)", "KAPPALE (LEIKATTU NAUHA)",
               "CADA (FORNECIDO(A) EM FITA E ROLO CORTADOS)", "UNITÀ, FORNITO SU NASTRO TAGLIATO"]
        full = ["EACH (SUPPLIED ON FULL REEL)", "STÜCK (GEGURTET AUF ROLLE - GANZE ROLLE)", "PIÈCE (FOURNIE EN BOBINE COMPLÈTE)",
                "CADA (EMPAQUETADO EN ROLLO COMPLETO)", "TAPE EN REEL, VOLLEDIG", "STYCK (LEVERERAS I HEL RULLE)", "STYK (LEVERET PÅ HEL RULLE)",
                "KAPPALE (TÄYSI KELA)", "CADA (FORNECIDO(A) EM FITA E ROLO COMPLETOS)", "UNITÀ, FORNITO IN BOBINA COMPLETA"]
        for unit in cut:
            self.assertEqual(farnell._packaging({"unitOfMeasure": unit}), Packaging.CUT_TAPE, unit)  # noqa: SLF001
        for unit in full:
            self.assertEqual(farnell._packaging({"unitOfMeasure": unit}), Packaging.TAPE_REEL, unit)  # noqa: SLF001
        self.assertEqual(farnell._packaging({"unitOfMeasure": "UNITÀ"}), Packaging.UNKNOWN, "a bare unit says nothing and is not guessed")  # noqa: SLF001

    def test_farnell_reads_a_re_reeled_length_as_a_custom_reel(self) -> None:
        from app.services.supply.providers import farnell

        self.assertEqual(farnell._packaging({"unitOfMeasure": "EACH", "reeling": True}), Packaging.CUSTOM_REEL)  # noqa: SLF001
        self.assertEqual(farnell._packaging({"unitOfMeasure": "EACH", "reeling": False}), Packaging.UNKNOWN)  # noqa: SLF001
        # The unit of an "RL" number still says cut tape; the reel it is wound on is what it is sold as.
        self.assertEqual(farnell._packaging({"unitOfMeasure": "EACH (SUPPLIED ON CUT TAPE)", "reeling": True}), Packaging.CUSTOM_REEL)  # noqa: SLF001


if __name__ == "__main__":
    unittest.main()

"""Alternatives graded by how close they are."""

from __future__ import annotations

import os
import sys
import unittest
import uuid
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.services.supply import cross_reference  # noqa: E402

POSTGRES_URL = os.environ.get("PRISM_DATABASE_URL", "").strip()


def sig(**fields):
    return {key: {"value": Decimal(str(value)) if isinstance(value, (int, float)) else None, "raw": str(value)} for key, value in fields.items()}


class GradeTests(unittest.TestCase):
    BASE = sig(resistance=10000, tolerance=1, voltage_rating=75, power_rating=0.1, package="0603 (1608 Metric)")

    def test_the_same_value_and_package_with_ratings_at_least_as_good_is_direct(self) -> None:
        other = sig(resistance=10000, tolerance=0.5, voltage_rating=100, power_rating=0.1, package="0603")
        self.assertEqual(cross_reference.grade(self.BASE, other)["grade"], "direct")

    def test_a_worse_rating_makes_it_form_fit_function_not_direct(self) -> None:
        other = sig(resistance=10000, tolerance=5, voltage_rating=50, power_rating=0.1, package="0603")
        verdict = cross_reference.grade(self.BASE, other)
        self.assertEqual(verdict["grade"], "form_fit_function")
        self.assertEqual(sorted(verdict["differs"]), ["tolerance", "voltage_rating"])

    def test_another_package_is_functional_and_another_value_is_not_an_alternative(self) -> None:
        self.assertEqual(cross_reference.grade(self.BASE, sig(resistance=10000, package="0805"))["grade"], "functional")
        self.assertIsNone(cross_reference.grade(self.BASE, sig(resistance=22000, package="0603")))
        self.assertIsNone(cross_reference.grade(self.BASE, sig(package="0603")), "no value to compare")
        self.assertIsNone(cross_reference.grade(sig(package="0603"), sig(package="0603")), "a part with no core value cannot be judged")

    def test_missing_ratings_keep_it_from_being_direct(self) -> None:
        verdict = cross_reference.grade(self.BASE, sig(resistance=10000, package="0603"))
        self.assertEqual(verdict["grade"], "form_fit_function", "only two keys are shared with the package")

    def test_packages_compare_by_their_size_code(self) -> None:
        self.assertEqual(cross_reference.package_key("0603 (1608 Metric)"), cross_reference.package_key("R_0603"))
        self.assertNotEqual(cross_reference.package_key("SOT-23-5"), cross_reference.package_key("SOT-23-6"))


@unittest.skipUnless(POSTGRES_URL, "PRISM_DATABASE_URL is required for supply database tests")
class CandidateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        from app.services.postgres_database import database
        from app.services.supply import discovery, facts, parts
        from app.services.supply.store import SupplyStore

        cls.database, cls.discovery, cls.facts, cls.parts = database, discovery, facts, parts
        cls.store = type("TestSupplyStore", (SupplyStore,), {"schema": f"supply_xref_test_{uuid.uuid4().hex[:8]}"})()
        cls.store.initialize()

    @classmethod
    def tearDownClass(cls) -> None:
        with cls.database.connection() as conn:
            conn.execute(f'DROP SCHEMA IF EXISTS "{cls.store.schema}" CASCADE')

    def setUp(self) -> None:
        with self.store.connection() as conn:
            for table in ("part_params", "part_facts", "parts", "manufacturers"):
                conn.execute(f"DELETE FROM {table}")
            conn.execute("INSERT INTO manufacturers (id, name, name_key) VALUES ('m1', 'Acme', 'acme'), ('m2', 'Globex', 'globex')")

    def part(self, maker: str, mpn: str, attributes, category: str = "Chip Resistor - Surface Mount") -> str:
        from datetime import datetime, timezone

        with self.store.connection() as conn:
            record = self.parts.ensure_part(conn, maker, mpn, "seed@example.com")
            self.discovery.remember_parameters(conn, record.id, "digikey", attributes)
            self.facts.replace(conn, record.id, "digikey", [("category", category)], datetime.now(timezone.utc))
        return record.id

    def test_candidates_are_graded_and_ordered_and_the_manufacturers_suggestion_is_listed(self) -> None:
        from datetime import datetime, timezone

        base = self.part("Acme", "R-10K", [("Resistance", "10 kOhms"), ("Tolerance", "±1%"), ("Package / Case", "0603"), ("Power (Watts)", "0.1W")])
        direct = self.part("Globex", "G-10K", [("Resistance", "10 kOhms"), ("Tolerance", "±0.5%"), ("Package / Case", "0603 (1608 Metric)"), ("Power (Watts)", "0.125W")])
        other_package = self.part("Globex", "G-10K-0805", [("Resistance", "10 kOhms"), ("Package / Case", "0805")])
        self.part("Globex", "G-22K", [("Resistance", "22 kOhms"), ("Package / Case", "0603")])
        self.part("Globex", "G-OTHER-KIND", [("Resistance", "10 kOhms"), ("Package / Case", "0603")], category="Something Else")
        with self.store.connection() as conn:
            self.facts.replace(conn, base, "mouser", [("suggested_replacement", "R-10K-NEW")], datetime.now(timezone.utc))
            found = cross_reference.candidates(conn, base)
        self.assertEqual([(item["mpn"], item["grade"]) for item in found["candidates"]], [("G-10K", "direct"), ("G-10K-0805", "functional")])
        self.assertEqual(found["candidates"][0]["part_id"], direct)
        self.assertEqual(found["candidates"][1]["part_id"], other_package)
        self.assertEqual(found["suggested_by_distributors"], ["R-10K-NEW"])
        self.assertIn("resistance", found["judged_on"])

    def test_a_part_with_nothing_to_compare_has_no_candidates(self) -> None:
        lone = self.part("Acme", "ODD-1", [("Series", "x")])
        with self.store.connection() as conn:
            self.assertEqual(cross_reference.candidates(conn, lone)["candidates"], [])


if __name__ == "__main__":
    unittest.main()

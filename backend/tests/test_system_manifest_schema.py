"""``prism.system_manifest.v1`` contract (CONTRACTS_P2.md §9): examples, schema file and digests."""

from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from pydantic import ValidationError

from app.services.systems.manifest_schema import Manifest, digests, json_schema

DOCS = Path(__file__).resolve().parents[2] / "docs" / "system-builder"
EXAMPLES = sorted((DOCS / "examples").glob("manifest-*.json"))


def load(name: str) -> dict:
    return json.loads((DOCS / "examples" / name).read_text())


class ManifestSchemaTest(unittest.TestCase):
    def test_examples_validate_and_round_trip(self) -> None:
        self.assertEqual([p.name for p in EXAMPLES], ["manifest-child-cndh.json", "manifest-parent-bus.json"])
        for path in EXAMPLES:
            with self.subTest(example=path.name):
                raw = json.loads(path.read_text())
                manifest = Manifest.model_validate(raw)
                self.assertEqual(manifest.model_dump(mode="json", by_alias=True), raw)

    def test_committed_json_schema_matches_the_models(self) -> None:
        committed = json.loads((DOCS / "schemas" / "system_manifest.v1.schema.json").read_text())
        self.assertEqual(committed, json_schema(),
                         "regenerate: python -m app.services.systems.manifest_schema > "
                         "docs/system-builder/schemas/system_manifest.v1.schema.json")

    def test_placement_changes_only_the_full_digest(self) -> None:
        raw = load("manifest-parent-bus.json")
        before = digests(Manifest.model_validate(raw))
        moved = copy.deepcopy(raw)
        moved["placement"]["poses"][1]["translationMm"] = [150, 10, 0]
        moved["harnesses"][0]["nodes"][0]["positionMm"] = [60, 5, 25]
        moved["harnesses"][0]["ends"][1]["bootMm"] = 20.0
        moved["harnesses"][0]["cutLengthMm"] = 900.0
        moved["meta"]["sourceVersion"] = 8
        moved["layout"]["positions"][raw["instances"][0]["id"]] = {"x": -500.0, "y": 42.0}
        after = digests(Manifest.model_validate(moved))
        self.assertEqual(after["connectivity"], before["connectivity"])
        self.assertNotEqual(after["full"], before["full"])

        rewired = copy.deepcopy(raw)
        rewired["harnesses"][0]["wires"][0]["to"]["pin"] = "3"
        self.assertNotEqual(digests(Manifest.model_validate(rewired))["connectivity"], before["connectivity"])

    def test_optional_rules_change_only_the_full_digest(self) -> None:
        raw = load("manifest-child-cndh.json")
        self.assertEqual(raw["system"]["optionalRules"], [])
        before = digests(Manifest.model_validate(raw))
        legacy = copy.deepcopy(raw)
        del legacy["system"]["optionalRules"]  # a manifest written before P2-1.10
        self.assertEqual(digests(Manifest.model_validate(legacy)), before)
        enabled = copy.deepcopy(raw)
        enabled["system"]["optionalRules"] = ["SYS-V09"]
        after = digests(Manifest.model_validate(enabled))
        self.assertEqual(after["connectivity"], before["connectivity"])
        self.assertNotEqual(after["full"], before["full"])
        enabled["system"]["optionalRules"] = ["SYS-V10"]
        with self.assertRaises(ValidationError):
            Manifest.model_validate(enabled)

    def test_stack_height_is_b2b_placement_only(self) -> None:
        raw = load("manifest-child-cndh.json")
        b2b = next(i for i, link in enumerate(raw["links"]) if link["type"] == "b2b")
        before = digests(Manifest.model_validate(raw))
        taller = copy.deepcopy(raw)
        taller["links"][b2b]["stackHeightMm"] = 11.0
        after = digests(Manifest.model_validate(taller))
        self.assertEqual(after["connectivity"], before["connectivity"])
        self.assertNotEqual(after["full"], before["full"])
        taller["links"][b2b]["type"] = "unspecified"
        with self.assertRaises(ValidationError):
            Manifest.model_validate(taller)
        unset = copy.deepcopy(raw)
        unset["links"][b2b]["stackHeightMm"] = None
        legacy = copy.deepcopy(unset)
        del legacy["links"][b2b]["stackHeightMm"]  # written before P2-1.11
        self.assertEqual(digests(Manifest.model_validate(legacy)), digests(Manifest.model_validate(unset)))

    def test_meta_never_changes_a_digest(self) -> None:
        raw = load("manifest-child-cndh.json")
        other = copy.deepcopy(raw)
        other["meta"] = {**other["meta"], "createdBy": "user:someone-else", "snapshot": None}
        self.assertEqual(digests(Manifest.model_validate(other)), digests(Manifest.model_validate(raw)))

    def test_reference_rules(self) -> None:
        child = load("manifest-child-cndh.json")
        parent = load("manifest-parent-bus.json")
        board = child["instances"][0]["id"]
        cases = {
            "unknown instance": (child, lambda m: m["links"][0]["a"].update(instanceId="sin_" + "0" * 32)),
            "exportId ends need an assembly": (
                child, lambda m: m["exports"].append({"id": "sxp_" + "1" * 32, "name": "X", "description": "",
                                                      "target": {"instanceId": board, "exportId": "sxp_" + "2" * 32}})),
            "labels must be unique": (child, lambda m: m["instances"][1].update(label="obc-1")),
            "export names must be unique": (child, lambda m: m["exports"][1].update(name="pwr_in")),
            "appears twice": (child, lambda m: m["links"][0]["rows"][1].update(id=m["links"][0]["rows"][0]["id"])),
            "duplicate row": (child, lambda m: m["links"][0]["rows"][1].update(pinA="1", pinB="1")),
            "unit quaternion": (child, lambda m: m["placement"]["poses"][0].update(rotation=[0, 0, 0, 2])),
            "one pose per instance": (child, lambda m: m["placement"]["poses"].append(dict(m["placement"]["poses"][0]))),
            "unknown end": (parent, lambda m: m["harnesses"][0]["wires"][0]["to"].update(end="she_" + "3" * 32)),
            "portKey must equal": (child, lambda m: m["links"][0]["a"]["port"].update(portKey="/other")),
            "needs a board or module": (parent, lambda m: m["mating"].append(
                {"instanceId": m["instances"][0]["id"], "portKey": "/x", "mode": "confirmed",
                 "frame": {"axis": "top", "quarterTurns": 0}})),
        }
        for expected, (base, mutate) in cases.items():
            with self.subTest(rule=expected):
                broken = copy.deepcopy(base)
                mutate(broken)
                with self.assertRaises(ValidationError) as caught:
                    Manifest.model_validate(broken)
                self.assertIn(expected, str(caught.exception))

    def test_unknown_fields_and_bad_ids_are_rejected(self) -> None:
        raw = load("manifest-child-cndh.json")
        for mutate in (lambda m: m.update(extra=True),
                       lambda m: m["instances"][0].update(id="sin_short"),
                       lambda m: m["instances"][0].update(baselineCommit="abc"),
                       lambda m: m.update(schema="prism.system_manifest.v2")):
            broken = copy.deepcopy(raw)
            mutate(broken)
            with self.assertRaises(ValidationError):
                Manifest.model_validate(broken)


if __name__ == "__main__":
    unittest.main()

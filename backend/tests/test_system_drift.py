"""SYS-05: the drift engine against the SYS-01 goldens (``expected/steps.json``).

Every step evaluates a real extraction of the step's KiCad 10.0.6 sources
against the stored F0 baselines in ``system.json``. The expectations were
written from the contract before the engine existed; this file only adapts
their shape.
"""

from __future__ import annotations

import copy
import unittest
from unittest import mock
from functools import lru_cache

from system_builder_fixtures import expected_steps, fixture_system, snapshot_dir

from app.services.systems.drift import (
    DriftInconsistency,
    ITEM_KINDS,
    MAX_CANDIDATES,
    evaluate,
    pad_sort_key,
)
from app.services.systems.interface_extractor import (
    connected_interface_digest,
    extract_interface,
)


@lru_cache(maxsize=None)
def candidate(snapshot_id: str) -> dict:
    board, snapshot = snapshot_id.split("/")
    return extract_interface(
        snapshot_dir(board, snapshot) / f"{board}.kicad_pro", project_id=f"prj_{board}", commit=None
    )


def row_id(link_id: str, row: dict) -> str:
    return f"{link_id}:{row['pinA']}:{row['pinB']}"


def store_links() -> list[dict]:
    """``system.json`` links in ``SystemStore.list_links`` shape; instance id = label."""

    links = []
    for link in fixture_system()["links"]:
        shaped = {"id": link["id"], "name": link["id"], "harness": link["harness"], "rows": []}
        for end in ("a", "b"):
            port = {k: v for k, v in link[end].items() if k != "instance"}
            shaped[f"{end}_instance_id"] = link[end]["instance"]
            shaped[f"{end}_port"] = port
        for row in link["rows"]:
            shaped["rows"].append({
                "id": row_id(link["id"], row), "pin_a": row["pinA"], "pin_b": row["pinB"],
                "signal": row["signal"], "net_a": row["netA"], "net_b": row["netB"],
            })
        links.append(shaped)
    return links


def comparable(item) -> dict:
    """An engine item in the golden's vocabulary."""

    out = {"kind": item.kind, "link": item.link_id, "end": item.end, "pins": list(item.pins)}
    if item.kind == "connector_missing":
        out["candidates"] = [
            {key: c[key] for key in ("reference", "referenceEqual", "libIdEqual", "pinCountEqual", "netOverlap")}
            for c in item.candidates
        ]
    else:
        out["expected"] = item.expected
        out["observed"] = item.observed
    return out


def golden(item: dict) -> dict:
    return {k: v for k, v in item.items() if k != "note"}


class DriftGoldenTest(unittest.TestCase):
    maxDiff = None

    def run_step(self, instance: str, snapshot_id: str, links=None):
        return evaluate(links if links is not None else store_links(), instance, candidate(snapshot_id))

    def assert_step(self, name: str, spec: dict, outcome) -> None:
        with self.subTest(step=name):
            if spec["outcome"] == "auto_advance":
                self.assertEqual(outcome.items, [], name)
                self.assertTrue(outcome.auto_advance)
            else:
                self.assertEqual(spec["outcome"], "review")
                self.assertEqual([comparable(i) for i in outcome.items],
                                 [golden(i) for i in spec["items"]])
            self.assertEqual(outcome.digest_equivalent, outcome.auto_advance)

    def test_every_single_step(self) -> None:
        for name, spec in expected_steps()["steps"].items():
            if "candidate" not in spec:
                continue
            self.assert_step(name, spec, self.run_step(spec["instance"], spec["candidate"]))

    def test_f0_is_a_fixed_point_for_every_instance(self) -> None:
        boards = {label: inst["board"] for label, inst in fixture_system()["instances"].items()}
        for label, board in boards.items():
            with self.subTest(instance=label):
                outcome = self.run_step(label, f"{board}/F0")
                self.assertEqual(outcome.items, [])
                self.assertEqual(outcome.silent, [])
                self.assertEqual(outcome.port_updates, {})

    def test_silent_changes(self) -> None:
        steps = expected_steps()["steps"]
        for name in ("F2", "F3", "F10"):
            spec = steps[name]
            outcome = self.run_step(spec["instance"], spec["candidate"])
            with self.subTest(step=name):
                got = sorted((s.kind, s.link_id, s.end) for s in outcome.silent)
                want = sorted((s["kind"], s["link"], s["end"]) for s in spec["silent"])
                self.assertEqual(got, want)
                for expected in spec["silent"]:
                    silent = next(s for s in outcome.silent
                                  if (s.link_id, s.end) == (expected["link"], expected["end"]))
                    update = outcome.port_updates[(silent.link_id, silent.end)]
                    self.assertEqual(update, dict(silent.after))
                    if expected["kind"] == "connector_relabelled":
                        self.assertEqual((silent.before["reference"], silent.after["reference"]),
                                         (expected["from"], expected["to"]))
                        self.assertEqual(silent.after["portKey"], silent.before["portKey"])
                    else:
                        self.assertEqual(silent.after["reference"], expected["reference"])
                        self.assertEqual(silent.after["portKey"] != silent.before["portKey"],
                                         expected["portKeyChanged"])
                        self.assertEqual(silent.via, expected.get("via", "rebind"))

    def test_f10_port_key_moves_to_the_surviving_unit(self) -> None:
        outcome = self.run_step("PWR", "mini_power/F10")
        j3 = next(c for c in candidate("mini_power/F10")["components"] if c["reference"] == "J3")
        for key in (("L-J3J11", "a"), ("L-J3J12", "a")):
            self.assertEqual(outcome.port_updates[key]["portKey"], j3["portKey"])
            self.assertEqual(outcome.port_updates[key]["memberKeys"], sorted(j3["memberKeys"]))

    def test_f11_second_candidate_is_evaluated_from_the_same_baseline(self) -> None:
        sequence = expected_steps()["steps"]["F11"]["sequence"]
        for index, spec in enumerate(sequence):
            # §6.5: a superseding evaluation still starts from the F0 baselines.
            self.assert_step(f"F11[{index}]", spec, self.run_step("OBC-A", spec["candidate"]))

    def test_f12_tracking_instance(self) -> None:
        spec = expected_steps()["steps"]["F12"]
        self.assert_step("F12/OBC-A", spec["instances"]["OBC-A"], self.run_step("OBC-A", spec["tip"]))
        # OBC-B is pinned; detection never evaluates it (SYS-06). If it were
        # evaluated, its own row on J7.17 would drift too, which is why pinning matters.
        pinned = self.run_step("OBC-B", spec["tip"])
        self.assertEqual([i.link_id for i in pinned.items], ["L-OBCB-TP1"])

    def test_instances_only_see_their_own_link_ends(self) -> None:
        outcome = self.run_step("OBC-B", "mini_obc/F5")
        self.assertTrue(all(i.link_id == "L-OBCB-TP1" for i in outcome.items))


class DriftRuleTest(unittest.TestCase):
    """Rules the fixture history does not exercise, on edited copies of real artifacts."""

    def setUp(self) -> None:
        self.links = store_links()
        self.base = copy.deepcopy(candidate("mini_obc/F0"))

    def component(self, payload: dict, reference: str) -> dict:
        return next(c for c in payload["components"] if c["reference"] == reference)

    def test_pin_missing(self) -> None:
        j7 = self.component(self.base, "J7")
        j7["pins"] = [p for p in j7["pins"] if p["pad"] != "17"]
        outcome = evaluate(self.links, "OBC-A", self.base)
        self.assertEqual([(i.kind, i.pins) for i in outcome.items], [("pin_missing", ("17",))])
        self.assertIsNone(outcome.items[0].observed)
        self.assertFalse(outcome.digest_equivalent)

    def test_connector_level_item_suppresses_row_items(self) -> None:
        j7 = self.component(self.base, "J7")
        j7["footprint"] = "Other:Footprint"
        j7["pins"][0]["nets"] = ["/somewhere/else"]
        outcome = evaluate(self.links, "OBC-A", self.base)
        self.assertEqual([i.kind for i in outcome.items], ["connector_changed"])
        self.assertEqual(len(outcome.items[0].row_ids), 18)

    def test_ambiguous_rebind_lists_candidates_instead(self) -> None:
        j7 = self.component(self.base, "J7")
        twin = copy.deepcopy(j7)
        for item, suffix in ((j7, "1"), (twin, "2")):
            item["portKey"] = f"/new/{suffix}"
            item["memberKeys"] = [item["portKey"]]
        self.base["components"].append(twin)
        outcome = evaluate(self.links, "OBC-A", self.base)
        missing = [i for i in outcome.items if i.kind == "connector_missing"]
        self.assertEqual(len(missing), 1)
        self.assertEqual([c["portKey"] for c in missing[0].candidates[:2]], ["/new/1", "/new/2"])
        self.assertTrue(all(c["netOverlap"] == 1.0 for c in missing[0].candidates[:2]))

    def test_rebind_needs_matching_connected_nets(self) -> None:
        j7 = self.component(self.base, "J7")
        j7["portKey"] = "/new/j7"
        j7["memberKeys"] = ["/new/j7"]
        next(p for p in j7["pins"] if p["pad"] == "3")["nets"] = ["/changed"]
        outcome = evaluate(self.links, "OBC-A", self.base)
        self.assertEqual([i.kind for i in outcome.items], ["connector_missing"])
        self.assertEqual(outcome.items[0].candidates[0]["portKey"], "/new/j7")
        self.assertAlmostEqual(outcome.items[0].candidates[0]["netOverlap"], 17 / 18)

    def test_candidates_are_capped_and_exclude_bound_ports(self) -> None:
        j2 = self.component(self.base, "J2")
        self.base["components"].remove(j2)
        for n in range(8):
            clone = copy.deepcopy(j2)
            clone["reference"] = f"J{40 + n}"
            clone["portKey"] = f"/clone/{n}"
            clone["memberKeys"] = [clone["portKey"]]
            self.base["components"].append(clone)
        item = next(i for i in evaluate(self.links, "OBC-A", self.base).items
                    if i.kind == "connector_missing")
        self.assertEqual(len(item.candidates), MAX_CANDIDATES)
        j7_key = self.component(self.base, "J7")["portKey"]
        self.assertNotIn(j7_key, [c["portKey"] for c in item.candidates])

    def test_unannotated_components_are_never_resolved(self) -> None:
        j7 = self.component(self.base, "J7")
        j7["reference"] = "J?"
        outcome = evaluate(self.links, "OBC-A", self.base)
        self.assertEqual([i.kind for i in outcome.items if i.link_id == "L-J7J4"], ["connector_missing"])

    def test_a_link_end_without_rows_still_needs_its_port(self) -> None:
        links = store_links()
        for link in links:
            link["rows"] = []
        self.assertEqual(evaluate(links, "OBC-A", self.base).items, [])
        self.base["components"].remove(self.component(self.base, "J7"))
        items = evaluate(links, "OBC-A", self.base).items
        self.assertEqual([(i.kind, i.row_ids) for i in items], [("connector_missing", ())])

    def test_digest_matches_the_stored_baseline_at_f0(self) -> None:
        link = next(l for l in self.links if l["id"] == "L-J7J4")
        j7 = self.component(self.base, "J7")
        pins = {p["pad"]: p["nets"] for p in j7["pins"]}
        connected = {r["pin_a"]: r["net_a"] for r in link["rows"]}
        self.assertEqual(
            connected_interface_digest(link["a_port"]["libId"], link["a_port"]["footprint"], connected),
            connected_interface_digest(j7["libId"], j7["footprint"], {p: pins[p] for p in connected}),
        )

    def test_a_disagreement_with_the_digest_is_refused(self) -> None:
        from app.services.systems import drift

        with mock.patch.object(drift, "_digest_equal", return_value=False):
            with self.assertRaises(DriftInconsistency):
                evaluate(self.links, "OBC-A", self.base)

    def test_item_order_and_vocabulary(self) -> None:
        self.assertEqual(ITEM_KINDS, ("connector_missing", "connector_changed", "pin_missing", "net_changed"))
        self.assertEqual(sorted(["10", "2", "A1", "1", "SH"], key=pad_sort_key), ["1", "2", "10", "A1", "SH"])


if __name__ == "__main__":
    unittest.main()

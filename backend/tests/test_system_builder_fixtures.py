"""Consistency checks for the System Builder fixture boards (SYS-01).

These tests exercise no Prism code. They pin what the later tickets rely on:

1. every source, evidence and system file matches ``manifest.json`` (the
   evidence came from the kicad-cli named there and is not reproducible
   without it);
2. the KiCad behaviours the contract assumes are visible in KiCad's own
   netlists: hierarchical net names, ``unconnected-(`` naming, and distinct
   sheet paths for repeated sheets that share a symbol UUID;
3. ``system.json`` baselines agree with the F0 netlists;
4. every hand-written expectation in ``expected/steps.json`` agrees with the
   candidate netlists wherever KiCad observes the value;
5. ``build_fixture_repo`` produces deterministic history.
"""

from __future__ import annotations

import hashlib
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

from system_builder_fixtures import (
    BOARDS,
    EVIDENCE,
    ROOT,
    build_fixture_repo,
    expected_steps,
    fixture_system,
    manifest,
    snapshots,
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalized(name: str) -> list[str]:
    return [] if name.startswith("unconnected-(") else [name]


class Netlist:
    """Pin nets and component identity from one kicadxml evidence file."""

    def __init__(self, snapshot_id: str) -> None:
        root = ET.parse(EVIDENCE / snapshot_id / "netlist.xml").getroot()
        self.raw: dict[tuple[str, str], str] = {}
        for net in root.iter("net"):
            for node in net.iter("node"):
                self.raw[(node.get("ref"), node.get("pin"))] = net.get("name")
        self.components: dict[str, dict] = {}
        for comp in root.iter("comp"):
            lib = comp.find("libsource")
            self.components[comp.get("ref")] = {
                "sheetTstamps": comp.find("sheetpath").get("tstamps"),
                "symbolUuids": sorted(
                    uuid for t in comp.findall("tstamps") for uuid in (t.text or "").split()
                ),
                "libId": f"{lib.get('lib')}:{lib.get('part')}",
                "footprint": (comp.findtext("footprint") or ""),
            }

    def nets(self, ref: str, pin: str) -> list[str] | None:
        name = self.raw.get((ref, pin))
        return None if name is None else normalized(name)


class ManifestTest(unittest.TestCase):
    def test_every_file_matches_its_hash(self) -> None:
        data = manifest()
        self.assertEqual(data["kicad"]["version"], "10.0.6")
        self.assertEqual(sha256(ROOT / "system.json"), data["system"])
        recorded = set()
        for snapshot_id, entry in data["snapshots"].items():
            for command in entry["commands"]:
                self.assertEqual(command["exitCode"], 0, (snapshot_id, command["argv"]))
            for rel, digest in entry["files"].items():
                recorded.add(rel)
                self.assertEqual(sha256(ROOT / rel), digest, rel)
        on_disk = {
            str(p.relative_to(ROOT))
            for top in ("sources", "evidence")
            for p in (ROOT / top).rglob("*")
            if p.is_file()
        }
        self.assertEqual(on_disk, recorded, "unmanifested or missing fixture files")

    def test_no_per_user_kicad_files(self) -> None:
        self.assertEqual(list((ROOT / "sources").rglob("*.kicad_prl")), [])


class NativeAssumptionTest(unittest.TestCase):
    """CONTRACTS.md §3 assumptions, as KiCad 10.0.6 itself reports them."""

    def test_sheet_local_nets_are_full_hierarchical_names(self) -> None:
        obc = Netlist("mini_obc/F0")
        self.assertEqual(obc.raw[("J7", "3")], "/Payload IF/SPI_SCK")
        self.assertEqual(obc.raw[("J2", "3")], "/PWR_GOOD")
        self.assertEqual(obc.raw[("J7", "17")], "PAYLOAD_RESET#")  # global label

    def test_sheet_rename_changes_local_names_only(self) -> None:
        before, after = Netlist("mini_obc/F0"), Netlist("mini_obc/F5")
        self.assertEqual(after.raw[("J7", "3")], "/Payload Interface/SPI_SCK")
        self.assertEqual(after.raw[("J7", "17")], before.raw[("J7", "17")])
        self.assertEqual(
            after.components["J7"]["symbolUuids"], before.components["J7"]["symbolUuids"]
        )

    def test_unconnected_pins_use_the_unconnected_prefix(self) -> None:
        self.assertEqual(Netlist("mini_obc/F0").raw[("J7", "20")], "unconnected-(J7-Pin_20-Pad20)")
        self.assertTrue(Netlist("mini_obc/F1").raw[("J7", "17")].startswith("unconnected-("))

    def test_repeated_sheets_share_symbol_uuid_with_distinct_paths(self) -> None:
        payload = Netlist("mini_payload/F0")
        j11, j12 = payload.components["J11"], payload.components["J12"]
        self.assertEqual(j11["symbolUuids"], j12["symbolUuids"])
        self.assertNotEqual(j11["sheetTstamps"], j12["sheetTstamps"])

    def test_multi_unit_connector_reports_every_unit(self) -> None:
        power = Netlist("mini_power/F0")
        self.assertEqual(len(power.components["J3"]["symbolUuids"]), 2)
        self.assertEqual(len(Netlist("mini_power/F10").components["J3"]["symbolUuids"]), 1)


class SystemBaselineTest(unittest.TestCase):
    def test_port_and_row_baselines_match_f0(self) -> None:
        system = fixture_system()
        for link in system["links"]:
            for side in ("a", "b"):
                end = link[side]
                board = system["instances"][end["instance"]]["board"]
                netlist = Netlist(f"{board}/F0")
                comp = netlist.components[end["reference"]]
                self.assertEqual(comp["libId"], end["libId"], link["id"])
                self.assertEqual(comp["footprint"], end["footprint"], link["id"])
                # memberKeys are KIID paths: root UUID + netlist sheet path + symbol UUID.
                self.assertEqual(
                    sorted(key.rsplit("/", 1)[1] for key in end["memberKeys"]),
                    comp["symbolUuids"],
                    link["id"],
                )
                for key in end["memberKeys"]:
                    self.assertTrue(key.endswith(comp["sheetTstamps"] + key.rsplit("/", 1)[1]))
                self.assertIn(end["portKey"], end["memberKeys"])
            for row in link["rows"]:
                for side, pin_key, net_key in (("a", "pinA", "netA"), ("b", "pinB", "netB")):
                    end = link[side]
                    board = system["instances"][end["instance"]]["board"]
                    self.assertEqual(
                        Netlist(f"{board}/F0").nets(end["reference"], row[pin_key]),
                        row[net_key],
                        (link["id"], row),
                    )


class ExpectationTest(unittest.TestCase):
    """Hand-written expectations agree with the candidate netlists."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.system = fixture_system()
        cls.links = {link["id"]: link for link in cls.system["links"]}
        cls.expected = expected_steps()["steps"]

    def _row(self, link_id: str, end: str, pin: str) -> dict:
        key = "pinA" if end == "a" else "pinB"
        return next(r for r in self.links[link_id]["rows"] if r[key] == pin)

    def _check_items(self, snapshot_id: str, items: list[dict]) -> None:
        candidate = Netlist(snapshot_id)
        for item in items:
            link = self.links[item["link"]]
            end = link[item["end"]]
            if item["kind"] == "net_changed":
                (pin,) = item["pins"]
                row = self._row(item["link"], item["end"], pin)
                self.assertEqual(item["expected"], row["netA" if item["end"] == "a" else "netB"])
                self.assertEqual(item["observed"], candidate.nets(end["reference"], pin), item)
            elif item["kind"] == "connector_changed":
                comp = candidate.components[end["reference"]]
                self.assertEqual(item["expected"]["libId"], end["libId"])
                self.assertEqual(item["observed"]["libId"], comp["libId"])
                self.assertEqual(item["observed"]["footprint"], comp["footprint"])
                self.assertEqual(
                    sorted(item["pins"], key=int),
                    sorted(
                        ((r["pinA"] if item["end"] == "a" else r["pinB"]) for r in link["rows"]),
                        key=int,
                    ),
                )
            elif item["kind"] == "connector_missing":
                self.assertNotIn(end["reference"], candidate.components)
                self._check_candidates(candidate, link, item)
            else:
                self.fail(f"unexpected item kind {item['kind']}")

    def _check_candidates(self, candidate: Netlist, link: dict, item: dict) -> None:
        end = link[item["end"]]
        pin_key, net_key = ("pinA", "netA") if item["end"] == "a" else ("pinB", "netB")
        ranks = []
        for expected in item["candidates"]:
            reference = expected["reference"]
            comp = candidate.components[reference]
            pin_count = len({pin for ref, pin in candidate.raw if ref == reference})
            self.assertEqual(expected["referenceEqual"], reference == end["reference"])
            self.assertEqual(expected["libIdEqual"], comp["libId"] == end["libId"])
            self.assertEqual(expected["pinCountEqual"], pin_count == end["pinCount"])
            equal = sum(
                candidate.nets(reference, row[pin_key]) == row[net_key] for row in link["rows"]
            )
            self.assertAlmostEqual(expected["netOverlap"], equal / len(link["rows"]))
            ranks.append(
                (expected["referenceEqual"], expected["libIdEqual"], expected["pinCountEqual"],
                 expected["netOverlap"])
            )
        # §6.4: listed in descending order of the ranking keys.
        self.assertEqual(ranks, sorted(ranks, reverse=True))
        # §6.4: every other component matching reference, libId or pin count is listed.
        listed = {c["reference"] for c in item["candidates"]}
        for reference, comp in candidate.components.items():
            pin_count = len({pin for ref, pin in candidate.raw if ref == reference})
            if reference == end["reference"] or comp["libId"] == end["libId"] or pin_count == end["pinCount"]:
                self.assertIn(reference, listed)

    def _assert_rows_unchanged(self, snapshot_id: str, instance: str, renames: dict) -> None:
        candidate = Netlist(snapshot_id)
        for link in self.system["links"]:
            for side, pin_key, net_key in (("a", "pinA", "netA"), ("b", "pinB", "netB")):
                end = link[side]
                if end["instance"] != instance:
                    continue
                reference = renames.get(end["reference"], end["reference"])
                comp = candidate.components[reference]
                self.assertEqual(comp["libId"], end["libId"], (snapshot_id, link["id"]))
                for row in link["rows"]:
                    self.assertEqual(
                        candidate.nets(reference, row[pin_key]), row[net_key],
                        (snapshot_id, link["id"], row),
                    )

    def test_review_steps(self) -> None:
        for step in ("F1", "F4", "F5", "F8", "F9"):
            with self.subTest(step=step):
                spec = self.expected[step]
                self.assertEqual(spec["outcome"], "review")
                self._check_items(spec["candidate"], spec["items"])

    def test_f5_lists_exactly_the_rows_on_sheet_local_nets(self) -> None:
        rows = self.links["L-J7J4"]["rows"]
        local = sorted(
            (r["pinA"] for r in rows if r["netA"] and r["netA"][0].startswith("/Payload IF/")),
            key=int,
        )
        listed = sorted((i["pins"][0] for i in self.expected["F5"]["items"]), key=int)
        self.assertEqual(listed, local)

    def test_auto_advance_steps_leave_connected_rows_unchanged(self) -> None:
        cases = {
            "F2": ("OBC-A", {"J2": "J12"}),
            "F3": ("OBC-A", {}),
            "F6": ("OBC-A", {}),
            "F7": ("OBC-A", {}),
            "F10": ("PWR", {}),
        }
        for step, (instance, renames) in cases.items():
            with self.subTest(step=step):
                spec = self.expected[step]
                self.assertEqual(spec["outcome"], "auto_advance")
                self._assert_rows_unchanged(spec["candidate"], instance, renames)

    def test_f3_replaces_the_symbol_uuid(self) -> None:
        self.assertNotEqual(
            Netlist("mini_obc/F0").components["J7"]["symbolUuids"],
            Netlist("mini_obc/F3").components["J7"]["symbolUuids"],
        )

    def test_f6_is_interface_identical(self) -> None:
        self.assertEqual(Netlist("mini_obc/F0").raw, Netlist("mini_obc/F6").raw)
        self.assertEqual(Netlist("mini_obc/F0").components, Netlist("mini_obc/F6").components)

    def test_f8_leaves_the_board_stale(self) -> None:
        board = (ROOT / "sources/mini_obc/F8/mini_obc.kicad_pcb").read_text(encoding="utf-8")
        self.assertIn('(net "PAYLOAD_IRQ#")', board)
        self.assertNotIn("PAYLOAD_INT#", board)
        self.assertEqual(Netlist("mini_obc/F8").raw[("J7", "18")], "PAYLOAD_INT#")

    def test_f11_sequence(self) -> None:
        first, second = self.expected["F11"]["sequence"]
        self._check_items(first["candidate"], first["items"])
        self._check_items(second["candidate"], second["items"])

    def test_f12_uses_the_f1_tip(self) -> None:
        spec = self.expected["F12"]
        self._check_items(spec["tip"], spec["instances"]["OBC-A"]["items"])
        self.assertTrue(self.system["instances"]["OBC-B"]["pinned"])


class FixtureRepoTest(unittest.TestCase):
    def test_history_is_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as scratch:
            first = build_fixture_repo("mini_obc", Path(scratch) / "one")
            second = build_fixture_repo("mini_obc", Path(scratch) / "two")
        self.assertEqual(first, second)
        self.assertEqual(set(first), set(snapshots("mini_obc")))
        self.assertEqual(len(set(first.values())), len(first))

    def test_every_board_builds(self) -> None:
        with tempfile.TemporaryDirectory() as scratch:
            for board in BOARDS:
                commits = build_fixture_repo(board, Path(scratch) / board)
                self.assertIn("F0", commits)


if __name__ == "__main__":
    unittest.main()

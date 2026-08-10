from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock

from git import Actor, Repo


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import git_service  # noqa: E402


AUTHOR = Actor("Prism Test", "prism@example.com")


def _commit_all(repo: Repo, message: str):
    repo.git.add(A=True)
    return repo.index.commit(message, author=AUTHOR, committer=AUTHOR)


class GitCommitSummaryTests(unittest.TestCase):
    def test_root_commit_lists_files_without_an_invented_parent(self) -> None:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            repo = Repo.init(root)
            try:
                source = root / "design.kicad_sch"
                source.write_text("root\n", encoding="utf-8")
                commit = _commit_all(repo, "root")

                summary = git_service.get_commit_file_summary(str(root), commit.hexsha)

                self.assertIsNone(summary["base_commit"])
                self.assertEqual(summary["comparison_basis"], "root")
                self.assertEqual(summary["files"][0]["path"], "design.kicad_sch")
                self.assertEqual(summary["files"][0]["additions"], 1)
            finally:
                repo.close()

    def test_returns_first_parent_pair_and_real_line_stats(self) -> None:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            repo = Repo.init(root)
            try:
                source = root / "design.kicad_sch"
                source.write_text("duplicate\nduplicate\nold\n", encoding="utf-8")
                parent = _commit_all(repo, "base")
                source.write_text("duplicate\nnew\n", encoding="utf-8")
                commit = _commit_all(repo, "change C102")

                summary = git_service.get_commit_file_summary(str(root), commit.hexsha)

                self.assertEqual(summary["base_commit"], parent.hexsha)
                self.assertEqual(summary["compare_commit"], commit.hexsha)
                self.assertEqual(summary["comparison_basis"], "first-parent")
                self.assertEqual(summary["parent_count"], 1)
                self.assertEqual(summary["files"][0]["additions"], 1)
                self.assertEqual(summary["files"][0]["deletions"], 2)
                self.assertNotIn("semantic_buckets", summary["files"][0])
                self.assertNotIn("components", summary["files"][0])
                self.assertNotIn("nets", summary["files"][0])
            finally:
                repo.close()

    def test_line_statistics_use_one_git_call_for_the_commit(self) -> None:
        repo = MagicMock()
        repo.git.diff.return_value = "1\t2\ta.kicad_sch\n-\t-\tpreview.png"

        stats = git_service._diff_line_stats_map(repo, "old", "new")

        repo.git.diff.assert_called_once_with(
            "--numstat", "--no-renames", "old", "new"
        )
        self.assertEqual(stats["a.kicad_sch"], (1, 2))
        self.assertEqual(stats["preview.png"], (None, None))

    def test_type_two_scope_uses_path_boundaries(self) -> None:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            repo = Repo.init(root)
            try:
                intended = root / "boards" / "demo" / "main.kicad_sch"
                sibling = root / "boards" / "demo-copy" / "main.kicad_sch"
                intended.parent.mkdir(parents=True)
                sibling.parent.mkdir(parents=True)
                intended.write_text("base", encoding="utf-8")
                sibling.write_text("base", encoding="utf-8")
                _commit_all(repo, "base")
                intended.write_text("changed", encoding="utf-8")
                sibling.write_text("also changed", encoding="utf-8")
                commit = _commit_all(repo, "change both")

                summary = git_service.get_commit_file_summary(
                    str(root),
                    commit.hexsha,
                    "boards/demo",
                )

                self.assertEqual(
                    [file["path"] for file in summary["files"]],
                    ["boards/demo/main.kicad_sch"],
                )
            finally:
                repo.close()

    def test_large_text_files_keep_git_line_stats(self) -> None:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            repo = Repo.init(root)
            try:
                source = root / "large.kicad_sch"
                source.write_text(f"{'a' * 600_000}\n", encoding="utf-8")
                _commit_all(repo, "base")
                source.write_text(f"{'b' * 600_000}\n", encoding="utf-8")
                commit = _commit_all(repo, "large change")

                summary = git_service.get_commit_file_summary(str(root), commit.hexsha)

                self.assertEqual(summary["files"][0]["additions"], 1)
                self.assertEqual(summary["files"][0]["deletions"], 1)
            finally:
                repo.close()

    def test_binary_files_have_no_invented_line_counts(self) -> None:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            repo = Repo.init(root)
            try:
                source = root / "preview.png"
                source.write_bytes(b"\x89PNG\r\n\x1a\n\x00\x01")
                _commit_all(repo, "base")
                source.write_bytes(b"\x89PNG\r\n\x1a\n\x02\x03")
                commit = _commit_all(repo, "change binary")

                summary = git_service.get_commit_file_summary(str(root), commit.hexsha)

                self.assertIsNone(summary["files"][0]["additions"])
                self.assertIsNone(summary["files"][0]["deletions"])
            finally:
                repo.close()

    def test_renamed_files_remain_identified_as_renames(self) -> None:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            repo = Repo.init(root)
            try:
                source = root / "old-name.kicad_sch"
                source.write_text("same content\n", encoding="utf-8")
                _commit_all(repo, "base")
                repo.git.mv("old-name.kicad_sch", "new-name.kicad_sch")
                commit = _commit_all(repo, "rename")

                summary = git_service.get_commit_file_summary(str(root), commit.hexsha)

                self.assertEqual(summary["files"][0]["filename"], "new-name.kicad_sch")
                self.assertEqual(summary["files"][0]["status"], "renamed")
            finally:
                repo.close()

    def test_merge_summary_explicitly_uses_first_parent(self) -> None:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            repo = Repo.init(root)
            try:
                source = root / "design.kicad_sch"
                source.write_text("base\n", encoding="utf-8")
                base = _commit_all(repo, "base")
                main_branch = repo.active_branch.name

                repo.create_head("feature", base)
                repo.git.checkout("feature")
                source.write_text("feature\n", encoding="utf-8")
                _commit_all(repo, "feature")

                repo.git.checkout(main_branch)
                other = root / "README.md"
                other.write_text("main\n", encoding="utf-8")
                first_parent = _commit_all(repo, "main")
                with repo.config_writer() as config:
                    config.set_value("user", "name", AUTHOR.name)
                    config.set_value("user", "email", AUTHOR.email)
                repo.git.merge("feature", "--no-ff", "-m", "merge feature")
                merge = repo.head.commit

                summary = git_service.get_commit_file_summary(str(root), merge.hexsha)

                self.assertEqual(summary["base_commit"], first_parent.hexsha)
                self.assertEqual(summary["parent_count"], 2)
                self.assertEqual(summary["comparison_basis"], "first-parent")
            finally:
                repo.close()


SCH_TEMPLATE = """(kicad_sch
\t(lib_symbols
\t\t(symbol "Device:R"
\t\t\t(property "Reference" "R"
\t\t\t\t(at 0 0 0)
\t\t\t)
\t\t)
\t)
\t(symbol
\t\t(lib_id "Device:R")
\t\t(property "Reference" "R1"
\t\t\t(at {r1_x} 0 0)
\t\t)
\t)
{extra_symbol}\t(symbol
\t\t(lib_id "power:GND")
\t\t(property "Reference" "#PWR01"
\t\t\t(at 0 0 0)
\t\t)
\t)
\t(label "{label}"
\t\t(at 0 0 0)
\t)
)
"""


def _render_sch(r1_x: str, label: str, extra_symbol: str = "") -> str:
    return SCH_TEMPLATE.format(r1_x=r1_x, label=label, extra_symbol=extra_symbol)


PCB_TEMPLATE = """(kicad_pcb
\t(footprint "Lib:Fp"
\t\t(layer "F.Cu")
\t\t(property "Reference" "R1"
\t\t\t(at {r1_x} 0 0)
\t\t)
\t)
{extra_footprint}\t(zone
\t\t(net_name "{zone_net}")
\t\t(layer "F.Cu")
\t)
\t(segment
\t\t(start 0 0)
\t\t(end 1 1)
\t\t(net "{track_net}")
\t)
{extra_via}\t(net {net_decl})
)
"""


def _render_pcb(
    r1_x: str,
    net_name: str,
    zone_net: str,
    track_net: str,
    net_code: str = "1",
    extra_footprint: str = "",
    extra_via: str = "",
) -> str:
    net_decl = f'{net_code} "{net_name}"' if net_code else f'"{net_name}"'
    return PCB_TEMPLATE.format(
        r1_x=r1_x,
        net_decl=net_decl,
        zone_net=zone_net,
        track_net=track_net,
        extra_footprint=extra_footprint,
        extra_via=extra_via,
    )


class GitCommitElementExtractionTests(unittest.TestCase):
    def _summarize(self, root: Path, before: str, after: str, filename: str):
        repo = Repo.init(root)
        try:
            target = root / filename
            target.write_text(before, encoding="utf-8")
            _commit_all(repo, "base")
            target.write_text(after, encoding="utf-8")
            commit = _commit_all(repo, "change")

            summary = git_service.get_commit_file_summary(str(root), commit.hexsha)
            return next(f for f in summary["files"] if f["path"] == filename)
        finally:
            repo.close()

    def test_component_added_removed_and_changed_by_reference(self) -> None:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            before = _render_sch(
                r1_x="0",
                label="NET_A",
                extra_symbol=(
                    '\t(symbol\n'
                    '\t\t(lib_id "Device:R")\n'
                    '\t\t(property "Reference" "R2"\n'
                    '\t\t\t(at 0 0 0)\n'
                    '\t\t)\n'
                    '\t)\n'
                ),
            )
            after = _render_sch(
                r1_x="5",  # R1 block text changes -> "changed"
                label="NET_A",
                extra_symbol=(
                    '\t(symbol\n'
                    '\t\t(lib_id "Device:R")\n'
                    '\t\t(property "Reference" "R3"\n'  # R2 -> R3: removed + added
                    '\t\t\t(at 0 0 0)\n'
                    '\t\t)\n'
                    '\t)\n'
                ),
            )

            entry = self._summarize(root, before, after, "design.kicad_sch")

            components = {c["reference"]: c["kind"] for c in entry["components"]}
            self.assertEqual(components["R1"], "changed")
            self.assertEqual(components["R2"], "removed")
            self.assertEqual(components["R3"], "added")

    def test_lib_symbols_and_power_symbols_are_excluded(self) -> None:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            # Only the lib_symbols "Device:R" definition and the power symbol
            # exist; the R1 instance is unchanged between commits.
            before = _render_sch(r1_x="0", label="NET_A")
            after = _render_sch(r1_x="0", label="NET_B")

            entry = self._summarize(root, before, after, "design.kicad_sch")

            # No components list at all: the lib_symbols "Device:R" definition
            # is nested (skipped by the top-level walker) and the power
            # symbol "#PWR01" is excluded by its reference prefix. The R1
            # instance itself did not change between commits.
            self.assertNotIn("components", entry)
            nets = {n["netName"]: n["kind"] for n in entry["nets"]}
            self.assertEqual(nets, {"NET_A": "removed", "NET_B": "added"})

    def test_pcb_nets_without_a_numeric_code_are_diffed(self) -> None:
        # Newer KiCad versions write board-level net declarations as
        # (net "name") with no leading numeric code (rather than the older
        # (net <code> "name") form). Isolate that declaration as the only
        # place the net name appears so the net-code-less form is what the
        # diff is actually exercising.
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            before = _render_pcb(
                r1_x="0",
                net_name="GND",
                zone_net="OTHER",
                track_net="OTHER",
                net_code="",
            )
            after = _render_pcb(
                r1_x="0",
                net_name="PWR",
                zone_net="OTHER",
                track_net="OTHER",
                net_code="",
            )

            entry = self._summarize(root, before, after, "board.kicad_pcb")

            nets = {n["netName"]: n["kind"] for n in entry["nets"]}
            self.assertEqual(nets.get("GND"), "removed")
            self.assertEqual(nets.get("PWR"), "added")

    def test_zones_are_diffed_by_net_and_layer(self) -> None:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            before = _render_pcb(
                r1_x="0", net_name="GND", zone_net="GND", track_net="GND"
            )
            after = _render_pcb(
                r1_x="0", net_name="GND", zone_net="PWR", track_net="GND"
            )

            entry = self._summarize(root, before, after, "board.kicad_pcb")

            zones = {(z["netName"], z["layer"]): z["kind"] for z in entry["zones"]}
            self.assertEqual(zones.get(("GND", "F.Cu")), "removed")
            self.assertEqual(zones.get(("PWR", "F.Cu")), "added")

    def test_tracks_are_grouped_and_diffed_by_net_not_per_segment(self) -> None:
        with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
            root = Path(tmp)
            before = _render_pcb(
                r1_x="0",
                net_name="GND",
                zone_net="GND",
                track_net="GND",
                extra_via=(
                    '\t(via\n'
                    '\t\t(at 1 1)\n'
                    '\t\t(net "GND")\n'
                    '\t)\n'
                ),
            )
            after = _render_pcb(
                r1_x="0",
                net_name="GND",
                zone_net="GND",
                track_net="GND",
                extra_via=(
                    '\t(via\n'
                    '\t\t(at 2 2)\n'  # moved -> block text changed
                    '\t\t(net "GND")\n'
                    '\t)\n'
                    '\t(via\n'
                    '\t\t(at 3 3)\n'
                    '\t\t(net "PWR")\n'  # new net introduced by a via
                    '\t)\n'
                ),
            )

            entry = self._summarize(root, before, after, "board.kicad_pcb")

            tracks = {t["netName"]: t["kind"] for t in entry["tracks"]}
            self.assertEqual(tracks.get("GND"), "changed")
            self.assertEqual(tracks.get("PWR"), "added")
            # Coarse grouping: exactly one entry per affected net, not one
            # per segment/via block.
            self.assertEqual(len(entry["tracks"]), 2)


if __name__ == "__main__":
    unittest.main()

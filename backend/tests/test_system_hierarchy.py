"""SB2-05: the occurrence tree of a system of systems (CONTRACTS_P2 §2.2, §5.2, §5.3), pure."""

from __future__ import annotations

import unittest

from app.services.systems.hierarchy import MAX_BOARDS, ChildSystem, HierarchyError, resolve


def board(iid: str, label: str, project: str = "prj_x") -> dict:
    return {"id": iid, "label": label, "kind": "board", "projectId": project, "baselineCommit": "a" * 40}


def assembly(iid: str, label: str, revision: str) -> dict:
    return {"id": iid, "label": label, "kind": "assembly",
            "catalog": {"componentId": "cmp", "revisionId": revision, "revisionVersion": 1, "identity": "IPN"},
            "follow": "pinned"}


class HierarchyTest(unittest.TestCase):
    def loader(self, systems: dict[str, ChildSystem]):
        calls: list[str] = []

        def load(revision_id: str):
            calls.append(revision_id)
            return systems.get(revision_id)

        return load, calls

    def test_a_repeated_child_gives_distinct_occurrence_paths(self) -> None:
        cndh = ChildSystem("sys_cndh", "ssn_1", "CNDH", [board("sin_obc", "OBC-1"), board("sin_cmbd", "CMBD")])
        load, calls = self.loader({"rev_cndh": cndh})
        tree = resolve("sys_bus", [assembly("sin_a", "CNDH-A", "rev_cndh"), assembly("sin_b", "CNDH-B", "rev_cndh"),
                                   board("sin_pdu", "PDU")], load)
        boards = {o.path: o.display_path for o in tree.boards}
        self.assertEqual(boards, {
            "/sin_a/sin_cmbd": "CNDH-A ▸ CMBD", "/sin_a/sin_obc": "CNDH-A ▸ OBC-1",
            "/sin_b/sin_cmbd": "CNDH-B ▸ CMBD", "/sin_b/sin_obc": "CNDH-B ▸ OBC-1",
            "/sin_pdu": "PDU",
        })
        self.assertEqual(calls, ["rev_cndh"], "a revision is resolved once and memoized")
        [a] = [o for o in tree.occurrences if o.path == "/sin_a"]
        self.assertEqual((a.kind, a.child_system_id, a.child_snapshot_id, a.depth), ("assembly", "sys_cndh", "ssn_1", 1))
        self.assertEqual([o.depth for o in tree.occurrences if o.path.startswith("/sin_a/")], [2, 2])

    def test_depth_counts_system_levels_including_the_root(self) -> None:
        level4 = ChildSystem("sys_4", "s4", "L4", [board("sin_leaf", "LEAF")])
        level3 = ChildSystem("sys_3", "s3", "L3", [assembly("sin_c", "C", "rev_4")])
        level2 = ChildSystem("sys_2", "s2", "L2", [assembly("sin_b", "B", "rev_3")])
        load, _ = self.loader({"rev_2": level2, "rev_3": level3, "rev_4": level4})
        tree = resolve("sys_1", [assembly("sin_a", "A", "rev_2")], load)
        self.assertEqual([o.display_path for o in tree.boards], ["A ▸ B ▸ C ▸ LEAF"])
        level5 = ChildSystem("sys_5", "s5", "L5", [board("sin_deep", "DEEP")])
        level4_deeper = ChildSystem("sys_4", "s4", "L4", [assembly("sin_d", "D", "rev_5")])
        load, _ = self.loader({"rev_2": level2, "rev_3": level3, "rev_4": level4_deeper, "rev_5": level5})
        with self.assertRaises(HierarchyError) as caught:
            resolve("sys_1", [assembly("sin_a", "A", "rev_2")], load)
        self.assertEqual(caught.exception.code, "hierarchy_too_deep")

    def test_cycles_through_any_snapshot_are_refused(self) -> None:
        # sys_1 contains sys_2, whose snapshot contains (an older snapshot of) sys_1.
        older_self = ChildSystem("sys_1", "s_old", "Self", [board("sin_x", "X")])
        two = ChildSystem("sys_2", "s2", "Two", [assembly("sin_back", "BACK", "rev_self")])
        load, _ = self.loader({"rev_2": two, "rev_self": older_self})
        with self.assertRaises(HierarchyError) as caught:
            resolve("sys_1", [assembly("sin_two", "TWO", "rev_2")], load)
        self.assertEqual(caught.exception.code, "hierarchy_cycle")
        load, _ = self.loader({"rev_self": older_self})
        with self.assertRaises(HierarchyError):
            resolve("sys_1", [assembly("sin_me", "ME", "rev_self")], load)

    def test_board_cap_counts_flattened_occurrences(self) -> None:
        wide = ChildSystem("sys_w", "sw", "Wide", [board(f"sin_{n:03d}", f"B{n}") for n in range(40)])
        load, _ = self.loader({"rev_w": wide})
        five = [assembly(f"sin_a{n}", f"A{n}", "rev_w") for n in range(5)]
        self.assertEqual(len(resolve("sys_r", five, load).boards), MAX_BOARDS)
        with self.assertRaises(HierarchyError) as caught:
            resolve("sys_r", five + [board("sin_extra", "EXTRA")], load)
        self.assertEqual(caught.exception.code, "hierarchy_too_large")

    def test_an_unreadable_revision_is_marked_unresolved(self) -> None:
        load, _ = self.loader({})
        tree = resolve("sys_r", [assembly("sin_a", "A", "rev_gone"), board("sin_b", "B")], load)
        [a] = [o for o in tree.occurrences if o.kind == "assembly"]
        self.assertTrue(a.unresolved)
        self.assertEqual([o.path for o in tree.boards], ["/sin_b"])

    def test_store_rows_and_manifest_instances_both_resolve(self) -> None:
        rows = [{"id": "sin_r", "label": "R", "kind": "board", "project_id": "prj", "baseline_commit": "b" * 40,
                 "catalog_component_id": None, "catalog_revision_id": None}]
        [occurrence] = resolve("sys_r", rows, lambda _r: None).occurrences
        self.assertEqual((occurrence.project_id, occurrence.baseline_commit), ("prj", "b" * 40))


if __name__ == "__main__":
    unittest.main()

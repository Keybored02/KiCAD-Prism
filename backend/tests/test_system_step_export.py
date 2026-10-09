"""SB2-109 (CONTRACTS_P2 §25, D-P2-59): the system STEP export."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest import mock

from test_catalog_modules import STEP
from test_system_parts import PartCase
from test_system_snapshots import DESIGNER, VIEWER

from app.services.systems import service_step_export, step_assembly
from app.services.systems.step_assembly import Assembly, Leaf
from app.services.systems.store import Conflict, NotFound


def moved(x: float = 0.0, y: float = 0.0, z: float = 0.0) -> list[float]:
    return [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, x, y, z, 1.0]


def read_tree(path: Path, assemblies: frozenset = frozenset()) -> tuple[list, dict]:
    """``[(name, [child names…]) …]`` for the root and the named sub-assemblies, and each component's bounds."""
    from OCP.Bnd import Bnd_Box
    from OCP.BRepBndLib import BRepBndLib
    from OCP.STEPCAFControl import STEPCAFControl_Reader
    from OCP.TCollection import TCollection_ExtendedString
    from OCP.TDataStd import TDataStd_Name
    from OCP.TDF import TDF_Label, TDF_LabelSequence
    from OCP.TDocStd import TDocStd_Document
    from OCP.XCAFDoc import XCAFDoc_DocumentTool

    doc = TDocStd_Document(TCollection_ExtendedString("XmlXCAF"))
    reader = STEPCAFControl_Reader()
    reader.SetNameMode(True)
    reader.ReadFile(str(path))
    reader.Transfer(doc)
    shapes = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())

    def name(label) -> str:
        found = TDataStd_Name()
        return found.Get().ToExtString() if label.FindAttribute(TDataStd_Name.GetID_s(), found) else ""

    tree, bounds = [], {}

    def walk(label) -> None:
        components = TDF_LabelSequence()
        shapes.GetComponents_s(label, components)
        children = [components.Value(i) for i in range(1, components.Length() + 1)]
        tree.append((name(label), [name(c) for c in children]))
        for child in children:
            box = Bnd_Box()
            BRepBndLib.Add_s(shapes.GetShape_s(child), box)
            bounds[name(child)] = box.Get()
            referred = TDF_Label()
            shapes.GetReferredShape_s(child, referred)
            if name(referred) in assemblies:
                walk(referred)

    free = TDF_LabelSequence()
    shapes.GetFreeShapes(free)
    assert free.Length() == 1
    walk(free.Value(1))
    return tree, bounds


class AssemblyTest(unittest.TestCase):
    def test_one_product_per_file_placed_in_a_named_tree(self) -> None:
        out = Path(tempfile.mkdtemp()) / "system.step"
        step_assembly.write(Assembly("System", [
            Leaf("J1", STEP, moved(), product="Connector"),
            Assembly("Sub", [Leaf("J2", STEP, moved(z=30.0), product="Connector")], matrix=moved(x=100.0)),
        ]), out)
        tree, bounds = read_tree(out, frozenset({"Sub"}))
        self.assertEqual(tree[:2], [("System", ["J1", "Sub"]), ("Sub", ["J2"])])
        # A component's bounds are in its parent's frame: Sub holds J2 30 mm up and sits 100 mm along x.
        self.assertAlmostEqual(bounds["J2"][2] - bounds["J1"][2], 30.0, places=3)
        self.assertAlmostEqual(bounds["Sub"][0] - bounds["J1"][0], 100.0, places=3)
        self.assertAlmostEqual(bounds["Sub"][2] - bounds["J1"][2], 30.0, places=3)

    def test_an_unreadable_file_fails(self) -> None:
        bad = Path(tempfile.mkdtemp()) / "bad.step"
        bad.write_text("not a step file")
        with self.assertRaises(step_assembly.StepAssemblyError):
            step_assembly.write(Assembly("System", [Leaf("X", bad, moved())]), bad.with_name("out.step"))


class StepExportTest(PartCase):
    def setUp(self) -> None:
        super().setUp()
        self.root = Path(tempfile.mkdtemp())
        patches = [mock.patch.object(service_step_export, "_step_root", return_value=self.root),
                   mock.patch.object(service_step_export, "board_step", side_effect=self.board_step)]
        for patch in patches:
            patch.start()
            self.addCleanup(patch.stop)
        self.exported: list[str] = []

    def board_step(self, project, commit: str) -> Path:  # CI has no kicad-cli: every board is the fixture STEP
        self.exported.append(project.id)
        if project.id == "prj_pwr":
            raise RuntimeError("Failed to load board")
        return STEP

    def test_boards_and_parts_in_one_file_failures_listed(self) -> None:
        self.add("Enclosure")
        with mock.patch("app.services.job_service.jobs.enqueue", return_value={"job_id": "job_1"}):
            self.assertEqual(self.service.request_step_export(DESIGNER, self.sid), {"jobId": "job_1"})
            self.assertEqual(self.service.request_step_export(DESIGNER, self.sid), {"jobId": "job_1"})  # joins it
        self.assertEqual(self.service.step_export(DESIGNER, self.sid)["state"], "running")

        result = self.service.run_step_export(self.sid, DESIGNER, job_id="job_1")
        self.assertEqual(sorted(set(self.exported)), ["prj_obc", "prj_pay", "prj_pwr"])
        self.assertEqual({s["reason"] for s in result["skipped"]}, {"export_failed"})
        state = self.service.step_export(DESIGNER, self.sid)
        self.assertEqual((state["state"], state["version"]), ("ready", self.version()))
        path, name = self.service.step_export_file(DESIGNER, self.sid)
        self.assertTrue(name.endswith(f"-v{self.version()}.step"))
        tree, _bounds = read_tree(path)
        names = tree[0][1]
        self.assertIn("Enclosure", names)
        self.assertGreaterEqual(len(names), 3)

    def test_a_restricted_board_is_left_out_and_guards_the_download(self) -> None:
        self.hide_pay()
        self.service.run_step_export(self.sid, VIEWER)
        self.assertNotIn("prj_pay", self.exported)
        self.assertIn("restricted", {s["reason"] for s in self.service.step_export(VIEWER, self.sid)["skipped"]})
        self.service.step_export_file(VIEWER, self.sid)

        self.service.run_step_export(self.sid, DESIGNER.__class__(role="admin", email="admin@example.com"))
        with self.assertRaises(Conflict):
            self.service.step_export_file(VIEWER, self.sid)

    def test_nothing_to_download_before_an_export(self) -> None:
        self.assertEqual(self.service.step_export(VIEWER, self.sid)["state"], "none")
        with self.assertRaises(NotFound):
            self.service.step_export_file(VIEWER, self.sid)


if __name__ == "__main__":
    unittest.main()

"""SB2-109 (CONTRACTS_P2 §25, D-P2-59): the system STEP export."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from test_catalog_modules import STEP
from test_system_parts import PartCase
from test_system_snapshots import DESIGNER, VIEWER

from app.services.systems import service_step_export, step_assembly
from app.services.systems.step_assembly import Assembly, Block, Leaf, Tube
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

    def test_a_harness_is_a_swept_tube_per_segment_with_capsules_as_fallback(self) -> None:
        out = Path(tempfile.mkdtemp()) / "system.step"
        bend = [[0.0, 0.0, 0.0], [40.0, 0.0, 0.0], [70.0, 10.0, 0.0], [90.0, 40.0, 0.0], [100.0, 80.0, 0.0]]
        step_assembly.write(Assembly("System", [
            Leaf("J1", STEP, moved(), product="Connector"),
            Assembly("Harnesses", [Tube("Harness Power", [(bend, 6.0), ([[0.0, 0.0, 0.0], [0.0, 0.0, 50.0]], 4.0),
                                                          ([[1.0, 1.0, 1.0]], 4.0)])]),
        ]), out)
        tree, bounds = read_tree(out, frozenset({"Harnesses"}))
        self.assertEqual(tree[1], ("Harnesses", ["Harness Power"]))
        self.assertAlmostEqual(bounds["Harness Power"][5], 50.0, delta=0.5)  # the riser, 50 mm up

        from OCP.BRepGProp import BRepGProp
        from OCP.GProp import GProp_GProps
        props = GProp_GProps()
        BRepGProp.VolumeProperties_s(step_assembly.tube_shape(Tube("T", [(bend, 6.0)])), props)
        # A 3 mm tube along a smooth curve through the points: π r² × length, the length just over the
        # polyline's 148.8 mm.
        self.assertGreater(props.Mass() / (3.14159265 * 9), 148.0)
        self.assertLess(props.Mass() / (3.14159265 * 9), 158.0)

        shape = step_assembly.tube_shape(Tube("T", [(bend, 6.0), (bend, 0.0)]))
        from OCP.TopAbs import TopAbs_SOLID
        from OCP.TopExp import TopExp_Explorer
        solids, found = 0, TopExp_Explorer(shape, TopAbs_SOLID)
        while found.More():
            solids, _ = solids + 1, found.Next()
        self.assertEqual(solids, 1)  # one sweep; a segment no wire crosses (diameter 0) draws nothing
        with mock.patch.object(step_assembly, "_sweep", return_value=None):
            capsules = step_assembly.tube_shape(Tube("T", [(bend, 6.0)]))
        solids, found = 0, TopExp_Explorer(capsules, TopAbs_SOLID)
        while found.More():
            solids, _ = solids + 1, found.Next()
        self.assertEqual(solids, 4 + 3)  # a cylinder per span, a sphere per inner joint

    def test_a_proxy_housing_is_a_box_at_its_mating_frame(self) -> None:
        out = Path(tempfile.mkdtemp()) / "system.step"
        step_assembly.write(Assembly("System", [Block("J4 housing", [-5.0, -2.0, -8.0], [5.0, 2.0, 0.0],
                                                      matrix=moved(10.0, 20.0, 30.0))]), out)
        _tree, bounds = read_tree(out)
        lo_hi = [round(v, 1) for v in bounds["J4 housing"]]
        self.assertEqual(lo_hi, [5.0, 18.0, 22.0, 15.0, 22.0, 30.0])

    def test_proxy_box_spans_the_connector_body_and_the_housing_depth(self) -> None:
        cases = json.loads((Path(__file__).resolve().parent / "fixtures" / "system_builder" /
                            "placement_cases.json").read_text())["harnessEnds"]
        posed = [c["input"] for c in cases if c["expected"] is not None and not c["input"]["housing"]]
        self.assertTrue(posed)
        for i in posed:
            connector = {"geometry": i["geometry"], "thicknessMm": i["thicknessMm"], "stored": i["stored"]}
            lo, hi = service_step_export._proxy_box({"connector": connector}, 8.0)
            self.assertEqual((lo[2], hi[2]), (-8.0, 0.0))  # the housing depth behind the mating face
            self.assertTrue(lo[0] < hi[0] and lo[1] < hi[1])
        self.assertIsNone(service_step_export._proxy_box({"connector": None}, 8.0))

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

    def routes(self, ends: list[str]):
        harness = {"id": "shn_1", "level": "", "name": "Power", "ends": [{"id": f"e{n}", "occurrence": e} for n, e in enumerate(ends)]}
        routed = {"ends": {}, "curves": [{"samplesMm": [[0.0, 0.0, 0.0], [0.0, 60.0, 0.0]], "diameterMm": 5.0, "wires": ["w"]},
                             {"samplesMm": [[0.0, 0.0, 0.0], [9.0, 0.0, 0.0]], "diameterMm": 0.0, "wires": []}]}
        return mock.patch.object(type(self.service), "_harness_routes", return_value=([(harness, routed)], {}))

    def test_harnesses_are_tubes_unless_an_end_is_restricted(self) -> None:
        with self.routes(["OBC", "PAY"]):
            self.service.run_step_export(self.sid, DESIGNER)
        tree, bounds = read_tree(self.service.step_export_file(DESIGNER, self.sid)[0], frozenset({"Harnesses"}))
        self.assertIn(("Harnesses", ["Harness Power"]), tree)
        self.assertAlmostEqual(bounds["Harness Power"][4], 60.0, delta=0.5)  # the wired segment only

        self.hide_pay()
        self.service.run_step_export(self.sid, VIEWER)
        hidden = next(s["occurrence"] for s in self.service.step_export(VIEWER, self.sid)["skipped"]
                      if s["reason"] == "restricted")
        with self.routes(["OBC", hidden]):
            result = self.service.run_step_export(self.sid, VIEWER)
        self.assertIn({"occurrence": "harness::shn_1", "label": "Power", "reason": "restricted"}, result["skipped"])
        tree, _bounds = read_tree(self.service.step_export_file(VIEWER, self.sid)[0])
        self.assertNotIn("Harnesses", tree[0][1])

    def test_nothing_to_download_before_an_export(self) -> None:
        self.assertEqual(self.service.step_export(VIEWER, self.sid)["state"], "none")
        with self.assertRaises(NotFound):
            self.service.step_export_file(VIEWER, self.sid)


if __name__ == "__main__":
    unittest.main()

"""Single-revision fabrication package view model."""

from __future__ import annotations

import json
import unittest

from app.services.fabrication_view_service import (
    FabricationPackage,
    FabricationViewError,
    classify,
)


def gerber(body: str) -> bytes:
    return (
        "%TF.GenerationSoftware,KiCad,Pcbnew,10.0.4*%\n"
        "%FSLAX46Y46*%\n"
        "%MOMM*%\n"
        "%LPD*%\n"
        "G01*\n"
        "%ADD10C,0.250000*%\n"
        "%ADD11R,1.000000X1.000000*%\n"
        "D10*\n"
        f"{body}"
        "M02*\n"
    ).encode()


def excellon(tools: str, body: str) -> bytes:
    return (
        "M48\n"
        "FMAT,2\n"
        "METRIC\n"
        f"{tools}"
        "%\n"
        "G90\n"
        "G05\n"
        f"{body}"
        "M30\n"
    ).encode()


#: A 20 x 10 mm rectangular profile, in KiCad's Gerber frame (Y up).
OUTLINE = (
    "X0Y0D02*\n"
    "X20000000Y0D01*\n"
    "X20000000Y10000000D01*\n"
    "X0Y10000000D01*\n"
    "X0Y0D01*\n"
)
PAD = "D11*\nX5000000Y5000000D03*\n"
# A mark well outside the 20 x 10 mm profile.
SILK_MARK = "D11*\nX30000000Y30000000D03*\n"

JOB = {
    "FilesAttributes": [
        {"Path": "board-F_Cu.gtl", "FileFunction": "Copper,L1,Top"},
        {"Path": "board-B_Cu.gbl", "FileFunction": "Copper,L2,Bot"},
        {"Path": "board-F_Mask.gts", "FileFunction": "SolderMask,Top"},
        {"Path": "board-F_Paste.gtp", "FileFunction": "SolderPaste,Top"},
        {"Path": "board-F_Silkscreen.gto", "FileFunction": "Legend,Top"},
        {"Path": "board-Edge_Cuts.gm1", "FileFunction": "Profile"},
        {"Path": "board-F_Fab.gbr", "FileFunction": "AssemblyDrawing,Top"},
    ]
}

DRILL = excellon(
    "; #@! TA.AperFunction,Plated,PTH,ViaDrill\nT1C0.300\n"
    "; #@! TA.AperFunction,Plated,PTH,ComponentDrill\nT2C0.800\n"
    "; #@! TA.AperFunction,NonPlated,NPTH,ComponentDrill\nT3C3.200\n",
    "T1\nX5.0Y-5.0\nX6.0Y-5.0\n"
    "T2\nX8.0Y-5.0\n"
    "T3\nX2.0Y-2.0\n",
)


def package_files() -> dict[str, bytes]:
    return {
        "board-F_Cu.gtl": gerber(PAD),
        "board-B_Cu.gbl": gerber(PAD),
        "board-F_Mask.gts": gerber(PAD),
        "board-F_Paste.gtp": gerber(PAD),
        "board-F_Silkscreen.gto": gerber(PAD),
        "board-Edge_Cuts.gm1": gerber(OUTLINE),
        "board-F_Fab.gbr": gerber(PAD),
        "board.drl": DRILL,
        "board-job.gbrjob": json.dumps(JOB).encode(),
    }


class ClassifyTests(unittest.TestCase):
    def test_x2_functions(self) -> None:
        cases = {
            "Copper,L1,Top": ("copper", "top"),
            "Copper,L2,Inr": ("copper", "inner"),
            "Copper,L4,Bot": ("copper", "bottom"),
            "SolderMask,Bot": ("mask", "bottom"),
            "SolderPaste,Top": ("paste", "top"),
            "Legend,Top": ("silk", "top"),
            "Profile": ("outline", "both"),
            "Other,User": ("other", "both"),
            "AssemblyDrawing,Bot": ("other", "bottom"),
        }
        for function, expected in cases.items():
            with self.subTest(function):
                self.assertEqual(classify(function, "gerber"), expected)

    def test_drill_is_by_grammar_not_function(self) -> None:
        self.assertEqual(classify("NCDrill", "excellon"), ("drill", "both"))

    def test_unknown_function_is_other_not_dropped(self) -> None:
        self.assertEqual(classify("Unknown,Mystery", "gerber"), ("other", "both"))


class ClassifyByNameTests(unittest.TestCase):
    """Files with no declared function are read from their name."""

    def role(self, filename: str, name: str | None = None):
        stem = filename.rsplit(".", 1)[0]
        return classify(f"Unknown,{name or stem}", "gerber", filename, name or stem)

    def test_the_jlcpcb_plugin_names(self) -> None:
        cases = {
            "board-CuTop.gbr": ("copper", "top"),
            "board-CuBottom.gbr": ("copper", "bottom"),
            "board-MaskTop.gbr": ("mask", "top"),
            "board-MaskBottom.gbr": ("mask", "bottom"),
            "board-SilkTop.gbr": ("silk", "top"),
            "board-SilkBottom.gbr": ("silk", "bottom"),
            "board-EdgeCuts.gbr": ("outline", "both"),
        }
        for filename, expected in cases.items():
            with self.subTest(filename):
                self.assertEqual(self.role(filename, filename.split("-")[1].split(".")[0]), expected)

    def test_kicad_style_names_without_a_job_file(self) -> None:
        cases = {
            "F_Cu": ("copper", "top"),
            "B_Cu": ("copper", "bottom"),
            "In1_Cu": ("copper", "inner"),
            "In12_Cu": ("copper", "inner"),
            "F_Mask": ("mask", "top"),
            "B_Paste": ("paste", "bottom"),
            "F_Silkscreen": ("silk", "top"),
            "Edge_Cuts": ("outline", "both"),
        }
        for name, expected in cases.items():
            with self.subTest(name):
                self.assertEqual(self.role(f"board-{name}.gbr", name), expected)

    def test_protel_extensions_win_over_the_name(self) -> None:
        cases = {
            "x.GTL": ("copper", "top"),
            "x.gbl": ("copper", "bottom"),
            "x.gts": ("mask", "top"),
            "x.gbo": ("silk", "bottom"),
            "x.gtp": ("paste", "top"),
            "x.gm1": ("outline", "both"),
            "x.g2": ("copper", "inner"),
        }
        for filename, expected in cases.items():
            with self.subTest(filename):
                self.assertEqual(self.role(filename, "anything"), expected)

    def test_a_name_with_no_hint_stays_other(self) -> None:
        self.assertEqual(self.role("board-Courtyard.gbr", "Courtyard"), ("other", "both"))
        self.assertEqual(self.role("document.gbr", "document"), ("other", "both"))

    def test_a_declared_function_is_never_overridden(self) -> None:
        self.assertEqual(classify("Other,User", "gerber", "board-CuTop.gbr", "CuTop"), ("other", "both"))
        self.assertEqual(classify("Copper,L1,Top", "gerber", "board-SilkBottom.gbr", "SilkBottom"), ("copper", "top"))


class UnattributedPackageTests(unittest.TestCase):
    """A package from a plugin: no job file, nothing declared."""

    def test_roles_outline_and_size_come_from_the_names(self) -> None:
        files = {
            "board-CuTop.gbr": gerber(PAD),
            "board-CuBottom.gbr": gerber(PAD),
            "board-SilkTop.gbr": gerber(SILK_MARK),
            "board-EdgeCuts.gbr": gerber(OUTLINE),
            "board-PTH.drl": DRILL,
        }
        view = FabricationPackage.from_files(files).view()
        roles = {layer["file"]: (layer["role"], layer["side"]) for layer in view["layers"]}
        self.assertEqual(roles["board-CuTop.gbr"], ("copper", "top"))
        self.assertEqual(roles["board-EdgeCuts.gbr"], ("outline", "both"))
        self.assertEqual(view["copperLayers"], 2)
        # The board is the profile (20 x 10), not the silk mark outside it.
        self.assertEqual(view["size"], {"width": 20.0, "height": 10.0})


class DrillToolTests(unittest.TestCase):
    def tools(self, files):
        return FabricationPackage.from_files(files).view()["drill"]["tools"]

    def test_a_tool_that_is_defined_but_never_used_is_not_listed(self) -> None:
        text = excellon(
            "; #@! TA.AperFunction,Plated,PTH,ViaDrill\nT1C0.300\n"
            "; #@! TA.AperFunction,Plated,PTH,ComponentDrill\nT2C0.800\n",
            "T1\nX5.0Y-5.0\n",
        )
        self.assertEqual([tool["diameter"] for tool in self.tools({"board.drl": text})], [0.3])

    def test_a_drill_file_with_no_attributes_is_read_from_its_name(self) -> None:
        bare = excellon("T1C0.500\n", "T1\nX1.0Y-1.0\n")
        tools = self.tools({"board-PTH.drl": bare, "board-NPTH.drl": bare})
        by_file = {tool["file"]: tool["plated"] for tool in tools}
        self.assertEqual(by_file, {"board-PTH.drl": True, "board-NPTH.drl": False})

    def test_a_declared_function_beats_the_file_name(self) -> None:
        text = excellon("; #@! TA.AperFunction,Plated,PTH,ViaDrill\nT1C0.300\n", "T1\nX5.0Y-5.0\n")
        self.assertTrue(self.tools({"board-NPTH.drl": text})[0]["plated"])


class LayerNameTests(unittest.TestCase):
    def test_two_drill_programs_are_told_apart_by_file(self) -> None:
        files = {"board-PTH.drl": DRILL, "board-NPTH.drl": DRILL, "board-F_Cu.gtl": gerber(PAD)}
        view = FabricationPackage.from_files(files).view()
        names = {layer["id"]: layer["name"] for layer in view["layers"]}
        self.assertEqual(sorted(name for name in names.values() if name.endswith(".drl")),
                         ["board-NPTH.drl", "board-PTH.drl"])
        self.assertIn("F.Cu", names.values())


class PackageViewTests(unittest.TestCase):
    def setUp(self) -> None:
        self.package = FabricationPackage.from_files(package_files())
        self.view = self.package.view()

    def test_layers_list_top_to_bottom_then_profile_drill_other(self) -> None:
        roles = [(layer["role"], layer["side"]) for layer in self.view["layers"]]
        self.assertEqual(
            roles,
            [
                ("silk", "top"),
                ("paste", "top"),
                ("mask", "top"),
                ("copper", "top"),
                ("copper", "bottom"),
                ("outline", "both"),
                ("drill", "both"),
                ("other", "top"),
            ],
        )

    def test_board_size_comes_from_the_profile(self) -> None:
        self.assertEqual(self.view["size"], {"width": 20.0, "height": 10.0})
        self.assertEqual(self.view["copperLayers"], 2)

    def test_board_frame_is_kicad_y_down(self) -> None:
        # A Gerber profile spanning Y 0..10 sits at -10..0 in board coordinates.
        x0, y0, x1, y1 = self.view["board"]
        self.assertEqual((x0, y0, x1, y1), (0.0, -10.0, 20.0, 0.0))

    def test_layer_ids_are_url_safe_and_unique(self) -> None:
        ids = [layer["id"] for layer in self.view["layers"]]
        self.assertEqual(len(ids), len(set(ids)))
        for layer_id in ids:
            self.assertRegex(layer_id, r"^[a-z0-9._-]+$")

    def test_every_layer_shares_the_board_viewbox(self) -> None:
        boxes = {
            layer["id"]: self.package.svg(layer["id"]).split('viewBox="')[1].split('"')[0]
            for layer in self.view["layers"]
        }
        self.assertEqual(len(set(boxes.values())), 1)

    def test_svg_for_an_unknown_layer_is_a_key_error(self) -> None:
        with self.assertRaises(KeyError):
            self.package.svg("nope")

    def test_drill_tools_and_counts(self) -> None:
        drill = self.view["drill"]
        self.assertEqual(drill["holes"], 4)
        self.assertEqual(drill["slots"], 0)
        self.assertEqual(drill["smallest"], 0.3)
        tools = [(row["diameter"], row["plated"], row["hits"]) for row in drill["tools"]]
        # Plated first, then non-plated, each by size.
        self.assertEqual(tools, [(0.3, True, 2), (0.8, True, 1), (3.2, False, 1)])

    def test_a_broken_layer_does_not_hide_the_rest_of_the_package(self) -> None:
        files = package_files()
        files["board-F_Cu.gtl"] = b"not a gerber file\n"
        package = FabricationPackage.from_files(files)
        view = package.view()
        self.assertEqual(len(view["layers"]), 8)
        self.assertIn("f.cu", [layer["id"] for layer in view["layers"]])
        self.assertEqual(view["size"], {"width": 20.0, "height": 10.0})


class EmptyPackageTests(unittest.TestCase):
    def test_no_gerbers_is_an_error_not_an_empty_view(self) -> None:
        with self.assertRaises(FabricationViewError):
            FabricationPackage.from_files({"readme.txt": b"hello"})

    def test_a_drill_only_package_still_has_a_view(self) -> None:
        view = FabricationPackage.from_files({"board.drl": DRILL}).view()
        self.assertEqual(view["drill"]["holes"], 4)
        self.assertEqual(view["copperLayers"], 0)


if __name__ == "__main__":
    unittest.main()

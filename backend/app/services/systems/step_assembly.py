"""One assembly STEP from STEP files placed in a tree, plus harness tubes (SB2-109, CONTRACTS_P2 §25, D-P2-59).

The only module that talks to OpenCASCADE (``cadquery-ocp``): an XCAF document where each source
STEP is read once into a product, every placement is a component of it under its parent
assembly, and the document is written as AP214 with names and colours. If Geometer gains an
operation that composes STEPs, this module is what moves.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Sequence, Union


@dataclass
class Leaf:
    name: str
    step: Optional[Path]  # None until a board's STEP is exported
    matrix: Sequence[float]  # column-major 4×4, millimetres, into the parent's frame
    product: str = ""  # the shared product's name; the file's stem when empty


@dataclass
class Assembly:
    name: str
    children: list[Union["Assembly", Leaf, "Tube", "Block"]] = field(default_factory=list)
    matrix: Optional[Sequence[float]] = None  # into the parent's frame; None is identity


@dataclass
class Tube:
    """A harness as solids (§25): one tube swept along each segment's samples, in the parent's frame."""
    name: str
    segments: list[tuple[Sequence[Sequence[float]], float]]  # (samples in mm, bundle diameter in mm)
    colour: tuple[float, float, float] = (0.36, 0.36, 0.39)  # the 3D view's harness grey
    matrix: Optional[Sequence[float]] = None


@dataclass
class Block:
    """A box solid from ``lo`` to ``hi`` in its own frame (a harness end's proxy housing, §25)."""
    name: str
    lo: Sequence[float]
    hi: Sequence[float]
    matrix: Optional[Sequence[float]] = None
    colour: tuple[float, float, float] = (0.22, 0.22, 0.24)


class StepAssemblyError(RuntimeError):
    pass


def _points(samples: Sequence[Sequence[float]]) -> list:
    """The samples as OCCT points, dropping repeats closer than a micron (they break interpolation)."""
    from OCP.gp import gp_Pnt

    out: list = []
    for x, y, z in samples:
        point = gp_Pnt(float(x), float(y), float(z))
        if not out or point.Distance(out[-1]) > 1e-3:
            out.append(point)
    return out


def _sweep(points: list, radius: float):
    """A solid circle swept along a smooth curve through ``points`` (corrected Frenet frames)."""
    from OCP.BRepBuilderAPI import BRepBuilderAPI_MakeEdge, BRepBuilderAPI_MakeWire
    from OCP.BRepCheck import BRepCheck_Analyzer
    from OCP.BRepOffsetAPI import BRepOffsetAPI_MakePipeShell
    from OCP.GeomAPI import GeomAPI_Interpolate
    from OCP.gp import gp_Ax2, gp_Circ, gp_Dir, gp_Pnt, gp_Vec
    from OCP.TColgp import TColgp_HArray1OfPnt

    array = TColgp_HArray1OfPnt(1, len(points))
    for i, point in enumerate(points, 1):
        array.SetValue(i, point)
    interpolate = GeomAPI_Interpolate(array, False, 1e-6)
    interpolate.Perform()
    if not interpolate.IsDone():
        return None
    curve = interpolate.Curve()
    spine = BRepBuilderAPI_MakeWire(BRepBuilderAPI_MakeEdge(curve).Edge()).Wire()
    start, tangent = gp_Pnt(), gp_Vec()
    curve.D1(curve.FirstParameter(), start, tangent)
    profile = BRepBuilderAPI_MakeWire(
        BRepBuilderAPI_MakeEdge(gp_Circ(gp_Ax2(start, gp_Dir(tangent)), radius)).Edge()).Wire()
    pipe = BRepOffsetAPI_MakePipeShell(spine)
    pipe.SetMode(False)  # corrected Frenet: no twist where the curve straightens
    pipe.Add(profile)
    pipe.Build()
    if not pipe.IsDone() or not pipe.MakeSolid():
        return None
    shape = pipe.Shape()
    return shape if BRepCheck_Analyzer(shape).IsValid() else None


def _capsules(points: list, radius: float, builder, compound) -> None:
    """The fallback when a sweep fails: a cylinder per span and a sphere at each joint."""
    from OCP.BRepPrimAPI import BRepPrimAPI_MakeCylinder, BRepPrimAPI_MakeSphere
    from OCP.gp import gp_Ax2, gp_Dir, gp_Vec

    for a, b in zip(points, points[1:]):
        span = gp_Vec(a, b)
        builder.Add(compound, BRepPrimAPI_MakeCylinder(gp_Ax2(a, gp_Dir(span)), radius, span.Magnitude()).Shape())
    for point in points[1:-1]:
        builder.Add(compound, BRepPrimAPI_MakeSphere(point, radius).Shape())


def tube_shape(tube: Tube):
    """``tube`` as one compound of solids: a swept tube per segment, capsules where a sweep fails."""
    from OCP.BRep import BRep_Builder
    from OCP.TopoDS import TopoDS_Compound

    builder, compound = BRep_Builder(), TopoDS_Compound()
    builder.MakeCompound(compound)
    for samples, diameter in tube.segments:
        points = _points(samples)
        if diameter <= 0 or len(points) < 2:
            continue
        swept = None
        try:
            swept = _sweep(points, diameter / 2)
        except Exception:  # OCCT raises on degenerate curves; the capsules always build
            swept = None
        if swept is not None:
            builder.Add(compound, swept)
        else:
            _capsules(points, diameter / 2, builder, compound)
    return compound


def _location(matrix: Optional[Sequence[float]]):
    from OCP.gp import gp_Trsf
    from OCP.TopLoc import TopLoc_Location

    trsf = gp_Trsf()
    if matrix is not None:
        m = list(matrix)
        # gp_Trsf takes the 3×4 row-major part; it rejects scale and shear, which poses never carry.
        trsf.SetValues(m[0], m[4], m[8], m[12],
                       m[1], m[5], m[9], m[13],
                       m[2], m[6], m[10], m[14])
    return TopLoc_Location(trsf)


def _name(label, text: str) -> None:
    from OCP.TCollection import TCollection_ExtendedString
    from OCP.TDataStd import TDataStd_Name

    TDataStd_Name.Set_s(label, TCollection_ExtendedString(text))


def _quiet() -> None:
    """OCCT reports each transfer on stdout; a job's log has no use for it."""
    from OCP.Message import Message

    messenger = Message.DefaultMessenger_s()
    printers = messenger.Printers()
    while not printers.IsEmpty():
        messenger.RemovePrinter(printers.First())
        printers = messenger.Printers()


def write(root: Assembly, output: Path) -> None:
    """Write ``root`` to ``output`` as one AP214 assembly STEP."""
    _quiet()
    from OCP.IFSelect import IFSelect_RetDone
    from OCP.Interface import Interface_Static
    from OCP.STEPCAFControl import STEPCAFControl_Reader, STEPCAFControl_Writer
    from OCP.STEPControl import STEPControl_AsIs
    from OCP.TCollection import TCollection_ExtendedString
    from OCP.TDF import TDF_LabelSequence
    from OCP.Quantity import Quantity_Color, Quantity_TOC_RGB
    from OCP.TDocStd import TDocStd_Document
    from OCP.XCAFDoc import XCAFDoc_ColorGen, XCAFDoc_DocumentTool

    doc = TDocStd_Document(TCollection_ExtendedString("XmlXCAF"))
    shapes = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
    shapes.SetAutoNaming_s(False)
    products: dict[str, object] = {}

    def free_labels() -> list:
        found = TDF_LabelSequence()
        shapes.GetFreeShapes(found)
        return [found.Value(i) for i in range(1, found.Length() + 1)]

    def product(step: Path, name: str):
        key = str(step.resolve())
        if key in products:
            return products[key]
        before = {label.Tag() for label in free_labels()}
        reader = STEPCAFControl_Reader()
        reader.SetColorMode(True)
        reader.SetNameMode(True)
        if reader.ReadFile(str(step)) != IFSelect_RetDone or not reader.Transfer(doc):
            raise StepAssemblyError(f"Could not read {step.name}")
        roots = [label for label in free_labels() if label.Tag() not in before]
        if len(roots) == 1:
            label = roots[0]
        else:  # several top-level shapes: hold them in one product
            label = shapes.NewShape()
            for root_label in roots:
                shapes.AddComponent(label, root_label, _location(None))
        _name(label, name)
        products[key] = label
        return label

    colours = XCAFDoc_DocumentTool.ColorTool_s(doc.Main())

    def solid(node: Union[Tube, Block]):
        if isinstance(node, Tube):
            shape = tube_shape(node)
        else:
            from OCP.BRepPrimAPI import BRepPrimAPI_MakeBox
            from OCP.gp import gp_Pnt
            shape = BRepPrimAPI_MakeBox(gp_Pnt(*map(float, node.lo)), gp_Pnt(*map(float, node.hi))).Shape()
        label = shapes.AddShape(shape, False)
        _name(label, node.name)
        colours.SetColor(label, Quantity_Color(*node.colour, Quantity_TOC_RGB), XCAFDoc_ColorGen)
        return label

    def build(node: Assembly):
        label = shapes.NewShape()
        _name(label, node.name)
        for child in node.children:
            if isinstance(child, (Tube, Block)):
                target, matrix = solid(child), child.matrix
            elif isinstance(child, Leaf):
                target, matrix = product(child.step, child.product or child.step.stem), child.matrix
            else:
                target, matrix = build(child), child.matrix
            component = shapes.AddComponent(label, target, _location(matrix))
            _name(component, child.name)
        return label

    build(root)
    shapes.UpdateAssemblies()
    Interface_Static.SetCVal_s("write.step.schema", "AP214IS")
    Interface_Static.SetCVal_s("write.step.unit", "MM")
    # No 2D parameter-space copy of every edge: KiCad's and most vendors' STEPs carry none, and it
    # more than doubles the file.
    Interface_Static.SetIVal_s("write.surfacecurve.mode", 0)
    writer = STEPCAFControl_Writer()
    writer.SetColorMode(True)
    writer.SetNameMode(True)
    if not writer.Transfer(doc, STEPControl_AsIs):
        raise StepAssemblyError("Could not compose the assembly")
    output.parent.mkdir(parents=True, exist_ok=True)
    tmp = output.with_suffix(".tmp.step")
    if writer.Write(str(tmp)) != IFSelect_RetDone:
        raise StepAssemblyError("Could not write the STEP")
    tmp.replace(output)

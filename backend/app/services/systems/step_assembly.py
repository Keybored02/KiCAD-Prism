"""One assembly STEP from STEP files placed in a tree (SB2-109, CONTRACTS_P2 §25, D-P2-59).

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
    children: list[Union["Assembly", Leaf]] = field(default_factory=list)
    matrix: Optional[Sequence[float]] = None  # into the parent's frame; None is identity


class StepAssemblyError(RuntimeError):
    pass


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
    from OCP.TDocStd import TDocStd_Document
    from OCP.XCAFDoc import XCAFDoc_DocumentTool

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

    def build(node: Assembly):
        label = shapes.NewShape()
        _name(label, node.name)
        for child in node.children:
            if isinstance(child, Leaf):
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

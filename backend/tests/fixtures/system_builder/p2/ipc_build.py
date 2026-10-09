"""Build fixture boards through KiCad's IPC API (SB2-21). Needs a running KiCad 10.0.6.

KiCad 11 drops the SWIG ``pcbnew`` module, so the boards are built through the IPC
API with ``kicad-python`` (``pip install kicad-python==0.8.0``). In 10.0.6 the API is
served by the running PCB editor: open ``template.kicad_pcb`` (written by the
generator) in ``pcbnew.app`` with the API server enabled (Preferences → Plugins),
then run the generator, which calls :func:`build` once per board.

10.0.6's API cannot load a footprint from a library, so each stock ``.kicad_mod`` is
read here and sent as a footprint definition: pads, graphics, fields, text and 3D
model, already turned so that KiCad's own flip leaves it at the requested orientation.
DRC's library check (``lib_footprint_mismatch``) compares every placed footprint with its
library copy and catches pad, graphic and text mistakes. It does not compare 3D model
offsets, so the generator checks each saved model block against the library itself.
"""

from __future__ import annotations

import math
import re
import uuid
from typing import Any, Dict, List, Optional, Sequence

from google.protobuf.any_pb2 import Any as AnyProto
from kipy import KiCad
from kipy.board_types import BoardRectangle, FootprintInstance, Track
from kipy.proto.board import board_types_pb2 as bt
from kipy.proto.common.types import base_types_pb2 as ct, enums_pb2 as en
from kipy.util.units import from_mm

LAYERS = {
    "F.Cu": bt.BL_F_Cu, "B.Cu": bt.BL_B_Cu, "F.Mask": bt.BL_F_Mask, "B.Mask": bt.BL_B_Mask,
    "F.Paste": bt.BL_F_Paste, "B.Paste": bt.BL_B_Paste, "F.SilkS": bt.BL_F_SilkS, "B.SilkS": bt.BL_B_SilkS,
    "F.Fab": bt.BL_F_Fab, "B.Fab": bt.BL_B_Fab, "F.CrtYd": bt.BL_F_CrtYd, "B.CrtYd": bt.BL_B_CrtYd,
    "Edge.Cuts": bt.BL_Edge_Cuts,
}
PAD_TYPES = {"smd": bt.PT_SMD, "thru_hole": bt.PT_PTH, "np_thru_hole": bt.PT_NPTH}
PAD_SHAPES = {"rect": bt.PSS_RECTANGLE, "circle": bt.PSS_CIRCLE, "oval": bt.PSS_OVAL, "roundrect": bt.PSS_ROUNDRECT}


# --------------------------------------------------------------------------
# A small S-expression reader for .kicad_mod files.

_TOKEN = re.compile(r'\s*(?:(\()|(\))|"((?:[^"\\]|\\.)*)"|([^\s()"]+))')


def parse(text: str) -> list:
    stack: List[list] = [[]]
    for match in _TOKEN.finditer(text):
        opening, closing, quoted, atom = match.groups()
        if opening:
            stack.append([])
        elif closing:
            done = stack.pop()
            stack[-1].append(done)
        elif quoted is not None:
            stack[-1].append(bytes(quoted, "utf-8").decode("unicode_escape") if "\\" in quoted else quoted)
        elif atom is not None:
            stack[-1].append(atom)
    return stack[0][0]


def child(node: list, name: str) -> Optional[list]:
    return next((c for c in node[1:] if isinstance(c, list) and c and c[0] == name), None)


def children(node: list, name: str) -> List[list]:
    return [c for c in node[1:] if isinstance(c, list) and c and c[0] == name]


def number(node: Optional[list], index: int = 1, default: float = 0.0) -> float:
    return float(node[index]) if node is not None and len(node) > index else default


# --------------------------------------------------------------------------
# Proto builders. Coordinates are absolute (board, nm): the footprint is at ``origin``
# turned by ``angle`` degrees (KiCad's sense: counter-clockwise on screen, y down).

def _vector(target: Any, x: float, y: float) -> None:
    target.x_nm, target.y_nm = from_mm(x), from_mm(y)


class _Place:
    def __init__(self, origin: Sequence[float], angle: float):
        self.origin, self.angle = origin, angle
        self.cos, self.sin = math.cos(math.radians(angle)), math.sin(math.radians(angle))

    def __call__(self, dx: float, dy: float) -> tuple:
        return (self.origin[0] + dx * self.cos + dy * self.sin, self.origin[1] - dx * self.sin + dy * self.cos)


def _text_attributes(target: ct.TextAttributes, effects: Optional[list], angle: float) -> None:
    font = child(effects, "font") if effects else None
    size = child(font, "size") if font else None
    _vector(target.size, number(size, 1, 1.0), number(size, 2, 1.0))
    target.stroke_width.value_nm = from_mm(number(child(font, "thickness") if font else None, 1, 0.15))
    target.angle.value_degrees = angle
    target.horizontal_alignment = en.HA_CENTER
    target.vertical_alignment = en.VA_CENTER
    target.visible = True
    target.keep_upright = True
    target.line_spacing = 1.0


def _board_text(target: bt.BoardText, node: list, value: str, place: _Place) -> None:
    at = child(node, "at")
    target.text.text = value
    _vector(target.text.position, *place(number(at, 1), number(at, 2)))
    target.layer = LAYERS[child(node, "layer")[1]]
    _text_attributes(target.text.attributes, child(node, "effects"), (number(at, 3) + place.angle) % 360)


def _field(target: bt.Field, node: list, place: _Place) -> None:
    target.name = node[1]
    _board_text(target.text, node, node[2], place)
    hidden = child(node, "hide")
    target.visible = not (hidden is not None and (len(hidden) == 1 or hidden[1] == "yes"))
    target.text.text.attributes.visible = target.visible


def _shape(node: list, place: _Place) -> bt.BoardGraphicShape:
    shape = bt.BoardGraphicShape()
    shape.layer = LAYERS[child(node, "layer")[1]]
    stroke = child(node, "stroke")
    shape.shape.attributes.stroke.width.value_nm = from_mm(number(child(stroke, "width")))
    shape.shape.attributes.stroke.style = en.SLS_SOLID
    fill = child(node, "fill")
    shape.shape.attributes.fill.fill_type = ct.GFT_FILLED if fill is not None and fill[1] in ("yes", "solid") else ct.GFT_UNFILLED
    start, end = child(node, "start"), child(node, "end")

    def at(point: list) -> tuple:
        return place(number(point, 1), number(point, 2))

    if node[0] == "fp_line":
        _vector(shape.shape.segment.start, *at(start))
        _vector(shape.shape.segment.end, *at(end))
    elif node[0] == "fp_rect":
        if place.angle % 90:
            raise ValueError("rectangles can only be placed at multiples of 90°")
        (ax, ay), (bx, by) = at(start), at(end)
        _vector(shape.shape.rectangle.top_left, min(ax, bx), min(ay, by))
        _vector(shape.shape.rectangle.bottom_right, max(ax, bx), max(ay, by))
    elif node[0] == "fp_circle":
        _vector(shape.shape.circle.center, *at(child(node, "center")))
        _vector(shape.shape.circle.radius_point, *at(end))
    elif node[0] == "fp_arc":
        _vector(shape.shape.arc.start, *at(start))
        _vector(shape.shape.arc.mid, *at(child(node, "mid")))
        _vector(shape.shape.arc.end, *at(end))
    else:
        raise ValueError(f"unsupported footprint graphic {node[0]}")
    return shape


def _pad(node: list, place: _Place, net: Optional[str]) -> bt.Pad:
    pad = bt.Pad()
    pad.number = node[1]
    pad.type = PAD_TYPES[node[2]]
    at, size = child(node, "at"), child(node, "size")
    _vector(pad.position, *place(number(at, 1), number(at, 2)))
    stack = pad.pad_stack
    stack.type = bt.PST_NORMAL
    stack.angle.value_degrees = (number(at, 3) + place.angle) % 360
    layers = child(node, "layers")[1:]
    expanded: List[int] = []
    for name in layers:
        expanded += [LAYERS["F." + name[2:]], LAYERS["B." + name[2:]]] if name.startswith("*.") else [LAYERS[name]]
    stack.layers.extend(expanded)
    copper = stack.copper_layers.add()
    copper.layer = bt.BL_F_Cu
    copper.shape = PAD_SHAPES[node[3]]
    _vector(copper.size, number(size, 1), number(size, 2))
    ratio = child(node, "roundrect_rratio")
    if ratio is not None:
        copper.corner_rounding_ratio = float(ratio[1])
    drill = child(node, "drill")
    if drill is not None:
        stack.drill.start_layer, stack.drill.end_layer = bt.BL_F_Cu, bt.BL_B_Cu
        diameter = float(drill[1]) if len(drill) > 1 and drill[1] != "oval" else float(drill[2])
        _vector(stack.drill.diameter, diameter, diameter)
        stack.drill.shape = bt.DS_CIRCLE
    remove = child(node, "remove_unused_layers")
    stack.unconnected_layer_removal = bt.ULR_REMOVE if remove is not None and remove[1] == "yes" else bt.ULR_KEEP
    for outer in (stack.front_outer_layers, stack.back_outer_layers):
        outer.solder_mask_mode = bt.SMM_FROM_DESIGN_RULES
        outer.solder_paste_mode = bt.SPM_FROM_DESIGN_RULES
    if net:
        pad.net.name = net
    return pad


def footprint(mod_text: str, *, library: str, origin: Sequence[float], angle: float, reference: str, value: str,
              nets: Dict[str, str], symbol_path: Sequence[str], sheet_file: str) -> FootprintInstance:
    """A library footprint as a top-side instance at ``origin`` (page mm), turned ``angle`` degrees."""
    node = parse(mod_text)
    place = _Place(origin, angle)
    instance = bt.FootprintInstance()
    _vector(instance.position, *origin)
    instance.orientation.value_degrees = angle
    instance.layer = bt.BL_F_Cu
    definition = instance.definition
    definition.id.library_nickname, definition.id.entry_name = library, node[1]
    attributes = definition.attributes
    attributes.description = (child(node, "descr") or [None, ""])[1]
    attributes.keywords = (child(node, "tags") or [None, ""])[1]
    attr = child(node, "attr")
    attributes.mounting_style = bt.FMS_SMD if attr is not None and "smd" in attr else \
        bt.FMS_THROUGH_HOLE if attr is not None and "through_hole" in attr else bt.FMS_UNSPECIFIED
    instance.attributes.CopyFrom(attributes)  # the placed footprint's own attributes
    for part in symbol_path:
        instance.symbol_path.path.add().value = part
    instance.symbol_sheet_name = "/"
    instance.symbol_sheet_filename = sheet_file

    items: List[Any] = []
    for prop in children(node, "property"):
        if prop[1] == "Reference":
            _field(instance.reference_field, [*prop[:2], reference, *prop[3:]], place)
            definition.reference_field.CopyFrom(instance.reference_field)
        elif prop[1] == "Value":
            _field(instance.value_field, [*prop[:2], value, *prop[3:]], place)
            definition.value_field.CopyFrom(instance.value_field)
        else:
            field = bt.Field()
            _field(field, prop, place)
            items.append(field)
    for text in children(node, "fp_text"):
        board_text = bt.BoardText()
        _board_text(board_text, text, text[2], place)
        items.append(board_text)
    for graphic in (c for c in node[1:] if isinstance(c, list) and c and c[0] in ("fp_line", "fp_rect", "fp_circle", "fp_arc")):
        items.append(_shape(graphic, place))
    for pad in children(node, "pad"):
        items.append(_pad(pad, place, nets.get(pad[1])))
    for model in children(node, "model"):
        item = bt.Footprint3DModel()
        item.filename = model[1]
        # 10.0.6 reads these Vector3D fields as plain numbers despite their ``_nm`` names: the offset
        # in mm, rotation in degrees, scale as a factor. (Sent in nm, the offset lands 10^6 × too far.)
        offset, scale, rotate = (child(child(model, key), "xyz") for key in ("offset", "scale", "rotate"))
        item.offset.x_nm, item.offset.y_nm, item.offset.z_nm = (number(offset, i) for i in (1, 2, 3))
        item.scale.x_nm, item.scale.y_nm, item.scale.z_nm = (number(scale, i, 1.0) for i in (1, 2, 3))
        item.rotation.x_nm, item.rotation.y_nm, item.rotation.z_nm = (number(rotate, i) for i in (1, 2, 3))
        hidden = child(model, "hide")
        item.visible, item.opacity = hidden is None, number(child(model, "opacity"), 1, 1.0)
        items.append(item)
    for item in items:
        packed = AnyProto()
        packed.Pack(item)
        definition.items.append(packed)
    return FootprintInstance(proto=instance)


# --------------------------------------------------------------------------
# One board.

def _page_mm(pad: Any) -> List[float]:
    return [round(pad.position.x / 1e6, 4), round(pad.position.y / 1e6, 4)]


# KiCad saves items in UUID order and the API keeps UUIDs given at creation, so fixed UUIDs
# make the saved file's order (and so its bytes) reproducible.
_NAMESPACE = uuid.UUID("0b8f4d0e-1c2a-4f5e-9d3b-7a6c5e4d3c21")


def _id(spec: dict, *key: str) -> str:
    return str(uuid.uuid5(_NAMESPACE, ":".join((spec["idSeed"], *key))))


def build(spec: dict, kicad: Optional[KiCad] = None) -> dict:
    """Replace the open board's contents with ``spec`` and save it as ``spec['output']``.

    Returns ``{reference: {side, pads: {number: [x, y]}}}`` (page mm) of the placed pads.
    """
    kicad = kicad or KiCad(timeout_ms=30000)
    board = kicad.get_board()
    existing = list(board.get_footprints()) + list(board.get_tracks()) + list(board.get_shapes())
    if existing:
        board.remove_items(existing)

    outline = bt.BoardGraphicShape()
    outline.layer = bt.BL_Edge_Cuts
    outline.shape.attributes.stroke.width.value_nm = from_mm(0.1)
    outline.shape.attributes.stroke.style = en.SLS_SOLID
    x0, y0, x1, y1 = spec["outlineMm"]
    _vector(outline.shape.rectangle.top_left, x0, y0)
    _vector(outline.shape.rectangle.bottom_right, x1, y1)
    outline.id.value = _id(spec, "outline")
    board.create_items(BoardRectangle(outline))

    placed = {}
    for part in spec["footprints"]:
        with open(part["footprintFile"], encoding="utf-8") as handle:
            text = handle.read()
        # Footprints are never updated after creation (an update sends back the footprint as the
        # API returned it, and some fields do not survive that). So each is created at the angle
        # that ends at the requested orientation: KiCad's left-right flip turns θ into 180° − θ.
        final = float(part["rotationDeg"]) % 360
        angle = (180.0 - final) % 360 if part["side"] == "bottom" else final
        instance = footprint(text, library=part["library"], origin=part["atMm"], angle=angle, reference=part["reference"],
                             value=part["value"], nets=part["nets"],
                             symbol_path=part["path"].strip("/").split("/"), sheet_file=spec["schematicFile"])
        instance.proto.id.value = _id(spec, "footprint", part["reference"])
        [created] = board.create_items(instance)
        if part["side"] == "bottom":
            [created] = board.flip_items(created)
        current = next(f for f in board.get_footprints() if f.id.value == created.id.value)
        if abs((current.orientation.degrees - final + 180) % 360 - 180) > 1e-6:
            raise RuntimeError(f"{part['reference']} ended at {current.orientation.degrees}°, not {final}°")
        placed[part["reference"]] = (created.id.value, part)

    footprints = {f.id.value: f for f in board.get_footprints()}
    result = {}
    tracks = []
    for reference, (kiid, part) in sorted(placed.items()):
        fp = footprints[kiid]
        pads = {p.number: p for p in fp.definition.pads}
        result[reference] = {"side": part["side"], "orientationDeg": final,
                             "pads": {n: _page_mm(p) for n, p in pads.items() if n},
                             # Unnumbered pads (mounting tabs) share no number to key on.
                             "mechanical": sorted(_page_mm(p) for p in fp.definition.pads if not p.number)}
        layer = bt.BL_B_Cu if part["side"] == "bottom" else bt.BL_F_Cu
        for first, second in part["loopbacks"]:
            track = Track()
            track.start, track.end = pads[first].position, pads[second].position
            track.width = from_mm(0.2)
            track.layer = layer
            track.net = pads[first].net
            track.proto.id.value = _id(spec, "track", reference, first, second)
            tracks.append(track)
    if tracks:
        board.create_items(tracks)
    board.save_as(spec["output"], overwrite=True, include_project=False)
    return result

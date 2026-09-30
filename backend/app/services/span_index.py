"""Where each object lives in the bytes of a KiCad file.

The diff engine tells us WHICH objects changed, keyed by uuid or by a synthesized
geometry key. To act on that we also need WHERE each object is in the file, so we can
splice it without re-serialising anything. This module supplies the missing half: the
same keys the diff engine uses, mapped to byte ranges in the original text.

The keys must match `pcb_diff_service`'s EXACTLY. A key derived even slightly
differently would silently address the wrong object, and unlike a parse failure nothing
would look broken: the merge would produce a valid board containing the wrong thing.
That is the worst failure mode this feature has, so the rules are mirrored here
deliberately (not approximated) and `test_span_index.py` asserts parity against the
real extractor on real boards.

Why not just add spans to the extractor: `parse_sexp_with_spans` keys its span dict by
`id()` of nodes in the RAW tree, while the extractors build items from a typed model
(`KiCadPcb`) or from `_parse_sexp`'s own tree. Different object graphs, so there is no
span to hand back. Correlating them is this module's whole job.

Verified on real boards: every span slices to a balanced expression, children are
strictly nested inside their parents, and splicing all top-level spans back reproduces
the input byte for byte.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

log = logging.getLogger(__name__)

# Footprint graphics, keyed by "<footprint-uuid>:<graphic-uuid>" so one edited silk line
# is pinpointed rather than the whole footprint flagging. Mirrors
# pcb_diff_service._FP_GRAPHIC_KINDS (:133).
FP_GRAPHIC_KINDS = ("fp_line", "fp_text", "fp_arc", "fp_circle", "fp_rect", "fp_poly")

# Board-level graphics, keyed by their own uuid.
GR_KINDS = ("gr_line", "gr_text", "gr_arc", "gr_circle", "gr_rect", "gr_poly")


class SpanIndexError(Exception):
    """The file could not be indexed, so nothing may be spliced into it."""


@dataclass(frozen=True)
class Anchor:
    """One object's byte range, keyed the way the diff engine keys it."""

    key: str
    kind: str
    offset: int
    end_offset: int
    parent_key: str | None = None
    depth: int = 0

    def slice(self, text: str) -> str:
        """The exact source bytes of this object."""
        return text[self.offset : self.end_offset]


def _atom(node: list, index: int = 0) -> str:
    """The head symbol of a node, or "" if it is not a node."""
    if isinstance(node, list) and len(node) > index and isinstance(node[index], str):
        return node[index]
    return ""


def _children(node: list, name: str) -> list:
    """Direct children of `node` whose head is `name`.

    Direct only. `_get_all` in the diff engine walks one level for the same reason:
    a footprint's own `fp_line` must not be collected as if it were the board's.
    """
    return [c for c in node if isinstance(c, list) and _atom(c) == name]


def _first(node: list, name: str) -> list | None:
    for child in node:
        if isinstance(child, list) and _atom(child) == name:
            return child
    return None


def _uuid(node: list) -> str:
    """The node's uuid, falling back to the legacy `tstamp`.

    Mirrors sch_diff_service._uuid (:102). Files written by KiCad 6 and earlier use
    tstamp, and they still open today, so dropping the fallback would make this feature
    silently skip every object in an older board.
    """
    for key in ("uuid", "tstamp"):
        found = _first(node, key)
        if found and len(found) > 1:
            return str(found[1])
    return ""


def _number(node: list | None, index: int, default: float = 0.0) -> float:
    if node and len(node) > index:
        try:
            return float(node[index])
        except (TypeError, ValueError):
            return default
    return default


def _text_of(node: list | None, index: int = 1) -> str:
    if node and len(node) > index and isinstance(node[index], str):
        return node[index]
    return ""


def _property_value(node: list, name: str) -> str:
    """A footprint's named property, e.g. `(property "Reference" "R4")`.

    Used to name the object in a message. "pad on R4" tells someone where to look;
    "pad on a footprint" does not.
    """
    for child in node:
        if (
            isinstance(child, list)
            and _atom(child) == "property"
            and len(child) > 2
            and str(child[1]) == name
        ):
            return str(child[2])
    return ""


# ---------------------------------------------------------------------------
# Key derivation. Every rule here mirrors pcb_diff_service; see the module docstring.
# ---------------------------------------------------------------------------


def segment_key(node: list) -> str:
    """Geometry key for a track segment. Mirrors pcb_diff_service:450.

    Net is deliberately NOT part of the key, because KiCad renumbers net indices on
    every footprint add or remove; including it would turn a renumber into a wholesale
    add/remove of every track on the board. The direction is normalised so A->B and
    B->A hash the same.
    """
    start, end = _first(node, "start"), _first(node, "end")
    sx, sy = _number(start, 1), _number(start, 2)
    ex, ey = _number(end, 1), _number(end, 2)
    if (sx, sy) > (ex, ey):
        sx, sy, ex, ey = ex, ey, sx, sy
    layer = _text_of(_first(node, "layer"))
    width = _number(_first(node, "width"), 1)
    return f"seg:{sx:.4f},{sy:.4f}-{ex:.4f},{ey:.4f}:{layer}:{width:.4f}"


def via_key(node: list) -> str:
    """Geometry key for a via. Mirrors pcb_diff_service:487."""
    at = _first(node, "at")
    x, y = _number(at, 1), _number(at, 2)
    size = _number(_first(node, "size"), 1)
    drill = _number(_first(node, "drill"), 1)
    return f"via:{x:.4f},{y:.4f}:{size:.4f}:{drill:.4f}"


def arc_key(node: list) -> str:
    """Geometry key for a track arc. Mirrors pcb_diff_service:721."""
    start, mid, end = _first(node, "start"), _first(node, "mid"), _first(node, "end")
    sx, sy = _number(start, 1), _number(start, 2)
    mx, my = _number(mid, 1), _number(mid, 2)
    ex, ey = _number(end, 1), _number(end, 2)
    layer = _text_of(_first(node, "layer"))
    width = _number(_first(node, "width"), 1)
    return (
        f"arc:{sx:.4f},{sy:.4f}-{mx:.4f},{my:.4f}-{ex:.4f},{ey:.4f}:{layer}:{width:.4f}"
    )


def net_index(node: list) -> str:
    """The net index a track, via or pad references, as a string. "" if absent."""
    found = _first(node, "net")
    return str(found[1]) if found and len(found) > 1 else ""


def net_table(root: list) -> dict[str, str]:
    """{index -> name} from the board's top-level `(net N "name")` nodes.

    Mirrors pcb_diff_service._build_net_names (:419). This is what makes remap-by-name
    possible: an index is only meaningful relative to the file it came from.
    """
    names: dict[str, str] = {}
    for node in _children(root, "net"):
        if len(node) >= 3:
            names[str(node[1])] = str(node[2])
    return names


# ---------------------------------------------------------------------------
# Indexing
# ---------------------------------------------------------------------------


def _parse(text: str) -> tuple[list, dict]:
    try:
        from kicad_monkey import parse_sexp_with_spans
    except ImportError as exc:  # pragma: no cover - kicad_monkey is a hard dependency
        raise SpanIndexError(f"kicad_monkey is not installed: {exc}") from exc

    try:
        tree, spans = parse_sexp_with_spans(text)
    except Exception as exc:
        raise SpanIndexError(f"could not parse: {exc}") from exc

    root = tree[0] if tree and isinstance(tree[0], list) else tree
    if not isinstance(root, list):
        raise SpanIndexError("file has no root expression")
    return root, spans


def _anchor(
    spans: dict, node: list, key: str, kind: str, parent_key: str | None, depth: int
) -> Anchor | None:
    span = spans.get(id(node))
    if span is None:
        # Every node the parser produced should have a span. If one does not, skip it
        # rather than guess at a range: an anchor with made-up offsets would splice into
        # the wrong bytes, which is exactly the failure this module exists to prevent.
        log.debug("no span for %s %s", kind, key)
        return None
    return Anchor(
        key=key,
        kind=kind,
        offset=span.offset,
        end_offset=span.end_offset,
        parent_key=parent_key,
        depth=depth,
    )


def build_pcb_index(text: str) -> tuple[list, dict[str, Anchor]]:
    """Index every addressable object in a `.kicad_pcb`.

    Returns the raw tree and {key -> Anchor}. Keys match the diff engine's, so a
    decision naming a key from a diff can be located here without translation.
    """
    root, spans = _parse(text)
    if _atom(root) != "kicad_pcb":
        raise SpanIndexError(f"not a kicad_pcb (root is {_atom(root)!r})")

    index: dict[str, Anchor] = {}

    def add(node: list, key: str, kind: str, parent: str | None, depth: int) -> None:
        if not key:
            return
        anchor = _anchor(spans, node, key, kind, parent, depth)
        if anchor is not None:
            index[key] = anchor

    for node in _children(root, "footprint"):
        fp_uid = _uuid(node)
        if not fp_uid:
            continue
        add(node, fp_uid, "footprint", None, 0)

        # Footprint graphics use a COMPOSITE key so a silk edit is pinpointed to the
        # element rather than flagging the whole footprint. Mirrors :400.
        for kind in FP_GRAPHIC_KINDS:
            for graphic in _children(node, kind):
                g_uid = _uuid(graphic)
                if g_uid:
                    add(graphic, f"{fp_uid}:{g_uid}", kind, fp_uid, 1)

    for node in _children(root, "segment"):
        add(node, segment_key(node), "segment", None, 0)
    for node in _children(root, "via"):
        add(node, via_key(node), "via", None, 0)
    for node in _children(root, "arc"):
        add(node, arc_key(node), "arc", None, 0)

    for node in _children(root, "zone"):
        add(node, _uuid(node), "zone", None, 0)
    for kind in GR_KINDS:
        for node in _children(root, kind):
            add(node, _uuid(node), kind, None, 0)

    return root, index


def build_sch_index(text: str) -> tuple[list, dict[str, Anchor]]:
    """Index every addressable object in a `.kicad_sch`.

    Schematics are simpler than boards here: symbols, wires, junctions and labels all
    carry their own uuid, so there are no synthesized geometry keys to mirror.
    """
    root, spans = _parse(text)
    if _atom(root) != "kicad_sch":
        raise SpanIndexError(f"not a kicad_sch (root is {_atom(root)!r})")

    index: dict[str, Anchor] = {}
    kinds = (
        "symbol",
        "wire",
        "bus",
        "junction",
        "label",
        "global_label",
        "hierarchical_label",
        "no_connect",
        "sheet",
        "text",
    )
    for kind in kinds:
        for node in _children(root, kind):
            key = _uuid(node)
            if not key:
                continue
            anchor = _anchor(spans, node, key, kind, None, 0)
            if anchor is not None:
                index[key] = anchor
    return root, index


def root_end_offset(text: str) -> int:
    """Where the root expression closes, for appending a new top-level object."""
    _, spans = _parse(text)
    return max((s.end_offset for s in spans.values()), default=len(text))

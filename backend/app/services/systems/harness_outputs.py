"""Harness manufacturing outputs (SB2-110, CONTRACTS_P2 §26.2): wiring list, BOM, layout drawing
and WireViz YAML (the drawing is ``harness_drawing``), all from one harness model the service builds from the live document.

Pure: no database, no catalog. The model is

    {system: {name, version}, harness: {id, name, label, cutLengthMm, bundleMm, estimatedMm},
     ends: [{id, name, pins, part, contact}],
     wires: [{id, from: {end, pin}, to: {end, pin}, signal, gaugeAwg, colour, label, netFrom, netTo, cutMm}],
     segments: [{id, from, to, lengthMm, wires}] | None, coverings: [{segmentId, part, description}]}

with ``cutMm`` already resolved (§26.2) and ``segments`` None while the harness has no route.
"""

from __future__ import annotations

import csv
import io
import math
import re
from collections import defaultdict
from html import escape
from typing import Any, Mapping, Optional, Sequence

import yaml

Model = Mapping[str, Any]

# WireViz colour codes (IEC 60757 two-letter) by the names people type.
WIREVIZ_COLOURS = {
    "black": "BK", "brown": "BN", "red": "RD", "orange": "OG", "yellow": "YE", "green": "GN", "blue": "BU",
    "violet": "VT", "purple": "VT", "grey": "GY", "gray": "GY", "white": "WH", "pink": "PK", "turquoise": "TQ",
    "gold": "GD", "silver": "SR",
}


def _pin_key(pin: str) -> tuple:
    return (0, int(pin), "") if str(pin).isdigit() else (1, 0, str(pin))


def ordered_wires(model: Model) -> list[dict]:
    """Wires by from end, cavity, to end, cavity, numbered ``W1…`` (§26.2)."""
    order = {end["id"]: n for n, end in enumerate(model["ends"])}
    wires = sorted(model["wires"], key=lambda w: (order.get(w["from"]["end"], 99), _pin_key(w["from"]["pin"]),
                                                  order.get(w["to"]["end"], 99), _pin_key(w["to"]["pin"])))
    return [{**wire, "number": f"W{n}"} for n, wire in enumerate(wires, 1)]


def _end_names(model: Model) -> dict[str, str]:
    return {end["id"]: end["name"] for end in model["ends"]}


def _csv(header: Sequence[str], rows: Sequence[Sequence[Any]]) -> bytes:
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\n")
    writer.writerow(header)
    for row in rows:
        writer.writerow(["" if v is None else _safe(v) for v in row])
    return out.getvalue().encode("utf-8")


def _safe(value: Any) -> Any:
    """A cell a spreadsheet would read as a formula is prefixed (as the ICD CSV does)."""
    text = str(value)
    return f"'{text}" if text[:1] in ("=", "+", "-", "@") and not _is_number(text) else value


def _is_number(text: str) -> bool:
    try:
        float(text)
        return True
    except ValueError:
        return False


def wiring_csv(model: Model) -> bytes:
    names = _end_names(model)
    rows = [[w["number"], w.get("label"), names.get(w["from"]["end"], ""), w["from"]["pin"],
             " ".join(w.get("netFrom") or []), names.get(w["to"]["end"], ""), w["to"]["pin"],
             " ".join(w.get("netTo") or []), w.get("signal"), w.get("gaugeAwg"), w.get("colour"), w.get("cutMm")]
            for w in ordered_wires(model)]
    return _csv(["wire", "label", "from_end", "from_cavity", "from_net", "to_end", "to_cavity", "to_net", "signal",
                 "gauge_awg", "colour", "cut_length_mm"], rows)


def _metres(mm: float) -> float:
    return math.ceil(mm / 10.0) / 100.0  # up to the next 0.01 m


def segment_lengths(model: Model) -> dict[str, float]:
    """Segment ID -> length, with ``*`` the whole bundle."""
    segments = {s["id"]: float(s["lengthMm"]) for s in model.get("segments") or []}
    if model.get("segments") is not None:
        segments["*"] = float(model["harness"].get("bundleMm") or sum(segments.values()))
    return segments


def node_names(model: Model) -> dict[str, str]:
    """Route node -> name: an end by its name, a breakout ``B1``, ``B2``… in segment order (§26.3)."""
    names = _end_names(model)
    breakouts = 0
    for segment in model.get("segments") or []:
        for side in ("from", "to"):
            if segment[side] not in names:
                breakouts += 1
                names[segment[side]] = f"B{breakouts}"
    return names


def segment_name(model: Model, segment_id: str) -> str:
    """``HPDRM J4 – B1``; ``whole bundle`` for ``*``; the ID when the route no longer has it."""
    if segment_id == "*":
        return "whole bundle"
    found = next((s for s in model.get("segments") or [] if s["id"] == segment_id), None)
    if not found:
        return segment_id
    names = node_names(model)
    return f"{names[found['from']]} – {names[found['to']]}"


def splices(model: Model) -> list[tuple[str, str, int]]:
    """``(end, pin, wires)`` for every end pin that carries more than one wire (§17.2)."""
    count: dict[tuple[str, str], int] = defaultdict(int)
    for wire in model["wires"]:
        for side in ("from", "to"):
            count[(wire[side]["end"], wire[side]["pin"])] += 1
    names = _end_names(model)
    return [(names.get(end, end), pin, n) for (end, pin), n in sorted(count.items()) if n > 1]


def bom_rows(model: Model) -> list[dict]:
    """§26.2 rows: housings, contacts, wire, splices, coverings, labels."""
    rows: list[dict] = []

    def add(kind, part, description, qty, unit, where):
        part = part or {}
        rows.append({"kind": kind, "mpn": part.get("mpn") or "", "manufacturer": part.get("manufacturer") or "",
                     "description": description, "qty": qty, "unit": unit, "where": where})

    def named(part, fallback):
        """The part's name when it says more than its MPN, else ``fallback``."""
        name = (part or {}).get("name") or ""
        return name if name and name != (part or {}).get("mpn") else fallback

    for end in model["ends"]:
        if end.get("part"):
            add("housing", end["part"], named(end["part"], f"{len(end['pins'])}-way housing"), 1, "each", end["name"])
        else:
            add("housing", None, f"Generic {len(end['pins'])}-way (no part)", 1, "each", end["name"])
    wired: dict[str, set] = defaultdict(set)
    for wire in model["wires"]:
        for side in ("from", "to"):
            wired[wire[side]["end"]].add(wire[side]["pin"])
    contacts: dict[str, dict] = {}
    for end in model["ends"]:
        contact = end.get("contact")
        if not contact or not wired.get(end["id"]):
            continue
        entry = contacts.setdefault(contact["componentId"], {"part": contact, "qty": 0, "where": []})
        entry["qty"] += len(wired[end["id"]])
        entry["where"].append(end["name"])
    for entry in contacts.values():
        add("contact", entry["part"], named(entry["part"], "Crimp contact"), entry["qty"], "each", ", ".join(entry["where"]))
    by_wire: dict[tuple, float] = defaultdict(float)
    missing = 0
    for wire in model["wires"]:
        if wire.get("cutMm") is None:
            missing += 1
            continue
        by_wire[(wire.get("gaugeAwg"), wire.get("colour") or "")] += float(wire["cutMm"])
    for (gauge, colour), mm in sorted(by_wire.items(), key=lambda kv: (kv[0][0] or 0, kv[0][1])):
        name = " ".join(x for x in (f"{gauge} AWG" if gauge else "gauge unset", colour, "wire") if x)
        add("wire", None, name, _metres(mm), "m", "")
    if missing:
        add("wire", None, f"{missing} wire(s) without a cut length", missing, "each", "")
    for end_name, pin, n in splices(model):
        add("splice", None, f"{n} wires in one cavity", 1, "each", f"{end_name} {pin}")
    lengths = segment_lengths(model)
    for covering in model.get("coverings") or []:
        length = lengths.get(covering["segmentId"])
        where = segment_name(model, covering["segmentId"])
        if length is None:
            add("covering", covering.get("part"), covering.get("description") or named(covering.get("part"), "Covering"),
                "", "m", f"{where} (unrouted)")
        else:
            add("covering", covering.get("part"), covering.get("description") or named(covering.get("part"), "Covering"),
                _metres(length), "m", where)
    labelled = sum(1 for wire in model["wires"] if wire.get("label"))
    if labelled:
        add("label", None, "Wire label", labelled, "each", "")
    for n, row in enumerate(rows, 1):
        row["item"] = n
    return rows


def bom_csv(model: Model) -> bytes:
    columns = ["item", "kind", "mpn", "manufacturer", "description", "qty", "unit", "where"]
    return _csv(columns, [[row[c] for c in columns] for row in bom_rows(model)])


# ---------------------------------------------------------------------------
# WireViz


def _wv(text: Any) -> str:
    """WireViz 0.4 puts text into Graphviz HTML labels unescaped: ``C&DH`` breaks the render."""
    return escape(str(text), quote=False)


def _wv_pin(pin: str) -> Any:
    """WireViz matches a connection's pin against ``pins`` by value. A canonical number stays a number
    (``"1"`` → 1); anything else (``"01"``, ``"A1"``, ``"MP"``) stays text, so pin names stay unique."""
    text = str(pin)
    return int(text) if text.isdigit() and str(int(text)) == text else text


def _wv_colour(colour: Any) -> Optional[str]:
    """A WireViz colour code: ``red`` → ``RD``, a striped ``red/white`` → ``RDWH``; None when unknown."""
    parts = [p for p in re.split(r"[/\-]", str(colour or "").strip().lower()) if p]
    codes = [WIREVIZ_COLOURS.get(p) for p in parts]
    return "".join(codes) if codes and all(codes) else None


def _wv_part(part: Optional[Mapping[str, Any]]) -> dict:
    return {k: _wv(part[k]) for k in ("mpn", "manufacturer") if part and part.get(k)}


def wireviz_yaml(model: Model) -> bytes:
    """§26.2: connectors per end, a cable per end pair and gauge, a connection per wire (WireViz 0.4).

    WireViz has no branch topology: a harness with breakouts becomes one cable per end pair, and
    segment lengths stay in the drawing. Coverings ride on the first cable as components, by length.
    """
    tags = {end["id"]: f"X{n}" for n, end in enumerate(model["ends"], 1)}
    signals: dict[tuple[str, str], str] = {}
    for wire in model["wires"]:
        for side in ("from", "to"):
            signals.setdefault((wire[side]["end"], wire[side]["pin"]), wire.get("signal") or "")
    connectors = {}
    for end in model["ends"]:
        pins = list(end["pins"]) or ["1"]
        names = {str(p) for p in pins}
        # A label equal to another pin's name would make WireViz read the connection by label.
        labels = [_wv(signals.get((end["id"], p), "")) for p in pins]
        labels = [label + "\u200b" if label in names else label for label in labels]
        part = end.get("part")
        entry: dict[str, Any] = {"type": _wv(part.get("name") or part.get("mpn") or "Housing") if part else "Generic",
                                 **_wv_part(part), "notes": _wv(end["name"]),
                                 "pins": [_wv_pin(p) for p in pins], "hide_disconnected_pins": True, "pinlabels": labels}
        if end.get("contact"):
            entry["additional_components"] = [{"type": "Crimp contact", **_wv_part(end["contact"]),
                                               "qty": 1, "qty_multiplier": "populated"}]
        connectors[tags[end["id"]]] = entry
    groups: dict[tuple, list[dict]] = defaultdict(list)
    for wire in ordered_wires(model):
        groups[(wire["from"]["end"], wire["to"]["end"], wire.get("gaugeAwg"))].append(wire)
    cables, connections = {}, []
    for n, ((a, b, gauge), wires) in enumerate(groups.items(), 1):
        name = f"W{n}"
        cable: dict[str, Any] = {"wirecount": len(wires), "category": "bundle",
                                 "wirelabels": [_wv(w["number"] + (f" {w['label']}" if w.get("label") else "")) for w in wires]}
        if gauge is not None:
            cable["gauge"] = f"{gauge} AWG"
        colours = [_wv_colour(w.get("colour")) for w in wires]
        if all(colours):
            cable["colors"] = colours
        cuts = [w["cutMm"] for w in wires if w.get("cutMm") is not None]
        if cuts:
            cable["length"] = round(max(cuts) / 1000.0, 3)
        cables[name] = cable
        for index, wire in enumerate(wires, 1):
            connections.append([{tags[a]: [_wv_pin(wire["from"]["pin"])]}, {name: [index]},
                                {tags[b]: [_wv_pin(wire["to"]["pin"])]}])
    lengths = segment_lengths(model)
    coverings = [{"type": _wv(f"Covering ({segment_name(model, c['segmentId'])})"),
                  "subtype": _wv(c.get("description") or ""), **_wv_part(c.get("part")),
                  "qty": _metres(lengths[c["segmentId"]]) if c["segmentId"] in lengths else 1,
                  "unit": "m" if c["segmentId"] in lengths else None}
                 for c in model.get("coverings") or []]
    if coverings and cables:
        next(iter(cables.values()))["additional_components"] = [{k: v for k, v in c.items() if v} for c in coverings]
    doc = {"metadata": {"title": _wv(model["harness"]["name"]),
                        "description": _wv(f"{model['system']['name']} v{model['system']['version']}")},
           "connectors": connectors, "cables": cables, "connections": connections}
    return yaml.safe_dump(doc, sort_keys=False, allow_unicode=True).encode("utf-8")


# ---------------------------------------------------------------------------
# Drawing (the SVG itself is harness_drawing, §26.3)


def drawing_pdf(svg: bytes) -> bytes:
    # Release Studio's artwork already renders SVG to PDF through Cairo; it knows where Cairo lives.
    from app.release_studio.documents.artwork import _configure_cairo_library_path

    _configure_cairo_library_path()
    import cairosvg

    return cairosvg.svg2pdf(bytestring=svg)

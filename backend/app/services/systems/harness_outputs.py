"""Harness manufacturing outputs (SB2-110, CONTRACTS_P2 §26.2): wiring list, BOM, layout drawing
and WireViz YAML, all from one harness model the service builds from the live document.

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
from collections import defaultdict
from datetime import date
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
        where = "whole bundle" if covering["segmentId"] == "*" else covering["segmentId"]
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
    """WireViz matches a connection's pin against ``pins`` by value: numbers stay numbers."""
    return int(pin) if str(pin).isdigit() else str(pin)


def wireviz_yaml(model: Model) -> bytes:
    """§26.2: connectors per end, a cable per end pair, a connection per wire (WireViz 0.4)."""
    tags = {end["id"]: f"X{n}" for n, end in enumerate(model["ends"], 1)}
    signals: dict[tuple[str, str], str] = {}
    for wire in model["wires"]:
        for side in ("from", "to"):
            signals.setdefault((wire[side]["end"], wire[side]["pin"]), wire.get("signal") or "")
    connectors = {}
    for end in model["ends"]:
        pins = list(end["pins"]) or ["1"]
        entry = {"type": _wv((end.get("part") or {}).get("mpn") or "Generic"), "notes": _wv(end["name"]),
                 "pins": [_wv_pin(p) for p in pins], "hide_disconnected_pins": True,
                 "pinlabels": [_wv(signals.get((end["id"], p), "")) for p in pins]}
        if end.get("contact"):
            entry["subtype"] = _wv(f"contact {end['contact'].get('mpn') or end['contact'].get('name')}")
        connectors[tags[end["id"]]] = entry
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for wire in ordered_wires(model):
        groups[(wire["from"]["end"], wire["to"]["end"])].append(wire)
    cables, connections = {}, []
    for n, ((a, b), wires) in enumerate(groups.items(), 1):
        name = f"W{n}"
        cable: dict[str, Any] = {"wirecount": len(wires), "category": "bundle",
                                 "wirelabels": [_wv(w["number"] + (f" {w['label']}" if w.get("label") else "")) for w in wires]}
        gauges = {w.get("gaugeAwg") for w in wires}
        if len(gauges) == 1 and None not in gauges:
            cable["gauge"] = f"{gauges.pop()} AWG"
        colours = [WIREVIZ_COLOURS.get(str(w.get("colour") or "").strip().lower()) for w in wires]
        if all(colours):
            cable["colors"] = colours
        cuts = [w["cutMm"] for w in wires if w.get("cutMm") is not None]
        if cuts:
            cable["length"] = round(max(cuts) / 1000.0, 3)
        cables[name] = cable
        for index, wire in enumerate(wires, 1):
            connections.append([{tags[a]: [_wv_pin(wire["from"]["pin"])]}, {name: [index]},
                                {tags[b]: [_wv_pin(wire["to"]["pin"])]}])
    doc = {"metadata": {"title": _wv(model["harness"]["name"]),
                        "description": _wv(f"{model['system']['name']} v{model['system']['version']}")},
           "connectors": connectors, "cables": cables, "connections": connections}
    return yaml.safe_dump(doc, sort_keys=False, allow_unicode=True).encode("utf-8")


# ---------------------------------------------------------------------------
# Layout drawing

ROW = 14  # px per cavity row
FONT = "font-family='Helvetica, Arial, sans-serif'"


def _tree_positions(model: Model) -> tuple[dict[str, tuple[float, float]], list[dict]]:
    """Node -> (column, row) for the route tree (ends and breakouts), and the edges to draw."""
    ends = [end["id"] for end in model["ends"]]
    segments = model.get("segments")
    if not segments:  # no route: the ends in a row, joined in order
        edges = [{"from": a, "to": b, "lengthMm": None, "id": None} for a, b in zip(ends, ends[1:])]
        return {end: (n, 0.0) for n, end in enumerate(ends)}, edges
    adjacent: dict[str, list[str]] = defaultdict(list)
    for segment in segments:
        adjacent[segment["from"]].append(segment["to"])
        adjacent[segment["to"]].append(segment["from"])
    root = next((e for e in ends if e in adjacent), segments[0]["from"])
    column, order, seen = {root: 0}, [root], {root}
    for node in order:
        for nxt in adjacent[node]:
            if nxt not in seen:
                seen.add(nxt)
                column[nxt] = column[node] + 1
                order.append(nxt)
    children = {node: [n for n in adjacent[node] if column.get(n, -1) == column[node] + 1] for node in order}
    rows: dict[str, float] = {}
    counter = [0.0]

    def place(node: str) -> float:
        kids = children.get(node) or []
        if not kids:
            rows[node] = counter[0]
            counter[0] += 1
            return rows[node]
        spots = [place(kid) for kid in kids]
        rows[node] = sum(spots) / len(spots)
        return rows[node]

    place(root)
    for node in ends:  # an end the route did not reach
        if node not in rows:
            rows[node], column[node] = counter[0], 0
            counter[0] += 1
    return {node: (column[node], rows[node]) for node in rows}, [dict(s) for s in segments]


def drawing_svg(model: Model) -> bytes:
    """§26.2: the route tree flattened, connector boxes with cavity tables, a title block."""
    names = _end_names(model)
    wires = ordered_wires(model)
    by_end: dict[str, list[tuple[str, dict]]] = defaultdict(list)
    for wire in wires:
        for side in ("from", "to"):
            by_end[wire[side]["end"]].append((wire[side]["pin"], wire))
    positions, edges = _tree_positions(model)
    ends = {end["id"]: end for end in model["ends"]}
    table_w, col_w = 330, 520
    heights = {e: 60 + ROW * (len(by_end.get(e, [])) + 1) for e in ends}
    row_h = max([120] + list(heights.values())) + 40
    max_col = max([c for c, _ in positions.values()] + [0])
    max_row = max([r for _, r in positions.values()] + [0])
    width = 80 + (max_col + 1) * col_w + table_w
    height = 140 + (max_row + 1) * row_h + 90

    def xy(node: str) -> tuple[float, float]:
        c, r = positions[node]
        return 40 + c * col_w + (table_w if c > 0 else 0) + (0 if c == 0 else 0), 100 + r * row_h + 40

    anchor: dict[str, tuple[float, float]] = {}
    out = [f"<svg xmlns='http://www.w3.org/2000/svg' width='{width}' height='{height}' viewBox='0 0 {width} {height}' {FONT}>",
           f"<rect width='{width}' height='{height}' fill='white'/>",
           f"<text x='40' y='40' font-size='20' font-weight='bold'>{escape(model['harness']['name'])}</text>"]
    if model["harness"].get("label"):
        out.append(f"<text x='40' y='62' font-size='12' fill='#555'>{escape(model['harness']['label'])}</text>")
    for node, _ in positions.items():
        x, y = xy(node)
        if node in ends:
            end = ends[node]
            c, _r = positions[node]
            box_x = x if c == 0 else x
            anchor[node] = (box_x + (table_w if c == 0 else 0), y + 20)
            rows = sorted(by_end.get(node, []), key=lambda pw: _pin_key(pw[0]))
            h = heights[node]
            out.append(f"<rect x='{box_x}' y='{y}' width='{table_w}' height='{h}' fill='#f7f7f7' stroke='#222'/>")
            out.append(f"<text x='{box_x + 8}' y='{y + 18}' font-size='14' font-weight='bold'>{escape(end['name'])}</text>")
            part = (end.get("part") or {}).get("mpn") or "Generic (no part)"
            contact = (end.get("contact") or {}).get("mpn") or "contact unset"
            out.append(f"<text x='{box_x + 8}' y='{y + 34}' font-size='11'>{escape(part)} · {escape(contact)}</text>")
            ty = y + 54
            for col, text in ((8, "Cav"), (44, "Signal"), (190, "Wire"), (230, "AWG"), (268, "Colour")):
                out.append(f"<text x='{box_x + col}' y='{ty}' font-size='10' font-weight='bold'>{text}</text>")
            for pin, wire in rows:
                ty += ROW
                values = ((8, pin), (44, (wire.get("signal") or "")[:22]), (190, wire["number"]),
                          (230, wire.get("gaugeAwg") or ""), (268, (wire.get("colour") or "")[:10]))
                for col, text in values:
                    out.append(f"<text x='{box_x + col}' y='{ty}' font-size='10'>{escape(str(text))}</text>")
        else:
            anchor[node] = (x + table_w / 2, y + 20)
            out.append(f"<circle cx='{anchor[node][0]}' cy='{anchor[node][1]}' r='5' fill='#222'/>")
    coverings = {c["segmentId"]: c for c in model.get("coverings") or []}
    for edge in edges:
        if edge["from"] not in anchor or edge["to"] not in anchor:
            continue
        (x1, y1), (x2, y2) = anchor[edge["from"]], anchor[edge["to"]]
        if positions[edge["to"]][0] > 0 and edge["to"] in ends:
            x2 = xy(edge["to"])[0]
        out.append(f"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' stroke='#222' stroke-width='4'/>")
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        if edge.get("lengthMm") is not None:
            out.append(f"<text x='{mx}' y='{my - 8}' font-size='12' text-anchor='middle'>{edge['lengthMm']:.0f} mm</text>")
        covering = coverings.get(edge.get("id") or "") or None
        if covering:
            text = covering.get("description") or (covering.get("part") or {}).get("mpn") or ""
            out.append(f"<text x='{mx}' y='{my + 18}' font-size='11' text-anchor='middle' fill='#555'>{escape(text)}</text>")
    whole = coverings.get("*")
    ty = height - 70
    harness = model["harness"]
    facts = [f"{model['system']['name']} v{model['system']['version']}", f"{len(wires)} wires",
             f"bundle {harness['bundleMm']:.0f} mm, estimated {harness['estimatedMm']:.0f} mm"
             if harness.get("bundleMm") is not None else "not routed",
             date.today().isoformat()]
    if whole:
        facts.insert(2, f"covering: {whole.get('description') or (whole.get('part') or {}).get('mpn') or ''}")
    out.append(f"<rect x='40' y='{ty - 20}' width='{width - 80}' height='50' fill='none' stroke='#222'/>")
    out.append(f"<text x='52' y='{ty + 10}' font-size='12'>{escape(' · '.join(facts))}</text>")
    out.append("</svg>")
    return "\n".join(out).encode("utf-8")


def drawing_pdf(svg: bytes) -> bytes:
    # Release Studio's artwork already renders SVG to PDF through Cairo; it knows where Cairo lives.
    from app.release_studio.documents.artwork import _configure_cairo_library_path

    _configure_cairo_library_path()
    import cairosvg

    return cairosvg.svg2pdf(bytestring=svg)

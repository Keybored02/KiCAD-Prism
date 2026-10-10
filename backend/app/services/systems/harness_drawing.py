"""The harness drawing (SB2-111, CONTRACTS_P2 §26.3): one sheet with the route tree in WireViz's look.

Each end is a connector table, a row per wired cavity. Every wire is drawn in its colour from its cavity row
into the bundle and tagged with its number. The bundle is the route tree, a sheath per segment labelled with
its length and covering, with a dot at each breakout. Under the drawing come the wire list, the BOM and a title
block.

Pure, like ``harness_outputs``, and from the same model. Every element that belongs to wires carries
``data-w="W1 W2"`` so the in-app viewer can trace a wire through the bundle.
"""

from __future__ import annotations

import math
import re
from collections import defaultdict
from datetime import date
from html import escape
from typing import Any, Mapping, Optional

from app.services.systems.harness_outputs import (
    WIREVIZ_COLOURS,
    Model,
    bom_rows,
    node_names,
    ordered_wires,
    _pin_key,
)

INK, MUTED, LINE, PAPER, HEAD, STRIPE_ROW, SHEATH = "#1d1d1f", "#6b6b70", "#9a9aa0", "#ffffff", "#eef0f3", "#f7f8fa", "#b8bcc4"
FONT = "font-family='Helvetica, Arial, sans-serif'"
ROW = 18  # px per cavity row
HEADER = 22  # px per connector header row
CAV_W = 40  # the cavity column
LEAD = 72  # the straight wire lead from a cavity, which carries its tag
FAN = 150  # room for the wires to fan into the bundle
COLUMN = 230  # px per tree depth between breakouts
MARGIN = 40
SWATCHES = {
    "BK": "#232323", "BN": "#8b5a2b", "RD": "#e0322d", "OG": "#f28a1e", "YE": "#f5d000", "GN": "#2f9e44",
    "BU": "#2b6fd6", "VT": "#8a4fd1", "GY": "#9a9a9a", "WH": "#ffffff", "PK": "#f48fb1", "TQ": "#30c5c0",
    "GD": "#c9a227", "SR": "#c0c0c0",
}
UNKNOWN = "#c8c8cc"


# ---------------------------------------------------------------------------
# Small pieces


def _text(x: float, y: float, value: Any, size: float = 11, weight: str = "normal", fill: str = INK,
          anchor: str = "start") -> str:
    return (f"<text x='{x:.1f}' y='{y:.1f}' font-size='{size}' font-weight='{weight}' fill='{fill}' "
            f"text-anchor='{anchor}'>{escape(str(value))}</text>")


def _width(value: str, size: float) -> float:
    """A Helvetica estimate: good enough to size boxes, never used to clip."""
    return len(value) * size * 0.58


def _fit(value: str, size: float, room: float) -> str:
    if _width(value, size) <= room:
        return value
    keep = max(1, int(room / (size * 0.58)) - 1)
    return value[:keep] + "…"


def _pill(x: float, y: float, value: str, size: float = 9) -> list[str]:
    w = _width(value, size) + 10
    return [f"<rect x='{x - w / 2:.1f}' y='{y - 7:.1f}' width='{w:.1f}' height='14' rx='7' fill='{PAPER}' "
            f"stroke='{LINE}' stroke-width='0.6'/>", _text(x, y + 3.3, value, size, anchor="middle")]


def colour_codes(colour: Any) -> tuple[list[str], str]:
    """``red/white`` → (["RD", "WH"], "RDWH"); an unknown name keeps its text as the code."""
    text = str(colour or "").strip()
    parts = [p for p in re.split(r"[/\-]", text.lower()) if p]
    codes = [WIREVIZ_COLOURS.get(p) for p in parts]
    if parts and all(codes):
        return codes, "".join(codes)  # type: ignore[arg-type]
    return [], text


def _fills(colour: Any) -> tuple[str, Optional[str]]:
    codes, _ = colour_codes(colour)
    if not codes:
        return UNKNOWN, None
    return SWATCHES[codes[0]], SWATCHES[codes[1]] if len(codes) > 1 else None


def _wire(d: str, colour: Any, width: float = 3.2) -> list[str]:
    base, stripe = _fills(colour)
    out = [f"<path d='{d}' fill='none' stroke='{INK}' stroke-width='{width + 2}' stroke-linecap='round'/>",
           f"<path d='{d}' fill='none' stroke='{base}' stroke-width='{width}' stroke-linecap='round'/>"]
    if stripe:
        out.append(f"<path d='{d}' fill='none' stroke='{stripe}' stroke-width='{max(1.4, width / 3):.1f}' "
                   "stroke-dasharray='6 4'/>")
    return out


def _swatch(x: float, y: float, colour: Any, w: float = 22, h: float = 8) -> list[str]:
    base, stripe = _fills(colour)
    out = [f"<rect x='{x:.1f}' y='{y:.1f}' width='{w}' height='{h}' fill='{base}' stroke='{INK}' stroke-width='0.8'/>"]
    if stripe:
        out.append(f"<rect x='{x:.1f}' y='{y + h / 2 - 1.2:.1f}' width='{w}' height='2.4' fill='{stripe}'/>")
    return out


def _sheath_width(wires: int) -> float:
    return min(40.0, 8 + 7 * math.sqrt(max(wires, 1)))


# ---------------------------------------------------------------------------
# The route tree


def _route(model: Model) -> tuple[str, dict, dict, list[str], dict[str, str]]:
    """``(root, depth, parent, order, breakout names)``; ``parent[node] = (parent node, segment)``.

    An end the route passes through (an in-line connector) gets a tap node in the tree and hangs off it by a
    stub, so every end is a leaf. An end the route never reaches hangs off the root by an unrouted stub.
    """
    ends = [end["id"] for end in model["ends"]]
    wires = model["wires"]
    segments = [dict(s) for s in model.get("segments") or []]
    degree: dict[str, int] = defaultdict(int)
    for s in segments:
        degree[s["from"]] += 1
        degree[s["to"]] += 1
    for end in ends:
        if degree[end] > 1:  # in-line: the route continues through a tap
            tap = f"tap:{end}"
            for s in segments:
                for side in ("from", "to"):
                    if s[side] == end:
                        s[side] = tap
            carried = [w["id"] for w in wires if end in (w["from"]["end"], w["to"]["end"])]
            segments.append({"id": f"{tap}~stub", "from": tap, "to": end, "lengthMm": None, "wires": carried, "stub": True})
    adjacent: dict[str, list[tuple[str, dict]]] = defaultdict(list)
    for s in segments:
        adjacent[s["from"]].append((s["to"], s))
        adjacent[s["to"]].append((s["from"], s))
    root = next((e for e in ends if len(adjacent[e]) == 1), ends[0])
    depth, parent, order = {root: 0}, {}, [root]
    for node in order:
        for nxt, seg in sorted(adjacent[node], key=lambda ns: ns[0]):
            if nxt not in depth:
                depth[nxt], parent[nxt] = depth[node] + 1, (node, seg)
                order.append(nxt)
    for end in ends:
        if end not in depth:
            carried = [w["id"] for w in wires if end in (w["from"]["end"], w["to"]["end"])]
            depth[end], parent[end] = 1, (root, {"id": f"{end}~unrouted", "from": root, "to": end, "lengthMm": None,
                                                 "wires": carried, "unrouted": True})
            order.append(end)
    named = node_names(model)
    names = {node: named[node] for node in order if node not in ends and not node.startswith("tap:")}
    return root, depth, parent, order, names


# ---------------------------------------------------------------------------
# Connector tables


def _signal(end_id: str, pin: str, wire: Mapping[str, Any]) -> str:
    side = "netFrom" if wire["from"]["end"] == end_id and wire["from"]["pin"] == pin else "netTo"
    return " ".join(wire.get(side) or []) or (wire.get("signal") or "")


def _connector(x: float, y: float, end: Mapping[str, Any], rows: list[tuple[str, list[dict]]], width: float,
               facing: str) -> tuple[list[str], dict[str, tuple[float, float]], float]:
    """A connector table; ports on the right edge (``facing="right"``) or the left. Returns (svg, port by pin, height)."""
    part = end.get("part") or {}
    contact = end.get("contact") or {}
    header = [(end["name"], 12.5, "bold", INK),
              ((part.get("mpn") or "No part") + (f" · {part['manufacturer']}" if part.get("manufacturer") else ""), 10.5,
               "normal", MUTED),
              (f"{len(end.get('pins') or [])}-way · {len(rows)} used · contact {contact.get('mpn') or '—'}", 10, "normal", MUTED)]
    top = HEADER * len(header)
    h = top + 4 + ROW * len(rows)
    out = [f"<g data-end='{escape(end['id'])}'>",
           f"<rect x='{x:.1f}' y='{y:.1f}' width='{width:.1f}' height='{h}' fill='{PAPER}' stroke='{INK}' stroke-width='1.2' rx='3'/>",
           f"<rect x='{x:.1f}' y='{y:.1f}' width='{width:.1f}' height='{top}' fill='{HEAD}' stroke='{INK}' stroke-width='1.2' rx='3'/>"]
    for n, (value, size, weight, fill) in enumerate(header):
        out.append(_text(x + 10, y + 16 + HEADER * n, _fit(value, size, width - 20), size, weight, fill))
        if n:
            out.append(f"<line x1='{x:.1f}' y1='{y + HEADER * n:.1f}' x2='{x + width:.1f}' y2='{y + HEADER * n:.1f}' "
                       f"stroke='{LINE}' stroke-width='0.6'/>")
    ports = {}
    for n, (pin, wires) in enumerate(rows):
        ry = y + top + 4 + ROW * n
        cy = ry + ROW / 2
        numbers = " ".join(w["number"] for w in wires)
        out.append(f"<g data-w='{numbers}'>")
        out.append(f"<rect x='{x + 1:.1f}' y='{ry:.1f}' width='{width - 2:.1f}' height='{ROW}' "
                   f"fill='{STRIPE_ROW if n % 2 else PAPER}'/>")
        signal = _fit(_signal(end["id"], pin, wires[0]), 10.5, width - CAV_W - 20)
        cav_x = x + width - CAV_W if facing == "right" else x
        sig_x = x + 10 if facing == "right" else x + CAV_W + 10
        out.append(_text(sig_x, cy + 3.8, signal, 10.5))
        out.append(f"<line x1='{cav_x + (0 if facing == 'right' else CAV_W):.1f}' y1='{ry:.1f}' "
                   f"x2='{cav_x + (0 if facing == 'right' else CAV_W):.1f}' y2='{ry + ROW:.1f}' stroke='{LINE}' stroke-width='0.6'/>")
        out.append(_text(cav_x + CAV_W / 2, cy + 3.8, _fit(pin, 10.5, CAV_W - 4), 10.5, "bold", anchor="middle"))
        px = x + width if facing == "right" else x
        spliced = len(wires) > 1
        out.append(f"<circle cx='{px:.1f}' cy='{cy:.1f}' r='3' fill='{INK if spliced else PAPER}' stroke='{INK}' stroke-width='1.2'/>")
        out.append("</g>")
        ports[pin] = (px, cy)
    out.append("</g>")
    return out, ports, h


def _box_width(end: Mapping[str, Any], rows: list[tuple[str, list[dict]]]) -> float:
    longest = max([_width(_signal(end["id"], pin, wires[0]), 10.5) for pin, wires in rows] + [0])
    part, contact = end.get("part") or {}, end.get("contact") or {}
    header = max(_width(end["name"], 12.5),
                 _width((part.get("mpn") or "No part") + " · " + (part.get("manufacturer") or ""), 10.5),
                 _width(f"{len(end.get('pins') or [])}-way · {len(rows)} used · contact {contact.get('mpn') or '—'}", 10))
    return max(220.0, min(380.0, max(longest + CAV_W + 24, header + 20)))


# ---------------------------------------------------------------------------
# Tables under the drawing


def _table(x: float, y: float, title: str, columns: list[tuple[str, float]], rows: list[tuple[str, list[Any]]],
           width: float, swatch_column: Optional[int] = None) -> tuple[list[str], float]:
    """rows: (data-w, cells). A cell under ``swatch_column`` is a colour: swatch plus code."""
    scale = width / sum(w for _, w in columns)
    columns = [(k, w * scale) for k, w in columns]
    out = [_text(x, y - 8, title, 12, "bold"),
           f"<rect x='{x}' y='{y}' width='{width:.1f}' height='{18 * (len(rows) + 1)}' fill='{PAPER}' stroke='{INK}' stroke-width='1'/>",
           f"<rect x='{x}' y='{y}' width='{width:.1f}' height='18' fill='{HEAD}' stroke='{INK}' stroke-width='1'/>"]
    cx = x
    for label, w in columns:
        out.append(_text(cx + 6, y + 13, label, 10, "bold"))
        cx += w
    for n, (numbers, cells) in enumerate(rows, 1):
        ry = y + 18 * n
        out.append(f"<g data-w='{numbers}'>" if numbers else "<g>")
        out.append(f"<rect x='{x + 0.5}' y='{ry + 0.5}' width='{width - 1:.1f}' height='17' fill='{PAPER}'/>")
        cx = x
        for index, (value, (_, w)) in enumerate(zip(cells, columns)):
            if index == swatch_column:
                out += _swatch(cx + 6, ry + 5, value)
                out.append(_text(cx + 34, ry + 13, _fit(colour_codes(value)[1], 10, w - 40), 10))
            else:
                out.append(_text(cx + 6, ry + 13, _fit("" if value is None else str(value), 10, w - 10), 10))
            cx += w
        out.append(f"<line x1='{x}' y1='{ry}' x2='{x + width:.1f}' y2='{ry}' stroke='{LINE}' stroke-width='0.5'/>")
        out.append("</g>")
    return out, 18 * (len(rows) + 1)


def _title_block(x: float, y: float, w: float, model: Model, wires: int, covering: Optional[str]) -> list[str]:
    harness = model["harness"]
    bundle = f"{harness['bundleMm']:.0f} mm" if harness.get("bundleMm") is not None else "not routed"
    facts = [("Harness", harness["name"], 3), ("System", f"{model['system']['name']} v{model['system']['version']}", 2),
             ("Wires", str(wires), 1), ("Bundle", bundle, 1)]
    if covering:
        facts.append(("Covering", covering, 2))
    facts += [("Sheet", "1 of 1", 1), ("Date", date.today().isoformat(), 1)]
    total = sum(f[2] for f in facts)
    out = [f"<rect x='{x}' y='{y}' width='{w:.1f}' height='44' fill='{PAPER}' stroke='{INK}' stroke-width='1.2'/>"]
    cx = x
    for n, (label, value, weight) in enumerate(facts):
        cw = w * weight / total
        out.append(_text(cx + 10, y + 16, label.upper(), 8.5, "bold", MUTED))
        out.append(_text(cx + 10, y + 34, _fit(value, 12, cw - 20), 12, "bold" if n == 0 else "normal"))
        if n:
            out.append(f"<line x1='{cx:.1f}' y1='{y}' x2='{cx:.1f}' y2='{y + 44}' stroke='{LINE}' stroke-width='0.6'/>")
        cx += cw
    return out


# ---------------------------------------------------------------------------
# The sheet


def drawing_svg(model: Model) -> bytes:
    """§26.3: connector tables, every wire fanned into the route tree, the wire list, BOM and title block."""
    wires = ordered_wires(model)
    by_id = {w["id"]: w for w in wires}
    ends = {end["id"]: end for end in model["ends"]}
    cavities: dict[str, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))
    for wire in wires:
        for side in ("from", "to"):
            cavities[wire[side]["end"]][wire[side]["pin"]].append(wire)
    rows = {e: sorted(cavities[e].items(), key=lambda pw: _pin_key(pw[0])) for e in ends}
    root, depth, parent, order, breakouts = _route(model)
    leaves = [n for n in order if n in ends and n != root]
    children: dict[str, list[str]] = defaultdict(list)
    for node, (up, _) in parent.items():
        children[up].append(node)

    def dfs_leaves(node: str) -> list[str]:  # leaves in tree order, so branches do not cross
        if node in ends and node != root:
            return [node]
        return [leaf for child in children[node] for leaf in dfs_leaves(child)]

    leaves = dfs_leaves(root) + [l for l in leaves if l not in dfs_leaves(root)]
    widths = {e: _box_width(ends[e], rows[e]) for e in ends}
    heights = {e: HEADER * 3 + 4 + ROW * len(rows[e]) for e in ends}
    mouth = {e: HEADER * 3 + 4 + ROW * len(rows[e]) / 2 if rows[e] else HEADER * 1.5 for e in ends}
    max_depth = max([d for n, d in depth.items() if n not in ends or n == root] + [0])
    left_x = MARGIN
    trunk_x0 = left_x + widths[root] + FAN
    right_x = trunk_x0 + COLUMN * max_depth + FAN + 40
    right_w = max([widths[l] for l in leaves] + [0])
    width = max(right_x + right_w + MARGIN, 900)
    y0 = 90 if not model["harness"].get("label") else 106

    top, anchor = y0, {}
    leaf_y = {}
    for leaf in leaves:
        leaf_y[leaf] = top
        anchor[leaf] = (right_x - FAN + 40 if rows[leaf] else right_x, top + mouth[leaf])
        top += heights[leaf] + 40
    mid = sum(anchor[l][1] for l in leaves) / len(leaves) if leaves else y0 + mouth[root]
    root_y = max(y0, mid - mouth[root])
    anchor[root] = (trunk_x0, root_y + mouth[root])

    def place(node: str) -> float:
        if node in anchor:
            return anchor[node][1]
        ys = [place(child) for child in children[node]] or [anchor[root][1]]
        anchor[node] = (trunk_x0 + COLUMN * depth[node], sum(ys) / len(ys))
        return anchor[node][1]

    for node in order:
        place(node)
    if any(node.startswith("tap:") for node in order):  # a tap sits just before its end
        for node in order:
            if node.startswith("tap:"):
                end = node[4:]
                anchor[node] = (min(anchor[node][0], anchor[end][0] - 60), anchor[node][1])

    body = [_text(MARGIN, 34, model["harness"]["name"], 20, "bold")]
    if model["harness"].get("label"):
        body.append(_text(MARGIN, 56, model["harness"]["label"], 12, fill=MUTED))
    body.append(_text(MARGIN, y0 - 34, "Wiring and layout · not to scale", 11, fill=MUTED))

    coverings = {c["segmentId"]: c for c in model.get("coverings") or []}
    whole = coverings.get("*")

    def covering_text(c: Optional[Mapping[str, Any]]) -> Optional[str]:
        if not c:
            return None
        return c.get("description") or (c.get("part") or {}).get("mpn") or (c.get("part") or {}).get("name") or "covering"

    sheaths, dots = [], []
    for node in order:
        if node == root:
            continue
        up, seg = parent[node]
        (x1, y1), (x2, y2) = anchor[up], anchor[node]
        carried = [by_id[w] for w in seg.get("wires") or [] if w in by_id]
        numbers = " ".join(w["number"] for w in carried)
        w = _sheath_width(len(carried))
        bend = min(abs(y2 - y1) * 0.4, (x2 - x1) / 2)  # a softer bend for a longer drop
        points = [(x1, y1), (x2, y2)] if abs(y1 - y2) < 1 else [(x1, y1), (x1 + bend, y2), (x2, y2)]
        d = "M " + " L ".join(f"{px:.1f} {py:.1f}" for px, py in points)
        group = [f"<g data-w='{numbers}' data-segment='{escape(seg['id'])}'>"]
        if seg.get("unrouted"):
            group.append(f"<path d='{d}' fill='none' stroke='{MUTED}' stroke-width='2' stroke-dasharray='6 5'/>")
        else:
            group.append(f"<path d='{d}' fill='none' stroke='{INK}' stroke-width='{w + 2.4:.1f}' stroke-linejoin='round'/>")
            group.append(f"<path d='{d}' fill='none' stroke='{SHEATH}' stroke-width='{w:.1f}' stroke-linejoin='round'/>")
        cov = None if seg.get("stub") or seg.get("unrouted") else covering_text(coverings.get(seg["id"]))
        if (cov or (whole and not seg.get("stub") and not seg.get("unrouted"))):
            group.append(f"<path d='{d}' fill='none' stroke='url(#hatch)' stroke-width='{w:.1f}' stroke-linejoin='round'/>")
        (ax, ay), (bx, by) = points[-2], points[-1]  # the horizontal leg into the child
        mx, my = (ax + bx) / 2, (ay + by) / 2
        if seg.get("unrouted"):
            group += _pill(mx, my, "not routed", 9.5)
        elif not seg.get("stub"):
            group += _pill(mx, my, f"{seg['lengthMm']:.0f} mm" if seg.get("lengthMm") is not None else "— mm", 9.5)
            below = y2 > y1 + 1
            caption = f"{len(carried)} wires" + (f" · {cov}" if cov else "")
            group.append(_text(mx, my + (w / 2 + 14 if below else -(w / 2 + 8)), caption, 10, fill=MUTED, anchor="middle"))
        group.append("</g>")
        sheaths += group
        if node.startswith("tap:"):  # an in-line end: the bundle passes it
            dots.append(f"<circle cx='{x2:.1f}' cy='{y2:.1f}' r='4' fill='{PAPER}' stroke='{INK}' stroke-width='1.6'/>")
        if node in breakouts:
            r = w / 2 + 3
            dots.append(f"<g data-w='{numbers}'><circle cx='{x2:.1f}' cy='{y2:.1f}' r='{r:.1f}' fill='{INK}'/>")
            dots.append(_text(x2 - r - 6, y2 + 4, breakouts[node], 11, "bold", anchor="end") + "</g>")

    boxes, fans, tags = [], [], []
    for end_id in [root] + leaves:
        facing = "right" if end_id == root else "left"
        bx = left_x if end_id == root else right_x
        by = root_y if end_id == root else leaf_y[end_id]
        svg, ports, _ = _connector(bx, by, ends[end_id], rows[end_id], widths[end_id] if end_id == root else right_w, facing)
        boxes += svg
        ax, ay = anchor[end_id]
        count = sum(len(ws) for ws in cavities[end_id].values())
        spacing = min(2.6, _sheath_width(count) / max(count, 1))
        k = 0
        sign = 1 if facing == "right" else -1
        for pin, pin_wires in rows[end_id]:
            px, py = ports[pin]
            lead = px + sign * LEAD
            for wire in pin_wires:
                off = (k - (count - 1) / 2) * spacing
                k += 1
                c = sign * 40
                d = (f"M {px:.1f} {py:.1f} L {lead:.1f} {py:.1f} C {lead + c:.1f} {py:.1f} {ax - c:.1f} {ay + off:.1f} "
                     f"{ax:.1f} {ay + off:.1f}")
                fans.append(f"<g data-w='{wire['number']}' data-wire='{escape(wire['id'])}'>")
                fans += _wire(d, wire.get("colour"))
                fans.append("</g>")
            label = (f"{pin_wires[0]['number']} {colour_codes(pin_wires[0].get('colour'))[1]}".strip()
                     if len(pin_wires) == 1 else " ".join(w["number"] for w in pin_wires))
            tags.append(f"<g data-w='{' '.join(w['number'] for w in pin_wires)}'>")
            tags += _pill(px + sign * (LEAD / 2 + 2), py, _fit(label, 9, LEAD - 6), 9)
            tags.append("</g>")

    body += sheaths + fans + tags + dots + boxes
    bottom = max([root_y + heights[root]] + [leaf_y[l] + heights[l] for l in leaves]) + 60
    table_w = width - 2 * MARGIN
    wire_rows = [(w["number"], [w["number"], w.get("label") or "", f"{ends[w['from']['end']]['name']} : {w['from']['pin']}",
                                f"{ends[w['to']['end']]['name']} : {w['to']['pin']}", w.get("signal") or "",
                                w.get("gaugeAwg") or "", w.get("colour") or "",
                                f"{w['cutMm']} mm" if w.get("cutMm") is not None else ""]) for w in wires]
    table, th = _table(MARGIN, bottom, "Wires", [("Wire", 50), ("Label", 110), ("From", 150), ("To", 150), ("Signal", 170),
                                                  ("AWG", 44), ("Colour", 90), ("Cut", 60)], wire_rows, table_w, swatch_column=6)
    body += table
    bom = [("", [r["item"], r["kind"].capitalize(), r["mpn"] or "—", r["manufacturer"], r["description"],
                 f"{r['qty']} {r['unit']}".strip() if r["unit"] != "each" else r["qty"], r["where"]]) for r in bom_rows(model)]
    bom_y = bottom + th + 40
    table, bh = _table(MARGIN, bom_y, "Bill of materials", [("#", 28), ("Kind", 70), ("Part", 130), ("Mfr", 90),
                                                             ("Description", 220), ("Qty", 70), ("Where", 170)], bom, table_w)
    body += table
    height = bom_y + bh + 40 + 44 + MARGIN
    body += _title_block(MARGIN, height - 44 - MARGIN, table_w, model, len(wires), covering_text(whole))

    head = [f"<svg xmlns='http://www.w3.org/2000/svg' width='{width:.0f}' height='{height:.0f}' "
            f"viewBox='0 0 {width:.0f} {height:.0f}' {FONT}>",
            "<defs><pattern id='hatch' width='6' height='6' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>"
            f"<line x1='0' y1='0' x2='0' y2='6' stroke='{INK}' stroke-width='1.2' opacity='0.45'/></pattern></defs>",
            f"<rect width='{width:.0f}' height='{height:.0f}' fill='{PAPER}'/>"]
    return "\n".join(head + body + ["</svg>"]).encode("utf-8")

"""The block diagram's layout, for the ICD: the same rules as the canvas.

A line-for-line port of ``frontend/src/features/system-builder/system-layout.ts``
and of ``layoutInputs`` / ``buildDiagram`` in ``diagram-model.ts`` (SB2-71), so the
ICD's diagram is the Diagram tab's: boards, modules and subsystems, each harness
as a block whose rows are its ends, saved canvas positions, and the same row
order and wire lanes. ``tests/fixtures/system_builder/layout_parity.json`` is checked by
both test suites; change the two files together.

- The most-connected block sits in column 0; its neighbours alternate left and
  right, and blocks further out continue away from the centre.
- A block lists its linked ports as rows, ordered by where their partner port
  sits, so the wires of a bundle never cross.
- Blocks shift vertically so linked rows face their partners.
- Saved positions win; a block without one keeps its default slot unless a
  saved block sits there, then moves down until clear.
- Wires are orthogonal. Each wire in the channel between two columns has its
  own vertical lane, ordered so wires running the same way do not cross.

Pure: takes plain dicts, reads nothing.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field
from typing import Any, Mapping, Optional

BOARD_WIDTH = 240
HEADER_HEIGHT = 48
ROW_HEIGHT = 26
FOOTER_HEIGHT = 28
COLUMN_GAP = 220
BOARD_GAP = 48
COMPONENT_GAP = 96
RESTRICTED = "__restricted__"


def _natural(text: Optional[str]) -> tuple:
    return tuple((0, int(part), "") if part.isdigit() else (1, 0, part.casefold())
                 for part in re.split(r"(\d+)", text or "") if part)


def row_key(port_key: Optional[str]) -> str:
    return port_key if port_key is not None else RESTRICTED


def board_height(row_count: int, hidden_count: int) -> float:
    return HEADER_HEIGHT + max(1, row_count) * ROW_HEIGHT + (FOOTER_HEIGHT if hidden_count > 0 else 8)


# ----- inputs (diagram-model.ts: drawablePorts, linkEnd, layoutInputs) ------------------------


def end_label(end: Mapping[str, Any]) -> str:
    return f"End {int(end['ordinal']) + 1}"


def end_wire_count(harness: Mapping[str, Any], end_id: str) -> int:
    return sum(1 for wire in harness["wires"] if wire["from"]["end"] == end_id or wire["to"]["end"] == end_id)


def _hidden_ports(instance: Mapping[str, Any]) -> bool:
    """A restricted instance's ports are ``null`` (as the canvas tests ``ports === null``)."""
    return "ports" in instance and instance["ports"] is None


def drawable_ports(document: Mapping[str, Any], instance: Mapping[str, Any]) -> tuple[list[dict], set[str]]:
    """Ports a block may show: exposed ones, plus any a link still uses (its ``orphans``)."""

    if _hidden_ports(instance):
        return [], set()
    subports = sorted(instance.get("subports") or [], key=lambda sub: sub["name"])
    exposed = []
    for p in instance.get("ports") or []:
        if not p.get("exposed"):
            continue
        exposed.append({"portKey": p["portKey"], "reference": p["reference"]})
        # A split connector (CONTRACTS_P2 §22.5): its remainder, then one port per sub-port.
        exposed += [{"portKey": end_key(p["portKey"], sub["id"]), "reference": f"{p['reference']}.{sub['name']}"}
                    for sub in subports if sub.get("portKey") == p["portKey"]]
    known = {p["portKey"] for p in exposed}
    orphans: set[str] = set()
    for link in document["links"]:
        for end in (link["a"], link["b"]):
            port = end.get("port")
            key = end_key(port.get("portKey"), (end.get("subport") or {}).get("id")) if port and port.get("portKey") else None
            if end["instanceId"] == instance["id"] and port and key and key not in known:
                known.add(key)
                orphans.add(key)
                exposed.append({"portKey": key, "reference": _reference(end)})
    return exposed, orphans


def end_key(port_key: str, subport_id: Optional[str]) -> str:
    """A link end's row key: its connector, or ``{portKey}#{subportId}`` for a sub-port (subport-model.ts)."""
    return f"{port_key}#{subport_id}" if subport_id else port_key


def _reference(end: Mapping[str, Any]) -> Optional[str]:
    port, name = end.get("port"), (end.get("subport") or {}).get("name")
    if not port:
        return None
    return f"{port['reference']}.{name}" if name else port.get("reference")


def _link_end(document: Mapping[str, Any], link: Mapping[str, Any], end: str) -> dict:
    instance = next((i for i in document["instances"] if i["id"] == link[end]["instanceId"]), None)
    port = None if instance is not None and _hidden_ports(instance) else link[end].get("port")
    subport = (link[end].get("subport") or {}).get("id")
    return {"board": link[end]["instanceId"], "portKey": end_key(port["portKey"], subport) if port else None,
            "reference": _reference(link[end]) if port else None}


def layout_inputs(document: Mapping[str, Any]) -> tuple[list[dict], list[dict]]:
    """Blocks (instances, then harnesses) and links (links, then mated harness ends)."""

    harnesses = document.get("harnesses") or []
    instances = {i["id"]: i for i in document["instances"]}
    # A mechanical part (P2 §24.1) has no ports: it is in the 3D view only, as on the canvas.
    boards = [{"id": i["id"], "label": i["label"], "ports": drawable_ports(document, i)[0]}
              for i in document["instances"] if i.get("kind") != "part"]
    boards += [{"id": h["id"], "label": h["name"],
                "ports": [{"portKey": end["id"], "reference": end_label(end)} for end in h["ends"]]} for h in harnesses]
    links = [{"id": link["id"], "name": link["name"], "a": _link_end(document, link, "a"),
              "b": _link_end(document, link, "b"), "rowCount": len(link["rows"])} for link in document["links"]]
    for harness in harnesses:
        for end in harness["ends"]:
            mates = end.get("mates")
            if not mates:
                continue
            instance = instances.get(mates["instanceId"])
            port = None if instance is not None and _hidden_ports(instance) else mates.get("port")
            links.append({
                "id": end["id"], "name": harness["name"],
                "a": {"board": mates["instanceId"], "portKey": port.get("portKey") if port else None,
                      "reference": port.get("reference") if port else None},
                "b": {"board": harness["id"], "portKey": end["id"], "reference": end_label(end)},
                "rowCount": end_wire_count(harness, end["id"]),
            })
    return boards, links


# ----- layout (system-layout.ts: layoutSystem) --------------------------------------------------


@dataclass
class Partner:
    link_id: str
    board: str
    board_label: str
    reference: Optional[str]


@dataclass
class Row:
    port_key: Optional[str]
    reference: str
    partners: list[Partner] = field(default_factory=list)

    @property
    def key(self) -> str:
        return row_key(self.port_key)


@dataclass
class Board:
    id: str
    label: str
    column: int = 0
    x: float = 0.0
    y: float = 0.0
    rows: list[Row] = field(default_factory=list)
    hidden_ports: list[dict] = field(default_factory=list)

    @property
    def height(self) -> float:
        return board_height(len(self.rows), len(self.hidden_ports))

    def row_y(self, index: int) -> float:
        return self.y + HEADER_HEIGHT + index * ROW_HEIGHT + ROW_HEIGHT / 2

    def index_of(self, key: str) -> Optional[int]:
        return next((i for i, row in enumerate(self.rows) if row.key == key), None)


def _adjacency(boards: list[dict], links: list[dict]) -> tuple[dict[str, int], dict[str, dict[str, int]]]:
    degree = {b["id"]: 0 for b in boards}
    neighbours: dict[str, dict[str, int]] = {b["id"]: {} for b in boards}
    for link in links:
        a, b = link["a"]["board"], link["b"]["board"]
        if a not in degree or b not in degree:
            continue
        degree[a] += 1
        if a != b:
            degree[b] += 1
            neighbours[a][b] = neighbours[a].get(b, 0) + 1
            neighbours[b][a] = neighbours[b].get(a, 0) + 1
    return degree, neighbours


def _columns(boards: list[dict], degree: dict, neighbours: dict) -> tuple[dict[str, int], list[list[str]]]:
    label = {b["id"]: b["label"] for b in boards}

    def by_weight(ids, weight):
        return sorted(ids, key=lambda i: (-weight(i), _natural(label.get(i, "")), _natural(i)))

    column: dict[str, int] = {}
    components: list[list[str]] = []
    for hub in by_weight([b["id"] for b in boards], lambda i: degree.get(i, 0)):
        if hub in column:
            continue
        component, queue, alternate = [hub], [hub], 0
        column[hub] = 0
        while queue:
            current = queue.pop(0)
            here = column[current]
            for nid in by_weight([i for i in neighbours[current] if i not in column], lambda i: neighbours[current].get(i, 0)):
                if here == 0:
                    side = -1 if alternate % 2 == 0 else 1
                    alternate += 1
                else:
                    side = 1 if here > 0 else -1
                column[nid] = here + side
                component.append(nid)
                queue.append(nid)
        components.append(component)
    return column, components


def _rows(board: dict, links: list[dict], labels: dict[str, str]) -> list[Row]:
    rows: dict[str, Row] = {}
    references = {p["portKey"]: p["reference"] for p in board["ports"]}
    for link in links:
        for own, other in ((link["a"], link["b"]), (link["b"], link["a"])):
            if own["board"] != board["id"]:
                continue
            if link["a"]["board"] == link["b"]["board"] and own is link["b"] and link["a"]["portKey"] == link["b"]["portKey"]:
                continue
            key = row_key(own["portKey"])
            row = rows.get(key) or Row(
                port_key=own["portKey"],
                reference=(references.get(own["portKey"]) or own["reference"] or "?") if own["portKey"] else "restricted",
            )
            row.partners.append(Partner(link["id"], other["board"], labels.get(other["board"], ""), other["reference"]))
            rows[key] = row
    return sorted(rows.values(), key=lambda r: _natural(r.reference))


def layout_system(boards: list[dict], links: list[dict],
                  fixed: Optional[Mapping[str, Mapping[str, float]]] = None) -> dict[str, Board]:
    """The default layout; ``fixed`` positions (a saved canvas layout) are kept as given."""

    fixed = fixed or {}
    labels = {b["id"]: b["label"] for b in boards}
    degree, neighbours = _adjacency(boards, links)
    column, components = _columns(boards, degree, neighbours)
    result: dict[str, Board] = {}
    for spec in boards:
        rows = _rows(spec, links, labels)
        linked = {row.port_key for row in rows}
        result[spec["id"]] = Board(
            id=spec["id"], label=spec["label"], column=column.get(spec["id"], 0), rows=rows,
            hidden_ports=sorted((p for p in spec["ports"] if p["portKey"] not in linked), key=lambda p: _natural(p["reference"])),
        )
    by_id = {link["id"]: link for link in links}

    def partner_y(board: Board, partner: Partner) -> Optional[float]:
        other = result.get(partner.board)
        link = by_id.get(partner.link_id)
        if other is None or link is None:
            return None
        end = link["b"] if link["a"]["board"] == board.id and link["b"]["board"] == partner.board else link["a"]
        index = other.index_of(row_key(end["portKey"]))
        return None if index is None else other.row_y(index)

    def sort_rows(board: Board) -> None:
        keyed = []
        for index, row in enumerate(board.rows):
            ys = [y for y in (partner_y(board, p) for p in row.partners) if y is not None]
            mean = sum(ys) / len(ys) if ys else math.inf
            keyed.append((mean, _natural(row.reference), index, row))
        keyed.sort(key=lambda entry: entry[:3])
        board.rows = [entry[3] for entry in keyed]

    top = 0.0
    for component in components:
        members = [result[i] for i in component]
        columns = sorted({b.column for b in members})
        left = columns[0]
        for board in members:
            board.x = float((board.column - left) * (BOARD_WIDTH + COLUMN_GAP))

        def in_column(c):
            return [b for b in members if b.column == c]

        y = top
        for board in in_column(0):
            board.y = max(board.y, y)
            y = board.y + board.height + BOARD_GAP
        order = [c for c in sorted(columns, key=lambda c: (abs(c), c)) if c != 0]
        for _ in range(3):
            for board in members:
                sort_rows(board)
            for c in order:
                group = in_column(c)
                for board in group:
                    offsets = []
                    for index, row in enumerate(board.rows):
                        for partner in row.partners:
                            partner_board = result.get(partner.board)
                            if abs(partner_board.column if partner_board else c) >= abs(c):
                                continue
                            py = partner_y(board, partner)
                            if py is not None:
                                offsets.append(py - (HEADER_HEIGHT + index * ROW_HEIGHT + ROW_HEIGHT / 2))
                    board.y = sum(offsets) / len(offsets) if offsets else top
                # JS Array.sort is stable; the group keeps component order for equal keys.
                group.sort(key=lambda b: (b.y, _natural(labels.get(b.id, ""))))
                floor = -math.inf
                for board in group:
                    board.y = max(board.y, floor)
                    floor = board.y + board.height + BOARD_GAP
        lowest = min(b.y for b in members)
        for board in members:
            board.y += top - lowest
        top = max(b.y + b.height for b in members) + COMPONENT_GAP

    for board_id, position in fixed.items():
        board = result.get(board_id)
        if board is not None:
            board.x, board.y = float(position["x"]), float(position["y"])
    if fixed:
        def overlaps(p: Board, q: Board) -> bool:
            return (abs(p.x - q.x) < BOARD_WIDTH + BOARD_GAP
                    and p.y < q.y + q.height + BOARD_GAP and q.y < p.y + p.height + BOARD_GAP)

        placed = [b for b in result.values() if b.id in fixed]
        for board in sorted((b for b in result.values() if b.id not in fixed), key=lambda b: (b.y, b.x)):
            blocker = next((other for other in placed if overlaps(board, other)), None)
            while blocker is not None:
                board.y = blocker.y + blocker.height + BOARD_GAP
                blocker = next((other for other in placed if overlaps(board, other)), None)
            placed.append(board)
        for _ in range(2):
            for board in result.values():
                sort_rows(board)
    return result


# ----- wires (system-layout.ts: routeWires, wirePoints) ---------------------------------------


@dataclass
class Wire:
    link_id: str
    source: dict
    target: dict
    lane: float = 0.5
    loop_offset: float = 0.0
    kind: str = "lane"
    points: list[tuple[float, float]] = field(default_factory=list)


def route_wires(boards: Mapping[str, Board], links: list[dict]) -> list[Wire]:
    def row_y(board_id: str, port_key: Optional[str]) -> float:
        board = boards.get(board_id)
        if board is None:
            return 0.0
        index = board.index_of(row_key(port_key))
        return board.row_y(max(0, index if index is not None else -1))

    wires: list[Wire] = []
    channels: dict[str, list] = {}
    loops: dict[str, list[Wire]] = {}
    for link in links:
        a, b = boards.get(link["a"]["board"]), boards.get(link["b"]["board"])
        if a is None or b is None:
            continue
        if a.id == b.id or abs(a.x - b.x) < BOARD_WIDTH:
            wire = Wire(link["id"], {"board": a.id, "rowKey": row_key(link["a"]["portKey"]), "side": "r"},
                        {"board": b.id, "rowKey": row_key(link["b"]["portKey"]), "side": "r"}, lane=0, kind="loop")
            loops.setdefault(str(round(max(a.x, b.x))), []).append(wire)
            wires.append(wire)
            continue
        left, right = (link["a"], link["b"]) if a.x < b.x else (link["b"], link["a"])
        y1, y2 = row_y(left["board"], left["portKey"]), row_y(right["board"], right["portKey"])
        wire = Wire(link["id"], {"board": left["board"], "rowKey": row_key(left["portKey"]), "side": "r"},
                    {"board": right["board"], "rowKey": row_key(right["portKey"]), "side": "l"},
                    kind="straight" if abs(y1 - y2) < 1 else "lane")
        wires.append(wire)
        if wire.kind == "lane":
            key = f"{round(boards[left['board']].x)}:{round(boards[right['board']].x)}"
            channels.setdefault(key, []).append((wire, y1, y2))
    for entries in channels.values():
        down = sorted((e for e in entries if e[2] > e[1]), key=lambda e: (-e[1], e[2]))
        up = sorted((e for e in entries if e[2] < e[1]), key=lambda e: (e[1], -e[2]))
        ordered = down + up
        for index, (wire, _y1, _y2) in enumerate(ordered):
            wire.lane = (index + 1) / (len(ordered) + 1)
    for group in loops.values():
        for index, wire in enumerate(group):
            wire.loop_offset = 24 + index * 12
    return wires


def wire_points(wire: Wire, start: tuple[float, float], end: tuple[float, float]) -> list[tuple[float, float]]:
    if wire.kind == "loop":
        x = max(start[0], end[0]) + wire.loop_offset
        return [start, (x, start[1]), (x, end[1]), end]
    if wire.kind == "straight" or abs(start[1] - end[1]) < 1:
        return [start, end]
    x = start[0] + (end[0] - start[0]) * wire.lane
    return [start, (x, start[1]), (x, end[1]), end]


def _handle(boards: Mapping[str, Board], side: Mapping[str, str]) -> tuple[float, float]:
    board = boards[side["board"]]
    index = board.index_of(side["rowKey"])
    x = board.x + (BOARD_WIDTH if side["side"] == "r" else 0)
    return x, board.row_y(index if index is not None else 0)


def layout(document: Mapping[str, Any],
           positions: Optional[Mapping[str, Mapping[str, float]]] = None) -> tuple[dict[str, Board], list[Wire]]:
    """Blocks and wire polylines for a (redacted) system document, as the Diagram tab lays them out."""

    boards, links = layout_inputs(document)
    placed = layout_system(boards, links, positions)
    wires = route_wires(placed, links)
    for wire in wires:
        wire.points = wire_points(wire, _handle(placed, wire.source), _handle(placed, wire.target))
    return placed, wires


def crossings(wires: list[Wire]) -> int:
    """Proper crossings between orthogonal polylines (used by tests)."""

    def segments(points):
        return list(zip(points, points[1:]))

    def cross(s, t):
        (a, b), (c, d) = s, t
        sh, th = a[1] == b[1], c[1] == d[1]
        if sh == th:
            return False
        h, v = (s, t) if sh else (t, s)
        hx = sorted((h[0][0], h[1][0]))
        vy = sorted((v[0][1], v[1][1]))
        return hx[0] < v[0][0] < hx[1] and vy[0] < h[0][1] < vy[1]

    count = 0
    for i, first in enumerate(wires):
        for second in wires[i + 1:]:
            count += sum(cross(s, t) for s in segments(first.points) for t in segments(second.points))
    return count

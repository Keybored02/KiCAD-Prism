/**
 * Deterministic default layout for a system's boards and links. The ICD's
 * `backend/app/services/systems/layout.py` is a line-for-line port (SB2-71);
 * `backend/tests/fixtures/system_builder/layout_parity.json` is checked by both
 * suites, so change the two together.
 *
 * - The most-connected board sits in column 0; its neighbours alternate left
 *   and right, and boards further out continue away from the centre.
 * - A board lists its linked ports as rows, ordered by where their partner
 *   port sits, so the wires of a bundle never cross.
 * - Boards are shifted vertically so linked rows face their partners.
 * - Wires are orthogonal (horizontal, vertical, horizontal). Each wire in the
 *   channel between two columns gets its own vertical lane, ordered so wires
 *   running the same way do not cross.
 */

export const BOARD_WIDTH = 240;
export const HEADER_HEIGHT = 48;
export const ROW_HEIGHT = 26;
export const FOOTER_HEIGHT = 28;
const COLUMN_GAP = 220;
const BOARD_GAP = 48;
const COMPONENT_GAP = 96;

export interface LayoutPortInput {
  portKey: string;
  reference: string;
}

export interface LayoutBoardInput {
  id: string;
  label: string;
  /** Ports that may be drawn; linked ones become rows, the rest are "more". */
  ports: LayoutPortInput[];
}

export interface LayoutLinkInput {
  id: string;
  name: string;
  a: { board: string; portKey: string | null; reference: string | null };
  b: { board: string; portKey: string | null; reference: string | null };
  rowCount: number;
}

export interface RowPartner {
  linkId: string;
  board: string;
  boardLabel: string;
  reference: string | null;
}

export interface LayoutRow {
  /** `null` for a link end whose port cannot be shown (restricted or gone). */
  portKey: string | null;
  reference: string;
  partners: RowPartner[];
}

export interface LayoutBoard {
  id: string;
  column: number;
  x: number;
  y: number;
  rows: LayoutRow[];
  /** Ports with no link, not drawn as rows. */
  hiddenPorts: LayoutPortInput[];
}

const natural = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

/** Key a row by its port; ends without a port share one row per board. */
export const rowKey = (portKey: string | null) => portKey ?? "__restricted__";

export function boardHeight(rowCount: number, hiddenCount: number): number {
  return HEADER_HEIGHT + Math.max(1, rowCount) * ROW_HEIGHT + (hiddenCount > 0 ? FOOTER_HEIGHT : 8);
}

export function rowCenter(board: Pick<LayoutBoard, "y">, index: number): number {
  return board.y + HEADER_HEIGHT + index * ROW_HEIGHT + ROW_HEIGHT / 2;
}

interface Adjacency {
  degree: Map<string, number>;
  neighbours: Map<string, Map<string, number>>;
}

function adjacency(boards: LayoutBoardInput[], links: LayoutLinkInput[]): Adjacency {
  const degree = new Map(boards.map((board) => [board.id, 0]));
  const neighbours = new Map(boards.map((board) => [board.id, new Map<string, number>()]));
  for (const link of links) {
    const { a, b } = link;
    if (!degree.has(a.board) || !degree.has(b.board)) continue;
    degree.set(a.board, (degree.get(a.board) ?? 0) + 1);
    if (a.board !== b.board) {
      degree.set(b.board, (degree.get(b.board) ?? 0) + 1);
      const an = neighbours.get(a.board)!;
      const bn = neighbours.get(b.board)!;
      an.set(b.board, (an.get(b.board) ?? 0) + 1);
      bn.set(a.board, (bn.get(a.board) ?? 0) + 1);
    }
  }
  return { degree, neighbours };
}

/** Columns per connected component: hub at 0, neighbours alternating -1/+1, then outward. */
function assignColumns(boards: LayoutBoardInput[], graph: Adjacency): { column: Map<string, number>; components: string[][] } {
  const label = new Map(boards.map((board) => [board.id, board.label]));
  const byWeight = (ids: string[], weight: (id: string) => number) =>
    [...ids].sort((p, q) => weight(q) - weight(p) || natural(label.get(p) ?? "", label.get(q) ?? "") || natural(p, q));
  const column = new Map<string, number>();
  const components: string[][] = [];
  const remaining = byWeight(boards.map((board) => board.id), (id) => graph.degree.get(id) ?? 0);
  for (const hub of remaining) {
    if (column.has(hub)) continue;
    const component = [hub];
    column.set(hub, 0);
    const queue = [hub];
    let alternate = 0;
    while (queue.length) {
      const current = queue.shift()!;
      const here = column.get(current)!;
      const next = byWeight(
        [...graph.neighbours.get(current)!.keys()].filter((id) => !column.has(id)),
        (id) => graph.neighbours.get(current)!.get(id) ?? 0,
      );
      for (const id of next) {
        let side: number;
        if (here === 0) {
          side = alternate % 2 === 0 ? -1 : 1;
          alternate += 1;
        } else {
          side = Math.sign(here);
        }
        column.set(id, here + side);
        component.push(id);
        queue.push(id);
      }
    }
    components.push(component);
  }
  return { column, components };
}

function buildRows(board: LayoutBoardInput, links: LayoutLinkInput[], labels: Map<string, string>): LayoutRow[] {
  const rows = new Map<string, LayoutRow>();
  const references = new Map(board.ports.map((port) => [port.portKey, port.reference]));
  for (const link of links) {
    for (const [own, other] of [[link.a, link.b], [link.b, link.a]] as const) {
      if (own.board !== board.id) continue;
      if (link.a.board === link.b.board && own === link.b && link.a.portKey === link.b.portKey) continue;
      const key = rowKey(own.portKey);
      const row = rows.get(key) ?? {
        portKey: own.portKey,
        reference: own.portKey ? (references.get(own.portKey) ?? own.reference ?? "?") : "restricted",
        partners: [],
      };
      row.partners.push({ linkId: link.id, board: other.board, boardLabel: labels.get(other.board) ?? "", reference: other.reference });
      rows.set(key, row);
    }
  }
  return [...rows.values()].sort((p, q) => natural(p.reference, q.reference));
}

/**
 * The default layout. `fixed` positions (a saved canvas layout) are kept as
 * given; row order is still computed so wires stay untangled.
 */
export function layoutSystem(
  boards: LayoutBoardInput[],
  links: LayoutLinkInput[],
  fixed: Record<string, { x: number; y: number }> = {},
): Map<string, LayoutBoard> {
  const labels = new Map(boards.map((board) => [board.id, board.label]));
  const graph = adjacency(boards, links);
  const { column, components } = assignColumns(boards, graph);
  const result = new Map<string, LayoutBoard>();
  for (const board of boards) {
    const rows = buildRows(board, links, labels);
    const linked = new Set(rows.map((row) => row.portKey));
    result.set(board.id, {
      id: board.id,
      column: column.get(board.id) ?? 0,
      x: 0,
      y: 0,
      rows,
      hiddenPorts: board.ports.filter((port) => !linked.has(port.portKey)).sort((p, q) => natural(p.reference, q.reference)),
    });
  }
  const height = (board: LayoutBoard) => boardHeight(board.rows.length, board.hiddenPorts.length);
  // SB2-99: by id, and each board's row index kept until its rows are replaced (sortRows assigns a new array).
  const linkById = new Map(links.map((link) => [link.id, link]));
  const rowIndexes = new WeakMap<LayoutBoard["rows"], Map<string, number>>();
  const rowIndex = (board: LayoutBoard) => {
    let index = rowIndexes.get(board.rows);
    if (!index) {
      index = new Map(board.rows.map((row, position) => [rowKey(row.portKey), position]));
      rowIndexes.set(board.rows, index);
    }
    return index;
  };

  // Partner row position for a (board, linkId): the other end's row centre.
  const partnerY = (self: LayoutBoard, partner: RowPartner): number | null => {
    const other = result.get(partner.board);
    if (!other) return null;
    const link = linkById.get(partner.linkId);
    if (!link) return null;
    const end = link.a.board === self.id && link.b.board === partner.board ? link.b : link.a;
    const index = rowIndex(other).get(rowKey(end.portKey));
    return index === undefined ? null : rowCenter(other, index);
  };

  const sortRows = (board: LayoutBoard) => {
    const keyed = board.rows.map((row, index) => {
      const ys = row.partners.map((partner) => partnerY(board, partner)).filter((y): y is number => y !== null);
      const mean = ys.length ? ys.reduce((sum, y) => sum + y, 0) / ys.length : Number.POSITIVE_INFINITY;
      return { row, mean, index };
    });
    keyed.sort((p, q) => p.mean - q.mean || natural(p.row.reference, q.row.reference) || p.index - q.index);
    board.rows = keyed.map((entry) => entry.row);
  };

  let top = 0;
  for (const component of components) {
    const members = component.map((id) => result.get(id)!);
    const columns = [...new Set(members.map((board) => board.column))].sort((p, q) => p - q);
    const left = columns[0];
    for (const board of members) {
      board.x = (board.column - left) * (BOARD_WIDTH + COLUMN_GAP);
    }
    // Stack each column, hub column first, then align outward columns to their partners.
    const inColumn = (c: number) => members.filter((board) => board.column === c);
    const stack = (list: LayoutBoard[], start: number) => {
      let y = start;
      for (const board of list) {
        board.y = Math.max(board.y, y);
        y = board.y + height(board) + BOARD_GAP;
      }
    };
    stack(inColumn(0), top);
    const order = [...columns].sort((p, q) => Math.abs(p) - Math.abs(q) || p - q).filter((c) => c !== 0);
    for (let pass = 0; pass < 3; pass += 1) {
      for (const board of members) sortRows(board);
      for (const c of order) {
        const list = inColumn(c);
        for (const board of list) {
          const offsets: number[] = [];
          board.rows.forEach((row, index) => {
            for (const partner of row.partners) {
              if (Math.abs(result.get(partner.board)?.column ?? c) >= Math.abs(c)) continue;
              const y = partnerY(board, partner);
              if (y !== null) offsets.push(y - (HEADER_HEIGHT + index * ROW_HEIGHT + ROW_HEIGHT / 2));
            }
          });
          board.y = offsets.length ? offsets.reduce((sum, y) => sum + y, 0) / offsets.length : top;
        }
        list.sort((p, q) => p.y - q.y || natural(labels.get(p.id) ?? "", labels.get(q.id) ?? ""));
        let floor = Number.NEGATIVE_INFINITY;
        for (const board of list) {
          board.y = Math.max(board.y, floor);
          floor = board.y + height(board) + BOARD_GAP;
        }
      }
    }
    const minY = Math.min(...members.map((board) => board.y));
    for (const board of members) board.y += top - minY;
    top = Math.max(...members.map((board) => board.y + height(board))) + COMPONENT_GAP;
  }

  for (const [id, position] of Object.entries(fixed)) {
    const board = result.get(id);
    if (board) {
      board.x = position.x;
      board.y = position.y;
    }
  }
  if (Object.keys(fixed).length) {
    // A node without a saved position (a new board or harness) keeps its default slot unless a
    // saved node already sits there; then it moves down until it is clear of every node placed so far.
    const overlaps = (p: LayoutBoard, q: LayoutBoard) => Math.abs(p.x - q.x) < BOARD_WIDTH + BOARD_GAP
      && p.y < q.y + height(q) + BOARD_GAP && q.y < p.y + height(p) + BOARD_GAP;
    const placed = [...result.values()].filter((board) => board.id in fixed);
    for (const board of [...result.values()].filter((b) => !(b.id in fixed)).sort((p, q) => p.y - q.y || p.x - q.x)) {
      for (let blocker = placed.find((other) => overlaps(board, other)); blocker; blocker = placed.find((other) => overlaps(board, other))) {
        board.y = blocker.y + height(blocker) + BOARD_GAP;
      }
      placed.push(board);
    }
    for (let pass = 0; pass < 2; pass += 1) for (const board of result.values()) sortRows(board);
  }
  return result;
}

export type Side = "l" | "r";

export interface Wire {
  linkId: string;
  source: { board: string; rowKey: string; side: Side };
  target: { board: string; rowKey: string; side: Side };
  /** Lane position between the two sides, 0..1 from source to target; `loop` wires use `loopOffset`. */
  lane: number;
  loopOffset: number;
  kind: "straight" | "lane" | "loop";
}

/** Sides and lanes for every link, given board positions and row order. */
export function routeWires(boards: Map<string, LayoutBoard>, links: LayoutLinkInput[]): Wire[] {
  const rowY = (boardId: string, portKey: string | null) => {
    const board = boards.get(boardId);
    if (!board) return 0;
    const index = board.rows.findIndex((row) => rowKey(row.portKey) === rowKey(portKey));
    return rowCenter(board, Math.max(0, index));
  };
  const wires: Wire[] = [];
  const channels = new Map<string, { wire: Wire; y1: number; y2: number }[]>();
  const loops = new Map<string, Wire[]>();
  for (const link of links) {
    const a = boards.get(link.a.board);
    const b = boards.get(link.b.board);
    if (!a || !b) continue;
    const sameColumn = a.id === b.id || Math.abs(a.x - b.x) < BOARD_WIDTH;
    if (sameColumn) {
      const wire: Wire = {
        linkId: link.id,
        source: { board: a.id, rowKey: rowKey(link.a.portKey), side: "r" },
        target: { board: b.id, rowKey: rowKey(link.b.portKey), side: "r" },
        lane: 0, loopOffset: 0, kind: "loop",
      };
      const key = `${Math.round(Math.max(a.x, b.x))}`;
      loops.set(key, [...(loops.get(key) ?? []), wire]);
      wires.push(wire);
      continue;
    }
    // Orient every wire left to right so lanes are comparable.
    const [left, right] = a.x < b.x ? [link.a, link.b] : [link.b, link.a];
    const leftBoard = boards.get(left.board)!;
    const rightBoard = boards.get(right.board)!;
    const y1 = rowY(left.board, left.portKey);
    const y2 = rowY(right.board, right.portKey);
    const wire: Wire = {
      linkId: link.id,
      source: { board: left.board, rowKey: rowKey(left.portKey), side: "r" },
      target: { board: right.board, rowKey: rowKey(right.portKey), side: "l" },
      lane: 0.5, loopOffset: 0,
      kind: Math.abs(y1 - y2) < 1 ? "straight" : "lane",
    };
    wires.push(wire);
    if (wire.kind === "lane") {
      const key = `${Math.round(leftBoard.x)}:${Math.round(rightBoard.x)}`;
      channels.set(key, [...(channels.get(key) ?? []), { wire, y1, y2 }]);
    }
  }
  for (const entries of channels.values()) {
    // Downward wires: a lower start takes a lane nearer the left; upward wires mirror that.
    const down = entries.filter((entry) => entry.y2 > entry.y1).sort((p, q) => q.y1 - p.y1 || p.y2 - q.y2);
    const up = entries.filter((entry) => entry.y2 < entry.y1).sort((p, q) => p.y1 - q.y1 || q.y2 - p.y2);
    const ordered = [...down, ...up];
    ordered.forEach((entry, index) => (entry.wire.lane = (index + 1) / (ordered.length + 1)));
  }
  for (const group of loops.values()) {
    group.forEach((wire, index) => (wire.loopOffset = 24 + index * 12));
  }
  return wires;
}

/** Orthogonal path points for a wire between two handle positions. */
export function wirePoints(wire: Pick<Wire, "kind" | "lane" | "loopOffset">, from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number }[] {
  if (wire.kind === "loop") {
    const x = Math.max(from.x, to.x) + wire.loopOffset;
    return [from, { x, y: from.y }, { x, y: to.y }, to];
  }
  if (wire.kind === "straight" || Math.abs(from.y - to.y) < 1) {
    return [from, to];
  }
  const x = from.x + (to.x - from.x) * wire.lane;
  return [from, { x, y: from.y }, { x, y: to.y }, to];
}

/** Count proper crossings between orthogonal polylines (used by tests). */
export function crossings(paths: { x: number; y: number }[][]): number {
  type Segment = [{ x: number; y: number }, { x: number; y: number }];
  const segments = paths.map((points) => points.slice(1).map((point, index) => [points[index], point] as Segment));
  const cross = (s: Segment, t: Segment) => {
    const [a, b] = s;
    const [c, d] = t;
    const sh = a.y === b.y;
    const th = c.y === d.y;
    if (sh === th) return false;
    const [h, v] = sh ? [s, t] : [t, s];
    const hx = [Math.min(h[0].x, h[1].x), Math.max(h[0].x, h[1].x)];
    const vy = [Math.min(v[0].y, v[1].y), Math.max(v[0].y, v[1].y)];
    return v[0].x > hx[0] && v[0].x < hx[1] && h[0].y > vy[0] && h[0].y < vy[1];
  };
  let count = 0;
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      for (const s of segments[i]) for (const t of segments[j]) if (cross(s, t)) count += 1;
    }
  }
  return count;
}

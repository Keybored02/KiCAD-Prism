import { describe, expect, it } from "vitest";

import {
  BOARD_WIDTH,
  boardHeight,
  crossings,
  layoutSystem,
  routeWires,
  rowCenter,
  rowKey,
  wirePoints,
  type LayoutBoardInput,
  type LayoutLinkInput,
} from "./system-layout";

const board = (id: string, refs: string[]): LayoutBoardInput => ({
  id,
  label: id,
  ports: refs.map((reference) => ({ portKey: `${id}:${reference}`, reference })),
});

const link = (id: string, a: [string, string], b: [string, string]): LayoutLinkInput => ({
  id,
  name: id,
  a: { board: a[0], portKey: `${a[0]}:${a[1]}`, reference: a[1] },
  b: { board: b[0], portKey: `${b[0]}:${b[1]}`, reference: b[1] },
  rowCount: 10,
});

/** The JTYU acceptance system: two OBCs mating a backplane on three connectors each. */
const JTYU_BOARDS = [
  board("OBC-1", ["J1", "J14", "J15", "J16", "J17"]),
  board("OBC-2", ["J1", "J14", "J15", "J16", "J17"]),
  board("CMBD", ["J1", "J10", "J11", "J12", "J13", "J14", "J15", "J20"]),
];
const JTYU_LINKS = [
  link("l1", ["OBC-1", "J14"], ["CMBD", "J12"]),
  link("l2", ["OBC-1", "J15"], ["CMBD", "J10"]),
  link("l3", ["OBC-1", "J16"], ["CMBD", "J11"]),
  link("l4", ["OBC-2", "J14"], ["CMBD", "J13"]),
  link("l5", ["OBC-2", "J15"], ["CMBD", "J14"]),
  link("l6", ["OBC-2", "J16"], ["CMBD", "J15"]),
];

function paths(layout: ReturnType<typeof layoutSystem>, links: LayoutLinkInput[]) {
  return routeWires(layout, links).map((wire) => {
    const at = (end: typeof wire.source) => {
      const b = layout.get(end.board)!;
      const index = b.rows.findIndex((row) => rowKey(row.portKey) === end.rowKey);
      return { x: end.side === "r" ? b.x + BOARD_WIDTH : b.x, y: rowCenter(b, index) };
    };
    return wirePoints(wire, at(wire.source), at(wire.target));
  });
}

describe("layoutSystem", () => {
  it("puts the hub in the middle and its neighbours on opposite sides", () => {
    const layout = layoutSystem(JTYU_BOARDS, JTYU_LINKS);
    const cmbd = layout.get("CMBD")!;
    const [one, two] = [layout.get("OBC-1")!, layout.get("OBC-2")!];
    expect(cmbd.column).toBe(0);
    expect([one.column, two.column].sort()).toEqual([-1, 1]);
    expect(Math.min(one.x, two.x)).toBeLessThan(cmbd.x);
    expect(Math.max(one.x, two.x)).toBeGreaterThan(cmbd.x);
  });

  it("draws only linked ports as rows and keeps the rest as hidden ports", () => {
    const layout = layoutSystem(JTYU_BOARDS, JTYU_LINKS);
    expect(layout.get("OBC-1")!.rows.map((row) => row.reference).sort()).toEqual(["J14", "J15", "J16"]);
    expect(layout.get("OBC-1")!.hiddenPorts.map((port) => port.reference)).toEqual(["J1", "J17"]);
    expect(layout.get("CMBD")!.rows).toHaveLength(6);
    expect(layout.get("CMBD")!.rows.find((row) => row.reference === "J12")!.partners).toEqual([
      { linkId: "l1", board: "OBC-1", boardLabel: "OBC-1", reference: "J14" },
    ]);
  });

  it("aligns partner rows so the JTYU bundles are straight and never cross", () => {
    const layout = layoutSystem(JTYU_BOARDS, JTYU_LINKS);
    const wires = routeWires(layout, JTYU_LINKS);
    expect(wires.every((wire) => wire.kind === "straight")).toBe(true);
    expect(crossings(paths(layout, JTYU_LINKS))).toBe(0);
  });

  it("untangles a bundle whose connectors are numbered in a different order", () => {
    const boards = [board("A", ["J1", "J2", "J3", "J4"]), board("B", ["J1", "J2", "J3", "J4"])];
    const links = [
      link("x", ["A", "J1"], ["B", "J4"]),
      link("y", ["A", "J2"], ["B", "J3"]),
      link("z", ["A", "J3"], ["B", "J1"]),
      link("w", ["A", "J4"], ["B", "J2"]),
    ];
    expect(crossings(paths(layoutSystem(boards, links), links))).toBe(0);
  });

  it("keeps lanes crossing-free when saved positions make wires run diagonally", () => {
    const boards = [board("A", ["J1", "J2", "J3"]), board("B", ["J1", "J2", "J3"])];
    const links = [link("x", ["A", "J1"], ["B", "J1"]), link("y", ["A", "J2"], ["B", "J2"]), link("z", ["A", "J3"], ["B", "J3"])];
    const layout = layoutSystem(boards, links, { A: { x: 0, y: 0 }, B: { x: 600, y: 200 } });
    const wires = routeWires(layout, links);
    expect(wires.every((wire) => wire.kind === "lane")).toBe(true);
    expect(new Set(wires.map((wire) => wire.lane)).size).toBe(3);
    expect(crossings(paths(layout, links))).toBe(0);
  });

  it("moves a node without a saved position off a saved node sitting in its slot", () => {
    const boards = [board("A", ["J1", "J2"]), board("B", ["J1"]), board("H", ["E1", "E2"])];
    const links = [link("x", ["A", "J1"], ["B", "J1"]), link("e1", ["A", "J2"], ["H", "E1"]), link("e2", ["B", "J1"], ["H", "E2"])];
    const free = layoutSystem(boards, links);
    const h = free.get("H")!;
    // Save A exactly where H would go by default.
    const layout = layoutSystem(boards, links, { A: { x: h.x, y: h.y }, B: { x: h.x + 2 * BOARD_WIDTH, y: 0 } });
    const [a, moved] = [layout.get("A")!, layout.get("H")!];
    expect(moved.x).toBe(h.x);
    expect(moved.y).toBeGreaterThanOrEqual(a.y + boardHeight(a.rows.length, a.hiddenPorts.length));
  });

  it("puts unlinked boards side by side below the linked ones, four to a row (SB2-125)", () => {
    const boards = [board("A", ["J1"]), board("B", ["J1"]), ...["C", "D", "E", "F", "G"].map((id) => board(id, ["J1"]))];
    const layout = layoutSystem(boards, [link("x", ["A", "J1"], ["B", "J1"])]);
    const [c, d, e, f, g] = ["C", "D", "E", "F", "G"].map((id) => layout.get(id)!);
    const linkedBottom = Math.max(...["A", "B"].map((id) => layout.get(id)!.y + boardHeight(1, 0)));
    expect(c.rows).toEqual([]);
    expect([c, d, e, f].map((item) => item.y)).toEqual([c.y, c.y, c.y, c.y]);
    expect(new Set([c, d, e, f].map((item) => item.x)).size).toBe(4);
    expect(c.y).toBeGreaterThanOrEqual(linkedBottom);
    expect([g.x, g.y > c.y]).toEqual([c.x, true]);
  });

  it("loops a link between two ports of one board on its right side", () => {
    const boards = [board("A", ["J1", "J2"])];
    const links = [link("x", ["A", "J1"], ["A", "J2"])];
    const [wire] = routeWires(layoutSystem(boards, links), links);
    expect(wire.kind).toBe("loop");
    expect([wire.source.side, wire.target.side]).toEqual(["r", "r"]);
  });

  it("gives a restricted end one shared row", () => {
    const boards = [board("A", ["J1", "J2"]), board("R", [])];
    const links: LayoutLinkInput[] = [
      { id: "x", name: "", a: { board: "A", portKey: "A:J1", reference: "J1" }, b: { board: "R", portKey: null, reference: null }, rowCount: 1 },
      { id: "y", name: "", a: { board: "A", portKey: "A:J2", reference: "J2" }, b: { board: "R", portKey: null, reference: null }, rowCount: 1 },
    ];
    const layout = layoutSystem(boards, links);
    expect(layout.get("R")!.rows.map((row) => [row.reference, row.partners.length])).toEqual([["restricted", 2]]);
  });
});

import { describe, expect, it } from "vitest";

import { applyOverrides } from "./diagram-tab";
import {
  ADD_END_HANDLE,
  FALLBACK_HANDLE,
  buildDiagram,
  connectionIntent,
  connectionToLink,
  handleId,
  layoutInputs,
  nextLinkMode,
  nodeHeight,
  portKeyOf,
  subsystemContents,
  pushBelow,
} from "./diagram-model";
import { exportOf, harness, harnessEnd, instance, link, port, systemDocument } from "./test-fixtures";
import type { SystemOccurrence } from "@/types/system";

const obc = instance("OBC", { ports: [port("J7"), port("J10"), port("J2", { exposed: false, override: "hidden" })] });
const pay = instance("PAY", { ports: [port("J4"), port("J9")] });
const secret = instance("SECRET", { restricted: true, ports: null, projectId: null });

describe("layoutInputs", () => {
  it("offers exposed ports, plus a linked port that is no longer exposed", () => {
    const doc = systemDocument([obc, pay], [link("L1", obc.id, "J2", pay.id, "J4")]);
    const { boards } = layoutInputs(doc);
    expect(boards[0].ports.map((p) => p.reference)).toEqual(["J7", "J10", "J2"]);
  });

  it("gives a restricted board no ports and its link end no port key", () => {
    const doc = systemDocument([obc, secret], [link("L1", obc.id, "J7", secret.id, "J1")]);
    const { boards, links } = layoutInputs(doc);
    expect(boards[1].ports).toEqual([]);
    expect(links[0].b).toEqual({ board: secret.id, portKey: null, reference: null });
  });
});

describe("buildDiagram", () => {
  it("marks board-to-board wires", () => {
    const doc = systemDocument([obc, pay], [{ ...link("L1", obc.id, "J7", pay.id, "J4", 3), type: "b2b" as const },
      link("L2", obc.id, "J8", pay.id, "J5", 1)]);
    const flags = Object.fromEntries(buildDiagram(doc, {}).edges.map((edge) => [edge.id, edge.data.b2b]));
    expect(flags).toEqual({ L1: true, L2: false });
  });

  it("always shows an exported port as a row named after its export", () => {
    const doc = systemDocument([obc, pay], [link("L1", obc.id, "J7", pay.id, "J4", 3)], [exportOf("DEBUG", obc.id, "J10")]);
    const [a] = buildDiagram(doc, {}).nodes;
    expect(a.data.rows.map((row) => [row.reference, row.exportName ?? null])).toEqual([["J7", null], ["J10", "DEBUG"]]);
    expect(a.data.hiddenCount).toBe(0);
    expect(a.height).toBe(nodeHeight(2, 0)); // two rows, no "show unlinked" footer
  });

  it("draws linked ports as rows with their partner, and counts the rest", () => {
    const doc = systemDocument([obc, pay], [link("L1", obc.id, "J7", pay.id, "J4", 3)]);
    const { nodes } = buildDiagram(doc, {});
    const [a, b] = nodes;
    expect(a.data.rows).toEqual([{ portKey: "key-J7", reference: "J7", partners: ["PAY J4"], linked: true, orphan: false }]);
    expect(a.data.hiddenCount).toBe(1);
    expect(b.data.rows.map((row) => row.reference)).toEqual(["J4"]);
    expect(a.position.x).not.toBe(b.position.x);
  });

  it("lists unlinked ports when a board is expanded", () => {
    const doc = systemDocument([obc, pay], [link("L1", obc.id, "J7", pay.id, "J4")]);
    const { nodes } = buildDiagram(doc, {}, new Set([obc.id]));
    expect(nodes[0].data.rows.map((row) => [row.reference, row.linked])).toEqual([["J7", true], ["J10", false]]);
    expect(nodes[0].height).toBeGreaterThan(buildDiagram(doc, {}).nodes[0].height);
  });

  it("marks an orphan row and keeps saved positions", () => {
    const doc = systemDocument([obc, pay], [link("L1", obc.id, "J2", pay.id, "J4")]);
    const { nodes } = buildDiagram(doc, { [pay.id]: { x: 5, y: 6 } });
    expect(nodes[0].data.rows[0].orphan).toBe(true);
    expect(nodes[1].position).toEqual({ x: 5, y: 6 });
  });

  it("wires the facing sides, oriented left to right, with a fallback handle for restricted ends", () => {
    const doc = systemDocument([obc, pay, secret], [
      link("L1", obc.id, "J7", pay.id, "J4", 3),
      link("L2", obc.id, "J10", secret.id, "J1"),
    ]);
    const positions = { [obc.id]: { x: 400, y: 0 }, [pay.id]: { x: 0, y: 0 }, [secret.id]: { x: 800, y: 0 } };
    const { edges } = buildDiagram(doc, positions);
    const [l1, l2] = edges;
    expect([l1.source, l1.sourceHandle, l1.target, l1.targetHandle]).toEqual([pay.id, "r:key-J4", obc.id, "l:key-J7"]);
    expect(l1.data.label).toBe("L1 · 3 pins");
    expect([l2.sourceHandle, l2.targetHandle]).toEqual(["r:key-J10", handleId("l", null)]);
    expect(handleId("l", null)).toBe(`l:${FALLBACK_HANDLE}`);
  });
});

describe("connectionToLink", () => {
  it("strips the side from both handles", () => {
    expect(connectionToLink({ source: "a", sourceHandle: "r:key:with:colons", target: "b", targetHandle: "l:k2" }))
      .toEqual({ a: { instanceId: "a", portKey: "key:with:colons" }, b: { instanceId: "b", portKey: "k2" } });
  });

  it("refuses the same port, missing handles and fallback handles", () => {
    expect(connectionToLink({ source: "a", sourceHandle: "l:k", target: "a", targetHandle: "r:k" })).toHaveProperty("error");
    expect(connectionToLink({ source: "a", sourceHandle: null, target: "b", targetHandle: "l:k" })).toHaveProperty("error");
    expect(connectionToLink({ source: "a", sourceHandle: handleId("r", FALLBACK_HANDLE), target: "b", targetHandle: "l:k" }))
      .toHaveProperty("error");
    expect(portKeyOf("garbage")).toBeNull();
  });
});

describe("applyOverrides", () => {
  it("keeps drags, measurements and selection, ignoring other changes", () => {
    const next = applyOverrides({}, [
      { id: "n1", type: "position", position: { x: 1, y: 2 }, dragging: true },
      { id: "n1", type: "dimensions", dimensions: { width: 10, height: 20 } },
      { id: "n2", type: "select", selected: true },
      { id: "n3", type: "remove" },
    ]);
    expect(next).toEqual({
      n1: { position: { x: 1, y: 2 }, dragging: true, measured: { width: 10, height: 20 } },
      n2: { selected: true },
    });
  });
});

describe("subsystemContents", () => {
  const occurrence = (path: string, kind: "board" | "assembly", restricted = false) => {
    const labels = path.split("/").filter(Boolean);
    return { path, displayPath: labels.join(" ▸ "), labels, instanceId: labels[labels.length - 1], kind, depth: labels.length + 1,
      systemId: "s", projectId: null, baselineCommit: null, componentId: null, restricted } as unknown as SystemOccurrence;
  };

  it("lists what sits under one subsystem, nested levels included, and nothing from its siblings", () => {
    const occurrences = [occurrence("/A", "assembly"), occurrence("/A/OBC", "board"), occurrence("/A/SUB", "assembly"),
      occurrence("/A/SUB/PAY", "board", true), occurrence("/AB", "assembly"), occurrence("/AB/X", "board"), occurrence("/PDU", "board")];
    expect(subsystemContents(occurrences, "A")).toEqual([
      { path: "/A/OBC", label: "OBC", kind: "board", depth: 3, restricted: false },
      { path: "/A/SUB", label: "SUB", kind: "assembly", depth: 3, restricted: false },
      { path: "/A/SUB/PAY", label: "PAY", kind: "board", depth: 4, restricted: true },
    ]);
    expect(subsystemContents(occurrences, "PDU")).toEqual([]);
  });
});

describe("nextLinkMode", () => {
  it("B toggles board-to-board, Esc clears, typing never changes it", () => {
    expect(nextLinkMode("b", null, false)).toBe("b2b");
    expect(nextLinkMode("B", "b2b", false)).toBeNull();
    expect(nextLinkMode("Escape", "b2b", false)).toBeNull();
    expect(nextLinkMode("x", "b2b", false)).toBe("b2b");
    expect(nextLinkMode("b", null, true)).toBeNull();
  });
});

describe("harnesses on the diagram (CONTRACTS_P2 §17)", () => {
  const a = instance("OBC");
  const b = instance("PAY");
  const wh = harness("shn_1", [harnessEnd("she_a", 0, { instanceId: a.id, reference: "J1" }),
    harnessEnd("she_b", 1, { instanceId: b.id, reference: "J2" }), harnessEnd("she_c", 2, null)],
  [["she_a", "1", "she_b", "1"], ["she_a", "2", "she_b", "2"]]);
  const doc = { ...systemDocument([a, b]), harnesses: [wh] };

  it("places a harness like a board, one row per end, with wires to the mated ports", () => {
    const diagram = buildDiagram(doc, {});
    const [node] = diagram.harnesses;
    expect(node.data.rows.map((row) => [row.label, row.partner, row.block, row.wires])).toEqual([
      ["End 1", "OBC J1", "Generic · 4 pins", 2], ["End 2", "PAY J2", "Generic · 4 pins", 2], ["End 3", null, "Generic · 4 pins", 0]]);
    expect(diagram.edges.map((edge) => [edge.id, edge.data.harnessId])).toEqual([["she_a", "shn_1"], ["she_b", "shn_1"]]);
    const obc = diagram.nodes.find((n) => n.id === a.id)!;
    expect(obc.data.rows.map((row) => [row.reference, row.partners])).toEqual([["J1", ["shn_1 End 1"]]]);
  });

  it("reads what a drawn connection means", () => {
    const port = (id: string, key: string) => ({ source: id, sourceHandle: `r:${key}` });
    const to = (id: string, key: string) => ({ target: id, targetHandle: `l:${key}` });
    expect(connectionIntent({ ...port(a.id, "key-J2"), ...to(b.id, "key-J1") }, doc, "harness"))
      .toEqual({ kind: "harness", a: { instanceId: a.id, portKey: "key-J2" }, b: { instanceId: b.id, portKey: "key-J1" } });
    expect(connectionIntent({ ...port(a.id, "key-J2"), ...to(b.id, "key-J1") }, doc, null).kind).toBe("link");
    expect(connectionIntent({ ...port("shn_1", ADD_END_HANDLE), ...to(b.id, "key-J1") }, doc, null))
      .toEqual({ kind: "add_end", harnessId: "shn_1", port: { instanceId: b.id, portKey: "key-J1" } });
    expect(connectionIntent({ ...port(a.id, "key-J2"), ...to("shn_1", "she_c") }, doc, null))
      .toEqual({ kind: "mate_end", harnessId: "shn_1", endId: "she_c", port: { instanceId: a.id, portKey: "key-J2" } });
    expect(connectionIntent({ ...port(a.id, "key-J2"), ...to("shn_1", "she_a") }, doc, null))
      .toEqual({ kind: "error", error: "End 1 already mates a connector." });
  });

  it("H arms a harness the same way B arms board-to-board", () => {
    expect(nextLinkMode("h", null, false)).toBe("harness");
    expect(nextLinkMode("b", "harness", false)).toBe("b2b");
    expect(nextLinkMode("H", "harness", false)).toBeNull();
  });
});

describe("pushBelow (SB2-125)", () => {
  it("moves the blocks under an expanded board in its column down by what it grew", () => {
    const at = (id: string, x: number, y: number) => ({ id, position: { x, y } });
    const open = at("A", 0, 0);
    const below = at("B", 10, 200);
    const beside = at("C", 460, 200);
    const above = at("D", 0, -200);
    pushBelow([open, below, beside, above], new Map([["A", 300]]));
    expect([below.position.y, beside.position.y, above.position.y]).toEqual([500, 200, -200]);
  });
});

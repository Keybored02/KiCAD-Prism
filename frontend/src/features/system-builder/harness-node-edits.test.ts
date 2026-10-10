import { describe, expect, it } from "vitest";

import type { HarnessNode } from "@/types/system";

import { addBreakout, addWaypoint, alongSamples, moveNode, nodeInputs, removeNode, setPinned, storeAuto } from "./harness-node-edits";

const node = (id: string, kind: HarnessNode["kind"], order: number, extra: Partial<HarnessNode> = {}): HarnessNode => ({
  id, kind, order, positionMm: [0, 0, 0], pinned: false, ends: [], between: null, ...extra,
});
// `along` for a segment running along +x from its first node.
const alongX = (p: readonly number[]) => p[0];

describe("harness node edits", () => {
  it("lists breakouts in chain order, then each pair's waypoints in order", () => {
    const listed = nodeInputs([
      node("w2", "waypoint", 1, { between: ["e1", "b"] }),
      node("b2", "breakout", 1),
      node("w1", "waypoint", 0, { between: ["e1", "b"] }),
      node("b", "breakout", 0),
    ]);
    expect(listed.map((n) => n.id)).toEqual(["b", "b2", "w1", "w2"]);
    expect(listed[0]).not.toHaveProperty("order");
  });

  it("adds a waypoint between the existing ones, in either direction of the segment", () => {
    const start = nodeInputs([
      node("w1", "waypoint", 0, { between: ["e1", "e2"], positionMm: [10, 0, 0] }),
      node("w2", "waypoint", 1, { between: ["e1", "e2"], positionMm: [30, 0, 0] }),
    ]);
    const forward = addWaypoint(start, "e1", "e2", [20, 0, 0], alongX);
    expect(forward.nodes.map((n) => n.id)).toEqual(["w1", forward.id, "w2"]);
    expect(forward.id).toMatch(/^shd_[0-9a-f]{32}$/);
    // Picked on the segment drawn from e2: `along` grows from e2, and the stored pair order is kept.
    const fromE2 = (p: readonly number[]) => 40 - p[0];
    const backward = addWaypoint(start, "e2", "e1", [35, 0, 0], fromE2);
    expect(backward.nodes.map((n) => n.id)).toEqual(["w1", "w2", backward.id]);
    expect(backward.nodes.at(-1)!.between).toEqual(["e1", "e2"]);
  });

  it("stores the automatic breakout so its legs can take waypoints", () => {
    const stored = storeAuto([], [1, 2, 3]);
    expect(stored.nodes).toEqual([{ id: stored.id, kind: "breakout", positionMm: [1, 2, 3], pinned: false, ends: [], between: null }]);
    const withWaypoint = addWaypoint(stored.nodes, "e1", stored.id, [5, 0, 0], alongX);
    expect(withWaypoint.nodes[1].between).toEqual(["e1", stored.id]);
  });

  it("adds breakouts at the end of the chain, before the waypoints", () => {
    const start = nodeInputs([node("b", "breakout", 0), node("w", "waypoint", 0, { between: ["e1", "b"] })]);
    const added = addBreakout(start, [0, 0, 9]);
    expect(added.nodes.map((n) => n.id)).toEqual(["b", added.id, "w"]);
  });

  it("moves, pins and removes; a removed breakout takes its waypoints", () => {
    const start = nodeInputs([
      node("b", "breakout", 0),
      node("w", "waypoint", 0, { between: ["e1", "b"] }),
      node("v", "waypoint", 0, { between: ["e1", "e2"] }),
    ]);
    expect(moveNode(start, "w", [4, 5, 6]).find((n) => n.id === "w")!.positionMm).toEqual([4, 5, 6]);
    expect(setPinned(start, "w", true).find((n) => n.id === "w")!.pinned).toBe(true);
    expect(setPinned(start, "b", true).find((n) => n.id === "b")!.pinned).toBe(false);
    expect(removeNode(start, "b").map((n) => n.id)).toEqual(["v"]);
    expect(removeNode(start, "v").map((n) => n.id)).toEqual(["b", "w"]);
  });

  it("measures along a segment's samples to the nearest one", () => {
    const along = alongSamples([[0, 0, 0], [3, 4, 0], [3, 10, 0]]);
    expect(along([0.1, 0, 0])).toBe(0);
    expect(along([3, 4.2, 0])).toBe(5);
    expect(along([3, 20, 0])).toBe(11);
  });
});

import assert from "node:assert/strict";
import { test } from "node:test";

import { AUTO, levelMatrix, nodeHandles, toLevel, toWorld, withNodePreview } from "./harness-edit.js";

// A quarter turn about z, then 10 mm up z and 5 mm along x.
const turned = [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 5, 0, 10, 1];
const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

test("level points round-trip through world", () => {
  const world = toWorld(turned, [1, 2, 3]);
  assert.ok(close(world, [3, 1, 13]));
  assert.ok(close(toLevel(turned, world), [1, 2, 3]));
  assert.deepEqual(levelMatrix({ level: null }, () => turned), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  assert.equal(levelMatrix({ level: "/sub" }, () => turned), turned);
});

test("a preview moves one node of one harness, or stands in for the automatic breakout", () => {
  const harnesses = [
    { id: "h1", level: null, nodes: [{ id: "w", kind: "waypoint", positionMm: [0, 0, 0], between: ["a", "b"] }] },
    { id: "h2", level: null, nodes: [] },
  ];
  const key = (h) => `/${h.id}`;
  const moved = withNodePreview(harnesses, { harness: "/h1", id: "w", positionMm: [1, 2, 3] }, key);
  assert.deepEqual(moved[0].nodes[0].positionMm, [1, 2, 3]);
  assert.equal(moved[1], harnesses[1]);
  const auto = withNodePreview(harnesses, { harness: "/h2", id: AUTO, positionMm: [4, 5, 6] }, key);
  assert.deepEqual(auto[1].nodes.map((n) => [n.id, n.kind, n.positionMm]), [[AUTO, "breakout", [4, 5, 6]]]);
  assert.equal(withNodePreview(harnesses, null, key), harnesses);
});

test("handles: stored nodes in world, plus the automatic breakout where the legs meet", () => {
  const harness = { level: "/sub", nodes: [{ id: "w", kind: "waypoint", pinned: true, positionMm: [1, 2, 3] }] };
  const tubes = [{ from: "e1", to: AUTO, samplesMm: [0, 0, 0, 7, 8, 9] }, { from: "e2", to: AUTO, samplesMm: [1, 1, 1, 7, 8, 9] }];
  const handles = nodeHandles(harness, tubes, turned);
  assert.equal(handles.length, 2);
  assert.ok(close(handles[0].worldMm, [3, 1, 13]));
  assert.equal(handles[0].pinned, true);
  assert.deepEqual(handles[1], { id: AUTO, kind: "breakout", pinned: false, auto: true, worldMm: [7, 8, 9] });
});


test("a bend dragged between two waypoints slots in between them, pinned (D-P2-53)", async () => {
  const { bendNode, BEND } = await import("./harness-edit.js");
  const nodes = [
    { id: "w1", kind: "waypoint", positionMm: [2, 0, 0], order: 0, between: ["a", "b"] },
    { id: "w2", kind: "waypoint", positionMm: [8, 0, 0], order: 1, between: ["a", "b"] },
  ];
  const segment = { from: "a", to: "b", samplesMm: [[0, 0, 0], [2, 0, 0], [4, 0, 0], [6, 0, 0], [8, 0, 0], [10, 0, 0]] };
  const node = bendNode(nodes, { kind: "waypoint", segment, atMm: [5, 0, 0], positionMm: [5, 0, 9], toWorldMm: (p) => p });
  assert.deepEqual(node, { id: BEND, kind: "waypoint", positionMm: [5, 0, 9], pinned: true, order: 0.5, ends: [], between: ["a", "b"] });
});

test("a bend on a segment stored the other way round orders from that end", async () => {
  const { bendNode } = await import("./harness-edit.js");
  const nodes = [{ id: "w1", kind: "waypoint", positionMm: [8, 0, 0], order: 0, between: ["b", "a"] }];
  const segment = { from: "a", to: "b", samplesMm: [[0, 0, 0], [4, 0, 0], [8, 0, 0], [10, 0, 0]] };
  // Nearer a than w1: walking b → a it comes after w1.
  assert.equal(bendNode(nodes, { kind: "waypoint", segment, atMm: [1, 0, 0], positionMm: [1, 0, 0], toWorldMm: (p) => p }).order, 1);
});

test("a dragged waypoint previews pinned; a bend previews as an extra node", async () => {
  const { withNodePreview } = await import("./harness-edit.js");
  const harnesses = [{ key: "h", nodes: [{ id: "w1", kind: "waypoint", positionMm: [0, 0, 0], pinned: false }] }];
  const moved = withNodePreview(harnesses, { harness: "h", id: "w1", positionMm: [1, 2, 3] }, (h) => h.key);
  assert.deepEqual(moved[0].nodes[0], { id: "w1", kind: "waypoint", positionMm: [1, 2, 3], pinned: true });
  const bent = withNodePreview(harnesses, { harness: "h", insert: { id: "b" } }, (h) => h.key);
  assert.equal(bent[0].nodes.length, 2);
});

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

import assert from "node:assert/strict";
import test from "node:test";

import { Renderer } from "./renderer.js";

const buffer = (size) => ({ size });

test("the GPU memory breakdown adds up to gpuMemoryBytes", () => {
  const renderer = Object.create(Renderer.prototype);
  Object.assign(renderer, {
    canvas: { width: 10, height: 10 },
    entries: [
      { kind: "copper", layerId: 0, vertexBuffer: buffer(400), indexBuffer: buffer(120) },
      { kind: "copper", layerId: 0, vertexBuffer: buffer(40), indexBuffer: buffer(12) },
      { kind: "board", boardRole: "soldermask", vertexBuffer: buffer(80), indexBuffer: buffer(24) },
      { kind: "component", vertexBuffer: buffer(800), indexBuffer: buffer(240) },
    ],
    barrels: { vertexBuffer: buffer(64), indexBuffer: buffer(16), instanceBuffer: buffer(32) },
    occurrenceBuffer: buffer(256),
    argsBuffer: buffer(20),
  });
  const breakdown = renderer.gpuMemoryBreakdown();
  assert.deepEqual(breakdown.geometry, { "copper:0": 572, "board:soldermask": 104, component: 1040 });
  assert.equal(breakdown.vertex, 1320);
  assert.equal(breakdown.index, 396);
  assert.equal(breakdown.barrels, 112);
  assert.equal(breakdown.occurrences, 276);
  assert.equal(breakdown.vertex + breakdown.index + breakdown.barrels + breakdown.occurrences + breakdown.targets,
    renderer.gpuMemoryBytes());
});

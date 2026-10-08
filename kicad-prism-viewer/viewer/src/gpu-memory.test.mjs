import assert from "node:assert/strict";
import test from "node:test";

import { Renderer } from "./renderer.js";

const buffer = (size) => ({ size });

test("the GPU memory breakdown adds up to gpuMemoryBytes", () => {
  const renderer = Object.create(Renderer.prototype);
  Object.assign(renderer, {
    canvas: { width: 10, height: 10 },
    entries: [
      { kind: "copper", layerId: 0, vertexAllocation: buffer(400), indexAllocation: buffer(120) },
      { kind: "copper", layerId: 0, vertexAllocation: buffer(40), indexAllocation: buffer(12) },
      { kind: "board", boardRole: "soldermask", vertexAllocation: buffer(80), indexAllocation: buffer(24) },
      { kind: "component", vertexAllocation: buffer(800), indexAllocation: buffer(240) },
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

test("indices are 16-bit when every vertex fits, padded to four bytes", async () => {
  const { packIndices, primitiveGpuBytes } = await import("./renderer.js");
  const small = packIndices(new Uint32Array([0, 1, 2]), 3);
  assert.equal(small.format, "uint16");
  assert.deepEqual([...small.indices], [0, 1, 2, 0]);
  assert.equal(small.indices.byteLength % 4, 0);
  const edge = packIndices([0, 65535, 1, 2], 65536);
  assert.equal(edge.format, "uint16");
  assert.equal(edge.indices[1], 65535);
  const large = packIndices([0, 65536, 1], 65537);
  assert.equal(large.format, "uint32");
  assert.equal(large.indices[1], 65536);
  assert.equal(primitiveGpuBytes(3, 3), 3 * 24 + 8);
  assert.equal(primitiveGpuBytes(65537, 3), 65537 * 24 + 12);
});

test("normals pack to snorm8 within one step of the unit vector", async () => {
  const { packNormal } = await import("./renderer.js");
  const out = new Int8Array(8);
  packNormal(out, 4, [0, 0, 0, 0.6, -0.8, 0], 3);
  assert.deepEqual([...out.slice(4)], [76, -102, 0, 0]);
  packNormal(out, 0, [1, -1, 0], 0);
  assert.deepEqual([...out.slice(0, 4)], [127, -127, 0, 0]);
  packNormal(out, 0, [2, -2, Number.NaN], 0);
  assert.deepEqual([...out.slice(0, 4)], [127, -127, 0, 0]);
});

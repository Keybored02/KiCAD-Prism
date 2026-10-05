import assert from "node:assert/strict";
import test from "node:test";

import { INSTANCED_SHADERS } from "./renderer.js";
import { transformBounds, transformPoint } from "./occurrences.js";
import { assetOccurrenceMatrix, drawnOccurrences, standInKind, standInMatrix } from "./system-scene.js";

const translate = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
// bundleToBoard (CONTRACTS_P2 §20.2): metres → mm, lowered by the mid-plane height (0.8 mm here).
const BUNDLE_TO_BOARD = [1000, 0, 0, 0, 0, 1000, 0, 0, 0, 0, 1000, 0, 0, 0, -0.8, 1];

test("an asset occurrence maps bundle metres through the board frame to world metres", () => {
  const model = assetOccurrenceMatrix(translate(100, 50, 0), BUNDLE_TO_BOARD);
  // A point 10 mm right, 0.8 mm up in the bundle (on the mid-plane) lands 10 mm right of the pose, at z 0.
  const point = transformPoint(model, [0.01, 0, 0.0008]);
  [0.11, 0.05, 0].forEach((value, index) => assert.ok(Math.abs(point[index] - value) < 1e-12, `${point}`));
});

test("a stand-in is the unit box mapped onto the occurrence box, then placed", () => {
  const matrix = standInMatrix(translate(-41.8, 246.4, 0), { minMm: [41.8, -246.4, -0.99], maxMm: [341.8, -46.4, 0.99] });
  const world = transformBounds(matrix, [0, 0, 0, 1, 1, 1]);
  const expected = [0, 0, -0.00099, 0.3, 0.2, 0.00099];
  world.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) < 1e-12, `${world}`));
});

test("why an occurrence is a stand-in", () => {
  const board = { kind: "board", restricted: false, assetId: "sba_1" };
  const ready = { assetId: "sba_1", status: "ready", bundleUrl: "/b.json", bundleToBoard: BUNDLE_TO_BOARD };
  assert.equal(standInKind({ ...board, restricted: true, assetId: null }, null, undefined), "restricted");
  assert.equal(standInKind(board, ready, "loaded"), null);
  assert.equal(standInKind(board, ready, "loading"), "loading");
  assert.equal(standInKind(board, ready, "failed"), "failed");
  assert.equal(standInKind(board, { ...ready, bundleToBoard: null }, "waiting"), "building", "no layer table yet");
  assert.equal(standInKind(board, { ...ready, status: "building" }, "waiting"), "building");
  assert.equal(standInKind(board, { ...ready, status: "missing" }, "waiting"), "missing");
  assert.equal(standInKind(board, { ...ready, status: "failed" }, "waiting"), "failed");
  assert.equal(standInKind({ ...board, assetId: null }, null, undefined), "missing");
});

test("boards and restricted child systems are drawn; open assemblies are only groups", () => {
  const descriptor = { occurrences: [
    { path: "/a", kind: "assembly", restricted: false },
    { path: "/a/b", kind: "board", restricted: false },
    { path: "/c", kind: "assembly", restricted: true },
  ] };
  assert.deepEqual(drawnOccurrences(descriptor).map((item) => item.path), ["/a/b", "/c"]);
});

test("instanced shaders number occurrences scene-wide; the one-board shaders are untouched", () => {
  for (const name of ["main", "pick", "barrel", "barrelPick", "box", "boxPick"]) {
    const code = INSTANCED_SHADERS[name];
    assert.match(code, /occurrenceBase: u32/, name);
    assert.match(code, /output\.occurrence = index \+ 1u \+ globals\.occurrenceBase;/, name);
    assert.doesNotMatch(code, /output\.occurrence = index \+ 1u;/, name);
  }
});

test("the first frame counts once every ready board draws its own geometry", async () => {
  const { SystemScene } = await import("./system-scene.js");
  const drawn = (placed) => SystemScene.prototype.allReadyBoardsDrawn.call({ placed });
  assert.equal(drawn([]), false, "nothing placed yet");
  assert.equal(drawn([{ standIn: null }, { standIn: "loading" }]), false, "a ready bundle still loading");
  assert.equal(drawn([{ standIn: null }, { standIn: "restricted" }, { standIn: "failed" }]), true, "boxes that stay boxes don't wait");
  assert.equal(drawn([{ standIn: "building" }]), false, "no board drawn at all");
});

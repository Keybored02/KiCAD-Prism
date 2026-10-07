import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { type SceneHarness, harnessTubes, matrixPose } from "./harness-tubes";

const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
);
const header = golden.frames.find((c: { name: string }) => c.name === "vertical header, top").geometry;
const connector = { geometry: header, thicknessMm: 1.6, stored: null };
const translate = (x: number, y: number, z: number) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];

const harness: SceneHarness = {
  id: "shn_1", level: null,
  ends: [
    { id: "e1", ordinal: 0, occurrence: "/a", connector },
    { id: "e2", ordinal: 1, occurrence: "/b", connector },
    { id: "e3", ordinal: 2, occurrence: "/c", connector: null },
  ],
  wires: [{ id: "w1", from: "e1", to: "e2", gaugeAwg: 22 }, { id: "w2", from: "e1", to: "e3" }],
};
const worlds: Record<string, number[]> = { "/a": translate(0, 0, 0), "/b": translate(150, 0, 0), "/c": translate(0, 80, 0) };

describe("harness tubes", () => {
  it("reads a world matrix as a pose", () => {
    const quarter = [0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1, 0, 5, 6, 7, 1];
    const pose = matrixPose(quarter);
    expect(pose.translationMm).toEqual([5, 6, 7]);
    pose.rotation.forEach((value, index) => expect(Math.abs(value - [0, 0, Math.SQRT1_2, Math.SQRT1_2][index])).toBeLessThan(1e-12));
  });

  it("draws one tube between the two posed ends; an end without a connector drops out", () => {
    const tubes = harnessTubes([harness], (path) => worlds[path] ?? null);
    expect(tubes.map((t) => [t.harness, t.segmentId, t.wires])).toEqual([["/shn_1", "e1~e2", ["w1"]]]);
    const [tube] = tubes;
    expect(tube.radiusMm).toBeCloseTo((1.2 * 1.3208) / 2, 9);
    expect(tube.assumedGauge).toBe(false);
    // It starts at e1's cable exit, 8 mm above the header body's top (5 mm), and ends at e2's.
    expect(tube.samplesMm.slice(0, 3)).toEqual([50, -13.81, 0.8 + 5 + 8].map((v) => expect.closeTo(v, 6)));
    expect(tube.samplesMm.slice(-3)).toEqual([200, -13.81, 13.8].map((v) => expect.closeTo(v, 6)));
  });

  it("follows a moved board", () => {
    const moved = harnessTubes([harness], (path) => (path === "/b" ? translate(150, 0, 40) : worlds[path] ?? null));
    expect(moved[0].samplesMm.at(-1)).toBeCloseTo(53.8, 6);
  });

  it("skips a harness with fewer than two posed ends", () => {
    expect(harnessTubes([harness], (path) => (path === "/a" ? worlds[path] : null))).toEqual([]);
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { harnessScene } from "./harness-tubes";
import type { SceneHarness } from "./harness-route";

const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
);
const header = golden.frames.find((c: { name: string }) => c.name === "vertical header, top").geometry;
const connector = { geometry: header, thicknessMm: 1.6, stored: null };
const translate = (x: number, y: number, z: number) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
const worlds: Record<string, number[]> = { "/a": translate(0, 0, 0), "/b": translate(150, 0, 0) };
const point = (m: number[], p: number[]) => [0, 1, 2].map((k) => m[k] * p[0] + m[4 + k] * p[1] + m[8 + k] * p[2] + m[12 + k]);

const harness = (housing: SceneHarness["ends"][number]["housing"] = null): SceneHarness => ({
  id: "shn_1", level: null,
  ends: [
    { id: "e1", ordinal: 0, occurrence: "/a", connector, housing },
    { id: "e2", ordinal: 1, occurrence: "/b", connector },
  ],
  wires: [{ id: "w1", from: "e1", to: "e2", gaugeAwg: 22 }],
});

describe("harness housings", () => {
  it("draws a proxy box on the connector, 8 mm deep behind the mating face", () => {
    const { housings } = harnessScene([harness()], (path) => worlds[path] ?? null);
    expect(housings.map((h) => [h.key, h.model])).toEqual([["/shn_1/e1", null], ["/shn_1/e2", null]]);
    // The unit box's top face is the mating plane on the header's body (5 mm above the 0.8 mm board face);
    // its bottom face is the cable exit 8 mm higher (the housing faces down onto the header).
    const top = point(housings[0].matrix, [0.5, 0.5, 1]);
    const back = point(housings[0].matrix, [0.5, 0.5, 0]);
    expect(top[2]).toBeCloseTo(0.8 + 5, 6);
    expect(back[2]).toBeCloseTo(0.8 + 5 + 8, 6);
  });

  it("places a part's model under its alignment, and the cable leaves the model's rear face", () => {
    const housing = { glbKey: "k1", boundsMm: { minMm: [-2, -3, -12], maxMm: [2, 3, 0] }, alignment: { offsetMm: [0, 0, 0], rotationDeg: [0, 0, 0], scale: 1 } };
    const { housings, tubes } = harnessScene([harness(housing)], (path) => worlds[path] ?? null);
    expect(housings[0].model?.glbKey).toBe("k1");
    // The model's origin sits on the mating plane; its z = −12 rear face is 12 mm out from it.
    expect(point(housings[0].matrix, [0, 0, 0])[2]).toBeCloseTo(5.8, 6);
    expect(point(housings[0].matrix, [0, 0, -12])[2]).toBeCloseTo(17.8, 6);
    expect(tubes[0].samplesMm[2]).toBeCloseTo(17.8, 6);
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { type Curve, curve, harnessCurves } from "./harness-curves";

interface Case {
  name: string;
  op: "curve" | "harness";
  input: any;
  expected: Curve | ({ segmentId: string } & Curve)[];
}

// The goldens are shared with the Python half (CONTRACTS_P2 §17.8).
const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
) as { tolerance: { mm: number }; harnessCurves: Case[] };

describe("harness curves (shared goldens)", () => {
  it("has the full case list", () => {
    expect(golden.harnessCurves.length).toBeGreaterThanOrEqual(6);
  });

  it.each(golden.harnessCurves.map((c) => [c.name, c] as const))("replays %s", (_name, spec) => {
    const i = spec.input;
    const got = spec.op === "curve" ? [curve(i.points, i.movable, i.diameterMm)] : harnessCurves(i.ends, i.tree, i.waypoints);
    const expected = Array.isArray(spec.expected) ? spec.expected : [spec.expected];
    expect(got).toHaveLength(expected.length);
    got.forEach((result, index) => {
      const want = expected[index];
      expect(result.samplesMm).toHaveLength(want.samplesMm.length);
      result.samplesMm.forEach((p, k) => p.forEach((v, axis) => expect(Math.abs(v - want.samplesMm[k][axis])).toBeLessThanOrEqual(golden.tolerance.mm)));
      expect(Math.abs(result.lengthMm - want.lengthMm)).toBeLessThanOrEqual(0.01);
      expect(result.tightBend === null).toBe(want.tightBend === null);
    });
  });
});

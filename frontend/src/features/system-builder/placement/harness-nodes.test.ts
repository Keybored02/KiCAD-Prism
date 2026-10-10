import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { harnessCurves } from "./harness-curves";
import { breakouts, segmentWaypoints } from "./harness-nodes";
import { topology } from "./harness-topology";

interface Case {
  name: string;
  input: any;
  expected: any;
}

// The goldens are shared with the Python half (CONTRACTS_P2 §17.9).
const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
) as { tolerance: { mm: number }; harnessNodes: Case[] };

describe("harness nodes (shared goldens)", () => {
  it("has the full case list", () => {
    expect(golden.harnessNodes.length).toBeGreaterThanOrEqual(4);
  });

  it.each(golden.harnessNodes.map((c) => [c.name, c] as const))("replays %s", (_name, spec) => {
    const i = spec.input;
    const tree = topology(i.ends, i.wires, breakouts(i.nodes));
    const split = segmentWaypoints(tree, i.nodes);
    expect(breakouts(i.nodes)).toEqual(spec.expected.breakouts);
    expect(tree.segments.map((s) => s.id)).toEqual(spec.expected.tree.segments.map((s: { id: string }) => s.id));
    expect(split).toEqual(spec.expected.split);
    const curves = harnessCurves(i.posed, tree, split.waypoints, split.pinned);
    curves.forEach((got, k) => {
      const want = spec.expected.curves[k];
      expect(got.segmentId).toBe(want.segmentId);
      expect(Math.abs(got.lengthMm - want.lengthMm)).toBeLessThanOrEqual(0.01);
      expect(got.tightBend === null).toBe(want.tightBend === null);
      got.controlMm.forEach((p, n) => p.forEach((v, axis) => expect(Math.abs(v - want.controlMm[n][axis])).toBeLessThanOrEqual(golden.tolerance.mm)));
    });
  });
});

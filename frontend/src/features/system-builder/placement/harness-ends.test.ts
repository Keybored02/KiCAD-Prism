import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { type EndPose, boardEnd } from "./harness-ends";

interface Case {
  name: string;
  input: Record<string, any>;
  expected: EndPose | null;
}

// The goldens are shared with the Python half (CONTRACTS_P2 §17.6).
const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
) as { tolerance: { mm: number; unit: number }; harnessEnds: Case[] };

const close = (actual: readonly number[], expected: readonly number[], tolerance: number) =>
  actual.forEach((value, index) => expect(Math.abs(value - expected[index])).toBeLessThanOrEqual(tolerance));

describe("harness ends (shared goldens)", () => {
  it("has the full case list", () => {
    expect(golden.harnessEnds.length).toBeGreaterThanOrEqual(8);
  });

  it.each(golden.harnessEnds.map((c) => [c.name, c] as const))("replays %s", (_name, spec) => {
    const i = spec.input;
    const got = boardEnd(i.boardWorld, i.geometry, i.thicknessMm, i.stored, i.quarterTurns, i.housing, i.bodyMm);
    if (!spec.expected) {
      expect(got).toBeNull();
      return;
    }
    expect(got).not.toBeNull();
    close(got!.exitMm, spec.expected.exitMm, golden.tolerance.mm);
    close(got!.legMm, spec.expected.legMm, golden.tolerance.mm);
    close(got!.outward, spec.expected.outward, golden.tolerance.unit);
    close(got!.pose.rotation, spec.expected.pose.rotation, golden.tolerance.unit);
    expect([got!.modeled, got!.depthMm, got!.matingPlaneMm]).toEqual([spec.expected.modeled, spec.expected.depthMm, spec.expected.matingPlaneMm]);
  });
});

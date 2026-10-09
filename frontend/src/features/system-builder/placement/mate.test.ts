import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { type MateEnd, type MateResult, mate, residual } from "./mate";
import type { Pose } from "./poses";

interface Case {
  name: string;
  op: "mate" | "residual";
  input: Record<string, any>;
  expected: any;
}

// The goldens are shared with the Python half (CONTRACTS_P2 §14.5, §14.8).
const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
) as { tolerance: { mm: number; unit: number }; mates: Case[]; mateEnds: Record<string, MateEnd> };

/** `{end: key}` names a fixture connector in `mateEnds`; other keys (`bodyMm`) override it. */
function resolveEnd(end: Record<string, unknown>): MateEnd {
  if (typeof end.end !== "string") return end as unknown as MateEnd;
  const { end: key, ...rest } = end;
  return { ...golden.mateEnds[key as string], ...rest } as MateEnd;
}

function expectClose(actual: readonly number[], expected: readonly number[], tolerance: number) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) => expect(Math.abs(value - expected[index])).toBeLessThanOrEqual(tolerance));
}

describe("mate transform (shared goldens)", () => {
  it("has the full case list", () => {
    expect(golden.mates.length).toBeGreaterThanOrEqual(11);
  });

  it.each(golden.mates.map((c) => [c.name, c] as const))("replays %s", (_name, spec) => {
    const i = spec.input;
    if (spec.op === "residual") {
      const got = residual(i.aWorld as Pose, i.bWorld as Pose, resolveEnd(i.a), resolveEnd(i.b), i.result as MateResult);
      expectClose(got.offsetMm, spec.expected.offsetMm, golden.tolerance.mm);
      for (const key of ["distanceMm", "lateralMm", "angleDeg"] as const) {
        expect(Math.abs(got[key] - spec.expected[key])).toBeLessThanOrEqual(golden.tolerance.mm);
      }
      return;
    }
    const got = mate(resolveEnd(i.a), resolveEnd(i.b), i.stackHeightMm);
    if (spec.expected === null) {
      expect(got).toBeNull();
      return;
    }
    expect(got).not.toBeNull();
    expect([got!.quarterTurns, got!.heightSource]).toEqual([spec.expected.quarterTurns, spec.expected.heightSource]);
    expect(Math.abs(got!.stackHeightMm - spec.expected.stackHeightMm)).toBeLessThanOrEqual(golden.tolerance.mm);
    expectClose(got!.pose.translationMm, spec.expected.pose.translationMm, golden.tolerance.mm);
    expectClose(got!.pose.rotation, spec.expected.pose.rotation, golden.tolerance.unit);
  });
});

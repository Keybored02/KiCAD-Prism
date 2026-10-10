import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { MateEnd } from "./mate";
import type { Bounds, PlacedPose } from "./poses";
import { type SolveMate, type SolveResult, solve } from "./solve";

interface Case {
  name: string;
  input: {
    items: [string, Bounds | null][];
    stored: Record<string, PlacedPose>;
    connections: [string, string][];
    mates: (Omit<SolveMate, "a" | "b"> & { a: any; b: any })[];
    overrides: Record<string, string> | null;
  };
  expected: SolveResult;
}

// The goldens are shared with the Python half (CONTRACTS_P2 §14.9).
const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
) as { tolerance: { mm: number; unit: number }; solves: Case[]; mateEnds: Record<string, MateEnd> };

function resolveEnd(end: Record<string, unknown>): MateEnd {
  if (typeof end.end !== "string") return end as unknown as MateEnd;
  const { end: key, ...rest } = end;
  return { ...golden.mateEnds[key as string], ...rest } as MateEnd;
}

function expectPose(actual: PlacedPose, expected: PlacedPose) {
  expect(actual.source).toBe(expected.source);
  actual.translationMm.forEach((v, i) => expect(Math.abs(v - expected.translationMm[i])).toBeLessThanOrEqual(golden.tolerance.mm));
  actual.rotation.forEach((v, i) => expect(Math.abs(v - expected.rotation[i])).toBeLessThanOrEqual(golden.tolerance.unit));
}

describe("tree solve (shared goldens)", () => {
  it("has the full case list", () => {
    expect(golden.solves.length).toBeGreaterThanOrEqual(11);
  });

  it.each(golden.solves.map((c) => [c.name, c] as const))("replays %s", (_name, spec) => {
    const i = spec.input;
    const mates: SolveMate[] = i.mates.map((m) => ({
      ...m,
      a: { ...m.a, end: resolveEnd(m.a.end) },
      b: { ...m.b, end: resolveEnd(m.b.end) },
    }));
    const got = solve(i.items, i.stored, i.connections, mates, i.overrides);
    const e = spec.expected;
    expect(Object.keys(got.poses).sort()).toEqual(Object.keys(e.poses).sort());
    for (const key of Object.keys(e.poses)) expectPose(got.poses[key], e.poses[key]);
    const summary = (r: SolveResult) =>
      Object.fromEntries(Object.entries(r.driving).map(([k, v]) => [k, [v.linkId, v.from, v.overridden]]));
    expect(summary(got)).toEqual(summary(e));
    for (const key of Object.keys(e.driving)) expectPose(got.driving[key].autoPose, e.driving[key].autoPose);
    expect([got.roots, got.unusable, got.ignoredOverrides]).toEqual([e.roots, e.unusable, e.ignoredOverrides]);
    expect(got.mismatches.map((m) => m.linkId)).toEqual(e.mismatches.map((m) => m.linkId));
    got.mismatches.forEach((m, index) => {
      for (const key of ["lateralMm", "axialMm", "angleDeg"] as const) {
        expect(Math.abs(m[key] - e.mismatches[index][key])).toBeLessThanOrEqual(golden.tolerance.mm);
      }
    });
  });
});

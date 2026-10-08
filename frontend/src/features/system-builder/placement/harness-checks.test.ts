import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { collisions, lengths, spanBoxDistance } from "./harness-checks";
import { route } from "./harness-route";

interface Case {
  name: string;
  op: "span" | "harness";
  input: any;
  expected: any;
}

// The goldens are shared with the Python half (CONTRACTS_P2 §17.10).
const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
) as { harnessChecks: Case[] };

describe("harness checks (shared goldens)", () => {
  it("has the full case list", () => {
    expect(golden.harnessChecks.length).toBeGreaterThanOrEqual(6);
  });

  it.each(golden.harnessChecks.map((c) => [c.name, c] as const))("replays %s", (_name, spec) => {
    const i = spec.input;
    if (spec.op === "span") {
      // The search runs the same float steps as the Python half: equal to the bit.
      expect(spanBoxDistance(i.a, i.b, i.lo, i.hi)).toEqual(spec.expected);
      return;
    }
    const routed = route(i.harness, (path) => i.worlds[path] ?? null)!;
    expect(routed.curves.map((c) => c.segmentId)).toEqual(spec.expected.segments);
    routed.curves.forEach((curve, k) => expect(Math.abs(curve.lengthMm - spec.expected.lengthsMm[k])).toBeLessThanOrEqual(0.01));
    const hits = collisions(routed, i.boards);
    expect(hits.map((h) => [h.segmentId, h.board, h.spans])).toEqual(
      spec.expected.collisions.map((h: { segmentId: string; board: string; spans: number[] }) => [h.segmentId, h.board, h.spans]),
    );
    hits.forEach((hit, k) => expect(Math.abs(hit.distanceMm - spec.expected.collisions[k].distanceMm)).toBeLessThanOrEqual(1e-6));
    const measured = lengths(routed, i.allowancePct);
    expect(Math.abs(measured.estimatedMm - spec.expected.lengths.estimatedMm)).toBeLessThanOrEqual(0.01);
    expect(Object.keys(measured.wires).sort()).toEqual(Object.keys(spec.expected.lengths.wires).sort());
    for (const [wire, value] of Object.entries(measured.wires)) {
      expect(Math.abs(value.estimatedMm - spec.expected.lengths.wires[wire].estimatedMm)).toBeLessThanOrEqual(0.01);
    }
  });
});

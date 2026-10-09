import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { type ConnectorFrame, type ConnectorGeometry, type Inference, type StoredFrame, connectorFrame, inferMating, quaternion } from "./frames";

interface Case {
  name: string;
  geometry: ConnectorGeometry;
  thicknessMm: number;
  stored: StoredFrame | null;
  expected: { inference: Inference; frame: ConnectorFrame | null };
}

// The goldens are shared with the Python half (CONTRACTS_P2 §14).
const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
) as { tolerance: { mm: number; unit: number }; frames: Case[] };

function expectClose(actual: readonly number[], expected: readonly number[], tolerance: number) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) => expect(Math.abs(value - expected[index])).toBeLessThanOrEqual(tolerance));
}

describe("placement frames (shared goldens)", () => {
  it("has the full case list", () => {
    expect(golden.frames.length).toBeGreaterThanOrEqual(14);
  });

  it.each(golden.frames.map((c) => [c.name, c] as const))("replays %s", (_name, spec) => {
    expect(inferMating(spec.geometry)).toEqual(spec.expected.inference);
    const frame = connectorFrame(spec.geometry, spec.thicknessMm, spec.stored);
    const expected = spec.expected.frame;
    if (!expected) {
      expect(frame).toBeNull();
      return;
    }
    expect(frame).not.toBeNull();
    expect([frame!.axis, frame!.quarterTurns]).toEqual([expected.axis, expected.quarterTurns]);
    expectClose(frame!.originMm, expected.originMm, golden.tolerance.mm);
    for (const key of ["xAxis", "yAxis", "zAxis", "rotation"] as const) {
      expectClose(frame![key], expected[key], golden.tolerance.unit);
    }
  });

  it("canonicalises quaternions to w ≥ 0", () => {
    expect(quaternion([1, 0, 0], [0, 1, 0], [0, 0, 1])).toEqual([0, 0, 0, 1]);
    const flipped = quaternion([1, 0, 0], [0, -1, 0], [0, 0, -1]);
    expectClose(flipped, [1, 0, 0, 0], 1e-12);
  });
});

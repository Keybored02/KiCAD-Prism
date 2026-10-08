import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { type FaceFrame, type ModulePlacement, faceFrame, footprintPose } from "./module-ports";
import type { ConnectorGeometry } from "./frames";
import type { Pose } from "./poses";

interface Case {
  name: string;
  input: { placement: ModulePlacement; geometry: ConnectorGeometry };
  expected: { face: FaceFrame; footprintPose: Pose | null };
}

// The goldens are shared with the Python half (CONTRACTS_P2 §3.6).
const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
) as { tolerance: { mm: number; unit: number }; modulePorts: Case[] };

const close = (actual: readonly number[], expected: readonly number[], tolerance: number) =>
  actual.forEach((value, index) => expect(Math.abs(value - expected[index])).toBeLessThanOrEqual(tolerance));

describe("module ports (shared goldens)", () => {
  it("has the full case list", () => {
    expect(golden.modulePorts.length).toBeGreaterThanOrEqual(8);
  });

  it.each(golden.modulePorts.map((c) => [c.name, c] as const))("replays %s", (_name, spec) => {
    const face = faceFrame(spec.input.placement);
    close(face.originMm, spec.expected.face.originMm, golden.tolerance.mm);
    for (const key of ["xAxis", "yAxis", "zAxis", "rotation"] as const) {
      close(face[key], spec.expected.face[key], golden.tolerance.unit);
    }
    const pose = footprintPose(spec.input.placement, spec.input.geometry);
    expect(pose).not.toBeNull();
    close(pose!.translationMm, spec.expected.footprintPose!.translationMm, golden.tolerance.mm);
    close(pose!.rotation, spec.expected.footprintPose!.rotation, golden.tolerance.unit);
  });

  it("has no pose for a footprint without pads", () => {
    const placement: ModulePlacement = { originMm: [0, 0, 0], normal: [0, 0, 1], quarterTurns: 0, axis: null };
    expect(footprintPose(placement, null)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import { alignmentMatrix } from "@/features/system-builder/placement/module-scene";

import { facingNormal, snapNormal } from "./module-face-picker";

describe("module face picker helpers", () => {
  it("builds the same alignment matrix as the backend (catalog/models.alignment_matrix)", () => {
    // alignment_matrix({offsetMm: [1, 2, 3], rotationDeg: [90, 30, -45], scale: 2}), column-major.
    const expected = [1.224744871, -1.224744871, -1, 0, 0.707106781, -0.707106781, 1.732050808, 0,
      -1.414213562, -1.414213562, 0, 0, 1, 2, 3, 1];
    const got = alignmentMatrix({ offsetMm: [1, 2, 3], rotationDeg: [90, 30, -45], scale: 2 });
    got.forEach((value, index) => expect(Math.abs(value - expected[index])).toBeLessThan(1e-8));
  });

  it("snaps near-axis normals and keeps oblique ones", () => {
    expect(snapNormal([0.001, -0.0005, -1])).toEqual([0, 0, -1]);
    expect(snapNormal([3, 0, 4])).toEqual([0.6, 0, 0.8]);
  });

  it("reads a hit inside a connector opening as the face toward the viewer", () => {
    const toCamera = [-1, 0.05, 0.02].map((c, _i, all) => c / Math.hypot(...all));
    expect(facingNormal([0, -0.12, -0.99], toCamera)).toEqual([-1, 0, 0]);
    expect(facingNormal([-0.9, 0.3, 0], toCamera)).toEqual([-0.9, 0.3, 0]);
  });
});

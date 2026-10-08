import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { ConnectorGeometry } from "./frames";
import { type ModulePlacement, faceFrame, footprintPose } from "./module-ports";
import { MODULE_PATH, type SceneModel, alignmentMatrix, connectorPath, moduleScene, placementFromPose } from "./module-scene";
import { matrix } from "./poses";

const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
) as { modulePorts: { input: { placement: ModulePlacement; geometry: ConnectorGeometry } }[] };
const { placement, geometry } = golden.modulePorts[0].input; // a vertical 1×4 header on the top face

const close = (actual: readonly number[], expected: readonly number[], tolerance = 1e-6) =>
  actual.forEach((value, index) => expect(Math.abs(value - expected[index])).toBeLessThanOrEqual(tolerance));

function multiply(a: readonly number[], b: readonly number[]): number[] {
  return Array.from({ length: 16 }, (_v, i) => {
    const [c, r] = [Math.floor(i / 4), i % 4];
    return [0, 1, 2, 3].reduce((sum, k) => sum + a[k * 4 + r] * b[c * 4 + k], 0);
  });
}

const module: SceneModel = { glbKey: "m".repeat(64), alignment: { offsetMm: [0, 0, 1], rotationDeg: [0, 0, 90], scale: 1 } };
const part: SceneModel = { glbKey: "p".repeat(64), alignment: { offsetMm: [0, 0, 0], rotationDeg: [0, 0, 0], scale: 1 } };

describe("the connector picker's scene", () => {
  it("holds the fixed, pickable module and each connector's marker and body", () => {
    const scene = moduleScene(module, { key: "A", placement, geometry, model: null },
      [{ key: "B", placement: { ...placement, originMm: [0, 0, 0] }, geometry, model: null }]);
    const byPath = new Map(scene.occurrences.map((item) => [item.path, item]));
    expect(byPath.get(MODULE_PATH)).toMatchObject({ move: false, pickSurface: true });
    expect(byPath.get(MODULE_PATH)!.model!.matrixMm).toEqual(alignmentMatrix(module.alignment));
    expect(byPath.get(connectorPath("A"))!.move).toEqual({ translate: [0, 1], rotate: [2], rotateSnapDeg: 90, pivot: "origin" });
    expect(byPath.get(connectorPath("B"))!.move).toBe(false);
    expect(byPath.get(`${connectorPath("A")}/body`)!.parentPath).toBe(connectorPath("A"));
    const face = faceFrame(placement);
    expect(byPath.get(connectorPath("A"))!.worldMatrix).toEqual(matrix({ translationMm: face.originMm, rotation: face.rotation }));
  });

  it("draws a part's model where its footprint sits: P · F_part⁻¹ · alignment", () => {
    const scene = moduleScene(module, { key: "A", placement, geometry, model: part }, []);
    const body = scene.occurrences.find((item) => item.path === `${connectorPath("A")}/body`)!;
    const drawn = multiply(body.worldMatrix, body.model!.matrixMm!);
    close(drawn, multiply(matrix(footprintPose(placement, geometry)!), alignmentMatrix(part.alignment)));
  });

  it("puts pin 1's marker on pad 1, on the face's −x side", () => {
    const scene = moduleScene(module, { key: "A", placement, geometry, model: null }, []);
    const marker = scene.occurrences.find((item) => item.path === connectorPath("A"))!;
    const box = marker.box!.boundsMm;
    expect((box.minMm[0] + box.maxMm[0]) / 2).toBeLessThan(0);
  });

  it("reads a moved pose back as a placement: new origin, quarter-turns about the normal", () => {
    for (const turns of [0, 1, 2, 3]) {
      const face = faceFrame({ ...placement, quarterTurns: turns });
      const moved = placementFromPose({ translationMm: [face.originMm[0] + 2, face.originMm[1], face.originMm[2]], rotation: face.rotation },
        placement);
      expect(moved.quarterTurns).toBe(turns);
      close(moved.originMm, [placement.originMm[0] + 2, placement.originMm[1], placement.originMm[2]]);
      expect(moved.normal).toEqual(placement.normal);
    }
  });
});

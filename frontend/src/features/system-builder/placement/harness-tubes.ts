/**
 * Harness tubes for the System 3D view (CONTRACTS_P2 §20.15, SB2-44).
 *
 * From the scene's harnesses (ends located on board occurrences, with their
 * connectors' v6 geometry) and each occurrence's world matrix, the curve of
 * every segment: end poses (§17.6), the tree (§17.7) through the stored
 * breakouts, and the curves (§17.8) through the stored waypoints (§17.9).
 * The viewer bundles this module and runs it whenever a placement changes,
 * dragged boards included, then turns the polylines into tubes on the GPU.
 */

import { type Board, collisions } from "./harness-checks";
import { type HousingItem, harnessHousings } from "./harness-housings";
import { type Matrix, type SceneHarness, route } from "./harness-route";

export type { SceneHarness } from "./harness-route";
export { matrixPose } from "./harness-route";

export interface Tube {
  /** `level/id`, as the viewer keys harnesses. */
  harness: string;
  segmentId: string;
  /** The segment's nodes (end or breakout IDs; `auto` for the automatic breakout), samples run from `from`. */
  from: string;
  to: string;
  /** Samples in world mm, flat `[x, y, z, …]`. */
  samplesMm: number[];
  radiusMm: number;
  wires: string[];
  tightBend: boolean;
  assumedGauge: boolean;
  /** SB2-46: the board occurrences it runs through (§17.10). */
  collides: string[];
}

/**
 * Every drawable segment of every harness; ends without a connector or a frame
 * are left out. `boards` (scene boards in world) mark the segments that run
 * through one.
 */
export function harnessTubes(
  harnesses: readonly SceneHarness[],
  worldMatrixOf: (path: string) => Matrix | null,
  boards: readonly Board[] = [],
): Tube[] {
  return harnessScene(harnesses, worldMatrixOf, boards).tubes;
}

/** The tubes and, at every posed end, its housing (SB2-47), from one route per harness. */
export function harnessScene(
  harnesses: readonly SceneHarness[],
  worldMatrixOf: (path: string) => Matrix | null,
  boards: readonly Board[] = [],
): { tubes: Tube[]; housings: HousingItem[] } {
  const tubes: Tube[] = [];
  const housings: HousingItem[] = [];
  for (const harness of harnesses) {
    const routed = route(harness, worldMatrixOf);
    if (!routed) continue;
    housings.push(...harnessHousings(harness, routed));
    const hits = new Map<string, string[]>();
    for (const hit of boards.length ? collisions(routed, boards) : []) hits.set(hit.segmentId, [...(hits.get(hit.segmentId) ?? []), hit.board]);
    for (const curve of routed.curves) {
      if (curve.diameterMm <= 0) continue;
      tubes.push({
        harness: `${harness.level || ""}/${harness.id}`,
        segmentId: curve.segmentId,
        from: curve.from,
        to: curve.to,
        samplesMm: curve.samplesMm.flat(),
        radiusMm: curve.diameterMm / 2,
        wires: curve.wires,
        tightBend: curve.tightBend !== null,
        assumedGauge: curve.assumedGauge,
        collides: hits.get(curve.segmentId) ?? [],
      });
    }
  }
  return { tubes, housings };
}

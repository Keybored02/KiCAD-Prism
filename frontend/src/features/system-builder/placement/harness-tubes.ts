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

import { type ConnectorGeometry, type StoredFrame, quaternion } from "./frames";
import { harnessCurves } from "./harness-curves";
import { boardEnd } from "./harness-ends";
import { type HarnessNodeInput, breakouts, segmentWaypoints } from "./harness-nodes";
import { topology } from "./harness-topology";
import type { Pose } from "./poses";

export interface SceneHarnessEnd {
  id: string;
  ordinal: number;
  occurrence: string | null;
  connector?: { geometry: ConnectorGeometry; thicknessMm: number | null; stored: StoredFrame | null } | null;
}

export interface SceneHarness {
  id: string;
  level: string | null;
  ends: SceneHarnessEnd[];
  wires: { id: string; from: string; to: string; gaugeAwg?: number | string | null }[];
  /** Breakouts and waypoints in the level's frame (absent from older servers). */
  nodes?: HarnessNodeInput[];
}

export interface Tube {
  /** `level/id`, as the viewer keys harnesses. */
  harness: string;
  segmentId: string;
  /** Samples in world mm, flat `[x, y, z, …]`. */
  samplesMm: number[];
  radiusMm: number;
  wires: string[];
  tightBend: boolean;
  assumedGauge: boolean;
}

/** A rigid column-major world matrix (mm) as a pose. */
export function matrixPose(m: readonly number[]): Pose {
  return {
    translationMm: [m[12], m[13], m[14]],
    rotation: quaternion([m[0], m[1], m[2]], [m[4], m[5], m[6]], [m[8], m[9], m[10]]),
  };
}

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** A point through a column-major matrix. */
function transform(m: readonly number[], p: readonly number[]): [number, number, number] {
  return [0, 1, 2].map((k) => m[k] * p[0] + m[4 + k] * p[1] + m[8 + k] * p[2] + m[12 + k]) as [number, number, number];
}

/** Every drawable segment of every harness; ends without a connector or a frame are left out. */
export function harnessTubes(harnesses: readonly SceneHarness[], worldMatrixOf: (path: string) => readonly number[] | null): Tube[] {
  const tubes: Tube[] = [];
  for (const harness of harnesses) {
    const key = `${harness.level || ""}/${harness.id}`;
    const posed = new Map<string, { exitMm: number[]; outward: number[]; legMm: number[] }>();
    for (const end of [...harness.ends].sort((a, b) => a.ordinal - b.ordinal)) {
      const matrix = end.occurrence ? worldMatrixOf(end.occurrence) : null;
      if (!matrix || !end.connector) continue;
      const pose = boardEnd(matrixPose(matrix), end.connector.geometry, end.connector.thicknessMm, end.connector.stored);
      if (pose) posed.set(end.id, pose);
    }
    if (posed.size < 2) continue;
    const ends = [...posed].map(([id, pose]) => ({ id, legMm: pose.legMm as [number, number, number], outward: pose.outward as [number, number, number] }));
    const wires = harness.wires.map((wire) => ({ id: wire.id, from: { end: wire.from }, to: { end: wire.to }, gaugeAwg: wire.gaugeAwg ?? null }));
    // Nodes are stored in the harness's level frame; the root level is the world.
    const level = harness.level ? worldMatrixOf(harness.level) : IDENTITY;
    const nodes = level ? (harness.nodes ?? []).map((node) => ({ ...node, positionMm: transform(level, node.positionMm) })) : [];
    const tree = topology(ends, wires, breakouts(nodes));
    const split = segmentWaypoints(tree, nodes);
    const byId = new Map(tree.segments.map((segment) => [segment.id, segment]));
    for (const curve of harnessCurves(Object.fromEntries(posed), tree, split.waypoints, split.pinned)) {
      const segment = byId.get(curve.segmentId)!;
      if (segment.diameterMm <= 0) continue;
      tubes.push({
        harness: key,
        segmentId: curve.segmentId,
        samplesMm: curve.samplesMm.flat(),
        radiusMm: segment.diameterMm / 2,
        wires: segment.wires,
        tightBend: curve.tightBend !== null,
        assumedGauge: segment.assumedGauge,
      });
    }
  }
  return tubes;
}

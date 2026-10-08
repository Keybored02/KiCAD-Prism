/**
 * One harness routed in the world, from the scene's data (CONTRACTS_P2 §17.10, SB2-46).
 *
 * The twin of `backend/app/services/systems/placement/harness_route.py`. Both
 * run the shared goldens in `placement_cases.json` (`harnessChecks`); change
 * the two together.
 */

import { type ConnectorGeometry, type StoredFrame, type Vec3, quaternion } from "./frames";
import { type Curve, harnessCurves } from "./harness-curves";
import { type EndPose, type Housing, boardEnd } from "./harness-ends";
import { type HarnessNodeInput, breakouts, segmentWaypoints } from "./harness-nodes";
import { type Topology, topology } from "./harness-topology";
import type { Pose } from "./poses";

export interface SceneHarnessEnd {
  id: string;
  ordinal: number;
  occurrence: string | null;
  connector?: { geometry: ConnectorGeometry; thicknessMm: number | null; stored: StoredFrame | null } | null;
  /** SB2-47: the end's part model (§18.2); null for a Generic end or a part without a converted model. */
  housing?: SceneHousing | null;
}

export interface SceneHousing extends Housing {
  /** `GET /api/catalog/models/{glbKey}.glb`. */
  glbKey: string;
}

export interface SceneHarness {
  id: string;
  level: string | null;
  ends: SceneHarnessEnd[];
  wires: { id: string; from: string; to: string; gaugeAwg?: number | string | null }[];
  /** Breakouts and waypoints in the level's frame (absent from older servers). */
  nodes?: HarnessNodeInput[];
}

export type Matrix = readonly number[];
export type WorldMatrixOf = (path: string) => Matrix | null;

export interface RoutedCurve extends Curve {
  segmentId: string;
  from: string;
  to: string;
  wires: string[];
  diameterMm: number;
  assumedGauge: boolean;
}

export interface Route {
  ends: Record<string, EndPose & { occurrence: string }>;
  tree: Topology;
  curves: RoutedCurve[];
  unused: string[];
  unplaced: string[];
  wires: { id: string; from: string; to: string }[];
}

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** A rigid column-major world matrix (mm) as a pose. */
export function matrixPose(m: Matrix): Pose {
  return {
    translationMm: [m[12], m[13], m[14]],
    rotation: quaternion([m[0], m[1], m[2]], [m[4], m[5], m[6]], [m[8], m[9], m[10]]),
  };
}

/** A point through a column-major matrix. */
export function transform(m: Matrix, p: readonly number[]): Vec3 {
  return [0, 1, 2].map((k) => m[k] * p[0] + m[4 + k] * p[1] + m[8 + k] * p[2] + m[12 + k]) as Vec3;
}

/** The harness in world mm, or null with fewer than two posed ends (see the Python half). */
export function route(harness: SceneHarness, worldMatrixOf: WorldMatrixOf): Route | null {
  const posed: Route["ends"] = {};
  for (const end of [...harness.ends].sort((a, b) => a.ordinal - b.ordinal)) {
    const matrix = end.occurrence ? worldMatrixOf(end.occurrence) : null;
    if (!matrix || !end.connector || !end.occurrence) continue;
    const pose = boardEnd(matrixPose(matrix), end.connector.geometry, end.connector.thicknessMm, end.connector.stored, 0, end.housing);
    if (pose) posed[end.id] = { ...pose, occurrence: end.occurrence };
  }
  if (Object.keys(posed).length < 2) return null;
  const ends = Object.entries(posed).map(([id, pose]) => ({ id, legMm: pose.legMm, outward: pose.outward }));
  const wires = harness.wires.map((wire) => ({ id: wire.id, from: { end: wire.from }, to: { end: wire.to }, gaugeAwg: wire.gaugeAwg ?? null }));
  // Nodes are stored in the harness's level frame; the root level is the world.
  const level = harness.level ? worldMatrixOf(harness.level) : IDENTITY;
  const nodes = level ? (harness.nodes ?? []).map((node) => ({ ...node, positionMm: transform(level, node.positionMm) })) : [];
  const tree = topology(ends, wires, breakouts(nodes));
  const split = segmentWaypoints(tree, nodes);
  const byId = new Map(tree.segments.map((segment) => [segment.id, segment]));
  const curves = harnessCurves(posed, tree, split.waypoints, split.pinned).map((curve): RoutedCurve => {
    const segment = byId.get(curve.segmentId)!;
    return { ...curve, from: segment.from, to: segment.to, wires: [...segment.wires], diameterMm: segment.diameterMm, assumedGauge: segment.assumedGauge };
  });
  return {
    ends: posed, tree, curves, unused: split.unused, unplaced: tree.unplaced,
    wires: harness.wires.map((wire) => ({ id: wire.id, from: wire.from, to: wire.to })),
  };
}

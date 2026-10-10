/**
 * Harness end poses and exit legs (CONTRACTS_P2 §17.6).
 *
 * The twin of `backend/app/services/systems/placement/harness_ends.py`. Both
 * run the shared goldens in `placement_cases.json` (`harnessEnds`); change the
 * two together.
 */

import { type ConnectorGeometry, type StoredFrame, type Vec3, connectorFrame } from "./frames";
import { HARNESS_SPEC } from "./harness-spec";
import { type BodyBounds, bodyCorners, boxIn } from "./mate";
import { type Pose, type Quat, canonicalRotation, clean, compose, rotate } from "./poses";

const S = Math.SQRT1_2;
const QUARTER_TURNS: Quat[] = [
  [0, 0, 0, 1],
  [0, 0, S, S],
  [0, 0, 1, 0],
  [0, 0, S, -S],
];
const FLIP_X: Quat = [1, 0, 0, 0];
const NO_TURN: Quat = [0, 0, 0, 1];

/** A catalog model alignment (§18.2). */
export interface Alignment {
  offsetMm?: number[];
  rotationDeg?: number[];
  scale?: number;
}

/** An end's part model: its bounds in the STEP frame and its alignment into the mating frame. */
export interface Housing {
  boundsMm: { minMm: number[]; maxMm: number[] } | null;
  alignment?: Alignment | null;
}

export interface EndPose {
  pose: Pose;
  exitMm: Vec3;
  outward: Vec3;
  legMm: Vec3;
  depthMm: number;
  modeled: boolean;
  matingPlaneMm?: number;
}

const axisQuaternion = (axis: Vec3, degrees: number): Quat => {
  const half = (degrees * Math.PI) / 360;
  return [axis[0] * Math.sin(half), axis[1] * Math.sin(half), axis[2] * Math.sin(half), Math.cos(half)];
};

/** `T(offset)·Rz·Ry·Rx` and `S`. */
export function alignmentPose(alignment: Alignment | null | undefined): { pose: Pose; scale: number } {
  if (!alignment) return { pose: { translationMm: [0, 0, 0], rotation: NO_TURN }, scale: 1 };
  const [rx, ry, rz] = (alignment.rotationDeg ?? [0, 0, 0]).map(Number);
  let rotation: Quat = NO_TURN;
  for (const [axis, degrees] of [[[0, 0, 1], rz], [[0, 1, 0], ry], [[1, 0, 0], rx]] as [Vec3, number][]) {
    rotation = compose({ translationMm: [0, 0, 0], rotation }, { translationMm: [0, 0, 0], rotation: axisQuaternion(axis, degrees) }).rotation;
  }
  const offset = (alignment.offsetMm ?? [0, 0, 0]).map(Number) as Vec3;
  return { pose: { translationMm: offset, rotation: canonicalRotation(rotation) }, scale: Number(alignment.scale ?? 1) || 1 };
}

function rearFace(housing: Housing | null | undefined): { exit: Vec3; depth: number; modeled: boolean } {
  const bounds = housing?.boundsMm;
  if (!bounds) return { exit: [0, 0, -HARNESS_SPEC.housingDepthMm], depth: HARNESS_SPEC.housingDepthMm, modeled: false };
  const { pose, scale } = alignmentPose(housing.alignment);
  const corners: Vec3[] = [];
  for (let i = 0; i < 8; i += 1) {
    const corner = [0, 1, 2].map((k) => ((i >> k) & 1 ? bounds.maxMm : bounds.minMm)[k] * scale);
    const moved = rotate(pose.rotation, corner);
    corners.push([0, 1, 2].map((k) => moved[k] + pose.translationMm[k]) as Vec3);
  }
  const low = [0, 1, 2].map((k) => Math.min(...corners.map((c) => c[k])));
  const high = [0, 1, 2].map((k) => Math.max(...corners.map((c) => c[k])));
  // A model aligned inside out never puts the exit in front of the mating face.
  const back = Math.min(low[2], 0);
  return { exit: [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, back], depth: -back + 0, modeled: true };
}

/** An end from its connector's frame in the world (see the Python half). */
export function endPose(connectorWorld: Pose, quarterTurns = 0, housing?: Housing | null): EndPose {
  const turn = QUARTER_TURNS[((quarterTurns % 4) + 4) % 4];
  const flip = compose({ translationMm: [0, 0, 0], rotation: FLIP_X }, { translationMm: [0, 0, 0], rotation: turn });
  const pose = compose(connectorWorld, flip);
  const { exit, depth, modeled } = rearFace(housing);
  const exitWorld = compose(pose, { translationMm: exit, rotation: NO_TURN }).translationMm;
  const outward = rotate(pose.rotation, [0, 0, -1]);
  const leg = [0, 1, 2].map((k) => exitWorld[k] + HARNESS_SPEC.bootMm * outward[k]);
  return {
    pose,
    exitMm: exitWorld.map(clean) as Vec3,
    outward: outward.map(clean) as Vec3,
    legMm: leg.map(clean) as Vec3,
    depthMm: clean(depth),
    modeled,
  };
}

/** `endPose` for an end mated to a board connector, or null without a frame (details needed). */
export function boardEnd(
  boardWorld: Pose,
  geometry: ConnectorGeometry | null,
  thicknessMm: number | null,
  stored?: StoredFrame | null,
  quarterTurns = 0,
  housing?: Housing | null,
  bodyMm?: BodyBounds | null,
): EndPose | null {
  const frame = connectorFrame(geometry, thicknessMm, stored);
  if (!frame || !geometry) return null;
  const height = Math.max(boxIn(frame, bodyCorners(geometry, thicknessMm, bodyMm))[1][2], 0);
  let connector = compose(boardWorld, { translationMm: frame.originMm, rotation: frame.rotation });
  connector = compose(connector, { translationMm: [0, 0, height], rotation: NO_TURN });
  return { ...endPose(connector, quarterTurns, housing), matingPlaneMm: clean(height) };
}

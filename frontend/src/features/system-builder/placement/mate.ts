/**
 * The mate transform, connector bodies and stack-height clearance (CONTRACTS_P2 §14.5, §14.8).
 *
 *     B = A · F_a · T(0, 0, h) · Rx(180°) · Rz(k · 90°) · F_b⁻¹
 *
 * The twin of `backend/app/services/systems/placement/mate.py`. Both run the
 * shared goldens in `backend/tests/fixtures/system_builder/placement_cases.json`;
 * change the two together.
 */

import {
  type ConnectorFrame,
  type ConnectorGeometry,
  type StoredFrame,
  type Vec3,
  connectorFrame,
  footprintPoint,
} from "./frames";
import { type Pose, type Quat, canonicalRotation, clean, compose, rotate } from "./poses";

export const ASSUMED_BODY_HEIGHT_MM = 5;
export const CLEARANCE_MARGIN_MM = 5;

const S = Math.SQRT1_2;
const QUARTER_TURNS: Quat[] = [
  [0, 0, 0, 1],
  [0, 0, S, S],
  [0, 0, 1, 0],
  [0, 0, S, -S],
];
const FLIP_X: Quat = [1, 0, 0, 0];

/** Body bounds in the footprint's own frame, z measured outward from the mounting surface. */
export interface BodyBounds {
  minMm: Vec3;
  maxMm: Vec3;
}

/** One end of a B2B pair. `stored` null = the inference. */
export interface MateEnd {
  geometry: ConnectorGeometry;
  thicknessMm: number | null;
  stored?: StoredFrame | null;
  bodyMm?: BodyBounds | null;
}

export interface MateResult {
  /** B's board frame in A's board frame. */
  pose: Pose;
  quarterTurns: number;
  stackHeightMm: number;
  heightSource: "link" | "clearance";
}

export interface Residual {
  offsetMm: Vec3;
  distanceMm: number;
  lateralMm: number;
  angleDeg: number;
}

const framePose = (frame: ConnectorFrame): Pose => ({ translationMm: [...frame.originMm], rotation: [...frame.rotation] });

export function inverse(pose: Pose): Pose {
  const [x, y, z, w] = pose.rotation;
  const back: Quat = [-x, -y, -z, w];
  const moved = rotate(back, pose.translationMm);
  return { translationMm: moved.map((c) => clean(-c)) as Vec3, rotation: canonicalRotation(back) };
}

/** A board-frame point in the connector frame's coordinates. */
function local(frame: ConnectorFrame, point: readonly number[]): Vec3 {
  const d = [0, 1, 2].map((i) => point[i] - frame.originMm[i]);
  return [frame.xAxis, frame.yAxis, frame.zAxis].map((axis) => d[0] * axis[0] + d[1] * axis[1] + d[2] * axis[2]) as Vec3;
}

/** A point in `F_b` coordinates → `F_a` coordinates under `T(0,0,h)·Rx(180°)·Rz(k·90°)`. */
function mated(point: readonly number[], k: number, h = 0): Vec3 {
  let [x, y] = point;
  for (let turn = 0; turn < ((k % 4) + 4) % 4; turn += 1) [x, y] = [-y, x];
  return [x, -y, h - point[2]];
}

function padNames(geometry: ConnectorGeometry, frame: ConnectorFrame): Map<string, [number, number]> {
  const groups = new Map<string, Vec3[]>();
  for (const pad of geometry.pads) {
    if (!pad.pad) continue;
    const list = groups.get(pad.pad) ?? [];
    list.push(local(frame, [pad.positionMm[0], pad.positionMm[1], frame.originMm[2]]));
    groups.set(pad.pad, list);
  }
  const out = new Map<string, [number, number]>();
  for (const [name, points] of groups) {
    out.set(name, [0, 1].map((i) => points.reduce((sum, p) => sum + p[i], 0) / points.length) as [number, number]);
  }
  return out;
}

/** §14.5 default `k` on the *unturned* frames: least summed distance between same-named pads, ties to the lower k. */
export function padOneTurns(
  geometryA: ConnectorGeometry,
  frameA: ConnectorFrame,
  geometryB: ConnectorGeometry,
  frameB: ConnectorFrame,
): number {
  const padsA = padNames(geometryA, frameA);
  const padsB = padNames(geometryB, frameB);
  const common = [...padsA.keys()].filter((name) => padsB.has(name)).sort();
  if (!common.length) return 0;
  let best = 0;
  let bestSum = Number.POSITIVE_INFINITY;
  for (let k = 0; k < 4; k += 1) {
    let total = 0;
    for (const name of common) {
      const b = padsB.get(name)!;
      const a = padsA.get(name)!;
      const moved = mated([b[0], b[1], 0], k);
      total += Math.hypot(moved[0] - a[0], moved[1] - a[1]);
    }
    if (total < bestSum - 1e-6) {
      best = k;
      bestSum = total;
    }
  }
  return best;
}

/** The eight corners of a connector body in the board frame (see the Python half for the rules). */
export function bodyCorners(geometry: ConnectorGeometry, thicknessMm: number | null, bounds?: BodyBounds | null): Vec3[] {
  let lo: number[];
  let hi: number[];
  if (bounds) {
    lo = [...bounds.minMm];
    hi = [...bounds.maxMm];
  } else if (geometry.courtyard) {
    lo = [...geometry.courtyard.minMm, 0];
    hi = [...geometry.courtyard.maxMm, ASSUMED_BODY_HEIGHT_MM];
  } else {
    const pads = geometry.pads.map((p) => footprintPoint(geometry, p.positionMm));
    lo = [Math.min(...pads.map((p) => p[0])), Math.min(...pads.map((p) => p[1])), 0];
    hi = [Math.max(...pads.map((p) => p[0])), Math.max(...pads.map((p) => p[1])), ASSUMED_BODY_HEIGHT_MM];
  }
  const a = (geometry.rotationDeg * Math.PI) / 180;
  const [px, py] = geometry.positionMm;
  const half = (thicknessMm ?? 0) / 2;
  const top = geometry.side === "top";
  const corners: Vec3[] = [];
  for (let i = 0; i < 8; i += 1) {
    const [x, y, z] = [0, 1, 2].map((k) => ((i >> k) & 1 ? hi : lo)[k]);
    corners.push([px + x * Math.cos(a) - y * Math.sin(a), py + x * Math.sin(a) + y * Math.cos(a), top ? half + z : -half - z]);
  }
  return corners;
}

function boxIn(frame: ConnectorFrame, corners: readonly Vec3[]): [number[], number[]] {
  const points = corners.map((c) => local(frame, c));
  return [
    [0, 1, 2].map((i) => Math.min(...points.map((p) => p[i]))),
    [0, 1, 2].map((i) => Math.max(...points.map((p) => p[i]))),
  ];
}

/** §14.5 fallback `h`: least separation at which the two bodies' boxes stop overlapping, plus the margin. */
export function clearanceHeight(
  frameA: ConnectorFrame,
  cornersA: readonly Vec3[],
  frameB: ConnectorFrame,
  cornersB: readonly Vec3[],
  k: number,
): number {
  const [loA, hiA] = boxIn(frameA, cornersA);
  const [loB, hiB] = boxIn(frameB, cornersB);
  const moved = [loB[0], hiB[0]].flatMap((x) => [loB[1], hiB[1]].map((y) => mated([x, y, 0], k)));
  const overlap = [0, 1].every(
    (i) => Math.min(...moved.map((p) => p[i])) < hiA[i] - 1e-9 && Math.max(...moved.map((p) => p[i])) > loA[i] + 1e-9,
  );
  const touching = overlap ? hiA[2] + hiB[2] : 0;
  return clean(Math.max(touching, 0) + CLEARANCE_MARGIN_MM);
}

const unturned = (stored: StoredFrame | null | undefined): StoredFrame | null =>
  stored ? { axis: stored.axis, quarterTurns: 0 } : null;

/** B's board frame in A's board frame for one B2B pair, or null when either frame is unknown. */
export function mate(a: MateEnd, b: MateEnd, stackHeightMm?: number | null): MateResult | null {
  const frameA = connectorFrame(a.geometry, a.thicknessMm, a.stored);
  const frameB = connectorFrame(b.geometry, b.thicknessMm, b.stored);
  if (!frameA || !frameB) return null;
  const k = padOneTurns(
    a.geometry,
    connectorFrame(a.geometry, a.thicknessMm, unturned(a.stored))!,
    b.geometry,
    connectorFrame(b.geometry, b.thicknessMm, unturned(b.stored))!,
  );
  let h: number;
  let heightSource: MateResult["heightSource"];
  if (stackHeightMm != null) {
    h = stackHeightMm;
    heightSource = "link";
  } else {
    h = clearanceHeight(
      frameA,
      bodyCorners(a.geometry, a.thicknessMm, a.bodyMm),
      frameB,
      bodyCorners(b.geometry, b.thicknessMm, b.bodyMm),
      k,
    );
    heightSource = "clearance";
  }
  const joint = compose(
    { translationMm: [0, 0, h], rotation: canonicalRotation(FLIP_X) },
    { translationMm: [0, 0, 0], rotation: QUARTER_TURNS[k] },
  );
  const pose = compose(compose(framePose(frameA), joint), inverse(framePose(frameB)));
  return { pose, quarterTurns: k, stackHeightMm: clean(h), heightSource };
}

/** How far placed board B is from where the pair's `mate` result puts it (SYS-V11 input); offsets on A's connector axes. */
export function residual(aWorld: Pose, bWorld: Pose, a: MateEnd, b: MateEnd, result: MateResult): Residual {
  const frameA = connectorFrame(a.geometry, a.thicknessMm, a.stored)!;
  const frameB = framePose(connectorFrame(b.geometry, b.thicknessMm, b.stored)!);
  const expected = compose(compose(aWorld, result.pose), frameB);
  const actual = compose(bWorld, frameB);
  const worldA = compose(aWorld, framePose(frameA));
  const delta = [0, 1, 2].map((i) => actual.translationMm[i] - expected.translationMm[i]);
  const [qx, qy, qz, qw] = worldA.rotation;
  const offset = rotate([-qx, -qy, -qz, qw], delta);
  const turn = compose(inverse({ translationMm: [0, 0, 0], rotation: expected.rotation }), {
    translationMm: [0, 0, 0],
    rotation: actual.rotation,
  }).rotation;
  const angle = (2 * Math.atan2(Math.hypot(turn[0], turn[1], turn[2]), Math.abs(turn[3])) * 180) / Math.PI;
  return {
    offsetMm: offset.map(clean) as Vec3,
    distanceMm: clean(Math.hypot(...delta)),
    lateralMm: clean(Math.hypot(offset[0], offset[1])),
    angleDeg: clean(angle),
  };
}

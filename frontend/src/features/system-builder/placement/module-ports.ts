/**
 * Connectors placed on a catalog module (CONTRACTS_P2 §3.6, D-P2-40).
 *
 *     footprint pose = P · F_part⁻¹
 *
 * `P` is the face frame (a point on the module model's face, its outward normal,
 * a quarter-turn); `F_part` is the part footprint's mating frame at zero
 * thickness. The twin of `backend/app/services/systems/placement/module_ports.py`.
 * Both run the shared goldens in
 * `backend/tests/fixtures/system_builder/placement_cases.json`; change the two together.
 */

import { type ConnectorFrame, type ConnectorGeometry, type MatingAxis, type Vec3, connectorFrame, quaternion } from "./frames";
import { inverse } from "./mate";
import { type Pose, clean, compose } from "./poses";

/** A footprint whose mating axis can't be inferred mates out of its top face. */
export const FALLBACK_AXIS: MatingAxis = "top";

export interface ModulePlacement {
  originMm: Vec3;
  /** The face's outward normal in the module frame (unit length once stored). */
  normal: Vec3;
  quarterTurns: number;
  /** Overrides the part's inferred mating axis. */
  axis: MatingAxis | null;
}

export interface FaceFrame {
  originMm: Vec3;
  xAxis: Vec3;
  yAxis: Vec3;
  zAxis: Vec3;
  rotation: [number, number, number, number];
}

const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: readonly number[], b: readonly number[]): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (v: readonly number[]): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
};

/**
 * `P`: origin on the face, z the outward normal, x module +x projected onto the face (+y when the
 * face looks more along x than y), then `quarterTurns` about z (x → y).
 */
export function faceFrame(placement: Pick<ModulePlacement, "originMm" | "normal" | "quarterTurns">): FaceFrame {
  const z = normalize(placement.normal);
  const reference: Vec3 = Math.abs(z[0]) <= Math.abs(z[1]) + 1e-9 ? [1, 0, 0] : [0, 1, 0];
  let x = normalize(reference.map((r, i) => r - dot(reference, z) * z[i]));
  let y = cross(z, x);
  for (let turn = 0; turn < (((placement.quarterTurns || 0) % 4) + 4) % 4; turn += 1) {
    [x, y] = [y, x.map((c) => -c) as Vec3];
  }
  return { originMm: [...placement.originMm] as Vec3, xAxis: x, yAxis: y, zAxis: z, rotation: quaternion(x, y, z) };
}

/** `F_part`: the footprint's mating frame at zero thickness (inferred axis, an override, else `top`). */
export function partFrame(geometry: ConnectorGeometry | null | undefined, axis?: MatingAxis | null): ConnectorFrame | null {
  if (!geometry?.pads.length) return null;
  const stored = axis ? { axis, quarterTurns: 0 } : null;
  return connectorFrame(geometry, 0, stored) ?? connectorFrame(geometry, 0, { axis: FALLBACK_AXIS, quarterTurns: 0 });
}

/** Where the part's footprint origin sits in the module frame: `P · F_part⁻¹`. */
export function footprintPose(placement: ModulePlacement, geometry: ConnectorGeometry | null | undefined): Pose | null {
  const frame = partFrame(geometry, placement.axis);
  if (!frame) return null;
  const face = faceFrame(placement);
  const pose = compose(
    { translationMm: face.originMm, rotation: face.rotation },
    inverse({ translationMm: [...frame.originMm] as Vec3, rotation: [...frame.rotation] as Pose["rotation"] }),
  );
  return { translationMm: pose.translationMm.map(clean) as Vec3, rotation: pose.rotation };
}

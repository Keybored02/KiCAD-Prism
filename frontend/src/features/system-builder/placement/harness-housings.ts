/**
 * Housings at harness ends for the System 3D view (CONTRACTS_P2 §20.17, SB2-47).
 *
 * Each posed end draws its mating housing in the end's mating frame (§17.6):
 * the part's model under its alignment (§18.2) when the end has one, else a
 * proxy box, the connector body's footprint × the 8 mm default housing depth
 * behind the mating face. Drawing only: no finding reads these boxes.
 */

import { connectorFrame } from "./frames";
import { alignmentPose } from "./harness-ends";
import type { Route, SceneHarness, SceneHousing } from "./harness-route";
import { bodyCorners, boxIn } from "./mate";
import { matrix as poseMatrix } from "./poses";

export interface HousingItem {
  /** `level/harnessId/endId`. */
  key: string;
  harness: string;
  end: string;
  /** Column-major, mm. For a model: mating frame · alignment (model units still to apply); for a proxy: onto the unit box. */
  matrix: number[];
  model: SceneHousing | null;
}

function multiply(a: readonly number[], b: readonly number[]): number[] {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) sum += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = sum;
    }
  }
  return out;
}

const boxMatrix = (lo: readonly number[], hi: readonly number[]) =>
  [hi[0] - lo[0], 0, 0, 0, 0, hi[1] - lo[1], 0, 0, 0, 0, hi[2] - lo[2], 0, lo[0], lo[1], lo[2], 1];

/**
 * The proxy box in the housing's mating frame: the connector body's x–y extent
 * (the housing frame is the connector frame turned half a turn about x, so y
 * flips) and `depthMm` behind the mating face.
 */
export function proxyBox(end: SceneHarness["ends"][number], depthMm: number): [number[], number[]] | null {
  const connector = end.connector;
  const frame = connector ? connectorFrame(connector.geometry, connector.thicknessMm, connector.stored) : null;
  if (!connector || !frame) return null;
  const [lo, hi] = boxIn(frame, bodyCorners(connector.geometry, connector.thicknessMm));
  return [[lo[0], -hi[1], -depthMm], [hi[0], -lo[1], 0]];
}

/** The housings of one routed harness. */
export function harnessHousings(harness: SceneHarness, routed: Route): HousingItem[] {
  const prefix = `${harness.level || ""}/${harness.id}`;
  const out: HousingItem[] = [];
  for (const end of [...harness.ends].sort((a, b) => a.ordinal - b.ordinal)) {
    const posed = routed.ends[end.id];
    if (!posed) continue;
    const mating = poseMatrix(posed.pose);
    const base = { key: `${prefix}/${end.id}`, harness: prefix, end: end.id };
    if (end.housing?.boundsMm) {
      const { pose, scale } = alignmentPose(end.housing.alignment);
      const aligned = multiply(poseMatrix(pose), [scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, 1]);
      out.push({ ...base, matrix: multiply(mating, aligned), model: end.housing });
      continue;
    }
    const box = proxyBox(end, posed.depthMm);
    if (box) out.push({ ...base, matrix: multiply(mating, boxMatrix(...box)), model: null });
  }
  return out;
}

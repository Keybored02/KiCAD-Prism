/**
 * Connector mating frames: inference (CONTRACTS_P2 §15.1) and `F_c` (§14.4).
 *
 * The twin of `backend/app/services/systems/placement/frames.py`. Both run the
 * shared goldens in `backend/tests/fixtures/system_builder/placement_cases.json`;
 * change the two together.
 */

export type MatingAxis = "top" | "bottom" | "+x" | "-x" | "+y" | "-y";
export type Confidence = "high" | "medium" | "low";
export type Vec3 = [number, number, number];

export interface PadGeometry {
  pad: string;
  positionMm: [number, number];
  sizeMm: [number, number];
  shape: string;
  tht: boolean;
}

/** Extractor v6 `geometry` of one component (§14.6). */
export interface ConnectorGeometry {
  side: "top" | "bottom";
  positionMm: [number, number];
  rotationDeg: number;
  footprintName: string;
  pads: PadGeometry[];
  courtyard: { minMm: [number, number]; maxMm: [number, number] } | null;
  model: { path: string; offsetMm: Vec3; rotationDeg: Vec3; scale: Vec3 } | null;
}

export interface Inference {
  axis: MatingAxis | null;
  confidence: Confidence;
  reasons: string[];
}

export interface StoredFrame {
  axis: MatingAxis;
  quarterTurns: number;
}

export interface ConnectorFrame {
  axis: MatingAxis;
  quarterTurns: number;
  originMm: Vec3;
  xAxis: Vec3;
  yAxis: Vec3;
  zAxis: Vec3;
  /** Unit quaternion `[x, y, z, w]`, canonical `w ≥ 0`. */
  rotation: [number, number, number, number];
}

const OVER_PADS_MARGIN_MM = 1.0;
const OFF_PADS_MIN_MM = 0.5;
const AXIS_TOLERANCE_DEG = 20.0;
const SQUARE_TOLERANCE = 0.05;
const VERTICAL = /_vertical(_|$)/i;
const RIGHT_ANGLE = /_(horizontal|rightangle|right_angle|angled)(_|$)|_RA(_|$)/i;

const radians = (degrees: number) => (degrees * Math.PI) / 180;

function naturalKey(pad: string): [string, number, string] {
  const head = pad.replace(/[0-9]+$/, "");
  const tail = pad.slice(head.length);
  return [head, tail ? Number.parseInt(tail, 10) : -1, pad];
}

/** Pad or reference order: letters, then the trailing number (J2 before J10). */
export function compareNatural(a: string, b: string): number {
  const [ha, na, pa] = naturalKey(a);
  const [hb, nb, pb] = naturalKey(b);
  if (ha !== hb) return ha < hb ? -1 : 1;
  if (na !== nb) return na - nb;
  return pa < pb ? -1 : pa > pb ? 1 : 0;
}

/** Board frame → the footprint's own frame (y up, before rotation). */
export function footprintPoint(geometry: ConnectorGeometry, point: [number, number]): [number, number] {
  const a = radians(geometry.rotationDeg);
  const dx = point[0] - geometry.positionMm[0];
  const dy = point[1] - geometry.positionMm[1];
  return [dx * Math.cos(a) + dy * Math.sin(a), -dx * Math.sin(a) + dy * Math.cos(a)];
}

function boardDirection(geometry: ConnectorGeometry, local: [number, number]): Vec3 {
  const a = radians(geometry.rotationDeg);
  return [local[0] * Math.cos(a) - local[1] * Math.sin(a), local[0] * Math.sin(a) + local[1] * Math.cos(a), 0];
}

function distinctPadPositions(geometry: ConnectorGeometry): number {
  return new Set(geometry.pads.map((p) => `${p.positionMm[0]},${p.positionMm[1]}`)).size;
}

/**
 * The pads `F_c` is built from: the numbered ones, or every pad when none is numbered.
 * Unnumbered pads are mounting and alignment holes, often off-centre, which would skew the frame.
 */
function framePads(geometry: ConnectorGeometry): PadGeometry[] {
  const named = geometry.pads.filter((p) => p.pad);
  return named.length ? named : geometry.pads;
}

function padCentroid(geometry: ConnectorGeometry): [number, number] {
  const pads = framePads(geometry);
  const n = pads.length;
  return [pads.reduce((sum, p) => sum + p.positionMm[0], 0) / n, pads.reduce((sum, p) => sum + p.positionMm[1], 0) / n];
}

function localAxis(x: number, y: number): MatingAxis | null {
  const angle = (Math.atan2(y, x) * 180) / Math.PI;
  const nearest = roundHalfEven(angle / 90) * 90;
  if (Math.abs(angle - nearest) > AXIS_TOLERANCE_DEG) return null;
  const axes: Record<string, MatingAxis> = { "0": "+x", "90": "+y", "180": "-x", "-180": "-x", "-90": "-y" };
  return axes[String(nearest === 0 ? 0 : nearest)];
}

/** Python's `round` (banker's rounding) so both halves pick the same axis on exact halves. */
function roundHalfEven(value: number): number {
  const floor = Math.floor(value);
  const diff = value - floor;
  if (diff > 0.5) return floor + 1;
  if (diff < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

/** §15.1: `{axis, confidence, reasons}`; `axis` is null when confidence is `low`. */
export function inferMating(geometry: ConnectorGeometry | null | undefined): Inference {
  const result = (axis: MatingAxis | null, confidence: Confidence, ...reasons: string[]): Inference => ({
    axis: confidence === "low" ? null : axis,
    confidence,
    reasons,
  });
  if (!geometry || distinctPadPositions(geometry) < 2) return result(null, "low", "too_few_pads");
  const verticalSide: MatingAxis = geometry.side === "top" ? "top" : "bottom";
  const name = geometry.footprintName ?? "";
  const namedVertical = VERTICAL.test(name);
  const namedRightAngle = RIGHT_ANGLE.test(name);
  const courtyard = geometry.courtyard;
  if (!courtyard) {
    return namedVertical
      ? result(verticalSide, "medium", "name_vertical", "no_courtyard")
      : result(null, "low", "no_courtyard");
  }

  const local = geometry.pads.map((p) => footprintPoint(geometry, p.positionMm));
  const xs = local.map(([x]) => x);
  const ys = local.map(([, y]) => y);
  const centroid: [number, number] = [xs.reduce((a, b) => a + b, 0) / xs.length, ys.reduce((a, b) => a + b, 0) / ys.length];
  const body: [number, number] = [(courtyard.minMm[0] + courtyard.maxMm[0]) / 2, (courtyard.minMm[1] + courtyard.maxMm[1]) / 2];
  const over =
    Math.min(...xs) - OVER_PADS_MARGIN_MM <= body[0] && body[0] <= Math.max(...xs) + OVER_PADS_MARGIN_MM &&
    Math.min(...ys) - OVER_PADS_MARGIN_MM <= body[1] && body[1] <= Math.max(...ys) + OVER_PADS_MARGIN_MM;
  const offset: [number, number] = [body[0] - centroid[0], body[1] - centroid[1]];
  const sideAxis = !over && Math.hypot(...offset) >= OFF_PADS_MIN_MM ? localAxis(...offset) : null;

  if (namedVertical) {
    return over
      ? result(verticalSide, "high", "name_vertical", "body_over_pads")
      : result(null, "low", "name_vertical", "name_conflicts_geometry");
  }
  if (namedRightAngle) {
    return sideAxis
      ? result(sideAxis, "high", "name_right_angle", "body_off_pads")
      : result(null, "low", "name_right_angle", "name_conflicts_geometry");
  }
  if (over) return result(verticalSide, "medium", "body_over_pads");
  if (sideAxis) return result(sideAxis, "medium", "body_off_pads");
  return result(null, "low", "body_ambiguous");
}

// ---------------------------------------------------------------------------
// F_c (§14.4)

function normalize<T extends number[]>(v: T): T {
  const length = Math.sqrt(v.reduce((sum, c) => sum + c * c, 0));
  return v.map((c) => c / length) as T;
}

const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((sum, c, i) => sum + c * b[i], 0);

function padOne(geometry: ConnectorGeometry): PadGeometry {
  const named = geometry.pads.filter((p) => p.pad);
  const one = named.find((p) => p.pad === "1");
  if (one) return one;
  return named.length ? [...named].sort((a, b) => compareNatural(a.pad, b.pad))[0] : geometry.pads[0];
}

function principalAxis(geometry: ConnectorGeometry): Vec3 {
  const [cx, cy] = padCentroid(geometry);
  const pads = framePads(geometry);
  const n = pads.length;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of pads) {
    sxx += (p.positionMm[0] - cx) ** 2;
    syy += (p.positionMm[1] - cy) ** 2;
    sxy += (p.positionMm[0] - cx) * (p.positionMm[1] - cy);
  }
  sxx /= n;
  syy /= n;
  sxy /= n;
  const halfTrace = (sxx + syy) / 2;
  const det = sxx * syy - sxy * sxy;
  const spread = Math.sqrt(Math.max(halfTrace * halfTrace - det, 0));
  const large = halfTrace + spread;
  const small = halfTrace - spread;
  if (large <= 1e-12 || large - small <= SQUARE_TOLERANCE * large) return boardDirection(geometry, [1, 0]);
  if (Math.abs(sxy) > 1e-12) return normalize<Vec3>([large - syy, sxy, 0]);
  return sxx >= syy ? [1, 0, 0] : [0, 1, 0];
}

function matingAxis(geometry: ConnectorGeometry, axis: MatingAxis): Vec3 {
  if (axis === "top") return [0, 0, 1];
  if (axis === "bottom") return [0, 0, -1];
  const sign = axis[0] === "-" ? -1 : 1;
  return normalize(boardDirection(geometry, axis[1] === "x" ? [sign, 0] : [0, sign]));
}

/** Rotation matrix with these columns → unit quaternion `[x, y, z, w]`, canonical `w ≥ 0`. */
export function quaternion(xAxis: Vec3, yAxis: Vec3, zAxis: Vec3): [number, number, number, number] {
  const [m00, m10, m20] = xAxis;
  const [m01, m11, m21] = yAxis;
  const [m02, m12, m22] = zAxis;
  const trace = m00 + m11 + m22;
  let q: [number, number, number, number];
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, 0.25 * s];
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    q = [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s];
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    q = [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s];
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    q = [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s];
  }
  q = normalize(q);
  const leading = [q[3], q[0], q[1], q[2]].find((c) => Math.abs(c) > 1e-12) ?? 1;
  return leading < 0 ? (q.map((c) => -c) as typeof q) : q;
}

/** `F_c` in the board frame, or null when no axis is known (a `low` inference and nothing stored). */
export function connectorFrame(
  geometry: ConnectorGeometry | null | undefined,
  thicknessMm: number | null | undefined,
  stored?: StoredFrame | null,
): ConnectorFrame | null {
  if (!geometry || geometry.pads.length === 0) return null;
  const axis = stored ? stored.axis : inferMating(geometry).axis;
  if (!axis) return null;
  const turns = stored ? (((stored.quarterTurns ?? 0) % 4) + 4) % 4 : 0;
  const [cx, cy] = padCentroid(geometry);
  const half = (thicknessMm ?? 0) / 2;
  const origin: Vec3 = [cx, cy, geometry.side === "top" ? half : -half];
  const z = matingAxis(geometry, axis);
  const principal = principalAxis(geometry);
  const along = dot(principal, z);
  let x: Vec3 = [principal[0] - along * z[0], principal[1] - along * z[1], principal[2] - along * z[2]];
  if (Math.sqrt(dot(x, x)) < 1e-9) x = [-z[1], z[0], 0];
  x = normalize(x);
  const pad = padOne(geometry).positionMm;
  if (dot([pad[0] - cx, pad[1] - cy, 0], x) > 1e-9) x = x.map((c) => -c) as Vec3;
  let y = cross(z, x);
  for (let turn = 0; turn < turns; turn += 1) {
    [x, y] = [y, x.map((c) => -c) as Vec3];
  }
  return { axis, quarterTurns: turns, originMm: origin, xAxis: x, yAxis: y, zAxis: z, rotation: quaternion(x, y, z) };
}

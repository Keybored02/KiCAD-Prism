/**
 * Harness curves: control polygons, centripetal Catmull-Rom, bend radius, arc length (CONTRACTS_P2 §17.8).
 *
 * The twin of `backend/app/services/systems/placement/harness_curves.py`; it must
 * produce the same samples. Both run the shared goldens in `placement_cases.json`
 * (`harnessCurves`); change the two together.
 */

import type { Vec3 } from "./frames";
import { HARNESS_SPEC } from "./harness-spec";
import type { Topology } from "./harness-topology";
import { clean } from "./poses";

const MAX_DEPTH = 12;
const MIN_DEPTH = 2;
const DUPLICATE_MM = 1e-9;

export interface Curve {
  controlMm: Vec3[];
  samplesMm: Vec3[];
  lengthMm: number;
  minRadiusMm: number | null;
  minRadiusAllowedMm: number;
  tightBend: { atMm: Vec3; radiusMm: number } | null;
}

export interface CurveEnd {
  exitMm: readonly number[];
  outward: readonly number[];
  legMm: readonly number[];
}

const sub = (a: readonly number[], b: readonly number[]): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dist = (a: readonly number[], b: readonly number[]) =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

function lerp(a: readonly number[], b: readonly number[], ta: number, tb: number, t: number): Vec3 {
  if (tb === ta) return [a[0], a[1], a[2]];
  const wa = (tb - t) / (tb - ta);
  const wb = (t - ta) / (tb - ta);
  return [wa * a[0] + wb * b[0], wa * a[1] + wb * b[1], wa * a[2] + wb * b[2]];
}

function span(p0: readonly number[], p1: readonly number[], p2: readonly number[], p3: readonly number[]) {
  const alpha = HARNESS_SPEC.catmullRomAlpha;
  const t0 = 0;
  const t1 = t0 + dist(p0, p1) ** alpha;
  const t2 = t1 + dist(p1, p2) ** alpha;
  const t3 = t2 + dist(p2, p3) ** alpha;
  return (u: number): Vec3 => {
    const t = t1 + u * (t2 - t1);
    const a1 = lerp(p0, p1, t0, t1, t);
    const a2 = lerp(p1, p2, t1, t2, t);
    const a3 = lerp(p2, p3, t2, t3, t);
    const b1 = lerp(a1, a2, t0, t2, t);
    const b2 = lerp(a2, a3, t1, t3, t);
    return lerp(b1, b2, t1, t2, t);
  };
}

function offChord(point: readonly number[], a: readonly number[], b: readonly number[]): number {
  const ab = sub(b, a);
  const ap = sub(point, a);
  const length = Math.sqrt(ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2]);
  if (length < 1e-12) return dist(point, a);
  const cross = [ab[1] * ap[2] - ab[2] * ap[1], ab[2] * ap[0] - ab[0] * ap[2], ab[0] * ap[1] - ab[1] * ap[0]];
  return Math.sqrt(cross[0] * cross[0] + cross[1] * cross[1] + cross[2] * cross[2]) / length;
}

/** Adaptive samples of the curve through `points` and, per sample, the span it ends. */
export function sample(points: readonly (readonly number[])[]): { samples: Vec3[]; spans: number[] } {
  const copy = (p: readonly number[]): Vec3 => [p[0], p[1], p[2]];
  if (points.length < 2) return { samples: points.map(copy), spans: points.map(() => 0) };
  const first = points[0];
  const last = points[points.length - 1];
  const ext = [
    sub([2 * first[0], 2 * first[1], 2 * first[2]], points[1]),
    ...points,
    sub([2 * last[0], 2 * last[1], 2 * last[2]], points[points.length - 2]),
  ];
  const samples: Vec3[] = [copy(first)];
  const spans: number[] = [0];
  for (let i = 0; i < points.length - 1; i += 1) {
    const at = span(ext[i], ext[i + 1], ext[i + 2], ext[i + 3]);
    const split = (u0: number, u1: number, a: Vec3, b: Vec3, depth: number) => {
      const um = (u0 + u1) / 2;
      const mid = at(um);
      if (depth < MIN_DEPTH || (depth < MAX_DEPTH && offChord(mid, a, b) > HARNESS_SPEC.chordErrorMm)) {
        split(u0, um, a, mid, depth + 1);
        split(um, u1, mid, b, depth + 1);
      } else {
        samples.push(b);
        spans.push(i);
      }
    };
    split(0, 1, copy(points[i]), copy(points[i + 1]), 0);
  }
  return { samples, spans };
}

function radius(a: readonly number[], b: readonly number[], c: readonly number[]): number {
  const ab = dist(a, b);
  const bc = dist(b, c);
  const ca = dist(c, a);
  const u = sub(b, a);
  const v = sub(c, a);
  const cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const twiceArea = Math.sqrt(cross[0] * cross[0] + cross[1] * cross[1] + cross[2] * cross[2]);
  if (twiceArea < 1e-12) return Number.POSITIVE_INFINITY;
  return (ab * bc * ca) / (2 * twiceArea);
}

/** The smallest bend radius along the samples and where (Infinity, -1 when straight). */
export function tightest(samples: readonly (readonly number[])[]): { radius: number; at: number } {
  let best = Number.POSITIVE_INFINITY;
  let at = -1;
  for (let i = 1; i < samples.length - 1; i += 1) {
    const r = radius(samples[i - 1], samples[i], samples[i + 1]);
    if (r < best) {
      best = r;
      at = i;
    }
  }
  return { radius: best, at };
}

/** One segment's curve with bend-radius relaxation (see the Python half). */
export function curve(points: readonly (readonly number[])[], movable: readonly boolean[], diameterMm: number): Curve {
  const control: Vec3[] = [];
  const free: boolean[] = [];
  points.forEach((point, index) => {
    if (control.length && dist(control[control.length - 1], point) < DUPLICATE_MM) {
      free[free.length - 1] = free[free.length - 1] && movable[index];
      return;
    }
    control.push([point[0], point[1], point[2]]);
    free.push(Boolean(movable[index]));
  });
  const allowed = HARNESS_SPEC.minBendRadiusFactor * diameterMm;
  let { samples, spans } = sample(control);
  let { radius: tight, at: where } = tightest(samples);
  for (let iteration = 0; iteration < HARNESS_SPEC.bendRelaxIterations; iteration += 1) {
    if (tight >= allowed || where < 0) break;
    const spanIndex = spans[where];
    const candidates: number[] = [];
    for (let i = 1; i < control.length - 1; i += 1) if (free[i]) candidates.push(i);
    if (!candidates.length) break;
    const key = (i: number) => Math.min(Math.abs(i - spanIndex), Math.abs(i - (spanIndex + 1)));
    let target = candidates[0];
    for (const i of candidates) if (key(i) < key(target)) target = i;
    const mid = [0, 1, 2].map((k) => (control[target - 1][k] + control[target + 1][k]) / 2);
    control[target] = [0, 1, 2].map((k) => (control[target][k] + mid[k]) / 2) as Vec3;
    ({ samples, spans } = sample(control));
    ({ radius: tight, at: where } = tightest(samples));
  }
  let length = 0;
  for (let i = 0; i + 1 < samples.length; i += 1) length += dist(samples[i], samples[i + 1]);
  const cleanPoint = (p: readonly number[]) => p.map(clean) as Vec3;
  return {
    controlMm: control.map(cleanPoint),
    samplesMm: samples.map(cleanPoint),
    lengthMm: clean(length),
    minRadiusMm: Number.isFinite(tight) ? clean(tight) : null,
    minRadiusAllowedMm: clean(allowed),
    tightBend: where >= 0 && tight < allowed ? { atMm: cleanPoint(samples[where]), radiusMm: clean(tight) } : null,
  };
}

function head(end: CurveEnd): Vec3[] {
  const half = HARNESS_SPEC.bootMm / 2;
  const { exitMm: e, outward: o, legMm: l } = end;
  return [
    [e[0], e[1], e[2]],
    [e[0] + half * o[0], e[1] + half * o[1], e[2] + half * o[2]],
    [l[0], l[1], l[2]],
    [l[0] + half * o[0], l[1] + half * o[1], l[2] + half * o[2]],
  ];
}

/** A curve per segment of `tree` (see the Python half). */
export function harnessCurves(
  ends: Readonly<Record<string, CurveEnd>>,
  tree: Topology,
  waypoints: Readonly<Record<string, readonly (readonly number[])[]>> = {},
  pinned: Readonly<Record<string, readonly boolean[]>> = {},
): ({ segmentId: string } & Curve)[] {
  const position = new Map(tree.nodes.map((node) => [node.id, node.positionMm]));
  return tree.segments.map((segment) => {
    const side = (node: string): Vec3[] => (node in ends ? head(ends[node]) : [[...position.get(node)!] as Vec3]);
    const from = side(segment.from);
    const to = side(segment.to);
    const middle = (waypoints[segment.id] ?? []).map((p) => [p[0], p[1], p[2]] as Vec3);
    const points = [...from, ...middle, ...to.reverse()];
    const fixed = pinned[segment.id] ?? [];
    const movable = [...from.map(() => false), ...middle.map((_, i) => !fixed[i]), ...to.map(() => false)];
    return { segmentId: segment.id, ...curve(points, movable, segment.diameterMm) };
  });
}

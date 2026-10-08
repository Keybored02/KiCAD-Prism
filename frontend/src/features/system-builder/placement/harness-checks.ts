/**
 * Harness lengths and board collisions (CONTRACTS_P2 §17.10, SB2-46).
 *
 * The twin of `backend/app/services/systems/placement/harness_checks.py` (see
 * it for the rules). Only squares and one square root are used, never
 * `Math.hypot`, so the two halves find the same collisions bit for bit.
 */

import type { Vec3 } from "./frames";
import type { Matrix, Route } from "./harness-route";
import { HARNESS_SPEC } from "./harness-spec";

const GOLDEN = (Math.sqrt(5) - 1) / 2;
const SEARCH_STEPS = 60;

export interface Board {
  id: string;
  matrix: Matrix;
  minMm: readonly number[];
  maxMm: readonly number[];
}

export interface Collision {
  segmentId: string;
  board: string;
  distanceMm: number;
  radiusMm: number;
  atMm: Vec3;
  spans: number[];
}

export interface Lengths {
  bundleMm: number;
  estimatedMm: number;
  allowancePct: number;
  complete: boolean;
  wires: Record<string, { lengthMm: number; estimatedMm: number }>;
}

function boxDistance2(p: readonly number[], lo: readonly number[], hi: readonly number[]): number {
  let total = 0;
  for (let k = 0; k < 3; k += 1) {
    const d = p[k] < lo[k] ? lo[k] - p[k] : p[k] > hi[k] ? p[k] - hi[k] : 0;
    total += d * d;
  }
  return total;
}

/** `[distance, t]`: the least distance from the span a→b to the box lo–hi, and where along it. */
export function spanBoxDistance(a: readonly number[], b: readonly number[], lo: readonly number[], hi: readonly number[]): [number, number] {
  const f = (t: number) => boxDistance2([0, 1, 2].map((k) => a[k] + t * (b[k] - a[k])), lo, hi);
  let left = 0;
  let right = 1;
  let x1 = right - GOLDEN * (right - left);
  let x2 = left + GOLDEN * (right - left);
  let f1 = f(x1);
  let f2 = f(x2);
  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    if (f1 <= f2) {
      [right, x2, f2] = [x2, x1, f1];
      x1 = right - GOLDEN * (right - left);
      f1 = f(x1);
    } else {
      [left, x1, f1] = [x1, x2, f2];
      x2 = left + GOLDEN * (right - left);
      f2 = f(x2);
    }
  }
  let [bestT, best] = f1 <= f2 ? [x1, f1] : [x2, f2];
  for (const t of [0, 1]) {
    const value = f(t);
    if (value < best) [bestT, best] = [t, value];
  }
  return [Math.sqrt(best), bestT];
}

/** A world point in a rigid column-major matrix's frame: Rᵀ(p − t). */
function local(m: Matrix, p: readonly number[]): number[] {
  const d = [p[0] - m[12], p[1] - m[13], p[2] - m[14]];
  return [0, 1, 2].map((k) => m[k * 4] * d[0] + m[k * 4 + 1] * d[1] + m[k * 4 + 2] * d[2]);
}

function span(samples: readonly (readonly number[])[], i: number): number {
  const [a, b] = [samples[i], samples[i + 1]];
  let total = 0;
  for (let k = 0; k < 3; k += 1) total += (b[k] - a[k]) * (b[k] - a[k]);
  return Math.sqrt(total);
}

/** How many spans lie (at least partly) within the first boot of arc from the start (or the end). */
function exemptCount(samples: readonly (readonly number[])[], fromStart: boolean): number {
  const count = samples.length - 1;
  let arc = 0;
  for (let n = 0; n < count; n += 1) {
    const i = fromStart ? n : count - 1 - n;
    if (arc >= HARNESS_SPEC.bootMm) return n;
    arc += span(samples, i);
  }
  return count;
}

/** Every segment–board pair that collides, in curve then board order (see the Python half). */
export function collisions(routed: Route, boards: readonly Board[]): Collision[] {
  const margin = HARNESS_SPEC.boardCollisionMarginMm;
  const boxes = boards.map((board) => ({
    board,
    lo: [0, 1, 2].map((k) => board.minMm[k] - margin),
    hi: [0, 1, 2].map((k) => board.maxMm[k] + margin),
  }));
  const out: Collision[] = [];
  for (const curve of routed.curves) {
    const radius = curve.diameterMm / 2;
    const samples = curve.samplesMm;
    if (radius <= 0 || samples.length < 2) continue;
    const count = samples.length - 1;
    const exempt = new Map<string, Set<number>>();
    const exemptOn = (board: string, from: number, to: number) => {
      const set = exempt.get(board) ?? new Set<number>();
      for (let i = from; i < to; i += 1) set.add(i);
      exempt.set(board, set);
    };
    const start = routed.ends[curve.from];
    if (start) exemptOn(start.occurrence, 0, exemptCount(samples, true));
    const end = routed.ends[curve.to];
    if (end) exemptOn(end.occurrence, count - exemptCount(samples, false), count);
    for (const { board, lo, hi } of boxes) {
      const points = samples.map((p) => local(board.matrix, p));
      const skip = exempt.get(board.id);
      const spans: number[] = [];
      let best: [number, number, number] | null = null;
      for (let i = 0; i < count; i += 1) {
        if (skip?.has(i)) continue;
        const [distance, t] = spanBoxDistance(points[i], points[i + 1], lo, hi);
        if (distance < radius) {
          spans.push(i);
          if (!best || distance < best[0]) best = [distance, i, t];
        }
      }
      if (best) {
        const [distance, i, t] = best;
        const [a, b] = [samples[i], samples[i + 1]];
        out.push({
          segmentId: curve.segmentId, board: board.id, distanceMm: distance, radiusMm: radius,
          atMm: [0, 1, 2].map((k) => a[k] + t * (b[k] - a[k])) as Vec3, spans,
        });
      }
    }
  }
  return out;
}

/** Bundle and per-wire lengths with the service allowance (see the Python half). */
export function lengths(routed: Route, allowancePct: number | null = null): Lengths {
  const allowance = allowancePct === null ? HARNESS_SPEC.lengthAllowance : allowancePct / 100;
  const depth = new Map(Object.entries(routed.ends).map(([id, end]) => [id, end.depthMm]));
  let bundle = routed.curves.reduce((sum, curve) => sum + curve.lengthMm, 0);
  for (const value of depth.values()) bundle += value;
  const run = new Map<string, number>();
  for (const curve of routed.curves) for (const wire of curve.wires) run.set(wire, (run.get(wire) ?? 0) + curve.lengthMm);
  const wires: Lengths["wires"] = {};
  for (const wire of routed.wires) {
    const along = run.get(wire.id);
    if (along === undefined) continue;
    const length = along + depth.get(wire.from)! + depth.get(wire.to)!;
    wires[wire.id] = { lengthMm: length, estimatedMm: length * (1 + allowance) };
  }
  return { bundleMm: bundle, estimatedMm: bundle * (1 + allowance), allowancePct: allowance * 100, complete: routed.unplaced.length === 0, wires };
}

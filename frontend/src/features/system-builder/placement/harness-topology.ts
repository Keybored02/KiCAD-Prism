/**
 * Harness topology: runs, breakouts and per-segment wire sets (CONTRACTS_P2 §17.7).
 *
 * The twin of `backend/app/services/systems/placement/harness_topology.py`. Both
 * run the shared goldens in `placement_cases.json` (`harnessTopologies`); change
 * the two together.
 */

import type { Vec3 } from "./frames";
import { HARNESS_SPEC, wireOdMm } from "./harness-spec";
import { clean } from "./poses";

export interface TopologyEnd {
  id: string;
  legMm: Vec3;
  outward: Vec3;
}

export interface TopologyWire {
  id: string;
  from: { end: string };
  to: { end: string };
  gaugeAwg?: string | number | null;
}

export interface TopologyBreakout {
  id: string;
  positionMm: Vec3;
  ends?: string[];
}

export interface HarnessNode {
  id: string;
  kind: "end" | "breakout";
  positionMm: Vec3;
}

export interface HarnessSegment {
  id: string;
  from: string;
  to: string;
  wires: string[];
  diameterMm: number;
  assumedGauge: boolean;
}

export interface Topology {
  nodes: HarnessNode[];
  segments: HarnessSegment[];
  unplaced: string[];
}

const distance = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function bundle(wires: readonly TopologyWire[]): { diameterMm: number; assumedGauge: boolean } {
  if (!wires.length) return { diameterMm: 0, assumedGauge: false };
  let total = 0;
  let assumed = false;
  for (const wire of wires) {
    const { odMm, assumed: guessed } = wireOdMm(wire.gaugeAwg);
    total += odMm * odMm;
    assumed = assumed || guessed;
  }
  return { diameterMm: clean(HARNESS_SPEC.packingFactor * Math.sqrt(total)), assumedGauge: assumed };
}

function autoBreakout(ends: readonly TopologyEnd[], weight: ReadonlyMap<string, number>): Vec3 {
  let weights = ends.map((end) => Math.max(weight.get(end.id) ?? 0, 0));
  if (weights.every((w) => w === 0)) weights = ends.map(() => 1);
  const total = weights.reduce((sum, w) => sum + w, 0);
  const centre = [0, 1, 2].map((k) => ends.reduce((sum, end, i) => sum + weights[i] * end.legMm[k], 0) / total) as Vec3;
  const mean = [0, 1, 2].map((k) => ends.reduce((sum, end) => sum + end.outward[k], 0) / ends.length);
  const size = Math.hypot(...mean);
  if (size < 1e-9) return centre;
  return [0, 1, 2].map((k) => centre[k] + (HARNESS_SPEC.breakoutLiftMm * mean[k]) / size) as Vec3;
}

/** The harness tree (see the Python half for the rules). */
export function topology(
  ends: readonly TopologyEnd[],
  wires: readonly TopologyWire[],
  breakouts: readonly TopologyBreakout[] = [],
): Topology {
  const byEnd = new Map(ends.map((end) => [end.id, end]));
  const placed: TopologyWire[] = [];
  const unplaced: string[] = [];
  for (const wire of wires) {
    if (byEnd.has(wire.from.end) && byEnd.has(wire.to.end)) placed.push(wire);
    else unplaced.push(wire.id);
  }
  const weight = new Map<string, number>();
  for (const wire of placed) {
    for (const end of [wire.from.end, wire.to.end]) weight.set(end, (weight.get(end) ?? 0) + 1);
  }

  const cleanPoint = (point: readonly number[]) => point.map(clean) as Vec3;
  const nodes: HarnessNode[] = ends.map((end) => ({ id: end.id, kind: "end", positionMm: cleanPoint(end.legMm) }));
  const edges: [string, string][] = [];
  if (breakouts.length) {
    for (const b of breakouts) nodes.push({ id: b.id, kind: "breakout", positionMm: cleanPoint(b.positionMm) });
    const assigned = new Map<string, string>();
    for (const b of breakouts) {
      for (const endId of b.ends ?? []) if (byEnd.has(endId) && !assigned.has(endId)) assigned.set(endId, b.id);
    }
    for (const end of ends) {
      let target = assigned.get(end.id);
      if (target === undefined) {
        let best = breakouts[0];
        for (const b of breakouts) if (distance(b.positionMm, end.legMm) < distance(best.positionMm, end.legMm)) best = b;
        target = best.id;
      }
      edges.push([end.id, target]);
    }
    for (let i = 0; i + 1 < breakouts.length; i += 1) edges.push([breakouts[i].id, breakouts[i + 1].id]);
  } else if (ends.length === 2) {
    edges.push([ends[0].id, ends[1].id]);
  } else if (ends.length > 2) {
    nodes.push({ id: "auto", kind: "breakout", positionMm: cleanPoint(autoBreakout(ends, weight)) });
    for (const end of ends) edges.push([end.id, "auto"]);
  }

  const adjacency = new Map<string, string[]>(nodes.map((node) => [node.id, []]));
  for (const [a, b] of edges) {
    adjacency.get(a)!.push(b);
    adjacency.get(b)!.push(a);
  }
  const side = (start: string, cut: readonly [string, string]) => {
    const seen = new Set([start]);
    const stack = [start];
    while (stack.length) {
      const node = stack.pop()!;
      for (const other of adjacency.get(node)!) {
        const isCut = (node === cut[0] && other === cut[1]) || (node === cut[1] && other === cut[0]);
        if (isCut || seen.has(other)) continue;
        seen.add(other);
        stack.push(other);
      }
    }
    return seen;
  };

  const segments = edges.map(([a, b]): HarnessSegment => {
    const near = side(a, [a, b]);
    const crossing = placed.filter((w) => near.has(w.from.end) !== near.has(w.to.end));
    return { id: `${a}~${b}`, from: a, to: b, wires: crossing.map((w) => w.id), ...bundle(crossing) };
  });
  return { nodes, segments, unplaced };
}

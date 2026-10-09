/**
 * Stored harness nodes as inputs to the tree and the curves (CONTRACTS_P2 §17.9, SB2-45).
 *
 * The twin of `backend/app/services/systems/placement/harness_nodes.py`. Both
 * run the shared goldens in `placement_cases.json` (`harnessNodes`); change
 * the two together.
 */

import type { Vec3 } from "./frames";
import type { Topology, TopologyBreakout } from "./harness-topology";

export interface HarnessNodeInput {
  id: string;
  kind: "breakout" | "waypoint";
  positionMm: readonly number[];
  pinned?: boolean;
  order: number;
  ends?: readonly string[];
  between?: readonly string[] | null;
}

export interface SegmentWaypoints {
  waypoints: Record<string, Vec3[]>;
  pinned: Record<string, boolean[]>;
  unused: string[];
}

const point = (p: readonly number[]): Vec3 => [p[0], p[1], p[2]];

function ordered(nodes: readonly HarnessNodeInput[], kind: HarnessNodeInput["kind"]): HarnessNodeInput[] {
  return nodes
    .filter((node) => node.kind === kind)
    .sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** The breakouts in chain order, as `topology` takes them. */
export function breakouts(nodes: readonly HarnessNodeInput[]): TopologyBreakout[] {
  return ordered(nodes, "breakout").map((node) => ({ id: node.id, positionMm: point(node.positionMm), ends: [...(node.ends ?? [])] }));
}

/** Each segment's waypoints from its `from` node, which are pinned, and the unused ones (see the Python half). */
export function segmentWaypoints(tree: Pick<Topology, "segments">, nodes: readonly HarnessNodeInput[]): SegmentWaypoints {
  const pairKey = (a: string, b: string) => (a < b ? `${a}\n${b}` : `${b}\n${a}`);
  const groups = new Map<string, HarnessNodeInput[]>();
  for (const node of ordered(nodes, "waypoint")) {
    const [a, b] = node.between ?? [];
    const key = pairKey(a, b);
    const group = groups.get(key);
    if (group) group.push(node);
    else groups.set(key, [node]);
  }
  const out: SegmentWaypoints = { waypoints: {}, pinned: {}, unused: [] };
  const used = new Set<string>();
  for (const segment of tree.segments) {
    const key = pairKey(segment.from, segment.to);
    let group = groups.get(key);
    if (!group) continue;
    used.add(key);
    if (group[0].between?.[0] !== segment.from) group = [...group].reverse();
    out.waypoints[segment.id] = group.map((node) => point(node.positionMm));
    out.pinned[segment.id] = group.map((node) => Boolean(node.pinned));
  }
  for (const [key, group] of groups) if (!used.has(key)) out.unused.push(...group.map((node) => node.id));
  out.unused.sort();
  return out;
}

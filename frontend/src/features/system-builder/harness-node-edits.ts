/**
 * Edits to a harness's breakouts and waypoints (CONTRACTS_P2 §17.9, SB2-45b).
 *
 * The store takes the whole list (`PUT …/harnesses/{hid}/nodes`): breakouts in
 * chain order, then the waypoints of each node pair in order from the pair's
 * first node. These helpers keep a list in that shape; the move panel saves it.
 */

import type { HarnessNode, HarnessNodeInput as NodeInput } from "@/types/system";

type Vec3 = [number, number, number];

/** The automatic breakout's ID in the tree (§17.7); it is never stored. */
export const AUTO = "auto";

export function newNodeId(): string {
  return `shd_${crypto.randomUUID().replace(/-/g, "")}`;
}

const pairKey = (a: string, b: string) => (a < b ? `${a}\n${b}` : `${b}\n${a}`);

/** The stored nodes as the save takes them, in their order. */
export function nodeInputs(nodes: readonly HarnessNode[]): NodeInput[] {
  const sorted = [...nodes].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "breakout" ? -1 : 1;
    const pair = a.kind === "waypoint" ? pairKey(...a.between!).localeCompare(pairKey(...b.between!)) : 0;
    return pair || a.order - b.order;
  });
  return sorted.map(({ id, kind, positionMm, pinned, ends, between }) => ({ id, kind, positionMm, pinned, ends, between }));
}

/**
 * Store the automatic breakout where it is drawn, so it can be moved or carry
 * waypoints. With one breakout and no assignments every end joins it, so the
 * tree is unchanged. Returns the list and the new breakout's ID.
 */
export function storeAuto(nodes: readonly NodeInput[], positionMm: Vec3): { nodes: NodeInput[]; id: string } {
  const id = newNodeId();
  return { nodes: [{ id, kind: "breakout", positionMm, pinned: false, ends: [], between: null }, ...nodes], id };
}

/**
 * Add a waypoint at `positionMm` on the segment between `from` and `to`.
 * `along` places a point on that segment (larger is further from `from`); the
 * new waypoint goes between the existing ones by it.
 */
export function addWaypoint(
  nodes: readonly NodeInput[],
  from: string,
  to: string,
  positionMm: Vec3,
  along: (point: readonly number[]) => number,
): { nodes: NodeInput[]; id: string } {
  const key = pairKey(from, to);
  const group = nodes.filter((n) => n.kind === "waypoint" && pairKey(...n.between!) === key);
  const between = (group[0]?.between ?? [from, to]) as [string, string];
  const reversed = between[0] !== from;
  const id = newNodeId();
  const added: NodeInput = { id, kind: "waypoint", positionMm, pinned: false, ends: [], between };
  const score = (n: NodeInput) => (reversed ? -1 : 1) * along(n.positionMm);
  const ordered = [...group, added].map((n) => [score(n), n] as const).sort((a, b) => a[0] - b[0]).map(([, n]) => n);
  const grouped = new Set(group);
  const rest = nodes.filter((n) => !grouped.has(n));
  return { nodes: [...rest, ...ordered], id };
}

/** Add a breakout at the end of the chain; ends join their nearest breakout until assigned. */
export function addBreakout(nodes: readonly NodeInput[], positionMm: Vec3): { nodes: NodeInput[]; id: string } {
  const id = newNodeId();
  const lastBreakout = nodes.reduce((at, n, i) => (n.kind === "breakout" ? i + 1 : at), 0);
  const added: NodeInput = { id, kind: "breakout", positionMm, pinned: false, ends: [], between: null };
  return { nodes: [...nodes.slice(0, lastBreakout), added, ...nodes.slice(lastBreakout)], id };
}

export function moveNode(nodes: readonly NodeInput[], id: string, positionMm: Vec3): NodeInput[] {
  return nodes.map((n) => (n.id === id ? { ...n, positionMm } : n));
}

export function setPinned(nodes: readonly NodeInput[], id: string, pinned: boolean): NodeInput[] {
  return nodes.map((n) => (n.id === id && n.kind === "waypoint" ? { ...n, pinned } : n));
}

/** Distance along a segment's samples to the sample nearest `point` (mm): the `along` for `addWaypoint`. */
export function alongSamples(samples: readonly (readonly number[])[]): (point: readonly number[]) => number {
  const arc = [0];
  for (let i = 1; i < samples.length; i += 1) {
    const [a, b] = [samples[i - 1], samples[i]];
    arc.push(arc[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  return (point) => {
    let best = 0;
    let bestDistance = Infinity;
    samples.forEach((s, i) => {
      const distance = Math.hypot(s[0] - point[0], s[1] - point[1], s[2] - point[2]);
      if (distance < bestDistance) [best, bestDistance] = [i, distance];
    });
    return arc[best] ?? 0;
  };
}

/** Remove a node; removing a breakout removes the waypoints next to it. */
export function removeNode(nodes: readonly NodeInput[], id: string): NodeInput[] {
  return nodes.filter((n) => n.id !== id && !n.between?.includes(id));
}

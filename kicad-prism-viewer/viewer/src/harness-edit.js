// Harness node editing in the system scene (System Builder SB2-45b, CONTRACTS_P2 §17.9).
//
// Nodes are stored in their harness's level frame; the scene draws in world mm.
// These helpers move points between the two and lay an unsaved node move over
// the host's harnesses, so the tubes follow a drag before anything is saved.

export const AUTO = "auto"; // the automatic breakout (§17.7), drawn but never stored

const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** The level's world matrix (column-major, mm); the root level is the world. */
export function levelMatrix(harness, worldMatrixOf) {
  return harness.level ? worldMatrixOf(harness.level) : IDENTITY;
}

export function toWorld(m, p) {
  return [0, 1, 2].map((k) => m[k] * p[0] + m[4 + k] * p[1] + m[8 + k] * p[2] + m[12 + k]);
}

/** A world point in a rigid matrix's frame: Rᵀ(p − t). */
export function toLevel(m, p) {
  const d = [p[0] - m[12], p[1] - m[13], p[2] - m[14]];
  return [0, 1, 2].map((k) => m[k * 4] * d[0] + m[k * 4 + 1] * d[1] + m[k * 4 + 2] * d[2]);
}

/**
 * The harnesses with an unsaved node position applied: `preview` is
 * `{harness (key), id, positionMm (level frame)}`. Previewing the automatic
 * breakout stands a breakout in for it, which the tree treats the same way.
 */
export function withNodePreview(harnesses, preview, keyOf) {
  if (!preview) return harnesses;
  return harnesses.map((harness) => {
    if (keyOf(harness) !== preview.harness) return harness;
    const nodes = harness.nodes ?? [];
    // D-P2-53: a bend being dragged is a new node, pinned as it will be saved, so the tube follows it live.
    if (preview.insert) return { ...harness, nodes: [...nodes, preview.insert] };
    // A dragged node is saved pinned (D-P2-53): preview it pinned, so relaxation does not pull it off the cursor.
    const moved = preview.id === AUTO
      ? [{ id: AUTO, kind: "breakout", positionMm: preview.positionMm, pinned: false, order: -1, ends: [], between: null }, ...nodes]
      : nodes.map((node) => (node.id === preview.id
        ? { ...node, positionMm: preview.positionMm, pinned: node.kind === "waypoint" ? true : node.pinned }
        : node));
    return { ...harness, nodes: moved };
  });
}

export const BEND = "__bend__"; // the node a Route-mode drag is creating (D-P2-53)

/**
 * The node a bend drag creates, placed in the route where the press landed:
 * a waypoint between the picked segment's ends, ordered among that pair's
 * waypoints by how far along the segment it sits (as the host will store it),
 * or a breakout after the last one. `segment` is `{from, to, samplesMm}` in
 * world mm (flat or as triples); `atMm` the press, world mm; `toWorldMm` maps a
 * stored (level-frame) position to world mm.
 */
export function bendNode(nodes, { kind, segment, atMm, positionMm, toWorldMm }) {
  if (kind === "breakout") {
    const last = nodes.filter((node) => node.kind === "breakout").reduce((max, node) => Math.max(max, node.order ?? 0), -1);
    return { id: BEND, kind: "breakout", positionMm, pinned: false, order: last + 1, ends: [], between: null };
  }
  const flat = segment.samplesMm.flat();
  const along = (point) => {
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i + 2 < flat.length; i += 3) {
      const d = Math.hypot(flat[i] - point[0], flat[i + 1] - point[1], flat[i + 2] - point[2]);
      if (d < bestDistance) [best, bestDistance] = [i / 3, d];
    }
    return best;
  };
  const key = (pair) => [...pair].sort().join("|");
  const group = nodes
    .filter((node) => node.kind === "waypoint" && node.between && key(node.between) === key([segment.from, segment.to]))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const between = group[0]?.between ?? [segment.from, segment.to];
  const sign = between[0] === segment.from ? 1 : -1;
  const score = (point) => sign * along(point);
  const mine = score(atMm);
  const index = group.filter((node) => score(toWorldMm(node.positionMm)) < mine).length;
  const order = !group.length ? 0
    : index === 0 ? (group[0].order ?? 0) - 1
      : index === group.length ? (group[group.length - 1].order ?? 0) + 1
        : ((group[index - 1].order ?? 0) + (group[index].order ?? 0)) / 2;
  return { id: BEND, kind: "waypoint", positionMm, pinned: true, order, ends: [], between: [...between] };
}

/**
 * The handles to draw for one harness: its stored nodes and, when its tree has
 * one, the automatic breakout (where its tubes meet), all in world mm.
 */
export function nodeHandles(harness, tubes, matrix) {
  const handles = (harness.nodes ?? []).map((node) => ({
    id: node.id, kind: node.kind, pinned: Boolean(node.pinned), worldMm: toWorld(matrix, node.positionMm),
  }));
  const leg = tubes.find((tube) => tube.to === AUTO);
  if (leg) handles.push({ id: AUTO, kind: "breakout", pinned: false, auto: true, worldMm: leg.samplesMm.slice(-3) });
  return handles;
}

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
    const moved = preview.id === AUTO
      ? [{ id: AUTO, kind: "breakout", positionMm: preview.positionMm, pinned: false, order: -1, ends: [], between: null }, ...nodes]
      : nodes.map((node) => (node.id === preview.id ? { ...node, positionMm: preview.positionMm } : node));
    return { ...harness, nodes: moved };
  });
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

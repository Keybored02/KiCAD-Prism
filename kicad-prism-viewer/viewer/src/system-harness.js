// Proxy harnesses in the system scene (SB2-34), until M5 gives harnesses real
// geometry. A harness is drawn as straight segments between its ends' connectors:
// one segment for two ends, a star from a hub for more. Each segment carries the
// wires that run through it (its "net bitmask" until M5's per-segment wire sets),
// so a lit system net lights exactly the segments its wires use, and glows the
// ends it reaches. Pure: main.js projects and draws.

/** A harness's key in the scene: two copies of a child system share harness ids. */
export function harnessKey(harness) {
  return `${harness.level || ""}/${harness.id}`;
}

/**
 * The segments of a harness: `{key, a, b, wires}` with `a`/`b` an end id or
 * "hub", and `wires` the set of wire ids through it. Two ends: one segment
 * with every wire. More: one segment from the hub to each end, carrying the
 * wires that touch that end.
 */
export function harnessSegments(harness) {
  const ends = harness.ends || [];
  const wires = harness.wires || [];
  if (ends.length < 2) return [];
  if (ends.length === 2) {
    return [{ key: `${ends[0].id}~${ends[1].id}`, a: ends[0].id, b: ends[1].id, wires: new Set(wires.map((wire) => wire.id)) }];
  }
  return ends.map((end) => ({
    key: `hub~${end.id}`,
    a: "hub",
    b: end.id,
    wires: new Set(wires.filter((wire) => wire.from === end.id || wire.to === end.id).map((wire) => wire.id)),
  }));
}

/** Whether an emphasis wire reference `{harness, wire, occurrence?}` names a wire of this harness copy. */
export function refersTo(harness, ref) {
  if (!ref || ref.harness !== harness.id) return false;
  // A child system's harness exists once per copy: the wire's board tells the copies apart.
  return !harness.level || !ref.occurrence || ref.occurrence.startsWith(`${harness.level}/`);
}

/**
 * The lit wires of each harness: harness key → Map(wire id → colour), the
 * first set to light a wire keeping it (as for copper). `sets` are
 * `{color, wires: [{harness, wire, occurrence?}]}`.
 */
export function litHarnessWires(harnesses, sets) {
  const lit = new Map();
  for (const harness of harnesses || []) {
    const wires = new Map();
    const known = new Set((harness.wires || []).map((wire) => wire.id));
    for (const set of sets || []) {
      for (const ref of set.wires || []) {
        if (known.has(ref.wire) && refersTo(harness, ref) && !wires.has(ref.wire)) wires.set(ref.wire, set.color);
      }
    }
    if (wires.size) lit.set(harnessKey(harness), wires);
  }
  return lit;
}

/** A segment's colour: its first lit wire's, or null. */
export function segmentColor(segment, litWires) {
  if (!litWires) return null;
  for (const id of segment.wires) if (litWires.has(id)) return litWires.get(id);
  return null;
}

/** The ends a lit wire reaches glow: end id → colour. */
export function litEnds(harness, litWires) {
  const ends = new Map();
  if (!litWires) return ends;
  for (const wire of harness.wires || []) {
    const color = litWires.get(wire.id);
    if (!color) continue;
    if (!ends.has(wire.from)) ends.set(wire.from, color);
    if (!ends.has(wire.to)) ends.set(wire.to, color);
  }
  return ends;
}

/** The hub of a star: the centroid of the anchored ends, or null with fewer than two. */
export function hubPoint(points) {
  const placed = points.filter(Boolean);
  if (placed.length < 2) return null;
  return [0, 1, 2].map((k) => placed.reduce((sum, point) => sum + point[k], 0) / placed.length);
}

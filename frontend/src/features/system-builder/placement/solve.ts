/**
 * The tree solve: driving mates, auto poses and mate checks (CONTRACTS_P2 §14.9).
 *
 * The twin of `backend/app/services/systems/placement/solve.py`. Both run the
 * shared goldens in `backend/tests/fixtures/system_builder/placement_cases.json`;
 * change the two together.
 */

import { compareNatural } from "./frames";
import { type MateEnd, type MateResult, inverse, mate, residual } from "./mate";
import { type Bounds, type PlacedPose, type Pose, type PoseSource, canonicalRotation, clean, compose, defaultRow } from "./poses";

export const MISMATCH_MM = 0.2;
export const MISMATCH_DEG = 0.5;

const IDENTITY: Pose = { translationMm: [0, 0, 0], rotation: [0, 0, 0, 1] };

export interface SolveEnd {
  member: string;
  reference?: string | null;
  end: MateEnd;
  /** The connector's board in its member (an assembly's board); identity for a board. */
  inMember?: Pose | null;
}

export interface SolveMate {
  linkId: string;
  rows?: number | null;
  stackHeightMm?: number | null;
  a: SolveEnd;
  b: SolveEnd;
}

export interface DrivingMate {
  linkId: string;
  from: string;
  autoPose: PlacedPose;
  overridden: boolean;
}

export interface Mismatch {
  linkId: string;
  offsetMm: [number, number, number];
  lateralMm: number;
  axialMm: number;
  angleDeg: number;
}

export interface IgnoredOverride {
  member: string;
  linkId: string;
  reason: "not_a_usable_mate" | "root" | "unreachable";
}

export interface SolveResult {
  poses: Record<string, PlacedPose>;
  driving: Record<string, DrivingMate>;
  roots: string[];
  mismatches: Mismatch[];
  unusable: string[];
  ignoredOverrides: IgnoredOverride[];
}

const endWorld = (memberPose: Pose, end: SolveEnd): Pose => compose(memberPose, end.inMember ?? IDENTITY);

function relative(link: SolveMate, result: MateResult, fromSide: "a" | "b"): Pose {
  const aToB = compose(compose(link.a.inMember ?? IDENTITY, result.pose), inverse(link.b.inMember ?? IDENTITY));
  return fromSide === "a" ? aToB : inverse(aToB);
}

const cleanPose = (pose: Pose, source: PoseSource): PlacedPose => ({
  translationMm: pose.translationMm.map(clean) as PlacedPose["translationMm"],
  rotation: canonicalRotation(pose.rotation),
  source,
});

/** Lexicographic comparison of rank tuples (numbers, then natural strings, then plain strings). */
function compareRank(p: readonly [number, string, string], q: readonly [number, string, string]): number {
  return p[0] - q[0] || compareNatural(p[1], q[1]) || (p[2] < q[2] ? -1 : p[2] > q[2] ? 1 : 0);
}

/** Every member's pose with its `source`, the driving mates and the mate checks (see the Python half). */
export function solve(
  items: readonly (readonly [string, Bounds | null])[],
  stored: Readonly<Record<string, PlacedPose>>,
  connections: readonly (readonly [string, string])[],
  mates: readonly SolveMate[],
  overridesIn?: Readonly<Record<string, string>> | null,
): SolveResult {
  const overrides = new Map(Object.entries(overridesIn ?? {}));
  const order = new Map(items.map(([key], index) => [key, index]));
  const at = (key: string) => order.get(key) ?? order.size;
  const defaults = defaultRow(items);
  const degree = new Map(items.map(([key]) => [key, 0]));
  for (const [a, b] of connections) {
    if (degree.has(a)) degree.set(a, degree.get(a)! + 1);
    if (degree.has(b) && b !== a) degree.set(b, degree.get(b)! + 1);
  }

  const usable: [SolveMate, MateResult][] = [];
  const unusable: string[] = [];
  for (const link of mates) {
    const { a, b } = link;
    if (!order.has(a.member) || !order.has(b.member) || a.member === b.member) continue;
    const result = a.end.stored && b.end.stored ? mate(a.end, b.end, link.stackHeightMm) : null;
    if (result) usable.push([link, result]);
    else unusable.push(link.linkId);
  }
  const byId = new Map(usable.map((entry) => [entry[0].linkId, entry]));

  const ignored: IgnoredOverride[] = [];
  for (const [member, linkId] of [...overrides].sort((p, q) => at(p[0]) - at(q[0]))) {
    const entry = byId.get(linkId);
    if (!order.has(member) || !entry || (entry[0].a.member !== member && entry[0].b.member !== member)) {
      ignored.push({ member, linkId, reason: "not_a_usable_mate" });
      overrides.delete(member);
    }
  }

  const neighbours = new Map(items.map(([key]) => [key, new Set<string>()]));
  for (const [link] of usable) {
    neighbours.get(link.a.member)!.add(link.b.member);
    neighbours.get(link.b.member)!.add(link.a.member);
  }

  const poses: Record<string, PlacedPose> = {};
  // Every mated member where its mates put it, ignoring manual moves below the root.
  const designed: Record<string, Pose> = {};
  const driving: Record<string, DrivingMate> = {};
  const roots: string[] = [];
  const ownPose = (key: string): PlacedPose | null => (stored[key] ? cleanPose(stored[key], stored[key].source) : null);

  const seen = new Set<string>();
  for (const [start] of items) {
    if (seen.has(start) || !neighbours.get(start)!.size) continue;
    const group = [start];
    const queue = [start];
    seen.add(start);
    while (queue.length) {
      for (const other of [...neighbours.get(queue.shift()!)!].sort((p, q) => at(p) - at(q))) {
        if (seen.has(other)) continue;
        seen.add(other);
        group.push(other);
        queue.push(other);
      }
    }
    const free = group.filter((m) => !overrides.has(m));
    const candidates = free.length ? free : group;
    const root = [...candidates].sort((p, q) => degree.get(q)! - degree.get(p)! || at(p) - at(q))[0];
    roots.push(root);
    if (overrides.has(root)) {
      ignored.push({ member: root, linkId: overrides.get(root)!, reason: "root" });
      overrides.delete(root);
    }
    poses[root] = ownPose(root) ?? cleanPose(defaults[root], "default");
    designed[root] = poses[root];

    const placed = new Set([root]);
    while (placed.size < group.length) {
      let best: { rank: [number, string, string]; link: SolveMate; result: MateResult; near: "a" | "b"; x: string; y: string } | null =
        null;
      for (const [link, result] of usable) {
        for (const [near, far] of [
          ["a", "b"],
          ["b", "a"],
        ] as const) {
          const x = link[near].member;
          const y = link[far].member;
          if (!placed.has(x) || placed.has(y)) continue;
          if (overrides.has(y) && overrides.get(y) !== link.linkId) continue;
          const rank: [number, string, string] = [-(link.rows ?? 0), link[far].reference ?? "", link.linkId];
          if (!best || compareRank(rank, best.rank) < 0) best = { rank, link, result, near, x, y };
        }
      }
      if (!best) {
        const stuck = group.filter((m) => !placed.has(m) && overrides.has(m)).sort((p, q) => at(p) - at(q));
        if (!stuck.length) break;
        for (const member of stuck) {
          ignored.push({ member, linkId: overrides.get(member)!, reason: "unreachable" });
          overrides.delete(member);
        }
        continue;
      }
      const step = relative(best.link, best.result, best.near);
      const auto = compose(poses[best.x], step);
      designed[best.y] = compose(designed[best.x], step);
      poses[best.y] = ownPose(best.y) ?? cleanPose(auto, "auto");
      driving[best.y] = { linkId: best.link.linkId, from: best.x, autoPose: cleanPose(auto, "auto"), overridden: best.y in stored };
      placed.add(best.y);
    }
  }

  for (const [key] of items) {
    if (!poses[key]) poses[key] = ownPose(key) ?? cleanPose(defaults[key], "default");
  }

  // SYS-V11 judges the mated design: a board moved by hand shows as overridden, never as a mismatch.
  const drivingLinks = new Set(Object.values(driving).map((entry) => entry.linkId));
  const mismatches: Mismatch[] = [];
  for (const [link, result] of usable) {
    if (drivingLinks.has(link.linkId)) continue;
    const { a, b } = link;
    const got = residual(endWorld(designed[a.member], a), endWorld(designed[b.member], b), a.end, b.end, result);
    const axial = got.offsetMm[2];
    if (
      got.lateralMm > MISMATCH_MM ||
      got.angleDeg > MISMATCH_DEG ||
      (link.stackHeightMm != null && Math.abs(axial) > MISMATCH_MM)
    ) {
      mismatches.push({ linkId: link.linkId, offsetMm: got.offsetMm, lateralMm: got.lateralMm, axialMm: clean(axial), angleDeg: got.angleDeg });
    }
  }

  return { poses, driving, roots, mismatches, unusable, ignoredOverrides: ignored };
}

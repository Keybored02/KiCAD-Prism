import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { type Topology, type TopologyBreakout, type TopologyEnd, type TopologyWire, topology } from "./harness-topology";

interface Case {
  name: string;
  input: { ends: TopologyEnd[]; wires: TopologyWire[]; breakouts: TopologyBreakout[] };
  expected: Topology;
}

// The goldens are shared with the Python half (CONTRACTS_P2 §17.7).
const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
) as { tolerance: { mm: number }; harnessTopologies: Case[] };

describe("harness topology (shared goldens)", () => {
  it("has the full case list", () => {
    expect(golden.harnessTopologies.length).toBeGreaterThanOrEqual(6);
  });

  it.each(golden.harnessTopologies.map((c) => [c.name, c] as const))("replays %s", (_name, spec) => {
    const got = topology(spec.input.ends, spec.input.wires, spec.input.breakouts);
    const e = spec.expected;
    expect(got.nodes.map((n) => [n.id, n.kind])).toEqual(e.nodes.map((n) => [n.id, n.kind]));
    got.nodes.forEach((node, i) => node.positionMm.forEach((v, k) => expect(Math.abs(v - e.nodes[i].positionMm[k])).toBeLessThanOrEqual(golden.tolerance.mm)));
    expect(got.segments.map((s) => [s.id, s.wires, s.assumedGauge])).toEqual(e.segments.map((s) => [s.id, s.wires, s.assumedGauge]));
    got.segments.forEach((s, i) => expect(Math.abs(s.diameterMm - e.segments[i].diameterMm)).toBeLessThanOrEqual(golden.tolerance.mm));
    expect(got.unplaced).toEqual(e.unplaced);
  });
});

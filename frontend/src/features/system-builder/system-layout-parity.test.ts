import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { SystemDocument } from "@/types/system";

import { layoutInputs } from "./diagram-model";
import { layoutSystem, routeWires } from "./system-layout";

// SB2-71: the ICD's block diagram (backend/app/services/systems/layout.py) and this canvas lay a
// system out the same way. Both suites check this fixture; UPDATE_LAYOUT_PARITY=1 rewrites `expected`.
const FIXTURE = resolve(__dirname, "../../../../backend/tests/fixtures/system_builder/layout_parity.json");

interface ParityCase {
  name: string;
  document: SystemDocument;
  positions: Record<string, { x: number; y: number }>;
  expected?: unknown;
}

const round = (value: number) => Math.round(value * 1000) / 1000;

function summarise(document: SystemDocument, positions: ParityCase["positions"]) {
  const inputs = layoutInputs(document);
  const placed = layoutSystem(inputs.boards, inputs.links, positions);
  const blocks = Object.fromEntries([...placed.values()].map((block) => [block.id, {
    column: block.column, x: round(block.x), y: round(block.y),
    rows: block.rows.map((row) => row.portKey ?? "__restricted__"),
    hidden: block.hiddenPorts.map((port) => port.portKey),
  }]));
  const wires = routeWires(placed, inputs.links).map((wire) => ({
    linkId: wire.linkId, kind: wire.kind, lane: round(wire.lane), loopOffset: wire.loopOffset,
    source: `${wire.source.board}:${wire.source.rowKey}:${wire.source.side}`,
    target: `${wire.target.board}:${wire.target.rowKey}:${wire.target.side}`,
  }));
  return { blocks, wires };
}

describe("layout parity with the ICD", () => {
  const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as { cases: ParityCase[] };
  if (process.env.UPDATE_LAYOUT_PARITY) {
    for (const entry of fixture.cases) entry.expected = summarise(entry.document, entry.positions);
    writeFileSync(FIXTURE, `${JSON.stringify(fixture, null, 1)}\n`);
  }
  for (const entry of fixture.cases) {
    it(entry.name, () => {
      expect(summarise(entry.document, entry.positions)).toEqual(entry.expected);
    });
  }
});

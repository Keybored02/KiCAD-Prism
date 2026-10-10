import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { ConnectorGeometry } from "./frames";
import { type SceneHarness, route } from "./harness-route";
import { type Pose, canonicalRotation, matrix } from "./poses";

const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/placement_cases.json"), "utf8"),
) as { modulePorts: { input: { geometry: ConnectorGeometry } }[] };
const geometry = golden.modulePorts[0].input.geometry;
const stored = { axis: "top" as const, quarterTurns: 0 };
const at: Pose = { translationMm: [5, -3, 12], rotation: canonicalRotation([0, 0.3826834, 0, 0.9238795]) };
const identity: Pose = { translationMm: [0, 0, 0], rotation: [0, 0, 0, 1] };
const board = matrix({ translationMm: [80, 0, 0], rotation: [0, 0, 0, 1] });

function harness(connector: NonNullable<SceneHarness["ends"][number]["connector"]>): SceneHarness {
  return {
    id: "h", level: null, nodes: [],
    ends: [
      { id: "e1", ordinal: 0, occurrence: "/m", connector },
      { id: "e2", ordinal: 1, occurrence: "/b", connector: { geometry, thicknessMm: 1.6, stored } },
    ],
    wires: [{ id: "w", from: "e1", to: "e2", gaugeAwg: 24 }],
  } as unknown as SceneHarness;
}

describe("module ends (CONTRACTS_P2 §5.6)", () => {
  it("route like a board end posed where the connector sits on the module", () => {
    const asModule = route(harness({ geometry, thicknessMm: 0, stored, inOccurrence: at }),
      (path) => (path === "/m" ? matrix(identity) : board));
    const asBoard = route(harness({ geometry, thicknessMm: 0, stored }), (path) => (path === "/m" ? matrix(at) : board));
    asModule!.ends.e1.legMm.forEach((value, index) => expect(value).toBeCloseTo(asBoard!.ends.e1.legMm[index], 6));
  });
});

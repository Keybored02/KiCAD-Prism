import { describe, expect, it } from "vitest";

import type { SystemScene, SystemSceneOccurrence } from "@/types/system";

import { compose } from "./placement/poses";
import { stackMove, stackOf, stackUndo } from "./scene-stack";

const FLIP: [number, number, number, number] = [1, 0, 0, 0];

function occurrence(id: string, pose: SystemSceneOccurrence["pose"], mate: SystemSceneOccurrence["mate"] = null): SystemSceneOccurrence {
  return {
    path: `/${id}`, parentPath: null, displayPath: id, labels: [id], instanceId: id, kind: "board", depth: 1,
    restricted: false, assetId: null, pose, worldMatrix: [], boundsMm: null, mate,
  };
}

// CMBD at the origin; OBC-1 mated under it (auto); OBC-2 mated but moved by hand; IN loose.
const cmbd = occurrence("cmbd", { translationMm: [0, 0, 0], rotation: [0, 0, 0, 1], source: "default" });
const obc1 = occurrence("obc1", { translationMm: [-8, -1, -9], rotation: FLIP, source: "auto" },
  { linkId: "l1", from: "/cmbd", overridden: false, autoPose: { translationMm: [-8, -1, -9], rotation: FLIP } });
const obc2 = occurrence("obc2", { translationMm: [200, 0, -30], rotation: FLIP, source: "manual" },
  { linkId: "l2", from: "/cmbd", overridden: true, autoPose: { translationMm: [132, -1, -9], rotation: FLIP } });
const loose = occurrence("in", { translationMm: [300, 70, 0], rotation: [0, 0, 0, 1], source: "default" });
const scene = { occurrences: [cmbd, obc1, obc2, loose] } as unknown as SystemScene;

describe("mated stacks", () => {
  it("finds the stack of any member and nothing for a loose board", () => {
    for (const path of ["/cmbd", "/obc1", "/obc2"]) {
      const stack = stackOf(scene, path)!;
      expect(stack.root.path).toBe("/cmbd");
      expect(stack.members.map((m) => m.instanceId)).toEqual(["cmbd", "obc1", "obc2"]);
    }
    expect(stackOf(scene, "/in")).toBeNull();
  });

  it("moves the stack by storing the root and overridden members, the auto ones follow", () => {
    // Slide OBC-1 by +10 mm in x: everything moves +10 in x.
    const changes = stackMove(scene, "/obc1", { translationMm: [2, -1, -9], rotation: FLIP });
    expect(changes.map((c) => c.instanceId)).toEqual(["cmbd", "obc2"]);
    expect(changes[0].translationMm.map((v) => Math.round(v * 1e6) / 1e6)).toEqual([10, 0, 0]);
    expect(changes[1].translationMm.map((v) => Math.round(v * 1e6) / 1e6)).toEqual([210, 0, -30]);
    // Turning the root a quarter about z turns the hand-placed member around the root with it.
    const s = Math.SQRT1_2;
    const turned = stackMove(scene, "/cmbd", { translationMm: [0, 0, 0], rotation: [0, 0, s, s] });
    const expected = compose({ translationMm: [0, 0, 0], rotation: [0, 0, s, s] }, { translationMm: [200, 0, -30], rotation: FLIP });
    expect(turned[1].translationMm.map((v) => Math.round(v * 1e6) / 1e6)).toEqual(expected.translationMm.map((v) => Math.round(v * 1e6) / 1e6));
    expect(stackMove(scene, "/in", { translationMm: [0, 0, 0], rotation: [0, 0, 0, 1] })).toEqual([]);
  });

  it("undoes a stack move: stored poses come back, defaults are cleared", () => {
    const undo = stackUndo(scene, [{ instanceId: "cmbd" }, { instanceId: "obc2" }]);
    expect(undo.clear).toEqual(["cmbd"]);
    expect(undo.poses).toEqual([{ instanceId: "obc2", translationMm: [200, 0, -30], rotation: FLIP }]);
  });
});

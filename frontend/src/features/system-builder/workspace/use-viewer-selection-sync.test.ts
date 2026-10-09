import { describe, expect, it } from "vitest";

import type { Finding, SystemScene } from "@/types/system";

import { instance, link, systemDocument } from "../test-fixtures";
import { rootInstanceOf, selectionKey, viewerActionFor } from "./use-viewer-selection-sync";

const obc = instance("OBC");
const pay = instance("PAY");
const doc = systemDocument([obc, pay], [link("L1", obc.id, "J1", pay.id, "J2", 2), link("L2", obc.id, "J3", "sin_GONE", "J4")]);
const occurrence = (path: string, instanceId: string, depth: number) => ({ path, instanceId, depth }) as SystemScene["occurrences"][number];
const scene = { occurrences: [occurrence("/sin_OBC", obc.id, 1), occurrence("/sin_PAY", pay.id, 1), occurrence("/sin_CNDH/sin_OBC", obc.id, 2)] } as SystemScene;

describe("viewer selection sync", () => {
  it("maps occurrence paths to their root instance", () => {
    expect(rootInstanceOf("/sin_OBC")).toBe("sin_OBC");
    expect(rootInstanceOf("/sin_CNDH/sin_x")).toBe("sin_CNDH");
    expect(rootInstanceOf(null)).toBeNull();
    expect(rootInstanceOf("")).toBeNull();
    expect(selectionKey({ kind: "link", id: "L1" })).toBe("link:L1");
    expect(selectionKey(null)).toBe("");
  });

  it("selects a board at the root, picks a harness, frames a link's connectors, clears otherwise", () => {
    expect(viewerActionFor({ kind: "instance", id: obc.id }, scene, doc)).toEqual({ type: "board", path: "/sin_OBC" });
    expect(viewerActionFor({ kind: "instance", id: "sin_unplaced" }, scene, doc)).toBeNull();
    expect(viewerActionFor({ kind: "harness", id: "shn_1" }, scene, doc)).toEqual({ type: "harness", id: "shn_1" });
    expect(viewerActionFor({ kind: "link", id: "L1" }, scene, doc)).toEqual({ type: "parts", parts: [
      { occurrence: "/sin_OBC", reference: "J1" }, { occurrence: "/sin_PAY", reference: "J2" }] });
    expect(viewerActionFor({ kind: "link", id: "L2" }, scene, doc)).toEqual({ type: "parts", parts: [{ occurrence: "/sin_OBC", reference: "J3" }] });
    expect(viewerActionFor({ kind: "link", id: "missing" }, scene, doc)).toBeNull();
    expect(viewerActionFor(null, scene, doc)).toEqual({ type: "clear" });
  });

  it("frames both sides of a collision, a body side as its whole occurrence", () => {
    const finding: Finding = { rule: "SYS-V22", name: "part_collision", severity: "warning", instanceId: obc.id, linkId: null,
      rowId: null, end: null, reference: "OBC U1 ↔ Enclosure", pin: null, redacted: false, key: "k1",
      detail: { a: { occurrence: "/sin_OBC", label: "OBC", reference: "U1" }, b: { occurrence: "/sin_ENC", label: "Enclosure", reference: null },
        atMm: [0, 0, 0], pairs: [] } };
    const withFinding = { ...doc, validation: { findings: [finding], notEvaluated: [], exempt: [],
      counts: { error: 0, warning: 1, info: 0, notEvaluated: 0 } } };
    expect(viewerActionFor({ kind: "collision", id: "k1" }, scene, withFinding)).toEqual({ type: "parts", parts: [
      { occurrence: "/sin_OBC", reference: "U1" }, { occurrence: "/sin_ENC", reference: null }] });
    expect(viewerActionFor({ kind: "collision", id: "gone" }, scene, withFinding)).toBeNull();
  });
});

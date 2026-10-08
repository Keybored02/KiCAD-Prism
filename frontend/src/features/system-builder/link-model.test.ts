import { describe, expect, it } from "vitest";

import {
  changedRowCount,
  componentFor,
  draftFromRows,
  draftProblems,
  draftToInputs,
  linkFindings,
  mergeGenerated,
  pinFacts,
  sameNets,
  sortDraft,
} from "./link-model";
import { comparePads } from "./pads";
import { link } from "./test-fixtures";
import type { Finding, InstanceComponent } from "@/types/system";

const component = (portKey: string, memberKeys: string[], pads: string[]): InstanceComponent => ({
  portKey, memberKeys, reference: "J1", libId: null, footprint: null, value: null, dnp: false, candidate: true,
  candidateReason: null, override: null, exposed: true,
  pins: pads.map((pad) => ({ pad, nets: [`/B/${pad}`, `/A/${pad}`], pinNames: [`P${pad}`], pinTypes: null })),
});

describe("comparePads", () => {
  it("matches the backend's natural order", () => {
    expect(["10", "A1", "2", "A10", "A2", "1"].sort(comparePads)).toEqual(["1", "2", "10", "A1", "A2", "A10"]);
  });
});

describe("componentFor and pinFacts", () => {
  const iface = { components: [component("k1", ["k1"], ["1", "2"]), component("u-a", ["u-a", "u-b"], ["3"])] };

  it("finds by port key, then by a unique member key", () => {
    expect(componentFor(iface, { portKey: "k1", memberKeys: ["k1"], reference: "J1", libId: null, footprint: null, pinCount: 2 })?.portKey).toBe("k1");
    expect(componentFor(iface, { portKey: "old", memberKeys: ["u-b"], reference: "U1", libId: null, footprint: null, pinCount: 1 })?.portKey).toBe("u-a");
    expect(componentFor(iface, { portKey: "gone", memberKeys: ["gone"], reference: "X", libId: null, footprint: null, pinCount: 0 })).toBeNull();
  });

  it("indexes pins by pad with sorted nets", () => {
    const facts = pinFacts(iface.components[0]);
    expect(facts.get("2")).toEqual({ pad: "2", nets: ["/A/2", "/B/2"], pinNames: ["P2"], pinTypes: null });
    expect(pinFacts(null).size).toBe(0);
  });
});

describe("draft", () => {
  const live = link("L1", "a", "J1", "b", "J2", 2).rows;

  it("keeps row ids through a round trip and adds new rows without ids", () => {
    const draft = mergeGenerated(draftFromRows(live), [
      { pinA: "1", pinB: "1", signal: "dup", source: "generator", netA: [], netB: [], pinNamesA: null, pinNamesB: null },
      { pinA: "9", pinB: "9", signal: "NEW", source: "generator", netA: [], netB: [], pinNamesA: null, pinNamesB: null },
    ]);
    expect(draftToInputs(draft)).toEqual([
      { id: "L1-r0", pinA: "1", pinB: "1", signal: "S0", source: "manual" },
      { id: "L1-r1", pinA: "2", pinB: "2", signal: "S1", source: "manual" },
      { pinA: "9", pinB: "9", signal: "NEW", source: "generator" },
    ]);
  });

  it("reports missing pads and duplicate pairs before saving", () => {
    const draft = [...draftFromRows(live), { key: "n1", pinA: "1", pinB: "1", signal: "", source: "manual" as const },
      { key: "n2", pinA: "7", pinB: "1", signal: "", source: "manual" as const }];
    expect(draftProblems(draft, new Set(["1", "2"]), new Set(["1", "2"]))).toEqual([
      { key: "n1", message: "1 ↔ 1 is already in this link" },
      { key: "n2", message: "Pad 7 does not exist on end A" },
    ]);
    expect(draftProblems(draft, null, null)).toHaveLength(1);
    expect(sortDraft([draft[3], draft[0]]).map((row) => row.pinA)).toEqual(["1", "7"]);
  });
});

describe("linkFindings", () => {
  it("groups one link's findings by row", () => {
    const finding = (patch: Partial<Finding>): Finding => ({
      rule: "SYS-V04", name: "pad_absent", severity: "error", instanceId: "a", linkId: "L1", rowId: null, end: null,
      reference: null, pin: null, detail: null, redacted: false, ...patch,
    });
    const { all, byRow } = linkFindings([finding({ rowId: "r1" }), finding({ linkId: "L2", rowId: "r1" }), finding({})], link("L1", "a", "J1", "b", "J2"));
    expect(all).toHaveLength(2);
    expect(byRow.get("r1")).toHaveLength(1);
    expect(sameNets(["b", "a"], ["a", "b"])).toBe(true);
    expect(sameNets(["a"], null)).toBe(false);
  });
});

describe("changedRowCount (SB2-102)", () => {
  it("counts rows added, removed or changed, not the draft's length", () => {
    const rows = link("L1", "a", "J1", "b", "J2", 19).rows;
    const draft = draftFromRows(rows);
    expect(changedRowCount(draft, rows)).toBe(0);
    draft[0] = { ...draft[0], signal: "GNDX" };
    expect(changedRowCount(draft, rows)).toBe(1);
    expect(changedRowCount([...draft.slice(1), { key: "new-1", pinA: "40", pinB: "40", signal: "", source: "manual" }], rows)).toBe(2);
  });
});

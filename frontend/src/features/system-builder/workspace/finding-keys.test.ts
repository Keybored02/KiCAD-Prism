import { describe, expect, it } from "vitest";

import type { Finding } from "@/types/system";

import { findingKeys } from "./finding-keys";

const finding = (detail: Record<string, unknown>): Finding => ({
  rule: "SYS-V20", name: "harness_bend_radius", severity: "warning", instanceId: null, linkId: null, rowId: null,
  end: null, reference: null, pin: null, detail, redacted: false,
} as Finding);

describe("findingKeys", () => {
  it("tells apart same-rule findings on one harness by their detail", () => {
    const keys = findingKeys([
      finding({ harnessId: "shn_1", segmentId: "she_a~auto", radiusMm: 2.7 }),
      finding({ harnessId: "shn_1", segmentId: "she_b~auto", radiusMm: 4.5 }),
    ]);
    expect(new Set(keys).size).toBe(2);
  });

  it("numbers findings that are identical rather than merging them", () => {
    const same = { harnessId: "shn_1", segmentId: "she_a~auto" };
    const keys = findingKeys([finding(same), finding(same), finding(same)]);
    expect(new Set(keys).size).toBe(3);
    expect(keys[1]).toBe(`${keys[0]}#1`);
  });

  it("is stable for the same findings", () => {
    const list = [finding({ harnessId: "shn_1" }), finding({ harnessId: "shn_2" })];
    expect(findingKeys(list)).toEqual(findingKeys(list.map((item) => ({ ...item }))));
  });
});

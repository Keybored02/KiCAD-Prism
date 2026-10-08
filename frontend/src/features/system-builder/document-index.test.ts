import { describe, expect, it } from "vitest";

import type { Finding } from "@/types/system";

import { documentIndex, findingIndex, instanceFindings, linkFindings } from "./document-index";
import { instance, link, systemDocument } from "./test-fixtures";

const finding = (patch: Partial<Finding>): Finding => ({
  rule: "SYS-V03", name: "pin_missing", severity: "error", instanceId: null, linkId: null, rowId: null,
  end: null, reference: null, pin: null, detail: null, redacted: false, ...patch,
});

describe("document index (SB2-99)", () => {
  const obc = instance("OBC");
  const pwr = instance("PWR");
  const doc = systemDocument([obc, pwr], [link("L1", obc.id, "J1", pwr.id, "J2", 3)]);

  it("is built once per document and finds by id", () => {
    const index = documentIndex(doc);
    expect(documentIndex(doc)).toBe(index);
    expect(index.instances.get(pwr.id)?.label).toBe("PWR");
    expect(index.links.get("L1")?.id).toBe("L1");
    expect(documentIndex({ ...doc })).not.toBe(index);
  });

  it("groups findings by instance and link and counts severities, once per array", () => {
    const findings = [
      finding({ instanceId: obc.id }), finding({ linkId: "L1", severity: "warning" }),
      finding({ linkId: "L1" }), finding({ severity: "info" }),
    ];
    expect(findingIndex(findings)).toBe(findingIndex(findings));
    expect(instanceFindings(findings, obc.id)).toHaveLength(1);
    expect(linkFindings(findings, "L1")).toHaveLength(2);
    expect(linkFindings(findings, "nope")).toEqual([]);
    expect(linkFindings(findings, "nope")).toBe(instanceFindings(findings, "nope"));
    expect([findingIndex(findings).errors, findingIndex(findings).warnings]).toEqual([2, 1]);
  });
});

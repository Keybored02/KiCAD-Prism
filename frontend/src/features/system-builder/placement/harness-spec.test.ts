import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { HARNESS_SPEC, WIRE_OD_MM, wireOdMm } from "./harness-spec";

// Frozen in SB2-40 and shared with the Python half (CONTRACTS_P2 §17.5).
const golden = JSON.parse(
  readFileSync(resolve(__dirname, "../../../../../backend/tests/fixtures/system_builder/harness_spec.json"), "utf8"),
);

describe("harness spec", () => {
  it("equals the frozen file", () => {
    for (const [key, value] of Object.entries(HARNESS_SPEC)) expect(golden[key]).toBe(value);
    expect(WIRE_OD_MM).toEqual(golden.wireSpec.outsideDiameterMm);
  });

  it("assumes 24 AWG for an unknown or missing gauge", () => {
    expect(wireOdMm("22")).toEqual({ odMm: 1.3208, assumed: false });
    expect(wireOdMm(20)).toEqual({ odMm: 1.524, assumed: false });
    for (const gauge of [null, undefined, "", "26"]) expect(wireOdMm(gauge)).toEqual({ odMm: 1.143, assumed: true });
  });
});

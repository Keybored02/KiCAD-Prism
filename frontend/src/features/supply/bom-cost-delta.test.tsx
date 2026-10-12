import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyBomLookup, SupplyBomRollup } from "@/types/supply";
import { costDelta, sideLines, type ComparedRow } from "./bom-cost-model";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  lookupSupplyBom: vi.fn(),
}));

import { BomCostDelta } from "./bom-cost-delta";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

function rollup(overrides: Partial<SupplyBomRollup>): SupplyBomRollup {
  return {
    lines: 4, tracked: 4, not_tracked: 0, watched: 4, at_risk: 0, short: 0, priced: 4, lines_priced: 4, parts: 4, currency: "EUR",
    cost_build: "1.00", cost_per_board: "1.0000", can_build: 9, limited_by: null, without_stock_data: 0, health: 8, health_status: "ok", ...overrides,
  };
}

const lookup = (overrides: Partial<SupplyBomRollup>): SupplyBomLookup => ({ build_quantity: 1, lines: {}, rollup: rollup(overrides) });

const row = (ref: string, mpn: string, extra: Record<string, string> = {}) => ({ Reference: ref, Manufacturer: "Acme", "Manufacturer Part Number": mpn, ...extra });
const rows: ComparedRow[] = [
  { ref: "R1", old: row("R1", "RES-1"), new: row("R1", "RES-1") },
  { ref: "R2", old: row("R2", "RES-1"), new: row("R2", "RES-1") },
  { ref: "U1", old: row("U1", "OLD-IC") },
  { ref: "U2", new: row("U2", "NEW-IC") },
  { ref: "D1", old: row("D1", "LED-1", { DNP: "true" }), new: row("D1", "LED-1", { DNP: "true" }) },
];

describe("sideLines", () => {
  it("takes the fitted parts of one side only, counting repeats", () => {
    expect(sideLines(rows, "old").map((l) => [l.mpn, l.quantity])).toEqual([["RES-1", 2], ["OLD-IC", 1]]);
    expect(sideLines(rows, "new").map((l) => [l.mpn, l.quantity])).toEqual([["RES-1", 2], ["NEW-IC", 1]]);
  });
});

describe("costDelta", () => {
  it("is the change per board when both sides have a cost in one currency", () => {
    const result = costDelta(rollup({ cost_per_board: "1.0000" }), rollup({ cost_per_board: "1.4200" }));
    expect([result.change, result.currency]).toEqual([0.42, "EUR"]);
  });

  it("gives no change when a side has no price or the currencies differ", () => {
    expect(costDelta(rollup({ cost_per_board: null }), rollup({})).change).toBeNull();
    expect(costDelta(rollup({}), rollup({ currency: "USD" })).change).toBeNull();
  });
});

describe("the cost change note", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("prices both sides at today's prices and says what changed, and how much of the BOM each cost covers", async () => {
    mocked.lookupSupplyBom
      .mockResolvedValueOnce(lookup({ cost_per_board: "1.0000" }))
      .mockResolvedValueOnce(lookup({ cost_per_board: "1.4200", lines_priced: 3, lines: 4 }));
    render(<BomCostDelta rows={rows} complete />);
    const note = await screen.findByLabelText("Cost change");
    expect(note.textContent).toMatch(/^\+.*0\.42.* per board at today's prices\. Base: .*1\.00.*\. Compare: .*1\.42.*, covers 3 of 4 lines\.$/);
    expect(mocked.lookupSupplyBom).toHaveBeenCalledTimes(2);
    const [oldCall, newCall] = mocked.lookupSupplyBom.mock.calls;
    expect(oldCall[0].map((l) => l.mpn)).toEqual(["RES-1", "OLD-IC"]);
    expect(newCall[0].map((l) => l.mpn)).toEqual(["RES-1", "NEW-IC"]);
  });

  it("gives only the change when the comparison leaves out the parts that did not change", async () => {
    mocked.lookupSupplyBom.mockResolvedValueOnce(lookup({ cost_per_board: "0.2000" })).mockResolvedValueOnce(lookup({ cost_per_board: "0.5000" }));
    render(<BomCostDelta rows={rows} complete={false} />);
    const note = await screen.findByLabelText("Cost change");
    expect(note.textContent).toMatch(/^\+.*0\.30.* per board at today's prices\. Counts only the parts that differ\.$/);
    expect(note.textContent).not.toMatch(/Base|Compare/);
  });

  it("shows nothing when the caller cannot read supply data, or nothing could be priced", async () => {
    mocked.lookupSupplyBom.mockRejectedValue(new Error("Insufficient permissions"));
    const { container } = render(<BomCostDelta rows={rows} complete />);
    await waitFor(() => expect(mocked.lookupSupplyBom).toHaveBeenCalled());
    expect(container.textContent).toBe("");
    cleanup();
    mocked.lookupSupplyBom.mockResolvedValue(lookup({ cost_per_board: null, currency: null }));
    const none = render(<BomCostDelta rows={rows} complete />);
    await waitFor(() => expect(mocked.lookupSupplyBom).toHaveBeenCalledTimes(4));
    expect(none.container.textContent).toBe("");
  });
});

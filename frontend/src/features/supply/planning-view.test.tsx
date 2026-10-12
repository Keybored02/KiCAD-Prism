import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyPlan, SupplyPlanRow } from "@/types/supply";
import { heldText, planSentence } from "./planning-model";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getSupplyPlan: vi.fn(),
}));

import { PlanningView } from "./planning-view";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

function row(overrides: Partial<SupplyPlanRow> = {}): SupplyPlanRow {
  return {
    part_id: "p1", manufacturer: "Acme", mpn: "ABC-1", status: "ok", needed: 1000, incoming: 0, committed: 0, own_stock: null,
    distributor_stock: 5000, stock_known: true, next_need_by: "2026-04-01", short: false, first_short_on: null, short_by: 0, total_short_by: 0, ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("the planning view", () => {
  it("names the parts that run short and the date they do", async () => {
    const plan: SupplyPlan = {
      short: 1,
      parts: [
        row({ part_id: "p2", mpn: "TIGHT-1", status: "error", short: true, first_short_on: "2026-06-01", short_by: 200, total_short_by: 800, distributor_stock: 400, committed: 500 }),
        row(),
      ],
    };
    mocked.getSupplyPlan.mockResolvedValue(plan);
    render(<MemoryRouter><PlanningView /></MemoryRouter>);
    expect(await screen.findByText("1 of 2 parts run short.")).toBeTruthy();
    expect(screen.getByText("Runs short on 2026-06-01 by 200.")).toBeTruthy();
    expect(screen.getByText("Covered.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "TIGHT-1" }).getAttribute("href")).toContain("part=p2");
  });

  it("says when no part has demand", async () => {
    mocked.getSupplyPlan.mockResolvedValue({ parts: [], short: 0 });
    render(<MemoryRouter><PlanningView /></MemoryRouter>);
    expect(await screen.findByText("No part has open demand yet.")).toBeTruthy();
  });
});

describe("planning wording", () => {
  it("covers each way a part can stand", () => {
    expect(planSentence(row({ stock_known: false, distributor_stock: null }))).toBe("Distributor stock has not been read yet.");
    expect(planSentence(row({ short: true, first_short_on: null, total_short_by: 300 }))).toBe("Short by 300 once demand with no date is counted.");
    expect(heldText(row({ own_stock: 250, incoming: 100 }))).toBe("5,000 at distributors, 250 of ours, 100 coming in");
  });
});

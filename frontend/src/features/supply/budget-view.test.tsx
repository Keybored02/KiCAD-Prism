import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { BudgetConnector } from "@/types/supply";

vi.mock("./tracking-api", () => ({ getBudget: vi.fn() }));

import { BudgetView } from "./budget-view";
import * as api from "./tracking-api";

afterEach(cleanup);

const item: BudgetConnector = {
  connector_id: "c1", name: "DigiKey", provider: "digikey", enabled: true, shares_account: false, day: "2026-03-02",
  reset_in_seconds: 3 * 3600 + 120, daily_budget: 1000, committed: { capacity: 900, spent: 300 }, pool: { capacity: 100, spent: 20 },
  spare_spent: 5, spent: 325, refused_today: 2,
  tracking: { connector_id: "c1", name: "DigiKey", capacity: 900, committed: 450, free: 450, admitted: 380, waiting: 12 },
  hourly: [{ hour: 1, kind: "offers", purpose: "tier1", calls: 40 }, { hour: 2, kind: "search", purpose: "interactive", calls: 20 }],
  days: [{ day: "2026-03-01", purpose: "tier1", calls: 500 }, { day: "2026-03-02", purpose: "tier1", calls: 300 }],
  owners: { projects: [{ project_id: "prj_1", calls_a_day: 180 }], parts: [{ part_id: "p1", mpn: "LM358DR", manufacturer: "TI", tier: 1, calls_a_day: 1.18, pick_saves: 0.5 }] },
};

describe("the call budget", () => {
  it("shows each share, what tracking costs, what waits and what costs most", async () => {
    vi.mocked(api.getBudget).mockResolvedValue([item]);
    render(<BudgetView />);
    const card = await screen.findByRole("article", { name: "DigiKey call budget" });
    expect(within(card).getByRole("img", { name: "Tracking (committed): 300 of 900 calls" })).toBeTruthy();
    expect(within(card).getByRole("img", { name: "Pool (people, first searches, one-off): 20 of 100 calls" })).toBeTruthy();
    expect(within(card).getByText(/Day resets in 3 h 2 min/)).toBeTruthy();
    expect(within(card).getByText(/380 parts read, costing 450 of 900 calls a day. 12 wait for room./)).toBeTruthy();
    expect(within(card).getByText("2 calls turned away today.")).toBeTruthy();
    expect(within(card).getByText("5 calls today from budget left over (in the total, not in the two shares).")).toBeTruthy();
    expect(within(card).getByRole("img", { name: "Today, all calls: 325 of 1000 calls" })).toBeTruthy();
    expect(within(card).getByLabelText("Calls a day for the last two weeks")).toBeTruthy();
    expect(within(card).getByText(/prj_1: 180.0 calls a day/)).toBeTruthy();
  });

  it("shows nothing when there is no metered connector or the budget cannot be read", async () => {
    vi.mocked(api.getBudget).mockResolvedValue([]);
    const { container } = render(<BudgetView />);
    await vi.waitFor(() => expect(api.getBudget).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });
});

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import type { BudgetConnector } from "@/types/supply";

import { BudgetDetail } from "./budget-view";
import { CallBudget } from "./connector-card-parts";
import { connectorFixture } from "./supply-test-fixtures";

afterEach(cleanup);

const item: BudgetConnector = {
  connector_id: "c1", name: "DigiKey", provider: "digikey", enabled: true, shares_account: false, day: "2026-03-02",
  reset_in_seconds: 3 * 3600 + 120, daily_budget: 1000, committed: { capacity: 900, spent: 300 }, pool: { capacity: 100, spent: 20 },
  spare_spent: 5, free: { scheduled: 120, kept_for_people: 50, free: 40 }, spent: 325, refused_today: 2,
  tracking: { connector_id: "c1", name: "DigiKey", capacity: 900, committed: 450, free: 450, admitted: 380, waiting: 12 },
  hourly: [{ hour: 1, kind: "offers", purpose: "tier1", calls: 40 }, { hour: 2, kind: "search", purpose: "interactive", calls: 20 }],
  days: [{ day: "2026-03-01", purpose: "tier1", calls: 500 }, { day: "2026-03-02", purpose: "tier1", calls: 300 }],
  owners: { projects: [{ project_id: "prj_1", project_name: "Power board", calls_a_day: 180 }], parts: [{ part_id: "p1", mpn: "LM358DR", manufacturer: "TI", tier: 1, calls_a_day: 1.18, pick_saves: 0.5 }] },
};

describe("the call budget", () => {
  it("shows each share, what tracking costs, what waits and what costs most, by project name", () => {
    render(<MemoryRouter><BudgetDetail item={{ ...item, owners: { ...item.owners, projects: [{ ...item.owners.projects[0], project_name: "Power board" }] } }} /></MemoryRouter>);
    const card = screen.getByLabelText("DigiKey call budget");
    expect(within(card).getByRole("img", { name: "Tracking (committed): 300 of 900 calls" })).toBeTruthy();
    expect(within(card).getByRole("img", { name: "Pool (people, first searches, one-off): 20 of 100 calls" })).toBeTruthy();
    expect(within(card).getByText(/Day resets in 3 h 2 min/)).toBeTruthy();
    expect(within(card).getByText(/380 parts read, costing 450 of 900 calls a day. 12 wait for room./)).toBeTruthy();
    expect(within(card).getByText("2 calls turned away today.")).toBeTruthy();
    expect(within(card).getByText("Until the reset: 120 calls kept for scheduled work, 50 for people, 40 free now.")).toBeTruthy();
    expect(within(card).getByLabelText("Calls a day for the last two weeks")).toBeTruthy();
    expect(within(card).getByRole("link", { name: "Power board" }).getAttribute("href")).toBe("/project/prj_1?section=supply");
    expect(within(card).getByRole("link", { name: "LM358DR" }).getAttribute("href")).toBe("/?section=supply&supplyView=parts&part=p1");
  });

  it("opens under the connector card's calls bar from the chevron", () => {
    render(<CallBudget connector={connectorFixture()} detail={<p>the detail</p>} />);
    expect(screen.queryByText("the detail")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Calls today/ }));
    expect(screen.getByText("the detail")).toBeTruthy();
  });
});

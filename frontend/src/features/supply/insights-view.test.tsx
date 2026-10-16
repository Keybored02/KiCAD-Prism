import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyInsightsPage } from "@/types/supply";
import { partRowFixture } from "./supply-test-fixtures";

vi.mock("./runway-scatter", () => ({ default: () => <div>Scatter drawn</div> }));
vi.mock("./market-chart", () => ({ default: () => <div>Market chart drawn</div> }));
vi.mock("./planning-view", () => ({ PlanningView: () => <div>Planning content</div> }));
vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getSupplyInsights: vi.fn(),
  getSupplyMarketHistory: vi.fn(),
  listSupplyParts: vi.fn(),
}));

import * as api from "./supply-api";
import { InsightsView } from "./insights-view";

const mocked = vi.mocked(api);

function page(overrides: Partial<SupplyInsightsPage> = {}): SupplyInsightsPage {
  return {
    tracked: 6,
    counts: { draining: 2, restock_late: 0, one_distributor: 1 },
    scatter: [
      { part_id: "p1", mpn: "LM358", manufacturer: "TI", days_to_zero: 10, lead_days: 40 },
      { part_id: "p2", mpn: "NE555", manufacturer: "TI", days_to_zero: 90, lead_days: 20 },
    ],
    scatter_missing: { no_rate: 3, no_lead_time: 1 },
    distributors: {
      repricing: [{ name: "DigiKey", days: 30, parts: 4 }],
      leaders: [{ name: "Mouser", parts: 2 }],
      restock_first: [],
      arrivals: { on_time: 3, resolved: 4 },
    },
    market: {
      day: "2026-03-02", compared_with: "2026-02-01", min_sample: 3,
      signals: [{ kind: "manufacturer", scope: "TI", signal: "draining", text: "TI: 50% of the parts you follow are out of stock, up from 10%." }],
      scopes: [
        { scope: "All followed parts", kind: "all", sample: 6, metrics: { out_of_stock: { value: 0.33, before: 0.1 }, price_index: { value: 101.3, before: null } } },
        { scope: "TI", kind: "manufacturer", sample: 4, metrics: { out_of_stock: { value: 0.5, before: 0.1 } } },
      ],
    },
    ...overrides,
  };
}

function renderView(initial = "/") {
  render(<MemoryRouter initialEntries={[initial]}><InsightsView view="market" /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  mocked.getSupplyInsights.mockResolvedValue(page());
  mocked.getSupplyMarketHistory.mockResolvedValue({ metric: "out_of_stock", series: [{ kind: "all", scope: "All followed parts", sample: 6, points: [["2026-03-01", 0.3]] }] });
  mocked.listSupplyParts.mockResolvedValue({ items: [partRowFixture({ mpn: "LM358", runs_out_days: 10 })], total: 1, limit: 50 });
});
afterEach(cleanup);

describe("the insights page", () => {
  it("has a section for each question, with a way to jump to it", async () => {
    renderView();
    const nav = await screen.findByRole("navigation", { name: "Insights" });
    expect(within(nav).getAllByRole("button").map((button) => button.textContent)).toEqual(["Signals", "Runway", "Market", "Distributors", "Planning"]);
    expect(screen.getByText("TI: 50% of the parts you follow are out of stock, up from 10%.")).toBeTruthy();
  });

  it("answers what runs out before an order could arrive, and lists the parts behind each finding", async () => {
    renderView();
    expect(await screen.findByText("1 part runs out before an order could arrive")).toBeTruthy();
    expect(await screen.findByText("Scatter drawn")).toBeTruthy();
    expect(screen.getByText(/3 without a falling rate yet, 1 without a quoted lead time/)).toBeTruthy();
    expect(await screen.findByRole("button", { name: "LM358" })).toBeTruthy();
    expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("watched", "", expect.anything(), "draining", 0, 50, "");
    fireEvent.click(screen.getByRole("button", { name: /One distributor/ }));
    await screen.findByRole("button", { name: "LM358" });
    expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("watched", "", expect.anything(), "one_distributor", 0, 50, "");
  });

  it("shows the market figures as cards and the groups as a table", async () => {
    renderView();
    const card = await screen.findByRole("button", { name: /^Out of stock/ });
    expect(card.textContent).toContain("33%");
    const table = screen.getByRole("columnheader", { name: "Maker" }).closest("table")!;
    expect(within(table).getByRole("button", { name: "TI" })).toBeTruthy();
    expect(await screen.findByText("Market chart drawn")).toBeTruthy();
  });

  it("shows how the distributors behave across the parts", async () => {
    renderView();
    const card = await screen.findByRole("region", { name: "Days between price changes" });
    expect(within(card).getByText("30 days")).toBeTruthy();
    expect(screen.getByText("75%")).toBeTruthy();
  });

  it("reports a failure and retries", async () => {
    mocked.getSupplyInsights.mockRejectedValueOnce(new Error("Backend is down")).mockResolvedValue(page());
    renderView();
    expect(await screen.findByText("Backend is down")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("navigation", { name: "Insights" })).toBeTruthy();
  });
});

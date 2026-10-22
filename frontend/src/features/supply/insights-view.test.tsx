import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyInsightsPage } from "@/types/supply";
import { partRowFixture } from "./supply-test-fixtures";

vi.mock("./runway-scatter", () => ({ default: () => <div>Scatter drawn</div> }));
vi.mock("./market-chart", () => ({ default: () => <div>Market chart drawn</div> }));
vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getSupplyInsights: vi.fn(),
  getForecastInsights: vi.fn(() => new Promise(() => undefined)),
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
    market_trends: { out_of_stock: [0.1, 0.2, 0.33] },
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
    sourcing: {
      coverage: [{ connector_id: "c1", name: "DigiKey", provider: "digikey", tracked: 6, listed: 5, in_stock: 4, cheapest: 3 }],
      resilience: { none: 1, one: 2, two: 2, three_plus: 1, unknown: 0, not_read: 0 },
    },
    lifecycle: {
      mix: { active: 4, nrnd: 1, last_time_buy: 0, obsolete: 0, unknown: 1 },
      outlook: { ended: 0, under_2_years: 1, "2_to_5_years": 0, no_signs: 4, unknown: 1 },
      compliance: { rohs: { compliant: 4, not_compliant: 1, not_applicable: 0, unknown: 1 }, reach: { compliant: 3, affected: 0, not_applicable: 0, unknown: 3 } },
    },
    lead_times: [
      { bucket: "under_2w", parts: 1 }, { bucket: "2_to_8w", parts: 2 }, { bucket: "8_to_16w", parts: 1 }, { bucket: "16_to_26w", parts: 1 },
      { bucket: "over_26w", parts: 0 }, { bucket: "none", parts: 1 },
    ],
    price_movers: { up: [{ part_id: "p3", mpn: "NE5532", manufacturer: "TI", percent: 12 }], down: [] },
    trade: {
      origins: [{ country: "Malaysia", parts: 3 }, { country: "Unknown", parts: 3 }], other_origins: 0,
      control: { controlled: 1, none: 3, disputed: 0, unknown: 2 },
      controlled: [{ part_id: "p9", mpn: "ADS1115", manufacturer: "TI", eccn: "3A991", state: "controlled", by_person: false }],
    },
    ...overrides,
  };
}

function renderView(initial = "/") {
  render(<MemoryRouter initialEntries={[initial]}><InsightsView /></MemoryRouter>);
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
    expect(within(nav).getAllByRole("button").map((button) => button.textContent)).toEqual(["Signals", "Sourcing", "Lead times and prices", "Stock risk", "Market", "Forecasts", "Trade", "Compliance"]);
    expect(screen.getByText("TI: 50% of the parts you follow are out of stock, up from 10%.")).toBeTruthy();
  });

  it("answers what runs out before an order could arrive, and lists the parts behind each finding", async () => {
    renderView();
    expect(await screen.findByText("1 part runs out before an order could arrive")).toBeTruthy();
    expect(await screen.findByText("Scatter drawn")).toBeTruthy();
    expect(screen.getByText(/3 without a falling rate yet, 1 without a quoted lead time/)).toBeTruthy();
    expect(await screen.findByRole("button", { name: "LM358" })).toBeTruthy();
    expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("watched", "", expect.anything(), "draining", 0, 50, "", "");
    fireEvent.click(within(screen.getByRole("group", { name: "Finding" })).getByRole("button", { name: /Lead time up/ }));
    await screen.findByRole("button", { name: "LM358" });
    expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("watched", "", expect.anything(), "lead_up", 0, 50, "", "");
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

describe("the insights sections added with the rework", () => {
  it("shows coverage, lifecycle with its unknown, lead times, price movers and trade", async () => {
    renderView();
    expect(await screen.findByText("DigiKey lists 5 of 6 parts")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not recommended for new designs: 1" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Lifecycle" })).toBeTruthy();
    expect(screen.getByText("1 part is quoted over 16 weeks")).toBeTruthy();
    expect(screen.getByRole("button", { name: "NE5532" })).toBeTruthy();
    expect(screen.getByText("3A991")).toBeTruthy();
  });

  it("makes every bar of the lifecycle, compliance, lead time and export control charts open its parts", async () => {
    renderView();
    await screen.findByText("DigiKey lists 5 of 6 parts");
    for (const name of [/^Malaysia: \d/, /^DigiKey lists: \d/, /^DigiKey has in stock: \d/, /^Not compliant: \d/, /^Affected: \d/, /^Unknown: \d/, /^Ended: \d/, /^Under 2 weeks: \d/, /^Controlled: \d/, /^No class given: \d/, /^Active: \d/]) {
      expect(screen.getAllByRole("button", { name }).length).toBeGreaterThan(0);
    }
  });
});

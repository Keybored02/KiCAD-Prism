import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyMarket } from "@/types/supply";
import { MARKET_COLUMNS, marketChange, marketFigure, marketRows } from "./market-model";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getSupplyMarket: vi.fn(),
  getSupplyMarketHistory: vi.fn(),
}));

import { MarketView } from "./market-view";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

const market: SupplyMarket = {
  day: "2026-03-03",
  compared_with: "2026-02-01",
  min_sample: 3,
  scopes: [
    { scope: "All followed parts", kind: "all", sample: 12, metrics: { out_of_stock: { value: 0.25, before: 0.1 }, median_lead_time_days: { value: 56, before: 56 } } },
    { scope: "Acme", kind: "manufacturer", sample: 5, metrics: { lifecycle_risk: { value: 0.4, before: null } } },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getSupplyMarket.mockResolvedValue(market);
  mocked.getSupplyMarketHistory.mockResolvedValue({ metric: "out_of_stock", series: [] });
});
afterEach(cleanup);

describe("the market view", () => {
  it("shows each group with its sample size, its figures and how they moved", async () => {
    render(<MarketView />);
    expect(await screen.findByText("All followed parts")).toBeTruthy();
    expect(screen.getByText("25%")).toBeTruthy();
    expect(screen.getByText("up 15 points")).toBeTruthy();
    expect(screen.getByText("no change")).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
    expect(screen.getByText("Snapshot of 2026-03-03, changes against 2026-02-01.")).toBeTruthy();
    expect(screen.getAllByText("no data").length).toBeGreaterThan(0);
  });

  it("tags a category and explains the empty history", async () => {
    mocked.getSupplyMarket.mockResolvedValue({ ...market, scopes: [...market.scopes, { scope: "Op Amps", kind: "category", sample: 4, metrics: {} }] });
    render(<MarketView />);
    expect(await screen.findByText("Op Amps")).toBeTruthy();
    expect(screen.getByText("Category")).toBeTruthy();
    expect(await screen.findByText(/A line appears once two days of figures are stored/)).toBeTruthy();
  });

  it("asks for the figure that was picked", async () => {
    render(<MarketView />);
    fireEvent.click(await screen.findByRole("button", { name: "Lifecycle risk" }));
    await waitFor(() => expect(mocked.getSupplyMarketHistory).toHaveBeenLastCalledWith("lifecycle_risk", expect.anything()));
  });

  it("says plainly that nothing is stored yet", async () => {
    mocked.getSupplyMarket.mockResolvedValue({ day: null, scopes: [] });
    render(<MarketView />);
    expect(await screen.findByText(/Nothing is stored yet/)).toBeTruthy();
  });
});

describe("market wording", () => {
  it("lines the days up across groups, leaving a gap where a group has no value", () => {
    const rows = marketRows([
      { kind: "all", scope: "All", sample: 5, points: [["2026-03-01", 0.1], ["2026-03-02", 0.2]] },
      { kind: "category", scope: "Op Amps", sample: 3, points: [["2026-03-02", 0.5]] },
    ]);
    expect(rows).toEqual([{ day: "2026-03-01", s0: 0.1, s1: null }, { day: "2026-03-02", s0: 0.2, s1: 0.5 }]);
  });

  it("reads shares as percentages and lead times as days", () => {
    const [share, , , days, index] = MARKET_COLUMNS;
    expect(marketFigure(share, { value: 0.333, before: null })).toBe("33%");
    expect(marketFigure(days, { value: 55.6, before: 40 })).toBe("56 days");
    expect(marketFigure(share, undefined)).toBe("");
    expect(marketFigure(index, { value: 103.456, before: 100 })).toBe("103.5");
    expect(marketChange(index, { value: 103.4, before: 100 })).toBe("up 3 points");
    expect(marketChange(days, { value: 40, before: 56 })).toBe("down 16 days");
    expect(marketChange(share, { value: 0.5, before: null })).toBe("");
  });
});

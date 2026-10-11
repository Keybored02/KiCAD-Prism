import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import StockChart from "./stock-chart";
import { coverageChanges, formatDay } from "./chart-format";

// Recharts measures its box with ResizeObserver, which jsdom does not have.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterEach(cleanup);

const HISTORY = [
  { day: "2026-02-27", stock: 9000, listings: 1 },
  { day: "2026-02-28", stock: 11000, listings: 1 },
  { day: "2026-03-01", stock: 12500, listings: 2 },
];

describe("the stock chart", () => {
  it("mounts with an accessible name and the chart container", () => {
    const { container } = render(<StockChart history={HISTORY} threshold={500} />);
    expect(screen.getByRole("img", { name: "Stock over the last 90 days" })).toBeTruthy();
    expect(container.querySelector('[data-slot="chart"]')).not.toBeNull();
  }, 30_000);

  it("mounts without a threshold", () => {
    render(<StockChart history={HISTORY} threshold={null} />);
    expect(screen.getByRole("img", { name: "Stock over the last 90 days" })).toBeTruthy();
  }, 30_000);
});

describe("chart formatting", () => {
  it("writes a calendar day without shifting it across time zones", () => {
    expect(formatDay("2026-03-01")).toBe(new Date(Date.UTC(2026, 2, 1)).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" }));
    expect(formatDay("nonsense")).toBe("nonsense");
  });

  it("finds the days when the number of listings changed", () => {
    expect(coverageChanges(HISTORY)).toEqual(["2026-03-01"]);
    expect(coverageChanges([])).toEqual([]);
    expect(coverageChanges(HISTORY.slice(0, 2))).toEqual([]);
  });
});

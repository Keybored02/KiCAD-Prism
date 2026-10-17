import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { PartHistory } from "@/types/supply";

vi.mock("./supply-api", () => ({ getPartHistory: vi.fn() }));

import { historyRows } from "./part-history-model";
import { PartHistoryPanel } from "./part-history";
import * as api from "./supply-api";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterEach(cleanup);

const HISTORY: PartHistory = {
  days: 90,
  currency: "EUR",
  connectors: [
    { connector_id: "c1", name: "DigiKey", provider: "digikey", last_read: "2026-03-01T08:00:00Z", stale: false, stock: [["2026-02-28", 50], ["2026-03-01", 40]], price: [["2026-02-28", 0.5], ["2026-03-01", 0.5]] },
    { connector_id: "c2", name: "Mouser", provider: "mouser", last_read: "2026-02-28T08:00:00Z", stale: true, stock: [["2026-02-28", 10]], price: [] },
  ],
  total: [["2026-02-28", 60], ["2026-03-01", 40]],
};

describe("the history rows", () => {
  it("makes a column per distributor, the total, and a dashed continuation for a line not read lately", () => {
    const { rows, keys } = historyRows(HISTORY, "stock", new Set());
    expect(keys.map((item) => item.key)).toEqual(["c1", "c2", "total"]);
    expect(rows).toEqual([
      { day: "2026-02-28", c1: 50, c2: 10, total: 60, "c2~": 10 },
      { day: "2026-03-01", c1: 40, c2: null, total: 40, "c2~": 10 },
    ]);
  });

  it("leaves out a line switched off, and a distributor without prices from the price chart", () => {
    expect(historyRows(HISTORY, "stock", new Set(["c2", "total"])).keys.map((item) => item.key)).toEqual(["c1"]);
    expect(historyRows(HISTORY, "price", new Set()).keys.map((item) => item.key)).toEqual(["c1"]);
  });
});

describe("the history on the part sheet", () => {
  it("shows a legend that switches a distributor off, and opens the chart larger", async () => {
    vi.mocked(api.getPartHistory).mockResolvedValue(HISTORY);
    render(<PartHistoryPanel partId="p1" threshold={null} />);
    const digikey = await screen.findByRole("button", { name: /DigiKey/ });
    expect(digikey.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(digikey);
    expect(digikey.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: /Mouser \(not read lately\)/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open the stock history larger" }));
    await waitFor(() => expect(api.getPartHistory).toHaveBeenCalledWith("p1", 90, expect.anything()));
    expect(await screen.findByRole("radio", { name: "6 months" })).toBeTruthy();
  }, 30_000);

  it("says history builds up when there is none", async () => {
    vi.mocked(api.getPartHistory).mockResolvedValue({ ...HISTORY, connectors: [], total: [] });
    render(<PartHistoryPanel partId="p2" threshold={null} />);
    expect(await screen.findByText("History builds up as the part is read.")).toBeTruthy();
  });
});

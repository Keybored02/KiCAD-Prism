import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PriceTrend } from "./price-trend";

afterEach(cleanup);

const history = [{ day: "2026-02-01", price: 1 }, { day: "2026-03-01", price: 1.3 }];

describe("the price section", () => {
  it("shows nothing before there are priced readings", () => {
    const { container } = render(<PriceTrend price={{ currency: "", history: [], trend: null }} />);
    expect(container.textContent).toBe("");
  });

  it("shows the latest price and the move over the window", () => {
    render(<PriceTrend price={{ currency: "EUR", history, trend: { currency: "EUR", was: "1", now: "1.3", change_percent: 30, days: 28 } }} />);
    expect(screen.getByRole("region", { name: "Price" })).toBeTruthy();
    expect(screen.getByText(/Up 30% over 28 days, from/)).toBeTruthy();
  });

  it("says why there is no move yet", () => {
    render(<PriceTrend price={{ currency: "EUR", history: [history[1]], trend: null }} />);
    expect(screen.getByText(/needs a week of readings/)).toBeTruthy();
  });
});

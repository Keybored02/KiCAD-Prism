import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { SupplyConnector } from "@/types/supply";
import { CallBudget } from "./connector-card-parts";

afterEach(cleanup);

const connector = { daily_budget: 1000, interactive_reserve_pct: 10, usage_today: { spent: 120 } } as SupplyConnector;

describe("the change notice bar", () => {
  it("shows the second quota with how the parts use it", () => {
    render(<CallBudget connector={connector} notices={{ limit: 50, used: 23, parts: 141, interval_days: 7, per_day: 21 }} />);
    expect(screen.getByText("Change notices today")).toBeTruthy();
    expect(screen.getByText("23 / 50")).toBeTruthy();
    expect(screen.getByText("141 parts, weekly, about 21 a day")).toBeTruthy();
  });

  it("says when the quota stretches the interval, and shows nothing for a provider without one", () => {
    const { rerender } = render(<CallBudget connector={connector} notices={{ limit: 50, used: 45, parts: 450, interval_days: 10, per_day: 45 }} />);
    expect(screen.getByText("450 parts, every 10 days, about 45 a day")).toBeTruthy();
    rerender(<CallBudget connector={connector} notices={null} />);
    expect(screen.queryByText("Change notices today")).toBeNull();
  });
});

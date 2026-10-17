import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { NoticeBar } from "./connector-card-parts";

afterEach(cleanup);


describe("the change notice bar", () => {
  it("shows the second quota with how the parts use it", () => {
    render(<NoticeBar notices={{ limit: 50, used: 23, parts: 141, interval_days: 7, per_day: 21 }} />);
    expect(screen.getByText("Change notices today")).toBeTruthy();
    expect(screen.getByText("23 / 50")).toBeTruthy();
    expect(screen.getByText("141 parts, weekly, about 21 a day")).toBeTruthy();
  });

  it("says when the quota stretches the interval", () => {
    render(<NoticeBar notices={{ limit: 50, used: 45, parts: 450, interval_days: 10, per_day: 45 }} />);
    expect(screen.getByText("450 parts, every 10 days, about 45 a day")).toBeTruthy();
  });
});

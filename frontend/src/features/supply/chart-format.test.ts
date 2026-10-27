import { describe, expect, it } from "vitest";

import { coverageChanges, formatDay } from "./chart-format";

const HISTORY = [
  { day: "2026-02-27", stock: 9000, listings: 1 },
  { day: "2026-02-28", stock: 11000, listings: 1 },
  { day: "2026-03-01", stock: 12500, listings: 2 },
];

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

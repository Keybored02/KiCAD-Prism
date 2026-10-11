import { describe, expect, it } from "vitest";

import type { SupplyInsight } from "@/types/supply";
import { confidenceLabel, insightBasis, insightLines } from "./insight-text";

function insight(overrides: Partial<SupplyInsight> = {}): SupplyInsight {
  return {
    confidence: "medium", trend: null, decrease_per_day: null, days_to_zero: null, days_to_threshold: null,
    restocks: 0, restock_interval_days: null, restock_expected_in_days: null,
    inputs: { points: 12, span_days: 11, points_in_run: 12, current: 300 },
    ...overrides,
  };
}

describe("insight text", () => {
  it("says nothing before there is anything honest to say", () => {
    expect(insightLines(insight({ confidence: "none" }))).toEqual([]);
  });

  it("states the rate, the days to zero and to the threshold", () => {
    const lines = insightLines(insight({ trend: "falling", decrease_per_day: 49.6, days_to_zero: 6, days_to_threshold: 1 }));
    expect(lines).toEqual([
      "Observed net decrease: 50 a day.",
      "At that rate it reaches zero in about 6 days.",
      "It reaches your threshold in about 1 day.",
    ]);
  });

  it("describes steady, rising and not-enough-yet differently", () => {
    expect(insightLines(insight({ trend: "steady" }))).toEqual(["Stock is steady."]);
    expect(insightLines(insight({ trend: "rising" }))).toEqual(["Stock is rising."]);
    expect(insightLines(insight())[0]).toMatch(/Too few readings since the last restock/);
  });

  it("reports restock cadence, and an overdue restock plainly", () => {
    const base = { trend: "steady" as const, restocks: 3, restock_interval_days: 30 };
    expect(insightLines(insight({ ...base, restock_expected_in_days: 12 }))[1])
      .toBe("Restocked 3 times in this history, about every 30 days. Next expected in about 12 days.");
    expect(insightLines(insight({ ...base, restock_expected_in_days: -4 }))[1]).toMatch(/Expected 4 days ago, not seen yet\.$/);
    expect(insightLines(insight({ trend: "steady", restocks: 1 }))[1]).toBe("Restocked once in this history.");
  });

  it("shows what a projection rests on", () => {
    expect(insightBasis(insight())).toBe("12 daily readings over 11 days; 12 since the last restock or change of listings.");
    expect(insightBasis(insight({ inputs: { points: 2, span_days: 1, points_in_run: 2, current: 5 } }))).toMatch(/over 1 day;/);
    expect(confidenceLabel(insight({ confidence: "high" }))).toBe("High confidence");
  });
});

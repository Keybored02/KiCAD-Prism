import { describe, expect, it } from "vitest";

import { currencyLabel, formatAgo, formatPrice, formatStock, parseThreshold, sparklinePoints, tierLabel } from "./supply-format";

describe("formatting", () => {
  it("shows stock, or says nothing has been read", () => {
    expect(formatStock(null)).toBe("None yet");
    expect(formatStock(0)).toBe("0");
    expect(formatStock(12500)).toBe((12500).toLocaleString());
  });

  it("formats prices and survives odd input", () => {
    expect(formatPrice(null, "EUR")).toBe("");
    expect(formatPrice("", "EUR")).toBe("");
    expect(formatPrice("0.52", "EUR")).toMatch(/0\.52/);
    expect(formatPrice("0.52", "")).toBe("0.52");
    expect(formatPrice("abc", "EUR")).toBe("abc");
    expect(formatPrice("0.5", "ZZZZ")).toBe("ZZZZ 0.5");
  });

  it("writes rupees the Indian way, in lakhs and crores", () => {
    expect(formatPrice("1282650", "INR", 2)).toBe("₹12,82,650.00");
    expect(formatPrice("123456789.5", "INR", 2)).toBe("₹12,34,56,789.50");
    expect(formatPrice("0.4321", "INR")).toBe("₹0.4321");
    expect(currencyLabel("INR")).toBe("INR · ₹");
    expect(currencyLabel("ZZZZ")).toBe("ZZZZ");
  });

  it("says how long ago", () => {
    const now = Date.parse("2026-03-01T12:00:00Z");
    expect(formatAgo(null, now)).toBe("");
    expect(formatAgo("nonsense", now)).toBe("");
    expect(formatAgo("2026-03-01T11:59:40Z", now)).toBe("just now");
    expect(formatAgo("2026-03-01T11:30:00Z", now)).toBe("30 min ago");
    expect(formatAgo("2026-03-01T06:00:00Z", now)).toBe("6 h ago");
    expect(formatAgo("2026-02-25T12:00:00Z", now)).toBe("4 d ago");
    expect(formatAgo("2026-03-02T12:00:00Z", now)).toBe("just now");
  });

  it("describes polling tiers", () => {
    expect(tierLabel(null)).toBe("Not polled yet");
    expect(tierLabel("daily")).toBe("Read daily");
  });
});

describe("parseThreshold", () => {
  it("clears on empty, parses digits, and refuses everything else", () => {
    expect(parseThreshold("")).toBeNull();
    expect(parseThreshold("  ")).toBeNull();
    expect(parseThreshold("250")).toBe(250);
    expect(parseThreshold(" 0 ")).toBe(0);
    for (const bad of ["-1", "1.5", "1,000", "abc", "10k"]) expect(parseThreshold(bad)).toBeUndefined();
  });
});

describe("sparklinePoints", () => {
  it("is empty for no data", () => {
    expect(sparklinePoints([], 100, 20)).toBe("");
  });

  it("puts the highest value at the top and the lowest at the bottom, within the margin", () => {
    const [first, second] = sparklinePoints([0, 10], 100, 20).split(" ");
    expect(first).toBe("2.0,18.0");
    expect(second).toBe("98.0,2.0");
  });

  it("centres a flat series and a single point", () => {
    expect(sparklinePoints([5, 5, 5], 100, 20).split(" ").map((p) => p.split(",")[1])).toEqual(["10.0", "10.0", "10.0"]);
    expect(sparklinePoints([7], 100, 20)).toBe("50.0,10.0");
  });
});

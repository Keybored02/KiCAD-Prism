import { describe, expect, it } from "vitest";

import { resolvePlace } from "./supply-views";

describe("where a Supply address leads", () => {
  it("opens the five tabs as asked", () => {
    for (const tab of ["dashboard", "parts", "review", "insights", "connectors"] as const) expect(resolvePlace(tab, null, null).tab).toBe(tab);
  });

  it("sends the old addresses to the tab that took them over", () => {
    expect(resolvePlace("overview", null, null).tab).toBe("dashboard");
    expect(resolvePlace("inbox", null, null).tab).toBe("dashboard");
    expect(resolvePlace("market", null, null)).toEqual({ tab: "insights", insight: "market", tool: null });
    expect(resolvePlace("planning", null, null)).toEqual({ tab: "insights", insight: "planning", tool: null });
    expect(resolvePlace("bom-file", null, null)).toEqual({ tab: "parts", insight: "market", tool: "bom-file" });
  });

  it("falls back to the dashboard, and keeps the tool to Parts", () => {
    expect(resolvePlace(null, null, null).tab).toBe("dashboard");
    expect(resolvePlace("nonsense", null, null).tab).toBe("dashboard");
    expect(resolvePlace("parts", null, "bom-file").tool).toBe("bom-file");
    expect(resolvePlace("review", null, "bom-file").tool).toBeNull();
    expect(resolvePlace("insights", "planning", null).insight).toBe("planning");
  });
});

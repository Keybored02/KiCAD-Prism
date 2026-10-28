import { describe, expect, it } from "vitest";

import { resolvePlace } from "./supply-views";

describe("where a Supply address leads", () => {
  it("opens the five tabs as asked", () => {
    for (const tab of ["dashboard", "parts", "projects", "review", "insights"] as const) expect(resolvePlace(tab, null).tab).toBe(tab);
  });

  it("sends the old addresses to the tab that took them over", () => {
    expect(resolvePlace("overview", null).tab).toBe("dashboard");
    expect(resolvePlace("inbox", null).tab).toBe("dashboard");
    expect(resolvePlace("market", null)).toEqual({ tab: "insights", tool: null });
    expect(resolvePlace("planning", null)).toEqual({ tab: "insights", tool: null });
    expect(resolvePlace("bom-file", null)).toEqual({ tab: "parts", tool: "bom-file" });
  });

  it("falls back to the dashboard, and keeps the tool to Parts", () => {
    expect(resolvePlace(null, null).tab).toBe("dashboard");
    expect(resolvePlace("nonsense", null).tab).toBe("dashboard");
    expect(resolvePlace("parts", "bom-file").tool).toBe("bom-file");
    expect(resolvePlace("review", "bom-file").tool).toBeNull();
  });
});

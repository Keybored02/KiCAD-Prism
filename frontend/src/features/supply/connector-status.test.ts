import { describe, expect, it } from "vitest";

import { budgetUsedPercent, connectorState, errorCodeLabel, formatWhen } from "./connector-status";
import { connectorFixture } from "./supply-test-fixtures";

describe("connectorState", () => {
  it("is active for a healthy connector", () => {
    expect(connectorState(connectorFixture())).toEqual({ label: "Active", tone: "success" });
  });

  it("puts the most urgent reason first", () => {
    const broken = connectorFixture({
      provider_available: false,
      credentials_status: "locked",
      paused_reason: "x",
      enabled: false,
    });
    expect(connectorState(broken).label).toBe("Provider missing");
    expect(connectorState({ ...broken, provider_available: true }).label).toBe("Credentials locked");
    expect(connectorState({ ...broken, provider_available: true, credentials_status: "ready" }).label).toBe("Paused");
    expect(connectorState({ ...broken, provider_available: true, credentials_status: "ready", paused_reason: "" }).label)
      .toBe("Disabled");
  });

  it("treats a CSV connector without an upload as not ready", () => {
    const csv = connectorFixture({ provider: "csv", credentials: {}, metered: false });
    expect(connectorState(csv)).toEqual({ label: "No file uploaded", tone: "warning" });
    const withFile = { ...csv, csv_import: { filename: "a.csv", imported_by: "x", imported_at: "2026-03-01T00:00:00Z", row_count: 2 } };
    expect(connectorState(withFile).label).toBe("Active");
    expect(connectorState({ ...csv, paused_reason: "x" }).label).toBe("Paused");
  });

  it("flags a changed credential key and unset credentials", () => {
    expect(connectorState(connectorFixture({ credentials_status: "unknown_key" })).label).toBe("Credential key changed");
    expect(connectorState(connectorFixture({ credentials: { api_key: false } })).label).toBe("Needs credentials");
  });

  it("reports a failure only while it is the latest outcome", () => {
    const failed = connectorFixture({
      last_error_code: "rate_limited",
      last_error_at: "2026-03-02T10:00:00Z",
      last_ok_at: "2026-03-01T10:00:00Z",
    });
    expect(connectorState(failed).label).toBe("Last call failed");
    expect(connectorState({ ...failed, last_ok_at: "2026-03-03T10:00:00Z" }).label).toBe("Active");
    expect(connectorState({ ...failed, last_ok_at: null }).label).toBe("Last call failed");
  });
});

describe("budgetUsedPercent", () => {
  it("rounds and clamps", () => {
    expect(budgetUsedPercent(connectorFixture({ daily_budget: 1000, usage_today: { spent: 125, interactive_spent: 0 } }))).toBe(13);
    expect(budgetUsedPercent(connectorFixture({ daily_budget: 100, usage_today: { spent: 400, interactive_spent: 0 } }))).toBe(100);
  });

  it("treats a zero budget as fully spent", () => {
    expect(budgetUsedPercent(connectorFixture({ daily_budget: 0 }))).toBe(100);
  });
});

describe("labels", () => {
  it("translates known error codes and tidies the rest", () => {
    expect(errorCodeLabel("auth_failed")).toBe("credentials rejected");
    expect(errorCodeLabel("response_too_large")).toBe("response too large");
  });

  it("formats times and survives bad input", () => {
    expect(formatWhen(null)).toBe("");
    expect(formatWhen("not a date")).toBe("");
    expect(formatWhen("2026-03-01T10:00:00Z")).not.toBe("");
  });
});

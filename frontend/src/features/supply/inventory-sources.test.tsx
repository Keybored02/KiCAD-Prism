import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { InventorySource } from "@/types/supply";

const listInventorySources = vi.fn();
vi.mock("./inventory-api", () => ({
  listInventorySources: () => listInventorySources(),
  syncInventorySource: vi.fn(),
  updateInventorySource: vi.fn(),
  deleteInventorySource: vi.fn(),
  checkInventorySource: vi.fn(),
  createInventorySource: vi.fn(),
}));

import { InventorySourcesSection, sourceState } from "./inventory-sources";

afterEach(cleanup);

function source(extra: Partial<InventorySource> = {}): InventorySource {
  return {
    id: "s1", kind: "inventree", display_name: "Vision", base_url: "https://vision.example.com", category_id: 3, enabled: true,
    interval_hours: 24, has_token: true, server: "Vision", api_version: 566, last_sync_at: "2026-10-28T10:00:00Z", last_status: "ok",
    last_error: "", matched: 790, unmatched: 12, ...extra,
  };
}

describe("local inventory sources", () => {
  it("says the worst thing about a source first", () => {
    expect(sourceState(source({ enabled: false, has_token: false })).label).toBe("Disabled");
    expect(sourceState(source({ has_token: false })).label).toBe("No token");
    expect(sourceState(source({ category_id: null })).label).toBe("No category");
    expect(sourceState(source({ last_status: "error" })).label).toBe("Read failed");
    expect(sourceState(source({ last_sync_at: null, last_status: "" })).label).toBe("Not read yet");
    expect(sourceState(source()).label).toBe("Reading");
  });

  it("lists sources with what they matched, and only admins can change them", async () => {
    listInventorySources.mockResolvedValue([source({ last_status: "error", last_error: "auth_failed: 401" })]);
    render(<InventorySourcesSection isAdmin={false} />);
    expect(await screen.findByText("790 matched · 12 unmatched")).toBeTruthy();
    expect(screen.getByText("auth_failed: 401")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Add source/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Actions for Vision/ })).toBeNull();
    cleanup();
    render(<InventorySourcesSection isAdmin />);
    expect(await screen.findByRole("button", { name: /Actions for Vision/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Add source/ })).toBeTruthy();
  });
});

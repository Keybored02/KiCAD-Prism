import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { InventorySource, InventoryUnmatchedPart } from "@/types/supply";

const listInventorySources = vi.fn();
const listUnmatchedParts = vi.fn();
vi.mock("./inventory-api", () => ({
  listInventorySources: () => listInventorySources(),
  listUnmatchedParts: (id: string) => listUnmatchedParts(id),
  linkUnmatchedPart: vi.fn(),
}));

import { UnmatchedStockSection } from "./unmatched-stock";

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const source = (id: string, unmatched: number) => ({ id, display_name: id === "a" ? "Vision" : "Lab", unmatched }) as InventorySource;
const part = (remote_part: string, quantity: number, extra: Partial<InventoryUnmatchedPart> = {}): InventoryUnmatchedPart => ({
  remote_part, ipn: "", mpn: `MPN-${remote_part}`, manufacturer: "Unknown manufacturer", name: `Part ${remote_part}`, quantity, records: 1,
  reason: "no_component", seen_at: "2026-10-28T10:00:00Z", ...extra,
});

describe("unmatched local stock", () => {
  it("lists every source's parts, largest stock first, and asks only sources that have some", async () => {
    listInventorySources.mockResolvedValue([source("a", 2), source("b", 0)]);
    listUnmatchedParts.mockResolvedValue([part("1", 5), part("2", 400, { ipn: "13970", reason: "sap_code_shared" })]);
    render(<UnmatchedStockSection canDecide />);
    const rows = await screen.findAllByRole("listitem");
    expect(rows.map((row) => row.querySelector("p")?.textContent)).toEqual(["Part 2", "Part 1"]);
    expect(screen.getByText("Vision · SAP 13970 · MPN-2 · SAP code on several components")).toBeTruthy();
    expect(listUnmatchedParts).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button", { name: /Link/ })).toHaveLength(2);
  });

  it("shows nothing when nothing waits, and no actions to those who cannot decide", async () => {
    listInventorySources.mockResolvedValue([source("a", 1)]);
    listUnmatchedParts.mockResolvedValue([part("1", 5)]);
    render(<UnmatchedStockSection canDecide={false} />);
    expect(await screen.findByText("Part 1")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Link/ })).toBeNull();
    cleanup();
    listInventorySources.mockResolvedValue([]);
    const { container } = render(<UnmatchedStockSection canDecide />);
    await Promise.resolve();
    expect(container.textContent).toBe("");
  });
});

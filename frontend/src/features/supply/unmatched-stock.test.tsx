import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { InventorySource, InventoryUnmatchedPart } from "@/types/supply";

const listInventorySources = vi.fn();
const listUnmatchedParts = vi.fn();
vi.mock("./inventory-api", () => ({
  listInventorySources: () => listInventorySources(),
  listUnmatchedParts: (id: string, _signal?: AbortSignal, page?: unknown) => listUnmatchedParts(id, page),
  linkUnmatchedPart: vi.fn(),
}));

import { sameIdentity, UNMATCHED_PAGE, UnmatchedStockSection } from "./unmatched-stock";

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const source = (id: string, unmatched: number, extra: Partial<InventorySource> = {}) => ({ id, display_name: id === "a" ? "Stores" : "Lab", unmatched, ...extra }) as InventorySource;
const part = (remote_part: string, quantity: number, extra: Partial<InventoryUnmatchedPart> = {}): InventoryUnmatchedPart => ({
  remote_part, ipn: "", mpn: `MPN-${remote_part}`, manufacturer: "Unknown manufacturer", name: `Part ${remote_part}`, quantity, records: 1,
  reason: "no_component", seen_at: "2026-10-28T10:00:00Z", ...extra,
});

describe("unmatched local stock", () => {
  it("lists every source's parts, largest stock first", async () => {
    listInventorySources.mockResolvedValue([source("a", 2), source("b", 0)]);
    listUnmatchedParts.mockImplementation(async (id: string) => (id === "a" ? [part("1", 5), part("2", 400, { ipn: "10042", reason: "sap_code_shared" })] : []));
    render(<UnmatchedStockSection canDecide />);
    const rows = await screen.findAllByRole("listitem");
    expect(rows.map((row) => row.querySelector("p")?.textContent)).toEqual(["Part 2", "Part 1"]);
    expect(screen.getByText("Stores · SAP 10042 · MPN-2 · SAP code on several components")).toBeTruthy();
    // A source counting none unmatched may still hold linked rows waiting for a read.
    expect(listUnmatchedParts).toHaveBeenCalledTimes(2);
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

  it("keeps a linked part listed, with its component and the next read, and does not count it", async () => {
    listInventorySources.mockResolvedValue([source("a", 0, { last_sync_at: "2026-10-28T10:00:00Z", interval_hours: 1 })]);
    listUnmatchedParts.mockResolvedValue([part("1", 825, { linked_component_id: "c1", linked_mpn: "RC0603FR-0710KL" })]);
    render(<UnmatchedStockSection canDecide />);
    expect(await screen.findByText(/^Linked · RC0603FR-0710KL · next read /)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Unmatched local stock/ }).textContent).toContain("0");
  });

  it("asks for a page at a time, searches on the server and counts every part waiting", async () => {
    listInventorySources.mockResolvedValue([source("a", 859)]);
    listUnmatchedParts.mockImplementation(async (_id: string, page: { limit: number }) =>
      Array.from({ length: page.limit }, (_, index) => part(String(index), 1000 - index)));
    render(<UnmatchedStockSection canDecide />);
    // A long section starts closed.
    fireEvent.click(await screen.findByRole("button", { name: /Unmatched local stock/ }));
    expect(await screen.findAllByRole("listitem")).toHaveLength(UNMATCHED_PAGE);
    expect(listUnmatchedParts).toHaveBeenLastCalledWith("a", { q: "", limit: UNMATCHED_PAGE + 1 });
    expect(screen.getByRole("button", { name: /Unmatched local stock/ }).textContent).toContain("859");
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(UNMATCHED_PAGE * 2));
    fireEvent.change(screen.getByRole("textbox", { name: "Search unmatched stock" }), { target: { value: "MPN-7" } });
    fireEvent.submit(screen.getByRole("search"));
    await waitFor(() => expect(listUnmatchedParts).toHaveBeenLastCalledWith("a", { q: "MPN-7", limit: UNMATCHED_PAGE + 1 }));
  });
});

describe("the identity check before linking", () => {
  it("is the same part on the MPN, spelled any way, or on the SAP code", () => {
    expect(sameIdentity({ mpn: "rc0603fr-0710kl", ipn: "" }, { mpn: "RC0603FR0710KL", sap_code: "" })).toBe(true);
    expect(sameIdentity({ mpn: "", ipn: "10042" }, { mpn: "X", sap_code: "10042" })).toBe(true);
    expect(sameIdentity({ mpn: "TNPW060310K0BEEA", ipn: "12723" }, { mpn: "RC0603FR-0710KL", sap_code: "" })).toBe(false);
    expect(sameIdentity({ mpn: "", ipn: "" }, { mpn: "", sap_code: "" })).toBe(false);
  });
});

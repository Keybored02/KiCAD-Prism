import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./catalog-supply-api", () => ({ watchCatalogComponents: vi.fn() }));

import { CatalogSupplyBar } from "./catalog-supply-bar";
import { passesSupplyFilter, supplyFilterFrom } from "./catalog-supply-filter";
import * as api from "./catalog-supply-api";

const mocked = vi.mocked(api);
const rows = [
  { id: "c1", manufacturer: "Acme", mpn: "A-1" },
  { id: "c2", manufacturer: "Acme", mpn: "A-2" },
  { id: "c3", manufacturer: "", mpn: "" },
];
const standing = { c1: { status: "ok" as const, stock: 10, watched: true }, c2: { status: "error" as const, stock: 0, watched: false } };

beforeEach(() => {
  vi.clearAllMocks();
  mocked.watchCatalogComponents.mockResolvedValue(1);
});
afterEach(cleanup);

describe("the catalog supply filters", () => {
  it("passes watched and at-risk components, and nothing Prism does not track", () => {
    expect(passesSupplyFilter("", undefined)).toBe(true);
    expect(passesSupplyFilter("watched", standing.c1)).toBe(true);
    expect(passesSupplyFilter("watched", standing.c2)).toBe(false);
    expect(passesSupplyFilter("at_risk", standing.c2)).toBe(true);
    expect(passesSupplyFilter("at_risk", undefined)).toBe(false);
    expect(supplyFilterFrom("at_risk")).toBe("at_risk");
    expect(supplyFilterFrom("junk")).toBe("");
  });

  it("toggles a filter on and off", () => {
    const onFilter = vi.fn();
    const { rerender } = render(<CatalogSupplyBar filter="" onFilter={onFilter} rows={rows} standing={standing} role="designer" onChanged={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "At risk" }));
    expect(onFilter).toHaveBeenLastCalledWith("at_risk");
    rerender(<CatalogSupplyBar filter="at_risk" onFilter={onFilter} rows={rows} standing={standing} role="designer" onChanged={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "At risk" }));
    expect(onFilter).toHaveBeenLastCalledWith("");
  });

  it("watches the shown components that are not watched yet and have a part number", async () => {
    const changed = vi.fn();
    render(<CatalogSupplyBar filter="" onFilter={() => undefined} rows={rows} standing={standing} role="designer" onChanged={changed} />);
    fireEvent.click(screen.getByRole("button", { name: /Watch 1 shown/ }));
    await waitFor(() => expect(mocked.watchCatalogComponents).toHaveBeenCalledWith([{ id: "c2", manufacturer: "Acme", mpn: "A-2" }]));
    await waitFor(() => expect(changed).toHaveBeenCalled());
  });

  it("offers no watching to a reader, and nothing at all to a role without supply access", () => {
    const { rerender, container } = render(<CatalogSupplyBar filter="" onFilter={() => undefined} rows={rows} standing={standing} role="qa" onChanged={() => undefined} />);
    expect(screen.queryByRole("button", { name: /Watch (these|\d+ shown)/ })).toBeNull();
    rerender(<CatalogSupplyBar filter="" onFilter={() => undefined} rows={rows} standing={standing} role="viewer" onChanged={() => undefined} />);
    expect(container.textContent).toBe("");
  });
});

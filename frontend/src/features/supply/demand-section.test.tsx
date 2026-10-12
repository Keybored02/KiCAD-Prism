import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyDemand } from "@/types/supply";
import { demandSentence, parseQuantity } from "./demand-model";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  listPartDemands: vi.fn(),
  addPartDemand: vi.fn(),
  closePartDemand: vi.fn(),
}));

import { DemandSection } from "./demand-section";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

const entry: SupplyDemand = {
  id: "d1", part_id: "p1", source: "manual", quantity: 1000, need_by: "2026-12-01", state: "planned", note: "Spring run", created_by: "a@example.com",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.listPartDemands.mockResolvedValue({ items: [entry], summary: { open: 1000, own_stock: 250, net: 750, next_need_by: "2026-12-01" } });
  mocked.addPartDemand.mockResolvedValue(entry);
  mocked.closePartDemand.mockResolvedValue();
});
afterEach(cleanup);

describe("the demand section", () => {
  it("says what is left to cover and lists the demands", async () => {
    render(<DemandSection partId="p1" canEdit />);
    expect(await screen.findByText("1,000 needed, we hold 250, 750 left for distributors to cover. Next date: 2026-12-01.")).toBeTruthy();
    expect(screen.getByText(", Spring run")).toBeTruthy();
  });

  it("adds a demand and reloads", async () => {
    render(<DemandSection partId="p1" canEdit />);
    await screen.findByText(/needed, we hold/);
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "500" } });
    fireEvent.change(screen.getByLabelText("Needed by"), { target: { value: "2027-01-15" } });
    fireEvent.click(screen.getByRole("button", { name: "Add demand" }));
    await waitFor(() => expect(mocked.addPartDemand).toHaveBeenCalledWith("p1", { quantity: 500, need_by: "2027-01-15", committed: false, note: "" }));
    await waitFor(() => expect(mocked.listPartDemands).toHaveBeenCalledTimes(2));
  });

  it("closes a demand", async () => {
    render(<DemandSection partId="p1" canEdit />);
    fireEvent.click(await screen.findByRole("button", { name: "Close the demand for 1000" }));
    await waitFor(() => expect(mocked.closePartDemand).toHaveBeenCalledWith("d1"));
  });

  it("is read only without write access", async () => {
    render(<DemandSection partId="p1" canEdit={false} />);
    await screen.findByText(/needed, we hold/);
    expect(screen.queryByRole("button", { name: "Add demand" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Close the demand/ })).toBeNull();
  });
});

describe("demand wording", () => {
  it("reads a quantity only when it is a whole number other than zero", () => {
    expect([parseQuantity("500"), parseQuantity("-20"), parseQuantity("0"), parseQuantity("1.5"), parseQuantity(""), parseQuantity("x")]).toEqual([500, -20, undefined, undefined, undefined, undefined]);
  });

  it("describes nothing, unknown stock and incoming stock", () => {
    expect(demandSentence({ open: 0, own_stock: null, net: 0, next_need_by: null })).toBe("Nothing is asked of this part.");
    expect(demandSentence({ open: 100, own_stock: null, net: 100, next_need_by: null })).toBe("100 needed, our stock is unknown, 100 left for distributors to cover.");
    expect(demandSentence({ open: -50, own_stock: 0, net: 0, next_need_by: null })).toBe("50 more is coming in than is asked for.");
  });
});

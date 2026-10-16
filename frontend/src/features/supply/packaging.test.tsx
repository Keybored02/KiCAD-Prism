import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PackagingOptions } from "@/types/supply";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./packaging-api", () => ({
  listPackagingWaiting: vi.fn(), getPackagingOptions: vi.fn(), pickPackaging: vi.fn(), clearPackagingPick: vi.fn(), applySimilarPicks: vi.fn(),
}));

import * as api from "./packaging-api";
import { PackagingPickDialog } from "./packaging-pick-dialog";
import { PackagingSection } from "./packaging-section";

const mocked = vi.mocked(api);

const options: PackagingOptions = {
  part_id: "p1", connector_id: "c1", picked: null, saves_calls_a_day: 1,
  listings: [
    { id: "l1", sku: "C1", packaging: "cut_tape", moq: 1, order_multiple: 1, stock: 500, lead_time_days: null, marketplace: false, currency: "USD", prices: { "1": "0.5", "100": "0.4", "1000": "0.4" }, fetched_at: null },
    { id: "l2", sku: "C2", packaging: "tape_reel", moq: 3000, order_multiple: 3000, stock: 9000, lead_time_days: null, marketplace: false, currency: "USD", prices: { "1": null, "100": null, "1000": null }, fetched_at: null },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getPackagingOptions.mockResolvedValue(options);
});
afterEach(cleanup);

describe("picking a packaging", () => {
  it("sets the listings side by side, marks what differs and says what picking saves", async () => {
    mocked.pickPackaging.mockResolvedValue({ picked: "l2", packaging: "tape_reel", similar: [] });
    const changed = vi.fn();
    const closed = vi.fn();
    render(<PackagingPickDialog partId="p1" connectorId="c1" onClose={closed} onChanged={changed} />);
    const table = await screen.findByRole("table", { name: "Listings" });
    expect(screen.getByText(/saves 1.00 calls a day/)).toBeTruthy();
    expect(within(table).getByText("Stock *")).toBeTruthy();
    expect(within(table).getByText("Marketplace")).toBeTruthy();
    fireEvent.click(within(table).getAllByRole("button", { name: "Pick this" })[1]);
    await waitFor(() => expect(mocked.pickPackaging).toHaveBeenCalledWith("p1", "c1", "l2"));
    await waitFor(() => expect(closed).toHaveBeenCalled());
    expect(changed).toHaveBeenCalled();
  });

  it("offers the same packaging for similar parts and applies only what is ticked", async () => {
    mocked.pickPackaging.mockResolvedValue({
      picked: "l2", packaging: "tape_reel",
      similar: [
        { part_id: "p2", connector_id: "c1", connector: "LCSC", mpn: "B", manufacturer: "Acme", listings: 2, saves_calls_a_day: 1, listing_id: "x", sku: "C9" },
        { part_id: "p3", connector_id: "c1", connector: "LCSC", mpn: "C", manufacturer: "Acme", listings: 2, saves_calls_a_day: 1, listing_id: "y", sku: "C8" },
      ],
    });
    mocked.applySimilarPicks.mockResolvedValue({ picked: 1 });
    render(<PackagingPickDialog partId="p1" connectorId="c1" onClose={vi.fn()} onChanged={vi.fn()} />);
    fireEvent.click((await screen.findAllByRole("button", { name: "Pick this" }))[1]);
    const list = await screen.findByRole("list", { name: "Similar parts" });
    fireEvent.click(within(list).getByLabelText(/^C, Acme/));
    fireEvent.click(screen.getByRole("button", { name: "Apply to 1" }));
    await waitFor(() => expect(mocked.applySimilarPicks).toHaveBeenCalledWith("c1", "tape_reel", ["p2"]));
  });
});

describe("the packaging section", () => {
  const item = { part_id: "p1", connector_id: "c1", connector: "LCSC", mpn: "LM358DR", manufacturer: "TI", listings: 3, saves_calls_a_day: 2 };

  it("lists the picks waiting with what they save, and shows nothing when there are none", () => {
    const { container, rerender } = render(<PackagingSection items={[item]} saves={2} canPick onChanged={vi.fn()} />);
    expect(screen.getByText("picking saves 2.0 calls a day")).toBeTruthy();
    expect(within(screen.getByLabelText("Packaging")).getByText("1")).toBeTruthy();
    expect(screen.getByText(/saves 2.00 a day/)).toBeTruthy();
    rerender(<PackagingSection items={[]} saves={0} canPick onChanged={vi.fn()} />);
    expect(container.textContent).toBe("");
  });

  it("leaves the pick to those who may", () => {
    render(<PackagingSection items={[item]} saves={2} canPick={false} onChanged={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Pick" })).toBeNull();
  });
});

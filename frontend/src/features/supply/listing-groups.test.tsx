import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SupplyListing } from "@/types/supply";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  setPreferredDistributor: vi.fn(),
  clearPreferredDistributor: vi.fn(),
}));
vi.mock("./packaging-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./packaging-api")>()),
  pickPackaging: vi.fn(),
  getAutoProposals: vi.fn(),
  applyAutoProposals: vi.fn(),
}));

import { ListingGroups } from "./listing-groups";
import * as packaging from "./packaging-api";
import * as api from "./supply-api";
import { partDetailFixture } from "./supply-test-fixtures";

afterEach(cleanup);

const listing = (id: string, connector: string, name: string, provider: string, sku: string, packagingName: string): SupplyListing => ({
  id, connector_id: connector, connector_name: name, provider, sku, packaging: packagingName, match_state: "exact", counted: true, offer: null, poll: null,
});

const detail = (extra = {}) => partDetailFixture({
  listings: [
    listing("a", "c1", "DigiKey", "digikey", "CT-1", "cut_tape"),
    listing("b", "c1", "DigiKey", "digikey", "REEL-2", "tape_reel"),
    listing("m", "c2", "Mouser", "mouser", "MOU-1", "several"),
  ],
  packaging: { picks: { c1: "a" }, picked_by: { c1: { by: "auto", note: "" } }, needs_pick: [] },
  ...extra,
});

function renderGroups(overrides = {}, canTrack = true) {
  const onChanged = vi.fn().mockResolvedValue(undefined);
  render(<MemoryRouter><ListingGroups detail={detail(overrides)} canDecide canTrack={canTrack} onChanged={onChanged} /></MemoryRouter>);
  return onChanged;
}

describe("the part's listings by distributor", () => {
  it("says which listing is followed, who picked it, and greys the others", () => {
    renderGroups();
    const digikey = screen.getByRole("region", { name: "DigiKey listings" });
    expect(within(digikey).getByText("Following CT-1, picked by Prism")).toBeTruthy();
    expect(within(digikey).getByText("Followed")).toBeTruthy();
    expect(within(digikey).queryByText("Not counted")).toBeNull();
    // The vendor is named once, by its group, not on each listing.
    expect(within(digikey).getAllByText("DigiKey")).toHaveLength(1);
  });

  it("folds a distributor's listings behind a chevron", () => {
    renderGroups();
    const digikey = screen.getByRole("region", { name: "DigiKey listings" });
    expect(within(digikey).getAllByRole("article").length).toBeGreaterThan(0);
    fireEvent.click(within(digikey).getByRole("button", { name: "Hide DigiKey listings" }));
    expect(within(digikey).queryAllByRole("article")).toHaveLength(0);
    expect(within(screen.getByRole("region", { name: "Mouser listings" })).getAllByRole("article").length).toBeGreaterThan(0);
    fireEvent.click(within(digikey).getByRole("button", { name: "Show DigiKey listings" }));
    expect(within(digikey).getAllByRole("article").length).toBeGreaterThan(0);
  });

  it("follows another listing on request", async () => {
    vi.mocked(packaging.pickPackaging).mockResolvedValue({ picked: "b", packaging: "tape_reel", similar: [] });
    const onChanged = renderGroups();
    fireEvent.click(screen.getByRole("button", { name: "Follow this instead" }));
    await waitFor(() => expect(packaging.pickPackaging).toHaveBeenCalledWith("p1", "c1", "b"));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("puts the preferred distributor first and marks it, and a star sets or clears it", async () => {
    vi.mocked(api.clearPreferredDistributor).mockResolvedValue(undefined);
    vi.mocked(api.setPreferredDistributor).mockResolvedValue(undefined);
    renderGroups({ preferred_connector_id: "c2" });
    const regions = screen.getAllByRole("region");
    expect(regions[0].getAttribute("aria-label")).toBe("Mouser listings");
    expect(within(regions[0]).getByText("Preferred")).toBeTruthy();
    // The tint marks the preferred one without changing its size.
    expect(regions[0].className).toContain("p-2");
    expect(regions[1].className).toContain("p-2");
    fireEvent.click(screen.getByRole("button", { name: "Prefer DigiKey" }));
    await waitFor(() => expect(api.setPreferredDistributor).toHaveBeenCalledWith("p1", "c1"));
    fireEvent.click(screen.getByRole("button", { name: "Stop preferring Mouser" }));
    await waitFor(() => expect(api.clearPreferredDistributor).toHaveBeenCalledWith("p1"));
  });

  it("offers one per distributor while a distributor waits for a pick, and shows what it would pick first", async () => {
    vi.mocked(packaging.getAutoProposals).mockResolvedValue({
      items: [{ connector_id: "c1", connector: "DigiKey", listing_id: "a", sku: "CT-1", packaging: "cut_tape", note: "", saves_calls_a_day: 0 }],
      saves_calls_a_day: 0,
    });
    renderGroups({ packaging: { picks: {}, needs_pick: [{ connector_id: "c1", connector: "DigiKey", listings: 2 }] } });
    fireEvent.click(screen.getByRole("button", { name: "One per distributor" }));
    expect(await screen.findByText("read together: no saving")).toBeTruthy();
  });

  it("shows no star to a viewer", () => {
    renderGroups({}, false);
    expect(screen.queryByRole("button", { name: /Prefer/ })).toBeNull();
  });
});

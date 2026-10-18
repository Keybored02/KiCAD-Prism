import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SupplyListing } from "@/types/supply";
import { collapseSameTerms } from "./listing-same-terms";
import { ListingTable } from "./listing-table";
import { PackagingChip } from "./packaging-chip";

vi.mock("./supply-api", async (importOriginal) => ({ ...(await importOriginal<typeof import("./supply-api")>()), pinSupplyListing: vi.fn() }));

afterEach(cleanup);

function listing(sku: string, packaging: string, over: { stock?: number; moq?: number; breaks?: Array<[number, string]> } = {}): SupplyListing {
  return {
    id: sku, connector_id: "dk", connector_name: "DigiKey", provider: "digikey", sku, packaging, match_state: "exact", counted: true,
    offer: {
      fetched_at: "2026-10-18T00:00:00Z", stock: over.stock ?? 401872, incoming: [], moq: over.moq ?? 1, order_multiple: 1,
      price_breaks: over.breaks ?? [[1, "0.76"], [10, "0.656"]], currency: "EUR", lead_time_days: null, lifecycle: "active", discontinued: false,
      rohs: true, marketplace: false, product_url: "",
    },
    poll: null,
  };
}

describe("one way of buying listed twice", () => {
  const cut = listing("535-9543-1-ND", "cut_tape");
  const digiReel = listing("535-9543-6-ND", "custom_reel");
  const reel = listing("535-9543-2-ND", "tape_reel", { stock: 400900, moq: 3000, breaks: [[3000, "0.46346"]] });

  it("folds cut tape and its custom reel together and leaves the reel alone", () => {
    const { shown, also } = collapseSameTerms([digiReel, reel, cut]);
    expect(shown.map((item) => item.sku)).toEqual(["535-9543-6-ND", "535-9543-2-ND", "535-9543-1-ND"].filter((sku) => sku !== "535-9543-6-ND"));
    expect(also.get("535-9543-1-ND")?.map((item) => item.sku)).toEqual(["535-9543-6-ND"]);
  });

  it("keeps both when the prices or the stock differ", () => {
    expect(collapseSameTerms([cut, listing("535-9543-6-ND", "custom_reel", { breaks: [[1, "0.80"]] })]).shown).toHaveLength(2);
    expect(collapseSameTerms([cut, listing("535-9543-6-ND", "custom_reel", { stock: 5 })]).shown).toHaveLength(2);
  });

  it("shows the card of the cut tape with the other number named, and the reel on its own", () => {
    render(<ListingTable listings={[cut, digiReel, reel]} />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    const card = screen.getByRole("article", { name: "Listing 535-9543-1-ND" });
    expect(within(card).getByText(/Also sold as 535-9543-6-ND \(Custom reel\), with the same stock and prices/)).toBeTruthy();
    expect(screen.getByRole("article", { name: "Listing 535-9543-2-ND" })).toBeTruthy();
  });

  it("names both packagings in one chip", () => {
    render(<PackagingChip packaging="cut_tape" also={["custom_reel"]} />);
    expect(screen.getByText("Cut tape / Custom reel")).toBeTruthy();
  });
});

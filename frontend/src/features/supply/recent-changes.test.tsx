import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { SupplyRecentChange } from "@/types/supply";
import { RecentChanges } from "./recent-changes";

afterEach(cleanup);

const change = (type: SupplyRecentChange["type"], detail: Record<string, unknown>): SupplyRecentChange => ({
  at: new Date().toISOString(), type, part_id: "p1", mpn: "LM358D", manufacturer: "TI", alert: null, sku: "S-1", detail,
});

describe("the recent changes", () => {
  it("say what a reading showed that the one before did not", () => {
    render(<RecentChanges onOpenPart={() => undefined} changes={[
      change("lifecycle_changed", { from: "active", to: "last_time_buy" }),
      change("normally_stocking_lost", {}),
      change("moq_jump", { from: 1, to: 2500 }),
      change("listing_gone", { packaging: "cut_tape" }),
    ]} />);
    expect(screen.getByText("Lifecycle changed from active to last time buy (S-1)")).toBeTruthy();
    expect(screen.getByText("A distributor no longer stocks it normally (S-1)")).toBeTruthy();
    expect(screen.getByText("Smallest order went from 1 to 2500 (S-1)")).toBeTruthy();
    expect(screen.getByText("A distributor stopped listing it (S-1, cut tape)")).toBeTruthy();
  });
});

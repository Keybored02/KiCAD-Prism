import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toasts }));
vi.mock("./supply-api", () => ({ seedSupplyFromCatalog: vi.fn() }));

import { SeedFromCatalogButton, seedSummary } from "./seed-from-catalog-button";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("seedSummary", () => {
  it("says what happened, and only mentions what went wrong when something did", () => {
    expect(seedSummary({ considered: 0, added: 0, already: 0, no_connector: 0, unknown_manufacturer: 0 }))
      .toBe("No catalog component names a vendor and its part number.");
    expect(seedSummary({ considered: 5, added: 3, already: 2, no_connector: 0, unknown_manufacturer: 0 }))
      .toBe("5 components with a vendor part number: 3 added, 2 already known.");
    expect(seedSummary({ considered: 5, added: 1, already: 0, no_connector: 3, unknown_manufacturer: 1 }))
      .toBe("5 components with a vendor part number: 1 added, 0 already known, 3 for a vendor with no single connector, 1 with a manufacturer Prism does not know.");
  });
});

describe("SeedFromCatalogButton", () => {
  it("runs the seeding, reports it and lets the list reload", async () => {
    mocked.seedSupplyFromCatalog.mockResolvedValue({ considered: 2, added: 2, already: 0, no_connector: 0, unknown_manufacturer: 0 });
    const onDone = vi.fn();
    render(<SeedFromCatalogButton onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /Read catalog vendors/ }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(toasts.success).toHaveBeenCalledWith("2 components with a vendor part number: 2 added, 0 already known.");
  });

  it("shows a failure and does not reload", async () => {
    mocked.seedSupplyFromCatalog.mockRejectedValue(new Error("Could not read the catalog vendors"));
    const onDone = vi.fn();
    render(<SeedFromCatalogButton onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: /Read catalog vendors/ }));
    await waitFor(() => expect(toasts.error).toHaveBeenCalledWith("Could not read the catalog vendors"));
    expect(onDone).not.toHaveBeenCalled();
  });
});

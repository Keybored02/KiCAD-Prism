import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyBomRollup } from "@/types/supply";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getProjectBomHealth: vi.fn(),
}));

import { ProjectSupplyCard } from "./project-supply-card";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

const rollup: SupplyBomRollup = {
  lines: 10, tracked: 8, not_tracked: 2, watched: 5, at_risk: 1, short: 0, priced: 8, lines_priced: 8, parts: 8,
  currency: "EUR", cost_build: "12.50", cost_per_board: "12.50", can_build: 400, limited_by: "k1", without_stock_data: 0,
  health: 7.4, health_status: "warning",
};

const renderCard = (role: "designer" | "qa" | "viewer") =>
  render(<MemoryRouter initialEntries={["/project/p1"]}><ProjectSupplyCard projectId="p1" role={role} /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getProjectBomHealth.mockResolvedValue({ available: true, rollup });
});
afterEach(cleanup);

describe("the project supply line", () => {
  it("says how the project's parts stand and opens the Supply tab", async () => {
    renderCard("designer");
    expect(await screen.findByText(/7\.4 of 10/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Supply" }).getAttribute("href")).toContain("section=supply");
  });

  it("shows nothing to a viewer, and never asks", () => {
    const { container } = renderCard("viewer");
    expect(container.textContent).toBe("");
    expect(mocked.getProjectBomHealth).not.toHaveBeenCalled();
  });

  it("shows nothing before the BOM has been read", async () => {
    mocked.getProjectBomHealth.mockResolvedValue({ available: false });
    const { container } = renderCard("qa");
    await vi.waitFor(() => expect(mocked.getProjectBomHealth).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });
});

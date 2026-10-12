import { cleanup, render, screen } from "@testing-library/react";
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

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getProjectBomHealth.mockResolvedValue({ available: true, rollup });
});
afterEach(cleanup);

describe("the project supply card", () => {
  it("says how the project's parts stand", async () => {
    render(<ProjectSupplyCard projectId="p1" role="designer" />);
    expect(await screen.findByRole("region", { name: "Supply" })).toBeTruthy();
    expect(screen.getAllByText(/7\.4 of 10/).length).toBeGreaterThan(0);
    expect(screen.getByText("1 at risk")).toBeTruthy();
  });

  it("links the compliance draft for the project", async () => {
    render(<ProjectSupplyCard projectId="p 1" role="qa" />);
    const link = await screen.findByRole("link", { name: "Download a draft RoHS and REACH declaration" });
    expect(link.getAttribute("href")).toBe("/api/supply/projects/p%201/compliance-draft?format=csv");
  });

  it("shows nothing to a viewer, and never asks", () => {
    const { container } = render(<ProjectSupplyCard projectId="p1" role="viewer" />);
    expect(container.textContent).toBe("");
    expect(mocked.getProjectBomHealth).not.toHaveBeenCalled();
  });

  it("shows nothing before the BOM has been read", async () => {
    mocked.getProjectBomHealth.mockResolvedValue({ available: false });
    const { container } = render(<ProjectSupplyCard projectId="p1" role="qa" />);
    await vi.waitFor(() => expect(mocked.getProjectBomHealth).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProjectSupplyPart } from "@/types/supply";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  listSupplyParts: vi.fn(),
  listSupplyConnectors: vi.fn(),
}));

import { ProjectPartsList } from "./project-parts-list";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

afterEach(cleanup);

const line = (key: string, mpn: string, part_id: string | null): ProjectSupplyPart => ({
  key, manufacturer: "Acme", mpn, quantity: 1, references: "R1", part_id, state: "tracked", status: "ok", stock: key === "ka" ? 0 : 100, lifecycle: "active",
  lead_time_days: null, short: false, unit_price: "0.1", tier: 1, waiting: false, notes: 0, need: 10, line_cost: "1.00",
} as ProjectSupplyPart);

const row = (id: string, mpn: string) => ({
  id, mpn, manufacturer: "Acme", status: "ok", problem: null, stock: 100, listings: 1, lifecycle: "active", dropped: false, unit_price: "0.1",
  price_quantity: 100, currency: "EUR", fetched_at: null, tier: 1, used_in: 1, watch: null, flags: [], distributors: [],
});

beforeEach(() => {
  mocked.listSupplyConnectors.mockResolvedValue([]);
  mocked.listSupplyParts.mockResolvedValue({
    items: [row("a", "RISKY-1"), row("b", "SAFE-1")], total: 2, limit: 200, offset: 0, next_offset: null,
    forecast_state: { runout: "shown", out_4w: "shown", can_buy_4w: "shown", can_buy_8w: "shown" },
  } as never);
});

const show = () => render(
  <MemoryRouter>
    <ProjectPartsList
      projectId="prj" currency="EUR" selectedId={null} onOpen={() => undefined}
      parts={[line("ka", "RISKY-1", "a"), line("kb", "SAFE-1", "b"), line("kc", "NOPN", null)]}
    />
  </MemoryRouter>,
);

describe("a project's parts list", () => {
  it("finds the lines that carry a reference on the board, exactly, whatever the case", async () => {
    show();
    await screen.findByText("RISKY-1");
    const search = async (text: string) => {
      fireEvent.change(screen.getByLabelText("Search parts"), { target: { value: text } });
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
    };
    await search("r1");
    expect(screen.getAllByText("RISKY-1").length).toBeGreaterThan(0);
    expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("all", "", expect.anything(), "", 0, 200, "prj", "");
    await search("R");
    expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("all", "R", expect.anything(), "", 0, 200, "prj", "");
  });

  it("lists a line that matches no part after the parts, until something narrows the list", async () => {
    show();
    expect(await screen.findByText("NOPN")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Out of stock/ }));
    expect(screen.queryByText("NOPN")).toBeNull();
    expect(screen.queryByText("SAFE-1")).toBeNull();
    expect(screen.getByText("RISKY-1")).toBeTruthy();
  });
});

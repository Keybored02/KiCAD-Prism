import { cleanup, render, screen } from "@testing-library/react";
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
  key, manufacturer: "Acme", mpn, quantity: 1, references: "R1", part_id, state: "tracked", status: "ok", stock: 100, lifecycle: "active",
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

const show = (only: ReadonlySet<string> | null = null) => render(
  <MemoryRouter>
    <ProjectPartsList
      projectId="prj" only={only} shortAt8Weeks={{ ka: 0.8, kb: 0.1 }} chance={0.5} currency="EUR" selectedId={null} onOpen={() => undefined}
      parts={[line("ka", "RISKY-1", "a"), line("kb", "SAFE-1", "b"), line("kc", "NOPN", null)]}
    />
  </MemoryRouter>,
);

describe("a project's parts list", () => {
  it("marks the lines likely to be short within 8 weeks, from the forecast, and no others", async () => {
    show();
    expect(await screen.findByText("RISKY-1")).toBeTruthy();
    expect(screen.getAllByText("Out within 8 weeks")).toHaveLength(1);
    expect(screen.getByText("Out within 8 weeks").getAttribute("title")).toContain("80%");
  });

  it("lists a line that matches no part after the parts, until something narrows the list", async () => {
    const view = show();
    expect(await screen.findByText("NOPN")).toBeTruthy();
    view.unmount();
    show(new Set(["a"]));
    expect(await screen.findByText("RISKY-1")).toBeTruthy();
    expect(screen.queryByText("SAFE-1")).toBeNull();
    expect(screen.queryByText("NOPN")).toBeNull();
  });
});

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProjectSupply, SupplyBomRollup } from "@/types/supply";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getProjectSupply: vi.fn(),
  getProjectForecast: vi.fn(() => new Promise(() => undefined)),
}));
vi.mock("./tracking-api", () => ({ keepUsualBuild: vi.fn() }));
vi.mock("./part-sheet", () => ({ PartSheet: ({ partId }: { partId: string | null }) => (partId ? <div role="dialog">Sheet of {partId}</div> : null) }));
vi.mock("./track-project-dialog", () => ({ TrackProjectButton: () => <button type="button">Track this project</button> }));

import { ProjectSupplyTab } from "./project-supply-tab";
import * as api from "./supply-api";
import { keepUsualBuild } from "./tracking-api";

const mocked = vi.mocked(api);

const rollup: SupplyBomRollup = {
  lines: 3, tracked: 2, not_tracked: 1, watched: 2, at_risk: 1, short: 1, priced: 2, lines_priced: 2, parts: 2,
  currency: "EUR", cost_build: "12.50", cost_per_board: "12.50", can_build: 400, limited_by: "k1", without_stock_data: 0,
  health: 7.4, health_status: "warning",
};

const supply = (overrides: Partial<ProjectSupply> = {}): ProjectSupply => ({
  available: true, variant: "", variants: [], rollup,
  parts: [
    { key: "k2", manufacturer: "Acme", mpn: "GOOD-1", quantity: 2, references: "R1 R2", part_id: "p2", state: "tracked", status: "ok", stock: 5000, lifecycle: "active", lead_time_days: 14, short: false, unit_price: "0.1", tier: 2, waiting: false, notes: 0 },
    { key: "k1", manufacturer: "Acme", mpn: "FLAKY-1", quantity: 1, references: "U1", part_id: "p1", state: "tracked", status: "error", stock: 0, lifecycle: "obsolete", lead_time_days: null, short: true, unit_price: "1.2", tier: 1, waiting: true, notes: 2 },
  ],
  releases: [{
    build_id: "b1", tag: "v1.0", created_at: "2026-09-01T00:00:00Z", health: 9, status: "ok", parts: 2, needing_a_look: 0,
    changed_since: [{ part_id: "p1", manufacturer: "Acme", mpn: "FLAKY-1", was: "ok", now: "error" }],
  }],
  notes: [{ id: "n1", line_key: "k1", body: "Check the second source", author: "a@example.com", author_name: "Ana", created_at: "2026-10-02T00:00:00Z" }],
  ...overrides,
});

const renderTab = (role: "designer" | "viewer" = "designer") =>
  render(<MemoryRouter><ProjectSupplyTab projectId="prj" user={{ name: role, email: `${role}@example.com`, role }} /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getProjectSupply.mockResolvedValue(supply());
});
afterEach(cleanup);

describe("the project Supply tab", () => {
  it("lists the parts with their tracking, and the stats above", async () => {
    renderTab();
    const parts = await screen.findByRole("region", { name: "Parts" });
    const rows = within(parts).getAllByRole("row").slice(1);
    const flaky = rows.find((row) => within(row).queryByText("FLAKY-1"))!;
    fireEvent.click(within(flaky).getByRole("button", { name: "FLAKY-1" }));
    expect(screen.getByRole("dialog").textContent).toBe("Sheet of p1");
    expect(within(flaky).getByRole("img", { name: "Tracked, tier 1" })).toBeTruthy();
    expect(within(flaky).getByRole("img", { name: "Waiting for room" })).toBeTruthy();
    expect(screen.getByText("7.4 of 10")).toBeTruthy();
  });

  it("shows the releases with what changed since, and the line notes", async () => {
    renderTab();
    const releases = await screen.findByRole("region", { name: "Releases" });
    expect(within(releases).getByText("v1.0")).toBeTruthy();
    expect(within(releases).getByText(/is now/)).toBeTruthy();
    expect(within(releases).getByRole("link", { name: "Compliance CSV" }).getAttribute("href")).toContain("/releases/b1/compliance");
    const notes = screen.getByRole("region", { name: "Line notes" });
    expect(within(notes).getByText("Check the second source")).toBeTruthy();
    expect(within(notes).getByRole("link", { name: "FLAKY-1" })).toBeTruthy();
  });

  it("follows the cost of a board over time and names what rounding wastes", async () => {
    mocked.getProjectSupply.mockResolvedValue(supply({
      rollup: { ...rollup, waste_cost: "3.20" },
      cost_history: [
        { day: "2026-09-01", cost_per_board: "12.0000", currency: "EUR", boards: 100 },
        { day: "2026-10-01", cost_per_board: "13.5000", currency: "EUR", boards: 100 },
      ],
    }));
    renderTab();
    const history = await screen.findByRole("region", { name: "Cost over time" });
    expect(within(history).getByText(/up .*1\.5.* since 2026-09-01/)).toBeTruthy();
    expect(screen.getByText(/3\.20.* left over from minimum orders/)).toBeTruthy();
  });

  it("shows what the build costs at other sizes and where the money goes, and a bar opens the part", async () => {
    mocked.getProjectSupply.mockResolvedValue(supply({
      cost_curve: [
        { boards: 1, cost_per_board: "20.0000", cost_build: "20.00", currency: "EUR", short: 1, lines_priced: 2, lines: 3 },
        { boards: 100, cost_per_board: "12.5000", cost_build: "1250.00", currency: "EUR", short: 0, lines_priced: 2, lines: 3 },
      ],
      money: {
        lines: [{ key: "k1", part_id: "p1", mpn: "FLAKY-1", manufacturer: "Acme", cost: "900.00", share: 0.72 }],
        other: { count: 4, cost: "350.00", share: 0.28 }, total: "1250.00",
      },
      cost_history: [
        { day: "2026-09-01", cost_per_board: "12.0000", currency: "EUR", boards: 100 },
        { day: "2026-10-01", cost_per_board: "13.5000", currency: "EUR", boards: 100 },
      ],
      cost_history_left_out: [{ day: "2026-09-15", cost_per_board: "99999.0000", currency: "EUR", boards: 100 }],
    }));
    renderTab();
    const curve = await screen.findByRole("region", { name: "Cost per board by build size" });
    expect(within(curve).getByText(/for one board/)).toBeTruthy();
    const money = screen.getByRole("region", { name: "Where the money goes" });
    expect(within(money).getByText("Other 4 lines · 28%")).toBeTruthy();
    expect(within(money).getByRole("button", { name: /FLAKY-1 · 72%/ })).toBeTruthy();
    expect(screen.getByText(/Left out as one price read wrong: 2026-09-15/)).toBeTruthy();
  });

  it("sorts the parts by a column and back to worst first", async () => {
    renderTab();
    const parts = await screen.findByRole("region", { name: "Parts" });
    const names = () => within(parts).getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("button")[0]?.textContent);
    expect(names()).toEqual(["GOOD-1", "FLAKY-1"]);
    fireEvent.click(within(parts).getByRole("button", { name: "Sort by Part" }));
    expect(names()).toEqual(["FLAKY-1", "GOOD-1"]);
    fireEvent.click(within(parts).getByRole("button", { name: "Sort by Part" }));
    expect(names()).toEqual(["GOOD-1", "FLAKY-1"]);
    fireEvent.click(within(parts).getByRole("button", { name: "Sort by Part" }));
    expect(within(parts).getByRole("columnheader", { name: /Part/ }).getAttribute("aria-sort")).toBe("none");
  });

  it("sends the boards and the spares to the costing, and the file follows them", async () => {
    renderTab();
    const boards = await screen.findByLabelText("Boards to forecast and cost");
    fireEvent.change(boards, { target: { value: "250" } });
    fireEvent.blur(boards);
    await waitFor(() => expect(mocked.getProjectSupply).toHaveBeenLastCalledWith("prj", "", 250, "", expect.anything()));
    fireEvent.change(screen.getByLabelText("Spare parts, percent"), { target: { value: "10" } });
    await waitFor(() => expect(mocked.getProjectSupply).toHaveBeenLastCalledWith("prj", "", 250, "10", expect.anything()));
    fireEvent.click(screen.getByLabelText("Spares by package"));
    await waitFor(() => expect(mocked.getProjectSupply).toHaveBeenLastCalledWith("prj", "", 250, "auto", expect.anything()));
    expect((await screen.findByRole("link", { name: "Download the costing for 250 boards as CSV" })).getAttribute("href")).toBe("/api/supply/projects/prj/cost-export?build_quantity=250&spares=auto");
  });

  it("answers whether the boards can be built and what stops it, and a chip filters the parts", async () => {
    mocked.getProjectSupply.mockResolvedValue(supply({
      rollup: { ...rollup, can_build: 0, limited_by: "k1", at_risk: 1, needs_a_look: 2 },
      counts: { at_risk: 1, needs_a_look: 2, out: 1, short: 1, end_of_life: 1, one_distributor: 0, runs_out_soon: 0, alerts: 0, waiting: 1, not_priced: 0 },
    }));
    renderTab();
    expect(await screen.findByText("0 of 100 boards")).toBeTruthy();
    expect(within(screen.getByLabelText("Headline")).getByRole("button", { name: "FLAKY-1" })).toBeTruthy();
    expect(screen.getByText(/1 at risk, 1 more need a look/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /One distributor/ })).toBeNull();
    const parts = screen.getByRole("region", { name: "Parts" });
    expect(within(parts).getAllByRole("row")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: /Out of stock/ }));
    expect(within(parts).getAllByRole("row")).toHaveLength(2);
    expect(within(parts).getByText("FLAKY-1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Out of stock/ }));
    expect(within(parts).getAllByRole("row")).toHaveLength(3);
  });

  it("opens at the project's usual build and offers to keep another size as the usual one", async () => {
    mocked.getProjectSupply.mockResolvedValue(supply({ build_quantity: 50, usual_build: 50 }));
    vi.mocked(keepUsualBuild).mockResolvedValue({ project_id: "prj", build_quantity: 200 });
    renderTab();
    expect(await screen.findByDisplayValue("50")).toBeTruthy();
    expect(mocked.getProjectSupply).toHaveBeenCalledWith("prj", "", undefined, "", expect.anything());
    expect(screen.queryByRole("button", { name: /as the usual build/ })).toBeNull();
    const boards = screen.getByLabelText("Boards to forecast and cost");
    fireEvent.change(boards, { target: { value: "200" } });
    fireEvent.blur(boards);
    fireEvent.click(await screen.findByRole("button", { name: "Keep 200 as the usual build" }));
    await waitFor(() => expect(keepUsualBuild).toHaveBeenCalledWith("prj", 200));
  });

  it("starts from the workspace's spares and sends a person's own, even none", async () => {
    mocked.getProjectSupply.mockResolvedValue(supply({ attrition_percent: 10 }));
    renderTab();
    const spares = await screen.findByLabelText("Spare parts, percent");
    expect((spares as HTMLInputElement).value).toBe("10");
    expect(mocked.getProjectSupply).toHaveBeenLastCalledWith("prj", "", undefined, "", expect.anything());
    fireEvent.change(spares, { target: { value: "0" } });
    await waitFor(() => expect(mocked.getProjectSupply).toHaveBeenLastCalledWith("prj", "", undefined, "0", expect.anything()));
  });

  it("offers the costing as a file for a build size", async () => {
    renderTab();
    const boards = await screen.findByLabelText("Boards to forecast and cost");
    fireEvent.change(boards, { target: { value: "250" } });
    fireEvent.blur(boards);
    expect(screen.getByRole("link", { name: "Download the costing for 250 boards as CSV" }).getAttribute("href")).toBe("/api/supply/projects/prj/cost-export?build_quantity=250");
  });

  it("says when the BOM has not been read, and still offers tracking", async () => {
    mocked.getProjectSupply.mockResolvedValue(supply({ available: false, parts: undefined, rollup: undefined, releases: [], notes: [] }));
    renderTab();
    expect(await screen.findByText(/has not been read yet/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Track this project" })).toBeTruthy();
  });

  it("reads the variant picked", async () => {
    mocked.getProjectSupply.mockResolvedValue(supply({ variants: ["Lite"] }));
    renderTab();
    fireEvent.change(await screen.findByLabelText("Design variant"), { target: { value: "Lite" } });
    await waitFor(() => expect(mocked.getProjectSupply).toHaveBeenLastCalledWith("prj", "Lite", undefined, "", expect.anything()));
  });

  it("is closed to a role without supply access, and never asks", () => {
    renderTab("viewer");
    expect(screen.getByText(/not available to your role/)).toBeTruthy();
    expect(mocked.getProjectSupply).not.toHaveBeenCalled();
  });

  it("reports a failure and retries", async () => {
    mocked.getProjectSupply.mockRejectedValueOnce(new Error("Backend is down")).mockResolvedValue(supply());
    renderTab();
    expect(await screen.findByText("Backend is down")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("region", { name: "Parts" })).toBeTruthy();
  });
});

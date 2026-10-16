import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "@/types/auth";
import { alertFixture, dashboardFixture, overviewFixture } from "./supply-test-fixtures";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getSupplyOverview: vi.fn(),
  getSupplyDashboard: vi.fn(),
  listSupplyAlerts: vi.fn(),
  listSupplyParts: vi.fn(),
  getSupplyReviewQueue: vi.fn(),
  acknowledgeSupplyAlert: vi.fn(),
  snoozeSupplyAlert: vi.fn(),
}));
vi.mock("./packaging-api", () => ({ listPackagingWaiting: vi.fn() }));

import * as api from "./supply-api";
import * as packaging from "./packaging-api";
import { DashboardView } from "./dashboard-view";

const mocked = vi.mocked(api);
const user: User = { name: "Ana", email: "ana@example.com", role: "designer" };

function Location() {
  return <output aria-label="location">{useLocation().search}</output>;
}

function renderView() {
  render(
    <MemoryRouter initialEntries={["/?section=supply&part=old&partsQ=x"]}>
      <DashboardView user={user} />
      <Location />
    </MemoryRouter>,
  );
}

const atRiskTile = () => screen.findByRole("button", { name: /^At risk\s*\d/ });
const search = () => screen.getByLabelText("location").textContent ?? "";

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getSupplyOverview.mockResolvedValue(overviewFixture());
  mocked.getSupplyDashboard.mockResolvedValue(dashboardFixture());
  mocked.listSupplyAlerts.mockResolvedValue({ items: [alertFixture({ id: 1, kind: "out_of_stock", severity: "error", mpn: "OOS-1", detail: { stock: 0 } })] });
  mocked.listSupplyParts.mockResolvedValue({ items: [], total: 3, limit: 50 });
  mocked.getSupplyReviewQueue.mockResolvedValue({ aliases: [], listings: [], counts: { aliases: 1, unresolved: 2, near: 1 }, manufacturers: [] });
  vi.mocked(packaging.listPackagingWaiting).mockResolvedValue({ items: [], saves_calls_a_day: 0 });
});
afterEach(cleanup);

describe("the dashboard", () => {
  it("counts what needs a person, and lists the alerts under it", async () => {
    renderView();
    const tile = await atRiskTile();
    expect(within(tile).getByText("2")).toBeTruthy();
    expect(screen.getByText("Waiting for room").closest("button")!.textContent).toContain("3");
    await waitFor(() => expect(screen.getByText("Needs you").closest("button")!.textContent).toContain("4"));
    expect(await screen.findByText("OOS-1")).toBeTruthy();
    expect(screen.getByText(/Latest read 10 min ago/)).toBeTruthy();
  });

  it("opens the place that deals with each count", async () => {
    renderView();
    fireEvent.click(await atRiskTile());
    expect(search()).toContain("supplyView=parts");
    expect(search()).toContain("partsOnly=at_risk");
    expect(search()).not.toContain("partsQ");
    fireEvent.click(screen.getByText("Waiting for room").closest("button")!);
    expect(search()).toContain("partsScope=waiting");
    fireEvent.click(screen.getByText("Needs you").closest("button")!);
    expect(search()).toContain("supplyView=review");
  });

  it("shows how each figure moved and draws the charts, each opening the parts behind it", async () => {
    renderView();
    const tile = await atRiskTile();
    expect(tile.textContent).toContain("1 in 7 days");
    fireEvent.click(await screen.findByRole("button", { name: "Under 2 weeks: 1" }));
    expect(search()).toContain("partsOnly=runs_out_2w");
    fireEvent.click(screen.getByRole("button", { name: "Needs attention: 1" }));
    expect(search()).toContain("partsOnly=at_risk");
    fireEvent.click(screen.getByRole("button", { name: /^One distributor/ }));
    expect(search()).toContain("partsOnly=one_distributor");
  });

  it("swaps a chart for its numbers", async () => {
    renderView();
    fireEvent.click(await screen.findByRole("button", { name: "Show When stock runs out as a table" }));
    const card = screen.getByRole("region", { name: "When stock runs out" });
    expect(within(card).getByRole("table")).toBeTruthy();
    expect(within(card).getByText("Steady or rising")).toBeTruthy();
  });

  it("narrows the alerts by kind", async () => {
    mocked.listSupplyAlerts.mockResolvedValue({ items: [
      alertFixture({ id: 1, kind: "out_of_stock", severity: "error", mpn: "OOS-1", detail: { stock: 0 } }),
      alertFixture({ id: 2, kind: "pcn", severity: "warning", mpn: "PCN-1", detail: { title: "Change" } }),
    ] });
    renderView();
    fireEvent.click(await screen.findByRole("button", { name: "Change notice 1" }));
    expect(screen.queryByText("OOS-1")).toBeNull();
    expect(screen.getByText("PCN-1")).toBeTruthy();
  });

  it("narrows the alerts when a kind is chosen in the chart's legend", async () => {
    mocked.getSupplyDashboard.mockResolvedValue(dashboardFixture({ alerts_by_day: [{ day: "2026-03-01", out_of_stock: 1, pcn: 1 }] }));
    mocked.listSupplyAlerts.mockResolvedValue({ items: [
      alertFixture({ id: 1, kind: "out_of_stock", severity: "error", mpn: "OOS-1", detail: { stock: 0 } }),
      alertFixture({ id: 2, kind: "pcn", severity: "warning", mpn: "PCN-1", detail: { title: "Change" } }),
    ] });
    renderView();
    const legend = await screen.findByRole("list", { name: "Kinds of alert" });
    fireEvent.click(within(legend).getByRole("button", { name: "Change notice" }));
    expect(screen.queryByText("OOS-1")).toBeNull();
    expect(screen.getByText("PCN-1")).toBeTruthy();
  });

  it("opens a part from an alert", async () => {
    renderView();
    fireEvent.click(await screen.findByRole("button", { name: "OOS-1" }));
    expect(search()).toContain("supplyView=parts");
    expect(search()).toContain("part=");
  });

  it("tells a new workspace what to do first", async () => {
    mocked.getSupplyOverview.mockResolvedValue(overviewFixture({ figures: { watched: 0, at_risk: 0, out_of_stock: 0, lifecycle: 0, no_data: 0 }, connectors: 0, open_alerts: 0 }));
    mocked.listSupplyAlerts.mockResolvedValue({ items: [] });
    renderView();
    expect(await screen.findByText(/No distributor is connected/)).toBeTruthy();
  });

  it("reports a failure and retries", async () => {
    mocked.getSupplyDashboard.mockRejectedValueOnce(new Error("Backend is down")).mockResolvedValue(dashboardFixture());
    renderView();
    expect(await screen.findByText("Backend is down")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await atRiskTile()).toBeTruthy();
  });
});

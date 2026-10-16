import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { User } from "@/types/auth";
import { alertFixture, overviewFixture } from "./supply-test-fixtures";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getSupplyOverview: vi.fn(),
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

const search = () => screen.getByLabelText("location").textContent ?? "";

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getSupplyOverview.mockResolvedValue(overviewFixture());
  mocked.listSupplyAlerts.mockResolvedValue({ items: [alertFixture({ id: 1, kind: "out_of_stock", severity: "error", mpn: "OOS-1", detail: { stock: 0 } })] });
  mocked.listSupplyParts.mockResolvedValue({ items: [], total: 3, limit: 50 });
  mocked.getSupplyReviewQueue.mockResolvedValue({ aliases: [], listings: [], counts: { aliases: 1, unresolved: 2, near: 1 }, manufacturers: [] });
  vi.mocked(packaging.listPackagingWaiting).mockResolvedValue({ items: [], saves_calls_a_day: 0 });
});
afterEach(cleanup);

describe("the dashboard", () => {
  it("counts what needs a person, and lists the alerts under it", async () => {
    renderView();
    const tile = (await screen.findByText("At risk")).closest("button")!;
    expect(within(tile).getByText("2")).toBeTruthy();
    expect(screen.getByText("Waiting for room").closest("button")!.textContent).toContain("3");
    await waitFor(() => expect(screen.getByText("Needs you").closest("button")!.textContent).toContain("4"));
    expect(await screen.findByText("OOS-1")).toBeTruthy();
    expect(screen.getByText(/Latest read 10 min ago/)).toBeTruthy();
  });

  it("opens the place that deals with each count", async () => {
    renderView();
    fireEvent.click((await screen.findByText("At risk")).closest("button")!);
    expect(search()).toContain("supplyView=parts");
    expect(search()).toContain("partsOnly=at_risk");
    expect(search()).not.toContain("partsQ");
    fireEvent.click(screen.getByText("Waiting for room").closest("button")!);
    expect(search()).toContain("partsScope=waiting");
    fireEvent.click(screen.getByText("Needs you").closest("button")!);
    expect(search()).toContain("supplyView=review");
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
    mocked.getSupplyOverview.mockRejectedValueOnce(new Error("Backend is down")).mockResolvedValue(overviewFixture());
    renderView();
    expect(await screen.findByText("Backend is down")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("At risk")).toBeTruthy();
  });
});

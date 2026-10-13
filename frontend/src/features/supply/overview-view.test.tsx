import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { alertFixture, overviewFixture } from "./supply-test-fixtures";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getSupplyOverview: vi.fn(),
}));

import * as api from "./supply-api";
import { OverviewView } from "./overview-view";

const mocked = vi.mocked(api);

function Location() {
  return <output aria-label="location">{useLocation().search}</output>;
}

function renderView() {
  render(
    <MemoryRouter initialEntries={["/?section=supply&part=old&partsQ=x"]}>
      <OverviewView />
      <Location />
    </MemoryRouter>,
  );
}

const search = () => screen.getByLabelText("location").textContent ?? "";

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getSupplyOverview.mockResolvedValue(overviewFixture());
});
afterEach(cleanup);

describe("the overview", () => {
  it("shows the figures, what needs attention, data age and calls used", async () => {
    renderView();
    const tile = (await screen.findByText("At risk")).closest("button")!;
    expect(within(tile).getByText("2")).toBeTruthy();
    expect(screen.getByText("Out of stock")).toBeTruthy();
    const attention = screen.getByRole("region", { name: "Needs attention" });
    expect(within(attention).getByRole("button", { name: "TPS62840" })).toBeTruthy();
    expect(screen.getByText(/Latest read 10 min ago\. The part read longest ago: 26 h ago\./)).toBeTruthy();
    const calls = screen.getByRole("region", { name: "Calls today" });
    expect(within(calls).getByText("Mouser EU")).toBeTruthy();
    expect(within(calls).getByText("450 of 1,000")).toBeTruthy();
    expect(within(calls).getByRole("img", { name: "45% of today's calls used" })).toBeTruthy();
  });

  it("opens a part in Parts, and the open alerts in the Inbox", async () => {
    renderView();
    fireEvent.click(await screen.findByRole("button", { name: "TPS62840" }));
    expect(search()).toContain("supplyView=parts");
    expect(search()).toContain("part=p2");
    expect(search()).not.toContain("partsQ");
    fireEvent.click(screen.getByText("Open alerts").closest("button")!);
    expect(search()).toContain("supplyView=inbox");
    expect(search()).not.toContain("part=");
  });

  it("lists what changed lately and opens the part", async () => {
    mocked.getSupplyOverview.mockResolvedValue(overviewFixture({
      recent_changes: [
        { at: new Date(Date.now() - 3600 * 1000).toISOString(), type: "alert_opened", part_id: "p9", mpn: "LM358D", manufacturer: "TI", sku: "",
          alert: alertFixture({ kind: "out_of_stock", severity: "error" }) },
        { at: new Date(Date.now() - 7200 * 1000).toISOString(), type: "listing_gone", part_id: "p8", mpn: "NE555", manufacturer: "TI", sku: "C7950", alert: null },
      ],
    }));
    renderView();
    const region = await screen.findByRole("region", { name: "Recent changes" });
    expect(within(region).getByText("Out of stock")).toBeTruthy();
    expect(within(region).getByText(/stopped listing it \(C7950\)/)).toBeTruthy();
    fireEvent.click(within(region).getByRole("button", { name: "NE555" }));
    expect(search()).toContain("part=p8");
  });

  it("links each figure to the parts it counts", async () => {
    renderView();
    fireEvent.click((await screen.findByText("At risk")).closest("button")!);
    expect(search()).toContain("supplyView=parts");
    expect(search()).toContain("partsOnly=at_risk");
    fireEvent.click(screen.getByText("End of life").closest("button")!);
    expect(search()).toContain("partsOnly=lifecycle");
    fireEvent.click(screen.getAllByText("Watched")[0].closest("button")!);
    expect(search()).not.toContain("partsOnly");
  });

  it("offers to see the rest when more parts are at risk than are listed", async () => {
    mocked.getSupplyOverview.mockResolvedValue(overviewFixture({ figures: { watched: 40, at_risk: 25, out_of_stock: 3, lifecycle: 0, no_data: 0 } }));
    renderView();
    fireEvent.click(await screen.findByRole("button", { name: "See all 25 in Parts" }));
    expect(search()).toContain("supplyView=parts");
  });

  it("tells a new workspace what to do first", async () => {
    mocked.getSupplyOverview.mockResolvedValue(overviewFixture({
      figures: { watched: 0, at_risk: 0, out_of_stock: 0, lifecycle: 0, no_data: 0 },
      needs_attention: [], open_alerts: 0, connectors: 0, quota: [], data_age: { oldest: null, newest: null },
    }));
    renderView();
    expect(await screen.findByText(/No distributor is connected/)).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Calls today" })).toBeNull();
  });

  it("says when there is nothing to watch yet, when reads are pending, and when all is well", async () => {
    const quiet = { needs_attention: [], open_alerts: 0, data_age: { oldest: null, newest: null } };
    mocked.getSupplyOverview.mockResolvedValue(overviewFixture({ ...quiet, figures: { watched: 0, at_risk: 0, out_of_stock: 0, lifecycle: 0, no_data: 0 } }));
    renderView();
    expect(await screen.findByText(/No parts are watched yet/)).toBeTruthy();
    cleanup();
    mocked.getSupplyOverview.mockResolvedValue(overviewFixture({ ...quiet, figures: { watched: 3, at_risk: 0, out_of_stock: 0, lifecycle: 0, no_data: 3 } }));
    renderView();
    expect(await screen.findByText(/waiting for their first read/)).toBeTruthy();
    expect(screen.getByText("Nothing has been read yet.")).toBeTruthy();
    cleanup();
    mocked.getSupplyOverview.mockResolvedValue(overviewFixture({ ...quiet, figures: { watched: 3, at_risk: 0, out_of_stock: 0, lifecycle: 0, no_data: 0 } }));
    renderView();
    expect(await screen.findByText("Nothing needs attention.")).toBeTruthy();
  });

  it("shows an unmetered connector and a paused one plainly", async () => {
    mocked.getSupplyOverview.mockResolvedValue(overviewFixture({
      quota: [
        { connector_id: "c1", name: "Price file", metered: false, spent: 0, budget: null, paused: false },
        { connector_id: "c2", name: "Mouser EU", metered: true, spent: 100, budget: 1000, paused: true },
      ],
    }));
    renderView();
    expect(await screen.findByText("No call limit")).toBeTruthy();
    expect(screen.getByText("Paused")).toBeTruthy();
  });

  it("reports a failure and retries", async () => {
    mocked.getSupplyOverview.mockRejectedValueOnce(new Error("Backend is down")).mockResolvedValue(overviewFixture());
    renderView();
    expect(await screen.findByText("Backend is down")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("At risk")).toBeTruthy();
  });
});

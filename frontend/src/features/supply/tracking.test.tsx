import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyConnector, TrackingPreview } from "@/types/supply";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./tracking-api", () => ({
  getProjectTracking: vi.fn(), readProjectBom: vi.fn(), previewTrackProject: vi.fn(), trackProject: vi.fn(), untrackProject: vi.fn(),
  getPartTracking: vi.fn(), previewPartTier: vi.fn(), setPartTier: vi.fn(), stopTrackingPart: vi.fn(),
  chooseTrackLine: vi.fn(), getTrackProgress: vi.fn(),
}));
vi.mock("./supply-api", () => ({ listSupplyConnectors: vi.fn(), updateSupplyConnector: vi.fn() }));

import * as api from "./tracking-api";
import * as supply from "./supply-api";
import { TrackProjectButton } from "./track-project-dialog";
import { TrackingControl } from "./tracking-control";

const tracking = vi.mocked(api);

const connector = (id: string, name: string, extra: Partial<SupplyConnector> = {}) =>
  ({ id, display_name: name, enabled: true, metered: true, assembly_only: false, daily_budget: 1000, ...extra }) as SupplyConnector;

const preview = (extra: Partial<TrackingPreview> = {}): TrackingPreview => ({
  fits_nowhere: false,
  connectors: [{ connector_id: "c1", name: "DigiKey", capacity: 900, committed: 100, free: 800, admitted: 10, waiting: 0, adds_calls: 120, admitted_new: 100, waiting_new: 4 }],
  ...extra,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(supply.listSupplyConnectors).mockResolvedValue([connector("c1", "DigiKey"), connector("j1", "JLCPCB", { assembly_only: true })]);
});
afterEach(cleanup);

describe("tracking a project", () => {
  beforeEach(() => {
    tracking.getTrackProgress.mockResolvedValue({ parts: 100, finished: false, connectors: [{ connector_id: "c1", name: "DigiKey", parts: 100, searched: 40 }] });
  });

  async function open() {
    render(<MemoryRouter><TrackProjectButton projectId="prj_1" /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /Track this project/ }));
  }

  it("asks everything in one dialog, shows the cost as a bar, tracks, then shows the first searches", async () => {
    tracking.getProjectTracking.mockResolvedValue({ tracked: null, has_usage: true, variants: ["Lite"] });
    tracking.previewTrackProject.mockResolvedValue(preview());
    tracking.trackProject.mockResolvedValue(preview());
    await open();
    expect(await screen.findByRole("progressbar", { name: "DigiKey committed calls" })).toBeTruthy();
    expect(screen.getByText("+120 calls a day")).toBeTruthy();
    expect(tracking.previewTrackProject).toHaveBeenLastCalledWith(
      "prj_1", { variants: [""], all_variants: false, buying_for: "prototypes", connector_ids: null }, expect.anything(),
    );
    expect(screen.getByLabelText("Built at JLCPCB")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Lite"));
    fireEvent.click(screen.getByRole("button", { name: "Production" }));
    fireEvent.click(await screen.findByRole("button", { name: "Track (104)" }));
    await waitFor(() => expect(tracking.trackProject).toHaveBeenCalledWith(
      "prj_1", { variants: ["", "Lite"], all_variants: false, buying_for: "production", connector_ids: null },
    ));
    expect(await screen.findByRole("progressbar", { name: "DigiKey searched" })).toBeTruthy();
    expect(screen.getByText("40 of 100")).toBeTruthy();
    expect(screen.getByText("4 wait for room")).toBeTruthy();
  });

  it("raises a budget from a small dialog over the track dialog when parts would wait", async () => {
    tracking.getProjectTracking.mockResolvedValue({ tracked: null, has_usage: true, variants: [] });
    tracking.previewTrackProject.mockResolvedValue(preview());
    vi.mocked(supply.updateSupplyConnector).mockResolvedValue(connector("c1", "DigiKey", { daily_budget: 2000 }));
    await open();
    fireEvent.click(await screen.findByRole("button", { name: "Raise the budget" }));
    fireEvent.change(await screen.findByLabelText("Calls a day"), { target: { value: "2000" } });
    fireEvent.click(screen.getByRole("button", { name: "Raise" }));
    await waitFor(() => expect(supply.updateSupplyConnector).toHaveBeenCalledWith("c1", { daily_budget: 2000 }));
    await waitFor(() => expect(tracking.previewTrackProject).toHaveBeenCalledTimes(2));
  });

  it("can follow every design, also those added later", async () => {
    tracking.getProjectTracking.mockResolvedValue({ tracked: null, has_usage: true, variants: ["Lite"] });
    tracking.previewTrackProject.mockResolvedValue(preview());
    tracking.trackProject.mockResolvedValue(preview());
    await open();
    fireEvent.click(await screen.findByLabelText("Also designs added later"));
    fireEvent.click(await screen.findByRole("button", { name: "Track (104)" }));
    await waitFor(() => expect(tracking.trackProject).toHaveBeenCalledWith(
      "prj_1", { variants: [""], all_variants: true, buying_for: "prototypes", connector_ids: null },
    ));
  });

  it("refuses to track when nothing fits anywhere", async () => {
    tracking.getProjectTracking.mockResolvedValue({ tracked: null, has_usage: true, variants: [] });
    tracking.previewTrackProject.mockResolvedValue(preview({ fits_nowhere: true }));
    await open();
    expect(await screen.findByText(/Nothing fits at any distributor/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /^Track/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("settles lines several makers share before tracking, one click each", async () => {
    tracking.getProjectTracking.mockResolvedValue({ tracked: null, has_usage: true, variants: [] });
    tracking.previewTrackProject.mockResolvedValueOnce(preview({
      tracked: { parts_created: 0, skipped: [{ mpn: "LM358D", reason: "needs_choice", manufacturer: "Some Name", candidates: [{ part_id: "p1", manufacturer: "Texas Instruments" }, { part_id: "p2", manufacturer: "Onsemi" }] }] },
    }));
    tracking.previewTrackProject.mockResolvedValue(preview());
    tracking.chooseTrackLine.mockResolvedValue(undefined);
    await open();
    fireEvent.click(await screen.findByRole("button", { name: "Next" }));
    expect(await screen.findByText("written as Some Name")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Texas Instruments" }));
    await waitFor(() => expect(tracking.chooseTrackLine).toHaveBeenCalledWith("prj_1", "p1", "Some Name"));
    await waitFor(() => expect(tracking.previewTrackProject).toHaveBeenCalledTimes(2));
  });

  it("reads the BOM itself when Prism has not, then goes on", async () => {
    tracking.getProjectTracking
      .mockResolvedValueOnce({ tracked: null, has_usage: false, variants: [] })
      .mockResolvedValue({ tracked: null, has_usage: true, variants: ["Lite"] });
    tracking.readProjectBom.mockResolvedValue({ status: "updated" });
    tracking.previewTrackProject.mockResolvedValue(preview());
    await open();
    expect(await screen.findByRole("progressbar", { name: "Reading the BOM" })).toBeTruthy();
    expect(await screen.findByLabelText("Lite")).toBeTruthy();
    expect(tracking.readProjectBom).toHaveBeenCalledWith("prj_1");
  });
});

describe("a part's tracking", () => {
  it("says how and why, previews a change and applies it", async () => {
    tracking.getPartTracking.mockResolvedValue({ tier: { tier: 2, rate: "weekly", reasons: [{ kind: "legacy", ref: "w1" }] }, waiting_at: [] });
    tracking.previewPartTier.mockResolvedValue(preview());
    tracking.setPartTier.mockResolvedValue({ ...preview(), tier: null });
    const changed = vi.fn().mockResolvedValue(undefined);
    render(<TrackingControl partId="p1" canEdit onChanged={changed} />);
    expect(await screen.findByText(/Read weekly \(tier 2\), because of a watch from before tiers/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Tier"), { target: { value: "1" } });
    expect(await screen.findByLabelText("Call budget")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(tracking.setPartTier).toHaveBeenCalledWith("p1", { tier: 1, rate: "weekly" }));
    await waitFor(() => expect(changed).toHaveBeenCalled());
  });

  it("only reads for someone who may not change it", async () => {
    tracking.getPartTracking.mockResolvedValue({ tier: null, waiting_at: ["c1"] });
    render(<TrackingControl partId="p1" canEdit={false} onChanged={vi.fn()} />);
    expect(await screen.findByText(/Not followed/)).toBeTruthy();
    expect(screen.getByText(/Waiting for room at 1 distributor/)).toBeTruthy();
    expect(screen.queryByLabelText("Tier")).toBeNull();
  });
});

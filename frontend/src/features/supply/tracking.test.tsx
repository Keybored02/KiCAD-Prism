import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyConnector, TrackingPreview } from "@/types/supply";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./tracking-api", () => ({
  getProjectTracking: vi.fn(), previewTrackProject: vi.fn(), trackProject: vi.fn(), untrackProject: vi.fn(),
  getPartTracking: vi.fn(), previewPartTier: vi.fn(), setPartTier: vi.fn(), stopTrackingPart: vi.fn(),
}));
vi.mock("./supply-api", () => ({ listSupplyConnectors: vi.fn() }));

import * as api from "./tracking-api";
import * as supply from "./supply-api";
import { TrackProjectButton } from "./track-project-dialog";
import { TrackingControl } from "./tracking-control";

const tracking = vi.mocked(api);

const connector = (id: string, name: string, extra: Partial<SupplyConnector> = {}) =>
  ({ id, display_name: name, enabled: true, metered: true, assembly_only: false, ...extra }) as SupplyConnector;

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
  it("shows what following it costs before it is confirmed, and tracks where there is room", async () => {
    tracking.getProjectTracking.mockResolvedValue({ tracked: null, has_usage: true, variants: ["Lite"] });
    tracking.previewTrackProject.mockResolvedValue(preview());
    tracking.trackProject.mockResolvedValue(preview());
    render(<TrackProjectButton projectId="prj_1" />);
    fireEvent.click(screen.getByRole("button", { name: /Track this project/ }));
    expect(await screen.findByLabelText("Call budget")).toBeTruthy();
    expect(screen.getByText("120 calls")).toBeTruthy();
    expect(tracking.previewTrackProject).toHaveBeenLastCalledWith("prj_1", { variants: [""], connector_ids: null }, expect.anything());
    expect(screen.getByLabelText("Yes, built at JLCPCB")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Lite"));
    fireEvent.click(screen.getByRole("button", { name: "Track where there is room" }));
    await waitFor(() => expect(tracking.trackProject).toHaveBeenCalledWith("prj_1", { variants: ["", "Lite"], connector_ids: null }));
  });

  it("refuses to track when nothing fits anywhere", async () => {
    tracking.getProjectTracking.mockResolvedValue({ tracked: null, has_usage: true, variants: [] });
    tracking.previewTrackProject.mockResolvedValue(preview({ fits_nowhere: true }));
    render(<TrackProjectButton projectId="prj_1" />);
    fireEvent.click(screen.getByRole("button", { name: /Track this project/ }));
    expect(await screen.findByText(/Nothing fits at any distributor/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Track where there is room" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("asks for the BOM to be read first when Prism has not", async () => {
    tracking.getProjectTracking.mockResolvedValue({ tracked: null, has_usage: false, variants: [] });
    render(<TrackProjectButton projectId="prj_1" />);
    fireEvent.click(screen.getByRole("button", { name: /Track this project/ }));
    expect(await screen.findByText(/has not read this project's BOM yet/)).toBeTruthy();
    expect(tracking.previewTrackProject).not.toHaveBeenCalled();
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

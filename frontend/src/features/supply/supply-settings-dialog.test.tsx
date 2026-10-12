import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AssessmentSettings, AssessmentSettingsView } from "@/types/supply";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getAssessmentSettings: vi.fn(),
  saveAssessmentSettings: vi.fn(),
  resetAssessmentSettings: vi.fn(),
}));

import * as api from "./supply-api";
import { SupplySettingsDialog } from "./supply-settings-dialog";

const mocked = vi.mocked(api);

const defaults: AssessmentSettings = {
  lead_time_days: 84,
  stale_hours: 72,
  base_currency: "EUR",
  weights: { lifecycle: 0.25, sourcing: 0.2, inventory: 0.3, market: 0.1, compliance: 0.15 },
  severity: { nrnd: "warning", obsolete: "fatal" },
};
const view: AssessmentSettingsView = {
  settings: defaults,
  defaults,
  checks: [{ id: "nrnd", label: "Not recommended for new designs" }, { id: "obsolete", label: "Manufacturer lists it as obsolete" }],
  ranges: { lead_time_days: [1, 730], stale_hours: [1, 720] },
};

function open(onOpenChange = vi.fn()) {
  render(<SupplySettingsDialog open onOpenChange={onOpenChange} />);
  return onOpenChange;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getAssessmentSettings.mockResolvedValue(view);
  mocked.saveAssessmentSettings.mockResolvedValue(view);
  mocked.resetAssessmentSettings.mockResolvedValue(view);
});
afterEach(cleanup);

describe("the supply settings dialog", () => {
  it("shows what is set and saves a change, then closes", async () => {
    const onOpenChange = open();
    const lead = await screen.findByLabelText(/Longest lead time/);
    expect((lead as HTMLInputElement).value).toBe("84");
    fireEvent.change(lead, { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText(/Currency for comparing/), { target: { value: "usd" } });
    fireEvent.change(screen.getByLabelText("Not recommended for new designs"), { target: { value: "error" } });
    fireEvent.change(screen.getByLabelText("Inventory"), { target: { value: "0.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocked.saveAssessmentSettings).toHaveBeenCalled());
    expect(mocked.saveAssessmentSettings.mock.calls[0][0]).toEqual({
      ...defaults,
      lead_time_days: 30,
      base_currency: "USD",
      weights: { ...defaults.weights, inventory: 0.5 },
      severity: { nrnd: "error", obsolete: "fatal" },
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("ignores a number outside its range and keeps the last good one", async () => {
    open();
    const lead = await screen.findByLabelText(/Longest lead time/);
    fireEvent.change(lead, { target: { value: "5000" } });
    expect((lead as HTMLInputElement).value).toBe("84");
    const weight = screen.getByLabelText("Market");
    fireEvent.change(weight, { target: { value: "3" } });
    expect((weight as HTMLInputElement).value).toBe("0.1");
  });

  it("goes back to the defaults on request", async () => {
    const onOpenChange = open();
    fireEvent.click(await screen.findByRole("button", { name: "Back to defaults" }));
    await waitFor(() => expect(mocked.resetAssessmentSettings).toHaveBeenCalled());
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("shows the server's reason and stays open when saving fails", async () => {
    mocked.saveAssessmentSettings.mockRejectedValue(new Error("At least one risk area needs a weight above 0."));
    const onOpenChange = open();
    await screen.findByLabelText(/Longest lead time/);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("At least one risk area needs a weight above 0.")).toBeTruthy();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("shows a failed load with a retry", async () => {
    mocked.getAssessmentSettings.mockRejectedValueOnce(new Error("Could not load the settings"));
    open();
    expect(await screen.findByText("Could not load the settings")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByLabelText(/Longest lead time/)).toBeTruthy();
  });
});

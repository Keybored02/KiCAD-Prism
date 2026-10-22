import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./tracking-api", () => ({ getSchedule: vi.fn(), saveSchedule: vi.fn() }));

import { ScheduleSettings } from "./schedule-settings";
import * as api from "./tracking-api";

const settings = { tz: "UTC", days: [0, 1, 2, 3, 4], start: "08:00", end: "19:00", spare: { waiting: true, tier2_early: true, notices: true } };

beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.getSchedule).mockResolvedValue(settings); });
afterEach(cleanup);

describe("spare work", () => {
  it("saves a switch and sends the stored week back unchanged", async () => {
    vi.mocked(api.saveSchedule).mockImplementation(async (next) => next);
    render(<ScheduleSettings />);
    fireEvent.click(await screen.findByLabelText("Read change notices of parts nobody tracks"));
    fireEvent.click(screen.getByRole("button", { name: "Save spare work" }));
    await waitFor(() => expect(api.saveSchedule).toHaveBeenCalledWith({ ...settings, spare: { waiting: true, tier2_early: true, notices: false } }));
  });

  it("does not offer a working week, which spare budget no longer follows", async () => {
    render(<ScheduleSettings />);
    await screen.findByLabelText("Read parts waiting for room");
    expect(screen.queryByLabelText("Sat")).toBeNull();
    expect(screen.queryByLabelText("Time zone")).toBeNull();
    expect(screen.getByText(/at any hour/)).toBeTruthy();
  });

  it("shows nothing when it cannot be read", async () => {
    vi.mocked(api.getSchedule).mockRejectedValue(new Error("no"));
    const { container } = render(<ScheduleSettings />);
    await waitFor(() => expect(api.getSchedule).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });
});

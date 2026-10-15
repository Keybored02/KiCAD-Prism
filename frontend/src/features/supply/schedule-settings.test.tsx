import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./tracking-api", () => ({ getSchedule: vi.fn(), saveSchedule: vi.fn() }));

import { ScheduleSettings } from "./schedule-settings";
import * as api from "./tracking-api";

const settings = { tz: "UTC", days: [0, 1, 2, 3, 4], start: "08:00", end: "19:00", spare: { waiting: true, tier2_early: true, notices: true } };

beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.getSchedule).mockResolvedValue(settings); });
afterEach(cleanup);

describe("the working week", () => {
  it("shows the week and saves a change", async () => {
    vi.mocked(api.saveSchedule).mockImplementation(async (next) => next);
    render(<ScheduleSettings />);
    expect((await screen.findByLabelText("Sat") as HTMLInputElement).getAttribute("aria-checked")).toBe("false");
    fireEvent.click(screen.getByLabelText("Sat"));
    fireEvent.click(screen.getByLabelText("Read change notices of parts nobody tracks"));
    fireEvent.change(screen.getByLabelText("Time zone"), { target: { value: "Europe/Rome" } });
    fireEvent.click(screen.getByRole("button", { name: "Save schedule" }));
    await waitFor(() => expect(api.saveSchedule).toHaveBeenCalledWith({
      ...settings, tz: "Europe/Rome", days: [0, 1, 2, 3, 4, 5], spare: { waiting: true, tier2_early: true, notices: false },
    }));
  });

  it("shows nothing when it cannot be read", async () => {
    vi.mocked(api.getSchedule).mockRejectedValue(new Error("no"));
    const { container } = render(<ScheduleSettings />);
    await waitFor(() => expect(api.getSchedule).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });
});

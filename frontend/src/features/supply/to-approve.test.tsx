import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyToApprove } from "@/types/supply";

vi.mock("./supply-api", () => ({ decideWaiver: vi.fn(), decideSource: vi.fn() }));
vi.mock("./component-supply-api", () => ({ decideAlternate: vi.fn() }));

import * as componentApi from "./component-supply-api";
import * as api from "./supply-api";
import { ToApprove } from "./to-approve";

const mocked = vi.mocked(api);
const items: SupplyToApprove = {
  waivers: [{ id: "w1", part_id: "p1", mpn: "LM358D", manufacturer: "TI", check_id: "single_source", scope: "x", reason: "Second source qualified", proposed_by: "dee@example.com", proposed_at: "2026-10-16T10:00:00Z" }],
};

beforeEach(() => { vi.clearAllMocks(); window.localStorage.clear(); });
afterEach(cleanup);

describe("waiting for approval", () => {
  it("lists waivers and decides in one click", async () => {
    mocked.decideWaiver.mockResolvedValue(undefined);
    const decided = vi.fn().mockResolvedValue(undefined);
    render(<MemoryRouter><ToApprove items={items} canDecide onDecided={decided} /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole("button", { name: "Approve" })[0]);
    await waitFor(() => expect(mocked.decideWaiver).toHaveBeenCalledWith("w1", true));
    await waitFor(() => expect(decided).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("link", { name: "LM358D, TI" }).getAttribute("href")).toContain("part=p1");
  });

  it("lists alternates proposed for a component, links the component and decides them", async () => {
    vi.mocked(componentApi.decideAlternate).mockResolvedValue({} as never);
    const decided = vi.fn().mockResolvedValue(undefined);
    const alternates: SupplyToApprove = {
      waivers: [],
      alternates: [{ component_id: "cmp-1", component_name: "R 10k 0603", component_mpn: "RC0603", part_id: "p9", mpn: "ERJ-3EKF1002V",
        manufacturer: "Panasonic", proposed_by: "dee@example.com", proposed_at: "2026-10-16T10:00:00Z" }],
    };
    render(<MemoryRouter><ToApprove items={alternates} canDecide onDecided={decided} /></MemoryRouter>);
    expect(screen.getByText("Alternate")).toBeTruthy();
    expect(screen.getByRole("link", { name: "ERJ-3EKF1002V, Panasonic for R 10k 0603" }).getAttribute("href")).toContain("component=cmp-1");
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(componentApi.decideAlternate).toHaveBeenCalledWith("cmp-1", "p9", false));
    await waitFor(() => expect(decided).toHaveBeenCalledTimes(1));
  });

  it("shows nothing when nothing waits, and no buttons to those who may not decide", () => {
    const { container, rerender } = render(<MemoryRouter><ToApprove items={{ waivers: [] }} canDecide onDecided={vi.fn()} /></MemoryRouter>);
    expect(container.textContent).toBe("");
    rerender(<MemoryRouter><ToApprove items={items} canDecide={false} onDecided={vi.fn()} /></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });
});

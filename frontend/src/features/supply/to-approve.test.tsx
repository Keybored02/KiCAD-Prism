import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyToApprove } from "@/types/supply";

vi.mock("./supply-api", () => ({ decideWaiver: vi.fn(), decideSource: vi.fn() }));

import * as api from "./supply-api";
import { ToApprove } from "./to-approve";

const mocked = vi.mocked(api);
const items: SupplyToApprove = {
  waivers: [{ id: "w1", part_id: "p1", mpn: "LM358D", manufacturer: "TI", check_id: "single_source", scope: "x", reason: "Second source qualified", proposed_by: "dee@example.com", proposed_at: "2026-10-16T10:00:00Z" }],
  alternates: [{ id: "s1", component_id: "c1", part_id: "p2", mpn: "LM358DR", manufacturer: "TI", created_by: "dee@example.com", created_at: "2026-10-16T10:00:00Z" }],
};

beforeEach(() => { vi.clearAllMocks(); window.localStorage.clear(); });
afterEach(cleanup);

describe("waiting for approval", () => {
  it("lists waivers and alternates and decides each in one click", async () => {
    mocked.decideWaiver.mockResolvedValue(undefined);
    mocked.decideSource.mockResolvedValue(undefined);
    const decided = vi.fn().mockResolvedValue(undefined);
    render(<MemoryRouter><ToApprove items={items} canDecide onDecided={decided} /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole("button", { name: "Approve" })[0]);
    await waitFor(() => expect(mocked.decideWaiver).toHaveBeenCalledWith("w1", true));
    fireEvent.click(screen.getAllByRole("button", { name: "Reject" })[1]);
    await waitFor(() => expect(mocked.decideSource).toHaveBeenCalledWith("s1", false));
    expect(decided).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("link", { name: "LM358DR, TI" }).getAttribute("href")).toContain("componentTab=sourcing");
  });

  it("shows nothing when nothing waits, and no buttons to those who may not decide", () => {
    const { container, rerender } = render(<MemoryRouter><ToApprove items={{ waivers: [], alternates: [] }} canDecide onDecided={vi.fn()} /></MemoryRouter>);
    expect(container.textContent).toBe("");
    rerender(<MemoryRouter><ToApprove items={items} canDecide={false} onDecided={vi.fn()} /></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  });
});

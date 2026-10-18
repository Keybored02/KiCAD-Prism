import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UserRole } from "@/types/auth";
import type { SupplyAssessment, SupplyFinding } from "@/types/supply";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getSupplyAssessment: vi.fn(),
  proposeWaiver: vi.fn(),
  decideWaiver: vi.fn(),
  revokeWaiver: vi.fn(),
}));

import { AssessmentSection } from "./assessment-section";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

function finding(overrides: Partial<SupplyFinding> = {}): SupplyFinding {
  return { check: "nrnd", severity: "warning", text: "The manufacturer does not recommend this part for new designs.", scope: "nrnd", waiver: null, ...overrides };
}

function assessment(overrides: Partial<SupplyAssessment> = {}): SupplyAssessment {
  return {
    part_id: "p1", health: 6.4, status: "warning", need: null, findings: [finding()],
    sub_scores: [
      { name: "lifecycle", score: 3, reasons: ["Manufacturer lifecycle: nrnd."] },
      { name: "sourcing", score: 3, reasons: ["Only one distributor holds it."] },
      { name: "inventory", score: 1, reasons: [] },
      { name: "market", score: 1, reasons: [] },
      { name: "compliance", score: 1, reasons: [] },
    ],
    ...overrides,
  };
}

const waiver = { id: "w1", state: "approved" as const, reason: "We hold stock", proposed_by: "a@example.com", decided_by: "qa@example.com", holds: true, outdated: false };

function renderIt(role: UserRole = "designer") {
  render(<AssessmentSection partId="p1" role={role} />);
}

/** The scores and findings open from the info icon; a click holds them open. */
async function openDetails() {
  fireEvent.click(await screen.findByRole("button", { name: "Show the scores and findings" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getSupplyAssessment.mockResolvedValue(assessment());
  mocked.proposeWaiver.mockResolvedValue({ id: "w1", state: "proposed" });
  mocked.decideWaiver.mockResolvedValue();
  mocked.revokeWaiver.mockResolvedValue();
});
afterEach(cleanup);

describe("the assessment section", () => {
  it("shows health, the five risk scores and the findings", async () => {
    renderIt();
    expect(await screen.findByText("6.4 of 10")).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Risk" })).toBeNull();
    await openDetails();
    const risk = screen.getByRole("list", { name: "Risk" });
    expect(within(risk).getAllByRole("listitem")).toHaveLength(5);
    expect(within(risk).getByTitle("Only one distributor holds it.")).toBeTruthy();
    expect(screen.getByText(/does not recommend this part/)).toBeTruthy();
  });

  it("opens the scores and findings when the info icon is hovered, and closes them again", async () => {
    renderIt();
    const icon = await screen.findByRole("button", { name: "Show the scores and findings" });
    fireEvent.mouseEnter(icon);
    expect(await screen.findByRole("list", { name: "Risk" })).toBeTruthy();
    fireEvent.mouseLeave(icon);
    await waitFor(() => expect(screen.queryByRole("list", { name: "Risk" })).toBeNull());
  });

  it("says so when there is nothing to assess", async () => {
    mocked.getSupplyAssessment.mockResolvedValue(assessment({ status: "unknown", health: 0, findings: [] }));
    renderIt();
    expect(await screen.findByText("No data to assess yet")).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Risk" })).toBeNull();
  });

  it("lets a designer ask for a waiver with a reason, then reloads", async () => {
    renderIt("designer");
    await openDetails();
    fireEvent.click(await screen.findByRole("button", { name: "Waive" }));
    fireEvent.change(screen.getByLabelText("Why nrnd is acceptable"), { target: { value: "We hold stock" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask QA" }));
    await waitFor(() => expect(mocked.proposeWaiver).toHaveBeenCalledWith("p1", "nrnd", "We hold stock"));
    await waitFor(() => expect(mocked.getSupplyAssessment).toHaveBeenCalledTimes(2));
  });

  it("lets QA approve what a designer asked for, but not a designer", async () => {
    const waiting = assessment({ findings: [finding({ waiver: { ...waiver, state: "proposed", holds: false, decided_by: "" } })] });
    mocked.getSupplyAssessment.mockResolvedValue(waiting);
    renderIt("qa");
    await openDetails();
    fireEvent.click(await screen.findByRole("button", { name: "Approve" }));
    await waitFor(() => expect(mocked.decideWaiver).toHaveBeenCalledWith("w1", true));
    cleanup();
    renderIt("designer");
    await openDetails();
    await screen.findByText(/Waiting for QA/);
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeTruthy();
  });

  it("shows a waiver that holds as accepted, and one for an earlier condition as needing a look", async () => {
    mocked.getSupplyAssessment.mockResolvedValue(assessment({ status: "ok", findings: [finding({ waiver })] }));
    renderIt("qa");
    await openDetails();
    expect(await screen.findByText("Waived by qa@example.com: We hold stock")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeTruthy();
    cleanup();
    mocked.getSupplyAssessment.mockResolvedValue(assessment({ findings: [finding({ waiver: { ...waiver, holds: false, outdated: true } })] }));
    renderIt("designer");
    await openDetails();
    expect(await screen.findByText(/Waived for an earlier condition/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Waive again" })).toBeTruthy();
  });

  it("offers no waiver to a viewer and shows a failed action", async () => {
    renderIt("viewer");
    await openDetails();
    await screen.findByText(/does not recommend/);
    expect(screen.queryByRole("button", { name: "Waive" })).toBeNull();
    cleanup();
    mocked.decideWaiver.mockRejectedValue(new Error("Could not save the decision"));
    mocked.getSupplyAssessment.mockResolvedValue(assessment({ findings: [finding({ waiver: { ...waiver, state: "proposed", holds: false } })] }));
    renderIt("admin");
    await openDetails();
    fireEvent.click(await screen.findByRole("button", { name: "Reject" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Could not save the decision");
  });
});

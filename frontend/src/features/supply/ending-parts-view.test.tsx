import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./ending-api", () => ({ getEndingParts: vi.fn(), setRestriction: vi.fn(), clearRestriction: vi.fn(), retireComponent: vi.fn() }));

import type { EndingPart } from "@/types/supply";
import * as api from "./ending-api";
import { EndingPartsView } from "./ending-parts-view";

const item = (over: Partial<EndingPart> = {}): EndingPart => ({
  component: { id: "c1", name: "Op amp", mpn: "LM358DR", manufacturer: "Texas Instruments", stage: "released" },
  part_id: "p1",
  reasons: [{ kind: "nrnd", text: "Not recommended for new designs", source: "Distributors" }, { kind: "outlook", text: "Outlook: under two years", source: "Prism's outlook" }],
  last_buy: [{ source: "DigiKey", value: "2027-03-31" }],
  stock: 4200,
  status: "warning",
  projects: [{ project_id: "pr1", name: "Power board", quantity: 2 }],
  restriction: null,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getEndingParts).mockResolvedValue({ items: [item()], tracked: 10, more: 0 });
  vi.mocked(api.setRestriction).mockResolvedValue(undefined);
  vi.mocked(api.clearRestriction).mockResolvedValue(undefined);
  vi.mocked(api.retireComponent).mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("ending parts in the library manager", () => {
  it("lists the component with why, where it comes from, last buy date, stock and projects", async () => {
    render(<EndingPartsView role="qa" onOpenComponent={vi.fn()} />);
    expect(await screen.findByText("Op amp")).toBeTruthy();
    expect(screen.getByText("Not recommended for new designs")).toBeTruthy();
    expect(screen.getByText(/Outlook: under two years/)).toBeTruthy();
    expect(screen.getByText(/Last buy 2027-03-31/)).toBeTruthy();
    expect(screen.getByText("Power board")).toBeTruthy();
    expect(screen.getByText(/1 component's part is ending/)).toBeTruthy();
  });

  it("opens the component", async () => {
    const open = vi.fn();
    render(<EndingPartsView role="qa" onOpenComponent={open} />);
    fireEvent.click(await screen.findByRole("button", { name: "Op amp" }));
    expect(open).toHaveBeenCalledWith("c1");
  });

  it("marks a component not for new designs with a reason", async () => {
    render(<EndingPartsView role="qa" onOpenComponent={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Not for new designs" }));
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "NRND since 2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Mark" }));
    await waitFor(() => expect(api.setRestriction).toHaveBeenCalledWith("c1", "not_for_new_designs", "NRND since 2026"));
  });

  it("shows the projects that use it before retiring, and retires through the catalog", async () => {
    render(<EndingPartsView role="admin" onOpenComponent={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Retire" }));
    expect(screen.getByText("Tracked projects that use it")).toBeTruthy();
    expect(screen.getByText(/Power board, 2 per board/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Retire" }).at(-1) as HTMLElement);
    await waitFor(() => expect(api.retireComponent).toHaveBeenCalledWith("c1", expect.stringContaining("Not recommended")));
  });

  it("shows a marked component as marked and clears the mark", async () => {
    vi.mocked(api.getEndingParts).mockResolvedValue({ items: [item({ restriction: { level: "not_for_new_designs", reason: "", set_by: "qa", set_at: "2026-10-17" } })], tracked: 1, more: 0 });
    render(<EndingPartsView role="qa" onOpenComponent={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Clear mark" }));
    await waitFor(() => expect(api.clearRestriction).toHaveBeenCalledWith("c1"));
  });

  it("offers no decision to someone who cannot make it", async () => {
    render(<EndingPartsView role="designer" onOpenComponent={vi.fn()} />);
    await screen.findByText("Op amp");
    expect(screen.queryByRole("button", { name: "Retire" })).toBeNull();
    expect(screen.getByText(/QA and administrators decide/)).toBeTruthy();
  });

  it("says so when nothing is ending, and why it failed when it could not load", async () => {
    vi.mocked(api.getEndingParts).mockResolvedValueOnce({ items: [], tracked: 3, more: 0 });
    render(<EndingPartsView role="qa" onOpenComponent={vi.fn()} />);
    expect(await screen.findByText(/No component's part is ending/)).toBeTruthy();
    cleanup();
    vi.mocked(api.getEndingParts).mockRejectedValueOnce(new Error("Could not load the ending parts"));
    render(<EndingPartsView role="qa" onOpenComponent={vi.fn()} />);
    expect(await screen.findByText("Could not load the ending parts")).toBeTruthy();
  });
});

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { User, UserRole } from "@/types/auth";
import type { SupplySource } from "@/types/supply";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  listComponentSources: vi.fn(),
  addComponentSource: vi.fn(),
  decideSource: vi.fn(),
  rankSource: vi.fn(),
  removeSource: vi.fn(),
  listSupplyManufacturers: vi.fn(),
}));

import { AvlSection } from "./avl-section";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

function source(overrides: Partial<SupplySource>): SupplySource {
  return {
    id: "s1", part_id: "p1", manufacturer: "Globex", mpn: "ALT-1", approval: "approved", rank: 1,
    created_by: "a@example.com", decided_by: "qa@example.com", created_at: null, decided_at: null,
    status: "ok", stock: 1200, lifecycle: "active", ...overrides,
  };
}

function renderSection(role: UserRole) {
  const user: User = { name: role, email: `${role}@example.com`, role };
  render(<AvlSection componentId="cmp_1" manufacturer="Acme" mpn="PRIMARY-1" user={user} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocked.listSupplyManufacturers.mockResolvedValue({ items: [] });
  mocked.decideSource.mockResolvedValue();
  mocked.rankSource.mockResolvedValue();
  mocked.removeSource.mockResolvedValue();
});
afterEach(cleanup);

describe("the approved parts list", () => {
  it("shows the component's own part as primary, then its alternates with how they stand", async () => {
    mocked.listComponentSources.mockResolvedValue([source({}), source({ id: "s2", mpn: "ALT-2", approval: "pending", rank: 2, stock: 0, status: "error" })]);
    renderSection("designer");
    const region = await screen.findByRole("region", { name: "Approved parts" });
    expect(within(region).getByText("Primary")).toBeTruthy();
    expect(within(region).getByText("ALT-1")).toBeTruthy();
    expect(within(region).getByText("Waiting for QA")).toBeTruthy();
    expect(within(region).getByText(/At risk, 0 in stock/)).toBeTruthy();
  });

  it("lets QA approve, reject and reorder, and a designer do none of that", async () => {
    mocked.listComponentSources.mockResolvedValue([
      source({}),
      source({ id: "s2", mpn: "ALT-2", rank: 2 }),
      source({ id: "s3", mpn: "ALT-3", approval: "pending", rank: 3 }),
    ]);
    renderSection("qa");
    fireEvent.click(await screen.findByRole("button", { name: "Approve ALT-3" }));
    await waitFor(() => expect(mocked.decideSource).toHaveBeenCalledWith("s3", true));
    fireEvent.click(screen.getByRole("button", { name: "Move ALT-2 up" }));
    await waitFor(() => expect(mocked.rankSource).toHaveBeenCalledTimes(2));
    expect(mocked.rankSource.mock.calls).toEqual([["s2", 1], ["s1", 2]]);
    cleanup();

    renderSection("designer");
    await screen.findByText("ALT-2");
    expect(screen.queryByRole("button", { name: "Approve ALT-3" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Move ALT-2 up" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove ALT-2" })).toBeNull();
    expect(screen.getByRole("button", { name: "Remove ALT-3" })).toBeTruthy();
  });

  it("adds an alternate and reloads the list", async () => {
    mocked.listComponentSources.mockResolvedValueOnce([]).mockResolvedValue([source({ approval: "pending" })]);
    mocked.addComponentSource.mockResolvedValue({ id: "s1", approval: "pending" });
    renderSection("designer");
    fireEvent.click(await screen.findByRole("button", { name: /Add alternate/ }));
    fireEvent.change(screen.getByLabelText("Manufacturer"), { target: { value: "Globex" } });
    fireEvent.change(screen.getByLabelText("Part number"), { target: { value: "ALT-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => expect(mocked.addComponentSource).toHaveBeenCalledWith("cmp_1", "Globex", "ALT-1"));
    expect(await screen.findByText("Waiting for QA")).toBeTruthy();
  });

  it("shows a failed action", async () => {
    mocked.listComponentSources.mockResolvedValue([source({ approval: "pending" })]);
    mocked.decideSource.mockRejectedValue(new Error("Could not save the decision"));
    renderSection("admin");
    fireEvent.click(await screen.findByRole("button", { name: "Approve ALT-1" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Could not save the decision");
  });

  it("hides the add button from roles that cannot propose", async () => {
    mocked.listComponentSources.mockResolvedValue([]);
    renderSection("viewer");
    await screen.findByText("No alternates yet.");
    expect(screen.queryByRole("button", { name: /Add alternate/ })).toBeNull();
  });
});

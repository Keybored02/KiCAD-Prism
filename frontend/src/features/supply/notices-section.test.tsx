import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyNotice } from "@/types/supply";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  listPartNotices: vi.fn(),
  addNotice: vi.fn(),
  closeNotice: vi.fn(),
}));

import { NoticesSection } from "./notices-section";
import * as api from "./supply-api";

const mocked = vi.mocked(api);
const part = { id: "p1", manufacturer: "Acme", mpn: "ABC-1" };

const notice: SupplyNotice = {
  id: "n1", title: "PCN-1234", kind: "end_of_life", kind_label: "End of life", notice_url: "https://acme.example/pcn.pdf",
  last_time_buy: "2026-04-15", last_time_ship: null, notes: "", state: "open", created_by: "a@example.com", parts: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.listPartNotices.mockResolvedValue([notice]);
  mocked.addNotice.mockResolvedValue({ id: "n2" });
  mocked.closeNotice.mockResolvedValue();
});
afterEach(cleanup);

describe("the notices section", () => {
  it("lists a notice with its dates, how many parts it covers and who entered it", async () => {
    render(<NoticesSection part={part} canEdit={false} />);
    expect(await screen.findByRole("link", { name: "PCN-1234" })).toBeTruthy();
    expect(screen.getByText("End of life")).toBeTruthy();
    expect(screen.getByText(/Last time buy 2026-04-15\./)).toBeTruthy();
    expect(screen.getByText(/Covers 3 parts\./)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add notice" })).toBeNull();
  });

  it("adds a notice for this part and closes one", async () => {
    render(<NoticesSection part={part} canEdit />);
    await screen.findByRole("link", { name: "PCN-1234" });
    fireEvent.change(screen.getByLabelText("Notice title or number"), { target: { value: "PCN-9" } });
    fireEvent.change(screen.getByLabelText("What it announces"), { target: { value: "last_time_buy" } });
    fireEvent.change(screen.getByLabelText("Last time buy"), { target: { value: "2026-09-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add notice" }));
    await waitFor(() => expect(mocked.addNotice).toHaveBeenCalledWith({
      title: "PCN-9", kind: "last_time_buy", parts: [{ manufacturer: "Acme", mpn: "ABC-1" }], notice_url: "", last_time_buy: "2026-09-01", last_time_ship: null, notes: "",
    }));
    fireEvent.click(screen.getByRole("button", { name: "Close PCN-1234" }));
    await waitFor(() => expect(mocked.closeNotice).toHaveBeenCalledWith("n1"));
  });

  it("shows nothing to a reader when there are no notices", async () => {
    mocked.listPartNotices.mockResolvedValue([]);
    const { container } = render(<NoticesSection part={part} canEdit={false} />);
    await waitFor(() => expect(mocked.listPartNotices).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });
});

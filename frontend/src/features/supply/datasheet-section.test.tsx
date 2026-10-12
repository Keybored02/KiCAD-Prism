import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplyDatasheets } from "@/types/supply";
import { datasheetStatusText, formatSize } from "./datasheet-model";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getPartDatasheets: vi.fn(),
  setDatasheetUrl: vi.fn(),
}));

import { DatasheetSection } from "./datasheet-section";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

const data: SupplyDatasheets = {
  url: "https://acme.example/abc1.pdf",
  checked_at: "2026-03-01T12:00:00+00:00",
  status: "new",
  items: [
    { id: "d2", version: 2, url: "https://acme.example/abc1.pdf", size_bytes: 2_500_000, pages: 14, markers: ["last time buy"], change_summary: "About 4% of the first pages' text changed. Now mentions: last time buy.", fetched_at: "2026-03-01T12:00:00+00:00" },
    { id: "d1", version: 1, url: "https://acme.example/abc1.pdf", size_bytes: 2_400_000, pages: 14, markers: [], change_summary: "", fetched_at: "2026-02-01T12:00:00+00:00" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getPartDatasheets.mockResolvedValue(data);
  mocked.setDatasheetUrl.mockResolvedValue();
});
afterEach(cleanup);

describe("the datasheet section", () => {
  it("lists the kept versions with what changed and the phrases that matter", async () => {
    render(<DatasheetSection partId="p1" canEdit={false} />);
    expect(await screen.findByText("Version 2, 2026-03-01")).toBeTruthy();
    expect(screen.getByText(/Now mentions: last time buy/)).toBeTruthy();
    expect(screen.getAllByText("last time buy").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Download version 1" }).getAttribute("href")).toBe("/api/supply/datasheets/d1/file");
    expect(screen.queryByLabelText("Datasheet address")).toBeNull();
  });

  it("lets a writer change the address", async () => {
    render(<DatasheetSection partId="p1" canEdit />);
    const input = await screen.findByLabelText("Datasheet address");
    fireEvent.change(input, { target: { value: "https://other.example/new.pdf" } });
    fireEvent.click(screen.getByRole("button", { name: "Save address" }));
    await waitFor(() => expect(mocked.setDatasheetUrl).toHaveBeenCalledWith("p1", "https://other.example/new.pdf"));
  });

  it("shows nothing to a reader when the part has no datasheet", async () => {
    mocked.getPartDatasheets.mockResolvedValue({ url: "", checked_at: null, status: null, items: [] });
    const { container } = render(<DatasheetSection partId="p1" canEdit={false} />);
    await waitFor(() => expect(mocked.getPartDatasheets).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });
});

describe("datasheet wording", () => {
  it("says what the last check found", () => {
    expect(datasheetStatusText(null)).toMatch(/Not checked yet/);
    expect(datasheetStatusText("not_a_pdf")).toBe("The address did not give a PDF.");
    expect(datasheetStatusText("something_new")).toBe("The address could not be read.");
  });

  it("sizes in kB or MB", () => {
    expect([formatSize(100), formatSize(2_500_000)]).toEqual(["1 kB", "2.4 MB"]);
  });
});

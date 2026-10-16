import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getPartDatasheet: vi.fn(),
  setDatasheetUrl: vi.fn(),
}));

import { DatasheetSection } from "./datasheet-section";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getPartDatasheet.mockResolvedValue({ url: "https://acme.example/abc1.pdf" });
  mocked.setDatasheetUrl.mockResolvedValue();
});
afterEach(cleanup);

describe("the datasheet section", () => {
  it("links to the manufacturer's datasheet and keeps nothing", async () => {
    render(<DatasheetSection partId="p1" canEdit={false} />);
    const link = await screen.findByRole("link", { name: /Open the datasheet/ });
    expect(link.getAttribute("href")).toBe("https://acme.example/abc1.pdf");
    expect(link.getAttribute("target")).toBe("_blank");
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
    mocked.getPartDatasheet.mockResolvedValue({ url: "" });
    const { container } = render(<DatasheetSection partId="p1" canEdit={false} />);
    await waitFor(() => expect(mocked.getPartDatasheet).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });
});

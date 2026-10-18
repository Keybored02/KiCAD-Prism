import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  getPartDatasheet: vi.fn(),
  setDatasheetUrl: vi.fn(),
}));

import { DatasheetLink } from "./datasheet-link";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
  mocked.getPartDatasheet.mockResolvedValue({ url: "https://acme.example/abc1.pdf" });
  mocked.setDatasheetUrl.mockResolvedValue();
});
afterEach(cleanup);

describe("the datasheet icon", () => {
  it("is an icon that opens the manufacturer's datasheet and keeps nothing", async () => {
    render(<DatasheetLink partId="p1" canEdit={false} />);
    const link = await screen.findByRole("link", { name: "Open the datasheet" });
    expect(link.getAttribute("href")).toBe("https://acme.example/abc1.pdf");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.textContent).toBe("");
    expect(screen.queryByRole("button", { name: "Set the datasheet address" })).toBeNull();
  });

  it("lets a writer change the address", async () => {
    render(<DatasheetLink partId="p1" canEdit />);
    fireEvent.click(await screen.findByRole("button", { name: "Set the datasheet address" }));
    fireEvent.change(await screen.findByLabelText("Datasheet address"), { target: { value: "https://other.example/new.pdf" } });
    fireEvent.click(screen.getByRole("button", { name: "Save address" }));
    await waitFor(() => expect(mocked.setDatasheetUrl).toHaveBeenCalledWith("p1", "https://other.example/new.pdf"));
  });

  it("shows nothing to a reader when the part has no datasheet", async () => {
    mocked.getPartDatasheet.mockResolvedValue({ url: "" });
    const { container } = render(<DatasheetLink partId="p1" canEdit={false} />);
    await waitFor(() => expect(mocked.getPartDatasheet).toHaveBeenCalled());
    expect(container.textContent).toBe("");
  });

  it("offers a writer a way to give a part its first address", async () => {
    mocked.getPartDatasheet.mockResolvedValue({ url: "" });
    render(<DatasheetLink partId="p1" canEdit />);
    expect(await screen.findByRole("button", { name: "Set the datasheet address" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Open the datasheet" })).toBeNull();
  });
});

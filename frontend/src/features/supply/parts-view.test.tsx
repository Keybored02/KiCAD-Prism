import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiHttpError } from "@/lib/api";
import type { User, UserRole } from "@/types/auth";
import { partDetailFixture, partRowFixture } from "./supply-test-fixtures";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  listSupplyParts: vi.fn(),
  getSupplyPart: vi.fn(),
  addSupplyWatch: vi.fn(),
  updateSupplyWatch: vi.fn(),
  removeSupplyWatch: vi.fn(),
}));

import { PartsView } from "./parts-view";
import * as api from "./supply-api";

const mocked = vi.mocked(api);

function userWith(role: UserRole): User {
  return { name: role, email: `${role}@example.com`, role };
}

function Location() {
  const location = useLocation();
  return <output aria-label="location">{location.search}</output>;
}

function renderView(role: UserRole = "designer", url = "/?section=supply") {
  render(
    <MemoryRouter initialEntries={[url]}>
      <PartsView user={userWith(role)} />
      <Location />
    </MemoryRouter>,
  );
}

const search = () => screen.getByLabelText("location").textContent ?? "";

beforeEach(() => {
  vi.clearAllMocks();
  mocked.listSupplyParts.mockResolvedValue({ items: [partRowFixture()], total: 1, limit: 100 });
  mocked.getSupplyPart.mockResolvedValue(partDetailFixture());
});
afterEach(cleanup);

describe("the parts list", () => {
  it("shows each part with its status, stock, price and lifecycle", async () => {
    renderView();
    const row = (await screen.findByRole("button", { name: "LM358D" })).closest("tr")!;
    expect(within(row).getByText("Texas Instruments")).toBeTruthy();
    expect(within(row).getByRole("img", { name: "OK" })).toBeTruthy();
    expect(within(row).getByText((12500).toLocaleString())).toBeTruthy();
    expect(within(row).getByText(/0\.52/)).toBeTruthy();
    expect(within(row).getByText("Active")).toBeTruthy();
    expect(within(row).getByText("2 h ago")).toBeTruthy();
    expect(within(row).getByLabelText("Watched")).toBeTruthy();
    expect(screen.getByText("1 part")).toBeTruthy();
    expect(mocked.listSupplyParts).toHaveBeenCalledWith("watched", "", expect.anything());
  });

  it("says plainly when a part has not been read yet", async () => {
    mocked.listSupplyParts.mockResolvedValue({
      items: [partRowFixture({ status: "unknown", stock: null, listings: 0, unit_price: null, currency: "", fetched_at: null, tier: null })],
      total: 1, limit: 100,
    });
    renderView();
    const row = (await screen.findByRole("button", { name: "LM358D" })).closest("tr")!;
    expect(within(row).getByText("None yet")).toBeTruthy();
    expect(within(row).getByRole("img", { name: "No data" })).toBeTruthy();
  });

  it("notes when only some of the parts are shown", async () => {
    mocked.listSupplyParts.mockResolvedValue({ items: [partRowFixture()], total: 450, limit: 100 });
    renderView();
    expect(await screen.findByText("Showing 1 of 450. Search to narrow it down.")).toBeTruthy();
  });

  it("switches scope through the URL and asks for the other list", async () => {
    renderView();
    await screen.findByRole("button", { name: "LM358D" });
    fireEvent.click(screen.getByRole("button", { name: "All known" }));
    await waitFor(() => expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("all", "", expect.anything()));
    expect(search()).toContain("partsScope=all");
    expect(screen.getByRole("button", { name: "All known" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Watched" }));
    await waitFor(() => expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("watched", "", expect.anything()));
    expect(search()).not.toContain("partsScope");
  });

  it("searches through the URL, and a link with a search starts there", async () => {
    renderView();
    await screen.findByRole("button", { name: "LM358D" });
    fireEvent.change(screen.getByLabelText("Search parts"), { target: { value: "  lm358  " } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("watched", "lm358", expect.anything()));
    expect(search()).toContain("partsQ=lm358");
    cleanup();

    renderView("designer", "/?section=supply&partsScope=all&partsQ=tps");
    await screen.findByRole("button", { name: "LM358D" });
    expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("all", "tps", expect.anything());
    expect((screen.getByLabelText("Search parts") as HTMLInputElement).value).toBe("tps");
  });

  it("explains an empty list for each case", async () => {
    mocked.listSupplyParts.mockResolvedValue({ items: [], total: 0, limit: 100 });
    renderView();
    expect(await screen.findByText("No watched parts yet")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Watch a part" })).toHaveLength(2);
    cleanup();
    renderView("qa");
    expect(await screen.findByText("No watched parts yet")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Watch a part" })).toHaveLength(1);
    cleanup();
    renderView("designer", "/?partsQ=zzz");
    expect(await screen.findByText("No parts match")).toBeTruthy();
    cleanup();
    renderView("designer", "/?partsScope=all");
    expect(await screen.findByText("No parts yet")).toBeTruthy();
  });

  it("reports a load failure and retries", async () => {
    mocked.listSupplyParts.mockRejectedValueOnce(new Error("Could not load parts"));
    renderView();
    expect(await screen.findByText("Could not load parts")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("button", { name: "LM358D" })).toBeTruthy();
  });
});

describe("a part", () => {
  it("opens beside the list from the URL and shows stock, history and listings", async () => {
    renderView();
    fireEvent.click(await screen.findByRole("button", { name: "LM358D" }));
    expect(search()).toContain("part=p1");
    const sheet = await screen.findByRole("dialog");
    const stock = await within(sheet).findByRole("region", { name: "Stock" });
    expect(within(stock).getByText("In stock")).toBeTruthy();
    expect(within(stock).getByText((12500).toLocaleString())).toBeTruthy();
    expect(within(sheet).getByRole("img", { name: "OK" })).toBeTruthy();
    expect(within(sheet).getByRole("img", { name: "Stock over the last 90 days" })).toBeTruthy();
    expect(within(sheet).getByText(`3 days. Low ${(9000).toLocaleString()}, high ${(12500).toLocaleString()}.`)).toBeTruthy();
    expect(within(sheet).getByRole("article", { name: "Listing 595-LM358D" })).toBeTruthy();
    expect(mocked.getSupplyPart).toHaveBeenCalledWith("p1", expect.anything());
  });

  it("marks listings that do not count and offers that have not been read", async () => {
    renderView("designer", "/?part=p1");
    const near = await screen.findByRole("article", { name: "Listing 595-LM358DR" });
    expect(within(near).getByText("Near match, not counted")).toBeTruthy();
    expect(within(near).getByText("Not read yet.")).toBeTruthy();
    const main = screen.getByRole("article", { name: "Listing 595-LM358D" });
    expect(within(main).getByText("cut tape")).toBeTruthy();
    expect(within(main).getByText("On order")).toBeTruthy();
    expect(within(main).getByText("5,000 due 2026-04-01")).toBeTruthy();
    expect(within(main).getByLabelText("Open Mouser EU product page").getAttribute("href")).toBe("https://example.invalid/p");
  });

  it("closes by clearing the URL", async () => {
    renderView("designer", "/?part=p1");
    const sheet = await screen.findByRole("dialog");
    fireEvent.click(within(sheet).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(search()).not.toContain("part="));
  });

  it("reports a part that cannot be loaded and retries", async () => {
    mocked.getSupplyPart.mockRejectedValueOnce(new ApiHttpError(404, "Not found"));
    renderView("designer", "/?part=p1");
    const sheet = await screen.findByRole("dialog");
    expect(await within(sheet).findByText("Not found")).toBeTruthy();
    fireEvent.click(within(sheet).getByRole("button", { name: "Retry" }));
    expect(await within(sheet).findByRole("article", { name: "Listing 595-LM358D" })).toBeTruthy();
  });

  it("asks for history rather than drawing a line through nothing", async () => {
    mocked.getSupplyPart.mockResolvedValue(partDetailFixture({ history: [{ day: "2026-03-01", stock: 5 }] }));
    renderView("designer", "/?part=p1");
    expect(await screen.findByText("History builds up as the part is read.")).toBeTruthy();
  });
});

describe("watching", () => {
  it("watches a new part from the list and opens it", async () => {
    mocked.addSupplyWatch.mockResolvedValue({ id: "w9", part_id: "p9", manufacturer: "Acme", mpn: "X1", threshold: 50, pinned: false, owner: "d" });
    renderView();
    await screen.findByRole("button", { name: "LM358D" });
    fireEvent.click(screen.getAllByRole("button", { name: "Watch a part" })[0]);
    const submit = await screen.findByRole("button", { name: "Watch part" });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Manufacturer"), { target: { value: " Acme " } });
    fireEvent.change(screen.getByLabelText("Part number"), { target: { value: " X1 " } });
    fireEvent.change(screen.getByLabelText("Warn when stock is at or below"), { target: { value: "50" } });
    fireEvent.click(submit);
    await waitFor(() => expect(mocked.addSupplyWatch).toHaveBeenCalledWith({ manufacturer: "Acme", mpn: "X1", threshold: 50, pinned: false }));
    await waitFor(() => expect(search()).toContain("part=p9"));
    await waitFor(() => expect(mocked.listSupplyParts.mock.calls.length).toBeGreaterThan(1));
  });

  it("refuses a threshold that is not a whole number", async () => {
    renderView();
    fireEvent.click((await screen.findAllByRole("button", { name: "Watch a part" }))[0]);
    fireEvent.change(await screen.findByLabelText("Manufacturer"), { target: { value: "Acme" } });
    fireEvent.change(screen.getByLabelText("Part number"), { target: { value: "X1" } });
    fireEvent.change(screen.getByLabelText("Warn when stock is at or below"), { target: { value: "1.5" } });
    expect(screen.getByText("A whole number, or leave it empty.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Watch part" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("keeps the dialog open and shows the server's reason", async () => {
    mocked.addSupplyWatch.mockRejectedValue(new ApiHttpError(400, "At most 25 parts can be pinned to the fastest polling."));
    renderView();
    fireEvent.click((await screen.findAllByRole("button", { name: "Watch a part" }))[0]);
    fireEvent.change(await screen.findByLabelText("Manufacturer"), { target: { value: "Acme" } });
    fireEvent.change(screen.getByLabelText("Part number"), { target: { value: "X1" } });
    fireEvent.click(screen.getByRole("button", { name: "Watch part" }));
    expect(await screen.findByText(/At most 25 parts/)).toBeTruthy();
    expect(screen.getByLabelText("Part number")).toBeTruthy();
  });

  it("is closed to readers who cannot watch", async () => {
    renderView("qa");
    await screen.findByRole("button", { name: "LM358D" });
    expect((screen.getByRole("button", { name: "Watch a part" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("the watch settings", () => {
  it("saves a changed threshold and pin", async () => {
    mocked.updateSupplyWatch.mockResolvedValue({ id: "w1", part_id: "p1", manufacturer: "T", mpn: "L", threshold: 800, pinned: true, owner: "o" });
    renderView("designer", "/?part=p1");
    const threshold = (await screen.findByLabelText("Warn when stock is at or below")) as HTMLInputElement;
    expect(threshold.value).toBe("500");
    const save = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(threshold, { target: { value: "800" } });
    fireEvent.click(screen.getByLabelText("Always read at the fastest rate"));
    fireEvent.click(save);
    await waitFor(() => expect(mocked.updateSupplyWatch).toHaveBeenCalledWith("w1", { threshold: 800, pinned: true }));
    await waitFor(() => expect(mocked.getSupplyPart.mock.calls.length).toBeGreaterThan(1));
  });

  it("clears the threshold with an empty box", async () => {
    mocked.updateSupplyWatch.mockResolvedValue({ id: "w1", part_id: "p1", manufacturer: "T", mpn: "L", threshold: null, pinned: false, owner: "o" });
    renderView("designer", "/?part=p1");
    fireEvent.change(await screen.findByLabelText("Warn when stock is at or below"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocked.updateSupplyWatch).toHaveBeenCalledWith("w1", { threshold: null, pinned: false }));
  });

  it("will not save an invalid threshold", async () => {
    renderView("designer", "/?part=p1");
    fireEvent.change(await screen.findByLabelText("Warn when stock is at or below"), { target: { value: "-5" } });
    expect(screen.getByText("A whole number, or leave it empty.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("stops watching", async () => {
    mocked.removeSupplyWatch.mockResolvedValue(undefined);
    renderView("designer", "/?part=p1");
    fireEvent.click(await screen.findByRole("button", { name: "Stop watching" }));
    await waitFor(() => expect(mocked.removeSupplyWatch).toHaveBeenCalledWith("w1"));
  });

  it("offers to watch a part that is not watched", async () => {
    mocked.getSupplyPart.mockResolvedValue(partDetailFixture({ watch: null }));
    mocked.addSupplyWatch.mockResolvedValue({ id: "w2", part_id: "p1", manufacturer: "T", mpn: "L", threshold: null, pinned: false, owner: "o" });
    renderView("admin", "/?part=p1");
    fireEvent.click(await screen.findByRole("button", { name: "Watch this part" }));
    await waitFor(() => expect(mocked.addSupplyWatch).toHaveBeenCalledWith({ manufacturer: "Texas Instruments", mpn: "LM358D" }));
  });

  it("shows readers the rules without controls", async () => {
    renderView("qa", "/?part=p1");
    const sheet = await screen.findByRole("dialog");
    expect(await within(sheet).findByText(/Watched by ana@example.com\. Warns at 500 in stock\./)).toBeTruthy();
    expect(within(sheet).queryByLabelText("Warn when stock is at or below")).toBeNull();
    expect(within(sheet).queryByRole("button", { name: "Stop watching" })).toBeNull();
  });

  it("does not offer to watch to a reader", async () => {
    mocked.getSupplyPart.mockResolvedValue(partDetailFixture({ watch: null }));
    renderView("qa", "/?part=p1");
    const sheet = await screen.findByRole("dialog");
    expect(await within(sheet).findByText(/Not watched/)).toBeTruthy();
    expect(within(sheet).queryByRole("button", { name: "Watch this part" })).toBeNull();
  });
});

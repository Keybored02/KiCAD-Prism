import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiHttpError } from "@/lib/api";
import type { User, UserRole } from "@/types/auth";
import { partDetailFixture, partRowFixture } from "./supply-test-fixtures";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Recharts is slow to load cold and is not what these tests are about; stock-chart.test.tsx covers the chart.
vi.mock("./stock-chart", () => ({
  default: ({ threshold }: { threshold: number | null }) => (
    <div role="img" aria-label="Stock over the last 90 days" data-threshold={threshold ?? "none"} />
  ),
}));

vi.mock("./supply-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./supply-api")>()),
  listSupplyParts: vi.fn(),
  listSupplyPartGroups: vi.fn(),
  getSupplyPart: vi.fn(),
  addSupplyWatch: vi.fn(),
  updateSupplyWatch: vi.fn(),
  removeSupplyWatch: vi.fn(),
  listSupplyManufacturers: vi.fn(),
  refreshSupplyUsage: vi.fn(),
  getSupplyAssessment: vi.fn(),
  listPartDemands: vi.fn(),
  getPartDatasheet: vi.fn(),
  getPartCompliance: vi.fn(),
  listPartNotices: vi.fn(),
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
  mocked.listPartNotices.mockResolvedValue([]);
  mocked.getPartCompliance.mockResolvedValue({ rohs: { state: "unknown", reason: "" }, reach: { state: "unknown", reason: "" }, substances: [], list: { loaded: false, substances: 0, loaded_at: null, loaded_by: "", source_name: "" } });
  mocked.getPartDatasheet.mockResolvedValue({ url: "" });
  mocked.listPartDemands.mockResolvedValue({ items: [], summary: { open: 0, own_stock: null, net: 0, next_need_by: null } });
  mocked.listSupplyParts.mockResolvedValue({ items: [partRowFixture()], total: 1, limit: 100 });
  mocked.listSupplyPartGroups.mockResolvedValue({ groups: [LOOSE], total: 1 });
  mocked.getSupplyPart.mockResolvedValue(partDetailFixture());
  mocked.refreshSupplyUsage.mockResolvedValue({ updated: 0, unchanged: 0, without_index: 0, removed: 0 });
  mocked.listSupplyManufacturers.mockResolvedValue({ items: [{ id: "m1", name: "Texas Instruments", part_count: 3 }] });
});
const LOOSE = { project_id: "none", project_name: "Not in a project", tracked: false, count: 1, statuses: { ok: 1 } };

afterEach(cleanup);

describe("the parts list, demand", () => {
  it("says how much open demand asks of a part and by when", async () => {
    mocked.listSupplyParts.mockResolvedValue({ items: [partRowFixture({ needed: 700, need_by: "2026-05-01" })], total: 1, limit: 100 });
    renderView();
    expect(await screen.findByText("needed 700 by 2026-05-01")).toBeTruthy();
  });
});

describe("the parts list", () => {
  it("narrows to a group from the URL and lets it go", async () => {
    renderView("designer", "/?section=supply&partsOnly=out_of_stock");
    await waitFor(() => expect(mocked.listSupplyParts).toHaveBeenCalledWith("watched", "", expect.anything(), "out_of_stock", 0, 50, ""));
    fireEvent.click(await screen.findByRole("button", { name: /Showing only Out of stock/ }));
    await waitFor(() => expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("watched", "", expect.anything(), "", 0, 50, ""));
    expect(search()).not.toContain("partsOnly");
  });

  it("shows each part with its status, stock, price and lifecycle", async () => {
    renderView();
    const row = (await screen.findByRole("button", { name: "LM358D" })).closest("tr")!;
    expect(within(row).getByText("Texas Instruments")).toBeTruthy();
    expect(within(row).getByRole("img", { name: "OK" })).toBeTruthy();
    expect(within(row).getByText((12500).toLocaleString())).toBeTruthy();
    expect(within(row).getByText(/0\.52/)).toBeTruthy();
    expect(within(row).queryByRole("img", { name: "Active" })).toBeNull();
    expect(within(row).getByRole("img", { name: "Read 2 h ago" })).toBeTruthy();
    expect(within(row).getByRole("img", { name: "Tracked" })).toBeTruthy();
    expect(screen.getByText("1 part")).toBeTruthy();
    expect(mocked.listSupplyParts).toHaveBeenCalledWith("watched", "", expect.anything(), "", 0, 50, "");
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

  it("groups the parts by project, closed until opened, with the loose parts last", async () => {
    mocked.listSupplyPartGroups.mockResolvedValue({
      groups: [
        { project_id: "prj_1", project_name: "Power board", tracked: true, count: 3, statuses: { error: 1, ok: 2 } },
        LOOSE,
      ],
      total: 4,
    });
    mocked.listSupplyParts.mockResolvedValue({ items: [partRowFixture({ mpn: "LM324" })], total: 3, limit: 50 });
    renderView();
    const power = await screen.findByRole("button", { name: /Power board/ });
    expect(within(power).getByText("Tracked")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "LM324" })).toBeNull();
    expect(mocked.listSupplyParts).not.toHaveBeenCalled();
    fireEvent.click(power);
    expect(await screen.findByRole("button", { name: "LM324" })).toBeTruthy();
    expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("watched", "", expect.anything(), "", 0, 50, "prj_1");
    const order = screen.getAllByRole("button", { name: /Power board|Not in a project/ }).map((button) => (button.textContent ?? "").includes("Power board"));
    expect(order).toEqual([true, false]);
  });

  it("loads the next page when the end of the list comes into view", async () => {
    class Seen { constructor(private readonly callback: IntersectionObserverCallback) {} observe() { this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); } disconnect() {} unobserve() {} }
    vi.stubGlobal("IntersectionObserver", Seen);
    mocked.listSupplyParts
      .mockResolvedValueOnce({ items: [partRowFixture()], total: 2, limit: 50, offset: 0, next_offset: 50 })
      .mockResolvedValueOnce({ items: [partRowFixture({ id: "p2", mpn: "LM324" })], total: 2, limit: 50, offset: 50, next_offset: null });
    mocked.listSupplyPartGroups.mockResolvedValue({ groups: [{ ...LOOSE, count: 2 }], total: 2 });
    renderView();
    expect(await screen.findByRole("button", { name: "LM324" })).toBeTruthy();
    expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("watched", "", undefined, "", 50, 50, "");
    expect(screen.getByText("2 parts")).toBeTruthy();
    vi.unstubAllGlobals();
  });

  it("switches scope through the URL and asks for the other list", async () => {
    renderView();
    await screen.findByRole("button", { name: "LM358D" });
    fireEvent.click(screen.getByRole("button", { name: "All known" }));
    await waitFor(() => expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("all", "", expect.anything(), "", 0, 50, ""));
    expect(search()).toContain("partsScope=all");
    expect(screen.getByRole("button", { name: "All known" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Tracked" }));
    await waitFor(() => expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("watched", "", expect.anything(), "", 0, 50, ""));
    expect(search()).not.toContain("partsScope");
  });

  it("searches through the URL, and a link with a search starts there", async () => {
    renderView();
    await screen.findByRole("button", { name: "LM358D" });
    fireEvent.change(screen.getByLabelText("Search parts"), { target: { value: "  lm358  " } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("watched", "lm358", expect.anything(), "", 0, 50, ""));
    expect(search()).toContain("partsQ=lm358");
    cleanup();

    renderView("designer", "/?section=supply&partsScope=all&partsQ=tps");
    await screen.findByRole("button", { name: "LM358D" });
    expect(mocked.listSupplyParts).toHaveBeenLastCalledWith("all", "tps", expect.anything(), "", 0, 50, "");
    expect((screen.getByLabelText("Search parts") as HTMLInputElement).value).toBe("tps");
  });

  it("explains an empty list for each case", async () => {
    mocked.listSupplyParts.mockResolvedValue({ items: [], total: 0, limit: 100 });
    mocked.listSupplyPartGroups.mockResolvedValue({ groups: [], total: 0 });
    renderView();
    expect(await screen.findByText("No tracked parts yet")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Track a part" })).toHaveLength(2);
    cleanup();
    renderView("qa");
    expect(await screen.findByText("No tracked parts yet")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Track a part" })).toHaveLength(1);
    cleanup();
    renderView("designer", "/?partsQ=zzz");
    expect(await screen.findByText("No parts match")).toBeTruthy();
    cleanup();
    renderView("designer", "/?partsScope=all");
    expect(await screen.findByText("No parts yet")).toBeTruthy();
  });

  it("reports a load failure and retries", async () => {
    mocked.listSupplyPartGroups.mockRejectedValueOnce(new Error("Could not load parts"));
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

  it("draws the stock chart with the watch threshold", async () => {
    renderView("designer", "/?part=p1");
    const chart = await screen.findByRole("img", { name: "Stock over the last 90 days" });
    expect(chart.getAttribute("data-threshold")).toBe("500");
  });

  it("asks for history rather than drawing a line through nothing", async () => {
    mocked.getSupplyPart.mockResolvedValue(partDetailFixture({ history: [{ day: "2026-03-01", stock: 5, listings: 1 }] }));
    renderView("designer", "/?part=p1");
    expect(await screen.findByText("History builds up as the part is read.")).toBeTruthy();
  });
});

describe("watching", () => {
  it("watches a new part from the list and opens it", async () => {
    mocked.addSupplyWatch.mockResolvedValue({ id: "w9", part_id: "p9", manufacturer: "Acme", mpn: "X1", threshold: 50, pinned: false, owner: "d", packaging: "any" });
    renderView();
    await screen.findByRole("button", { name: "LM358D" });
    fireEvent.click(screen.getAllByRole("button", { name: "Track a part" })[0]);
    const submit = await screen.findByRole("button", { name: "Watch part" });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Manufacturer (optional)"), { target: { value: " Acme " } });
    fireEvent.change(screen.getByLabelText("Part number"), { target: { value: " X1 " } });
    fireEvent.change(screen.getByLabelText("Warn when stock is at or below"), { target: { value: "50" } });
    fireEvent.click(submit);
    await waitFor(() => expect(mocked.addSupplyWatch).toHaveBeenCalledWith({ manufacturer: "Acme", mpn: "X1", threshold: 50, pinned: false }));
    await waitFor(() => expect(search()).toContain("part=p9"));
    await waitFor(() => expect(mocked.listSupplyParts.mock.calls.length).toBeGreaterThan(1));
  });

  it("refuses a threshold that is not a whole number", async () => {
    renderView();
    fireEvent.click((await screen.findAllByRole("button", { name: "Track a part" }))[0]);
    fireEvent.change(await screen.findByLabelText("Manufacturer (optional)"), { target: { value: "Acme" } });
    fireEvent.change(screen.getByLabelText("Part number"), { target: { value: "X1" } });
    fireEvent.change(screen.getByLabelText("Warn when stock is at or below"), { target: { value: "1.5" } });
    expect(screen.getByText("A whole number, or leave it empty.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Watch part" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("keeps the dialog open and shows the server's reason", async () => {
    mocked.addSupplyWatch.mockRejectedValue(new ApiHttpError(400, "At most 25 parts can be pinned to the fastest polling."));
    renderView();
    fireEvent.click((await screen.findAllByRole("button", { name: "Track a part" }))[0]);
    fireEvent.change(await screen.findByLabelText("Manufacturer (optional)"), { target: { value: "Acme" } });
    fireEvent.change(screen.getByLabelText("Part number"), { target: { value: "X1" } });
    fireEvent.click(screen.getByRole("button", { name: "Watch part" }));
    expect(await screen.findByText(/At most 25 parts/)).toBeTruthy();
    expect(screen.getByLabelText("Part number")).toBeTruthy();
  });

  it("is closed to readers who cannot watch", async () => {
    renderView("qa");
    await screen.findByRole("button", { name: "LM358D" });
    expect((screen.getByRole("button", { name: "Track a part" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("the watch settings", () => {
  it("saves a changed threshold and pin", async () => {
    mocked.updateSupplyWatch.mockResolvedValue({ id: "w1", part_id: "p1", manufacturer: "T", mpn: "L", threshold: 800, pinned: true, owner: "o", packaging: "any" });
    renderView("designer", "/?part=p1");
    const threshold = (await screen.findByLabelText("Warn when stock is at or below")) as HTMLInputElement;
    expect(threshold.value).toBe("500");
    const save = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(threshold, { target: { value: "800" } });
    fireEvent.click(screen.getByLabelText("Always read at the fastest rate"));
    fireEvent.click(save);
    await waitFor(() => expect(mocked.updateSupplyWatch).toHaveBeenCalledWith("w1", { threshold: 800, pinned: true, packaging: "any" }));
    await waitFor(() => expect(mocked.getSupplyPart.mock.calls.length).toBeGreaterThan(1));
  });

  it("clears the threshold with an empty box", async () => {
    mocked.updateSupplyWatch.mockResolvedValue({ id: "w1", part_id: "p1", manufacturer: "T", mpn: "L", threshold: null, pinned: false, owner: "o", packaging: "any" });
    renderView("designer", "/?part=p1");
    fireEvent.change(await screen.findByLabelText("Warn when stock is at or below"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocked.updateSupplyWatch).toHaveBeenCalledWith("w1", { threshold: null, pinned: false, packaging: "any" }));
  });

  it("saves which packaging the watch counts", async () => {
    mocked.updateSupplyWatch.mockResolvedValue({ id: "w1", part_id: "p1", manufacturer: "T", mpn: "L", threshold: 500, pinned: false, owner: "o", packaging: "cut_tape" });
    renderView("designer", "/?part=p1");
    fireEvent.change(await screen.findByLabelText("Count stock of"), { target: { value: "cut_tape" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocked.updateSupplyWatch).toHaveBeenCalledWith("w1", { threshold: 500, pinned: false, packaging: "cut_tape" }));
  });

  it("will not save an invalid threshold", async () => {
    renderView("designer", "/?part=p1");
    fireEvent.change(await screen.findByLabelText("Warn when stock is at or below"), { target: { value: "-5" } });
    expect(screen.getByText("A whole number, or leave it empty.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("asks before it stops watching, and keeps watching if told to", async () => {
    mocked.removeSupplyWatch.mockResolvedValue(undefined);
    renderView("designer", "/?part=p1");
    fireEvent.click(await screen.findByRole("button", { name: "Stop watching…" }));
    expect(mocked.removeSupplyWatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Keep watching" }));
    expect(screen.getByRole("button", { name: "Stop watching…" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Stop watching…" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop watching" }));
    await waitFor(() => expect(mocked.removeSupplyWatch).toHaveBeenCalledWith("w1"));
  });

  it("says why a part has no stock when it is lost, in the list and in the sheet", async () => {
    mocked.listSupplyParts.mockResolvedValue({
      items: [partRowFixture({ status: "error", problem: "not_found", stock: null, unit_price: null, listings: 0 })], total: 1, limit: 100,
    });
    mocked.getSupplyPart.mockResolvedValue(partDetailFixture({
      status: "error", problem: "not_found", problem_text: "No distributor carries this part number",
      stock: { total: null, by_connector: [] },
    }));
    renderView("designer", "/?part=p1");
    const sheet = await screen.findByRole("dialog");
    expect(await within(sheet).findByRole("alert")).toHaveProperty("textContent", "No distributor carries this part number");
    expect(screen.getAllByText("No distributor carries this part number").length).toBe(2);
  });

  it("shows the trend with its confidence and the readings it rests on", async () => {
    mocked.getSupplyPart.mockResolvedValue(partDetailFixture({
      insight: {
        confidence: "high", trend: "falling", decrease_per_day: 50, days_to_zero: 6, days_to_threshold: 2,
        restocks: 0, restock_interval_days: null, restock_expected_in_days: null,
        inputs: { points: 35, span_days: 34, points_in_run: 35, current: 300 },
      },
    }));
    renderView("designer", "/?part=p1");
    const trend = await screen.findByRole("region", { name: "Trend" });
    expect(within(trend).getByText("High confidence")).toBeTruthy();
    expect(within(trend).getByText("Observed net decrease: 50 a day.")).toBeTruthy();
    expect(within(trend).getByText("At that rate it reaches zero in about 6 days.")).toBeTruthy();
    expect(within(trend).getByText(/35 daily readings over 34 days/)).toBeTruthy();
  });

  it("shows no trend section while there is no insight to give", async () => {
    renderView("designer", "/?part=p1");
    await screen.findByRole("region", { name: "Watch" });
    expect(screen.queryByRole("region", { name: "Trend" })).toBeNull();
  });

  it("reads where parts are used when the In use scope is chosen, then reloads the list", async () => {
    mocked.listSupplyParts.mockResolvedValue({ items: [partRowFixture({ used_in: 3 })], total: 1, limit: 100 });
    renderView();
    fireEvent.click(await screen.findByRole("button", { name: "In use" }));
    expect(search()).toContain("partsScope=in_use");
    await waitFor(() => expect(mocked.refreshSupplyUsage).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mocked.listSupplyParts).toHaveBeenCalledWith("in_use", "", expect.anything(), "", 0, 50, ""));
    // Once for the first load of the scope and once after the usage was read.
    await waitFor(() => expect(mocked.listSupplyParts.mock.calls.filter((call) => call[0] === "in_use").length).toBeGreaterThanOrEqual(2));
    expect(await screen.findByText("Used in 3 projects")).toBeTruthy();
  });

  it("does not read usage for the other scopes", async () => {
    renderView();
    await screen.findByRole("button", { name: "LM358D" });
    fireEvent.click(screen.getByRole("button", { name: "All known" }));
    await waitFor(() => expect(mocked.listSupplyParts).toHaveBeenCalledWith("all", "", expect.anything(), "", 0, 50, ""));
    expect(mocked.refreshSupplyUsage).not.toHaveBeenCalled();
  });

  it("says why the In use scope is empty", async () => {
    mocked.listSupplyPartGroups.mockResolvedValue({ groups: [], total: 0 });
    renderView("designer", "/?partsScope=in_use");
    expect(await screen.findByText("No parts in use yet")).toBeTruthy();
    expect(screen.getByText(/Open a project BOM, then watch its parts/)).toBeTruthy();
  });

  it("lists the projects a part is used in, with links", async () => {
    mocked.getSupplyPart.mockResolvedValue(partDetailFixture({
      used_in: [
        { project_id: "prj_1", project_name: "satnogs-comms-hardware", quantity: 44, references: "C201 C202" },
        { project_id: "prj_2", project_name: "Another board", quantity: 1, references: "C1" },
      ],
    }));
    renderView("designer", "/?part=p1");
    const used = await screen.findByRole("region", { name: "Used in" });
    const link = within(used).getByRole("link", { name: "satnogs-comms-hardware" });
    expect(link.getAttribute("href")).toBe("/project/prj_1");
    expect(within(used).getByText("44 per board")).toBeTruthy();
    expect(within(used).getByText("Used in (2)")).toBeTruthy();
  });

  it("offers Read now to the people who can watch parts, and to nobody else", async () => {
    renderView("designer", "/?part=p1");
    expect(await screen.findByRole("button", { name: /Read now/ })).toBeTruthy();
    cleanup();
    renderView("qa", "/?part=p1");
    await screen.findByRole("region", { name: "Watch" });
    expect(screen.queryByRole("button", { name: /Read now/ })).toBeNull();
  });

  it("shows no Used in section for a part no BOM carries", async () => {
    renderView("designer", "/?part=p1");
    await screen.findByRole("region", { name: "Watch" });
    expect(screen.queryByRole("region", { name: "Used in" })).toBeNull();
  });

  it("quotes the price at the quantity it applies to", async () => {
    mocked.listSupplyParts.mockResolvedValue({
      items: [partRowFixture({ unit_price: "0.1", price_quantity: 3000 })], total: 1, limit: 100,
    });
    renderView();
    const row = (await screen.findByRole("button", { name: "LM358D" })).closest("tr")!;
    expect(within(row).getByText(`at ${(3000).toLocaleString()}`)).toBeTruthy();
  });

  it("suggests the manufacturers Prism knows when watching a new part", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <PartsView user={userWith("designer")} />
      </MemoryRouter>,
    );
    fireEvent.click((await screen.findAllByRole("button", { name: "Track a part" }))[0]);
    await waitFor(() => expect(mocked.listSupplyManufacturers).toHaveBeenCalled());
    await waitFor(() => expect(document.querySelector("#watch-manufacturer-options option[value='Texas Instruments']")).not.toBeNull());
    expect(container).toBeTruthy();
  });

  it("shows the server's reason when a manufacturer is not known", async () => {
    mocked.addSupplyWatch.mockRejectedValue(new ApiHttpError(400, "Prism does not know the manufacturer \"TI\". Pick one from the list.", "unknown_manufacturer"));
    renderView();
    fireEvent.click((await screen.findAllByRole("button", { name: "Track a part" }))[0]);
    fireEvent.change(await screen.findByLabelText("Manufacturer (optional)"), { target: { value: "TI" } });
    fireEvent.change(screen.getByLabelText("Part number"), { target: { value: "TPS1" } });
    fireEvent.click(screen.getByRole("button", { name: "Watch part" }));
    expect(await screen.findByText(/does not know the manufacturer/)).toBeTruthy();
  });

  it("offers to watch a part that is not watched", async () => {
    mocked.getSupplyPart.mockResolvedValue(partDetailFixture({ watch: null }));
    mocked.addSupplyWatch.mockResolvedValue({ id: "w2", part_id: "p1", manufacturer: "T", mpn: "L", threshold: null, pinned: false, owner: "o", packaging: "any" });
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

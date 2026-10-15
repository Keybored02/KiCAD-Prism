/**
 * The supply columns on the BOM table: shown to roles that read supply data, per row, with the
 * rollup above and the actions on it.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { User, UserRole } from "@/types/auth";
import type { PrismSemanticIndex, SemanticComponent } from "@/types/prism-selection";
import type { SupplyBomLookup } from "@/types/supply";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/features/supply/supply-api", () => ({
  lookupSupplyBom: vi.fn(),
  watchSupplyBomLines: vi.fn(),
  getSupplyPart: vi.fn(),
}));

// Recharts is slow to load cold and is not what these tests are about.
vi.mock("@/features/supply/stock-chart", () => ({ default: () => <div role="img" aria-label="Stock over the last 90 days" /> }));

import * as api from "@/features/supply/supply-api";
import { lineKey } from "@/features/supply/bom-supply";
import { partDetailFixture } from "@/features/supply/supply-test-fixtures";
import { toast } from "sonner";
import { EngineeringBomTable } from "./engineering-bom-table";

const mocked = vi.mocked(api);

function component(reference: string, value: string, maker: string, mpn: string, extra: Record<string, string> = {}): SemanticComponent {
  return {
    componentUid: `cmp:${reference}`,
    reference,
    value,
    footprint: "R_0603",
    fields: { Value: value, DNP: "No", "In BOM": "Yes", Footprint: "R_0603", Manufacturer: maker, "Manufacturer Part Number": mpn, ...extra },
  };
}

const COMPONENTS = [
  component("R1", "10k", "Acme", "R-10K"),
  component("R2", "10k", "Acme", "R-10K"),
  component("C1", "100n", "Acme", "C-100N"),
  component("C2", "220n", "Other", "C-220N"),
  component("U1", "LM358", "", ""),
  component("R3", "47k", "Acme", "R-47K-A"),
  component("R4", "47k", "Acme", "R-47K-B"),
  component("R9", "1k", "Acme", "R-1K", { DNP: "Yes" }),
];

const index: PrismSemanticIndex = {
  schema: "prism.semantic_index_a0", sourceRevisionKey: "rev", components: COMPONENTS, nets: [], terminals: [],
} as unknown as PrismSemanticIndex;

const key = (maker: string, mpn: string) => lineKey({ manufacturer: maker, mpn });

function lookupFor(build: number): SupplyBomLookup {
  return {
    build_quantity: build,
    lines: {
      [key("Acme", "R-10K")]: {
        state: "tracked", part_id: "p1", manufacturer_match: "exact", need: 2 * build, watched: true, status: "ok", stock: 5000,
        lifecycle: "active", lead_time_days: 28, short: false,
        buy: { quantity: 100, unit_price: "0.05", currency: "EUR", extended: "5", covers: true, connector_name: "TME", sku: "R-10K-TME", product_url: "https://shop.example/r" },
      },
      [key("Acme", "C-100N")]: {
        state: "tracked", part_id: "p2", manufacturer_match: "exact", need: build, watched: false, status: "error", stock: 3,
        lifecycle: "active", lead_time_days: null, short: true, buy: null,
      },
      [key("Other", "C-220N")]: { state: "unknown", part_id: null, manufacturer_match: null, need: build },
      [key("Acme", "R-47K-A")]: { state: "unknown", part_id: null, manufacturer_match: null, need: build },
      [key("Acme", "R-47K-B")]: { state: "unknown", part_id: null, manufacturer_match: null, need: build },
      [key("", "")]: { state: "no_mpn", part_id: null, manufacturer_match: null, need: build },
    },
    rollup: {
      lines: 4, tracked: 2, not_tracked: 2, watched: 1, at_risk: 1, short: 1, priced: 1, lines_priced: 1, parts: 2, currency: "EUR",
      cost_build: "5.00", cost_per_board: "0.5000", can_build: 3, limited_by: key("Acme", "C-100N"), without_stock_data: 0, health: 7.5, health_status: "ok",
    },
  };
}

function renderTable(role: UserRole | null, projectId?: string, atHead = true) {
  const user: User | null = role ? { name: role, email: `${role}@example.com`, role } : null;
  render(
    <EngineeringBomTable
      semanticIndex={index}
      components={COMPONENTS}
      loading={false}
      selection={null}
      onSelection={() => {}}
      onRetry={() => {}}
      user={user}
      atHead={atHead}
      projectId={projectId}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocked.lookupSupplyBom.mockImplementation(async (_lines, build) => lookupFor(build));
  window.localStorage.clear();
});
afterEach(cleanup);

function rowOf(value: string): HTMLElement {
  const cell = screen.getAllByText(value).map((node) => node.closest("tr")).find((row): row is HTMLTableRowElement => row !== null && row.parentElement?.tagName === "TBODY");
  if (!cell) throw new Error(`no row for ${value}`);
  return cell;
}

describe("supply columns on the BOM", () => {
  it("asks only for fitted parts and shows each row's figures", async () => {
    renderTable("designer");
    await waitFor(() => expect(mocked.lookupSupplyBom).toHaveBeenCalled());
    const [lines, build] = mocked.lookupSupplyBom.mock.calls[0];
    expect(build).toBe(1);
    expect(lines.map((line) => [line.mpn, line.quantity]).sort()).toEqual(
      [["", 1], ["C-100N", 1], ["C-220N", 1], ["R-10K", 2], ["R-47K-A", 1], ["R-47K-B", 1]],
    );
    expect(lines.some((line) => line.mpn === "R-1K")).toBe(false);

    expect(await screen.findByRole("columnheader", { name: /^Supply/ })).toBeTruthy();
    const resistors = rowOf("10k");
    expect(await within(resistors).findByText("OK")).toBeTruthy();
    expect(within(resistors).getByText("5,000")).toBeTruthy();
    expect(within(resistors).getByText("4 wk")).toBeTruthy();
  });

  it("marks a shortage and a part nobody watches", async () => {
    renderTable("designer");
    const caps = await waitFor(() => {
      const row = rowOf("100n");
      expect(within(row).getByText("At risk")).toBeTruthy();
      return row;
    });
    expect(within(caps).getByText("(not watched)")).toBeTruthy();
    expect(caps.textContent).toContain("3 / 1");
  });

  it("summarises a row that holds several different parts", async () => {
    renderTable("designer");
    const row = await waitFor(() => {
      const found = rowOf("47k");
      expect(within(found).getByText("2 parts")).toBeTruthy();
      return found;
    });
    // Four supply columns, and the table's own "Mixed" for the differing part numbers.
    expect(within(row).getAllByRole("img", { name: /^Mixed/ })).toHaveLength(4);
    expect(within(row).getAllByText("Mixed")).toHaveLength(1);
  });

  it("explains a line with no figures", async () => {
    renderTable("designer");
    expect(await screen.findByText("No part number")).toBeTruthy();
  });

  it("sums up the build above the table", async () => {
    renderTable("designer");
    expect(await screen.findByText("Stock covers 1 board")).toBeTruthy();
    expect(screen.getByText("1 at risk")).toBeTruthy();
    expect(screen.getByText("2 not tracked")).toBeTruthy();
  });

  it("looks the BOM up again for a different build size", async () => {
    renderTable("admin");
    await waitFor(() => expect(mocked.lookupSupplyBom).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText("Boards to build"), { target: { value: "50" } });
    await waitFor(() => expect(mocked.lookupSupplyBom).toHaveBeenLastCalledWith(expect.anything(), 50, expect.anything()));
    expect(await screen.findByText("Can build 3 of 50, limited by C-100N")).toBeTruthy();
  });

  it("asks for spares on top of the build and looks the BOM up again", async () => {
    renderTable("admin");
    await waitFor(() => expect(mocked.lookupSupplyBom).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText("Spare parts, percent"), { target: { value: "10" } });
    await waitFor(() => expect(mocked.lookupSupplyBom).toHaveBeenLastCalledWith(expect.anything(), 1, expect.objectContaining({ attritionPercent: 10 })));
    fireEvent.change(screen.getByLabelText("Spare parts, percent"), { target: { value: "150" } });
    expect((screen.getByLabelText("Spare parts, percent") as HTMLInputElement).value).toBe("10");
  });

  it("is plain at a commit checked out from History, and looks nothing up", async () => {
    renderTable("designer", undefined, false);
    expect(screen.getByText("Supply data shows on the latest revision only.")).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: /^Supply/ })).toBeNull();
    expect(screen.queryByLabelText("Boards to build")).toBeNull();
    expect(mocked.lookupSupplyBom).not.toHaveBeenCalled();
  });

  it("is hidden from roles that cannot read supply data, and from signed-out users", async () => {
    for (const role of ["viewer", null] as const) {
      renderTable(role);
      expect(screen.queryByRole("columnheader", { name: /^Supply/ })).toBeNull();
      expect(screen.queryByLabelText("Boards to build")).toBeNull();
      cleanup();
    }
    expect(mocked.lookupSupplyBom).not.toHaveBeenCalled();
  });
});

describe("actions on the BOM", () => {
  it("offers Track this project to a reader who may track, and to nobody else", async () => {
    renderTable("qa", "prj_1");
    expect(await screen.findByRole("button", { name: /Track this project/ })).toBeTruthy();
    cleanup();
    renderTable("viewer", "prj_1");
    expect(screen.queryByRole("button", { name: /Track this project/ })).toBeNull();
  });

  it("reports a lookup that failed and retries", async () => {
    mocked.lookupSupplyBom.mockRejectedValueOnce(new Error("Backend is down")).mockImplementation(async (_lines, build) => lookupFor(build));
    renderTable("designer");
    expect(await screen.findByText("Backend is down")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("1 at risk")).toBeTruthy();
  });
});

describe("the part drawer", () => {
  async function openDetails(rowValue: string) {
    const row = await waitFor(() => {
      const found = rowOf(rowValue);
      expect(within(found).getByRole("button", { name: "Show part details" })).toBeTruthy();
      return found;
    });
    fireEvent.click(within(row).getByRole("button", { name: "Show part details" }));
    return screen.findByRole("dialog");
  }

  it("lists every part on a row that holds several, with a way to watch the unknown ones", async () => {
    mocked.watchSupplyBomLines.mockResolvedValue({ watched: 1, already_watched: 0, skipped: [] });
    renderTable("designer");
    const drawer = await openDetails("47k");
    expect(within(drawer).getByText("2 parts on this row")).toBeTruthy();
    expect(within(drawer).getByText("R-47K-A")).toBeTruthy();
    expect(within(drawer).getByText("R-47K-B")).toBeTruthy();
    expect(within(drawer).getAllByText(/does not know this part yet/)).toHaveLength(2);

    const [first] = within(drawer).getAllByRole("button", { name: /Watch this part/ });
    fireEvent.click(first);
    await waitFor(() => expect(mocked.watchSupplyBomLines).toHaveBeenCalledTimes(1));
    const sent = mocked.watchSupplyBomLines.mock.calls[0][0];
    expect(sent).toHaveLength(1);
    expect(["R-47K-A", "R-47K-B"]).toContain(sent[0].mpn);
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    await waitFor(() => expect(mocked.lookupSupplyBom).toHaveBeenCalledTimes(2));
  });

  it("says what is known about a tracked part and where to buy it", async () => {
    renderTable("designer");
    const drawer = await openDetails("10k");
    expect(within(drawer).getByText("R-10K")).toBeTruthy();
    expect(within(drawer).getByText("2 per board:", { exact: false })).toBeTruthy();
    expect(within(drawer).getByText(/5,000 in stock, 2 needed\./)).toBeTruthy();
    const link = within(drawer).getByRole("link", { name: /R-10K-TME/ });
    expect(link.getAttribute("href")).toBe("https://shop.example/r");
    expect(within(drawer).queryByRole("button", { name: /Watch this part/ })).toBeNull();
  });

  it("opens the full part sheet from a tracked part", async () => {
    mocked.getSupplyPart.mockResolvedValue(partDetailFixture());
    renderTable("designer");
    const drawer = await openDetails("10k");
    fireEvent.click(within(drawer).getByRole("button", { name: "Open part" }));
    await waitFor(() => expect(mocked.getSupplyPart).toHaveBeenCalledWith("p1", expect.anything()));
    expect(await screen.findByRole("region", { name: "Stock" })).toBeTruthy();
  });

  it("gives a reader the facts without the watch buttons", async () => {
    renderTable("qa");
    const drawer = await openDetails("47k");
    expect(within(drawer).getByText("2 parts on this row")).toBeTruthy();
    expect(within(drawer).queryByRole("button", { name: /Watch this part/ })).toBeNull();
  });

  it("explains a part with no number on its symbol", async () => {
    renderTable("designer");
    const drawer = await openDetails("LM358");
    expect(within(drawer).getByText(/cannot track it/)).toBeTruthy();
    expect(within(drawer).queryByRole("button", { name: /Watch this part/ })).toBeNull();
  });
});

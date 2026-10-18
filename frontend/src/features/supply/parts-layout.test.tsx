import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LayoutToggle } from "./layout-toggle";
import { layoutFromParam, priceAt } from "./parts-layout";
import { PartsTable } from "./parts-table";
import { partRowFixture } from "./supply-test-fixtures";

afterEach(cleanup);

const BREAKS: Array<[number, string]> = [[10, "0.50"], [100, "0.30"], [1000, "0.20"]];

describe("price at a quantity", () => {
  it("takes the break at or below it, and nothing below the smallest order", () => {
    expect(priceAt(BREAKS, 1)).toBeNull();
    expect(priceAt(BREAKS, 10)).toBe("0.50");
    expect(priceAt(BREAKS, 999)).toBe("0.30");
    expect(priceAt(BREAKS, 10000)).toBe("0.20");
  });

  it("is compact unless the address asks for detailed", () => {
    expect([layoutFromParam(null), layoutFromParam("x"), layoutFromParam("detailed")]).toEqual(["compact", "compact", "detailed"]);
  });
});

describe("the layouts", () => {
  const part = partRowFixture({
    mpn: "LM358",
    offers: [
      { connector_id: "c1", provider: "mouser", name: "Mouser", sku: "M-1", stock: 1200, moq: 10, packaging: "cut_tape", currency: "EUR", price_breaks: BREAKS, product_url: "https://www.mouser.com/ProductDetail/M-1" },
      { connector_id: "c2", provider: "lcsc", name: "LCSC", sku: "C1", stock: 0, moq: 1, packaging: "tape_reel", currency: "USD", price_breaks: [[1, "0.60"]] },
    ],
  });

  it("shows no vendor rows when compact", () => {
    render(<PartsTable items={[part]} selectedId={null} onOpen={vi.fn()} />);
    expect(screen.queryByRole("table", { name: "Vendors of LM358" })).toBeNull();
  });

  it("leaves the part's own row without stock, price and vendor swatches when detailed", () => {
    const withSwatch = partRowFixture({ mpn: "LM358", stock: 777, distributors: [{ connector_id: "c1", provider: "mouser", name: "Mouser", stock: 5 }] });
    render(<PartsTable layout="detailed" items={[withSwatch]} selectedId={null} onOpen={vi.fn()} />);
    expect(screen.queryByText("777")).toBeNull();
    expect(screen.queryByRole("button", { name: /Mouser: 5 in stock/ })).toBeNull();
    cleanup();
    render(<PartsTable items={[withSwatch]} selectedId={null} onOpen={vi.fn()} />);
    expect(screen.getByText("777")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Mouser: 5 in stock/ })).toBeTruthy();
  });

  it("shows a row for each vendor with stock, minimum order, packaging and prices when detailed", () => {
    render(<PartsTable layout="detailed" items={[part]} selectedId={null} onOpen={vi.fn()} />);
    const vendors = screen.getByRole("table", { name: "Vendors of LM358" });
    const mouser = within(vendors).getByText("Mouser").closest("tr")!;
    expect(within(mouser).getByText("1,200")).toBeTruthy();
    expect(within(mouser).getByText("Cut tape")).toBeTruthy();
    expect(within(mouser).getAllByText("–")).toHaveLength(1);
    expect(within(vendors).getByText("LCSC").closest("tr")!.textContent).toContain("Reel");
  });

  it("links each vendor to its page and drops the stock graph", () => {
    const onOpen = vi.fn();
    render(<PartsTable layout="detailed" items={[{ ...part, spark: [1, 2, 3] }]} selectedId={null} onOpen={onOpen} />);
    const link = screen.getByRole("link", { name: "Open LM358 at Mouser" });
    expect(link.getAttribute("href")).toBe("https://www.mouser.com/ProductDetail/M-1");
    expect(link.getAttribute("target")).toBe("_blank");
    fireEvent.click(link);
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Stock over the last 30 days")).toBeNull();
    expect(within(screen.getByRole("table", { name: "Vendors of LM358" })).getAllByText("–").length).toBeGreaterThan(0);
  });

  it("puts the manufacturer beside the part number", () => {
    render(<PartsTable items={[{ ...part, manufacturer: "Texas Instruments" }]} selectedId={null} onOpen={vi.fn()} />);
    const name = screen.getByRole("button", { name: "LM358" });
    expect(name.parentElement?.textContent).toContain("Texas Instruments");
  });

  it("keeps the vendor rows out of the part's click and hover, and says no listings count", () => {
    const onOpen = vi.fn();
    render(<PartsTable layout="detailed" items={[{ ...part, listings: 3 }]} selectedId={null} onOpen={onOpen} />);
    const row = within(screen.getByRole("table", { name: "Vendors of LM358" })).getByText("1,200").closest("tr")!;
    fireEvent.click(row);
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.getByRole("table", { name: "Vendors of LM358" }).closest("tr")!.className).not.toContain("hover");
    expect(screen.queryByText(/3 listings/)).toBeNull();
    expect(screen.getByRole("link", { name: "Open LM358 at Mouser" }).querySelector("svg")).toBeNull();
  });

  it("switches by two icons", () => {
    const change = vi.fn();
    render(<LayoutToggle layout="compact" onChange={change} />);
    expect(screen.getByRole("button", { name: "Compact" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /Detailed/ }));
    expect(change).toHaveBeenCalledWith("detailed");
  });
});

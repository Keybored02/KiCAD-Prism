import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CatalogSupplyCell } from "./catalog-supply-cell";

afterEach(cleanup);

describe("the catalog's Supply column", () => {
  it("shows the distributors' status, price and stock with the usable local stock", () => {
    render(<CatalogSupplyCell standing={{ status: "ok", stock: 12400, watched: true, unit_price: "0.5", currency: "EUR", local_available: 300 }} />);
    expect(screen.getByText("Dist 12,400 · Local 300")).toBeTruthy();
    expect(screen.getByTitle("Unit price at the distributors").textContent).toContain("0.50");
  });

  it("says a component is not tracked when only the local inventory knows it", () => {
    render(<CatalogSupplyCell standing={{ status: "unknown", stock: null, watched: false, local_available: 40 }} />);
    expect(screen.getByText("Not tracked")).toBeTruthy();
    expect(screen.getByText("Local 40")).toBeTruthy();
  });

  it("shows a dash for a component nobody holds or tracks", () => {
    render(<CatalogSupplyCell standing={undefined} />);
    expect(screen.getByText("-")).toBeTruthy();
  });
});

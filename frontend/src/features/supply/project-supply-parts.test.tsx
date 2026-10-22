import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import type { ProjectSupplyPart } from "@/types/supply";
import { ProjectSupplyParts } from "./project-supply-parts";

afterEach(cleanup);

const part = (key: string, mpn: string): ProjectSupplyPart => ({
  key, manufacturer: "Acme", mpn, quantity: 1, references: "R1", part_id: `p-${key}`, state: "tracked", status: "ok", stock: 100, lifecycle: "active",
  lead_time_days: null, short: false, unit_price: "0.1", tier: 1, waiting: false, notes: 0,
} as ProjectSupplyPart);

describe("the project's parts table", () => {
  it("marks the lines likely to be short within 8 weeks, from the forecast, and no others", () => {
    render(<MemoryRouter><ProjectSupplyParts parts={[part("a", "RISKY-1"), part("b", "SAFE-1"), part("c", "NOFORECAST-1")]} shortAt8Weeks={{ a: 0.8, b: 0.1 }} /></MemoryRouter>);
    expect(screen.getAllByText("Out within 8 weeks")).toHaveLength(1);
    expect(screen.getByText("Out within 8 weeks").getAttribute("title")).toContain("80%");
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { ComponentCoverage } from "@/types/supply";
import { CoverageSummary } from "./coverage-note";

afterEach(cleanup);

const coverage = (overrides: Partial<ComponentCoverage> = {}): ComponentCoverage => ({
  component_id: "c1", stock: 140, unread: 1, component: "Acme PRIM-1",
  parts: [
    { part_id: "p1", manufacturer: "Acme", mpn: "PRIM-1", role: "primary", stock: 100 },
    { part_id: "p2", manufacturer: "Globex", mpn: "ALT-1", role: "alternate", stock: 40 },
    { part_id: "p3", manufacturer: "Globex", mpn: "ALT-2", role: "alternate", stock: null },
  ],
  ...overrides,
});

describe("the coverage of a component", () => {
  it("adds the parts up, says who gave what, and that it is not the whole", () => {
    render(<CoverageSummary coverage={coverage()} />);
    expect(screen.getByText(/Acme PRIM-1: Together these hold 140 \(100 PRIM-1, 40 ALT-1\)\. 1 part has not been read/)).toBeTruthy();
  });

  it("says nothing for a component with one part", () => {
    const { container } = render(<CoverageSummary coverage={coverage({ parts: [coverage().parts[0]] })} />);
    expect(container.textContent).toBe("");
  });
});

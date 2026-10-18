import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { SupplyOutlook } from "@/types/supply";
import { OutlookSection } from "./outlook-section";

afterEach(cleanup);

describe("the outlook section", () => {
  it("shows the band and every signal with its source", () => {
    const outlook: SupplyOutlook = {
      band: "under_2_years",
      label: "Under 2 years",
      method: "rule-based",
      signals: [{ text: "A last time buy has been announced.", source: "distributor lifecycle", weight: "hard" }],
    };
    render(<OutlookSection outlook={outlook} />);
    expect(screen.getByText("Under 2 years")).toBeTruthy();
    expect(screen.getByRole("img", { name: /Rule-based/ })).toBeTruthy();
    expect(screen.getByText(/A last time buy has been announced\./)).toBeTruthy();
    expect(screen.getByText("(distributor lifecycle)")).toBeTruthy();
  });

  it("does not promise a long life when nothing was found", () => {
    render(<OutlookSection outlook={{ band: "no_signs", label: "No signs of an end of life", method: "rule-based", signals: [] }} />);
    expect(screen.getByRole("img", { name: /not a promise of a long life/ })).toBeTruthy();
    expect(screen.queryByText(/not a promise of a long life/)).toBeNull();
    expect(screen.getByText("No signs of an end of life").className).toContain("success");
  });

  it("says when nothing has been read", () => {
    render(<OutlookSection outlook={{ band: "unknown", label: "Not enough to say", method: "rule-based", signals: [] }} />);
    expect(screen.getByText("Nothing has been read for this part yet.")).toBeTruthy();
  });
});

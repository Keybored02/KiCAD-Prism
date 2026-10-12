import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { SupplyParameter } from "@/types/supply";
import { parameterRows, siText } from "./parameters-model";
import { ParametersSection } from "./parameters-section";

afterEach(cleanup);

const resistance: SupplyParameter = { name: "Resistance", raw: "10 kOhms", key: "resistance", unit: "ohm", value: "10000", sources: ["lcsc", "mouser"] };

describe("the parameters section", () => {
  it("shows the distributor's text, the SI reading when it adds something, and who gave it", () => {
    render(<ParametersSection parameters={[resistance, { name: "Mounting Type", raw: "SMD", key: null, unit: "", value: null, sources: ["mouser"] }]} />);
    expect(screen.getByText("10 kOhms")).toBeTruthy();
    expect(screen.getByText("10 kΩ")).toBeTruthy();
    expect(screen.getByText("lcsc, mouser")).toBeTruthy();
    expect(screen.getByText("Mounting Type")).toBeTruthy();
  });

  it("shows nothing without parameters and folds a long list", () => {
    const { container, rerender } = render(<ParametersSection parameters={[]} />);
    expect(container.textContent).toBe("");
    const many = Array.from({ length: 12 }, (_, index): SupplyParameter => ({ name: `Attribute ${index}`, raw: `v${index}`, key: null, unit: "", value: null, sources: ["mouser"] }));
    rerender(<ParametersSection parameters={many} />);
    expect(screen.queryByText("v11")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show all 12" }));
    expect(screen.getByText("v11")).toBeTruthy();
  });
});

describe("parameter wording", () => {
  it("writes SI values with the prefix a person would", () => {
    expect([siText("10000", "ohm"), siText("0.0000047", "farad"), siText("0.1", "watt"), siText("50", "volt"), siText("1", "percent"), siText("5", "")]).toEqual(["10 kΩ", "4.7 µF", "100 mW", "50 V", "1 %", ""]);
  });

  it("does not repeat a reading that says the same as the distributor", () => {
    const [row] = parameterRows([{ ...resistance, raw: "10kΩ" }]);
    expect(row.si).toBe("");
    expect(parameterRows([resistance])[0].label).toBe("Resistance");
  });
});

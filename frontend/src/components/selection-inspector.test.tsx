import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EcadNetStatistics } from "@/types/ecad-viewer";
import type { PrismSelection } from "@/types/prism-selection";
import { SelectionInspector } from "./selection-inspector";

const STATS: EcadNetStatistics = {
  net: "SIG",
  netCode: 1,
  routedLength: 21.28318,
  layers: ["F.Cu", "In1.Cu", "B.Cu"],
  trackCount: 3,
  viaCount: 2,
};

const NET: PrismSelection = {
  kind: "net",
  sourceContext: "PCB",
  netName: "SIG",
  netCode: 1,
  anchor: { context: "PCB", itemType: "track", layer: "F.Cu" },
};

const TERMINAL: PrismSelection = {
  kind: "terminal",
  sourceContext: "PCB",
  reference: "R1",
  pin: "1",
  netName: "SIG",
};

const COMPONENT: PrismSelection = {
  kind: "component",
  sourceContext: "PCB",
  reference: "R1",
};

function renderInspector(selection: PrismSelection, props: Partial<Parameters<typeof SelectionInspector>[0]> = {}) {
  return render(
    <SelectionInspector
      open
      selection={selection}
      semanticIndex={null}
      onOpenChange={() => {}}
      onClear={() => {}}
      embedded
      {...props}
    />,
  );
}

describe("SelectionInspector routing section", () => {
  it("shows routed length, stack-ordered layers with swatches, and counts for a PCB net", () => {
    const { getByTestId } = renderInspector(NET, {
      netStatistics: STATS,
      viewContext: "PCB",
      layerColors: { "F.Cu": "#c83434", "B.Cu": "#4d7fc4" },
    });
    const routing = within(getByTestId("net-routing"));
    expect(routing.getByText("Routed length").nextElementSibling).toHaveTextContent("21.2832 mm");
    const layers = routing.getByText("Layers used").nextElementSibling!;
    expect(layers.textContent).toBe("F.CuIn1.CuB.Cu");
    // Only layers with a known color get a swatch.
    expect(layers.querySelectorAll("[style]")).toHaveLength(2);
    expect(routing.getByText("Tracks").nextElementSibling).toHaveTextContent("3");
    expect(routing.getByText("Vias").nextElementSibling).toHaveTextContent("2");
  });

  it("shows the terminal's net routing and keeps a zero via count", () => {
    const { getByTestId } = renderInspector(TERMINAL, {
      netStatistics: { ...STATS, viaCount: 0 },
      viewContext: "PCB",
    });
    const routing = within(getByTestId("net-routing"));
    expect(routing.getByText("Vias").nextElementSibling).toHaveTextContent("0");
  });

  it("omits the layers row when the net has no tracks", () => {
    const { getByTestId } = renderInspector(NET, {
      netStatistics: { ...STATS, routedLength: 0, layers: [], trackCount: 0 },
      viewContext: "PCB",
    });
    const routing = within(getByTestId("net-routing"));
    expect(routing.queryByText("Layers used")).toBeNull();
    expect(routing.getByText("Routed length").nextElementSibling).toHaveTextContent("0.0000 mm");
  });

  it("is hidden outside the PCB view, without statistics, and for components", () => {
    expect(renderInspector(NET, { netStatistics: STATS, viewContext: "SCH" }).queryByTestId("net-routing")).toBeNull();
    expect(renderInspector(NET, { netStatistics: null, viewContext: "PCB" }).queryByTestId("net-routing")).toBeNull();
    expect(renderInspector(COMPONENT, { netStatistics: STATS, viewContext: "PCB" }).queryByTestId("net-routing")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import type { DraftWire } from "./harness-editor";
import { isGrid, parseGrid, pasteGrid, setSelected } from "./wire-table-edits";

const wire = (key: string): DraftWire => ({ key, from: { end: "e1", pin: key }, to: { end: "e2", pin: key }, signal: "", gaugeAwg: null, colour: null });

describe("wire table edits (SB2-123)", () => {
  it("reads a spreadsheet block and tells it from one value", () => {
    expect(parseGrid("A\t24\tRD\r\nB\t26\tBK\r\n")).toEqual([["A", "24", "RD"], ["B", "26", "BK"]]);
    expect(isGrid("VCC\n")).toBe(false);
    expect(isGrid("24\n26")).toBe(true);
  });

  it("fills down and right from the cell, dropping what does not fit", () => {
    const wires = [wire("1"), wire("2"), wire("3")];
    const { wires: out, dropped } = pasteGrid(wires, 1, "gaugeAwg", parseGrid("24\tRD\textra\nx\tBK\n22\tWH"));
    expect(out.map((w) => [w.gaugeAwg, w.colour])).toEqual([[null, null], [24, "RD"], [null, "BK"]]);
    expect(dropped).toBe(1);
    expect(out[0]).toBe(wires[0]);
  });

  it("sets gauge and colour on the ticked wires only, leaving blank fields alone", () => {
    const wires = [{ ...wire("1"), colour: "GN" }, wire("2")];
    const out = setSelected(wires, new Set(["1"]), { gauge: "28", colour: " " });
    expect(out.map((w) => [w.gaugeAwg, w.colour])).toEqual([[28, "GN"], [null, null]]);
  });
});

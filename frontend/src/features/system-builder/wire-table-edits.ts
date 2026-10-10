import type { DraftWire } from "./harness-editor";

/** SB2-123: the wire table's text columns, left to right, as a pasted block fills them. */
export const WIRE_COLUMNS = ["signal", "gaugeAwg", "colour"] as const;
export type WireColumn = (typeof WIRE_COLUMNS)[number];

/** A spreadsheet block (tab-separated, one row per line); a single trailing newline is dropped. */
export function parseGrid(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
  return lines.map((line) => line.split("\t"));
}

/** Whether pasted text is a block rather than one cell's value. */
export function isGrid(text: string): boolean {
  return /[\t\n]/.test(text.replace(/\r?\n$/, ""));
}

function cell(column: WireColumn, value: string): Partial<DraftWire> {
  const text = value.trim();
  if (column === "gaugeAwg") {
    const gauge = Number.parseInt(text, 10);
    return { gaugeAwg: text && Number.isFinite(gauge) ? gauge : null };
  }
  return { [column]: text };
}

/**
 * Fill the wires from `start` down and the columns from `column` right with a pasted block. Rows past the
 * last wire and columns past Colour are dropped; `dropped` counts the rows that did not fit.
 */
export function pasteGrid(wires: DraftWire[], start: number, column: WireColumn, grid: string[][]):
  { wires: DraftWire[]; dropped: number } {
  const first = WIRE_COLUMNS.indexOf(column);
  const out = wires.map((wire, index) => {
    const row = grid[index - start];
    if (index < start || !row) return wire;
    let next = wire;
    row.forEach((value, offset) => {
      const target = WIRE_COLUMNS[first + offset];
      if (target) next = { ...next, ...cell(target, value) };
    });
    return next;
  });
  return { wires: out, dropped: Math.max(0, start + grid.length - wires.length) };
}

/** Set the same gauge and/or colour on the chosen wires; a blank field leaves that column alone. */
export function setSelected(wires: DraftWire[], keys: ReadonlySet<string>, fields: { gauge: string; colour: string }): DraftWire[] {
  const patch: Partial<DraftWire> = {
    ...(fields.gauge.trim() ? cell("gaugeAwg", fields.gauge) : {}),
    ...(fields.colour.trim() ? { colour: fields.colour.trim() } : {}),
  };
  return wires.map((wire) => (keys.has(wire.key) ? { ...wire, ...patch } : wire));
}

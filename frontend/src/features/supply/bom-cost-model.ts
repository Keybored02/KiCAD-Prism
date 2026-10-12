import type { SemanticComponent } from "@/types/prism-selection";
import type { SupplyBomRollup } from "@/types/supply";
import { buildLines, type BomLineDetail } from "./bom-supply";

/** One row of a BOM comparison, as far as cost cares: the fields of a revision's component, or nothing if it is absent there. */
export interface ComparedRow {
  ref: string;
  old?: Record<string, string>;
  new?: Record<string, string>;
}

const YES = new Set(["yes", "true", "1"]);

function fitted(fields: Record<string, string>): boolean {
  const lower = (name: string) => String(fields[name] ?? "").trim().toLowerCase();
  return lower("In BOM") !== "no" && !YES.has(lower("DNP")) && !YES.has(lower("kicad_dnp"));
}

/** The distinct fitted parts of one side of a comparison, with how many go on a board. */
export function sideLines(rows: readonly ComparedRow[], side: "old" | "new"): BomLineDetail[] {
  const components = rows.flatMap((row) => {
    const fields = row[side];
    return fields && fitted(fields) ? [{ reference: row.ref, fields } as unknown as SemanticComponent] : [];
  });
  return buildLines(components);
}

export interface CostSide {
  cost: string;
  currency: string;
  linesPriced: number;
  lines: number;
}

export interface CostDelta {
  base: CostSide | null;
  compare: CostSide | null;
  /** Compare minus base per board; null unless both sides have a cost in the same currency. */
  change: number | null;
  currency: string | null;
}

function side(rollup: SupplyBomRollup): CostSide | null {
  return rollup.cost_per_board !== null && rollup.currency
    ? { cost: rollup.cost_per_board, currency: rollup.currency, linesPriced: rollup.lines_priced, lines: rollup.lines }
    : null;
}

export function costDelta(base: SupplyBomRollup, compare: SupplyBomRollup): CostDelta {
  const [a, b] = [side(base), side(compare)];
  const comparable = a !== null && b !== null && a.currency === b.currency;
  return {
    base: a,
    compare: b,
    change: comparable ? Math.round((Number(b.cost) - Number(a.cost)) * 10_000) / 10_000 : null,
    currency: comparable ? a.currency : null,
  };
}

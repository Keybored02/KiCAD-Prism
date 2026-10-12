import { useCallback, useMemo } from "react";

import { costDelta, sideLines, type ComparedRow, type CostSide } from "./bom-cost-model";
import { lineInput } from "./bom-supply";
import { lookupSupplyBom } from "./supply-api";
import { formatPrice } from "./supply-format";
import { useLoaded } from "./use-loaded";

function describe(label: string, side: CostSide | null): string {
  if (side === null) return `${label}: no price`;
  const covers = side.linesPriced < side.lines ? `, covers ${side.linesPriced} of ${side.lines} lines` : "";
  return `${label}: ${formatPrice(side.cost, side.currency)}${covers}`;
}

/**
 * What the change does to the cost of one board, at today's prices on both sides. It is a note about the
 * parts that changed, not evidence about either revision. Nothing shows for someone who cannot read supply data.
 * ``complete`` is whether the rows hold the whole BOM. A comparison that leaves out unchanged parts gives the
 * change only: the totals of what it has would be taken for the cost of a board.
 */
export function BomCostDelta({ rows, complete }: { rows: readonly ComparedRow[]; complete: boolean }) {
  const base = useMemo(() => sideLines(rows, "old"), [rows]);
  const compare = useMemo(() => sideLines(rows, "new"), [rows]);
  const key = useMemo(
    () => (base.length + compare.length === 0 ? null : [base, compare].map((lines) => lines.map((l) => `${l.key}x${l.quantity}`).join(";")).join("||")),
    [base, compare],
  );
  const fetcher = useCallback(async (signal: AbortSignal) => {
    const input = (lines: typeof base) => lines.map(lineInput);
    const [before, after] = await Promise.all([
      lookupSupplyBom(input(base), 1, { signal }),
      lookupSupplyBom(input(compare), 1, { signal }),
    ]);
    return costDelta(before.rollup, after.rollup);
  }, [base, compare]);
  const delta = useLoaded(key, fetcher, "Could not price the revisions");

  if (delta.status !== "ready" || !delta.data) return null;
  const { base: from, compare: to, change, currency } = delta.data;
  if (from === null && to === null) return null;
  return (
    <p className="border-b px-3 py-1.5 text-xs text-muted-foreground" aria-label="Cost change">
      {change !== null && currency ? (
        <span className={change > 0 ? "font-medium text-warning" : change < 0 ? "font-medium text-success" : "font-medium"}>
          {change === 0 ? "No change in cost per board" : `${change > 0 ? "+" : "-"}${formatPrice(String(Math.abs(change)), currency)} per board`}
        </span>
      ) : (
        <span className="font-medium">Cost per board cannot be compared</span>
      )}{" "}
      at today&apos;s prices.
      {complete ? ` ${describe("Base", from)}. ${describe("Compare", to)}.` : " Counts only the parts that differ."}
    </p>
  );
}

import type { SupplyPlanRow } from "@/types/supply";

/** One sentence on how a part stands against its demand. */
export function planSentence(row: SupplyPlanRow): string {
  if (!row.stock_known && row.own_stock === null) return "Distributor stock has not been read yet.";
  if (!row.short) return "Covered.";
  if (row.first_short_on) return `Runs short on ${row.first_short_on} by ${row.short_by.toLocaleString()}.`;
  return `Short by ${row.total_short_by.toLocaleString()} once demand with no date is counted.`;
}

export function heldText(row: SupplyPlanRow): string {
  const parts = [`${(row.distributor_stock ?? 0).toLocaleString()} at distributors`];
  if (row.own_stock !== null) parts.push(`${row.own_stock.toLocaleString()} of ours`);
  if (row.incoming > 0) parts.push(`${row.incoming.toLocaleString()} coming in`);
  return parts.join(", ");
}

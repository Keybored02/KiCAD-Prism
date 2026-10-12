import type { SupplyDemandSummary } from "@/types/supply";

/** A whole number other than zero, or undefined when the text is not one. */
export function parseQuantity(text: string): number | undefined {
  const value = Number(text.trim());
  return text.trim() !== "" && Number.isInteger(value) && value !== 0 && Math.abs(value) <= 100_000_000 ? value : undefined;
}

/** One sentence: what is open, what our stock covers, and what distributors must still cover. */
export function demandSentence(summary: SupplyDemandSummary): string {
  if (summary.open === 0) return "Nothing is asked of this part.";
  const own = summary.own_stock === null ? "our stock is unknown" : `we hold ${summary.own_stock.toLocaleString()}`;
  const next = summary.next_need_by ? ` Next date: ${summary.next_need_by}.` : "";
  if (summary.open < 0) return `${Math.abs(summary.open).toLocaleString()} more is coming in than is asked for.${next}`;
  return `${summary.open.toLocaleString()} needed, ${own}, ${summary.net.toLocaleString()} left for distributors to cover.${next}`;
}

import type { PanelSupplySummary } from "@/panel/lib/panel-api";

const LIFECYCLE: Record<PanelSupplySummary["lifecycle"], string> = {
  active: "Active",
  nrnd: "Not recommended for new designs",
  last_time_buy: "Last time buy",
  obsolete: "Obsolete",
  unknown: "",
};

/** What a refresh did, in a sentence for the log. */
export function refreshText(result: { read: number; connectors: number; problems: Array<{ reason: string }> }): string {
  if (result.connectors === 0) return "No distributor lists this part yet.";
  const read = result.read === 1 ? "Read 1 listing." : `Read ${result.read} listings.`;
  return [read, ...result.problems.map((problem) => problem.reason)].join(" ");
}

/** 38200 becomes "38.2k". Exact counts below a thousand. */
export function compactCount(value: number): string {
  if (value < 1000) return String(value);
  const thousands = value / 1000;
  return `${thousands >= 100 ? Math.round(thousands) : Math.round(thousands * 10) / 10}k`;
}

export function price(unit: string | null, currency: string): string {
  if (unit === null || !currency) return "";
  const value = Number(unit);
  if (!Number.isFinite(value)) return "";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: value < 1 ? 4 : 2 }).format(value);
  } catch {
    return `${unit} ${currency}`;
  }
}

/** "38.2k at 3 distributors, Active, from 0.30 EUR at 100". */
export function summaryText(summary: PanelSupplySummary): string {
  if (summary.stock === null) return "Not read from distributors yet";
  const parts = [
    `${compactCount(summary.stock)} at ${summary.distributors} ${summary.distributors === 1 ? "distributor" : "distributors"}`,
  ];
  if (LIFECYCLE[summary.lifecycle]) parts.push(LIFECYCLE[summary.lifecycle]);
  const from = price(summary.unit_price, summary.currency);
  if (from) parts.push(`from ${from} at ${summary.price_quantity}`);
  return parts.join(", ");
}

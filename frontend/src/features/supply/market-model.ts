import type { SupplyMarketMetric } from "@/types/supply";

export const MARKET_COLUMNS = [
  { key: "out_of_stock", label: "Out of stock", kind: "share" },
  { key: "lifecycle_risk", label: "Lifecycle risk", kind: "share" },
  { key: "dropped", label: "Dropped by distributors", kind: "share" },
  { key: "median_lead_time_days", label: "Median lead time", kind: "days" },
] as const;

export type MarketColumn = (typeof MARKET_COLUMNS)[number];

/** A figure as a person reads it: 0.333 as "33%", 56 as "56 days". */
export function marketFigure(column: MarketColumn, metric: SupplyMarketMetric | undefined): string {
  if (!metric) return "";
  return column.kind === "share" ? `${Math.round(metric.value * 100)}%` : `${Math.round(metric.value)} days`;
}

/** How far a figure moved since the earlier snapshot, or an empty string when there is nothing to compare. */
export function marketChange(column: MarketColumn, metric: SupplyMarketMetric | undefined): string {
  if (!metric || metric.before === null) return "";
  const delta = column.kind === "share" ? Math.round((metric.value - metric.before) * 100) : Math.round(metric.value - metric.before);
  if (delta === 0) return "no change";
  const unit = column.kind === "share" ? " points" : " days";
  return `${delta > 0 ? "up" : "down"} ${Math.abs(delta)}${unit}`;
}

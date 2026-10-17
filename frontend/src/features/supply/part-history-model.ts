import type { PartHistory } from "@/types/supply";
import { vendorColor } from "./vendor-colors";

export type HistoryKind = "stock" | "price";

export interface HistoryKey {
  /** The row key of the line. */
  key: string;
  /** The row key of its dashed continuation, when the distributor has not been read for longer than the part's rate allows. */
  dashed: string | null;
  name: string;
  color: string;
  /** Whether it is the part's total, drawn thin and grey. */
  total: boolean;
}

export interface HistoryRows {
  rows: Array<Record<string, number | string | null>>;
  keys: HistoryKey[];
}

const FALLBACK = ["#6b7280", "#a855f7", "#14b8a6", "#eab308"];
export const TOTAL_KEY = "total";

/** The days a timeframe choice asks for. `null` is everything recorded. */
export const TIMEFRAMES: ReadonlyArray<{ id: string; label: string; days: number }> = [
  { id: "1m", label: "1 month", days: 30 },
  { id: "3m", label: "3 months", days: 90 },
  { id: "6m", label: "6 months", days: 180 },
  { id: "1y", label: "1 year", days: 365 },
  { id: "all", label: "All", days: 3650 },
];

/** One row per day with a value for each distributor, ready for a line chart. `hidden` are connector ids switched off in the legend. */
export function historyRows(history: PartHistory, kind: HistoryKind, hidden: ReadonlySet<string>): HistoryRows {
  const days = new Set<string>();
  const keys: HistoryKey[] = [];
  const values = new Map<string, Map<string, number>>();
  history.connectors.forEach((line, index) => {
    if (hidden.has(line.connector_id)) return;
    const points = new Map<string, number>((kind === "stock" ? line.stock : line.price).map(([day, value]) => [day, value]));
    if (points.size === 0) return;
    values.set(line.connector_id, points);
    points.forEach((_, day) => days.add(day));
    keys.push({
      key: line.connector_id, dashed: line.stale ? `${line.connector_id}~` : null, name: line.name,
      color: vendorColor(line.provider) ?? FALLBACK[index % FALLBACK.length], total: false,
    });
  });
  if (kind === "stock" && !hidden.has(TOTAL_KEY) && history.total.length > 0) {
    values.set(TOTAL_KEY, new Map(history.total.map(([day, value]) => [day, value])));
    history.total.forEach(([day]) => days.add(day));
    keys.push({ key: TOTAL_KEY, dashed: null, name: "Counted in total", color: "#9ca3af", total: true });
  }
  const ordered = [...days].sort();
  const last = ordered[ordered.length - 1] ?? "";
  const rows = ordered.map((day) => {
    const row: Record<string, number | string | null> = { day };
    for (const item of keys) row[item.key] = values.get(item.key)?.get(day) ?? null;
    return row;
  });
  // A stale line goes on, dashed, from its last value to the end of the chart.
  for (const item of keys) {
    if (!item.dashed) continue;
    const points = values.get(item.key);
    if (!points || points.size === 0) continue;
    const lastDay = [...points.keys()].sort().pop() as string;
    const lastValue = points.get(lastDay) as number;
    for (const row of rows) {
      const day = String(row.day);
      row[item.dashed] = day >= lastDay && day <= last ? lastValue : null;
    }
  }
  return { rows, keys };
}

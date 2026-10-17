import type { PartForecast, PartHistory } from "@/types/supply";
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

/** The forecast keys of a chart row: the most likely value and its band (low, high). */
export const FORECAST_KEY = "forecast";
export const BAND_KEY = "band";

export interface ForecastOverlay {
  /** The day the real lines end and the forecast begins. */
  from: string;
  /** The model has not earned a place: drawn as a grey dashed outline and labelled. */
  grey: boolean;
}

function put(rows: HistoryRows["rows"], day: string, median: number, low: number, high: number): void {
  const found = rows.find((row) => row.day === day);
  if (found) {
    found[FORECAST_KEY] = median;
    found[BAND_KEY] = [low, high] as unknown as number;
    return;
  }
  rows.push({ day, [FORECAST_KEY]: median, [BAND_KEY]: [low, high] as unknown as number });
}

/**
 * Rows continued into the future with a forecast: stock from its simulated path (the total line), price from the ranges at 30 and 90 days.
 * Returns the overlay to draw, or null when there is nothing to add (no forecast, the total switched off, no readings).
 */
export function withForecast(
  history: PartHistory, kind: HistoryKind, base: HistoryRows, forecast: PartForecast | null | undefined, hidden: ReadonlySet<string>,
): { rows: HistoryRows["rows"]; overlay: ForecastOverlay | null } {
  const rows = base.rows.map((row) => ({ ...row }));
  if (!forecast?.available) return { rows, overlay: null };
  if (kind === "stock") {
    if (hidden.has(TOTAL_KEY) || history.total.length === 0 || !forecast.path?.length) return { rows, overlay: null };
    const [from, value] = history.total[history.total.length - 1];
    put(rows, from, value, value, value);
    for (const point of forecast.path) if (point.day > from) put(rows, point.day, point.median, point.low, point.high);
    rows.sort((a, b) => String(a.day).localeCompare(String(b.day)));
    return { rows, overlay: { from, grey: forecast.buy_state?.["4w"]?.state !== "shown" } };
  }
  const price = forecast.price;
  const last = history.connectors.flatMap((line) => line.price.map(([day]) => day)).sort().pop();
  if (!price || !last) return { rows, overlay: null };
  put(rows, last, price.now, price.now, price.now);
  put(rows, price.h30.date, price.h30.median, price.h30.low, price.h30.high);
  put(rows, price.h90.date, price.h90.median, price.h90.low, price.h90.high);
  rows.sort((a, b) => String(a.day).localeCompare(String(b.day)));
  return { rows, overlay: { from: last, grey: price.h90.state.state !== "shown" } };
}

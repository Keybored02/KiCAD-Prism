import type { SupplyLifecycle, SupplyStatus, SupplyTier } from "@/types/supply";

export const STATUS_LABEL: Record<SupplyStatus, string> = {
  ok: "OK",
  warning: "Needs attention",
  error: "At risk",
  fatal: "Critical",
  unknown: "No data",
};

export const LIFECYCLE_LABEL: Record<SupplyLifecycle, string> = {
  active: "Active",
  nrnd: "Not recommended for new designs",
  last_time_buy: "Last time buy",
  obsolete: "Obsolete",
  unknown: "Unknown",
};

const TIER_LABEL: Record<SupplyTier, string> = {
  hot: "Every 1 to 2 hours",
  warm: "Every 6 hours",
  normal: "Daily",
  cold: "Weekly",
};

export function tierLabel(tier: SupplyTier | null): string {
  return tier ? TIER_LABEL[tier] : "Not polled yet";
}

const MATCH_LABEL: Record<string, string> = {
  exact: "Exact",
  manual: "Confirmed",
  manufacturer_unresolved: "Spelling not mapped",
  near: "Near match",
  rejected: "Rejected",
  gone: "No longer listed",
};

export function matchLabel(state: string): string {
  return MATCH_LABEL[state] ?? state;
}

export function packagingLabel(value: string): string {
  return value === "unknown" ? "" : value.replace(/_/g, " ");
}

/** A stock figure, or a dash when nothing has been read. */
export function formatStock(stock: number | null): string {
  return stock === null ? "None yet" : stock.toLocaleString();
}

/** `0.52` and `EUR` as a price. Falls back to plain text for a currency the browser does not know. */
export function formatPrice(price: string | null, currency: string): string {
  if (price === null || price === "") return "";
  const amount = Number(price);
  if (!currency || Number.isNaN(amount)) return price;
  try {
    return amount.toLocaleString(undefined, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 4 });
  } catch {
    return `${currency} ${price}`;
  }
}

/** "5 min ago", "3 h ago", "2 d ago". Empty for no time. */
export function formatAgo(iso: string | null, now: number = Date.now()): string {
  if (!iso) return "";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.round((now - then) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/** Points for a polyline that fits `values` in the box, with a little room at the edges. */
export function sparklinePoints(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const pad = 2;
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = values.length > 1 ? pad + index * step : width / 2;
      // A flat series sits in the middle rather than on an edge.
      const y = span === 0 ? height / 2 : pad + (1 - (value - low) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/** Parse the threshold box: empty clears, digits set, anything else is not valid. */
export function parseThreshold(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;
}

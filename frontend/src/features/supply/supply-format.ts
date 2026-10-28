import type { SupplyLifecycle, SupplyProblem, SupplyStatus, SupplyTier } from "@/types/supply";

export const STATUS_LABEL: Record<SupplyStatus, string> = {
  ok: "OK",
  warning: "Needs attention",
  error: "At risk",
  fatal: "Critical",
  unknown: "No data",
};

/** The fill of a status dot or bar: critical red, at risk orange, needs attention yellow. */
export const STATUS_FILL: Record<SupplyStatus, string> = {
  ok: "bg-success",
  warning: "bg-yellow-400",
  error: "bg-orange-500",
  fatal: "bg-destructive",
  unknown: "bg-muted-foreground/40",
};

export const LIFECYCLE_LABEL: Record<SupplyLifecycle, string> = {
  active: "Active",
  nrnd: "Not recommended for new designs",
  last_time_buy: "Last time buy",
  obsolete: "Obsolete",
  unknown: "Unknown",
};

const TIER_LABEL: Record<SupplyTier, string> = {
  daily: "Read daily",
  weekly: "Read weekly",
  monthly: "Read monthly",
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

const PACKAGING_NAME: Record<string, string> = {
  cut_tape: "Cut tape",
  custom_reel: "Custom reel",
  tape_reel: "Reel",
  tray: "Tray",
  tube: "Tube",
  bulk: "Bulk",
  several: "Several packagings",
  other: "Other",
};

/** The words for a packaging ("Reel of 3,000" when the size is known). Empty when it is not known. */
export function packagingName(value: string, reelSize: number | null = null): string {
  const name = PACKAGING_NAME[value];
  if (!name) return "";
  return value === "tape_reel" && reelSize ? `Reel of ${reelSize.toLocaleString()}` : name;
}

/** A stock figure, or a dash when nothing has been read. */
export function formatStock(stock: number | null): string {
  return stock === null ? "None yet" : stock.toLocaleString();
}

/** Shown under a part that has nothing counted, when something is wrong rather than merely unread. */
export const PROBLEM_LABEL: Record<SupplyProblem, string> = {
  not_found: "No distributor carries this part number",
  gone: "Every listing for this part has disappeared",
};

/** Rupees are written the Indian way, ₹12,82,650.00, wherever the reader is; every other currency in the reader's own locale. */
function localeOf(currency: string): string | undefined {
  return currency.toUpperCase() === "INR" ? "en-IN" : undefined;
}

/** An axis tick: a price to two decimals below a thousand, else short (€15K, ₹1.5L, ₹1.2Cr), so it fits beside a chart. */
export function formatAxisPrice(value: number, currency: string): string {
  if (Math.abs(value) < 1000) return formatPrice(String(value), currency, 2);
  try {
    return new Intl.NumberFormat(localeOf(currency), { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(value);
  } catch {
    return formatPrice(String(value), currency, 0);
  }
}

/** "INR · ₹": a currency's code with its symbol, for choosing one. */
export function currencyLabel(currency: string): string {
  try {
    const symbol = new Intl.NumberFormat(localeOf(currency) ?? "en", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
      .formatToParts(0).find((part) => part.type === "currency")?.value;
    return symbol && symbol !== currency ? `${currency} · ${symbol}` : currency;
  } catch {
    return currency;
  }
}

/**
 * `0.52` and `EUR` as a price, to at most `digits` decimals (a unit price needs four, a total two). From 100 up two decimals
 * are enough: ₹393.28, not ₹393.2835. Falls back to plain text for a currency the browser does not know.
 */
export function formatPrice(price: string | null, currency: string, digits = 4): string {
  if (price === null || price === "") return "";
  const amount = Number(price);
  if (!currency || Number.isNaN(amount)) return price;
  const places = Math.abs(amount) >= 100 ? 2 : Math.max(2, digits);
  try {
    return amount.toLocaleString(localeOf(currency), { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: places });
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

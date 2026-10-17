import type { SupplyListing, SupplyPartDetail } from "@/types/supply";

import { leadText, daysSince } from "./price-text";
import { PriceQuantity, TryQuantity } from "./price-quantity";
import { formatPrice } from "./supply-format";

interface PriceTrendProps {
  price: SupplyPartDetail["price"];
  partId?: string;
  listings?: SupplyListing[];
  canEdit?: boolean;
  onChanged?: () => Promise<void> | void;
}

/** What the list price means when nothing can be bought now. */
function kindLine(headline: NonNullable<SupplyPartDetail["price"]["headline"]>, now: number): string | null {
  switch (headline.price_kind) {
    case "backorder":
      return `Nothing is in stock. This is the cheapest price with a lead time${headline.price_lead_days ? `, ${leadText(headline.price_lead_days)}` : ""}.`;
    case "last_seen":
      return headline.price_seen_day ? `Nothing is in stock. This is the price ${daysSince(headline.price_seen_day, now)} days ago, when it last was.` : "Nothing is in stock.";
    case "listed":
      return "Nothing is in stock and no lead time is quoted. This is the list price.";
    default:
      return null;
  }
}

/** The price at the part's quantity, how far it moved in the last 30 days, and the range over distributors. Nothing until the part has priced readings. */
export function PriceTrend({ price, partId, listings, canEdit = false, onChanged }: PriceTrendProps) {
  const { history, trend, currency, headline } = price;
  if (history.length === 0 && !headline?.unit_price) return null;
  const latest = headline?.unit_price ?? String(history[history.length - 1].price);
  const change = trend?.change_percent ?? null;
  const range = headline?.price_range;
  const note = headline ? kindLine(headline, Date.now()) : null;
  const quantity = price.quantity ?? 100;
  return (
    <section aria-label="Price" className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</h3>
      <div className="flex items-center gap-3">
        <p className="text-lg font-semibold tabular-nums">{formatPrice(latest, currency)}</p>
      </div>
      {note ? <p className="text-xs text-warning">{note}</p> : null}
      {headline?.price_native ? <p className="text-xs text-muted-foreground">Converted from {formatPrice(headline.price_native.price, headline.price_native.currency)}.</p> : null}
      {range ? (
        <p className="text-xs text-muted-foreground">
          Across {range.sellers} distributors: {formatPrice(range.low, currency)} to {formatPrice(range.high, currency)}, median {formatPrice(range.median, currency)}.
        </p>
      ) : null}
      {headline && headline.price_unrated.length > 0 ? <p className="text-xs text-muted-foreground">No exchange rate for {headline.price_unrated.join(", ")}, so those prices are left out.</p> : null}
      <p className="text-xs text-muted-foreground">
        {change === null
          ? "Cheapest unit price any distributor showed. A move needs a week of readings."
          : `${change > 0 ? "Up" : change < 0 ? "Down" : "Unchanged,"} ${change === 0 ? "" : `${Math.abs(change)}% `}over ${trend?.days} days, from ${formatPrice(trend?.was ?? "", currency)}.`}
      </p>
      {price.estimated_until ? <p className="text-xs text-muted-foreground">Until {price.estimated_until} the history is the price at 100 pieces, because the price breaks were not kept yet.</p> : null}
      {partId && price.quantity ? (
        <PriceQuantity partId={partId} quantity={quantity} standard={price.default ?? 100} own={Boolean(price.own)} canEdit={canEdit} onChanged={onChanged ?? (() => undefined)} />
      ) : null}
      {listings && listings.length > 0 ? <TryQuantity listings={listings} /> : null}
    </section>
  );
}

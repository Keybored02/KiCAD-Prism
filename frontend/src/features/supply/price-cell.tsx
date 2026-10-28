import { Clock } from "lucide-react";

import type { SupplyPartRow } from "@/types/supply";
import { PriceMove } from "./part-row-extras";
import { daysSince, leadText, noPriceReason, priceDetail } from "./price-text";
import { formatPrice } from "./supply-format";

function Note({ part, now }: { part: SupplyPartRow; now: number }) {
  const at = `at ${part.price_quantity.toLocaleString()}`;
  switch (part.price_kind) {
    case "backorder":
      return (
        <div className="flex items-center justify-end gap-1 text-xs text-warning" title="Nothing is in stock. This is the cheapest price with a lead time quoted.">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {part.price_lead_days ? `${leadText(part.price_lead_days)}, ` : ""}{at}
        </div>
      );
    case "last_seen":
      return <div className="text-xs text-muted-foreground" title="Nothing is in stock. This is the price when it last was.">{part.price_seen_day ? `${daysSince(part.price_seen_day, now)} days ago` : "last in stock"}</div>;
    case "listed":
      return <div className="text-xs text-muted-foreground" title="Nothing is in stock and no lead time is quoted. This is the list price.">list price, {at}</div>;
    default:
      return <div className="text-xs text-muted-foreground">{at}</div>;
  }
}

/** The price of a row: the figure, how it was reached, and a note when nothing can be bought now. */
export function PriceCell({ part, now = Date.now() }: { part: SupplyPartRow; now?: number }) {
  if (!part.unit_price) return <span className="text-muted-foreground" title={noPriceReason(part)}>No price</span>;
  const detail = priceDetail({ ...part, unit_price: part.unit_price, price_kind: part.price_kind ?? "orderable", price_lead_days: part.price_lead_days ?? null,
    price_range: part.price_range ?? null, price_native: part.price_native ?? null, price_seen_day: part.price_seen_day ?? null, price_unrated: part.price_unrated ?? [] });
  return (
    <span title={detail || undefined}>
      {formatPrice(part.unit_price, part.currency)}{part.price_native ? <span aria-label="converted"> ~</span> : null}
      {part.price_quantity ? <span className="text-muted-foreground"> @ {part.price_quantity.toLocaleString()}</span> : null} <PriceMove percent={part.price_change_percent} />
      <Note part={part} now={now} />
    </span>
  );
}

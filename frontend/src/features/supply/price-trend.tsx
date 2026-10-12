import type { SupplyPartDetail } from "@/types/supply";
import { Sparkline } from "./sparkline";
import { formatPrice } from "./supply-format";

/** The cheapest price over the recorded days, and how far it moved in the last 30. Nothing until the part has priced readings. */
export function PriceTrend({ price }: { price: SupplyPartDetail["price"] }) {
  const { history, trend, currency } = price;
  if (history.length === 0) return null;
  const latest = history[history.length - 1].price;
  const change = trend?.change_percent ?? null;
  return (
    <section aria-label="Price" className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price</h3>
      <div className="flex items-center gap-3">
        <p className="text-lg font-semibold tabular-nums">{formatPrice(String(latest), currency)}</p>
        {history.length > 1 ? <Sparkline values={history.map((point) => point.price)} label="Cheapest price per day" /> : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {change === null
          ? "Cheapest unit price any distributor showed. A move needs a week of readings."
          : `${change > 0 ? "Up" : change < 0 ? "Down" : "Unchanged,"} ${change === 0 ? "" : `${Math.abs(change)}% `}over ${trend?.days} days, from ${formatPrice(trend?.was ?? "", currency)}.`}
      </p>
    </section>
  );
}

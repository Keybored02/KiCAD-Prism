import { ExternalLink } from "lucide-react";

import type { PanelSupply, PanelSupplySummary } from "@/panel/lib/panel-api";
import { compactCount, price, summaryText } from "@/panel/lib/supply-summary";
import { vendorColor } from "@/features/supply/vendor-colors";

const DOT: Record<PanelSupplySummary["status"], string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  fatal: "bg-red-700",
  unknown: "bg-muted-foreground/40",
};

/** The status dot a search row shows for a component Prism tracks. */
export function SupplyDot({ summary }: { summary: PanelSupplySummary }) {
  return <span role="img" aria-label="Supply status" className={`h-2 w-2 shrink-0 rounded-full ${DOT[summary.status]}`} title={summaryText(summary)} />;
}

/** The Availability block for a tracked component: standing, what to watch, who has it, alternates. */
export function SupplyAvailability({ supply }: { supply: PanelSupply }) {
  const { summary } = supply;
  if (!summary) return null;
  const offers = supply.offers ?? [];
  const alternates = supply.alternates ?? [];
  const inStockAlternates = alternates.filter((item) => (item.stock ?? 0) > 0).length;
  return (
    <div className="flex flex-col gap-1.5" data-testid="supply-availability">
      <div className="flex items-start gap-2 rounded border border-border/50 px-2.5 py-2">
        <span role="img" aria-label="Supply status" className={`mt-1 h-2 w-2 shrink-0 rounded-full ${DOT[summary.status]}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium">{summaryText(summary)}</p>
          {supply.outlook && supply.outlook !== "Not enough to say" ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">Outlook: {supply.outlook} (rule-based)</p>
          ) : null}
          {(supply.risks ?? []).map((risk) => (
            <p key={risk} className="mt-0.5 text-[11px] leading-snug text-amber-600 dark:text-amber-400">{risk}</p>
          ))}
        </div>
        {supply.links ? (
          <a href={supply.links.supply} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-primary hover:underline">
            Open in Prism <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>
      {offers.length > 0 ? (
        <ul className="overflow-hidden rounded border border-border/50 text-xs" aria-label="Distributors">
          {offers.map((offer) => (
            <li key={`${offer.connector}:${offer.sku}`} className="flex items-baseline gap-2 border-t border-border/30 px-2.5 py-1.5 first:border-t-0">
              <span className="min-w-0 flex-1 truncate">
                {vendorColor(offer.provider) ? (
                  <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-[2px]" style={{ backgroundColor: vendorColor(offer.provider) ?? undefined }} />
                ) : null}
                {offer.connector}
                {offer.marketplace ? <span className="ml-1 text-[10px] text-muted-foreground">marketplace</span> : null}
              </span>
              <span className="tabular-nums">{compactCount(offer.stock)}</span>
              <span className="w-16 text-right tabular-nums text-muted-foreground">{price(offer.unit_price, offer.currency)}</span>
              {offer.product_url ? (
                <a href={offer.product_url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${offer.connector} product page`} className="text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : <span className="w-3" />}
            </li>
          ))}
        </ul>
      ) : null}
      {alternates.length > 0 ? (
        <p className="px-0.5 text-[11px] text-muted-foreground">
          Alternates: {alternates.length} approved, {inStockAlternates} in stock.
          {supply.links ? (
            <>
              {" "}
              <a href={supply.links.sourcing} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">See them</a>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

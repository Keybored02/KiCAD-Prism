import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { SupplyListing } from "@/types/supply";
import { formatAgo, formatPrice, formatStock, matchLabel, packagingLabel, tierLabel } from "./supply-format";

/** Every distributor listing of a part, and whether it counts toward stock. */
export function ListingTable({ listings }: { listings: SupplyListing[] }) {
  if (listings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No listings yet. Connectors search for new watches within a minute or two.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {listings.map((listing) => {
        const offer = listing.offer;
        const firstBreak = offer?.price_breaks[0];
        return (
          <article key={listing.id} aria-label={`Listing ${listing.sku}`} className="rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{listing.connector_name}</span>
                <span className="text-xs text-muted-foreground">{listing.sku}</span>
                {packagingLabel(listing.packaging) ? <Badge variant="outline">{packagingLabel(listing.packaging)}</Badge> : null}
                {!listing.counted ? <Badge variant="warning">{matchLabel(listing.match_state)}, not counted</Badge> : null}
                {offer?.marketplace ? <Badge variant="outline">Marketplace</Badge> : null}
              </div>
              {offer?.product_url ? (
                <a href={offer.product_url} target="_blank" rel="noreferrer" aria-label={`Open ${listing.connector_name} product page`}
                  className="text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
            {offer ? (
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                <Fact label="Stock" value={formatStock(offer.stock)} />
                <Fact label={`Price at ${firstBreak?.[0] ?? 1}`} value={firstBreak ? formatPrice(firstBreak[1], offer.currency) : "None"} />
                <Fact label="Order" value={`Min ${offer.moq.toLocaleString()}${offer.order_multiple > 1 ? `, multiples of ${offer.order_multiple.toLocaleString()}` : ""}`} />
                <Fact label="Lead time" value={offer.lead_time_days === null ? "In stock" : `${offer.lead_time_days} days`} />
                {offer.incoming.length > 0 ? (
                  <Fact label="On order" value={offer.incoming.map(([quantity, date]) => `${quantity.toLocaleString()}${date ? ` due ${date}` : ""}`).join(", ")} />
                ) : null}
                <Fact label="Read" value={formatAgo(offer.fetched_at)} />
              </dl>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Not read yet.</p>
            )}
            {listing.poll ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {tierLabel(listing.poll.tier)}.
                {listing.poll.error_streak > 0 ? ` Last attempt failed (${listing.poll.last_error_code || "error"}).` : ""}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SupplyReviewListing } from "@/types/supply";
import { pinSupplyListing, rejectSupplyListing } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";

interface ListingRowProps {
  listing: SupplyReviewListing;
  canDecide: boolean;
  onDecided: () => Promise<void>;
}

export function ListingRow({ listing, canDecide, onDecided }: ListingRowProps) {
  const { busy, error, run } = useConnectorSubmit();
  const decide = (action: (id: string) => Promise<void>) =>
    void run(async () => {
      await action(listing.id);
      await onDecided();
    });

  return (
    <article className="rounded-lg border bg-card p-3" aria-label={`Listing ${listing.sku}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{listing.sku}</span>
            <span className="text-xs text-muted-foreground">{listing.connector_name}</span>
            <Badge variant={listing.match_state === "near" ? "outline" : "warning"}>
              {listing.match_state === "near" ? "Near match" : "Spelling not mapped"}
            </Badge>
          </div>
          <p className="text-sm">
            {listing.raw_mpn} <span className="text-muted-foreground">by {listing.raw_manufacturer}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {listing.part ? `For ${listing.part.mpn} by ${listing.part.manufacturer}. ` : ""}
            {capitalize(listing.match_reason)}.
          </p>
        </div>
        {canDecide && listing.part ? (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => decide(pinSupplyListing)}>
              Confirm as this part
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => decide(rejectSupplyListing)}>
              Reject
            </Button>
          </div>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null}
    </article>
  );
}

function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

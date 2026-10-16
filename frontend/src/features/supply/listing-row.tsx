import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { SupplyReviewListing } from "@/types/supply";
import { pinSupplyListing, rejectSupplyListing } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { VendorName } from "./vendor-name";

interface ListingRowProps {
  listing: SupplyReviewListing;
  canDecide: boolean;
  onDecided: () => Promise<void>;
}

export function ListingRow({ listing, canDecide, onDecided }: ListingRowProps) {
  const { busy, error, run } = useConnectorSubmit();
  const [confirming, setConfirming] = useState(false);
  // A pin counts the listing's stock as the part's; with another number that is a claim worth a second look.
  const otherNumber = Boolean(listing.part) && numberKey(listing.raw_mpn) !== numberKey(listing.part?.mpn ?? "");
  const decide = (action: (id: string) => Promise<void>) =>
    void run(async () => {
      await action(listing.id);
      await onDecided();
    });

  return (
    <article className="border bg-card p-3" aria-label={`Listing ${listing.sku}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{listing.sku}</span>
            <VendorName provider={listing.provider} name={listing.connector_name} className="text-xs text-muted-foreground" />
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
            <Button size="sm" variant="outline" disabled={busy} onClick={() => (otherNumber ? setConfirming(true) : decide(pinSupplyListing))}>
              Confirm as this part
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => decide(rejectSupplyListing)}>
              Reject
            </Button>
          </div>
        ) : null}
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null}
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Same part under another number?"
        description={`${listing.raw_mpn} is not ${listing.part?.mpn ?? "this part"}. Its stock and price will count as the part's.`}
        confirmLabel="Pin anyway"
        destructive={false}
        busy={busy}
        onConfirm={() => { setConfirming(false); decide(pinSupplyListing); }}
      />
    </article>
  );
}

/** A part number without spaces, dashes and case, as the backend compares them. */
function numberKey(number: string): string {
  return number.normalize("NFKC").replace(/[\s_\-\u2010-\u2014\u2212]+/g, "").toUpperCase();
}

function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

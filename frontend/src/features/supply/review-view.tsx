import { CheckCheck } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { canReviewSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import { AliasRow } from "./alias-row";
import { CollapsibleSection } from "./collapsible-section";
import { MakerChoices } from "./maker-choices";
import { MatchedByPrism } from "./matched-by-prism";
import { OtherNumberPins } from "./other-number-pins";
import { ListingRow } from "./listing-row";
import { PackagingSection } from "./packaging-section";
import { usePackagingWaiting } from "./use-packaging-waiting";
import { useSupplyReview } from "./use-supply-review";

/** Matches that need a person: manufacturer spellings and listings that are not proven. */
export function ReviewView({ user }: { user: User | null }) {
  const { status, queue, error, retry, refresh } = useSupplyReview();
  const canDecide = canReviewSupply(user?.role);
  const packaging = usePackagingWaiting();

  return (
    <div className="relative h-full overflow-y-auto p-4">
      <div className="space-y-6">
        {canDecide ? null : <p className="text-sm text-muted-foreground">QA and administrators decide.</p>}

        {status === "loading" ? <Skeleton className="h-40 w-full" aria-label="Loading the review queue" /> : null}
        {status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-3">
              {error}
              <Button size="sm" variant="outline" onClick={retry}>Retry</Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {status === "ready" && queue ? (
          <>
            {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
            {queue.aliases.length === 0 && queue.listings.length === 0 && packaging.items.length === 0 && (queue.other_numbers ?? []).length === 0 && (queue.choices ?? []).length === 0 ? (
              <div className="flex flex-col items-center gap-2 border border-dashed p-10 text-center">
                <CheckCheck className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Nothing to review</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Spellings and listings that need a decision appear here.
                </p>
              </div>
            ) : null}

            <MakerChoices choices={queue.choices ?? []} onDecided={refresh} />

            <OtherNumberPins groups={queue.other_numbers ?? []} canDecide={canDecide} onDecided={refresh} />

            <PackagingSection items={packaging.items} saves={packaging.saves} canPick={user !== null && user.role !== "viewer"} onChanged={() => void packaging.refresh()} />

            {queue.aliases.length > 0 ? (
              <CollapsibleSection id="review-spellings" title="Manufacturer spellings" count={queue.counts.aliases}>
                <div className="space-y-2 p-2">
                  {queue.aliases.map((alias) => (
                    <AliasRow
                      key={alias.alias_key}
                      alias={alias}
                      manufacturers={queue.manufacturers}
                      canDecide={canDecide}
                      onDecided={refresh}
                    />
                  ))}
                </div>
              </CollapsibleSection>
            ) : null}

            {queue.listings.length > 0 ? (
              <CollapsibleSection id="review-listings" title="Listings waiting" count={queue.counts.unresolved + queue.counts.near}>
                <div className="space-y-2 p-2">
                  {queue.listings.map((listing) => (
                    <ListingRow key={listing.id} listing={listing} canDecide={canDecide} onDecided={refresh} />
                  ))}
                </div>
              </CollapsibleSection>
            ) : null}

            <MatchedByPrism matched={queue.matched} canDecide={canDecide} onDecided={refresh} />
          </>
        ) : null}
      </div>
    </div>
  );
}

import { CheckCheck } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { canReviewSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import { AliasRow } from "./alias-row";
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
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Supply</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Review</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Distributors spell manufacturers and part numbers their own way. Only matches you confirm, or that are exact,
            count toward stock and price.
            {canDecide ? "" : " QA and administrators decide."}
          </p>
        </div>

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
            {queue.aliases.length === 0 && queue.listings.length === 0 && packaging.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
                <CheckCheck className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Nothing to review</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Spellings and listings that need a decision appear here.
                </p>
              </div>
            ) : null}

            <PackagingSection items={packaging.items} saves={packaging.saves} canPick={user !== null && user.role !== "viewer"} onChanged={() => void packaging.refresh()} />

            {queue.aliases.length > 0 ? (
              <section aria-label="Manufacturer spellings" className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Manufacturer spellings ({queue.counts.aliases})
                </h3>
                {queue.aliases.map((alias) => (
                  <AliasRow
                    key={alias.alias_key}
                    alias={alias}
                    manufacturers={queue.manufacturers}
                    canDecide={canDecide}
                    onDecided={refresh}
                  />
                ))}
              </section>
            ) : null}

            {queue.listings.length > 0 ? (
              <section aria-label="Listings waiting" className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Listings waiting ({queue.counts.unresolved + queue.counts.near})
                </h3>
                {queue.listings.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} canDecide={canDecide} onDecided={refresh} />
                ))}
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

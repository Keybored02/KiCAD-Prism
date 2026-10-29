import { useCallback } from "react";

import { canEditSupply, canReviewSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import { listInventorySources } from "./inventory-api";
import { useReviewCount } from "./review-count";
import { ReviewView } from "./review-view";
import { UnmatchedStockSection } from "./unmatched-stock";
import { WorkItemsSection } from "./work-items-section";
import { useLoaded } from "./use-loaded";

/** Unmatched parts across every local inventory source; undefined until known. */
function useUnmatchedCount(allowed: boolean): number | undefined {
  const fetcher = useCallback((signal: AbortSignal) => listInventorySources(signal), []);
  const { data } = useLoaded(allowed ? "inventory/sources" : null, fetcher, "Could not load inventory sources");
  return data?.reduce((sum, source) => sum + source.unmatched, 0);
}

/** What waits on Library Manager > Review: the supply queue and the unmatched local stock. */
export function useLibraryReviewCount(allowed: boolean): number | undefined {
  const queue = useReviewCount(allowed);
  const unmatched = useUnmatchedCount(allowed);
  return queue === undefined && unmatched === undefined ? undefined : (queue ?? 0) + (unmatched ?? 0);
}

/** Library Manager > Review: matching questions, with the library. Supply's sections, then the unmatched local stock. */
export function LibraryReviewView({ user }: { user: User | null }) {
  const unmatched = useUnmatchedCount(true);
  return (
    <ReviewView
      user={user}
      othersWaiting={(unmatched ?? 0) > 0}
      after={(
        <>
          <WorkItemsSection email={user?.email ?? ""} canFollow={canEditSupply(user?.role)} canDecide={canReviewSupply(user?.role)} />
          <UnmatchedStockSection canDecide={canReviewSupply(user?.role)} />
        </>
      )}
    />
  );
}

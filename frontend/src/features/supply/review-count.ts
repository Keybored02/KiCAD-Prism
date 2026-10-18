import { useCallback } from "react";

import type { SupplyReviewQueue } from "@/types/supply";
import { getSupplyReviewQueue } from "./supply-api";
import { useLoaded } from "./use-loaded";

/** Everything the Review page lists for a person to decide. Matched items are already decided and are not counted. */
export function reviewCountOf(review: SupplyReviewQueue): number {
  const approve = review.to_approve ? review.to_approve.waivers.length + review.to_approve.alternates.length : 0;
  const pinned = (review.other_numbers ?? []).reduce((total, group) => total + group.listings.length, 0);
  return review.counts.unresolved + review.counts.near + review.counts.aliases + (review.choices?.length ?? 0) + approve + pinned;
}

/** How many items wait on the Review page; undefined until known. Reloaded when `refreshKey` changes. */
export function useReviewCount(allowed: boolean, refreshKey: string): number | undefined {
  const fetcher = useCallback((signal: AbortSignal) => getSupplyReviewQueue(signal), []);
  const { data } = useLoaded<SupplyReviewQueue>(allowed ? `count:${refreshKey}` : null, fetcher, "Could not load the review queue", "supply");
  return data ? reviewCountOf(data) : undefined;
}

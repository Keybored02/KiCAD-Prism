import { useCallback } from "react";

import type { SupplyReviewQueue } from "@/types/supply";
import { listPackagingSeveral } from "./packaging-api";
import { getSupplyReviewQueue } from "./supply-api";
import { useLoaded } from "./use-loaded";

/** The sum of the counters on the Review page's sections; `several` is the parts listed more than once at a distributor. */
export function reviewCountOf(review: SupplyReviewQueue, several = 0): number {
  const approve = review.to_approve ? review.to_approve.waivers.length + review.to_approve.alternates.length : 0;
  const pinned = (review.other_numbers ?? []).length;
  const matched = review.matched ? review.matched.aliases.length + review.matched.parts.length : 0;
  return review.counts.unresolved + review.counts.near + review.counts.aliases + (review.choices?.length ?? 0) + approve + pinned + matched + several;
}

/** How many items wait on the Review page; undefined until known. Reloaded when `refreshKey` changes. */
export function useReviewCount(allowed: boolean, refreshKey: string): number | undefined {
  const fetcher = useCallback((signal: AbortSignal) => getSupplyReviewQueue(signal), []);
  const severalFetcher = useCallback(async (signal: AbortSignal) => (await listPackagingSeveral(signal)).items.length, []);
  const { data } = useLoaded<SupplyReviewQueue>(allowed ? `count:${refreshKey}` : null, fetcher, "Could not load the review queue", "supply");
  const several = useLoaded<number>(allowed ? `count-several:${refreshKey}` : null, severalFetcher, "Could not load the listings", "supply");
  return data ? reviewCountOf(data, several.data ?? 0) : undefined;
}

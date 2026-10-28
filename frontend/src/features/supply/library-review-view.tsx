import { useCallback, useState } from "react";

import { canReviewSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import { listInventorySources } from "./inventory-api";
import { useReviewCount } from "./review-count";
import { ReviewView } from "./review-view";
import { UnmatchedStockSection } from "./unmatched-stock";
import { useLoaded } from "./use-loaded";

/** Unmatched parts across every local inventory source; undefined until known. Reloaded when `refreshKey` changes. */
function useUnmatchedCount(allowed: boolean, refreshKey: string): number | undefined {
  const fetcher = useCallback(async (signal: AbortSignal) => (await listInventorySources(signal)).reduce((sum, source) => sum + source.unmatched, 0), []);
  const { data } = useLoaded<number>(allowed ? `unmatched:${refreshKey}` : null, fetcher, "Could not load inventory sources", "supply");
  return data ?? undefined;
}

/** What waits on Library Manager > Review: the supply queue and the unmatched local stock. */
export function useLibraryReviewCount(allowed: boolean, refreshKey: string): number | undefined {
  const queue = useReviewCount(allowed, refreshKey);
  const unmatched = useUnmatchedCount(allowed, refreshKey);
  return queue === undefined && unmatched === undefined ? undefined : (queue ?? 0) + (unmatched ?? 0);
}

/** Library Manager > Review: matching questions, with the library. Supply's sections, then the unmatched local stock. */
export function LibraryReviewView({ user }: { user: User | null }) {
  const [decided, setDecided] = useState(0);
  const unmatched = useUnmatchedCount(true, String(decided));
  return (
    <ReviewView
      user={user}
      othersWaiting={(unmatched ?? 0) > 0}
      after={<UnmatchedStockSection key={decided} canDecide={canReviewSupply(user?.role)} onDecided={() => setDecided((count) => count + 1)} />}
    />
  );
}

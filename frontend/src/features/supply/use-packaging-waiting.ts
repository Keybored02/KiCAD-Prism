import { useCallback } from "react";

import type { PackagingWaiting } from "@/types/supply";
import { listPackagingWaiting } from "./packaging-api";
import { useLoaded } from "./use-loaded";

/** The picks waiting. A failure just means none are listed. */
export function usePackagingWaiting() {
  const fetcher = useCallback((signal: AbortSignal) => listPackagingWaiting(signal), []);
  const { data, refresh } = useLoaded<{ items: PackagingWaiting[]; saves_calls_a_day: number }>("packaging-waiting", fetcher, "Could not load the packaging picks");
  return { items: data?.items ?? [], saves: data?.saves_calls_a_day ?? 0, refresh };
}

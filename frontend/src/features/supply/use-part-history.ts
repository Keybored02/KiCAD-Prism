import { useCallback } from "react";

import type { PartHistory } from "@/types/supply";
import { getPartHistory } from "./supply-api";
import { useLoaded } from "./use-loaded";

export const SHEET_DAYS = 90;

/** The last 90 days of a part's stock and price, a line per distributor. */
export function usePartHistory(partId: string) {
  const fetcher = useCallback((signal: AbortSignal) => getPartHistory(partId, SHEET_DAYS, signal), [partId]);
  return useLoaded<PartHistory>(`part-history:${partId}`, fetcher, "Could not load the history");
}

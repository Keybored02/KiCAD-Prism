import { useCallback } from "react";

import type { SupplyCapacity } from "@/types/supply";
import { listSupplyCapacity } from "./supply-api";
import { useLoaded } from "./use-loaded";

/** What each metered connector needs against its budget. A failure just means no note on the card. */
export function useSupplyCapacity(): SupplyCapacity[] {
  const fetcher = useCallback((signal: AbortSignal) => listSupplyCapacity(signal), []);
  const { data } = useLoaded<SupplyCapacity[]>("capacity", fetcher, "Could not load capacity");
  return data ?? [];
}

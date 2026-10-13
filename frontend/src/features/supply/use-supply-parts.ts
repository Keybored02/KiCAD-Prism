import { useCallback } from "react";

import type {
  PartsFilter,
  PartsScope,
  SupplyAlert,
  SupplyManufacturer,
  SupplyOverview,
  SupplyPartDetail,
  SupplyPartsPage,
} from "@/types/supply";
import {
  getSupplyOverview,
  findSupplyPart,
  getSupplyPart,
  listSupplyAlerts,
  listSupplyManufacturers,
  listSupplyParts,
} from "./supply-api";
import { useLoaded } from "./use-loaded";

export function useSupplyPartsList(scope: PartsScope, query: string, only: PartsFilter = "") {
  const fetcher = useCallback((signal: AbortSignal) => listSupplyParts(scope, query, signal, only), [scope, query, only]);
  return useLoaded<SupplyPartsPage>(`${scope}|${query}|${only}`, fetcher, "Could not load parts");
}

/** The manufacturers Prism knows, for suggestions. A failure just means no suggestions. */
export function useSupplyManufacturers(): SupplyManufacturer[] {
  const fetcher = useCallback(async (signal: AbortSignal) => (await listSupplyManufacturers(signal)).items, []);
  const { data } = useLoaded<SupplyManufacturer[]>("manufacturers", fetcher, "Could not load manufacturers");
  return data ?? [];
}

export function useSupplyPart(partId: string | null) {
  const fetcher = useCallback((signal: AbortSignal) => getSupplyPart(partId ?? "", signal), [partId]);
  return useLoaded<SupplyPartDetail>(partId, fetcher, "Could not load the part");
}

export function useSupplyOverview() {
  const fetcher = useCallback((signal: AbortSignal) => getSupplyOverview(signal), []);
  return useLoaded<SupplyOverview>("overview", fetcher, "Could not load the overview");
}

export function useSupplyAlerts(includeResolved: boolean) {
  const fetcher = useCallback(
    async (signal: AbortSignal) => (await listSupplyAlerts(includeResolved, signal)).items,
    [includeResolved],
  );
  return useLoaded<SupplyAlert[]>(includeResolved ? "resolved" : "active", fetcher, "Could not load alerts");
}

/** The part Prism tracks for a catalog component's manufacturer and number; null data when none. */
export function useSupplyPartFor(manufacturer: string, mpn: string) {
  const fetcher = useCallback((signal: AbortSignal) => findSupplyPart(manufacturer, mpn, signal), [manufacturer, mpn]);
  return useLoaded<string | null>(`${manufacturer}|${mpn}`, fetcher, "Could not look the part up");
}

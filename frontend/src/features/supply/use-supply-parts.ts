import { useCallback, useState } from "react";

import type {
  PartsFilter,
  PartsScope,
  SupplyAlert,
  SupplyManufacturer,
  SupplyOverview,
  SupplyPartDetail,
  SupplyPartRow,
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

export function useSupplyPartsList(scope: PartsScope, query: string, only: PartsFilter = "", limit = 0) {
  const fetcher = useCallback((signal: AbortSignal) => listSupplyParts(scope, query, signal, only, 0, limit), [scope, query, only, limit]);
  return useLoaded<SupplyPartsPage>(`${scope}|${query}|${only}`, fetcher, "Could not load parts");
}

const FEED_PAGE = 50;

/** Parts a page at a time: the first page, then more as `loadMore` is called. A refresh starts again from the first page. */
export function useSupplyPartsFeed(scope: PartsScope, query: string, only: PartsFilter = "") {
  const first = useSupplyPartsList(scope, query, only, FEED_PAGE);
  const [more, setMore] = useState<{ base: SupplyPartsPage | null; items: SupplyPartRow[]; next: number | null }>({ base: null, items: [], next: null });
  const [loadingMore, setLoadingMore] = useState(false);
  const base = first.data;
  // Pages loaded after a first page that has since been replaced belong to something else.
  const extra = more.base === base ? more : { base, items: [] as SupplyPartRow[], next: base?.next_offset ?? null };
  const loadMore = useCallback(async () => {
    if (!base || extra.next === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listSupplyParts(scope, query, undefined, only, extra.next, FEED_PAGE);
      setMore({ base, items: [...extra.items, ...page.items], next: page.next_offset ?? null });
    } catch {
      // The sentinel asks again when it is next seen; the rows already loaded stay.
    } finally {
      setLoadingMore(false);
    }
  }, [base, extra.items, extra.next, loadingMore, scope, query, only]);
  const items = base ? [...base.items, ...extra.items] : [];
  return { ...first, items, total: base?.total ?? 0, hasMore: extra.next !== null, loadingMore, loadMore };
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

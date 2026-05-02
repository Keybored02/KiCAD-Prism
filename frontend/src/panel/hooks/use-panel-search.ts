import { useMemo } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";

import type { PanelComponent } from "@/panel/lib/panel-api";

const FUSE_OPTIONS: IFuseOptions<PanelComponent> = {
  keys: [
    { name: "name", weight: 2 },
    { name: "mpn", weight: 2 },
    { name: "value" as string, weight: 2 },
    { name: "description", weight: 1.5 },
    { name: "manufacturer", weight: 1.5 },
    { name: "package_name", weight: 1 },
    { name: "category", weight: 1 },
    { name: "vendor" as string, weight: 0.75 },
  ],
  threshold: 0.35,
  includeScore: true,
  ignoreLocation: true,
};

export function usePanelSearch(
  components: PanelComponent[],
  query: string
): { isSearching: boolean; results: PanelComponent[] } {
  const fuse = useMemo(() => new Fuse(components, FUSE_OPTIONS), [components]);

  const isSearching = query.trim().length > 0;

  const results = useMemo(() => {
    if (!isSearching) return [];
    return fuse.search(query.trim()).map((r) => r.item);
  }, [isSearching, fuse, query]);

  return { isSearching, results };
}

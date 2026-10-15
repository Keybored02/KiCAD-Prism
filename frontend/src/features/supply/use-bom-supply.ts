import { useCallback, useMemo, useState } from "react";

import { canEditSupply, canOpenSupply } from "@/lib/roles";
import type { SemanticComponent } from "@/types/prism-selection";
import type { User } from "@/types/auth";
import type { SupplyBomLookup, SupplyBomWatchResult } from "@/types/supply";
import { buildLines, lineInput, type BomLineDetail } from "./bom-supply";
import { lookupSupplyBom, watchSupplyBomLines } from "./supply-api";
import { useLoaded } from "./use-loaded";

// A lookup takes this many lines; a BOM with more shows the first ones and says so.
const MAX_LINES = 2000;
// Watching goes in batches of this size so no request is refused for its length.
const WATCH_BATCH = 200;

export interface BomSupply {
  /** False for roles that cannot read supply data: the table then shows nothing extra. */
  enabled: boolean;
  canWatch: boolean;
  buildQuantity: number;
  setBuildQuantity: (quantity: number) => void;
  /** Spares on top of what the boards use, as a percentage; null is by kind of part (small passives get some). */
  attritionPercent: number | null;
  setAttritionPercent: (percent: number | null) => void;
  /** The project the BOM is from; empty when it is not known. */
  projectId: string;
  lines: BomLineDetail[];
  fittedKeys: ReadonlySet<string>;
  truncated: boolean;
  status: "idle" | "loading" | "ready" | "error";
  lookup: SupplyBomLookup | null;
  error: string;
  retry: () => void;
  /** Watch just these lines, then reload the figures. */
  watchLines: (subset: readonly BomLineDetail[]) => Promise<SupplyBomWatchResult>;
  /** Reload the figures without the loading state. */
  refresh: () => Promise<void>;
  /** Ask for this build's parts as demand under a name, replacing what the name asked for before. */
}

const EMPTY_KEYS: ReadonlySet<string> = new Set();

/** Supply figures for the fitted parts of a BOM, looked up once per change of parts or build size. */
export function useBomSupply(fitted: readonly SemanticComponent[], user: User | null, projectId = ""): BomSupply {
  const enabled = canOpenSupply(user?.role);
  const [buildQuantity, setBuildQuantity] = useState(1);
  const [attritionPercent, setAttritionPercent] = useState<number | null>(0);
  const allLines = useMemo(() => (enabled ? buildLines(fitted) : []), [enabled, fitted]);
  const lines = useMemo(() => allLines.slice(0, MAX_LINES), [allLines]);
  const fittedKeys = useMemo(() => (lines.length ? new Set(lines.map((line) => line.key)) : EMPTY_KEYS), [lines]);

  const requestKey = useMemo(
    () => (enabled && lines.length > 0 ? `${buildQuantity}+${attritionPercent ?? "auto"}#${lines.map((line) => `${line.key}x${line.quantity}`).join(";")}` : null),
    [enabled, lines, buildQuantity, attritionPercent],
  );
  const fetcher = useCallback(
    (signal: AbortSignal) =>
      lookupSupplyBom(lines.map(lineInput), buildQuantity, { signal, attritionPercent }),
    [lines, buildQuantity, attritionPercent],
  );
  const { status: loadStatus, data, error, retry, refresh } = useLoaded<SupplyBomLookup>(requestKey, fetcher, "Could not look the BOM up");

  const watchLines = useCallback(async (subset: readonly BomLineDetail[]) => {
    const batches: BomLineDetail[][] = [];
    for (let start = 0; start < subset.length; start += WATCH_BATCH) batches.push(subset.slice(start, start + WATCH_BATCH));
    // Each part is on exactly one line, so the batches do not overlap and can run together.
    const results = await Promise.all(
      batches.map((batch) => watchSupplyBomLines(batch.map(lineInput))),
    );
    const totals: SupplyBomWatchResult = { watched: 0, already_watched: 0, lcsc_linked: 0, skipped: [] };
    for (const result of results) {
      totals.watched += result.watched;
      totals.already_watched += result.already_watched;
      totals.lcsc_linked = (totals.lcsc_linked ?? 0) + (result.lcsc_linked ?? 0);
      totals.skipped.push(...result.skipped);
    }
    await refresh();
    return totals;
  }, [refresh]);

  const status = requestKey === null ? "idle" : loadStatus;
  return {
    enabled,
    canWatch: canEditSupply(user?.role),
    buildQuantity,
    setBuildQuantity,
    attritionPercent,
    setAttritionPercent,
    projectId,
    lines,
    fittedKeys,
    truncated: allLines.length > MAX_LINES,
    status,
    lookup: requestKey === null ? null : data,
    error,
    retry,
    watchLines,
    refresh,
  };
}

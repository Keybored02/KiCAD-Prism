import { useCallback, useMemo } from "react";

import { canEditSupply, canOpenSupply } from "@/lib/roles";
import type { SemanticComponent } from "@/types/prism-selection";
import type { User } from "@/types/auth";
import type { SupplyBomLookup, SupplyBomWatchResult } from "@/types/supply";
import { buildLines, lineInput, type BomLineDetail } from "./bom-supply";
import { getAssessmentSettings, lookupSupplyBom, watchSupplyBomLines } from "./supply-api";
import { getProjectTracking } from "./tracking-api";
import { useLoaded } from "./use-loaded";

// A lookup takes this many lines; a BOM with more shows the first ones and says so.
const MAX_LINES = 2000;
// Watching goes in batches of this size so no request is refused for its length.
const WATCH_BATCH = 200;

export interface BomSupply {
  /** False for roles that cannot read supply data: the table then shows nothing extra. */
  enabled: boolean;
  canWatch: boolean;
  /** The boards the figures are for: the tracked project's usual build, else one (UX-05, Q2). */
  buildQuantity: number;
  /** Spares on top of what the boards use, as a percentage; null is by kind of part (small passives get some). The workspace's setting. */
  attritionPercent: number | null;
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
}

const BUILD_QUANTITY = 1;
const EMPTY_KEYS: ReadonlySet<string> = new Set();

/** Supply figures for the fitted parts of a BOM, looked up once per change of parts or build size. */
export function useBomSupply(fitted: readonly SemanticComponent[], user: User | null, projectId = ""): BomSupply {
  const enabled = canOpenSupply(user?.role);
  // The figures are for one board, with the workspace's spares (Supply settings), which the lookup waits for.
  const settingsFetcher = useCallback((signal: AbortSignal) => getAssessmentSettings(signal), []);
  const workspace = useLoaded("settings/assessment", settingsFetcher, "Could not load the settings");
  const fallback = workspace.data?.settings;
  // A tracked project's usual build and spares, so the BOM prices as the project page does. An untracked project, or one whose
  // tracking cannot be read, prices one board with the workspace's spares.
  const trackingFetcher = useCallback((signal: AbortSignal) => getProjectTracking(projectId, signal), [projectId]);
  const tracking = useLoaded(enabled && projectId ? `projects/${projectId}/tracking` : null, trackingFetcher, "Could not load the project's tracking");
  const tracked = tracking.status === "ready" ? tracking.data?.tracked ?? null : null;
  const buildQuantity = tracked?.build_quantity ?? BUILD_QUANTITY;
  const ownSpares = tracked?.spares ?? null;
  const attritionPercent = ownSpares === "auto" ? null : ownSpares !== null && ownSpares !== "" && Number.isFinite(Number(ownSpares)) ? Number(ownSpares)
    : fallback ? (fallback.spares_mode === "package" ? null : fallback.spares_percent) : 0;
  const waiting = workspace.status === "loading" || (enabled && Boolean(projectId) && tracking.status === "loading");
  const allLines = useMemo(() => (enabled ? buildLines(fitted) : []), [enabled, fitted]);
  const lines = useMemo(() => allLines.slice(0, MAX_LINES), [allLines]);
  const fittedKeys = useMemo(() => (lines.length ? new Set(lines.map((line) => line.key)) : EMPTY_KEYS), [lines]);

  const requestKey = useMemo(
    () => (enabled && lines.length > 0 && !waiting ? `${buildQuantity}+${attritionPercent ?? "auto"}#${lines.map((line) => `${line.key}x${line.quantity}`).join(";")}` : null),
    [enabled, lines, attritionPercent, waiting, buildQuantity],
  );
  const fetcher = useCallback(
    (signal: AbortSignal) =>
      lookupSupplyBom(lines.map(lineInput), buildQuantity, { signal, attritionPercent }),
    [lines, attritionPercent, buildQuantity],
  );
  const { status: loadStatus, data, error, retry, refresh } = useLoaded<SupplyBomLookup>(requestKey === null ? null : `bom-lookup/${requestKey}`, fetcher, "Could not look the BOM up");

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
    attritionPercent,
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

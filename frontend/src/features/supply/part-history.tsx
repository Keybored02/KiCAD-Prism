import { Maximize2 } from "lucide-react";
import { lazy, Suspense, useCallback, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { PartForecast, PartHistory } from "@/types/supply";
import { HistoryLegend } from "./history-legend";
import { PartHistoryDialog } from "./part-history-dialog";
import type { HistoryKind } from "./part-history-model";
import { getPartHistory } from "./supply-api";
import { useHidden } from "./use-hidden";
import { useLoaded } from "./use-loaded";

const PartHistoryChart = lazy(() => import("./part-history-chart"));

const SHEET_DAYS = 90;

function ChartButton({ kind, label, onOpen, children }: { kind: HistoryKind; label: string; onOpen: (kind: HistoryKind) => void; children: ReactNode }) {
  return (
    <div className="group relative">
      {children}
      <Button
        type="button" size="icon" variant="ghost" className="absolute right-1 top-0 h-6 w-6 opacity-60 hover:opacity-100"
        aria-label={label} title={label} onClick={() => onOpen(kind)}
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

/** Stock and price of the part over the last 90 days, a line per distributor. A chart opens larger with a choice of timeframe. */
export function PartHistoryPanel({ partId, threshold, forecast = null }: { partId: string; threshold: number | null; forecast?: PartForecast | null }) {
  const fetcher = useCallback((signal: AbortSignal) => getPartHistory(partId, SHEET_DAYS, signal), [partId]);
  const { data } = useLoaded<PartHistory>(`part-history:${partId}`, fetcher, "Could not load the history");
  const { hidden, toggle } = useHidden();
  const [opened, setOpened] = useState<HistoryKind | null>(null);
  if (!data || data.connectors.length === 0) {
    return <p className="text-xs text-muted-foreground">History builds up as the part is read.</p>;
  }
  const priced = data.connectors.some((line) => line.price.length > 0);
  return (
    <div className="space-y-2">
      <HistoryLegend history={data} hidden={hidden} onToggle={toggle} withTotal />
      <ChartButton kind="stock" label="Open the stock history larger" onOpen={setOpened}>
        <Suspense fallback={<div className="h-44" />}>
          <PartHistoryChart history={data} kind="stock" hidden={hidden} threshold={threshold} forecast={forecast} />
        </Suspense>
      </ChartButton>
      {priced ? (
        <ChartButton kind="price" label="Open the price history larger" onOpen={setOpened}>
          <Suspense fallback={<div className="h-36" />}>
            <PartHistoryChart history={data} kind="price" hidden={hidden} height="h-36" forecast={forecast} />
          </Suspense>
        </ChartButton>
      ) : null}
      {opened ? <PartHistoryDialog partId={partId} threshold={threshold} forecast={forecast} onClose={() => setOpened(null)} /> : null}
    </div>
  );
}

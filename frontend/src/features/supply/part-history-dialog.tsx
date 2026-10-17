import { lazy, Suspense, useCallback, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PartHistory } from "@/types/supply";
import { HistoryEvents, HistoryLegend } from "./history-legend";
import { TIMEFRAMES } from "./part-history-model";
import { getPartHistory } from "./supply-api";
import { useHidden } from "./use-hidden";
import { useLoaded } from "./use-loaded";

const PartHistoryChart = lazy(() => import("./part-history-chart"));

/** Stock and price one above the other, a line per distributor, with the timeframe to look at. */
export function PartHistoryDialog({ partId, threshold, onClose }: { partId: string; threshold: number | null; onClose: () => void }) {
  const [timeframe, setTimeframe] = useState("3m");
  const days = TIMEFRAMES.find((item) => item.id === timeframe)?.days ?? 90;
  const fetcher = useCallback((signal: AbortSignal) => getPartHistory(partId, days, signal), [partId, days]);
  const { data, status, error } = useLoaded<PartHistory>(`part-history:${partId}:${days}`, fetcher, "Could not load the history");
  const { hidden, toggle } = useHidden();
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[min(95vw,64rem)] sm:max-w-none">
        <DialogHeader>
          <DialogTitle>History</DialogTitle>
          <DialogDescription>Stock and price at each distributor. Readings are kept in full for 60 days and as one a day after that.</DialogDescription>
        </DialogHeader>
        <div role="radiogroup" aria-label="Timeframe" className="flex flex-wrap gap-1">
          {TIMEFRAMES.map((item) => (
            <button
              key={item.id} type="button" role="radio" aria-checked={timeframe === item.id} onClick={() => setTimeframe(item.id)}
              className={`border px-3 py-1 text-xs ${timeframe === item.id ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/30"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {status === "error" ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        {data && data.connectors.length > 0 ? (
          <div className="space-y-3">
            <HistoryLegend history={data} hidden={hidden} onToggle={toggle} withTotal />
            <Suspense fallback={<div className="h-56" />}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stock</p>
              <PartHistoryChart history={data} kind="stock" hidden={hidden} threshold={threshold} height="h-56" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Price per piece{data.currency ? `, ${data.currency}` : ""}</p>
              <PartHistoryChart history={data} kind="price" hidden={hidden} height="h-56" />
            </Suspense>
            <HistoryEvents events={data.events} />
          </div>
        ) : status === "ready" ? <p className="text-sm text-muted-foreground">No readings in this timeframe.</p> : null}
      </DialogContent>
    </Dialog>
  );
}

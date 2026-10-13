import { lazy, Suspense, useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupplyMarketHistory } from "@/types/supply";
import { MARKET_COLUMNS } from "./market-model";
import { getSupplyMarketHistory } from "./supply-api";
import { useLoaded } from "./use-loaded";

// Recharts is large, so the chart loads on demand.
const MarketChart = lazy(() => import("./market-chart"));

/** One metric over time, a line per group. Needs at least two stored days to draw anything. */
export function MarketHistory() {
  const [column, setColumn] = useState<(typeof MARKET_COLUMNS)[number]>(MARKET_COLUMNS[0]);
  const fetcher = useCallback((signal: AbortSignal) => getSupplyMarketHistory(column.key, signal), [column.key]);
  const { status, data } = useLoaded<SupplyMarketHistory>(`history:${column.key}`, fetcher, "Could not load the market history");
  const days = new Set((data?.series ?? []).flatMap((line) => line.points.map(([day]) => day))).size;

  return (
    <section aria-label="Over time" className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Over time</h3>
        <div role="group" aria-label="Which figure" className="flex flex-wrap gap-1">
          {MARKET_COLUMNS.map((item) => (
            <Button key={item.key} size="sm" variant={item.key === column.key ? "secondary" : "ghost"} aria-pressed={item.key === column.key} onClick={() => setColumn(item)}>
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      {status === "loading" ? <Skeleton className="h-52 w-full" aria-label="Loading the history" /> : null}
      {status === "ready" && data && days >= 2 ? (
        <>
          <Suspense fallback={<Skeleton className="h-52 w-full" />}>
            <MarketChart series={data.series} column={column} />
          </Suspense>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {data.series.map((line) => <li key={`${line.kind}:${line.scope}`}>{line.scope} ({line.sample} parts)</li>)}
          </ul>
        </>
      ) : null}
      {status === "ready" && days < 2 ? (
        <p className="text-sm text-muted-foreground">A line appears once two days of figures are stored. One is stored a day.</p>
      ) : null}
    </section>
  );
}

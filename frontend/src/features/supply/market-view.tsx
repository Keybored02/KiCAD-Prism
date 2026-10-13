import { useCallback } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupplyMarket } from "@/types/supply";
import { MarketHistory } from "./market-history";
import { MARKET_COLUMNS, marketChange, marketFigure } from "./market-model";
import { getSupplyMarket } from "./supply-api";
import { useLoaded } from "./use-loaded";

/** How the parts this workspace follows do as a group, by manufacturer and by category. Not the market as a whole, and it says so. */
export function MarketView() {
  const fetcher = useCallback((signal: AbortSignal) => getSupplyMarket(signal), []);
  const loaded = useLoaded<SupplyMarket>("market", fetcher, "Could not load the market figures");

  if (loaded.status === "loading") return <Skeleton className="m-4 h-48" aria-label="Loading the market figures" />;
  if (loaded.status === "error" || !loaded.data) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription className="flex items-center justify-between gap-3">
          {loaded.error}
          <Button size="sm" variant="outline" onClick={loaded.retry}>Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }
  const market = loaded.data;

  return (
    <div className="space-y-3 p-4">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Figures over the parts that are watched or on a project BOM, read from the distributors you connect. They describe your own
        parts, not the market, and a manufacturer or category shows only with at least {market.min_sample ?? 3} such parts. One snapshot is kept a day.
      </p>
      {market.scopes.length === 0 ? (
        <p className="text-sm">
          {market.day === null
            ? "Nothing is stored yet. The first snapshot is taken by the next supply run, once at least three parts are followed."
            : "Not enough followed parts for any group yet."}
        </p>
      ) : (
        <div className="overflow-x-auto border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-2">Group</th>
                <th className="p-2 text-right">Parts</th>
                {MARKET_COLUMNS.map((column) => <th key={column.key} className="p-2">{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {market.scopes.map((scope) => (
                <tr key={`${scope.kind}:${scope.scope}`} className="border-t">
                  <th scope="row" className="p-2 text-left font-medium">
                    {scope.scope}
                    {scope.kind === "category" ? <span className="ml-2 text-[10px] font-normal uppercase tracking-wider text-muted-foreground">Category</span> : null}
                  </th>
                  <td className="p-2 text-right tabular-nums">{scope.sample}</td>
                  {MARKET_COLUMNS.map((column) => {
                    const metric = scope.metrics[column.key];
                    const change = marketChange(column, metric);
                    return (
                      <td key={column.key} className="p-2 tabular-nums">
                        {marketFigure(column, metric) || <span className="text-muted-foreground">no data</span>}
                        {change ? <span className="ml-1 text-xs text-muted-foreground">{change}</span> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {market.scopes.length > 0 ? <MarketHistory /> : null}
      {market.day ? (
        <p className="text-xs text-muted-foreground">
          Snapshot of {market.day}{market.compared_with ? `, changes against ${market.compared_with}` : ", nothing older to compare with yet"}.
        </p>
      ) : null}
    </div>
  );
}

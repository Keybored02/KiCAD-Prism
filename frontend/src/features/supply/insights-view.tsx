import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";

const MarketView = lazy(() => import("./market-view").then((module) => ({ default: module.MarketView })));
const PlanningView = lazy(() => import("./planning-view").then((module) => ({ default: module.PlanningView })));

/** Market and Planning, two views of one tab. The address holds which is open. */
export function InsightsView({ view }: { view: "market" | "planning" }) {
  const [, setSearchParams] = useSearchParams();
  const choose = (next: "market" | "planning") => setSearchParams((current) => {
    const updated = new URLSearchParams(current);
    updated.set("insightsView", next);
    return updated;
  });
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div role="group" aria-label="Insights" className="flex shrink-0 gap-1 border-b px-4 py-2">
        <Button size="sm" variant={view === "market" ? "secondary" : "ghost"} aria-pressed={view === "market"} onClick={() => choose("market")}>Market</Button>
        <Button size="sm" variant={view === "planning" ? "secondary" : "ghost"} aria-pressed={view === "planning"} onClick={() => choose("planning")}>Planning</Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={null}>{view === "market" ? <MarketView /> : <PlanningView />}</Suspense>
      </div>
    </div>
  );
}

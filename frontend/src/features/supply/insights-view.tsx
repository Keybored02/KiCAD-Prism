import { lazy, Suspense, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupplyInsightsPage } from "@/types/supply";
import { CollapsibleSection } from "./collapsible-section";
import { DistributorsSection } from "./distributors-section";
import { MarketSection } from "./market-section";
import { getSupplyInsights } from "./supply-api";
import { useLoaded } from "./use-loaded";
import { useSupplyNavigation } from "./use-supply-navigation";

const RunwaySection = lazy(() => import("./runway-section").then((module) => ({ default: module.RunwaySection })));
const PlanningView = lazy(() => import("./planning-view").then((module) => ({ default: module.PlanningView })));

const SECTIONS = [
  { id: "signals", label: "Signals" },
  { id: "runway", label: "Runway" },
  { id: "market", label: "Market" },
  { id: "distributors", label: "Distributors" },
  { id: "planning", label: "Planning" },
] as const;

const jump = (id: string) => document.getElementById(`insights-${id}`)?.scrollIntoView?.({ behavior: "smooth", block: "start" });

/** What the readings add up to across every tracked part, in five sections you can jump between. */
export function InsightsView({ view }: { view: "market" | "planning" }) {
  const [searchParams] = useSearchParams();
  const fetcher = useCallback((signal: AbortSignal) => getSupplyInsights(signal), []);
  const loaded = useLoaded<SupplyInsightsPage>("insights", fetcher, "Could not load the insights");
  const { go, openPart } = useSupplyNavigation();
  const asked = searchParams.get("insightsView");
  const ready = loaded.status === "ready";
  useEffect(() => {
    if (asked && ready) jump(asked);
  }, [asked, ready, view]);

  if (loaded.status === "loading") return <Skeleton className="m-4 h-48" aria-label="Loading the insights" />;
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
  const page = loaded.data;
  const signals = page.market.signals ?? [];
  const openGroup = (name: string) => go("parts", { partsQ: name });

  return (
    <div className="h-full overflow-y-auto">
      <nav aria-label="Insights" className="sticky top-0 z-10 flex flex-wrap gap-1 border-b bg-background px-4 py-2">
        {SECTIONS.filter((item) => item.id !== "signals" || signals.length > 0).map((item) => (
          <Button key={item.id} size="sm" variant="ghost" onClick={() => jump(item.id)}>{item.label}</Button>
        ))}
      </nav>
      <div className="space-y-4 p-4">
        {signals.length > 0 ? (
          <section id="insights-signals" aria-label="Signals" className="scroll-mt-14">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {signals.map((item) => (
                <button key={`${item.scope}:${item.signal}`} type="button" onClick={() => openGroup(item.scope)} className="border border-warning/40 p-3 text-left hover:bg-muted/30">
                  <span className="block text-sm">{item.text}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">See the parts</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        <div id="insights-runway" className="scroll-mt-14">
          <CollapsibleSection id="insights-section-runway" title="Runway" count={page.tracked} startOpen>
            <div className="p-3"><Suspense fallback={<Skeleton className="h-64 w-full" />}><RunwaySection page={page} onOpen={openPart} /></Suspense></div>
          </CollapsibleSection>
        </div>
        <div id="insights-market" className="scroll-mt-14">
          <CollapsibleSection id="insights-section-market" title="Market, your parts" count={page.market.scopes.length} startOpen>
            <div className="p-3"><MarketSection market={page.market} trends={page.market_trends} onOpenGroup={openGroup} /></div>
          </CollapsibleSection>
        </div>
        <div id="insights-distributors" className="scroll-mt-14">
          <CollapsibleSection id="insights-section-distributors" title="Distributors" count={page.distributors.repricing.length} startOpen>
            <div className="p-3"><DistributorsSection distributors={page.distributors} /></div>
          </CollapsibleSection>
        </div>
        <div id="insights-planning" className="scroll-mt-14">
          <CollapsibleSection id="insights-section-planning" title="Planning" count={-1} startOpen>
            <Suspense fallback={<Skeleton className="m-3 h-32" />}><PlanningView /></Suspense>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PartsFilter, SupplyInsightsPage } from "@/types/supply";
import { CollapsibleSection } from "./collapsible-section";
import { ForecastInsightsSection } from "./forecast-insights";
import { LeadAndPricesSection, LifecycleSection, SourcingSection, TradeSection } from "./insights-sections";
import { MarketSection } from "./market-section";
import { getSupplyInsights } from "./supply-api";
import { useLoaded } from "./use-loaded";
import type { User } from "@/types/auth";
import { OpenPartSheet } from "./open-part-sheet";
import { useSupplyNavigation } from "./use-supply-navigation";

const RunwaySection = lazy(() => import("./runway-section").then((module) => ({ default: module.RunwaySection })));

const SECTIONS = [
  { id: "signals", label: "Signals" },
  { id: "sourcing", label: "Sourcing" },
  { id: "lead-times", label: "Lead times and prices" },
  { id: "runway", label: "Stock risk" },
  { id: "market", label: "Market" },
  { id: "forecasts", label: "Forecasts" },
  { id: "trade", label: "Trade" },
  { id: "lifecycle", label: "Compliance" },
] as const;

/** Scrolls the page's own container, not every ancestor: scrollIntoView would also move the app behind it. */
function jump(scroller: HTMLElement | null, id: string) {
  const target = document.getElementById(`insights-${id}`);
  if (!scroller || !target) return;
  const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 56;
  scroller.scrollTo?.({ top: Math.max(0, top), behavior: "smooth" });
}

/** The section on screen: the last one whose top has scrolled to the top of the page. */
function sectionOnScreen(scroller: HTMLElement, ids: readonly string[]): string {
  const top = scroller.getBoundingClientRect().top + 72;
  let current = ids[0];
  for (const id of ids) {
    const element = document.getElementById(`insights-${id}`);
    if (element && element.getBoundingClientRect().top <= top) current = id;
  }
  return current;
}

/** What the readings add up to across every tracked part, in sections you can jump between. */
export function InsightsView({ user = null, active = true }: { user?: User | null; active?: boolean }) {
  const [searchParams] = useSearchParams();
  const fetcher = useCallback((signal: AbortSignal) => getSupplyInsights(signal), []);
  const loaded = useLoaded<SupplyInsightsPage>("insights", fetcher, "Could not load the insights", "supply");
  const { go, openPart } = useSupplyNavigation();
  const asked = searchParams.get("insightsView");
  const scroller = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState("");
  const ready = loaded.status === "ready";
  useEffect(() => {
    if (asked && ready) jump(scroller.current, asked);
  }, [asked, ready]);
  const signalsShown = (loaded.data?.market.signals ?? []).length > 0;
  useEffect(() => {
    const element = scroller.current;
    if (!ready || !element) return undefined;
    const ids = SECTIONS.filter((item) => item.id !== "signals" || signalsShown).map((item) => item.id);
    const update = () => setCurrent(sectionOnScreen(element, ids));
    update();
    element.addEventListener("scroll", update, { passive: true });
    return () => element.removeEventListener("scroll", update);
  }, [ready, signalsShown]);

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
  const openFilter = (filter: PartsFilter) => go("parts", filter ? { partsOnly: filter, partsScope: "watched" } : { partsScope: "watched" });

  return (
    <div ref={scroller} className="themed-scrollbar relative h-full overflow-y-auto">
      <nav aria-label="Insights" className="sticky top-0 z-10 flex flex-wrap gap-1 border-b bg-background px-4 py-2">
        {SECTIONS.filter((item) => item.id !== "signals" || signals.length > 0).map((item) => (
          <Button
            key={item.id} size="sm" variant={current === item.id ? "secondary" : "ghost"} aria-current={current === item.id ? "location" : undefined}
            onClick={() => { setCurrent(item.id); jump(scroller.current, item.id); }}
          >
            {item.label}
          </Button>
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
        <div id="insights-sourcing" className="scroll-mt-14">
          <CollapsibleSection id="insights-section-sourcing" title="Sourcing" count={-1} startOpen>
            <div className="p-3"><SourcingSection page={page} onOpen={openFilter} /></div>
          </CollapsibleSection>
        </div>
        <div id="insights-lead-times" className="scroll-mt-14">
          <CollapsibleSection id="insights-section-lead-times" title="Lead times and prices" count={-1} startOpen>
            <div className="p-3"><LeadAndPricesSection page={page} onOpenPart={openPart} onOpen={openFilter} /></div>
          </CollapsibleSection>
        </div>
        <div id="insights-runway" className="scroll-mt-14">
          <CollapsibleSection id="insights-section-runway" title="Stock risk" count={-1} startOpen>
            <div className="p-3"><Suspense fallback={<Skeleton className="h-64 w-full" />}><RunwaySection page={page} onOpen={openPart} /></Suspense></div>
          </CollapsibleSection>
        </div>
        <div id="insights-market" className="scroll-mt-14">
          <CollapsibleSection id="insights-section-market" title="Market" count={-1} startOpen>
            <div className="p-3"><MarketSection market={page.market} trends={page.market_trends} onOpenGroup={openGroup} /></div>
          </CollapsibleSection>
        </div>
        <div id="insights-forecasts" className="scroll-mt-14">
          <CollapsibleSection id="insights-section-forecasts" title="Forecasts" count={-1} startOpen>
            <div className="p-3"><ForecastInsightsSection onOpenPart={openPart} /></div>
          </CollapsibleSection>
        </div>
        <div id="insights-trade" className="scroll-mt-14">
          <CollapsibleSection id="insights-section-trade" title="Trade" count={-1} startOpen>
            <div className="p-3"><TradeSection page={page} onOpenPart={openPart} onOpen={openFilter} /></div>
          </CollapsibleSection>
        </div>
        <div id="insights-lifecycle" className="scroll-mt-14">
          <CollapsibleSection id="insights-section-lifecycle" title="Compliance" count={-1} startOpen>
            <div className="p-3"><LifecycleSection page={page} onOpen={openFilter} /></div>
          </CollapsibleSection>
        </div>
      </div>
      <OpenPartSheet user={user} active={active} />
    </div>
  );
}

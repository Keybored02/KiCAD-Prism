import { lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BellRing, Boxes, CalendarClock, LayoutDashboard, LineChart, ListChecks, Settings, ShieldAlert, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { canOpenSupply } from "@/lib/roles";
import type { User } from "@/types/auth";

const OverviewView = lazy(() => import("./overview-view").then((module) => ({ default: module.OverviewView })));
const InboxView = lazy(() => import("./inbox-view").then((module) => ({ default: module.InboxView })));
const PartsView = lazy(() => import("./parts-view").then((module) => ({ default: module.PartsView })));
const SupplySettingsDialog = lazy(() => import("./supply-settings-dialog").then((module) => ({ default: module.SupplySettingsDialog })));
const MarketView = lazy(() => import("./market-view").then((module) => ({ default: module.MarketView })));
const PlanningView = lazy(() => import("./planning-view").then((module) => ({ default: module.PlanningView })));
const ReviewView = lazy(() => import("./review-view").then((module) => ({ default: module.ReviewView })));

const VIEWS: ReadonlyArray<{ id: SupplyView; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "parts", label: "Parts", icon: Boxes },
  { id: "inbox", label: "Inbox", icon: BellRing },
  { id: "review", label: "Review", icon: ListChecks },
  { id: "market", label: "Market", icon: LineChart },
  { id: "planning", label: "Planning", icon: CalendarClock },
];

type SupplyView = "overview" | "parts" | "inbox" | "review" | "market" | "planning";

function isSupplyView(value: string | null): value is SupplyView {
  return VIEWS.some((view) => view.id === value);
}

/** The Supply section: stock, matching and sourcing. Tabs are added as they ship. */
export function SupplyWorkspace({ user }: { user: User | null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("supplyView");
  const view: SupplyView = isSupplyView(requested) ? requested : "overview";
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!canOpenSupply(user?.role)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Supply data is not available to your role</p>
        <p className="max-w-md text-sm text-muted-foreground">Designers, QA and administrators can open it.</p>
      </div>
    );
  }

  const setView = (next: SupplyView) => {
    setSearchParams((current) => {
      const updated = new URLSearchParams(current);
      updated.set("section", "supply");
      updated.set("supplyView", next);
      // The open part and the search belong to the Parts tab.
      updated.delete("part");
      updated.delete("partsQ");
      updated.delete("partsScope");
      return updated;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b bg-card pr-3">
      <Tabs
        value={view}
        onValueChange={(next) => { if (isSupplyView(next)) setView(next); }}
        className="gap-0 px-3"
      >
        <TabsList variant="line" className="h-10 gap-2" aria-label="Supply sections">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="gap-2 px-2 text-sm">
              <Icon className="h-4 w-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {user?.role === "admin" ? (
        <Button variant="ghost" size="sm" aria-label="Supply settings" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-4 w-4" />
        </Button>
      ) : null}
      </div>
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
        <div className="min-h-0 flex-1 overflow-hidden">
          {view === "overview" && <OverviewView />}
          {view === "parts" && <PartsView user={user} />}
          {view === "inbox" && <InboxView user={user} />}
          {view === "review" && <ReviewView user={user} />}
          {view === "market" && <MarketView />}
          {view === "planning" && <PlanningView />}
        </div>
      </Suspense>
      {settingsOpen ? (
        <Suspense fallback={null}>
          <SupplySettingsDialog open onOpenChange={setSettingsOpen} />
        </Suspense>
      ) : null}
    </div>
  );
}

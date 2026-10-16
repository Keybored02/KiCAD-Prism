import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Boxes, FolderKanban, LayoutDashboard, LineChart, ListChecks, Plug, ShieldAlert, type LucideIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { canOpenSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import { resolvePlace, type SupplyTab } from "./supply-views";
import { useSigninResult } from "./use-signin-result";

const DashboardView = lazy(() => import("./dashboard-view").then((module) => ({ default: module.DashboardView })));
const PartsView = lazy(() => import("./parts-view").then((module) => ({ default: module.PartsView })));
const InsightsView = lazy(() => import("./insights-view").then((module) => ({ default: module.InsightsView })));
const SupplyConnectorsView = lazy(() => import("./connectors-view").then((module) => ({ default: module.SupplyConnectorsView })));
const ProjectsView = lazy(() => import("./projects-view").then((module) => ({ default: module.ProjectsView })));
const ReviewView = lazy(() => import("./review-view").then((module) => ({ default: module.ReviewView })));

const VIEWS: ReadonlyArray<{ id: SupplyTab; label: string; title: string; icon: LucideIcon }> = [
  { id: "dashboard", label: "Dashboard", title: "Supply Dashboard", icon: LayoutDashboard },
  { id: "parts", label: "Parts", title: "Tracked Parts", icon: Boxes },
  { id: "projects", label: "Projects", title: "Projects", icon: FolderKanban },
  { id: "review", label: "Review", title: "Supply Review", icon: ListChecks },
  { id: "insights", label: "Insights", title: "Supply Insights", icon: LineChart },
  { id: "connectors", label: "Connectors", title: "Distributor Connectors", icon: Plug },
];

function isSupplyView(value: string): value is SupplyTab {
  return VIEWS.some((view) => view.id === value);
}

/** The Supply section: stock, matching and sourcing. Tabs are added as they ship. */
export function SupplyWorkspace({ user }: { user: User | null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  // Old addresses (overview, inbox, market, planning, bom-file) lead to the tab that took them over.
  const place = resolvePlace(searchParams.get("supplyView"), searchParams.get("insightsView"), searchParams.get("tool"));
  const view = place.tab;
  const current = VIEWS.find((item) => item.id === view) ?? VIEWS[0];
  // The Connectors tab puts its buttons here, on the right of the page title.
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  // A DigiKey sign-in returns here, on the Connectors tab, with its result in the address.
  useSigninResult();
  // A tab stays mounted once opened, so switching back shows it as it was instead of loading it again.
  const [opened, setOpened] = useState<SupplyTab[]>([view]);
  useEffect(() => { setOpened((current) => (current.includes(view) ? current : [...current, view])); }, [view]);
  const mounted = opened.includes(view) ? opened : [...opened, view];

  if (!canOpenSupply(user?.role)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Supply data is not available to your role</p>
        <p className="max-w-md text-sm text-muted-foreground">Designers, QA and administrators can open it.</p>
      </div>
    );
  }

  const setView = (next: SupplyTab) => {
    setSearchParams((current) => {
      const updated = new URLSearchParams(current);
      updated.set("section", "supply");
      updated.set("supplyView", next);
      // The open part is drawn by whichever tab is shown; the search and scope stay with the Parts tab, which keeps them.
      updated.delete("part");
      updated.delete("tool");
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
      </div>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <current.icon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{current.title}</h2>
        </div>
        <div ref={setHeaderSlot} className="flex items-center gap-2" />
      </header>
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
        <div className="min-h-0 flex-1 overflow-hidden">
          {mounted.map((id) => (
            <div key={id} hidden={id !== view} className="h-full">
              {id === "dashboard" && <DashboardView user={user} />}
              {id === "parts" && <PartsView user={user} active={view === "parts"} headerSlot={view === "parts" ? headerSlot : null} />}
              {id === "projects" && <ProjectsView user={user} active={view === "projects"} />}
              {id === "review" && <ReviewView user={user} />}
              {id === "insights" && <InsightsView view={place.insight} />}
              {id === "connectors" && <SupplyConnectorsView user={user} headerSlot={view === "connectors" ? headerSlot : null} />}
            </div>
          ))}
        </div>
      </Suspense>
    </div>
  );
}

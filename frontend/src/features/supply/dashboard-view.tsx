import { useCallback, useState } from "react";
import { AlertTriangle, Ban, BellRing, Eye, Hourglass, ListChecks, PackageX } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/types/auth";
import type { PartsFilter, SupplyDashboard, SupplyOverview, SupplyReviewQueue, SupplyStatus } from "@/types/supply";
import { AdminStrip } from "./admin-strip";
import { AlertList } from "./dashboard-alerts";
import { HoldersCard, RunwayCard, StatusBarCard } from "./dashboard-charts";
import { AlertsByDayCard, ProjectCostCard } from "./dashboard-lazy-cards";
import { TileButton, type Tile } from "./dashboard-tiles";
import { RecentChanges } from "./recent-changes";
import { getSupplyDashboard, getSupplyReviewQueue } from "./supply-api";
import { formatAgo } from "./supply-format";
import { useLoaded } from "./use-loaded";
import { useSupplyNavigation } from "./use-supply-navigation";
import { useSupplyOverview } from "./use-supply-parts";

const RUNWAY_FILTER: Record<keyof SupplyDashboard["runway"], PartsFilter> = {
  out_now: "out_of_stock", runs_out_2w: "runs_out_2w", runs_out_8w: "runs_out_8w", runs_out_later: "runs_out_later", steady: "steady", few_readings: "few_readings",
};
const HOLDERS_FILTER: Record<keyof SupplyDashboard["holders"], PartsFilter> = {
  none: "out_of_stock", one: "one_distributor", two: "", three_plus: "", unknown: "few_readings",
};

function reviewCountOf(review: SupplyReviewQueue | null | undefined): number | undefined {
  if (!review) return undefined;
  const approve = review.to_approve ? review.to_approve.waivers.length + review.to_approve.alternates.length : 0;
  return review.counts.unresolved + review.counts.near + review.counts.aliases + (review.choices?.length ?? 0) + approve;
}

/** What across the workspace needs a person: counts with their trend, charts that open the parts behind them, then the alerts. */
export function DashboardView({ user }: { user: User | null }) {
  const overview = useSupplyOverview();
  const dashboardFetcher = useCallback((signal: AbortSignal) => getSupplyDashboard(signal), []);
  const dashboard = useLoaded<SupplyDashboard>("dashboard", dashboardFetcher, "Could not load the dashboard");
  const reviewFetcher = useCallback((signal: AbortSignal) => getSupplyReviewQueue(signal), []);
  const review = useLoaded<SupplyReviewQueue>("dashboard-review", reviewFetcher, "Could not load the review queue");
  const { go, openPart } = useSupplyNavigation();
  const [alertKind, setAlertKind] = useState("");
  const data = dashboard.data;
  const parts = (only: PartsFilter, scope?: string) => () => go("parts", { ...(only ? { partsOnly: only } : {}), ...(scope ? { partsScope: scope } : {}) });
  const history = (name: string) => data?.figure_history[name];
  const tiles: Tile[] = [
    { label: "Tracked", value: data?.figures.watched, icon: Eye, history: history("watched"), onClick: parts("") },
    { label: "At risk", value: data?.figures.at_risk, icon: AlertTriangle, bad: true, history: history("at_risk"), onClick: parts("at_risk") },
    { label: "Out of stock", value: data?.figures.out_of_stock, icon: PackageX, bad: true, history: history("out_of_stock"), onClick: parts("out_of_stock") },
    { label: "End of life", value: data?.figures.lifecycle, icon: Ban, bad: true, history: history("lifecycle"), onClick: parts("lifecycle") },
    { label: "Open alerts", value: data?.figures.open_alerts, icon: BellRing, bad: true, history: history("open_alerts"), onClick: () => document.getElementById("dashboard-alerts")?.scrollIntoView?.() },
    { label: "Waiting for room", value: data?.figures.waiting, icon: Hourglass, history: history("waiting"), onClick: parts("", "waiting") },
    { label: "Needs you", value: reviewCountOf(review.data), icon: ListChecks, onClick: () => go("review") },
  ];
  const openStatus = (status: SupplyStatus) => parts(status === "ok" || status === "unknown" ? "" : "at_risk")();

  return (
    <div className="relative h-full overflow-y-auto p-4">
      <div className="space-y-6">
        {user?.role === "admin" ? <AdminStrip waiting={data?.figures.waiting ?? 0} /> : null}
        {dashboard.status === "loading" ? <Skeleton className="h-24 w-full" aria-label="Loading the dashboard" /> : null}
        {dashboard.status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-3">
              {dashboard.error}
              <Button size="sm" variant="outline" onClick={dashboard.retry}>Retry</Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {dashboard.status === "ready" && data ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
              {tiles.filter((tile) => tile.value !== undefined).map((tile) => <TileButton key={tile.label} tile={tile} />)}
            </div>
            {overview.data ? <p className="text-xs text-muted-foreground">{dataAge(overview.data)}</p> : null}
            <div className="grid gap-3 lg:grid-cols-2">
              <StatusBarCard statuses={data.statuses} onOpen={openStatus} />
              <RunwayCard runway={data.runway} onOpen={(key) => parts(RUNWAY_FILTER[key])()} />
              <HoldersCard holders={data.holders} onOpen={(key) => parts(HOLDERS_FILTER[key])()} />
              <AlertsByDayCard days={data.alerts_by_day} onKind={(kind) => { setAlertKind(kind); document.getElementById("dashboard-alerts")?.scrollIntoView?.(); }} />
              {data.project_costs.length > 0 ? <ProjectCostCard projects={data.project_costs} /> : null}
            </div>
          </>
        ) : null}
        <AlertList user={user} overview={overview.data} kind={alertKind} onKind={setAlertKind} onOpenPart={openPart} />
        {overview.data && overview.data.recent_changes.length > 0 ? (
          <details>
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent changes</summary>
            <div className="mt-2"><RecentChanges changes={overview.data.recent_changes} onOpenPart={openPart} /></div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function dataAge({ data_age: age, figures }: SupplyOverview): string {
  if (!age.newest) return figures.watched ? "Nothing has been read yet." : "";
  return `Latest read ${formatAgo(age.newest)}. The part read longest ago: ${formatAgo(age.oldest)}.`;
}

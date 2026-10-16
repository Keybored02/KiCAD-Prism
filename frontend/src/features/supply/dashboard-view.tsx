import { useCallback, useState } from "react";
import { AlertTriangle, BellRing, Ban, Eye, Hourglass, ListChecks, PackageOpen, PackageX, type LucideIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { canEditSupply } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { User } from "@/types/auth";
import type { PartsFilter, SupplyOverview, SupplyReviewQueue } from "@/types/supply";
import { AlertRow } from "./alert-row";
import { RecentChanges } from "./recent-changes";
import { acknowledgeSupplyAlert, getSupplyReviewQueue, snoozeSupplyAlert } from "./supply-api";
import { formatAgo } from "./supply-format";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";
import { usePackagingWaiting } from "./use-packaging-waiting";
import { useSupplyNavigation } from "./use-supply-navigation";
import { useSupplyAlerts, useSupplyOverview, useSupplyPartsList } from "./use-supply-parts";

interface Tile {
  label: string;
  value: number | undefined;
  icon: LucideIcon;
  bad?: boolean;
  onClick: () => void;
}

/** What across the workspace needs a person: counts that open the place that deals with them, then one list of alerts. */
export function DashboardView({ user }: { user: User | null }) {
  const overview = useSupplyOverview();
  const alerts = useAlertList(user);
  const { go, openPart } = useSupplyNavigation();
  const waiting = useSupplyPartsList("waiting", "");
  const picks = usePackagingWaiting();
  const reviewFetcher = useCallback((signal: AbortSignal) => getSupplyReviewQueue(signal), []);
  const review = useLoaded<SupplyReviewQueue>("dashboard-review", reviewFetcher, "Could not load the review queue");
  const figures = overview.data?.figures;
  const parts = (only: PartsFilter, scope?: string) => () => go("parts", { ...(only ? { partsOnly: only } : {}), ...(scope ? { partsScope: scope } : {}) });
  const reviewCount = review.data ? review.data.counts.unresolved + review.data.counts.near + review.data.counts.aliases + (review.data.choices?.length ?? 0) : undefined;
  const tiles: Tile[] = [
    { label: "Tracked", value: figures?.watched, icon: Eye, onClick: parts("") },
    { label: "At risk", value: figures?.at_risk, icon: AlertTriangle, bad: true, onClick: parts("at_risk") },
    { label: "Out of stock", value: figures?.out_of_stock, icon: PackageX, bad: true, onClick: parts("out_of_stock") },
    { label: "End of life", value: figures?.lifecycle, icon: Ban, bad: true, onClick: parts("lifecycle") },
    { label: "Open alerts", value: overview.data?.open_alerts, icon: BellRing, bad: true, onClick: () => document.getElementById("dashboard-alerts")?.scrollIntoView?.() },
    { label: "Waiting for room", value: waiting.data?.total, icon: Hourglass, onClick: parts("", "waiting") },
    { label: "Packaging picks", value: picks.items.length, icon: PackageOpen, onClick: () => go("review") },
    { label: "Review queue", value: reviewCount, icon: ListChecks, onClick: () => go("review") },
  ];

  return (
    <div className="relative h-full overflow-y-auto p-4">
      <div className="space-y-6">
        {overview.status === "loading" ? <Skeleton className="h-24 w-full" aria-label="Loading the dashboard" /> : null}
        {overview.status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-3">
              {overview.error}
              <Button size="sm" variant="outline" onClick={overview.retry}>Retry</Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {overview.status === "ready" && overview.data ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tiles.filter((tile) => tile.value !== undefined).map((tile) => <TileButton key={tile.label} tile={tile} />)}
            </div>
            <p className="text-xs text-muted-foreground">{dataAge(overview.data)}</p>
          </>
        ) : null}
        <AlertList alerts={alerts} overview={overview.data} onOpenPart={openPart} />
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

function TileButton({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  const value = tile.value ?? 0;
  return (
    <button type="button" onClick={tile.onClick} className="flex flex-col gap-1 border p-3 text-left hover:bg-muted/30" title={tile.label}>
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"><Icon aria-hidden className="h-3.5 w-3.5" />{tile.label}</span>
      <span className={cn("text-2xl font-semibold tabular-nums", tile.bad && value > 0 && "text-destructive")}>{value.toLocaleString()}</span>
    </button>
  );
}

function dataAge({ data_age: age, figures }: SupplyOverview): string {
  if (!age.newest) return figures.watched ? "Nothing has been read yet." : "";
  return `Latest read ${formatAgo(age.newest)}. The part read longest ago: ${formatAgo(age.oldest)}.`;
}

function useAlertList(user: User | null) {
  const [showCleared, setShowCleared] = useState(false);
  const loaded = useSupplyAlerts(showCleared);
  const { busy, error, run } = useConnectorSubmit();
  const act = (action: () => Promise<void>) => void run(async () => { await action(); await loaded.refresh(); });
  return { ...loaded, showCleared, setShowCleared, busy, actionError: error, act, canAct: canEditSupply(user?.role) };
}

function AlertList({ alerts, overview, onOpenPart }: { alerts: ReturnType<typeof useAlertList>; overview: SupplyOverview | null | undefined; onOpenPart: (id: string) => void }) {
  const { status, data, error, retry, showCleared, setShowCleared, busy, actionError, act, canAct } = alerts;
  return (
    <section id="dashboard-alerts" aria-label="Alerts" className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alerts</h3>
        <span className="flex items-center gap-2">
          <Checkbox id="inbox-cleared" checked={showCleared} onCheckedChange={(checked) => setShowCleared(checked === true)} />
          <Label htmlFor="inbox-cleared" className="font-normal">Show cleared</Label>
        </span>
      </div>
      {status === "loading" ? <Skeleton className="h-32 w-full" aria-label="Loading alerts" /> : null}
      {status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={retry}>Retry</Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {actionError ? <Alert variant="destructive"><AlertDescription>{actionError}</AlertDescription></Alert> : null}
      {status === "ready" && data ? (
        data.length === 0 ? (
          <div className="border border-dashed p-6 text-sm text-muted-foreground">{emptyText(overview, showCleared)}</div>
        ) : (
          <ul className="border">
            {data.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                canAct={canAct}
                busy={busy}
                onOpenPart={onOpenPart}
                onAcknowledge={(id) => act(() => acknowledgeSupplyAlert(id))}
                onSnooze={(id, hours) => act(() => snoozeSupplyAlert(id, hours))}
              />
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}

function emptyText(overview: SupplyOverview | null | undefined, showCleared: boolean): string {
  if (showCleared) return "Nothing here yet.";
  if (!overview) return "Nothing needs you.";
  if (overview.connectors === 0) return "No distributor is connected. Add one under Connectors, and Prism can start reading stock.";
  if (overview.figures.watched === 0) return "No parts are tracked yet. Track a part in Parts and it is read regularly.";
  if (overview.figures.no_data === overview.figures.watched) return "Tracked parts are waiting for their first read.";
  return "Nothing needs you. Alerts appear here after a part has been read twice.";
}

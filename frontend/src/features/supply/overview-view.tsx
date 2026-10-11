import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SupplyOverview } from "@/types/supply";
import { PartsTable } from "./parts-table";
import { formatAgo } from "./supply-format";
import { useSupplyNavigation } from "./use-supply-navigation";
import { useSupplyOverview } from "./use-supply-parts";

/** How the watchlist stands and what needs a person. */
export function OverviewView() {
  const { status, data, error, retry } = useSupplyOverview();
  const { go, openPart } = useSupplyNavigation();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Supply</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Overview</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            What is about to run out, what changed, and whether Prism is keeping up with its distributors.
          </p>
        </div>

        {status === "loading" ? <Skeleton className="h-48 w-full" aria-label="Loading the overview" /> : null}
        {status === "error" ? (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-3">
              {error}
              <Button size="sm" variant="outline" onClick={retry}>Retry</Button>
            </AlertDescription>
          </Alert>
        ) : null}
        {status === "ready" && data ? (
          <>
            <Figures overview={data} onParts={() => go("parts")} onInbox={() => go("inbox")} />
            <p className="text-xs text-muted-foreground">{dataAge(data)}</p>
            <NeedsAttention overview={data} onOpenPart={openPart} onParts={() => go("parts")} />
            <Quota quota={data.quota} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function dataAge({ data_age: age, figures }: SupplyOverview): string {
  if (!age.newest) return figures.watched ? "Nothing has been read yet." : "";
  return `Latest read ${formatAgo(age.newest)}. The part read longest ago: ${formatAgo(age.oldest)}.`;
}

function Figures({ overview, onParts, onInbox }: { overview: SupplyOverview; onParts: () => void; onInbox: () => void }) {
  const { figures, open_alerts: alerts } = overview;
  const tiles: Array<{ label: string; value: number; tone?: boolean; onClick?: () => void }> = [
    { label: "Watched", value: figures.watched, onClick: onParts },
    { label: "At risk", value: figures.at_risk, tone: figures.at_risk > 0, onClick: onParts },
    { label: "Out of stock", value: figures.out_of_stock, tone: figures.out_of_stock > 0 },
    { label: "End of life", value: figures.lifecycle, tone: figures.lifecycle > 0 },
    { label: "Open alerts", value: alerts, tone: alerts > 0, onClick: onInbox },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => {
        const body = (
          <>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{tile.label}</span>
            <span className={cn("text-2xl font-semibold tabular-nums", tile.tone && "text-destructive")}>{tile.value.toLocaleString()}</span>
          </>
        );
        return tile.onClick ? (
          <button key={tile.label} type="button" onClick={tile.onClick} className="flex flex-col gap-1 rounded-lg border p-3 text-left hover:bg-muted/40">
            {body}
          </button>
        ) : (
          <div key={tile.label} className="flex flex-col gap-1 rounded-lg border p-3">{body}</div>
        );
      })}
    </div>
  );
}

function NeedsAttention({ overview, onOpenPart, onParts }: { overview: SupplyOverview; onOpenPart: (partId: string) => void; onParts: () => void }) {
  const { needs_attention: items, figures, connectors } = overview;
  return (
    <section aria-label="Needs attention" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needs attention</h3>
      {items.length > 0 ? (
        <>
          <PartsTable items={items} selectedId={null} onOpen={onOpenPart} />
          {figures.at_risk > items.length ? (
            <Button size="sm" variant="link" className="px-0" onClick={onParts}>See all {figures.at_risk.toLocaleString()} in Parts</Button>
          ) : null}
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          {connectors === 0
            ? "No distributor is connected. Add one in Library Manager, under Connectors, and Prism can start reading stock."
            : figures.watched === 0
              ? "No parts are watched yet. Watch a part in Parts and it is read regularly."
              : figures.no_data === figures.watched
                ? "Watched parts are waiting for their first read."
                : "Nothing needs attention."}
        </div>
      )}
    </section>
  );
}

function Quota({ quota }: { quota: SupplyOverview["quota"] }) {
  if (quota.length === 0) return null;
  return (
    <section aria-label="Calls today" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Calls today</h3>
      <ul className="space-y-2">
        {quota.map((item) => {
          const share = item.budget ? Math.min(100, Math.round((100 * item.spent) / item.budget)) : 0;
          return (
            <li key={item.connector_id} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span>{item.name}{item.paused ? <span className="ml-2 text-xs text-destructive">Paused</span> : null}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {item.metered && item.budget !== null ? `${item.spent.toLocaleString()} of ${item.budget.toLocaleString()}` : "No call limit"}
                </span>
              </div>
              {item.metered && item.budget ? (
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${share}% of today's calls used`}>
                  <div className={cn("h-full", share >= 90 ? "bg-warning" : "bg-primary")} style={{ width: `${share}%` }} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

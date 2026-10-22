import { lazy, Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PartsFilter, SupplyInsightsPage } from "@/types/supply";
import { ChartCard } from "./chart-card";
import { LoadMore } from "./load-more";
import { PartsTable } from "./parts-table";
import { useSupplyPartsFeed } from "./use-supply-parts";

const RunwayScatter = lazy(() => import("./runway-scatter"));

const KINDS: Array<{ key: Exclude<PartsFilter, "">; label: string }> = [
  { key: "draining", label: "Draining" },
  { key: "restock_late", label: "Restock overdue" },
  { key: "lead_up", label: "Lead time up" },
  { key: "often_out", label: "Often out" },
  { key: "unusual_drop", label: "Unusual drop" },
];

function KindList({ kind, onOpen }: { kind: Exclude<PartsFilter, "">; onOpen: (partId: string) => void }) {
  const { status, items, hasMore, loadingMore, loadMore } = useSupplyPartsFeed("watched", "", kind);
  if (status === "loading") return <Skeleton className="h-24 w-full" aria-label="Loading parts" />;
  if (items.length === 0) return <p className="border border-dashed p-4 text-sm text-muted-foreground">No part has this finding.</p>;
  return (
    <>
      <PartsTable items={items} selectedId={null} onOpen={onOpen} />
      <LoadMore hasMore={hasMore} loading={loadingMore} onLoad={() => void loadMore()} />
    </>
  );
}

/** Which parts run out before an order could arrive, and the findings across every tracked part, each a list. */
export function RunwaySection({ page, onOpen }: { page: SupplyInsightsPage; onOpen: (partId: string) => void }) {
  const [kind, setKind] = useState<Exclude<PartsFilter, "">>("draining");
  const short = page.scatter.filter((point) => point.days_to_zero < point.lead_days);
  const missing = page.scatter_missing;
  return (
    <div className="space-y-3">
      <ChartCard
        title="Stock left against lead time"
        info="Days of stock left is projected from each part's own readings; lead time is the shortest any distributor quotes. A dot above the line runs out before an order could arrive."
        answer={page.scatter.length === 0 ? "Not enough readings yet" : short.length === 0 ? "No part runs out before an order could arrive" : `${short.length} ${short.length === 1 ? "part runs" : "parts run"} out before an order could arrive`}
      >
        {page.scatter.length > 0 ? <Suspense fallback={<Skeleton className="h-64 w-full" />}><RunwayScatter points={page.scatter} onOpen={onOpen} /></Suspense> : null}
        {missing.no_rate + missing.no_lead_time > 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Not drawn: {missing.no_rate} without a falling rate yet{missing.no_lead_time ? `, ${missing.no_lead_time} without a quoted lead time` : ""}.
          </p>
        ) : null}
      </ChartCard>
      <div role="group" aria-label="Finding" className="flex flex-wrap gap-1">
        {KINDS.map((item) => (
          <Button key={item.key} size="sm" variant={kind === item.key ? "secondary" : "ghost"} aria-pressed={kind === item.key} onClick={() => setKind(item.key)}>
            {item.label} <span className="ml-1 tabular-nums text-muted-foreground">{page.counts[item.key] ?? 0}</span>
          </Button>
        ))}
      </div>
      <KindList key={kind} kind={kind} onOpen={onOpen} />
    </div>
  );
}

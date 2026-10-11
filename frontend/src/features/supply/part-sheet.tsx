import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { canEditSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import type { SupplyPartDetail } from "@/types/supply";
import { InsightPanel } from "./insight-panel";
import { ListingTable } from "./listing-table";
import { Sparkline } from "./sparkline";
import { StatusDot } from "./status-dot";
import { formatStock, LIFECYCLE_LABEL, STATUS_LABEL } from "./supply-format";
import { useSupplyPart } from "./use-supply-parts";
import { WatchSettings } from "./watch-settings";

interface PartSheetProps {
  partId: string | null;
  user: User | null;
  onClose: () => void;
  /** Called after a watch changes, so the list behind the sheet can reload. */
  onWatchChanged: () => void;
}

/** One part: its stock and history, its watch, and every listing behind the numbers. */
export function PartSheet({ partId, user, onClose, onWatchChanged }: PartSheetProps) {
  return (
    <Sheet open={partId !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {partId ? <PartBody key={partId} partId={partId} user={user} onWatchChanged={onWatchChanged} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function PartBody({ partId, user, onWatchChanged }: { partId: string; user: User | null; onWatchChanged: () => void }) {
  const { status, data, error, retry, refresh } = useSupplyPart(partId);
  const changed = async () => {
    await refresh();
    onWatchChanged();
  };

  if (status === "loading") {
    return (
      <>
        <SheetHeader><SheetTitle>Loading part</SheetTitle><SheetDescription>One moment.</SheetDescription></SheetHeader>
        <Skeleton className="mt-4 h-40 w-full" aria-label="Loading the part" />
      </>
    );
  }
  if (status === "error" || !data) {
    return (
      <>
        <SheetHeader><SheetTitle>Part</SheetTitle><SheetDescription>It could not be loaded.</SheetDescription></SheetHeader>
        <Alert variant="destructive" className="mt-4">
          <AlertDescription className="flex items-center justify-between gap-3">
            {error}
            <Button size="sm" variant="outline" onClick={retry}>Retry</Button>
          </AlertDescription>
        </Alert>
      </>
    );
  }
  return <PartDetail detail={data} canEdit={canEditSupply(user?.role)} onChanged={changed} />;
}

function PartDetail({ detail, canEdit, onChanged }: { detail: SupplyPartDetail; canEdit: boolean; onChanged: () => Promise<void> }) {
  const values = detail.history.map((point) => point.stock);
  const low = values.length ? Math.min(...values) : null;
  const high = values.length ? Math.max(...values) : null;

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <StatusDot status={detail.status} />
          {detail.part.mpn}
        </SheetTitle>
        <SheetDescription>
          {detail.part.manufacturer}. {STATUS_LABEL[detail.status]}.
        </SheetDescription>
      </SheetHeader>

      <section aria-label="Stock" className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">In stock</p>
            <p className="text-2xl font-semibold tabular-nums">{formatStock(detail.stock.total)}</p>
          </div>
          <Badge variant={detail.lifecycle === "active" || detail.lifecycle === "unknown" ? "outline" : "warning"}>
            {LIFECYCLE_LABEL[detail.lifecycle]}
          </Badge>
        </div>
        {detail.problem_text ? <p role="alert" className="text-sm text-destructive">{detail.problem_text}</p> : null}
        {detail.stock.by_connector.length > 1 ? (
          <p className="text-xs text-muted-foreground">
            {detail.stock.by_connector.map((item) => `${item.connector_name} ${item.stock.toLocaleString()}`).join(", ")}
          </p>
        ) : null}
        {values.length > 1 ? (
          <div className="flex items-center gap-3">
            <Sparkline values={values} label="Stock over the last 90 days" />
            <p className="text-xs text-muted-foreground">
              {values.length} days. Low {low?.toLocaleString()}, high {high?.toLocaleString()}.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">History builds up as the part is read.</p>
        )}
      </section>

      <InsightPanel insight={detail.insight} />

      <section aria-label="Watch" className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Watch</h3>
        <WatchSettings part={detail.part} watch={detail.watch} canEdit={canEdit} onChanged={onChanged} />
      </section>

      <section aria-label="Listings" className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Listings ({detail.listings.length})</h3>
        <ListingTable listings={detail.listings} />
      </section>
    </div>
  );
}

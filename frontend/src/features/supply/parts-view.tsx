import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { Eye, FileSpreadsheet, PackageSearch, X } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PermissionHint } from "@/components/ui/permission-hint";
import { Skeleton } from "@/components/ui/skeleton";
import { canEditSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import type { PartsFilter, PartsScope } from "@/types/supply";
import { BomFileView } from "./bom-file-view";
import { PartSheet } from "./part-sheet";
import { refreshSupplyUsage } from "./supply-api";
import { LoadMore } from "./load-more";
import { PartsTable } from "./parts-table";
import { useSupplyPartsFeed } from "./use-supply-parts";
import { SearchBox } from "./search-box";
import { ReadProjectBomsButton } from "./read-project-boms-button";
import { SeedFromCatalogButton } from "./seed-from-catalog-button";
import { TrackingRoomLine } from "./tracking-room";
import { WatchPartDialog } from "./watch-part-dialog";

const FILTER_LABEL: Record<Exclude<PartsFilter, "">, string> = {
  at_risk: "At risk",
  out_of_stock: "Out of stock",
  lifecycle: "End of life",
  runs_out_2w: "Runs out within 2 weeks",
  runs_out_8w: "Runs out in 2 to 8 weeks",
  runs_out_later: "Runs out later",
  steady: "Steady or rising",
  few_readings: "Too few readings",
  draining: "Draining",
  restock_late: "Restock overdue",
  often_out: "Often out of stock",
  one_distributor: "One distributor holds it",
  lead_up: "Lead time growing",
  unusual_drop: "Unusual drop",
  price_moving: "Price moving",
  likely_out_4w: "Likely out within 4 weeks",
  likely_out_8w: "Likely out within 8 weeks",
};

const SCOPES: ReadonlyArray<{ id: PartsScope; label: string }> = [
  { id: "followed", label: "Tracked and in projects" },
  { id: "watched", label: "Tracked" },
  { id: "tier1", label: "Tier 1" },
  { id: "tier2", label: "Tier 2" },
  { id: "waiting", label: "Waiting for room" },
  { id: "pick", label: "Pick a packaging" },
  { id: "in_use", label: "In use" },
  { id: "all", label: "All known" },
];

/** Parts Prism knows about, with their stock. The URL holds the scope, search and open part. */
export function PartsView({ user, headerSlot, active = true }: { user: User | null; headerSlot?: HTMLElement | null; active?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedScope = searchParams.get("partsScope");
  const scope: PartsScope = SCOPES.some((item) => item.id === requestedScope) ? (requestedScope as PartsScope) : "followed";
  const query = searchParams.get("partsQ") ?? "";
  const requestedOnly = searchParams.get("partsOnly");
  const only: PartsFilter = requestedOnly && requestedOnly in FILTER_LABEL ? (requestedOnly as PartsFilter) : "";
  // The part sheet belongs to the tab being shown; a tab kept behind it draws none.
  const openPart = active ? searchParams.get("part") : null;
  const canEdit = canEditSupply(user?.role);
  const [watching, setWatching] = useState(false);
  const { status, data, items, total, hasMore, loadingMore, loadMore, error, retry, refresh, forecastState } = useSupplyPartsFeed(scope, query, only);

  // Where parts are used comes from project BOMs read earlier; bring it up to date when the scope is chosen.
  useEffect(() => {
    if (scope !== "in_use") return;
    void refreshSupplyUsage().then(() => refresh()).catch(() => undefined);
    // `refresh` changes with the query; the usage read is for entering the scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const setParams = (changes: Record<string, string | null>) => {
    setSearchParams((current) => {
      const updated = new URLSearchParams(current);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") updated.delete(key);
        else updated.set(key, value);
      }
      return updated;
    });
  };

  const actions = (
    <>
      {canEdit ? <SeedFromCatalogButton onDone={() => void refresh()} /> : null}
      <Button variant="outline" onClick={() => setParams({ tool: "bom-file" })}>
        <FileSpreadsheet className="h-4 w-4" />Check a BOM file
      </Button>
      <PermissionHint blocked={!canEdit} action="track parts" allowedRoles={["designer", "admin"]}>
        <Button disabled={!canEdit} onClick={() => setWatching(true)}>
          <Eye className="h-4 w-4" />Track a part
        </Button>
      </PermissionHint>
    </>
  );

  return (
    <div className="relative h-full overflow-y-auto p-4">
      <div className="space-y-5">
        {headerSlot === undefined ? <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div> : headerSlot ? createPortal(actions, headerSlot) : null}

        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Which parts" className="flex gap-1">
            {SCOPES.map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={scope === item.id ? "secondary" : "ghost"}
                aria-pressed={scope === item.id}
                onClick={() => setParams({ partsScope: item.id === "followed" ? null : item.id })}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <SearchBox key={query} initial={query} onSearch={(text) => setParams({ partsQ: text })} />
          {only ? (
            <Button size="sm" variant="secondary" onClick={() => setParams({ partsOnly: null })} aria-label={`Showing only ${FILTER_LABEL[only]}. Show all`}>
              {FILTER_LABEL[only]}<X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
        {scope === "followed" || scope === "watched" ? <TrackingRoomLine /> : null}

        {status === "loading" ? <Skeleton className="h-48 w-full" aria-label="Loading parts" /> : null}
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
            {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
            {items.length === 0 ? (
              <EmptyState scope={scope} searching={query !== "" || only !== ""} canEdit={canEdit} onWatch={() => setWatching(true)} />
            ) : (
              <>
                <PartsTable items={items} selectedId={openPart} onOpen={(partId) => setParams({ part: partId })} forecastState={forecastState} />
                <LoadMore hasMore={hasMore} loading={loadingMore} onLoad={() => void loadMore()} />
                <p className="text-xs text-muted-foreground">{`${total.toLocaleString()} ${total === 1 ? "part" : "parts"}`}</p>
              </>
            )}
          </>
        ) : null}
      </div>

      <Dialog open={searchParams.get("tool") === "bom-file"} onOpenChange={(next) => { if (!next) setParams({ tool: null }); }}>
        <DialogContent className="w-[min(95vw,72rem)] sm:max-w-none">
          <DialogHeader>
            <DialogTitle>Check a BOM File</DialogTitle>
            <DialogDescription>A CSV with a part number or LCSC number column. Nothing is saved.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-y-auto"><BomFileView /></div>
        </DialogContent>
      </Dialog>
      <PartSheet partId={openPart} user={user} onClose={() => setParams({ part: null })} onWatchChanged={() => void refresh()} />
      <WatchPartDialog
        open={watching}
        onOpenChange={setWatching}
        onWatched={(watch) => {
          void refresh();
          setParams({ part: watch.part_id });
          toast.success(`Watching ${watch.mpn}`);
        }}
      />
    </div>
  );
}

function EmptyState({ scope, searching, canEdit, onWatch }: { scope: PartsScope; searching: boolean; canEdit: boolean; onWatch: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 border border-dashed p-10 text-center">
      <PackageSearch className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">{searching ? "No parts match" : scope === "watched" || scope === "followed" ? "No tracked parts yet" : scope === "in_use" ? "No parts in use yet" : "No parts yet"}</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {searching
          ? "Try a shorter part number or another manufacturer."
          : scope === "watched" || scope === "followed"
            ? "Track a part, or track a project, to have its stock read regularly."
            : scope === "in_use"
              ? "No project BOM that Prism has read uses a part it knows. Open a project BOM, then watch its parts."
              : "Parts appear here once they are watched or matched."}
      </p>
      {!searching && (scope === "watched" || scope === "followed") && canEdit ? <Button size="sm" onClick={onWatch}>Track a part</Button> : null}
      {!searching && scope === "in_use" && canEdit ? <ReadProjectBomsButton /> : null}
    </div>
  );
}

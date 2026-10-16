import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, FileSpreadsheet, PackageSearch, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionHint } from "@/components/ui/permission-hint";
import { Skeleton } from "@/components/ui/skeleton";
import { canEditSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import type { PartsFilter, PartsScope } from "@/types/supply";
import { BomFileView } from "./bom-file-view";
import { PartSheet } from "./part-sheet";
import { PartsTable } from "./parts-table";
import { refreshSupplyUsage } from "./supply-api";
import { useSupplyPartsList } from "./use-supply-parts";
import { ReadProjectBomsButton } from "./read-project-boms-button";
import { SeedFromCatalogButton } from "./seed-from-catalog-button";
import { TrackingRoomLine } from "./tracking-room";
import { WatchPartDialog } from "./watch-part-dialog";

const FILTER_LABEL: Record<Exclude<PartsFilter, "">, string> = {
  at_risk: "At risk",
  out_of_stock: "Out of stock",
  lifecycle: "End of life",
};

const SCOPES: ReadonlyArray<{ id: PartsScope; label: string }> = [
  { id: "watched", label: "Tracked" },
  { id: "tier1", label: "Tier 1" },
  { id: "tier2", label: "Tier 2" },
  { id: "waiting", label: "Waiting for room" },
  { id: "pick", label: "Pick a packaging" },
  { id: "in_use", label: "In use" },
  { id: "all", label: "All known" },
];

/** Parts Prism knows about, with their stock. The URL holds the scope, search and open part. */
export function PartsView({ user, headerSlot }: { user: User | null; headerSlot?: HTMLElement | null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedScope = searchParams.get("partsScope");
  const scope: PartsScope = SCOPES.some((item) => item.id === requestedScope) ? (requestedScope as PartsScope) : "watched";
  const query = searchParams.get("partsQ") ?? "";
  const requestedOnly = searchParams.get("partsOnly");
  const only: PartsFilter = requestedOnly && requestedOnly in FILTER_LABEL ? (requestedOnly as PartsFilter) : "";
  const openPart = searchParams.get("part");
  const canEdit = canEditSupply(user?.role);
  const [watching, setWatching] = useState(false);
  const { status, data, error, retry, refresh } = useSupplyPartsList(scope, query, only);

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

  if (searchParams.get("tool") === "bom-file") {
    return (
      <div className="relative h-full overflow-y-auto">
        <Button variant="ghost" size="sm" className="m-4 mb-0" onClick={() => setParams({ tool: null })}>
          <ArrowLeft className="h-4 w-4" />Parts
        </Button>
        <BomFileView />
      </div>
    );
  }

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
                onClick={() => setParams({ partsScope: item.id === "watched" ? null : item.id })}
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
        {scope === "watched" ? <TrackingRoomLine /> : null}

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
            {data.items.length === 0 ? (
              <EmptyState scope={scope} searching={query !== "" || only !== ""} canEdit={canEdit} onWatch={() => setWatching(true)} />
            ) : (
              <>
                <PartsTable items={data.items} selectedId={openPart} onOpen={(partId) => setParams({ part: partId })} />
                <p className="text-xs text-muted-foreground">
                  {data.total > data.items.length
                    ? `Showing ${data.items.length.toLocaleString()} of ${data.total.toLocaleString()}. Search to narrow it down.`
                    : `${data.total.toLocaleString()} ${data.total === 1 ? "part" : "parts"}`}
                </p>
              </>
            )}
          </>
        ) : null}
      </div>

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

function SearchBox({ initial, onSearch }: { initial: string; onSearch: (text: string) => void }) {
  const [text, setText] = useState(initial);
  return (
    <form
      className="flex items-center gap-2"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(text.trim());
      }}
    >
      <Input aria-label="Search parts" className="h-8 w-64" placeholder="Part number or manufacturer" value={text} onChange={(event) => setText(event.target.value)} />
      <Button type="submit" size="sm" variant="outline"><Search className="h-4 w-4" />Search</Button>
    </form>
  );
}

function EmptyState({ scope, searching, canEdit, onWatch }: { scope: PartsScope; searching: boolean; canEdit: boolean; onWatch: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 border border-dashed p-10 text-center">
      <PackageSearch className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">{searching ? "No parts match" : scope === "watched" ? "No tracked parts yet" : scope === "in_use" ? "No parts in use yet" : "No parts yet"}</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {searching
          ? "Try a shorter part number or another manufacturer."
          : scope === "watched"
            ? "Watch a part to have its stock read regularly."
            : scope === "in_use"
              ? "No project BOM that Prism has read uses a part it knows. Open a project BOM, then watch its parts."
              : "Parts appear here once they are watched or matched."}
      </p>
      {!searching && scope === "watched" && canEdit ? <Button size="sm" onClick={onWatch}>Track a part</Button> : null}
      {!searching && scope === "in_use" && canEdit ? <ReadProjectBomsButton /> : null}
    </div>
  );
}

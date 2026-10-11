import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, PackageSearch, Search } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionHint } from "@/components/ui/permission-hint";
import { Skeleton } from "@/components/ui/skeleton";
import { canEditSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import type { PartsScope } from "@/types/supply";
import { PartSheet } from "./part-sheet";
import { PartsTable } from "./parts-table";
import { useSupplyPartsList } from "./use-supply-parts";
import { WatchPartDialog } from "./watch-part-dialog";

const SCOPES: ReadonlyArray<{ id: PartsScope; label: string }> = [
  { id: "watched", label: "Watched" },
  { id: "all", label: "All known" },
];

/** Parts Prism knows about, with their stock. The URL holds the scope, search and open part. */
export function PartsView({ user }: { user: User | null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const scope: PartsScope = searchParams.get("partsScope") === "all" ? "all" : "watched";
  const query = searchParams.get("partsQ") ?? "";
  const openPart = searchParams.get("part");
  const canEdit = canEditSupply(user?.role);
  const [watching, setWatching] = useState(false);
  const { status, data, error, retry, refresh } = useSupplyPartsList(scope, query);

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

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Supply</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Parts</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Stock and price across your distributors. Watch a part to have it read regularly and to be warned before it runs out.
            </p>
          </div>
          <PermissionHint blocked={!canEdit} action="watch parts" allowedRoles={["designer", "admin"]}>
            <Button disabled={!canEdit} onClick={() => setWatching(true)}>
              <Eye className="h-4 w-4" />Watch a part
            </Button>
          </PermissionHint>
        </div>

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
        </div>

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
              <EmptyState scope={scope} searching={query !== ""} canEdit={canEdit} onWatch={() => setWatching(true)} />
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
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
      <PackageSearch className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-medium">{searching ? "No parts match" : scope === "watched" ? "No watched parts yet" : "No parts yet"}</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {searching
          ? "Try a shorter part number or another manufacturer."
          : scope === "watched"
            ? "Watch a part to have its stock read regularly."
            : "Parts appear here once they are watched or matched."}
      </p>
      {!searching && scope === "watched" && canEdit ? <Button size="sm" onClick={onWatch}>Watch a part</Button> : null}
    </div>
  );
}

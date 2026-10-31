import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_DISCOVERY_FILTERS,
  inScope,
  isSelectable,
  unreadableCount,
  visibleRepositories,
  type DiscoveredRepository,
  type DiscoveryFilters,
  type DiscoverySource,
} from "@/lib/repo-discovery";

import { RepoDiscoveryFilters } from "./repo-discovery-filters";
import { RepoPickRow } from "./repo-pick-row";
import type { useRepoDiscovery } from "./use-repo-discovery";

/** What to say when the list is empty: still reading, not scanned, nothing to import, or nothing readable. */
function emptyMessage(host: string, found: number, hiddenFromDesigners: number, unreadable: number): string {
  if (found === 0 && hiddenFromDesigners > 0) {
    return `Prism found ${hiddenFromDesigners} repositories on ${host} but could not read them. An administrator can see why.`;
  }
  if (found === 0) return `No repositories were found on ${host}.`;
  if (unreadable > 0) {
    return `Nothing left to import with these filters. Prism could not read ${unreadable} of the ${found} repositories; tick Unreadable to see why.`;
  }
  return "Nothing left to import with these filters.";
}

interface RepoPickStepProps {
  source: DiscoverySource;
  /** An organisation to limit the list to; empty for the whole host. */
  scope: string;
  discovery: ReturnType<typeof useRepoDiscovery>;
  picked: ReadonlySet<string>;
  onPickedChange: (picked: Set<string>) => void;
  onBack: () => void;
  onReview: () => void;
}

export function RepoPickStep({ source, scope, discovery, picked, onPickedChange, onBack, onReview }: RepoPickStepProps) {
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_DISCOVERY_FILTERS);
  const { list, loaded, scan, scanning, error } = discovery;

  const scoped = useMemo(() => inScope(list.candidates, scope), [list.candidates, scope]);
  const visible = useMemo(() => visibleRepositories(scoped, filters), [scoped, filters]);
  const selectable = useMemo(() => visible.filter(isSelectable), [visible]);
  const unreadable = useMemo(() => unreadableCount(scoped), [scoped]);
  const allPicked = selectable.length > 0 && selectable.every((repository) => picked.has(repository.id));

  const pick = (repository: DiscoveredRepository, on: boolean) => {
    const next = new Set(picked);
    if (on) next.add(repository.id);
    else next.delete(repository.id);
    onPickedChange(next);
  };

  const pickAll = (on: boolean) => {
    const next = new Set(picked);
    for (const repository of selectable) {
      if (on) next.add(repository.id);
      else next.delete(repository.id);
    }
    onPickedChange(next);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Repositories on {source.displayName || source.host}</DialogTitle>
        <DialogDescription>
          {scope ? `Showing ${scope} on ${source.host}. ` : `${source.host}. `}
          Tick the repositories to import, then review them.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="discovery-pick-all"
              checked={allPicked}
              disabled={selectable.length === 0}
              onCheckedChange={(checked) => pickAll(checked === true)}
            />
            <Label htmlFor="discovery-pick-all" className="text-sm font-normal">
              Select all ({selectable.length})
            </Label>
          </div>
          <Button
            className="ml-auto"
            variant="outline"
            size="sm"
            disabled={scanning}
            onClick={() => void discovery.startScan()}
          >
            Rescan
          </Button>
        </div>

        {scanning && (
          <div className="space-y-1" role="status">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-[width] duration-300"
                style={{ width: `${scan?.percent || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{scan?.message || "Starting the scan…"}</p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <RepoDiscoveryFilters filters={filters} onChange={setFilters} />

        {!loaded ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : visible.length > 0 ? (
          <ul className="max-h-[45vh] space-y-2 overflow-y-auto">
            {visible.map((repository) => (
              <RepoPickRow
                key={repository.id}
                repository={repository}
                picked={picked.has(repository.id)}
                onPickedChange={pick}
              />
            ))}
          </ul>
        ) : (
          !scanning && (
            <p className="py-4 text-sm text-muted-foreground">
              {emptyMessage(source.host, scoped.length, scope ? 0 : list.hiddenCount, unreadable)}
            </p>
          )
        )}

        {list.hiddenCount > 0 && scoped.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {list.hiddenCount} {list.hiddenCount === 1 ? "repository" : "repositories"} Prism could not read{" "}
            {list.hiddenCount === 1 ? "is" : "are"} not shown. An administrator can see why.
          </p>
        )}
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button disabled={picked.size === 0} onClick={onReview}>
          Review {picked.size} {picked.size === 1 ? "repository" : "repositories"}
        </Button>
      </div>
    </>
  );
}

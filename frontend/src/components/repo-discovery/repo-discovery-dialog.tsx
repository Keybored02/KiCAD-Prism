import { lazy, Suspense, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_DISCOVERY_FILTERS,
  nextToImport,
  unreadableCount,
  visibleRepositories,
  type DiscoveredRepository,
  type DiscoveryFilters,
} from "@/lib/repo-discovery";

import { RepoDiscoveryFilters } from "./repo-discovery-filters";
import { RepoDiscoveryRow } from "./repo-discovery-row";
import { useRepoDiscovery } from "./use-repo-discovery";

const ImportDialog = lazy(() =>
  import("../import-dialog").then((module) => ({ default: module.ImportDialog })),
);

interface RepoDiscoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a repository was imported, so the workspace can refresh. */
  onImported: () => void;
}

/** The repository being imported, and the one to offer after it. */
interface ImportInProgress {
  repository: DiscoveredRepository;
  nextId: string | undefined;
}

/** What to say when the list is empty: not scanned yet, nothing to import, or nothing Prism could read. */
function emptyMessage(host: string, found: number, hiddenFromDesigners: number, unreadable: number): string {
  if (found === 0 && hiddenFromDesigners > 0) {
    return `Prism found ${hiddenFromDesigners} repositories on ${host} but could not read them. An administrator can see why.`;
  }
  if (found === 0) return `Scan ${host} to find the repositories that hold KiCad projects.`;
  if (unreadable > 0) {
    return `Nothing left to import with these filters. Prism could not read ${unreadable} of the ${found} repositories; tick Unreadable to see why.`;
  }
  return "Nothing left to import with these filters.";
}

export function RepoDiscoveryDialog({ open, onOpenChange, onImported }: RepoDiscoveryDialogProps) {
  const discovery = useRepoDiscovery();
  const [filters, setFilters] = useState<DiscoveryFilters>(DEFAULT_DISCOVERY_FILTERS);
  const [importing, setImporting] = useState<ImportInProgress | null>(null);
  const { list, sources, sourceId, scan, error } = discovery;

  const visible = useMemo(() => visibleRepositories(list.candidates, filters), [list.candidates, filters]);
  const source = sources?.find((item) => item.id === sourceId);
  const unreadable = useMemo(() => unreadableCount(list.candidates), [list.candidates]);

  const startImport = (repository: DiscoveredRepository) =>
    // The next repository is fixed now: once this one is imported it leaves the
    // list, and "the one after it" could no longer be found.
    setImporting({ repository, nextId: nextToImport(list.candidates, filters, repository.id)?.id });

  const goToNext = () => {
    const next = list.candidates.find((item) => item.id === importing?.nextId);
    setImporting(next ? { repository: next, nextId: nextToImport(list.candidates, filters, next.id)?.id } : null);
  };

  if (importing) {
    return (
      <Suspense fallback={null}>
        <ImportDialog
          key={importing.repository.id}
          open={open}
          initialUrl={importing.repository.cloneUrl}
          onOpenChange={(next) => {
            if (next) return;
            setImporting(null);
            void discovery.reload();
          }}
          onImportComplete={() => {
            onImported();
            void discovery.reload();
          }}
          onNext={importing.nextId ? goToNext : undefined}
        />
      </Suspense>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Discover repositories</DialogTitle>
          <DialogDescription>
            Prism lists the repositories on a connected host that hold KiCad projects. Pick one to
            import it the usual way.
          </DialogDescription>
        </DialogHeader>

        {sources === null && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {sources?.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">
            No connected host supports discovery yet. An administrator can connect a GitLab host in
            Settings, under Code hosts.
          </p>
        )}

        {source && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {sources && sources.length > 1 ? (
                <select
                  aria-label="Host"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={sourceId}
                  onChange={(event) => discovery.chooseSource(event.target.value)}
                >
                  {sources.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.displayName || item.host}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm font-medium">{source.displayName || source.host}</span>
              )}
              <span className="text-xs text-muted-foreground">{source.host}</span>
              <Button
                className="ml-auto"
                variant="outline"
                size="sm"
                disabled={scan !== null}
                onClick={() => void discovery.startScan()}
              >
                {list.candidates.length > 0 ? "Rescan" : "Scan host"}
              </Button>
            </div>

            {scan && (
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-[width] duration-300"
                    style={{ width: `${scan.percent || 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{scan.message || "Starting the scan…"}</p>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <RepoDiscoveryFilters filters={filters} onChange={setFilters} />

            {visible.length > 0 ? (
              <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
                {visible.map((repository) => (
                  <RepoDiscoveryRow
                    key={repository.id}
                    repository={repository}
                    onImport={startImport}
                    onDismiss={(item) => void discovery.dismiss(item.id, !item.dismissed)}
                  />
                ))}
              </ul>
            ) : (
              !scan && (
                <p className="py-4 text-sm text-muted-foreground">
                  {emptyMessage(source.host, list.candidates.length, list.hiddenCount, unreadable)}
                </p>
              )
            )}

            {list.hiddenCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {list.hiddenCount} {list.hiddenCount === 1 ? "repository" : "repositories"} Prism could
                not read {list.hiddenCount === 1 ? "is" : "are"} not shown. An administrator can see why.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

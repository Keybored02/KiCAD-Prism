import { useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { canEditSupply, canOpenSupply } from "@/lib/roles";
import type { UserRole } from "@/types/auth";
import type { SupplyComponentStanding } from "@/types/supply";
import type { CatalogSupplyFilter } from "./catalog-supply-filter";
import { watchCatalogComponents } from "./catalog-supply-api";

interface CatalogRow {
  id: string;
  manufacturer: string;
  mpn: string;
}

/** Watched and At risk filters for the components on this page, and a button to watch the ones shown. */
export function CatalogSupplyBar({ filter, onFilter, rows, standing, role, onChanged, picked, onClearPicks }: {
  filter: CatalogSupplyFilter;
  onFilter: (next: CatalogSupplyFilter) => void;
  /** The components shown (after the filter). */
  rows: readonly CatalogRow[];
  standing: Record<string, SupplyComponentStanding>;
  role: UserRole | null | undefined;
  onChanged: () => void;
  /** Ids of the rows picked with ctrl-click. When there are any, only those are watched. */
  picked: ReadonlySet<string>;
  onClearPicks: () => void;
}) {
  const [busy, setBusy] = useState(false);
  if (!canOpenSupply(role)) return null;
  const chosen = picked.size > 0;
  const toWatch = rows.filter((row) => (!chosen || picked.has(row.id)) && row.manufacturer && row.mpn && !standing[row.id]?.watched);

  const watchShown = async () => {
    setBusy(true);
    try {
      const { watched, skipped } = await watchCatalogComponents(toWatch);
      const done = watched === 1 ? "Watching 1 part" : `Watching ${watched} parts`;
      if (skipped > 0) toast.warning(done, { description: `${skipped} left out: Prism does not know their manufacturer yet. Admin or QA can add it in Review.` });
      else toast.success(done);
      onClearPicks();
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not watch the parts");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="group" aria-label="Supply" className="flex items-center gap-1">
      {([["watched", "Watched"], ["at_risk", "At risk"]] as const).map(([value, label]) => (
        <Button key={value} size="sm" variant={filter === value ? "secondary" : "ghost"} className="h-7" aria-pressed={filter === value}
          onClick={() => onFilter(filter === value ? "" : value)}>
          {label}
        </Button>
      ))}
      {canEditSupply(role) && toWatch.length > 0 ? (
        <Button size="sm" variant="outline" className="h-7" disabled={busy} title="Ctrl-click rows to pick which to watch" onClick={() => void watchShown()}>
          <Eye className="h-3.5 w-3.5" /> Watch {chosen ? `${toWatch.length} picked` : toWatch.length === rows.length ? "these" : `${toWatch.length} shown`}
        </Button>
      ) : null}
      {chosen ? <Button size="sm" variant="ghost" className="h-7" onClick={onClearPicks}>Clear picks</Button> : null}
    </div>
  );
}

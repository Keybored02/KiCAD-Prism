import { useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PartsFilter, ProjectSupplyPart, SupplyPartRow } from "@/types/supply";
import { LayoutToggle } from "./layout-toggle";
import { LifecycleSelect } from "./lifecycle-filter";
import type { PartsLayout } from "./parts-layout";
import { PartsTable } from "./parts-table";
import { columnOf, serverSort, type PartsSort } from "./parts-sort";
import type { ProjectLines } from "./project-line-cells";
import { SearchBox } from "./search-box";
import { useSupplyPartsList } from "./use-supply-parts";
import { VendorSelect } from "./vendor-filter";

/** The most parts one request returns; a project with more shows its first ones. */
const LIMIT = 200;

type Line = ProjectSupplyPart | undefined;

/** The figure a project column sorts by; a part with none is last either way. */
function figure(line: Line, column: string): number | null {
  if (!line) return null;
  const value = column === "per_board" ? line.quantity : column === "need" ? line.need : line.line_cost === undefined || line.line_cost === null ? null : Number(line.line_cost);
  return value === undefined || value === null || Number.isNaN(value) ? null : value;
}

/** The rows in the order of a column only the project has; the server has already put the rest in order. */
function inProjectOrder(items: SupplyPartRow[], lines: ProjectLines, sort: PartsSort): SupplyPartRow[] {
  const on = columnOf(sort);
  if (!on || serverSort(sort) !== "") return items;
  const sign = on.direction === "asc" ? 1 : -1;
  const value = (item: SupplyPartRow) => figure(lines.byPart.get(item.id), on.column);
  return [...items].sort((left, right) => {
    const a = value(left);
    const b = value(right);
    if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
    return (a - b) * sign;
  });
}

/**
 * A project's parts, as the Parts tab lists them (compact or a row for each vendor, search, lifecycle and vendor menus, runs out
 * first, sortable columns) with the pieces a board uses, the pieces the build needs and each line's cost added.
 */
export function ProjectPartsList({ projectId, parts, only, shortAt8Weeks, chance, currency, selectedId, onOpen }: {
  projectId: string;
  /** The project's lines of the BOM. */
  parts: ProjectSupplyPart[];
  /** The parts a "needs a look" chip keeps; null when none is chosen. */
  only: ReadonlySet<string> | null;
  shortAt8Weeks: Record<string, number>;
  chance: number;
  currency: string;
  selectedId: string | null;
  onOpen: (partId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [lifecycle, setLifecycle] = useState<PartsFilter>("");
  const [vendor, setVendor] = useState("");
  const [layout, setLayout] = useState<PartsLayout>("compact");
  const [sort, setSort] = useState<PartsSort>("");
  const loaded = useSupplyPartsList("all", query, lifecycle, LIMIT, projectId, vendor, serverSort(sort));
  const lines = useMemo<ProjectLines>(() => ({
    byPart: new Map(parts.flatMap((part) => (part.part_id ? [[part.part_id, part] as const] : []))), currency, shortAt8Weeks, chance,
  }), [parts, currency, shortAt8Weeks, chance]);
  const narrowed = query !== "" || lifecycle !== "" || vendor !== "" || only !== null;
  const items = inProjectOrder((loaded.data?.items ?? []).filter((item) => only === null || only.has(item.id)), lines, sort);
  // A line that matches no part has nothing to search or filter by, so it shows only while nothing narrows the list.
  const unmatched = narrowed ? [] : parts.filter((part) => !part.part_id);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <LifecycleSelect only={lifecycle} onChange={setLifecycle} />
        <VendorSelect vendor={vendor} onChange={setVendor} />
        <Button variant={sort === "runout" ? "default" : "outline"} size="sm" aria-pressed={sort === "runout"} onClick={() => setSort(sort === "runout" ? "" : "runout")}>Runs out first</Button>
        <SearchBox key={query} initial={query} onSearch={setQuery} />
        <div className="ml-auto"><LayoutToggle layout={layout} onChange={setLayout} /></div>
      </div>
      {loaded.status === "loading" && !loaded.data ? <Skeleton className="h-48 w-full" aria-label="Loading the parts" /> : null}
      {loaded.status === "error" ? (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            {loaded.error}
            <Button size="sm" variant="outline" onClick={loaded.retry}>Retry</Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {loaded.data ? (
        items.length === 0 && unmatched.length === 0 ? (
          <p className="border border-dashed p-6 text-center text-sm text-muted-foreground">{narrowed ? "No part matches" : "No part of this BOM is known to Prism yet"}</p>
        ) : (
          <PartsTable
            stickyHead layout={layout} items={items} selectedId={selectedId} onOpen={onOpen} showProjects={false}
            forecastState={loaded.data.forecast_state} sort={sort} onSort={setSort} lines={lines} unmatched={unmatched}
          />
        )
      ) : null}
      {loaded.data && loaded.data.total > LIMIT ? <p className="text-xs text-muted-foreground">The first {LIMIT} of {loaded.data.total.toLocaleString()} parts. Search to narrow them.</p> : null}
    </div>
  );
}

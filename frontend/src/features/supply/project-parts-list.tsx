import { useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PartsFilter, ProjectSupplyPart, SupplyPartRow } from "@/types/supply";
import { LayoutToggle } from "./layout-toggle";
import { LifecycleSelect } from "./lifecycle-filter";
import { CHIPS, limitingKeys, linesByPart, matchesChip, type Chip } from "./project-part-filters";
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

/** Whether a BOM line has this reference (C80, R14, U3), whatever the case; "C8" is not "C80". */
function hasReference(line: ProjectSupplyPart, wanted: string): boolean {
  return wanted !== "" && (line.references ?? "").toLowerCase().split(/[\s,;]+/).includes(wanted);
}

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
export function ProjectPartsList({ projectId, parts, currency, selectedId, onOpen, onAddToLibrary }: {
  projectId: string;
  /** The project's lines of the BOM. */
  parts: ProjectSupplyPart[];
  currency: string;
  selectedId: string | null;
  onOpen: (partId: string) => void;
  onAddToLibrary?: (line: ProjectSupplyPart) => void;
}) {
  const [query, setQuery] = useState("");
  const [lifecycle, setLifecycle] = useState<PartsFilter>("");
  const [vendor, setVendor] = useState("");
  const [layout, setLayout] = useState<PartsLayout>("compact");
  const [sort, setSort] = useState<PartsSort>("");
  const [chip, setChip] = useState<Chip | null>(null);
  // A search that is a reference on the board (C80) finds the lines that carry it; any other search is a part number or maker, asked of the server.
  const wanted = query.trim().toLowerCase();
  const byReference = useMemo(() => (parts.some((part) => hasReference(part, wanted)) ? new Set(parts.flatMap((part) => (part.part_id && hasReference(part, wanted) ? [part.part_id] : []))) : null), [parts, wanted]);
  const loaded = useSupplyPartsList("all", byReference !== null ? "" : query, lifecycle, LIMIT, projectId, vendor, serverSort(sort));
  const lines = useMemo<ProjectLines>(() => ({ byPart: linesByPart(parts), currency, onAddToLibrary }), [parts, currency, onAddToLibrary]);
  // The parts a chip keeps, by part: a line that matches no part cannot be one of them.
  const limiting = useMemo(() => limitingKeys(parts), [parts]);
  const byChip = useMemo(() => (chip === null ? null : new Set(parts.flatMap((part) => (part.part_id && matchesChip(part, chip, limiting) ? [part.part_id] : [])))), [parts, chip, limiting]);
  const only = byChip && byReference ? new Set([...byChip].filter((id) => byReference.has(id))) : byChip ?? byReference;
  // A chip counts parts, as the list shows them: a part on two lines is one.
  const chips = CHIPS.flatMap((item) => {
    const count = new Set(parts.flatMap((part) => (matchesChip(part, item.key, limiting) ? [part.part_id ?? part.key] : []))).size;
    return count > 0 ? [{ ...item, count }] : [];
  });
  const narrowed = query !== "" || lifecycle !== "" || vendor !== "" || only !== null;
  const items = inProjectOrder((loaded.data?.items ?? []).filter((item) => only === null || only.has(item.id)), lines, sort);
  // A line that matches no part has nothing to search or filter by, so it shows only while nothing narrows the list.
  const unmatched = chip !== null || lifecycle !== "" || vendor !== "" ? [] : parts.filter((part) => !part.part_id && (query === "" || hasReference(part, wanted)));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {chips.length > 0 ? (
          <div role="group" aria-label="Needs a look" className="flex gap-1">
            {chips.map((item) => (
              <Button key={item.key} size="sm" variant={chip === item.key ? "secondary" : "ghost"} aria-pressed={chip === item.key} onClick={() => setChip(chip === item.key ? null : item.key)}>
                {item.label}<span className="tabular-nums text-muted-foreground">{item.count.toLocaleString()}</span>
              </Button>
            ))}
          </div>
        ) : null}
        <Button variant={sort === "runout" ? "default" : "outline"} size="sm" aria-pressed={sort === "runout"} onClick={() => setSort(sort === "runout" ? "" : "runout")}>Runs out first</Button>
        <LifecycleSelect only={lifecycle} onChange={setLifecycle} />
        <VendorSelect vendor={vendor} onChange={setVendor} />
        <SearchBox key={query} initial={query} onSearch={setQuery} placeholder="Part number, maker or reference" />
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
          // The filters stay where they are and the list scrolls under them, as on the Parts tab; its column names stay at its top.
          <div className="themed-scrollbar max-h-[calc(100vh-12rem)] min-h-64 overflow-auto">
            <PartsTable
              stickyHead layout={layout} items={items} selectedId={selectedId} onOpen={onOpen} showProjects={false}
              forecastState={loaded.data.forecast_state} sort={sort} onSort={setSort} lines={lines} unmatched={unmatched}
            />
          </div>
        )
      ) : null}
      {loaded.data && loaded.data.total > LIMIT ? <p className="text-xs text-muted-foreground">The first {LIMIT} of {loaded.data.total.toLocaleString()} parts. Search to narrow them.</p> : null}
    </div>
  );
}

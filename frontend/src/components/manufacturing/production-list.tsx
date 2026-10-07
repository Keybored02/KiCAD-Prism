import { useMemo, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Factory, Search, SlidersHorizontal, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/relative-time";
import { ALL_RUN_STATUSES, RUN_STATUS_LABELS, type ManufacturingRun } from "@/types/manufacturing";
import {
    DEFAULT_FILTERS,
    GROUP_LABELS,
    SORT_LABELS,
    applyFilters,
    boardName,
    groupRuns,
    statusCounts,
    type GroupBy,
    type ProductionFilters,
    type SortKey,
    type StatusFilter,
} from "./production-filters";
import { RunStatusBadge, SOLID_DESTRUCTIVE } from "./status-badge";
import { YieldBar } from "./yield-bar";

const CHIPS: { value: StatusFilter; label: string }[] = [
    { value: "active", label: "Active" },
    ...ALL_RUN_STATUSES.map((s) => ({ value: s as StatusFilter, label: RUN_STATUS_LABELS[s] })),
    { value: "all", label: "All" },
];

// Column widths: job and project, manufacturer, status, yield, open defects, updated.
const GRID = "minmax(0,2fr) minmax(0,1.4fr) 8.5rem minmax(0,1.2fr) 4.5rem 6rem";

interface ProductionListProps {
    runs: ManufacturingRun[];
    loading?: boolean;
    filters: ProductionFilters;
    onFiltersChange: (next: ProductionFilters) => void;
    selectedId?: string | null;
    onOpen: (runId: string) => void;
    /** Leave out the project name: the list already is one project's. */
    hideProject?: boolean;
    /** Shown in the "no production yet" state, e.g. a New production button. */
    emptyAction?: ReactNode;
    /** Page actions, shown at the right end of the filter row (e.g. New production). */
    actions?: ReactNode;
    className?: string;
}

/**
 * Productions as a work-order list: status chips with counts (defaulting to the
 * active ones), a search box, a view menu, and rows that open the run. Used by
 * the global Production page and by a project's own Production tab.
 */
export function ProductionList({
    runs,
    loading = false,
    filters,
    onFiltersChange,
    selectedId,
    onOpen,
    hideProject = false,
    emptyAction,
    actions,
    className,
}: ProductionListProps) {
    const counts = useMemo(() => statusCounts(runs, filters), [runs, filters]);
    const visible = useMemo(() => applyFilters(runs, filters), [runs, filters]);
    const groups = useMemo(() => groupRuns(visible, filters.group), [visible, filters.group]);
    const openDefectRuns = useMemo(() => runs.filter((r) => (r.open_defect_count ?? 0) > 0).length, [runs]);
    const bodyRef = useRef<HTMLDivElement>(null);

    const set = (patch: Partial<ProductionFilters>) => onFiltersChange({ ...filters, ...patch });
    const narrowed =
        filters.status !== DEFAULT_FILTERS.status || filters.query.trim() !== "" || filters.openDefectsOnly;

    // Up and Down walk the rows; Enter or Space on a row opens it (the row's own handler).
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        const rows = Array.from(bodyRef.current?.querySelectorAll<HTMLElement>("[data-run-row]") ?? []);
        const index = rows.indexOf(document.activeElement as HTMLElement);
        if (index === -1 && event.key === "ArrowUp") return;
        event.preventDefault();
        const next = event.key === "ArrowDown" ? index + 1 : index - 1;
        rows[Math.max(0, Math.min(rows.length - 1, next))]?.focus();
    };

    return (
        <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
            <div className="flex flex-wrap items-center gap-2">
                <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1">
                    {CHIPS.map((chip) => {
                        const pressed = filters.status === chip.value;
                        return (
                            <button
                                key={chip.value}
                                type="button"
                                aria-pressed={pressed}
                                onClick={() => set({ status: chip.value })}
                                className={cn(
                                    "flex items-center gap-1.5 border px-2.5 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    pressed
                                        ? "border-primary bg-secondary font-medium"
                                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                                )}
                            >
                                {chip.label}
                                <span className="text-xs tabular-nums text-muted-foreground">{counts[chip.value]}</span>
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    aria-pressed={filters.openDefectsOnly}
                    onClick={() => set({ openDefectsOnly: !filters.openDefectsOnly })}
                    className={cn(
                        "flex items-center gap-1.5 border px-2.5 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        filters.openDefectsOnly
                            ? "border-destructive bg-destructive/10 font-medium text-destructive"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Open defects
                    <span className="text-xs tabular-nums">{openDefectRuns}</span>
                </button>
                {actions && <div className="ml-auto">{actions}</div>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full max-w-sm">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        aria-label="Search production"
                        placeholder="Search job, project, manufacturer..."
                        className="h-8 pl-8"
                        value={filters.query}
                        onChange={(e) => set({ query: e.target.value })}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                            View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Group by</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                            value={filters.group}
                            onValueChange={(value) => set({ group: value as GroupBy })}
                        >
                            {(Object.keys(GROUP_LABELS) as GroupBy[]).map((g) => (
                                <DropdownMenuRadioItem key={g} value={g}>
                                    {GROUP_LABELS[g]}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                            value={filters.sort}
                            onValueChange={(value) => set({ sort: value as SortKey })}
                        >
                            {(Object.keys(SORT_LABELS) as SortKey[]).map((s) => (
                                <DropdownMenuRadioItem key={s} value={s}>
                                    {SORT_LABELS[s]}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex min-h-0 flex-1 flex-col border">
                {loading ? (
                    <div className="p-6 text-sm text-muted-foreground">Loading production...</div>
                ) : runs.length === 0 ? (
                    <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                        <Factory className="h-8 w-8 opacity-50" />
                        <p className="text-sm">No production yet.</p>
                        {emptyAction}
                    </div>
                ) : visible.length === 0 ? (
                    <div className="flex min-h-64 flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted-foreground">
                        <p>No production matches these filters.</p>
                        {narrowed && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    onFiltersChange({
                                        ...filters,
                                        status: DEFAULT_FILTERS.status,
                                        query: "",
                                        openDefectsOnly: false,
                                    })
                                }
                            >
                                Clear filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div
                            className="hidden shrink-0 gap-3 border-b bg-muted/30 px-3 py-2 text-xs font-medium text-muted-foreground lg:grid"
                            style={{ gridTemplateColumns: GRID }}
                        >
                            <span className="min-w-0">{hideProject ? "Job / Board" : "Job / Project"}</span>
                            <span className="min-w-0">Manufacturer</span>
                            <span className="min-w-0">Status</span>
                            <span className="min-w-0">Yield</span>
                            <span className="min-w-0 text-right">Defects</span>
                            <span className="min-w-0 text-right">Updated</span>
                        </div>

                        <div ref={bodyRef} className="min-h-0 flex-1 overflow-auto" onKeyDown={handleKeyDown}>
                            {groups.map((group) => (
                                <div key={group.key}>
                                    {filters.group !== "none" && (
                                        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-muted/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                                            <span className="truncate">{group.label}</span>
                                            <span className="shrink-0 tabular-nums">{group.runs.length}</span>
                                        </div>
                                    )}
                                    {group.runs.map((run) => (
                                        <RunRow
                                            key={run.id}
                                            run={run}
                                            selected={selectedId === run.id}
                                            hideProject={hideProject}
                                            onOpen={onOpen}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function RunRow({
    run,
    selected,
    hideProject,
    onOpen,
}: {
    run: ManufacturingRun;
    selected: boolean;
    hideProject: boolean;
    onOpen: (runId: string) => void;
}) {
    const openDefects = run.open_defect_count ?? 0;
    return (
        <div
            role="button"
            tabIndex={0}
            data-run-row
            onClick={() => onOpen(run.id)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(run.id);
                }
            }}
            aria-pressed={selected}
            className={cn(
                "flex min-h-16 w-full cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_8.5rem_minmax(0,1.2fr)_4.5rem_6rem]",
                selected && "bg-secondary",
            )}
        >
            <div className="min-w-0">
                {run.job_number && (
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{run.job_number}</p>
                )}
                <p className="truncate text-sm font-medium">
                    {hideProject ? boardName(run) : run.project_name || run.project_id}
                </p>
                {!hideProject && <p className="truncate text-xs text-muted-foreground">{boardName(run)}</p>}
            </div>
            <div className="min-w-0">
                <p className="truncate text-sm">{run.manufacturer_name || "—"}</p>
                <p className="truncate text-xs text-muted-foreground">{run.spec_name || "—"}</p>
            </div>
            <div className="flex min-w-0 flex-col items-start gap-1">
                <RunStatusBadge status={run.status} />
                {run.release_tag && run.commit_sha && (
                    <Link
                        to={`/project/${run.project_id}?section=history&commit=${encodeURIComponent(run.commit_sha)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex min-w-0 max-w-full items-center gap-1 text-xs text-primary hover:underline"
                        title={`Open ${run.release_tag} in History`}
                    >
                        <Tag className="h-3 w-3 shrink-0" />
                        <span className="truncate">{run.release_tag}</span>
                    </Link>
                )}
            </div>
            <div className="min-w-0">
                <YieldBar good={run.quantity_good} ordered={run.quantity_ordered} />
            </div>
            <div className="min-w-0 text-right">
                {openDefects > 0 ? (
                    <Badge variant="destructive" className={SOLID_DESTRUCTIVE} title={`${openDefects} open defect(s)`}>
                        {openDefects}
                    </Badge>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                )}
            </div>
            <div
                className="min-w-0 truncate text-right text-xs text-muted-foreground"
                title={new Date(run.updated_at).toLocaleString()}
            >
                {formatRelative(run.updated_at)}
            </div>
        </div>
    );
}

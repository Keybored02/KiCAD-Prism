import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { canOpenSupply } from "@/lib/roles";
import type { UserRole } from "@/types/auth";
import type { ProjectSupply } from "@/types/supply";
import { ProjectSuggestions } from "./project-suggestions";
import { ProjectTrade } from "./project-trade";
import { ProjectCostCards, ProjectCostHistory } from "./project-cost-cards";
import { NeedsALookChips, ProjectHeadline } from "./project-headline";
import { matchesChip, type Chip } from "./project-part-filters";
import { ProjectSupplyNotes, ProjectSupplyReleases } from "./project-supply-lists";
import { ProjectSupplyParts } from "./project-supply-parts";
import { BoardCount, ProjectForecastSection, useProjectForecast } from "./project-forecast";
import { supplyPartPath } from "@/components/command-palette-supply";
import { getProjectSupply } from "./supply-api";
import { keepUsualBuild } from "./tracking-api";
import { SettleBadge } from "./settle-badge";
import { TrackProjectButton } from "./track-project-dialog";
import { useLoaded } from "./use-loaded";

/** Spares for the costing: a percent for every part, or by package (small passives 2%, the rest none). Sent as `spares`. */
function SparesControl({ percent, onChange }: { percent: number | null; onChange: (next: number | null) => void }) {
  return (
    <span className="flex items-center gap-3 text-sm">
      <label className="flex items-center gap-1.5" title="Extra parts to order on top of what the boards use">
        Spares
        <Input
          type="number" min={0} max={100} step={1} className="h-8 w-16" aria-label="Spare parts, percent"
          value={percent ?? ""} disabled={percent === null}
          onChange={(event) => { const next = Number(event.target.value); if (Number.isFinite(next) && next >= 0 && next <= 100) onChange(next); }}
        />
        %
      </label>
      <label className="flex items-center gap-1.5 text-muted-foreground" title="Small passives get 2% spares, other parts none">
        <input type="checkbox" checked={percent === null} aria-label="Spares by package" onChange={(event) => onChange(event.target.checked ? null : 0)} />
        by package
      </label>
    </span>
  );
}

/** The BOM costed at the tab's board count and spares, as a file. It names no distributor or link: a costing, not an order. */
function CostExport({ projectId, variant, boards, spares }: { projectId: string; variant: string; boards: number; spares: string }) {
  const query = new URLSearchParams({ build_quantity: String(boards) });
  if (variant) query.set("variant", variant);
  if (spares) query.set("spares", spares);
  const href = `/api/supply/projects/${encodeURIComponent(projectId)}/cost-export?${query.toString()}`;
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <a href={href} className="text-primary hover:underline">Download the costing for {boards.toLocaleString()} boards as CSV</a>
    </p>
  );
}

/** How one product stands in supply: tracking, its parts, planned builds, releases and line notes. Reads the stored BOM, not a checked-out commit. */
export function ProjectSupplyTab({ projectId, role }: { projectId: string; role: UserRole | null | undefined }) {
  const allowed = canOpenSupply(role);
  const [variant, setVariant] = useState("");
  // The boards a person typed; until then the page is for the project's usual build (100 when it has none).
  const [boardsChoice, setBoards] = useState<number | null>(null);
  // The spares a person chose; until then the page shows the workspace's (Supply settings), which the server applies.
  const [attritionChoice, setAttrition] = useState<number | null | undefined>(undefined);
  const [chip, setChip] = useState<Chip | null>(null);
  const navigate = useNavigate();
  const spares = attritionChoice === undefined ? "" : attritionChoice === null ? "auto" : String(attritionChoice);
  const fetcher = useCallback(
    (signal: AbortSignal) => getProjectSupply(projectId, variant, boardsChoice ?? undefined, spares, signal),
    [projectId, variant, boardsChoice, spares],
  );
  const loaded = useLoaded<ProjectSupply>(allowed ? `${projectId}:${variant}:${boardsChoice ?? "usual"}:${spares}` : null, fetcher, "Could not load the project's supply");
  // The controls stay while a change reloads the page, so a person can go on typing.
  const [last, setLast] = useState<ProjectSupply | null>(null);
  if (loaded.data && loaded.data !== last) setLast(loaded.data);
  const boards = boardsChoice ?? loaded.data?.build_quantity ?? last?.build_quantity ?? 100;
  const attrition = attritionChoice !== undefined ? attritionChoice : (loaded.data ?? last)?.attrition_percent ?? null;
  const forecast = useProjectForecast(projectId, variant, boards, allowed && loaded.data?.available === true);
  if (!allowed) return <p className="text-sm text-muted-foreground">Supply data is not available to your role.</p>;
  if (loaded.status === "error" && !loaded.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-3">
          {loaded.error}
          <Button size="sm" variant="outline" onClick={loaded.retry}>Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }
  const supply = loaded.data ?? last;
  if (!supply) return <Skeleton className="h-48 w-full" aria-label="Loading the project's supply" />;
  const open = (partId: string) => navigate(supplyPartPath(partId));
  const shown = (supply.parts ?? []).filter((part) => chip === null || matchesChip(part, chip, forecast.data?.by_line));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {supply.variants.length > 0 ? (
          <select aria-label="Design variant" className="h-8 border bg-background px-2 text-sm" value={variant} onChange={(event) => setVariant(event.target.value)}>
            <option value="">Base design</option>
            {supply.variants.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        ) : null}
        {supply.available ? <BoardCount key={boards} boards={boards} onChange={setBoards} /> : null}
        {supply.available && supply.usual_build != null && supply.usual_build !== boards ? (
          <Button size="sm" variant="outline" onClick={() => void keepUsualBuild(projectId, boards).then(() => loaded.refresh())}>
            Keep {boards.toLocaleString()} as the usual build
          </Button>
        ) : null}
        {supply.available ? <SparesControl percent={attrition} onChange={setAttrition} /> : null}
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <SettleBadge projectId={projectId} onChanged={loaded.retry} />
          <TrackProjectButton projectId={projectId} onChanged={loaded.retry} />
        </span>
      </div>
      {loaded.status === "loading" ? <Skeleton className="h-48 w-full" aria-label="Loading the project's supply" /> : supply.available ? (
        <>
          <ProjectHeadline supply={supply} boards={boards} forecast={forecast.data ?? undefined} onOpenPart={open} />
          <NeedsALookChips supply={supply} forecast={forecast.data ?? undefined} chip={chip} onChip={setChip} />
          <ProjectCostCards supply={supply} boards={boards} onOpenPart={open} />
          <ProjectCostHistory supply={supply} />
          <ProjectForecastSection projectId={projectId} variant={variant} boards={boards} currency={supply.rollup?.currency ?? "EUR"} onOpenPart={open} />
          <section aria-label="Parts" className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parts{chip ? ` (${shown.length} of ${(supply.parts ?? []).length})` : ""}</h3>
            <ProjectSupplyParts parts={shown} shortAt8Weeks={forecast.data?.by_line} />
          </section>
        </>
      ) : (
        <p className="border border-dashed p-6 text-sm text-muted-foreground">
          This project's BOM has not been read yet. Open it in the Visualizer, or track the project, and its parts appear here.
        </p>
      )}
      <ProjectSupplyReleases projectId={projectId} releases={supply.releases} />
      <ProjectSupplyNotes supply={supply} />
      {supply.available ? <ProjectSuggestions projectId={projectId} variant={variant} /> : null}
      {supply.available ? <ProjectTrade projectId={projectId} variant={variant} /> : null}
      {supply.available ? <CostExport projectId={projectId} variant={variant} boards={boards} spares={spares} /> : null}
      {supply.available ? (
        <p className="text-xs text-muted-foreground">
          <a href={`/api/supply/projects/${encodeURIComponent(projectId)}/compliance-draft?format=csv${variant ? `&variant=${encodeURIComponent(variant)}` : ""}`} className="text-primary hover:underline">
            Download a draft RoHS and REACH declaration
          </a>{" "}
          (a working document with the gaps listed, not a declaration).
        </p>
      ) : null}
    </div>
  );
}

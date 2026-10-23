import { useCallback, useState } from "react";
import { Download } from "lucide-react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { canOpenSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import type { ProjectSupply } from "@/types/supply";
import { ProjectTrade } from "./project-trade";
import { ProjectCostCards, ProjectCostHistory } from "./project-cost-cards";
import { ProjectHeadline } from "./project-headline";
import { LIKELY_OUT_CHANCE } from "./project-part-filters";
import { OpenPartSheet } from "./open-part-sheet";
import { ProjectSupplyNotes, ProjectSupplyReleases } from "./project-supply-lists";
import { ProjectPartsList } from "./project-parts-list";
import { ProjectForecastSection, useProjectForecast } from "./project-forecast";
import { getProjectSupply } from "./supply-api";
import { keepUsualBuild } from "./tracking-api";
import { SettleBadge } from "./settle-badge";
import { TrackProjectButton } from "./track-project-dialog";
import { useLoaded } from "./use-loaded";

const NONE: Record<string, number> = {};

function costingUrl(projectId: string, variant: string, boards: number): string {
  const query = new URLSearchParams({ build_quantity: String(boards) });
  if (variant) query.set("variant", variant);
  return `/api/supply/projects/${encodeURIComponent(projectId)}/costing.zip?${query.toString()}`;
}

/** The costing for the tab's board count as a zip: the whole costing, the costing by distributor, the compliance draft and the trade classification, each a CSV. */
function CostingButton({ projectId, variant, boards }: { projectId: string; variant: string; boards: number }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={costingUrl(projectId, variant, boards)} aria-label={`Download the costing for ${boards.toLocaleString()} boards as a zip`} title={`The costing for ${boards.toLocaleString()} boards, with the compliance and trade classification files, as a zip`}>
        <Download className="h-4 w-4" />Costing
      </a>
    </Button>
  );
}

/** How one product stands in supply: tracking, its parts, planned builds, releases and line notes. Reads the stored BOM, not a checked-out commit. */
export function ProjectSupplyTab({ projectId, user, actionsSlot }: { projectId: string; user: User | null; actionsSlot?: HTMLElement | null }) {
  const allowed = canOpenSupply(user?.role);
  const [variant, setVariant] = useState("");
  // The boards a person typed; until then the page is for the project's usual build (100 when it has none).
  const [boardsChoice, setBoards] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useCallback(
    (signal: AbortSignal) => getProjectSupply(projectId, variant, boardsChoice ?? undefined, "", signal),
    [projectId, variant, boardsChoice],
  );
  const loaded = useLoaded<ProjectSupply>(allowed ? `${projectId}:${variant}:${boardsChoice ?? "usual"}` : null, fetcher, "Could not load the project's supply");
  // The controls stay while a change reloads the page, so a person can go on typing.
  const [last, setLast] = useState<ProjectSupply | null>(null);
  if (loaded.data && loaded.data !== last) setLast(loaded.data);
  const boards = boardsChoice ?? loaded.data?.build_quantity ?? last?.build_quantity ?? 100;
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
  // A part opens its sheet over the page, with `part` in the address so Back closes it.
  const open = (partId: string) => setSearchParams((current) => { const next = new URLSearchParams(current); next.set("part", partId); return next; });
  const everyPart = supply.parts ?? [];
  // The buttons sit on the page's title row when the page gives a place for them, else at the end of this row.
  const actions = (
    <>
      <SettleBadge projectId={projectId} onChanged={loaded.retry} />
      {supply.available ? <CostingButton projectId={projectId} variant={variant} boards={boards} /> : null}
      <TrackProjectButton projectId={projectId} onChanged={loaded.retry} />
    </>
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {supply.variants.length > 0 ? (
          <select aria-label="Design variant" className="h-8 border bg-background px-2 text-sm" value={variant} onChange={(event) => setVariant(event.target.value)}>
            <option value="">Base design</option>
            {supply.variants.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        ) : null}
        {actionsSlot === undefined ? <span className="ml-auto flex flex-wrap items-center gap-2">{actions}</span> : null}
      </div>
      {actionsSlot ? createPortal(actions, actionsSlot) : null}
      {supply.available ? (
        // A change of boards reloads the page: the old figures stay, dimmed, so the pencil and the filters keep their place.
        <div className={`space-y-6 transition-opacity ${loaded.status === "loading" ? "opacity-50" : ""}`} aria-busy={loaded.status === "loading"}>
          <ProjectHeadline
            supply={supply} boards={boards} onOpenPart={open} onBoards={setBoards}
            onKeepUsual={() => void keepUsualBuild(projectId, boards).then(() => loaded.refresh())}
          />
          <ProjectCostCards supply={supply} boards={boards} onOpenPart={open} />
          <ProjectCostHistory supply={supply} />
          <ProjectForecastSection projectId={projectId} variant={variant} boards={boards} currency={supply.rollup?.currency ?? "EUR"} onOpenPart={open} />
        </div>
      ) : null}
      {supply.available ? null : (
        <p className="border border-dashed p-6 text-sm text-muted-foreground">
          This project's BOM has not been read yet. Open it in the Visualizer, or track the project, and its parts appear here.
        </p>
      )}
      <ProjectSupplyReleases projectId={projectId} releases={supply.releases} />
      <ProjectSupplyNotes supply={supply} />
      {supply.available ? <ProjectTrade projectId={projectId} variant={variant} /> : null}
      {supply.available ? (
        <section aria-label="Parts" className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parts</h3>
          <ProjectPartsList
            projectId={projectId} parts={everyPart} shortAt8Weeks={forecast.data?.by_line ?? NONE} chance={supply.likely_out_chance ?? LIKELY_OUT_CHANCE}
            currency={supply.rollup?.currency ?? ""} selectedId={searchParams.get("part")} onOpen={open}
          />
        </section>
      ) : null}
      <OpenPartSheet user={user} active />
    </div>
  );
}

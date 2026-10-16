import { useCallback, useState } from "react";
import { AlertTriangle, Ban, Banknote, Boxes, Clock, HeartPulse, Hourglass, PackageMinus, type LucideIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { canEditSupply, canOpenSupply } from "@/lib/roles";
import type { UserRole } from "@/types/auth";
import type { ProjectSupply } from "@/types/supply";
import { Sparkline } from "./sparkline";
import { ProjectSuggestions } from "./project-suggestions";
import { ProjectTrade } from "./project-trade";
import { ProjectPlanButton } from "./project-plan-button";
import { ProjectSupplyBuilds, ProjectSupplyNotes, ProjectSupplyReleases } from "./project-supply-lists";
import { ProjectSupplyParts } from "./project-supply-parts";
import { getProjectSupply } from "./supply-api";
import { formatAgo, formatPrice } from "./supply-format";
import { TrackProjectButton } from "./track-project-dialog";
import { useLoaded } from "./use-loaded";

function Stat({ icon: Icon, label, value, bad }: { icon: LucideIcon; label: string; value: string; bad?: boolean }) {
  return (
    <div title={label} className="flex items-center gap-2 border p-2">
      <Icon aria-hidden className={`h-4 w-4 ${bad ? "text-destructive" : "text-muted-foreground"}`} />
      <span className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${bad ? "text-destructive" : ""}`}>{value}</span>
      </span>
    </div>
  );
}

/** The BOM costed at a build size, as a file. It names no distributor or link: a costing, not an order. */
function CostExport({ projectId, variant }: { projectId: string; variant: string }) {
  const [boards, setBoards] = useState(100);
  const href = `/api/supply/projects/${encodeURIComponent(projectId)}/cost-export?build_quantity=${boards}${variant ? `&variant=${encodeURIComponent(variant)}` : ""}`;
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <label className="flex items-center gap-1.5">
        Costing for
        <Input type="number" min={1} max={1_000_000} value={boards} aria-label="Boards to cost" className="h-7 w-24"
          onChange={(event) => { const next = Math.floor(Number(event.target.value)); if (Number.isFinite(next) && next >= 1 && next <= 1_000_000) setBoards(next); }} />
        boards
      </label>
      <a href={href} className="text-primary hover:underline">Download the costing as CSV</a>
    </p>
  );
}

function CostHistory({ points }: { points: NonNullable<ProjectSupply["cost_history"]> }) {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const change = Number(last.cost_per_board) - Number(first.cost_per_board);
  return (
    <section aria-label="Cost over time" className="flex flex-wrap items-center gap-3 border p-2 text-sm">
      <Sparkline values={points.map((point) => Number(point.cost_per_board))} label="Cost of one board over time" />
      <span>
        {formatPrice(last.cost_per_board, last.currency)} a board now, {change === 0 ? "unchanged" : `${change > 0 ? "up" : "down"} ${formatPrice(String(Math.abs(change)), last.currency)}`} since {first.day}.
      </span>
      {points.some((point) => !point.complete) ? <span className="text-xs text-muted-foreground">Some days price fewer lines than others.</span> : null}
    </section>
  );
}

function Stats({ supply }: { supply: ProjectSupply }) {
  const rollup = supply.rollup;
  const parts = supply.parts ?? [];
  if (!rollup) return null;
  const waiting = parts.filter((part) => part.waiting).length;
  const reads = parts.flatMap((part) => (part.fetched_at ? [part.fetched_at] : [])).sort();
  const oldest = reads[0] ?? null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-9">
      <Stat icon={HeartPulse} label="Health" value={rollup.health === null ? "No data" : `${rollup.health.toFixed(1)} of 10`} bad={rollup.health_status !== "ok" && rollup.health !== null} />
      <Stat icon={Boxes} label="Parts" value={`${rollup.tracked} of ${rollup.lines} tracked`} />
      <Stat icon={AlertTriangle} label="At risk" value={String(rollup.at_risk)} bad={rollup.at_risk > 0} />
      <Stat icon={PackageMinus} label="Short for a board" value={String(rollup.short)} bad={rollup.short > 0} />
      <Stat icon={Banknote} label="Per board" value={rollup.cost_per_board && rollup.currency ? formatPrice(rollup.cost_per_board, rollup.currency) : "No total"} />
      <Stat icon={Hourglass} label="Waiting for room" value={String(waiting)} bad={waiting > 0} />
      <Stat icon={Clock} label="Oldest read" value={oldest ? formatAgo(oldest) : "None yet"} />
      {rollup.waste_cost && Number(rollup.waste_cost) > 0 && rollup.currency ? <Stat icon={PackageMinus} label="Rounding waste" value={formatPrice(rollup.waste_cost, rollup.currency)} /> : null}
      <Stat icon={Ban} label="End of life" value={String(parts.filter((part) => part.lifecycle && part.lifecycle !== "active" && part.lifecycle !== "unknown").length)} />
    </div>
  );
}

/** How one product stands in supply: tracking, its parts, planned builds, releases and line notes. Reads the stored BOM, not a checked-out commit. */
export function ProjectSupplyTab({ projectId, role }: { projectId: string; role: UserRole | null | undefined }) {
  const allowed = canOpenSupply(role);
  const [variant, setVariant] = useState("");
  const fetcher = useCallback((signal: AbortSignal) => getProjectSupply(projectId, variant, signal), [projectId, variant]);
  const loaded = useLoaded<ProjectSupply>(allowed ? `${projectId}:${variant}` : null, fetcher, "Could not load the project's supply");
  if (!allowed) return <p className="text-sm text-muted-foreground">Supply data is not available to your role.</p>;
  if (loaded.status === "loading") return <Skeleton className="h-48 w-full" aria-label="Loading the project's supply" />;
  if (loaded.status === "error" || !loaded.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-3">
          {loaded.error}
          <Button size="sm" variant="outline" onClick={loaded.retry}>Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }
  const supply = loaded.data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {supply.variants.length > 0 ? (
          <select aria-label="Design variant" className="h-8 border bg-background px-2 text-sm" value={variant} onChange={(event) => setVariant(event.target.value)}>
            <option value="">Base design</option>
            {supply.variants.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        ) : null}
        <span className="ml-auto flex flex-wrap items-center gap-2">
          {supply.available && canEditSupply(role) ? <ProjectPlanButton projectId={projectId} parts={supply.parts ?? []} onDone={loaded.retry} /> : null}
          <TrackProjectButton projectId={projectId} onChanged={loaded.retry} />
        </span>
      </div>
      {supply.available ? (
        <>
          <Stats supply={supply} />
          <CostHistory points={supply.cost_history ?? []} />
          <section aria-label="Parts" className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parts</h3>
            <ProjectSupplyParts parts={supply.parts ?? []} />
          </section>
        </>
      ) : (
        <p className="border border-dashed p-6 text-sm text-muted-foreground">
          This project's BOM has not been read yet. Open it in the Visualizer, or track the project, and its parts appear here.
        </p>
      )}
      <ProjectSupplyBuilds builds={supply.builds} />
      <ProjectSupplyReleases projectId={projectId} releases={supply.releases} />
      <ProjectSupplyNotes supply={supply} />
      {supply.available ? <ProjectSuggestions projectId={projectId} variant={variant} /> : null}
      {supply.available ? <ProjectTrade projectId={projectId} variant={variant} /> : null}
      {supply.available ? <CostExport projectId={projectId} variant={variant} /> : null}
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

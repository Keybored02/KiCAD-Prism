import { useCallback, useState } from "react";
import { AlertTriangle, Ban, Banknote, Boxes, HeartPulse, Hourglass, PackageMinus, type LucideIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { canOpenSupply } from "@/lib/roles";
import type { UserRole } from "@/types/auth";
import type { ProjectSupply } from "@/types/supply";
import { ProjectSupplyBuilds, ProjectSupplyNotes, ProjectSupplyReleases } from "./project-supply-lists";
import { ProjectSupplyParts } from "./project-supply-parts";
import { getProjectSupply } from "./supply-api";
import { formatPrice } from "./supply-format";
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

function Stats({ supply }: { supply: ProjectSupply }) {
  const rollup = supply.rollup;
  const parts = supply.parts ?? [];
  if (!rollup) return null;
  const waiting = parts.filter((part) => part.waiting).length;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      <Stat icon={HeartPulse} label="Health" value={rollup.health === null ? "No data" : `${rollup.health.toFixed(1)} of 10`} bad={rollup.health_status !== "ok" && rollup.health !== null} />
      <Stat icon={Boxes} label="Parts" value={`${rollup.tracked} of ${rollup.lines} tracked`} />
      <Stat icon={AlertTriangle} label="At risk" value={String(rollup.at_risk)} bad={rollup.at_risk > 0} />
      <Stat icon={PackageMinus} label="Short for a board" value={String(rollup.short)} bad={rollup.short > 0} />
      <Stat icon={Banknote} label="Per board" value={rollup.cost_per_board && rollup.currency ? formatPrice(rollup.cost_per_board, rollup.currency) : "No total"} />
      <Stat icon={Hourglass} label="Waiting for room" value={String(waiting)} bad={waiting > 0} />
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
        <span className="ml-auto"><TrackProjectButton projectId={projectId} onChanged={loaded.retry} /></span>
      </div>
      {supply.available ? (
        <>
          <Stats supply={supply} />
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

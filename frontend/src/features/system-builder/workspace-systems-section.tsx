import { Boxes, GitPullRequestArrow } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { WorkspaceSectionHeading } from "@/components/workspace/workspace-section-heading";
import { cn } from "@/lib/utils";
import type { SystemSummary } from "@/types/system";

export function systemPath(systemId: string): string {
  return `/systems/${encodeURIComponent(systemId)}`;
}

/** Systems for one workspace level, or those matching a search, by name. */
export function systemsForLevel(
  systems: readonly SystemSummary[], folderId: string | null, searchQuery: string,
): SystemSummary[] {
  const query = searchQuery.trim().toLowerCase();
  const matching = query
    ? systems.filter((system) => `${system.name} ${system.description}`.toLowerCase().includes(query))
    : systems.filter((system) => (system.folderId ?? null) === folderId);
  return [...matching].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

interface SystemCardProps {
  system: SystemSummary;
  dense?: boolean;
}

function SystemCard({ system, dense = false }: SystemCardProps) {
  const navigate = useNavigate();
  const open = () => navigate(systemPath(system.id));
  const reviews = system.openReviewCount;
  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Open system ${system.name}`}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col gap-2 rounded-xl border bg-card text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dense ? "p-3" : "p-4",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-semibold">{system.name}</p>
            <p className="text-xs text-muted-foreground">
              {[
                `${system.instanceCount} ${system.instanceCount === 1 ? "board" : "boards"}`,
                system.moduleCount ? `${system.moduleCount} ${system.moduleCount === 1 ? "module" : "modules"}` : "",
                system.subsystemCount ? `${system.subsystemCount} ${system.subsystemCount === 1 ? "subsystem" : "subsystems"}` : "",
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        {reviews > 0 && (
          <Badge variant="warning" className="shrink-0" title="Source changes waiting for review">
            <GitPullRequestArrow className="h-3 w-3" />
            {reviews} {reviews === 1 ? "review" : "reviews"}
          </Badge>
        )}
      </div>
      {system.description && !dense && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{system.description}</p>
      )}
    </div>
  );
}

interface WorkspaceSystemsSectionProps {
  systems: SystemSummary[];
  dense?: boolean;
  showHeading: boolean;
}

export function WorkspaceSystemsSection({ systems, dense = false, showHeading }: WorkspaceSystemsSectionProps) {
  if (systems.length === 0) {
    return null;
  }
  return (
    <section className="space-y-3" aria-label="Systems">
      {showHeading && <WorkspaceSectionHeading icon={Boxes} title="Systems" count={systems.length} />}
      <div
        className={
          dense
            ? "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]"
            : "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        }
      >
        {systems.map((system) => (
          <SystemCard key={system.id} system={system} dense={dense} />
        ))}
      </div>
    </section>
  );
}

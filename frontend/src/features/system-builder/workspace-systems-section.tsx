import { Boxes, GitPullRequestArrow } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { WorkspaceSectionHeading } from "@/components/workspace/workspace-section-heading";
import { FOLDER_GRID_CLASS, FOLDER_GRID_CLASS_COMPACT } from "@/components/workspace/workspace-types";
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

/** One row like a folder card; the description is the hover title, so every card is one height. */
function SystemCard({ system }: { system: SystemSummary }) {
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
      title={system.description || undefined}
      className="group flex h-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="shrink-0 rounded-md bg-primary/10 p-2 text-primary">
          <Boxes className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{system.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[
              // SB2-101: no "0 boards" for a system made of subsystems and modules.
              system.instanceCount || !(system.moduleCount || system.subsystemCount)
                ? `${system.instanceCount} ${system.instanceCount === 1 ? "board" : "boards"}` : "",
              system.moduleCount ? `${system.moduleCount} ${system.moduleCount === 1 ? "module" : "modules"}` : "",
              system.subsystemCount ? `${system.subsystemCount} ${system.subsystemCount === 1 ? "subsystem" : "subsystems"}` : "",
            ].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      {reviews > 0 && (
        <Badge variant="warning" className="shrink-0" title="Source changes waiting for review">
          <GitPullRequestArrow className="h-3 w-3" />
          {reviews}
        </Badge>
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
      {showHeading && (
        <WorkspaceSectionHeading icon={Boxes} title="Systems" count={systems.length}>
          <Link to="/systems" className="text-xs text-muted-foreground hover:text-foreground hover:underline">All</Link>
        </WorkspaceSectionHeading>
      )}
      {/* The folders' grid, so system cards line up with the folder cards above them. */}
      <div className={dense ? FOLDER_GRID_CLASS_COMPACT : FOLDER_GRID_CLASS}>
        {systems.map((system) => (
          <SystemCard key={system.id} system={system} />
        ))}
      </div>
    </section>
  );
}

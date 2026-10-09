import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Boxes, GitBranch } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { systemPath } from "@/features/system-builder/workspace-systems-section";
import { timeAgo } from "@/features/system-builder/system-format";
import { listSystems } from "@/lib/systems-api";
import { cn } from "@/lib/utils";
import type { SystemSummary } from "@/types/system";

const TH = "h-8 px-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const TD = "h-9 max-w-0 truncate px-3";

function boards(system: SystemSummary): string {
  const total = system.boardTotal ?? null;
  if (total === null) return system.subsystemCount ? "—" : String(system.instanceCount);
  return String(total);
}

/** SB2-101: every system the reader may see, with what it holds and where it stands. */
export function SystemsPage() {
  const navigate = useNavigate();
  const [systems, setSystems] = useState<SystemSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    listSystems({ signal: controller.signal })
      .then(setSystems)
      .catch((cause) => !controller.signal.aborted && setError(cause instanceof Error ? cause.message : "Could not load the systems"));
    return () => controller.abort();
  }, []);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (systems ?? []).filter((system) => !needle || `${system.name} ${system.description}`.toLowerCase().includes(needle));
  }, [systems, query]);

  return (
    <div className="flex h-app-viewport flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate("/")} aria-label="Back to the workspace"><ArrowLeft className="size-4" /></Button>
        <Boxes className="size-4 text-primary" />
        <h1 className="text-base font-semibold">Systems</h1>
        {systems && <span className="text-sm tabular-nums text-muted-foreground">{systems.length}</span>}
        <Input aria-label="Filter systems" placeholder="Filter" value={query} onChange={(event) => setQuery(event.target.value)}
          className="ml-auto h-8 w-56" />
      </header>
      <main className="min-h-0 flex-1 overflow-auto">
        {error ? <p role="alert" className="p-4 text-sm text-destructive">{error}</p>
          : !systems ? <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          : !shown.length ? <p className="p-4 text-sm text-muted-foreground">{systems.length ? "No match" : "No systems"}</p>
          : (
            <table className="w-full table-fixed text-sm">
              <thead className="sticky top-0 border-b bg-background">
                <tr>
                  <th className={cn(TH, "w-[28%]")}>Name</th>
                  <th className={cn(TH, "w-20 text-right")}>Boards</th>
                  <th className={cn(TH, "w-24 text-right")}>Subsystems</th>
                  <th className={cn(TH, "w-20 text-right")}>Modules</th>
                  <th className={cn(TH, "w-28")}>Findings</th>
                  <th className={cn(TH, "w-24 text-right")}>To review</th>
                  <th className={TH}>Last snapshot</th>
                  <th className={TH}>Git</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((system) => {
                  const counts = system.findingCounts;
                  return (
                    <tr key={system.id} className="border-b hover:bg-muted/50">
                      <td className={cn(TD, "font-medium")} title={system.description || system.name}>
                        <Link to={systemPath(system.id)} className="hover:underline">{system.name}</Link>
                      </td>
                      <td className={cn(TD, "text-right tabular-nums")}>{boards(system)}</td>
                      <td className={cn(TD, "text-right tabular-nums text-muted-foreground")}>{system.subsystemCount || ""}</td>
                      <td className={cn(TD, "text-right tabular-nums text-muted-foreground")}>{system.moduleCount || ""}</td>
                      <td className={TD} title={counts ? undefined : "Counted when the system is next opened"}>
                        {counts ? (
                          <span className="tabular-nums">
                            <span className={counts.error ? "text-destructive" : "text-muted-foreground"}>{counts.error}</span>
                            {" · "}
                            <span className={counts.warning ? "text-warning" : "text-muted-foreground"}>{counts.warning}</span>
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className={cn(TD, "text-right tabular-nums", system.openReviewCount ? "text-warning" : "text-muted-foreground")}>
                        {system.openReviewCount || ""}
                      </td>
                      <td className={cn(TD, "text-muted-foreground")}>
                        {system.lastSnapshot ? `${system.lastSnapshot.name} · ${timeAgo(system.lastSnapshot.createdAt)}` : ""}
                      </td>
                      <td className={cn(TD, "text-muted-foreground")}>
                        {system.git && (
                          <span className="inline-flex items-center gap-1.5" title={system.git.outsideChange ? "Changed outside Prism" : system.git.error ? "Last push or fetch failed" : undefined}>
                            <GitBranch className="size-3.5" /><span className="font-mono">{system.git.branch}</span>
                            {(system.git.outsideChange || system.git.error) && <AlertTriangle className="size-3.5 text-warning" />}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </main>
    </div>
  );
}

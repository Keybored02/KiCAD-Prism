import { useEffect, useState } from "react";
import { Archive, ArrowLeft, Camera, GitBranch, ListTree, PanelRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getGitLink, listSnapshots } from "@/lib/systems-api";
import { cn } from "@/lib/utils";
import type { GitLink, SnapshotMeta, SystemDocument } from "@/types/system";

import { shortSha } from "../system-format";
import { WORKSPACE_VIEWS, type WorkspaceView } from "./workspace-state";

interface TopBarProps {
  systemId: string;
  document: SystemDocument;
  etag: string;
  view: WorkspaceView;
  canEdit: boolean;
  onBack: () => void;
  onView: (view: WorkspaceView) => void;
  onFindings: () => void;
  onHistory: () => void;
  onTakeSnapshot: () => void;
  /** Below `lg` the outline and the inspector are sheets these open. */
  onOutline: () => void;
  onInspector: () => void;
}

function ago(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}

/** The repository link and the latest snapshot, re-read when the system moves on. */
function useRepositoryState(systemId: string, etag: string) {
  const [state, setState] = useState<{ etag: string; git: GitLink | null; snapshot: SnapshotMeta | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([getGitLink(systemId).catch(() => null), listSnapshots(systemId).catch(() => [])])
      .then(([git, snapshots]) => !cancelled && setState({ etag, git, snapshot: snapshots[0] ?? null }));
    return () => {
      cancelled = true;
    };
  }, [systemId, etag]);
  return state;
}

/** The workspace's top bar (PLAN M8): the system, the view switch, its state and Take snapshot. */
export function WorkspaceTopBar({ systemId, document, etag, view, canEdit, onBack, onView, onFindings, onHistory, onTakeSnapshot, onOutline, onInspector }: TopBarProps) {
  const { system } = document;
  const counts = document.findingCounts;
  const repository = useRepositoryState(systemId, etag);
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3 md:gap-5 md:px-4">
      <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to the workspace"><ArrowLeft className="size-4" /></Button>
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onOutline} aria-label="Outline"><ListTree className="size-4" /></Button>
      <div className="flex min-w-0 items-center gap-2">
        <span className="hidden text-sm text-muted-foreground sm:inline">Systems</span>
        <span className="hidden text-sm text-muted-foreground sm:inline">/</span>
        <h1 className="truncate text-base font-semibold">{system.name}</h1>
        {system.archivedAt && (
          <Badge variant="secondary" title="Kept because parent systems or the catalog still reference it"><Archive /> Archived · read-only</Badge>
        )}
      </div>
      <div role="tablist" aria-label="View" className="flex shrink-0 gap-0.5 rounded-md border p-0.5">
        {WORKSPACE_VIEWS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={view === item.id} onClick={() => onView(item.id)}
            className={cn("rounded px-3 py-1 text-xs", view === item.id ? "bg-accent font-semibold" : "text-muted-foreground hover:text-foreground")}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <div className="hidden items-center gap-4 text-xs text-muted-foreground md:flex">
        <button type="button" onClick={onFindings} className="flex items-center gap-1.5 hover:text-foreground" aria-label="Open the findings">
          {counts ? (
            <>
              <span className={cn("size-1.5 rounded-full", counts.error ? "bg-destructive" : counts.warning ? "bg-warning" : "bg-success")} />
              <span className="text-foreground">{counts.error} {counts.error === 1 ? "error" : "errors"}</span>
              <span>· {counts.warning} {counts.warning === 1 ? "warning" : "warnings"}</span>
            </>
          ) : <span>Not evaluated</span>}
        </button>
        {repository?.git && (
          <button type="button" onClick={onHistory} className="hidden items-center gap-1.5 hover:text-foreground xl:flex" title={repository.git.url}>
            <GitBranch className="size-3.5" />
            <span className="font-mono text-foreground">{repository.git.branch}</span>
            {repository.git.tip && <span className="font-mono">@ {shortSha(repository.git.tip)}</span>}
            {repository.git.outsideCommit && <span className="text-warning">changed outside Prism</span>}
          </button>
        )}
        {repository?.snapshot && (
          <button type="button" onClick={onHistory} className="hidden hover:text-foreground lg:block">
            {repository.snapshot.name} · {ago(repository.snapshot.createdAt)}
          </button>
        )}
      </div>
      {canEdit && <Button size="sm" onClick={onTakeSnapshot}><Camera className="size-4" /> <span className="hidden sm:inline">Take snapshot</span></Button>}
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onInspector} aria-label="Details"><PanelRight className="size-4" /></Button>
    </header>
  );
}

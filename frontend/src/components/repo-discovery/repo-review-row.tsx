import { AlertCircle, Check, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBytes } from "@/lib/repo-discovery";
import type { ReviewRow } from "@/lib/repo-review";

import type { RepoImportState } from "./use-review";

interface RepoReviewRowProps {
  row: ReviewRow;
  /** Set once the import has started: the choices are then fixed. */
  importState?: RepoImportState;
  onToggle: (key: string) => void;
  onAll: (on: boolean) => void;
  onBranch: (branch: string) => void;
}

function ImportChip({ state }: { state: RepoImportState }) {
  if (state.status === "done") {
    return (
      <Badge variant="success">
        <Check aria-hidden="true" />
        {state.projects} imported
      </Badge>
    );
  }
  if (state.status === "failed") {
    return (
      <Badge variant="destructive">
        <AlertCircle aria-hidden="true" />
        Failed
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      {state.status === "running" && <Loader2 className="animate-spin" aria-hidden="true" />}
      {state.status === "running" ? "Importing" : "Waiting"}
    </Badge>
  );
}

export function RepoReviewRow({ row, importState, onToggle, onAll, onBranch }: RepoReviewRowProps) {
  const { repository, branch, projects, selected, status, error } = row;
  const locked = importState !== undefined;
  const branches = repository.branches.includes(branch) ? repository.branches : [branch, ...repository.branches];
  const importable = projects.filter((project) => !project.imported);
  const ticked = new Set(selected);
  const allTicked = importable.length > 0 && importable.every((project) => ticked.has(project.project_key));

  return (
    <li className="space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="min-w-0 truncate text-sm font-medium">{repository.fullName}</span>
        <Badge variant="outline">{formatBytes(repository.sizeBytes)}</Badge>
        {importState && <ImportChip state={importState} />}
        <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          Branch
          <select
            aria-label={`Branch of ${repository.fullName}`}
            className="h-8 max-w-48 rounded-md border bg-background px-2 text-sm text-foreground"
            value={branch}
            disabled={locked || status === "loading" || branches.length < 2}
            onChange={(event) => onBranch(event.target.value)}
          >
            {branches.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {status === "loading" && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Reading the projects on {branch}…
        </p>
      )}
      {status === "failed" && <p className="text-xs text-destructive">{error}</p>}
      {importState?.status === "failed" && <p className="text-xs text-destructive">{importState.message}</p>}

      {status === "ready" && projects.length === 0 && (
        <p className="text-xs text-muted-foreground">No KiCad projects on {branch}.</p>
      )}
      {status === "ready" && projects.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {selected.length} of {importable.length} importable projects ticked
            </span>
            {!locked && importable.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => onAll(!allTicked)}>
                {allTicked ? "Clear" : "Tick all"}
              </Button>
            )}
          </div>
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.project_key} className="flex items-center gap-2">
                <Checkbox
                  checked={project.imported || ticked.has(project.project_key)}
                  disabled={locked || project.imported}
                  onCheckedChange={() => onToggle(project.project_key)}
                  aria-label={`Import ${project.name} from ${repository.fullName}`}
                />
                <span className="text-sm">{project.name}</span>
                {project.relative_path !== "." && (
                  <span className="truncate text-xs text-muted-foreground">{project.relative_path}</span>
                )}
                <span className="ml-auto flex shrink-0 gap-1">
                  {project.has_schematic && <Badge variant="outline">Schematic</Badge>}
                  {project.has_pcb && <Badge variant="outline">PCB</Badge>}
                  {project.imported && <Badge variant="secondary">Already imported</Badge>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

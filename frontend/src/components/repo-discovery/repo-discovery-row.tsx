import { Eye, EyeOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  importedSummary,
  importStatus,
  type DiscoveredRepository,
} from "@/lib/repo-discovery";

const PROJECTS_SHOWN = 3;

const PROBLEM_LABELS: Partial<Record<DiscoveredRepository["state"], string>> = {
  pending: "Not scanned yet",
  no_access: "No access",
  blocked: "Blocked",
  error: "Scan failed",
  empty: "No KiCad files",
};

interface RepoDiscoveryRowProps {
  repository: DiscoveredRepository;
  onImport: (repository: DiscoveredRepository) => void;
  onDismiss: (repository: DiscoveredRepository) => void;
}

function projectNames(repository: DiscoveredRepository): string {
  const names = repository.projects.map((project) => project.name);
  const shown = names.slice(0, PROJECTS_SHOWN).join(", ");
  const more = names.length - PROJECTS_SHOWN;
  return more > 0 ? `${shown} and ${more} more` : shown;
}

export function RepoDiscoveryRow({ repository, onImport, onDismiss }: RepoDiscoveryRowProps) {
  const problem = PROBLEM_LABELS[repository.state];
  const summary = importedSummary(repository);
  const canImport = repository.state === "kicad" || repository.state === "empty";
  const done = importStatus(repository) === "all";

  return (
    <li className="flex items-start gap-3 rounded-md border p-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <a
            className="truncate text-sm font-medium hover:underline"
            href={repository.webUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            {repository.fullName}
          </a>
          {repository.defaultBranch && (
            <span className="text-xs text-muted-foreground">{repository.defaultBranch}</span>
          )}
          {repository.archived && <Badge variant="outline">Archived</Badge>}
          {problem && <Badge variant="outline">{problem}</Badge>}
          {summary && <Badge variant={done ? "secondary" : "outline"}>{summary}</Badge>}
        </div>
        {repository.projects.length > 0 && (
          <p className="truncate text-xs text-muted-foreground">{projectNames(repository)}</p>
        )}
        {repository.error && <p className="text-xs text-destructive">{repository.error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDismiss(repository)}
          aria-label={repository.dismissed ? `Show ${repository.fullName} again` : `Hide ${repository.fullName}`}
        >
          {repository.dismissed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        {canImport && (
          <Button size="sm" variant={done ? "outline" : "default"} onClick={() => onImport(repository)}>
            {done ? "Review" : "Import"}
          </Button>
        )}
      </div>
    </li>
  );
}

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  importedSummary,
  importStatus,
  isSelectable,
  type DiscoveredRepository,
} from "@/lib/repo-discovery";

const PROJECTS_SHOWN = 3;

const STATE_LABELS: Partial<Record<DiscoveredRepository["state"], string>> = {
  pending: "Not scanned yet",
  no_access: "No access",
  blocked: "Blocked",
  error: "Scan failed",
  empty: "No KiCad files",
};

function projectNames(repository: DiscoveredRepository): string {
  const names = repository.projects.map((project) => project.name);
  const shown = names.slice(0, PROJECTS_SHOWN).join(", ");
  const more = names.length - PROJECTS_SHOWN;
  return more > 0 ? `${shown} and ${more} more` : shown;
}

interface RepoPickRowProps {
  repository: DiscoveredRepository;
  picked: boolean;
  onPickedChange: (repository: DiscoveredRepository, picked: boolean) => void;
}

export function RepoPickRow({ repository, picked, onPickedChange }: RepoPickRowProps) {
  const selectable = isSelectable(repository);
  const stateLabel = STATE_LABELS[repository.state];
  const summary = importedSummary(repository);
  const done = importStatus(repository) === "all";

  return (
    <li className="flex items-start gap-3 rounded-md border p-3">
      {selectable ? (
        <Checkbox
          className="mt-0.5"
          checked={picked}
          onCheckedChange={(checked) => onPickedChange(repository, checked === true)}
          aria-label={`Select ${repository.fullName}`}
        />
      ) : (
        <span className="size-4 shrink-0" aria-hidden="true" />
      )}
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
          {stateLabel && <Badge variant="outline">{stateLabel}</Badge>}
          {summary && <Badge variant={done ? "secondary" : "outline"}>{summary}</Badge>}
        </div>
        {repository.projects.length > 0 && (
          <p className="truncate text-xs text-muted-foreground">{projectNames(repository)}</p>
        )}
        {repository.error && <p className="text-xs text-destructive">{repository.error}</p>}
      </div>
    </li>
  );
}

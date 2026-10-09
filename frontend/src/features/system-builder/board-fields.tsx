import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Project } from "@/types/project";

export type BoardSource = "branch" | "commit";

export interface BoardDraft {
  key: number;
  projectId: string;
  label: string;
  source: BoardSource;
  /** Branch name for `branch`, SHA (or unambiguous prefix) for `commit`. */
  ref: string;
  pinned: boolean;
}

export const projectName = (project: Project) => project.display_name || project.name;

/** Problems with the boards themselves; `existingLabels` are labels already in the system. */
export function boardProblems(boards: BoardDraft[], existingLabels: string[] = []): string[] {
  const problems: string[] = [];
  const labels = new Map<string, number>(existingLabels.map((label) => [label.toLowerCase(), 1]));
  boards.forEach((board, index) => {
    const label = board.label.trim();
    if (!board.projectId) {
      problems.push(`Board ${index + 1}: choose a project.`);
    }
    if (!label) {
      problems.push(`Board ${index + 1}: give it a label.`);
    } else {
      labels.set(label.toLowerCase(), (labels.get(label.toLowerCase()) ?? 0) + 1);
    }
    if (!board.ref.trim()) {
      problems.push(`Board ${index + 1}: ${board.source === "branch" ? "name the branch to track" : "enter a commit"}.`);
    } else if (board.source === "commit" && !/^[0-9a-f]{7,40}$/i.test(board.ref.trim())) {
      problems.push(`Board ${index + 1}: a commit is 7 to 40 hex characters.`);
    }
  });
  for (const [label, count] of labels) {
    if (count > 1) {
      problems.push(`Labels must be unique: "${label}" is used ${count} times.`);
    }
  }
  return problems;
}

/** A board draft with its project chosen, suggesting a label until one is typed. */
export function withProject(board: BoardDraft, projectId: string, projects: Project[]): BoardDraft {
  const project = projects.find((candidate) => candidate.id === projectId);
  const suggested = board.label === "" || projects.some((p) => projectName(p) === board.label);
  return { ...board, projectId, label: suggested && project ? projectName(project) : board.label };
}

export function instanceInput(board: BoardDraft) {
  const ref = board.ref.trim();
  return {
    projectId: board.projectId,
    label: board.label.trim(),
    baselineCommit: board.source === "commit" ? ref : null,
    trackedRef: board.source === "branch" ? ref : null,
    pinned: board.source === "branch" ? board.pinned : false,
  };
}

interface BoardFieldsProps {
  board: BoardDraft;
  index: number;
  projects: Project[];
  onChange: (next: BoardDraft) => void;
  onRemove?: () => void;
}

export function BoardFields({ board, index, projects, onChange, onRemove }: BoardFieldsProps) {
  const sorted = [...projects].sort((a, b) => projectName(a).localeCompare(projectName(b)));
  return (
    <fieldset className="space-y-2 border p-3" aria-label={`Board ${index + 1}`}>
      <div className={onRemove ? "grid gap-2 sm:grid-cols-[1fr_10rem_auto]" : "grid gap-2 sm:grid-cols-[1fr_10rem]"}>
        <Select value={board.projectId} onValueChange={(value) => onChange(withProject(board, value, projects))}>
          <SelectTrigger aria-label={`Board ${index + 1} project`} className="h-9 w-full">
            <SelectValue placeholder="Choose a project…" />
          </SelectTrigger>
          <SelectContent>
            {sorted.map((project) => (
              <SelectItem key={project.id} value={project.id}>{projectName(project)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input aria-label={`Board ${index + 1} label`} value={board.label} maxLength={100}
          placeholder="Label, e.g. OBC-A" onChange={(event) => onChange({ ...board, label: event.target.value })} />
        {onRemove && (
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove board ${index + 1}`} onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="grid items-center gap-2 sm:grid-cols-[10rem_1fr_auto]">
        <Select value={board.source} onValueChange={(value) => {
          const source = value as BoardSource;
          onChange({ ...board, source, ref: source === "branch" ? "main" : "" });
        }}>
          <SelectTrigger aria-label={`Board ${index + 1} source`} className="h-9 w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="branch">Track a branch</SelectItem>
            <SelectItem value="commit">Fixed commit</SelectItem>
          </SelectContent>
        </Select>
        <Input aria-label={`Board ${index + 1} ${board.source === "branch" ? "branch" : "commit"}`}
          className="font-mono" value={board.ref}
          maxLength={board.source === "branch" ? 200 : 40}
          placeholder={board.source === "branch" ? "main" : "Commit SHA"}
          onChange={(event) => onChange({ ...board, ref: event.target.value })} />
        {board.source === "branch" && (
          <div className="flex items-center gap-1.5" title="Record new commits as available updates instead of reviewing them">
            <Checkbox id={`board-${board.key}-pinned`} aria-label={`Board ${index + 1} pinned`} checked={board.pinned}
              onCheckedChange={(checked) => onChange({ ...board, pinned: checked === true })} />
            <Label htmlFor={`board-${board.key}-pinned`} className="text-xs font-normal text-muted-foreground">Pinned</Label>
          </div>
        )}
      </div>
    </fieldset>
  );
}

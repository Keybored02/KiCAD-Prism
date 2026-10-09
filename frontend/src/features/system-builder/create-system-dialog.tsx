import { useRef, useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isDialogSubmitShortcut } from "@/lib/dialog-shortcuts";
import { addInstance, createSystem, deleteSystem } from "@/lib/systems-api";
import type { Project } from "@/types/project";

import { BoardFields, boardProblems, instanceInput, type BoardDraft } from "./board-fields";

export interface CreatedSystem {
  systemId: string;
  /** Boards the server refused, with its reason; the system itself exists. */
  failures: { label: string; error: string }[];
}


/** Problems that stop submission, or an empty list. */
export function validateDraft(name: string, boards: BoardDraft[]): string[] {
  return [...(name.trim() ? [] : ["Name the system."]), ...boardProblems(boards)];
}

/**
 * Create the system, then add each board in order, carrying the ETag from one
 * call to the next. A refused board does not undo the system (the caller fixes it on the system
 * page), unless every board was refused: then the empty system is deleted and the error lists why.
 */
export async function submitSystem(
  input: { name: string; description: string; folderId: string | null },
  boards: BoardDraft[],
): Promise<CreatedSystem> {
  const created = await createSystem({
    name: input.name.trim(), description: input.description.trim(), folderId: input.folderId,
  });
  let etag = created.etag ?? created.body.etag;
  const failures: CreatedSystem["failures"] = [];
  for (const board of boards) {
    try {
      const added = await addInstance(created.body.id, etag, instanceInput(board));
      etag = added.etag ?? etag;
    } catch (error) {
      failures.push({ label: board.label.trim(), error: error instanceof Error ? error.message : String(error) });
    }
  }
  // SB2-118: when no board could be added, an empty system helps nobody; drop it and keep the dialog.
  if (boards.length > 0 && failures.length === boards.length) {
    await deleteSystem(created.body.id, etag).catch(() => undefined);
    throw new Error(`No board could be added. ${failures.map((failure) => `${failure.label}: ${failure.error}`).join("; ")}`);
  }
  return { systemId: created.body.id, failures };
}

interface CreateSystemDialogProps {
  open: boolean;
  projects: Project[];
  folderId: string | null;
  folderName: string | null;
  onOpenChange: (open: boolean) => void;
  onCreated: (result: CreatedSystem) => void;
}

export function CreateSystemDialog({ open, projects, folderId, folderName, onOpenChange, onCreated }: CreateSystemDialogProps) {
  // Mounted only while open, so each open starts from a fresh form.
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [boards, setBoards] = useState<BoardDraft[]>([]);
  const nextKey = useRef(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const problems = validateDraft(name, boards);

  const addBoard = () => {
    const key = nextKey.current;
    nextKey.current += 1;
    setBoards((current) => [...current, { key, projectId: "", label: "", source: "branch", ref: "main", pinned: false }]);
  };

  const submit = async () => {
    setAttempted(true);
    if (problems.length > 0 || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      onCreated(await submitSystem({ name, description, folderId }, boards));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the system");
      setSubmitting(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isDialogSubmitShortcut(event)) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>New system</DialogTitle>
          <DialogDescription>
            A system connects several boards through their connectors.
            {` It will be created in ${folderName ?? "the workspace root"}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="system-name">Name</Label>
            <Input id="system-name" value={name} maxLength={200} onChange={(event) => setName(event.target.value)}
              placeholder="Flight stack" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="system-description">Description</Label>
            <Textarea id="system-description" value={description} maxLength={4000} rows={2}
              onChange={(event) => setDescription(event.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Boards</Label>
              <Button type="button" variant="outline" size="sm" onClick={addBoard} disabled={projects.length === 0}>
                <Plus className="mr-1 h-4 w-4" /> Add board
              </Button>
            </div>
            {boards.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {projects.length === 0
                  ? "Import a project first; boards are projects in this workspace."
                  : "Optional. You can add boards later, and the same project can appear more than once."}
              </p>
            )}
            {boards.map((board, index) => (
              <BoardFields
                key={board.key}
                board={board}
                index={index}
                projects={projects}
                onChange={(next) => setBoards((current) => current.map((item) => (item.key === board.key ? next : item)))}
                onRemove={() => setBoards((current) => current.filter((item) => item.key !== board.key))}
              />
            ))}
          </div>

          {attempted && problems.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-destructive" role="alert">
              {problems.map((problem) => <li key={problem}>{problem}</li>)}
            </ul>
          )}
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Creating…" : "Create system"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

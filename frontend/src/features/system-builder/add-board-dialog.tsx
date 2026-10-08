import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkspaceData, workspaceSessionKey } from "@/hooks/use-workspace-data";
import type { User } from "@/types/auth";

import { BoardFields, boardProblems, type BoardDraft } from "./board-fields";

interface AddBoardDialogProps {
  user: User | null;
  existingLabels: string[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (board: BoardDraft) => void | Promise<void>;
}

export function AddBoardDialog({ user, existingLabels, busy, onClose, onSubmit }: AddBoardDialogProps) {
  const { projects } = useWorkspaceData({ sessionKey: workspaceSessionKey(user) });
  const [board, setBoard] = useState<BoardDraft>({ key: 1, projectId: "", label: "", source: "branch", ref: "main", pinned: false });
  const [attempted, setAttempted] = useState(false);
  const problems = boardProblems([board], existingLabels);

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add board</DialogTitle>
          <DialogDescription>Add a project as a board. The same project can appear more than once.</DialogDescription>
        </DialogHeader>
        <BoardFields board={board} index={0} projects={projects} onChange={setBoard} />
        {attempted && problems.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-destructive" role="alert">
            {problems.map((problem) => <li key={problem}>{problem.replace(/^Board 1: /, "")}</li>)}
          </ul>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button disabled={busy} onClick={() => {
            setAttempted(true);
            if (problems.length === 0) {
              void onSubmit(board);
            }
          }}>
            {busy ? "Adding…" : "Add board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

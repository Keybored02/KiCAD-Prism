import type { ReactNode } from "react";
import { CircuitBoard, Focus, Loader2 } from "lucide-react";

import { SelectionInspector } from "@/components/selection-inspector";
import { Button } from "@/components/ui/button";
import type { PrismSystemViewerSelection } from "@/types/prism-semantic-viewer";
import type { PrismSelection } from "@/types/prism-selection";

import type { BoardIndexState } from "./use-board-indexes";

const STAND_IN_NOTES: Record<string, string> = {
  restricted: "You can't see this board's design: it is drawn as a box showing only its size.",
  loading: "This board's 3D view is still loading.",
  building: "This board's 3D view is being generated; it is drawn as a box until ready.",
  missing: "This board has no 3D view yet.",
  failed: "This board's 3D view failed to build.",
};

/**
 * SB2-31e.2: the System 3D tab's Selection rail. The board the selection is
 * on heads it; below, the board 3D tab's own inspector reads that board's
 * design index, so a part or net shows exactly as on the board's own tab.
 */
export function SceneInspector({
  selection,
  boardName,
  indexState,
  onFrameBoard,
  onOpenBoard,
  onClear,
  trace,
}: {
  selection: PrismSystemViewerSelection | null;
  /** The placement's name (OBC-1), or null without a selection. */
  boardName: string | null;
  indexState: BoardIndexState | null;
  onFrameBoard: () => void;
  /** Open the board in the Boards tab; absent when it has no instance to open. */
  onOpenBoard?: () => void;
  onClear: () => void;
  /** SB2-32: the clicked trace's system net, shown above the board's own inspector. */
  trace?: ReactNode;
}) {
  if (!selection || !boardName) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
        Select a board, component or net to inspect it.
      </div>
    );
  }
  const onBoard = selection.kind === "board";
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <CircuitBoard className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={boardName}>{boardName}</p>
          <p className="text-[11px] text-muted-foreground">{onBoard ? "Board" : "Board of the selection"}</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={`Frame ${boardName}`} title={`Frame ${boardName}`} onClick={onFrameBoard}>
          <Focus className="size-3.5" aria-hidden />
        </Button>
        {onOpenBoard && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onOpenBoard}>Open in Boards</Button>
        )}
      </div>
      {!onBoard && trace}
      <div className="min-h-0 flex-1">
        {onBoard ? (
          <p className="p-4 text-xs text-muted-foreground">
            {selection.standIn
              ? STAND_IN_NOTES[selection.standIn] ?? "This board is drawn as a box."
              : "Click a part, a pad or a trace on this board to inspect it."}
          </p>
        ) : indexState?.index ? (
          <SelectionInspector
            open
            selection={selection as PrismSelection}
            semanticIndex={indexState.index}
            onOpenChange={() => undefined}
            onClear={onClear}
            embedded
          />
        ) : indexState?.error ? (
          <p className="p-4 text-xs text-muted-foreground">
            {describe(selection as PrismSelection)}. Its details are unavailable: {indexState.error}
          </p>
        ) : (
          <p className="flex items-center gap-2 p-4 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> Loading {boardName}&apos;s design index…
          </p>
        )}
      </div>
    </div>
  );
}

function describe(selection: PrismSelection): string {
  if (selection.kind === "net") return `Net ${selection.netName}`;
  if (selection.kind === "terminal") return `Pad ${selection.reference}.${selection.pin}`;
  return `Component ${selection.reference}`;
}

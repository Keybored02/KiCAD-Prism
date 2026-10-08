import { GitFork, Pin, PinOff, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PrismSystemSceneHarnessState } from "@/types/prism-semantic-viewer";

export interface HarnessPanelProps {
  state: PrismSystemSceneHarnessState;
  /** Move mode is on: the picked harness's nodes have handles. */
  moving: boolean;
  busy: boolean;
  counts: { breakouts: number; waypoints: number };
  onPinned: (pinned: boolean) => void;
  onRemove: () => void;
}

const mm = (value: number) => {
  const text = value.toFixed(2).replace(/\.?0+$/, "");
  return text === "-0" ? "0" : text;
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/**
 * SB2-45b: the picked harness in the System 3D tab. In move mode its
 * breakouts and waypoints have handles; this panel adds them where the tube
 * was picked and pins or removes the one the gizmo holds.
 */
export function HarnessPanel({ state, moving, busy, counts, onPinned, onRemove }: HarnessPanelProps) {
  const { harness, node } = state;
  if (!harness) return null;
  const route = `${plural(counts.breakouts, "breakout")}, ${plural(counts.waypoints, "waypoint")}`;
  return (
    <section aria-label={`Harness ${harness.name}`}
      className="w-72 space-y-2 rounded-md border bg-background/95 p-3 text-sm shadow-md backdrop-blur">
      <div className="flex items-start gap-2">
        <GitFork className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <p className="break-words font-medium leading-tight">{harness.name || "Harness"}</p>
          <p className="text-xs text-muted-foreground">{route}</p>
        </div>
      </div>
      {!state.editable && (
        <p className="text-xs text-muted-foreground">
          {harness.level ? "This harness belongs to a subsystem; edit its route in that system." : "Viewers can't change a harness route."}
        </p>
      )}
      {state.editable && !moving && (
        <p className="text-xs text-muted-foreground">Switch to Route to edit</p>
      )}
      {state.editable && moving && (
        <>
          {node ? (
            <div className="space-y-2 border-t pt-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{node.auto ? "Automatic breakout" : node.kind === "breakout" ? "Breakout" : "Waypoint"}</span>
                {node.pinned && <Badge variant="secondary">Pinned</Badge>}
                {node.unsaved && <Badge variant="outline">Not saved</Badge>}
              </div>
              <p className="font-mono text-xs text-muted-foreground" aria-label="Position in millimetres">
                X {mm(node.positionMm[0])} · Y {mm(node.positionMm[1])} · Z {mm(node.positionMm[2])} mm
              </p>
              {node.auto ? (
                <p className="text-xs text-muted-foreground">Drag it to place it; it is stored as a breakout once moved.</p>
              ) : (
                <div className="flex gap-2">
                  {node.kind === "waypoint" && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => onPinned(!node.pinned)}
                      title={node.pinned ? "Let bend relaxation move it" : "Keep it exactly here, even through a tight bend"}>
                      {node.pinned ? <PinOff className="size-3.5" aria-hidden /> : <Pin className="size-3.5" aria-hidden />}
                      {node.pinned ? "Unpin" : "Pin"}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" disabled={busy} onClick={onRemove}
                    title={node.kind === "breakout" ? "Remove it and the waypoints next to it (Delete)" : "Remove it (Delete)"}>
                    <Trash2 className="size-3.5" aria-hidden /> Remove
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Drag the harness to bend it · Alt-drag: breakout · double-click a point: remove</p>
          )}
        </>
      )}
    </section>
  );
}

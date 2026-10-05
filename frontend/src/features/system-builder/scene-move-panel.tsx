import { useState } from "react";
import { RotateCcw, Save, Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PrismScenePose, PrismSystemSceneMoveState } from "@/types/prism-semantic-viewer";

import { eulerDegrees, rotationFromEuler } from "./placement/poses";

type Target = NonNullable<PrismSystemSceneMoveState["target"]>;
type Fields = [string, string, string, string, string, string];

const LABELS = ["X", "Y", "Z", "Rotate X", "Rotate Y", "Rotate Z"] as const;

function round(value: number, places: number): string {
  const text = value.toFixed(places).replace(/\.?0+$/, "");
  return text === "-0" ? "0" : text;
}

/** The six fields for a pose: millimetres to 3 places, degrees to 2. */
export function poseFields(pose: PrismScenePose): Fields {
  const angles = eulerDegrees(pose.rotation);
  return [
    ...pose.translationMm.map((value) => round(value, 3)),
    ...angles.map((value) => round(value, 2)),
  ] as Fields;
}

/** The pose the fields describe, or null while one of them is not a number. */
export function fieldsPose(fields: Fields): PrismScenePose | null {
  const values = fields.map((field) => (field.trim() === "" ? Number.NaN : Number(field)));
  if (values.some((value) => !Number.isFinite(value))) return null;
  return {
    translationMm: [values[0], values[1], values[2]],
    rotation: rotationFromEuler([values[3], values[4], values[5]]),
  };
}

export interface MovePanelProps {
  state: PrismSystemSceneMoveState;
  busy: boolean;
  onPreview: (pose: PrismScenePose | null) => void;
  onSave: (target: Target) => void;
  onRevert: () => void;
  onDefault: (target: Target) => void;
  onResetAll: () => void;
  onSpace: (space: "world" | "local") => void;
}

/**
 * SB2-29 move mode: where the target sits, as numbers. Typing previews the
 * position in the view; Enter (or Save) stores it, Esc (or Revert) puts it back.
 * A child system moves as one group; its boards keep their places inside it.
 */
export function MovePanel({ state, busy, onPreview, onSave, onRevert, onDefault, onResetAll, onSpace }: MovePanelProps) {
  const target = state.target;
  // What the user is typing; otherwise the fields follow the view. The host remounts the
  // panel (its `key`) when the view saves, cancels or changes target, which drops it.
  const [typed, setTyped] = useState<Fields | null>(null);

  if (!target) {
    return (
      <div className="w-72 rounded-lg border bg-card/95 p-3 text-sm shadow-md backdrop-blur" aria-live="polite">
        <p className="font-medium">Move mode</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Select a board to move it: drag an arrow to slide it, a ring to turn it. Releasing saves.
        </p>
        <Button className="mt-2" size="sm" variant="ghost" onClick={onResetAll} disabled={busy}>
          <RotateCcw className="size-4" aria-hidden /> Reset all positions
        </Button>
      </div>
    );
  }

  const fields: Fields = typed && !state.dragging ? typed : poseFields(target.pose);
  const draft = fieldsPose(fields);
  const invalid = draft === null;

  const change = (index: number, value: string) => {
    const next = [...fields] as Fields;
    next[index] = value;
    setTyped(next);
    const pose = fieldsPose(next);
    if (pose) onPreview(pose);
  };
  const finish = () => setTyped(null);
  const save = () => {
    if (!draft) return;
    finish();
    onSave({ ...target, pose: draft });
  };
  const revert = () => {
    finish();
    onRevert();
  };

  return (
    <form
      className="w-80 rounded-lg border bg-card/95 p-3 text-sm shadow-md backdrop-blur"
      aria-label={`Position of ${target.displayPath}`}
      onSubmit={(event) => { event.preventDefault(); save(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          revert();
        }
      }}
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 truncate font-medium" title={target.displayPath}>{target.displayPath}</p>
        {target.unsaved ? <Badge variant="warning">Not saved</Badge>
          : target.source === "default" ? <Badge variant="outline">Default place</Badge>
            : <Badge variant="secondary">Moved</Badge>}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {target.kind === "assembly" ? "A child system: it moves as one group." : "Millimetres and degrees, in the system's frame."}
      </p>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {LABELS.map((label, index) => (
          <label key={label} className="grid gap-0.5 text-[11px] text-muted-foreground">
            {label}{index < 3 ? " (mm)" : " (°)"}
            <Input
              inputMode="decimal"
              className={cn("h-7 px-1.5 text-xs tabular-nums", !Number.isFinite(Number(fields[index])) && "border-destructive")}
              value={fields[index]}
              onChange={(event) => change(index, event.target.value)}
              aria-label={`${label}${index < 3 ? " in millimetres" : " in degrees"}`}
            />
          </label>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-1 text-xs" role="group" aria-label="Gizmo axes">
        <span className="text-muted-foreground">Axes (L)</span>
        {(["world", "local"] as const).map((space) => (
          <Button
            key={space} type="button" size="sm" variant={state.space === space ? "secondary" : "ghost"}
            className="h-6 px-2 text-xs" aria-pressed={state.space === space} onClick={() => onSpace(space)}
          >
            {space === "world" ? "World" : "Board"}
          </Button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button type="submit" size="sm" disabled={busy || invalid || (!target.unsaved && !typed)}>
          <Save className="size-4" aria-hidden /> Save
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy || (!target.unsaved && !typed)} onClick={revert}>
          <Undo2 className="size-4" aria-hidden /> Revert
        </Button>
        <Button
          type="button" size="sm" variant="ghost" disabled={busy || target.unsaved || target.source === "default"}
          onClick={() => onDefault(target)}
        >
          Back to default
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onResetAll}>
          <RotateCcw className="size-4" aria-hidden /> Reset all
        </Button>
      </div>
      {invalid && <p className="mt-1.5 text-xs text-destructive" role="alert">Every field needs a number.</p>}
    </form>
  );
}

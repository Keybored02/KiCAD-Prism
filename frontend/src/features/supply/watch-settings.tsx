import { useReducer } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplyWatchSummary } from "@/types/supply";
import { addSupplyWatch, removeSupplyWatch, updateSupplyWatch } from "./supply-api";
import { parseThreshold } from "./supply-format";
import { useConnectorSubmit } from "./use-connector-submit";

interface WatchSettingsProps {
  part: { mpn: string; manufacturer: string };
  watch: SupplyWatchSummary | null;
  canEdit: boolean;
  /** Called after any change so the screen can reload. */
  onChanged: () => Promise<void>;
}

interface Draft {
  threshold: string;
  pinned: boolean;
}

function edit(state: Draft, change: Partial<Draft>): Draft {
  return { ...state, ...change };
}

function draftOf(watch: SupplyWatchSummary | null): Draft {
  return { threshold: watch?.threshold === null || watch === null ? "" : String(watch.threshold), pinned: watch?.pinned ?? false };
}

export function WatchSettings({ part, watch, canEdit, onChanged }: WatchSettingsProps) {
  const [draft, update] = useReducer(edit, watch, draftOf);
  const { busy, error, run } = useConnectorSubmit();

  if (!watch) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Not watched. Watched parts are read regularly and warn before they run out.</p>
        {canEdit ? (
          <Button
            size="sm"
            disabled={busy}
            onClick={() => void run(async () => {
              await addSupplyWatch({ manufacturer: part.manufacturer, mpn: part.mpn });
              await onChanged();
            })}
          >
            Watch this part
          </Button>
        ) : null}
        {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  const threshold = parseThreshold(draft.threshold);
  const changed = threshold !== watch.threshold || draft.pinned !== watch.pinned;

  if (!canEdit) {
    return (
      <p className="text-sm text-muted-foreground">
        Watched by {watch.owner}.
        {watch.threshold !== null ? ` Warns at ${watch.threshold.toLocaleString()} in stock.` : ""}
        {watch.pinned ? " Pinned to the fastest polling." : ""}
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (threshold === undefined || !changed) return;
        void run(async () => {
          await updateSupplyWatch(watch.id, { threshold, pinned: draft.pinned });
          await onChanged();
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="watch-threshold">Warn when stock is at or below</Label>
        <Input
          id="watch-threshold"
          inputMode="numeric"
          className="w-40"
          placeholder="No threshold"
          value={draft.threshold}
          onChange={(event) => update({ threshold: event.target.value })}
        />
        {threshold === undefined ? <p className="text-xs text-destructive">A whole number, or leave it empty.</p> : null}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="watch-pinned" checked={draft.pinned} onCheckedChange={(checked) => update({ pinned: checked === true })} />
        <Label htmlFor="watch-pinned" className="font-normal">Always read at the fastest rate</Label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy || !changed || threshold === undefined}>Save</Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() => void run(async () => {
            await removeSupplyWatch(watch.id);
            await onChanged();
          })}
        >
          Stop watching
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Watched by {watch.owner}.</p>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
    </form>
  );
}

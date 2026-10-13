import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { SupplyComponentWatch, WatchPackaging } from "@/types/supply";
import { getComponentWatch, removeComponentWatch, setComponentWatch } from "./supply-api";
import { useLoaded } from "./use-loaded";
import { PACKAGINGS } from "./watch-packaging";

/** Watching a component: its own part, and its approved alternates now and as they are approved. */
export function ComponentWatch({ componentId, canEdit, onChanged }: { componentId: string; canEdit: boolean; onChanged: () => void }) {
  const fetcher = useCallback((signal: AbortSignal) => getComponentWatch(componentId, signal), [componentId]);
  const loaded = useLoaded<SupplyComponentWatch | null>(`${componentId}:watch`, fetcher, "Could not load the component watch");
  const [include, setInclude] = useState<boolean | null>(null);
  const [packaging, setPackaging] = useState<WatchPackaging | null>(null);
  const [error, setError] = useState("");
  if (loaded.status !== "ready") return null;
  const watch = loaded.data ?? null;
  if (!watch && !canEdit) return null;

  const includeNow = include ?? watch?.include_alternates ?? true;
  const packagingNow = packaging ?? watch?.packaging ?? "any";
  const act = async (action: () => Promise<unknown>) => {
    setError("");
    try {
      await action();
      setInclude(null);
      setPackaging(null);
      await loaded.refresh();
      onChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong");
    }
  };

  if (!canEdit) {
    return <p className="text-xs text-muted-foreground">Watched with {watch?.include_alternates ? "its approved alternates" : "no alternates"} by {watch?.owner}.</p>;
  }
  return (
    <div className="space-y-2 border p-2" aria-label="Watch this component">
      <p className="text-xs text-muted-foreground">
        {watch ? "This component is watched. Parts approved for it later are watched too." : "Watch the component's part, and its alternates as they are approved."}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2">
          <Checkbox id="component-watch-alternates" checked={includeNow} onCheckedChange={(checked) => setInclude(checked === true)} />
          <Label htmlFor="component-watch-alternates" className="font-normal">Include approved alternates</Label>
        </span>
        <select
          aria-label="Count stock of"
          className="h-8 border bg-background px-2 text-xs"
          value={packagingNow}
          onChange={(event) => setPackaging(event.target.value as WatchPackaging)}
        >
          {PACKAGINGS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <Button size="sm" onClick={() => void act(() => setComponentWatch(componentId, includeNow, packagingNow))}>
          {watch ? "Update" : "Watch component"}
        </Button>
        {watch ? <Button size="sm" variant="ghost" onClick={() => void act(() => removeComponentWatch(componentId))}>Stop watching</Button> : null}
      </div>
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

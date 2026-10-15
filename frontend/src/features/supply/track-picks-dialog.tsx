import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TrackingPreview } from "@/types/supply";
import { BudgetPreview } from "./budget-preview";
import { previewTrackComponents, type TrackChoice } from "./catalog-supply-api";

const CHOICES: ReadonlyArray<{ value: string; label: string; choice: TrackChoice }> = [
  { value: "2w", label: "Tier 2: weekly", choice: { tier: 2, rate: "weekly" } },
  { value: "2m", label: "Tier 2: monthly", choice: { tier: 2, rate: "monthly" } },
  { value: "1", label: "Tier 1: daily", choice: { tier: 1, rate: "weekly" } },
];

/** Choose how often these components are read, see what it costs each distributor's budget, and track them where there is room. */
export function TrackPicksDialog({
  components, busy, onClose, onTrack,
}: {
  components: Array<{ id: string; manufacturer: string; mpn: string }>;
  busy: boolean;
  onClose: () => void;
  onTrack: (choice: TrackChoice) => void;
}) {
  const [value, setValue] = useState("2w");
  const [preview, setPreview] = useState<TrackingPreview | null>(null);
  const [error, setError] = useState("");
  const choice = (CHOICES.find((item) => item.value === value) ?? CHOICES[0]).choice;

  useEffect(() => {
    const controller = new AbortController();
    previewTrackComponents(components, choice, controller.signal)
      .then((next) => { setPreview(next); setError(""); })
      .catch((caught: Error) => { if (!controller.signal.aborted) { setPreview(null); setError(caught.message); } });
    return () => controller.abort();
  }, [components, choice]);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Track {components.length} parts</DialogTitle>
          <DialogDescription>How often they are read, and what that costs each distributor's call budget.</DialogDescription>
        </DialogHeader>
        <select aria-label="Tier" className="h-9 border bg-background px-2 text-sm" value={value} onChange={(event) => setValue(event.target.value)}>
          {CHOICES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {preview ? <BudgetPreview connectors={preview.connectors} /> : null}
        {preview?.fits_nowhere ? <p className="text-sm text-destructive">Nothing fits at any distributor. Free room or raise a budget first.</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={busy || preview?.fits_nowhere === true} onClick={() => onTrack(choice)}>Track where there is room</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

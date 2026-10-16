import { useEffect, useMemo, useState } from "react";
import { Radar } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ProjectTrackingState, SupplyConnector, TrackingPreview } from "@/types/supply";
import { BudgetPreview } from "./budget-preview";
import { listSupplyConnectors } from "./supply-api";
import { getProjectTracking, previewTrackProject, readProjectBom, trackProject, untrackProject } from "./tracking-api";

const READ_POLL_MS = 5000;
const READ_POLLS = 60;

/** Choose the designs and the distributors, see what following the project costs, and track it where there is room. */
function TrackProjectDialog({ projectId, onClose, onChanged }: { projectId: string; onClose: () => void; onChanged: () => void }) {
  const [state, setState] = useState<ProjectTrackingState | null>(null);
  const [connectors, setConnectors] = useState<SupplyConnector[]>([]);
  const [variants, setVariants] = useState<string[]>([""]);
  const [chosen, setChosen] = useState<string[] | null>(null);
  const [preview, setPreview] = useState<TrackingPreview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getProjectTracking(projectId, controller.signal), listSupplyConnectors(controller.signal)])
      .then(([tracking, list]) => {
        setState(tracking);
        setConnectors(list.filter((item) => item.enabled && item.metered));
        if (tracking.tracked) {
          setVariants(tracking.tracked.variants);
          setChosen(tracking.tracked.connector_ids);
        }
      })
      .catch((caught: Error) => { if (!controller.signal.aborted) setError(caught.message); });
    return () => controller.abort();
  }, [projectId]);

  // A project whose BOM Prism has not read: read it, or queue its index and look again until it lands.
  const needsRead = state !== null && !state.has_usage;
  useEffect(() => {
    if (!needsRead) return;
    const controller = new AbortController();
    let polls = 0;
    const look = () => {
      polls += 1;
      if (polls > READ_POLLS) { clearInterval(timer); return; }
      readProjectBom(projectId)
        .then(() => getProjectTracking(projectId, controller.signal))
        .then((next) => { if (next.has_usage) { clearInterval(timer); setState(next); } })
        .catch((caught: Error) => { if (!controller.signal.aborted) setError(caught.message); });
    };
    const timer = setInterval(look, READ_POLL_MS);
    look();
    return () => { controller.abort(); clearInterval(timer); };
  }, [needsRead, projectId]);

  // Distributors for the choice: the ones every project uses by default, plus any assembly-only one a person adds.
  const defaults = useMemo(() => connectors.flatMap((item) => (item.assembly_only ? [] : [item.id])), [connectors]);
  const assembly = useMemo(() => connectors.filter((item) => item.assembly_only), [connectors]);
  const regular = useMemo(() => connectors.filter((item) => !item.assembly_only), [connectors]);
  const ids = chosen ?? defaults;
  const followed = useMemo(() => new Set(variants), [variants]);
  const bought = useMemo(() => new Set(ids), [ids]);
  const choice = useMemo(() => ({ variants, connector_ids: chosen }), [variants, chosen]);

  useEffect(() => {
    if (!state?.has_usage) return;
    const controller = new AbortController();
    previewTrackProject(projectId, choice, controller.signal)
      .then((next) => { setPreview(next); setError(""); })
      .catch((caught: Error) => { if (!controller.signal.aborted) { setPreview(null); setError(caught.message); } });
    return () => controller.abort();
  }, [projectId, choice, state?.has_usage]);

  const toggleVariant = (name: string, on: boolean) =>
    setVariants((current) => (on ? [...current, name] : current.filter((item) => item !== name)));
  const toggleConnector = (id: string, on: boolean) => setChosen(on ? [...ids, id] : ids.filter((item) => item !== id));

  const apply = () => {
    setBusy(true);
    trackProject(projectId, choice)
      .then((result) => {
        const waiting = result.connectors.reduce((count, item) => count + Math.max(item.waiting_new ?? 0, 0), 0);
        toast.success("Tracking this project", { description: waiting > 0 ? `${waiting} parts wait for room at a distributor.` : undefined });
        onChanged();
        onClose();
      })
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setBusy(false));
  };
  const stop = () => {
    setBusy(true);
    untrackProject(projectId)
      .then(() => { toast.success("No longer tracking this project"); onChanged(); onClose(); })
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setBusy(false));
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{state?.tracked ? "Tracking this project" : "Track this project"}</DialogTitle>
          <DialogDescription>
            Its parts are read daily within each distributor's call budget. Parts that do not fit wait for room and are read from spare budget.
          </DialogDescription>
        </DialogHeader>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {state && !state.has_usage ? (
          <p className="text-sm text-muted-foreground">Reading this project's BOM. This can take a minute; the dialog continues when it is done.</p>
        ) : null}
        {state?.has_usage ? (
          <div className="space-y-3">
            <fieldset className="space-y-1">
              <legend className="text-xs text-muted-foreground">Designs to follow</legend>
              {["", ...state.variants].map((name) => (
                <div key={name || "base"} className="flex items-center gap-2">
                  <Checkbox id={`var-${name || "base"}`} checked={followed.has(name)} onCheckedChange={(on) => toggleVariant(name, on === true)} />
                  <Label htmlFor={`var-${name || "base"}`} className="font-normal">{name || "Base design"}</Label>
                </div>
              ))}
            </fieldset>
            <fieldset className="space-y-1">
              <legend className="text-xs text-muted-foreground">Bought from</legend>
              {regular.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox id={`con-${item.id}`} checked={bought.has(item.id)} onCheckedChange={(on) => toggleConnector(item.id, on === true)} />
                  <Label htmlFor={`con-${item.id}`} className="font-normal">
                    {item.display_name}
                  </Label>
                </div>
              ))}
            </fieldset>
            {assembly.map((item) => (
              <fieldset key={item.id} className="space-y-1">
                <legend className="text-xs text-muted-foreground">Built at {item.display_name}?</legend>
                <p className="text-xs text-muted-foreground">Its parts are then also read there, for what it can place and at what price. Its stock is never counted.</p>
                <div className="flex items-center gap-2">
                  <Checkbox id={`con-${item.id}`} checked={bought.has(item.id)} onCheckedChange={(on) => toggleConnector(item.id, on === true)} />
                  <Label htmlFor={`con-${item.id}`} className="font-normal">Yes, built at {item.display_name}</Label>
                </div>
              </fieldset>
            ))}
            {preview ? <BudgetPreview connectors={preview.connectors} /> : null}
            {preview?.fits_nowhere ? <p className="text-sm text-destructive">Nothing fits at any distributor. Free room or raise a budget first.</p> : null}
          </div>
        ) : null}
        <DialogFooter>
          {state?.tracked ? <Button variant="outline" disabled={busy} onClick={stop}>Stop tracking</Button> : null}
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button disabled={busy || !state?.has_usage || variants.length === 0 || preview?.fits_nowhere === true} onClick={apply}>
            {state?.tracked ? "Save" : "Track where there is room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TrackProjectButton({ projectId, onChanged }: { projectId: string; onChanged?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" variant="outline" className="h-7" onClick={() => setOpen(true)}>
        <Radar className="h-3.5 w-3.5" />Track this project
      </Button>
      {open ? <TrackProjectDialog projectId={projectId} onClose={() => setOpen(false)} onChanged={onChanged ?? (() => {})} /> : null}
    </>
  );
}

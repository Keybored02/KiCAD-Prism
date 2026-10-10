import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchJson } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PartHit {
  id: string;
  name: string;
  value: string;
  current_revision_id: string;
}

interface Props {
  existingLabels: string[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (value: { label: string; componentId: string; revisionId: string; follow: "pinned" }) => void | Promise<void>;
}

/** Whether a catalog component has a converted model to draw and check (P2 §24.1). */
function useHasModel(componentId: string | null): boolean | null {
  const [state, setState] = useState<{ id: string; ok: boolean } | null>(null);
  useEffect(() => {
    if (!componentId) return;
    let cancelled = false;
    fetchJson<{ items: { glb: unknown }[] }>(`/api/catalog/components/${encodeURIComponent(componentId)}/models`)
      .then((body) => !cancelled && setState({ id: componentId, ok: body.items.some((model) => model.glb) }))
      .catch(() => !cancelled && setState({ id: componentId, ok: false }));
    return () => {
      cancelled = true;
    };
  }, [componentId]);
  return componentId && state?.id === componentId ? state.ok : null;
}

/** Add → Part: a mechanical part (enclosure, bracket) from the catalog, placed in 3D like a board. */
export function AddPartDialog({ existingLabels, busy, onClose, onSubmit }: Props) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PartHit[] | null>(null);
  const [chosen, setChosen] = useState<PartHit | null>(null);
  const [label, setLabel] = useState("");
  const hasModel = useHasModel(chosen?.id ?? null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      fetchJson<{ items: PartHit[] }>(`/api/catalog/components?kind=part&page_size=20&q=${encodeURIComponent(query.trim())}`)
        .then((body) => !cancelled && setHits(body.items))
        .catch(() => !cancelled && setHits([]));
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const taken = existingLabels.some((existing) => existing.toLowerCase() === label.trim().toLowerCase());
  const ready = Boolean(chosen) && hasModel === true && label.trim().length > 0 && !taken;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a part</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          if (ready && chosen) {
            void onSubmit({ label: label.trim(), componentId: chosen.id, revisionId: chosen.current_revision_id, follow: "pinned" });
          }
        }}>
          <Input aria-label="Find a part" placeholder="Find a part by name or MPN" value={query} autoFocus
            onChange={(event) => setQuery(event.target.value)} />
          <ul aria-label="Parts" className="max-h-56 overflow-y-auto rounded-md border text-sm">
            {hits === null ? <li className="px-3 py-2 text-muted-foreground">Loading…</li>
              : hits.length === 0 ? <li className="px-3 py-2 text-muted-foreground">No match</li>
                : hits.map((hit) => (
                  <li key={hit.id}>
                    <button type="button" aria-pressed={chosen?.id === hit.id}
                      onClick={() => {
                        setChosen(hit);
                        if (!label.trim()) setLabel(hit.name);
                      }}
                      className={cn("flex h-8 w-full items-center gap-2 px-3 text-left",
                        chosen?.id === hit.id ? "bg-accent font-medium" : "hover:bg-accent/50")}>
                      <span className="min-w-0 flex-1 truncate">{hit.name}</span>
                      <span className="max-w-[45%] truncate text-xs text-muted-foreground">{hit.value}</span>
                    </button>
                  </li>
                ))}
          </ul>
          {chosen && hasModel === false && <p className="text-xs text-destructive">No converted 3D model</p>}
          <div className="space-y-1.5">
            <Label htmlFor="part-label">Label</Label>
            <Input id="part-label" value={label} maxLength={100} placeholder="e.g. Enclosure" onChange={(event) => setLabel(event.target.value)} />
            {taken && <p className="text-xs text-destructive">Label in use</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy || !ready}>{busy ? "Adding…" : "Add part"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

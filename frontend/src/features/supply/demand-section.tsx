import { useCallback, useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplyDemand, SupplyDemandSummary } from "@/types/supply";
import { demandSentence, parseQuantity } from "./demand-model";
import { addPartDemand, closePartDemand, listPartDemands } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

interface DemandSectionProps {
  partId: string;
  canEdit: boolean;
}

interface Loaded {
  items: SupplyDemand[];
  summary: SupplyDemandSummary;
}

/** What is needed of the part, and what is left to cover once our own stock is counted. */
export function DemandSection({ partId, canEdit }: DemandSectionProps) {
  const fetcher = useCallback((signal: AbortSignal) => listPartDemands(partId, signal), [partId]);
  const demand = useLoaded<Loaded>(`${partId}:demand`, fetcher, "Could not load the demand");
  const { busy, error, run } = useConnectorSubmit();
  const [quantity, setQuantity] = useState("");
  const [needBy, setNeedBy] = useState("");
  const [note, setNote] = useState("");
  const [committed, setCommitted] = useState(false);

  const items = demand.data?.items ?? [];
  const amount = parseQuantity(quantity);

  const add = () => {
    if (amount === undefined) return;
    void run(async () => {
      await addPartDemand(partId, { quantity: amount, need_by: needBy || null, committed, note });
      setQuantity("");
      setNeedBy("");
      setNote("");
      setCommitted(false);
      await demand.refresh();
    });
  };

  return (
    <section aria-label="Demand" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demand</h3>
      {demand.data ? <p className="text-sm">{demandSentence(demand.data.summary)}</p> : null}
      {items.length > 0 ? (
        <ul className="divide-y border text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 p-2">
              <span className="min-w-0">
                <span className="font-medium tabular-nums">{item.quantity > 0 ? item.quantity.toLocaleString() : `${Math.abs(item.quantity).toLocaleString()} coming in`}</span>
                {item.need_by ? <span className="text-muted-foreground">, by {item.need_by}</span> : null}
                {item.note ? <span className="text-muted-foreground">, {item.note}</span> : null}
              </span>
              <span className="flex items-center gap-1">
                <Badge variant={item.state === "committed" ? "outline" : "secondary"}>{item.state === "committed" ? "Committed" : "Planned"}</Badge>
                {canEdit ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Close the demand for ${item.quantity}`}
                    disabled={busy}
                    onClick={() => void run(async () => { await closePartDemand(item.id); await demand.refresh(); })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {demand.status === "error" ? <p role="alert" className="text-xs text-destructive">{demand.error}</p> : null}
      {canEdit ? (
        <form className="grid gap-2 sm:grid-cols-[7rem_9rem_1fr]" onSubmit={(event) => { event.preventDefault(); add(); }}>
          <div className="space-y-1">
            <Label htmlFor="demand-quantity" className="text-xs">Quantity</Label>
            <Input id="demand-quantity" inputMode="numeric" placeholder="1000" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="demand-need-by" className="text-xs">Needed by</Label>
            <Input id="demand-need-by" type="date" value={needBy} onChange={(event) => setNeedBy(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="demand-note" className="text-xs">Note</Label>
            <Input id="demand-note" maxLength={200} value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          <div className="flex items-center gap-2 sm:col-span-3">
            <Checkbox id="demand-committed" checked={committed} onCheckedChange={(value) => setCommitted(value === true)} />
            <Label htmlFor="demand-committed" className="text-xs font-normal">Committed, not just planned</Label>
            <Button type="submit" size="sm" className="ml-auto" disabled={busy || amount === undefined}>Add demand</Button>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-3">A negative quantity is stock already on its way in.</p>
          {error ? <p role="alert" className="text-xs text-destructive sm:col-span-3">{error}</p> : null}
        </form>
      ) : null}
    </section>
  );
}

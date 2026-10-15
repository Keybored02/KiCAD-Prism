import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PackagingListing, PackagingOptions, PackagingSimilar } from "@/types/supply";
import { applySimilarPicks, clearPackagingPick, getPackagingOptions, pickPackaging } from "./packaging-api";

const ROWS: ReadonlyArray<{ label: string; value: (item: PackagingListing) => string }> = [
  { label: "Packaging", value: (item) => item.packaging.replace("_", " ") },
  { label: "SKU", value: (item) => item.sku },
  { label: "Minimum order", value: (item) => (item.moq === null ? "" : `${item.moq} in ${item.order_multiple ?? 1}s`) },
  { label: "Price at 1", value: (item) => (item.prices["1"] ? `${item.prices["1"]} ${item.currency}` : "") },
  { label: "Price at 100", value: (item) => (item.prices["100"] ? `${item.prices["100"]} ${item.currency}` : "") },
  { label: "Price at 1,000", value: (item) => (item.prices["1000"] ? `${item.prices["1000"]} ${item.currency}` : "") },
  { label: "Stock", value: (item) => (item.stock === null ? "" : item.stock.toLocaleString()) },
  { label: "Lead time", value: (item) => (item.lead_time_days === null ? "" : `${item.lead_time_days} days`) },
  { label: "Marketplace", value: (item) => (item.marketplace ? "yes" : "no") },
];

/** Listings of one part at one distributor, side by side, values that differ marked. Pick the one to follow. */
export function PackagingPickDialog({
  partId, connectorId, onClose, onChanged,
}: { partId: string; connectorId: string; onClose: () => void; onChanged: () => void }) {
  const [options, setOptions] = useState<PackagingOptions | null>(null);
  const [similar, setSimilar] = useState<{ packaging: string; items: PackagingSimilar[] } | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getPackagingOptions(partId, connectorId, controller.signal)
      .then(setOptions)
      .catch((caught: Error) => { if (!controller.signal.aborted) setError(caught.message); });
    return () => controller.abort();
  }, [partId, connectorId]);

  const differs = useMemo(
    () => new Set(ROWS.filter((row) => new Set((options?.listings ?? []).map(row.value)).size > 1).map((row) => row.label)),
    [options],
  );

  const pick = (listing: PackagingListing) => {
    pickPackaging(partId, connectorId, listing.id)
      .then((result) => {
        onChanged();
        if (result.similar.length === 0) { toast.success("Packaging picked"); onClose(); return; }
        setSimilar({ packaging: result.packaging, items: result.similar });
        setChosen(new Set(result.similar.map((item) => item.part_id)));
        setOptions((current) => (current ? { ...current, picked: listing.id } : current));
      })
      .catch((caught: Error) => setError(caught.message));
  };
  const clear = () => {
    clearPackagingPick(partId, connectorId).then(() => { onChanged(); onClose(); }).catch((caught: Error) => setError(caught.message));
  };
  const apply = () => {
    if (!similar) return;
    applySimilarPicks(connectorId, similar.packaging, [...chosen])
      .then((result) => { toast.success(`Picked for ${result.picked} more parts`); onChanged(); onClose(); })
      .catch((caught: Error) => setError(caught.message));
  };
  const toggle = (id: string, on: boolean) => setChosen((current) => {
    const next = new Set(current);
    if (on) next.add(id); else next.delete(id);
    return next;
  });

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{similar ? "Same for similar parts?" : "Pick a packaging"}</DialogTitle>
          <DialogDescription>
            {similar
              ? `These parts at this distributor offer the same packagings. Pick ${similar.packaging.replace("_", " ")} for the ones you tick.`
              : "Only the listing you pick is read, and only its stock counts. Values that differ are marked."}
          </DialogDescription>
        </DialogHeader>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {!similar && options ? (
          <div className="space-y-2">
            {options.saves_calls_a_day > 0 ? <p className="text-sm">Picking saves {options.saves_calls_a_day.toFixed(2)} calls a day at this distributor.</p> : null}
            <div className="overflow-x-auto">
              <table className="w-full text-xs" aria-label="Listings">
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.label} className="border-t">
                      <th scope="row" className="py-1 pr-2 text-left font-normal text-muted-foreground">{row.label}{differs.has(row.label) ? " *" : ""}</th>
                      {options.listings.map((item) => <td key={item.id} className={differs.has(row.label) ? "px-2 font-medium" : "px-2"}>{row.value(item)}</td>)}
                    </tr>
                  ))}
                  <tr className="border-t">
                    <td />
                    {options.listings.map((item) => (
                      <td key={item.id} className="px-2 py-1">
                        <Button size="sm" variant={options.picked === item.id ? "default" : "outline"} onClick={() => pick(item)}>
                          {options.picked === item.id ? "Picked" : "Pick this"}
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        {similar ? (
          <ul className="max-h-64 space-y-1 overflow-y-auto text-sm" aria-label="Similar parts">
            {similar.items.map((item) => (
              <li key={item.part_id} className="flex items-center gap-2">
                <Checkbox id={`sim-${item.part_id}`} checked={chosen.has(item.part_id)} onCheckedChange={(on) => toggle(item.part_id, on === true)} />
                <label htmlFor={`sim-${item.part_id}`}>{item.mpn}, {item.manufacturer} <span className="text-muted-foreground">({item.sku})</span></label>
              </li>
            ))}
          </ul>
        ) : null}
        <DialogFooter>
          {!similar && options?.picked ? <Button variant="outline" onClick={clear}>Follow all listings again</Button> : null}
          <Button variant="outline" onClick={onClose}>{similar ? "Not these" : "Close"}</Button>
          {similar ? <Button disabled={chosen.size === 0} onClick={apply}>Apply to {chosen.size}</Button> : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

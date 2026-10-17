import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PackagingListing, PackagingOptions, PackagingSimilar } from "@/types/supply";
import { rejectSupplyListings } from "./supply-api";
import { PackagingChip } from "./packaging-chip";
import { applySimilarPicks, clearPackagingPick, getPackagingOptions, pickPackaging } from "./packaging-api";

const money = (item: PackagingListing, quantity: string) => (item.prices[quantity] ? `${item.prices[quantity]} ${item.currency}` : "");

function Chip({ children, tone }: { children: ReactNode; tone?: "warning" }) {
  return <span className={tone === "warning" ? "bg-warning/15 px-2 py-0.5 text-warning" : "bg-secondary px-2 py-0.5"}>{children}</span>;
}

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
  const unpin = (listing: PackagingListing) => {
    rejectSupplyListings([listing.id])
      .then(() => {
        onChanged();
        setOptions((current) => (current ? { ...current, listings: current.listings.filter((item) => item.id !== listing.id) } : current));
        toast.success(`${listing.sku} taken off the part`);
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
      <DialogContent className="w-[min(95vw,64rem)] sm:max-w-none">
        <DialogHeader>
          <DialogTitle>{similar ? "Same for Similar Parts?" : "Pick a Packaging"}</DialogTitle>
          <DialogDescription>
            {similar
              ? `These parts at this distributor offer the same packagings. Pick ${similar.packaging.replace("_", " ")} for the ones you tick.`
              : "Only the listing you pick is read, and only its stock counts."}
          </DialogDescription>
        </DialogHeader>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {!similar && options ? (
          <div className="space-y-2">
            {options.picked && options.picked_by === "auto" ? <p className="text-xs text-muted-foreground">Picked by Prism{options.note ? `: ${options.note}` : ""}.</p> : null}
            {options.saves_calls_a_day > 0 ? <p className="text-xs text-muted-foreground">Picking saves {options.saves_calls_a_day.toFixed(2)} calls a day here.</p> : null}
            <ul className="max-h-[60vh] divide-y overflow-y-auto border" aria-label="Listings">
              {options.listings.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 p-3 hover:bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.sku}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.raw_mpn || "No number listed"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {item.other_number ? <Chip tone="warning">Different number</Chip> : null}
                    <Chip><PackagingChip packaging={item.packaging} reelSize={item.reel_size} inferred={item.packaging_inferred} />{item.packaging === "unknown" ? "Packaging unknown" : null}</Chip>
                    {item.stock !== null ? <Chip>{item.stock.toLocaleString()} in stock</Chip> : null}
                    {money(item, "100") ? <Chip>{money(item, "100")} at 100</Chip> : null}
                    {item.moq !== null ? <Chip>min {item.moq}{(item.order_multiple ?? 1) > 1 ? ` in ${item.order_multiple}s` : ""}</Chip> : null}
                    {item.lead_time_days !== null ? <Chip>{item.lead_time_days} days</Chip> : null}
                    {item.marketplace ? <Chip>Marketplace</Chip> : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {item.other_number && options.can_unpin ? (
                      <Button size="sm" variant="ghost" aria-label={`Unpin ${item.sku}`} onClick={() => unpin(item)}>Unpin</Button>
                    ) : null}
                    <Button size="sm" variant={options.picked === item.id ? "default" : "outline"} aria-label={`Pick ${item.sku}`} onClick={() => pick(item)}>
                      {options.picked === item.id ? "Picked" : "Pick"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
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

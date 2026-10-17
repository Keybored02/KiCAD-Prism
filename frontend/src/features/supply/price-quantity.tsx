import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplyListing } from "@/types/supply";
import { pricesAt } from "./price-text";
import { setPriceQuantity } from "./supply-api";
import { formatPrice } from "./supply-format";

const LOW = 1;
const HIGH = 1_000_000;

function QuantityDialog({ partId, quantity, standard, own, onClose, onChanged }: {
  partId: string; quantity: number; standard: number; own: boolean; onClose: () => void; onChanged: () => Promise<void> | void;
}) {
  const [text, setText] = useState(String(quantity));
  const [error, setError] = useState("");
  const wanted = Number(text.replace(/[,\s]/g, ""));
  const valid = Number.isInteger(wanted) && wanted >= LOW && wanted <= HIGH;
  const send = (value: number | null) => {
    setPriceQuantity(partId, value).then(() => onChanged()).then(onClose).catch((caught: Error) => setError(caught.message));
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Price quantity</DialogTitle>
          <DialogDescription>
            Lists, the price history and price alerts price this part at this many pieces. Others use {standard.toLocaleString()}.
          </DialogDescription>
        </DialogHeader>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <div className="space-y-1">
          <Label htmlFor="price-quantity" className="text-xs">Pieces</Label>
          <Input id="price-quantity" inputMode="numeric" value={text} onChange={(event) => setText(event.target.value)} />
          <p className="text-xs text-muted-foreground">{LOW.toLocaleString()} to {HIGH.toLocaleString()}.</p>
        </div>
        <DialogFooter>
          {own ? <Button variant="outline" onClick={() => send(null)}>Use {standard.toLocaleString()}</Button> : null}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} onClick={() => send(wanted)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** "Priced at 100 pieces", with a way to give this part its own quantity. */
export function PriceQuantity({ partId, quantity, standard, own, canEdit, onChanged }: {
  partId: string; quantity: number; standard: number; own: boolean; canEdit: boolean; onChanged: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
      <span>Priced at {quantity.toLocaleString()} pieces{own ? ", set for this part" : ""}.</span>
      {canEdit ? <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setOpen(true)}>Change</Button> : null}
      {open ? <QuantityDialog partId={partId} quantity={quantity} standard={standard} own={own} onClose={() => setOpen(false)} onChanged={onChanged} /> : null}
    </p>
  );
}

/** Try any quantity: what each listing charges for it now. Nothing is saved. */
export function TryQuantity({ listings }: { listings: SupplyListing[] }) {
  const [text, setText] = useState("");
  const wanted = Number(text.replace(/[,\s]/g, ""));
  const shown = Number.isInteger(wanted) && wanted >= LOW && wanted <= HIGH ? pricesAt(listings, wanted) : [];
  return (
    <div className="space-y-1">
      <Label htmlFor="try-quantity" className="text-xs font-normal text-muted-foreground">Try a quantity</Label>
      <Input id="try-quantity" className="h-8 w-32" inputMode="numeric" placeholder="500" value={text} onChange={(event) => setText(event.target.value)} />
      {shown.length > 0 ? (
        <ul className="space-y-0.5 text-xs">
          {shown.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="tabular-nums">{formatPrice(item.price, item.currency)}{item.quantity !== wanted ? `, orders ${item.quantity.toLocaleString()}` : ""}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

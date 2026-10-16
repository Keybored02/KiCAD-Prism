import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addComponentSource } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useSupplyManufacturers } from "./use-supply-parts";

interface AddAlternateDialogProps {
  open: boolean;
  componentId: string;
  /** What the person adding it can expect: an approver's part is approved at once. */
  approves: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddAlternateDialog({ open, componentId, approves, onOpenChange, onAdded }: AddAlternateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AlternateForm componentId={componentId} approves={approves} onClose={() => onOpenChange(false)} onAdded={onAdded} />
      </DialogContent>
    </Dialog>
  );
}

function AlternateForm({ componentId, approves, onClose, onAdded }: Omit<AddAlternateDialogProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [manufacturer, setManufacturer] = useState("");
  const [mpn, setMpn] = useState("");
  const { busy, error, run } = useConnectorSubmit();
  const manufacturers = useSupplyManufacturers();
  const ready = manufacturer.trim() !== "" && mpn.trim() !== "";

  const submit = async () => {
    const added = await run(async () => {
      await addComponentSource(componentId, manufacturer.trim(), mpn.trim());
    });
    if (added) {
      onAdded();
      onClose();
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) void submit();
      }}
    >
      <DialogHeader>
        <DialogTitle>Add an Alternate</DialogTitle>
        <DialogDescription>
          {approves
            ? "Another manufacturer part that may stand in for this component. It is approved as you add it."
            : "Another manufacturer part that may stand in for this component. QA approves it before it counts."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="alternate-manufacturer">Manufacturer</Label>
          <Input
            id="alternate-manufacturer"
            list="alternate-manufacturer-options"
            value={manufacturer}
            onChange={(event) => setManufacturer(event.target.value)}
          />
          <datalist id="alternate-manufacturer-options">
            {manufacturers.map((item) => <option key={item.id} value={item.name} />)}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="alternate-mpn">Part number</Label>
          <Input id="alternate-mpn" value={mpn} onChange={(event) => setMpn(event.target.value)} />
        </div>
      </div>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!ready || busy}>Add</Button>
      </DialogFooter>
    </form>
  );
}

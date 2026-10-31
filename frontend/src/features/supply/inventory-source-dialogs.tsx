import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventorySource } from "@/types/supply";
import { createInventorySource, updateInventorySource } from "./inventory-api";

const message = (caught: unknown) => (caught instanceof Error ? caught.message : String(caught));

/** Add a source that pushes its stock (``source`` null) or rename one. */
export function InventorySourceDialog({ open, source, onClose, onSaved }: {
  open: boolean;
  source: InventorySource | null;
  onClose: () => void;
  onSaved: (source: InventorySource) => void;
}) {
  const [name, setName] = useState(source?.display_name ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const saved = source ? await updateInventorySource(source.id, { display_name: name.trim() }) : await createInventorySource({ kind: "push", display_name: name.trim() });
      // Closed first: saving a new source opens the next step, which a later close would undo.
      onClose();
      onSaved(saved);
    } catch (caught) {
      toast.error(message(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{source ? `Edit ${source.display_name}` : "Add inventory source"}</DialogTitle>
          <DialogDescription>A source that sends its stock to Prism with a push token of its own.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5"><Label htmlFor="inventory-name">Name</Label><Input id="inventory-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Stores" /></div>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button disabled={busy || name.trim() === ""} onClick={() => void save()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{source ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

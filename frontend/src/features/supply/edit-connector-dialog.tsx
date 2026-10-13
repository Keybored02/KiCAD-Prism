import { useReducer } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplyConnector } from "@/types/supply";
import { changesFrom, settingsProblem, valuesOf, type EditValues } from "./connector-form-model";
import { updateSupplyConnector } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";

function mergeValues(state: EditValues, change: Partial<EditValues>): EditValues {
  return { ...state, ...change };
}

interface EditConnectorDialogProps {
  connector: SupplyConnector | null;
  onClose: () => void;
  onSaved: (connector: SupplyConnector) => void;
}

export function EditConnectorDialog({ connector, onClose, onSaved }: EditConnectorDialogProps) {
  return (
    <Dialog open={connector !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        {connector ? <EditForm key={connector.id} connector={connector} onClose={onClose} onSaved={onSaved} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({ connector, onClose, onSaved }: { connector: SupplyConnector } & Omit<EditConnectorDialogProps, "connector">) {
  const [values, update] = useReducer(mergeValues, connector, valuesOf);
  const { busy, error, run } = useConnectorSubmit();
  const changes = changesFrom(connector, values);
  const problem = settingsProblem(values);
  const unchanged = Object.keys(changes).length === 0;

  const submit = async () => {
    const saved = await run(async () => onSaved(await updateSupplyConnector(connector.id, changes)));
    if (saved) onClose();
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!problem && !unchanged) void submit();
      }}
    >
      <DialogHeader>
        <DialogTitle>Edit {connector.display_name}</DialogTitle>
        <DialogDescription>{connector.provider_label}{connector.storefront ? ` · ${connector.storefront}` : ""}</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="edit-connector-name">Name</Label>
          <Input id="edit-connector-name" value={values.displayName} onChange={(event) => update({ displayName: event.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-connector-currency">Currency</Label>
          <Input id="edit-connector-currency" maxLength={3} value={values.currency} onChange={(event) => update({ currency: event.target.value })} />
        </div>
        {connector.metered ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="edit-connector-budget">Daily call budget</Label>
              <Input id="edit-connector-budget" inputMode="numeric" value={values.budget} onChange={(event) => update({ budget: event.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-connector-reserve">Held for lookups (%)</Label>
              <Input id="edit-connector-reserve" inputMode="numeric" value={values.reserve} onChange={(event) => update({ reserve: event.target.value })} />
            </div>
          </>
        ) : null}
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="edit-connector-retention">Keep raw samples (days)</Label>
          <Input
            id="edit-connector-retention"
            inputMode="numeric"
            placeholder="60"
            value={values.retention}
            onChange={(event) => update({ retention: event.target.value })}
          />
          <p className="text-[11px] text-muted-foreground">Older samples are kept as one row per day. Shorten it if the provider&apos;s terms limit storage.</p>
        </div>
      </div>
      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={busy || unchanged || problem !== null} title={problem ?? undefined}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AlertRules } from "@/types/supply";
import { getAlertRules, saveAlertRules } from "./tracking-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

const KIND_LABEL: Record<string, string> = {
  out_of_stock: "Out of stock",
  below_threshold: "At or below the threshold",
  rupture_soon: "Could run out soon",
  price_up: "Price rises",
  target_price_missed: "Price over the target",
  assessment_worse: "Assessment gets worse",
};

function Form({ partId, initial, mutable }: { partId: string; initial: AlertRules; mutable: string[] }) {
  const [draft, setDraft] = useState(initial);
  const { busy, error, run } = useConnectorSubmit();
  const muted = useMemo(() => new Set(draft.muted), [draft.muted]);
  const toggle = (kind: string, on: boolean) =>
    setDraft((current) => ({ ...current, muted: on ? current.muted.filter((item) => item !== kind) : [...current.muted, kind] }));
  const save = () => {
    void run(async () => {
      setDraft(await saveAlertRules(partId, draft));
      toast.success("Alert rules saved");
    });
  };
  return (
    <div className="space-y-3">
      <fieldset className="space-y-1">
        <legend className="text-xs text-muted-foreground">Alert me when</legend>
        {mutable.map((kind) => (
          <div key={kind} className="flex items-center gap-2">
            <Checkbox id={`rule-${kind}`} checked={!muted.has(kind)} onCheckedChange={(on) => toggle(kind, on === true)} />
            <Label htmlFor={`rule-${kind}`} className="font-normal">{KIND_LABEL[kind] ?? kind}</Label>
          </div>
        ))}
      </fieldset>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="rule-rise" className="text-xs">A price rise of at least (%)</Label>
          <Input id="rule-rise" type="number" min={1} max={500} className="h-8 w-24" placeholder="20" value={draft.price_rise_percent ?? ""}
            onChange={(event) => setDraft({ ...draft, price_rise_percent: event.target.value === "" ? null : Number(event.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rule-target" className="text-xs">Target price</Label>
          <Input id="rule-target" inputMode="decimal" className="h-8 w-28" value={draft.target_price ?? ""}
            onChange={(event) => setDraft({ ...draft, target_price: event.target.value === "" ? null : event.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rule-currency" className="text-xs">Currency</Label>
          <Input id="rule-currency" maxLength={3} className="h-8 w-20 uppercase" value={draft.target_currency}
            onChange={(event) => setDraft({ ...draft, target_currency: event.target.value.toUpperCase() })} />
        </div>
      </div>
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
      <Button type="button" size="sm" disabled={busy} onClick={save}>Save alert rules</Button>
    </div>
  );
}

/** Which alerts this part raises, how big a price rise matters, and a target price to stay under. */
export function AlertRulesSection({ partId, canEdit }: { partId: string; canEdit: boolean }) {
  const fetcher = useCallback((signal: AbortSignal) => getAlertRules(partId, signal), [partId]);
  const { data, status } = useLoaded<AlertRules & { mutable: string[] }>(`rules:${partId}`, fetcher, "Could not load the alert rules");
  if (!canEdit || status !== "ready" || !data) return null;
  return (
    <section aria-label="Alert rules" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alert rules</h3>
      <Form partId={partId} initial={{ muted: data.muted, price_rise_percent: data.price_rise_percent, target_price: data.target_price, target_currency: data.target_currency }} mutable={data.mutable} />
    </section>
  );
}

import { useCallback, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { AssessmentSettings, AssessmentSettingsView, AssessmentSeverity } from "@/types/supply";
import { getAssessmentSettings, resetAssessmentSettings, saveAssessmentSettings } from "./supply-api";
import { ScheduleSettings } from "./schedule-settings";
import { MakerSpellings } from "./maker-spellings";
import { ExchangeRates } from "./exchange-rates";
import { NumberEndings } from "./number-endings";
import { PreferredDistributors } from "./preferred-distributors";
import { SvhcListUpload } from "./svhc-list-upload";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

const SEVERITY_LABEL: Record<AssessmentSeverity, string> = { ok: "Note only", warning: "Warning", error: "Error", fatal: "Critical" };

/** A whole number inside its range, else the one it had. */
function whole(value: string, low: number, high: number, keep: number): number {
  const next = Number(value);
  return Number.isInteger(next) && next >= low && next <= high ? next : keep;
}

interface SupplySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** What the assessment weighs. For administrators; everything starts at the defaults. */
export function SupplySettingsDialog({ open, onOpenChange }: SupplySettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Supply Settings</DialogTitle>
          <DialogDescription>
            How parts are judged. A change applies to every health figure and status from now on, and is recorded.
          </DialogDescription>
        </DialogHeader>
        <Body onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Body({ onClose }: { onClose: () => void }) {
  const fetcher = useCallback((signal: AbortSignal) => getAssessmentSettings(signal), []);
  const loaded = useLoaded<AssessmentSettingsView>("assessment-settings", fetcher, "Could not load the settings");
  if (loaded.status === "loading") return <Skeleton className="h-60 w-full" aria-label="Loading the settings" />;
  if (loaded.status === "error" || !loaded.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-3">
          {loaded.error}
          <Button size="sm" variant="outline" onClick={loaded.retry}>Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }
  return <Form view={loaded.data} onClose={onClose} />;
}

function Form({ view, onClose }: { view: AssessmentSettingsView; onClose: () => void }) {
  const [draft, setDraft] = useState<AssessmentSettings>(view.settings);
  const { busy, error, run } = useConnectorSubmit();
  const [lowLead, highLead] = view.ranges.lead_time_days;
  const [lowLastBuy, highLastBuy] = view.ranges.last_buy_error_days;
  const [lowLate, highLate] = view.ranges.late_hours;
  const [lowQuantity, highQuantity] = view.ranges.price_quantity;

  const save = async () => {
    if (await run(async () => { await saveAssessmentSettings(draft); })) onClose();
  };
  const reset = async () => {
    if (await run(async () => { await resetAssessmentSettings(); })) onClose();
  };

  return (
    <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="setting-lead">Longest lead time you accept, in days</Label>
          <Input id="setting-lead" inputMode="numeric" value={draft.lead_time_days}
            onChange={(event) => setDraft({ ...draft, lead_time_days: whole(event.target.value, lowLead, highLead, draft.lead_time_days) })} />
          <p className="text-xs text-muted-foreground">{lowLead} to {highLead}. Longer is a finding.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="setting-last-buy">Last date to buy is an error within, in days</Label>
          <Input id="setting-last-buy" inputMode="numeric" value={draft.last_buy_error_days}
            onChange={(event) => setDraft({ ...draft, last_buy_error_days: whole(event.target.value, lowLastBuy, highLastBuy, draft.last_buy_error_days) })} />
          <p className="text-xs text-muted-foreground">{lowLastBuy} to {highLastBuy}. A last time buy this close to its last date is an error, and fatal once the date has passed.</p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="setting-currency">Currency for comparing and totalling prices</Label>
          <Input id="setting-currency" className="w-28" maxLength={3} value={draft.base_currency}
            onChange={(event) => setDraft({ ...draft, base_currency: event.target.value.toUpperCase() })} />
          <p className="text-xs text-muted-foreground">Three letters, such as EUR. Rates come from the European Central Bank each day.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="setting-quantity">Price quantity, in pieces</Label>
          <Input id="setting-quantity" inputMode="numeric" value={draft.price_quantity}
            onChange={(event) => setDraft({ ...draft, price_quantity: whole(event.target.value, lowQuantity, highQuantity, draft.price_quantity) })} />
          <p className="text-xs text-muted-foreground">{lowQuantity.toLocaleString()} to {highQuantity.toLocaleString()}. Lists and price history price at this; a part can have its own.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="setting-late">A read is late when it is overdue by, in hours</Label>
          <Input id="setting-late" inputMode="numeric" value={draft.late_hours}
            onChange={(event) => setDraft({ ...draft, late_hours: whole(event.target.value, lowLate, highLate, draft.late_hours) })} />
          <p className="text-xs text-muted-foreground">{lowLate} to {highLate}. Counted from when the part's schedule wanted the read: a day for a daily part, a week for a weekly one, a month for a monthly one.</p>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">How serious each check is</legend>
        <ul className="divide-y border">
          {view.checks.map((check) => (
            <li key={check.id} className="flex items-center justify-between gap-3 p-2 text-sm">
              <Label htmlFor={`severity-${check.id}`} className="font-normal">{check.label}</Label>
              <select
                id={`severity-${check.id}`}
                className="h-8 border bg-background px-2 text-sm"
                value={draft.severity[check.id]}
                onChange={(event) => setDraft({ ...draft, severity: { ...draft.severity, [check.id]: event.target.value as AssessmentSeverity } })}
              >
                {(Object.keys(SEVERITY_LABEL) as AssessmentSeverity[]).map((value) => (
                  <option key={value} value={value}>{SEVERITY_LABEL[value]}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">A note is shown but does not count against health.</p>
      </fieldset>

      <PreferredDistributors draft={draft} onChange={setDraft} />

      <SvhcListUpload />
      <ScheduleSettings />
      <MakerSpellings />
      <NumberEndings />
      <ExchangeRates />

      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
      <DialogFooter className="gap-2 sm:justify-between">
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void reset()}>Back to defaults</Button>
        <span className="flex gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>Save</Button>
        </span>
      </DialogFooter>
    </form>
  );
}

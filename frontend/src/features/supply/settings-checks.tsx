import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssessmentSettingsView, AssessmentSeverity } from "@/types/supply";
import { DefaultNote, SettingsGroup, whole } from "./settings-group";

const SEVERITY_LABEL: Record<AssessmentSeverity, string> = { ok: "Note only", warning: "Warning", error: "Error", fatal: "Critical" };
const AREAS = ["Lifecycle", "Sourcing", "Stock", "Compliance", "BOM line"] as const;
const FIELDS = ["lead_time_days", "last_buy_error_days", "late_hours", "severity"] as const;

/** What is a finding and how serious each check is, grouped by area; a check changed from its default is marked. */
export function SettingsChecks({ view, readOnly, onSaved }: { view: AssessmentSettingsView; readOnly: boolean; onSaved: (next: AssessmentSettingsView) => void }) {
  const [lowLead, highLead] = view.ranges.lead_time_days;
  const [lowLastBuy, highLastBuy] = view.ranges.last_buy_error_days;
  const [lowLate, highLate] = view.ranges.late_hours;
  const defaults = view.defaults;
  return (
    <SettingsGroup title="Health checks" fields={FIELDS} view={view} readOnly={readOnly} onSaved={onSaved}>
      {(draft, set) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="setting-lead">Longest lead time you accept, in days</Label>
              <span className="flex items-center">
                <Input id="setting-lead" inputMode="numeric" className="w-28" value={draft.lead_time_days}
                  onChange={(event) => set({ ...draft, lead_time_days: whole(event.target.value, lowLead, highLead, draft.lead_time_days) })} />
                <DefaultNote changed={draft.lead_time_days !== defaults.lead_time_days} text={String(defaults.lead_time_days)} />
              </span>
              <p className="text-xs text-muted-foreground">{lowLead} to {highLead}. Longer is a finding.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setting-last-buy">Last date to buy is an error within, in days</Label>
              <span className="flex items-center">
                <Input id="setting-last-buy" inputMode="numeric" className="w-28" value={draft.last_buy_error_days}
                  onChange={(event) => set({ ...draft, last_buy_error_days: whole(event.target.value, lowLastBuy, highLastBuy, draft.last_buy_error_days) })} />
                <DefaultNote changed={draft.last_buy_error_days !== defaults.last_buy_error_days} text={String(defaults.last_buy_error_days)} />
              </span>
              <p className="text-xs text-muted-foreground">{lowLastBuy} to {highLastBuy}. Fatal once the date has passed and no distributor has stock.</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="setting-late">A read is late when it is overdue by, in hours</Label>
              <span className="flex items-center">
                <Input id="setting-late" inputMode="numeric" className="w-28" value={draft.late_hours}
                  onChange={(event) => set({ ...draft, late_hours: whole(event.target.value, lowLate, highLate, draft.late_hours) })} />
                <DefaultNote changed={draft.late_hours !== defaults.late_hours} text={String(defaults.late_hours)} />
              </span>
              <p className="text-xs text-muted-foreground">{lowLate} to {highLate}. Counted from when the part's schedule wanted the read: a day for a daily part, a week for a weekly one, a month for a monthly one.</p>
            </div>
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">How serious each check is</legend>
            {AREAS.map((area) => (
              <div key={area} className="space-y-1">
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{area}</h4>
                <ul className="divide-y border">
                  {view.checks.flatMap((check) => (check.area !== area ? [] : [(
                    <li key={check.id} className="flex items-center justify-between gap-3 p-2 text-sm">
                      <Label htmlFor={`severity-${check.id}`} className="font-normal">{check.label}</Label>
                      <span className="flex items-center">
                        <select id={`severity-${check.id}`} className="h-8 border bg-background px-2 text-sm" value={draft.severity[check.id]}
                          onChange={(event) => set({ ...draft, severity: { ...draft.severity, [check.id]: event.target.value as AssessmentSeverity } })}>
                          {(Object.keys(SEVERITY_LABEL) as AssessmentSeverity[]).map((value) => <option key={value} value={value}>{SEVERITY_LABEL[value]}</option>)}
                        </select>
                        <DefaultNote changed={draft.severity[check.id] !== defaults.severity[check.id]} text={SEVERITY_LABEL[defaults.severity[check.id]].toLowerCase()} />
                      </span>
                    </li>
                  )]))}
                </ul>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">A note is shown but does not count against health.</p>
          </fieldset>
        </>
      )}
    </SettingsGroup>
  );
}

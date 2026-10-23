import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssessmentSettingsView } from "@/types/supply";
import { DefaultNote, SettingsGroup, whole } from "./settings-group";

const FIELDS = ["alert_price_rise_percent", "alert_likely_out_percent"] as const;

/** When an alert is raised unless a part asks for its own line. */
export function SettingsAlerts({ view, readOnly, onSaved }: { view: AssessmentSettingsView; readOnly: boolean; onSaved: (next: AssessmentSettingsView) => void }) {
  const [lowRise, highRise] = view.ranges.alert_price_rise_percent;
  const [lowChance, highChance] = view.ranges.alert_likely_out_percent;
  const defaults = view.defaults;
  return (
    <SettingsGroup title="Alerts" fields={FIELDS} view={view} readOnly={readOnly} onSaved={onSaved}>
      {(draft, set) => (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="setting-price-rise">Price rise alert (%)</Label>
            <span className="flex items-center">
              <Input id="setting-price-rise" inputMode="numeric" className="w-28" value={draft.alert_price_rise_percent}
                onChange={(event) => set({ ...draft, alert_price_rise_percent: whole(event.target.value, lowRise, highRise, draft.alert_price_rise_percent) })} />
              <DefaultNote changed={draft.alert_price_rise_percent !== defaults.alert_price_rise_percent} text={`${defaults.alert_price_rise_percent}%`} />
            </span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="setting-likely-out">Likely to run out alert (% chance)</Label>
            <span className="flex items-center">
              <Input id="setting-likely-out" inputMode="numeric" className="w-28" value={draft.alert_likely_out_percent}
                onChange={(event) => set({ ...draft, alert_likely_out_percent: whole(event.target.value, lowChance, highChance, draft.alert_likely_out_percent) })} />
              <DefaultNote changed={draft.alert_likely_out_percent !== defaults.alert_likely_out_percent} text={`${defaults.alert_likely_out_percent}%`} />
            </span>
            <p className="text-xs text-muted-foreground">Chance of being out everywhere within four weeks. A part's own rule comes first.</p>
          </div>
        </>
      )}
    </SettingsGroup>
  );
}

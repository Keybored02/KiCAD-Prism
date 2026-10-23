import { useCallback, useState, type ReactNode } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/types/auth";
import type { AssessmentSettingsView } from "@/types/supply";
import { ExchangeRates } from "./exchange-rates";
import { MakerSpellings } from "./maker-spellings";
import { NumberEndings } from "./number-endings";
import { ScheduleSettings } from "./schedule-settings";
import { SettingsAlerts } from "./settings-alerts";
import { SettingsChecks } from "./settings-checks";
import { SettingsCosting } from "./settings-costing";
import { SvhcListUpload } from "./svhc-list-upload";
import { getAssessmentSettings } from "./supply-api";
import { useLoaded } from "./use-loaded";

type GroupId = "costing" | "checks" | "alerts" | "reading" | "matching" | "reference";

const GROUPS: ReadonlyArray<{ id: GroupId; label: string; about: string }> = [
  { id: "costing", label: "Costing", about: "What a price is worked out with." },
  { id: "checks", label: "Health checks", about: "What counts as a finding and how serious each one is. A change applies to every health figure and status from now on, and is recorded." },
  { id: "alerts", label: "Alerts", about: "When an alert is raised for a part that has no rule of its own." },
  { id: "reading", label: "Reading", about: "Which spare work may run. Budgets are on each connector's card." },
  { id: "matching", label: "Matching", about: "How makers and part numbers are matched. These save as they change." },
  { id: "reference", label: "Reference data", about: "Exchange rates and the REACH Candidate List. These save as they change." },
];

/** A group of lists that save as they change, shown read-only to anyone who is not an administrator. */
function Lists({ readOnly, children }: { readOnly: boolean; children: ReactNode }) {
  return <fieldset disabled={readOnly} className="space-y-4">{children}{readOnly ? <p className="text-xs text-muted-foreground">Administrators change these.</p> : null}</fieldset>;
}

function Group({ id, view, readOnly, onSaved }: { id: GroupId; view: AssessmentSettingsView; readOnly: boolean; onSaved: (next: AssessmentSettingsView) => void }) {
  switch (id) {
    case "costing": return <SettingsCosting view={view} readOnly={readOnly} onSaved={onSaved} />;
    case "checks": return <SettingsChecks view={view} readOnly={readOnly} onSaved={onSaved} />;
    case "alerts": return <SettingsAlerts view={view} readOnly={readOnly} onSaved={onSaved} />;
    case "reading": return (
      <Lists readOnly={readOnly}>
        <ScheduleSettings />
        <p className="text-xs text-muted-foreground">How many calls a day each distributor allows, and the share held for people, are set on its card in Connectors.</p>
      </Lists>
    );
    case "matching": return <Lists readOnly={readOnly}><MakerSpellings /><NumberEndings /></Lists>;
    case "reference": return <Lists readOnly={readOnly}><ExchangeRates /><SvhcListUpload /></Lists>;
  }
}

/** Supply settings: a page of groups, each saved on its own. Everyone who reads supply sees it; administrators change it. */
export function SettingsView({ user }: { user: User | null }) {
  const fetcher = useCallback((signal: AbortSignal) => getAssessmentSettings(signal), []);
  const loaded = useLoaded<AssessmentSettingsView>("assessment-settings", fetcher, "Could not load the settings");
  const [group, setGroup] = useState<GroupId>("costing");
  const [saved, setSaved] = useState<AssessmentSettingsView | null>(null);
  if (loaded.status === "loading") return <div className="p-4"><Skeleton className="h-60 w-full" aria-label="Loading the settings" /></div>;
  if (loaded.status === "error" || !loaded.data) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-3">
            {loaded.error}
            <Button size="sm" variant="outline" onClick={loaded.retry}>Retry</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  // What was saved last is what the groups start from, so a second group never sends the first one's old figures back.
  const view = saved ?? loaded.data;
  const current = GROUPS.find((item) => item.id === group) ?? GROUPS[0];
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 md:flex-row">
      <nav aria-label="Settings groups" className="flex shrink-0 gap-1 md:w-48 md:flex-col">
        {GROUPS.map((item) => (
          <button
            key={item.id} type="button" aria-current={item.id === group ? "page" : undefined}
            className={`px-3 py-2 text-left text-sm ${item.id === group ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/50"}`}
            onClick={() => setGroup(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <section aria-label={current.label} className="min-w-0 max-w-2xl flex-1 space-y-3">
        <div>
          <h3 className="text-sm font-semibold">{current.label}</h3>
          <p className="text-xs text-muted-foreground">{current.about}</p>
        </div>
        <Group key={`${group}:${JSON.stringify(view.settings)}`} id={group} view={view} readOnly={user?.role !== "admin"} onSaved={setSaved} />
      </section>
    </div>
  );
}

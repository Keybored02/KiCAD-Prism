import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ScheduleSettings as Schedule } from "@/types/supply";
import { getSchedule, saveSchedule } from "./tracking-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

const SPARE: ReadonlyArray<{ id: keyof Schedule["spare"]; label: string }> = [
  { id: "waiting", label: "Read parts waiting for room" },
  { id: "tier2_early", label: "Read tier-2 parts ahead of their time" },
  { id: "notices", label: "Read change notices of parts nobody tracks" },
];

function Form({ initial }: { initial: Schedule }) {
  const [draft, setDraft] = useState(initial);
  const { busy, error, run } = useConnectorSubmit();
  const save = () => {
    void run(async () => { setDraft(await saveSchedule(draft)); toast.success("Spare work saved"); });
  };
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Spare work</legend>
      <p className="text-xs text-muted-foreground">
        Calls that scheduled reads and people will not need today go to spare work, at any hour: at most 5% of the day's
        budget an hour, with no hourly limit in the last 3 hours before a provider's reset. What people usually use for the
        rest of the day stays theirs.
      </p>
      <div className="space-y-1">
        {SPARE.map((item) => (
          <span key={item.id} className="flex items-center gap-1.5">
            <Checkbox id={`spare-${item.id}`} checked={draft.spare[item.id]} onCheckedChange={(on) => setDraft({ ...draft, spare: { ...draft.spare, [item.id]: on === true } })} />
            <Label htmlFor={`spare-${item.id}`} className="font-normal">{item.label}</Label>
          </span>
        ))}
      </div>
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
      <Button type="button" size="sm" disabled={busy} onClick={save}>Save spare work</Button>
    </fieldset>
  );
}

/** Which spare work is on. For administrators. */
export function ScheduleSettings() {
  const fetcher = useCallback((signal: AbortSignal) => getSchedule(signal), []);
  const { data, status } = useLoaded<Schedule>("schedule", fetcher, "Could not load the schedule");
  if (status !== "ready" || !data) return null;
  return <Form initial={data} />;
}

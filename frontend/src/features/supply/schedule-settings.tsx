import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScheduleSettings as Schedule } from "@/types/supply";
import { getSchedule, saveSchedule } from "./tracking-api";
import { useConnectorSubmit } from "./use-connector-submit";
import { useLoaded } from "./use-loaded";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SPARE: ReadonlyArray<{ id: keyof Schedule["spare"]; label: string }> = [
  { id: "waiting", label: "Read parts waiting for room" },
  { id: "tier2_early", label: "Read tier-2 parts ahead of their time" },
  { id: "notices", label: "Read change notices of parts nobody tracks" },
];

function Form({ initial }: { initial: Schedule }) {
  const [draft, setDraft] = useState(initial);
  const { busy, error, run } = useConnectorSubmit();
  const working = useMemo(() => new Set(draft.days), [draft.days]);
  const toggleDay = (day: number, on: boolean) =>
    setDraft((current) => ({ ...current, days: on ? [...new Set([...current.days, day])].sort() : current.days.filter((item) => item !== day) }));
  const save = () => {
    void run(async () => { setDraft(await saveSchedule(draft)); toast.success("Schedule saved"); });
  };
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Working week and spare budget</legend>
      <p className="text-xs text-muted-foreground">
        Budget nobody used is spent on spare work: outside these hours, on days off, and in the last three hours of a
        provider's day. People's reads always keep a quarter of the pool.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1"><Label htmlFor="schedule-tz" className="text-xs">Time zone</Label><Input id="schedule-tz" className="w-40" value={draft.tz} onChange={(event) => setDraft({ ...draft, tz: event.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="schedule-start" className="text-xs">From</Label><Input id="schedule-start" className="w-24" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="schedule-end" className="text-xs">To</Label><Input id="schedule-end" className="w-24" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></div>
      </div>
      <div className="flex flex-wrap gap-3">
        {DAYS.map((name, index) => (
          <span key={name} className="flex items-center gap-1.5">
            <Checkbox id={`day-${index}`} checked={working.has(index)} onCheckedChange={(on) => toggleDay(index, on === true)} />
            <Label htmlFor={`day-${index}`} className="font-normal">{name}</Label>
          </span>
        ))}
      </div>
      <div className="space-y-1">
        {SPARE.map((item) => (
          <span key={item.id} className="flex items-center gap-1.5">
            <Checkbox id={`spare-${item.id}`} checked={draft.spare[item.id]} onCheckedChange={(on) => setDraft({ ...draft, spare: { ...draft.spare, [item.id]: on === true } })} />
            <Label htmlFor={`spare-${item.id}`} className="font-normal">{item.label}</Label>
          </span>
        ))}
      </div>
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
      <Button type="button" size="sm" disabled={busy} onClick={save}>Save schedule</Button>
    </fieldset>
  );
}

/** The workspace's working week, and which spare work is on. For administrators. */
export function ScheduleSettings() {
  const fetcher = useCallback((signal: AbortSignal) => getSchedule(signal), []);
  const { data, status } = useLoaded<Schedule>("schedule", fetcher, "Could not load the schedule");
  if (status !== "ready" || !data) return null;
  return <Form initial={data} />;
}

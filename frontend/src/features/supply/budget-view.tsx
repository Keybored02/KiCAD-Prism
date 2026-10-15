import { useCallback } from "react";

import type { BudgetCall, BudgetConnector } from "@/types/supply";
import { getBudget } from "./tracking-api";
import { useLoaded } from "./use-loaded";
import { VendorName } from "./vendor-name";

const PURPOSES: ReadonlyArray<{ id: string; label: string; tone: string }> = [
  { id: "tier1", label: "Tier 1", tone: "bg-primary" },
  { id: "tier2", label: "Tier 2", tone: "bg-primary/60" },
  { id: "committed", label: "Committed", tone: "bg-primary/40" },
  { id: "interactive", label: "People", tone: "bg-warning" },
  { id: "oneoff", label: "One-off", tone: "bg-warning/60" },
  { id: "spare", label: "Spare", tone: "bg-success" },
];

function hoursMinutes(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function Bar({ label, spent, capacity }: { label: string; spent: number; capacity: number }) {
  const share = capacity > 0 ? Math.min(100, (spent / capacity) * 100) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs"><span>{label}</span><span className="text-muted-foreground">{spent} of {capacity}</span></div>
      <div className="h-2 bg-muted" role="img" aria-label={`${label}: ${spent} of ${capacity} calls`}>
        <div className="h-2 bg-primary" style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

function totalsByPurpose(rows: readonly BudgetCall[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.purpose, (totals.get(row.purpose) ?? 0) + row.calls);
  return totals;
}

/** Fourteen days as stacked bars, one per day, split by what the calls were for. */
function Days({ rows }: { rows: readonly BudgetCall[] }) {
  const days = [...new Set(rows.map((row) => row.day ?? ""))].sort();
  const peak = Math.max(1, ...days.map((day) => rows.reduce((sum, row) => sum + (row.day === day ? row.calls : 0), 0)));
  return (
    <div className="flex h-16 items-end gap-0.5" role="img" aria-label="Calls a day for the last two weeks">
      {days.map((day) => (
        <div key={day} className="flex h-full flex-1 flex-col-reverse" title={day}>
          {PURPOSES.map((purpose) => {
            const calls = rows.reduce((sum, row) => sum + (row.day === day && row.purpose === purpose.id ? row.calls : 0), 0);
            return calls > 0 ? <div key={purpose.id} className={purpose.tone} style={{ height: `${(calls / peak) * 100}%` }} /> : null;
          })}
        </div>
      ))}
    </div>
  );
}

function ConnectorBudget({ item }: { item: BudgetConnector }) {
  const today = totalsByPurpose(item.hourly);
  const standing = item.tracking;
  return (
    <article aria-label={`${item.name} call budget`} className="space-y-2 border p-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <VendorName provider={item.provider} name={item.name} className="font-medium" />
        <span className="text-xs text-muted-foreground">
          Day resets in {hoursMinutes(item.reset_in_seconds)}{item.shares_account ? ", shares its budget with another connector" : ""}
        </span>
      </div>
      <Bar label="Tracking (committed)" spent={item.committed.spent} capacity={item.committed.capacity} />
      <Bar label="Pool (people, first searches, one-off)" spent={item.pool.spent} capacity={item.pool.capacity} />
      {item.spare_spent > 0 ? <p className="text-xs text-muted-foreground">{item.spare_spent} spare calls today.</p> : null}
      {item.refused_today > 0 ? <p className="text-xs text-warning">{item.refused_today} calls turned away today.</p> : null}
      {standing ? (
        <p className="text-xs text-muted-foreground">
          {standing.admitted} parts read, costing {standing.committed} of {standing.capacity} calls a day.
          {standing.waiting > 0 ? ` ${standing.waiting} wait for room.` : ""}
        </p>
      ) : null}
      <ul className="flex flex-wrap gap-x-3 text-xs text-muted-foreground" aria-label="Spent today">
        {PURPOSES.filter((purpose) => today.has(purpose.id)).map((purpose) => (
          <li key={purpose.id}><span className={`mr-1 inline-block h-2 w-2 ${purpose.tone}`} />{purpose.label} {today.get(purpose.id)}</li>
        ))}
      </ul>
      <Days rows={item.days} />
      {item.owners.projects.length > 0 || item.owners.parts.length > 0 ? (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">What costs most</summary>
          <ul className="mt-1 space-y-0.5">
            {item.owners.projects.map((project) => (
              <li key={project.project_id}>{project.project_id || "Not in a project"}: {project.calls_a_day.toFixed(1)} calls a day</li>
            ))}
            {item.owners.parts.slice(0, 5).map((part) => (
              <li key={part.part_id} className="text-muted-foreground">
                {part.mpn}, {part.manufacturer}: {part.calls_a_day.toFixed(2)} a day{part.pick_saves > 0 ? `, a packaging pick saves ${part.pick_saves.toFixed(2)}` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}

/** Where every metered connector's call budget goes: today by purpose, two weeks by day, and what tracking costs. */
export function BudgetView() {
  const fetcher = useCallback((signal: AbortSignal) => getBudget(signal), []);
  const { data, status } = useLoaded<BudgetConnector[]>("budget", fetcher, "Could not load the call budget");
  if (status !== "ready" || !data || data.length === 0) return null;
  return (
    <section aria-label="Call budget" className="space-y-2">
      <h3 className="text-sm font-semibold">Call budget</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {data.map((item) => <ConnectorBudget key={item.connector_id} item={item} />)}
      </div>
    </section>
  );
}

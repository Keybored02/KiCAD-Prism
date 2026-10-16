import { cn } from "@/lib/utils";
import type { SupplyDashboard, SupplyStatus } from "@/types/supply";
import { ChartCard, FigureTable } from "./chart-card";
import { STATUS_LABEL } from "./supply-format";

const STATUS_BAR: Record<SupplyStatus, string> = {
  ok: "bg-success", warning: "bg-warning", error: "bg-destructive", fatal: "bg-destructive/70", unknown: "bg-muted-foreground/40",
};

/** Tracked parts in one bar, a segment a status. A segment opens the parts it counts. */
export function StatusBarCard({ statuses, onOpen }: { statuses: SupplyDashboard["statuses"]; onOpen: (status: SupplyStatus) => void }) {
  const total = statuses.reduce((sum, item) => sum + item.count, 0);
  const risky = statuses.filter((item) => item.status !== "ok" && item.status !== "unknown").reduce((sum, item) => sum + item.count, 0);
  const present = statuses.filter((item) => item.count > 0);
  return (
    <ChartCard
      title="Tracked parts by status"
      answer={total === 0 ? "No parts tracked yet" : risky === 0 ? "Nothing needs a look" : `${risky.toLocaleString()} of ${total.toLocaleString()} need a look`}
      table={<FigureTable rows={statuses.map((item) => [STATUS_LABEL[item.status], item.count])} />}
    >
      {total > 0 ? (
        <>
          <div className="flex h-6 w-full overflow-hidden" role="group" aria-label="Parts by status">
            {present.map((item) => (
              <button
                key={item.status}
                type="button"
                title={`${STATUS_LABEL[item.status]}: ${item.count}`}
                aria-label={`${STATUS_LABEL[item.status]}: ${item.count}`}
                className={cn("h-full hover:opacity-80", STATUS_BAR[item.status])}
                style={{ width: `${(item.count / total) * 100}%` }}
                onClick={() => onOpen(item.status)}
              />
            ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {present.map((item) => (
              <li key={item.status} className="flex items-center gap-1.5">
                <span className={cn("inline-block h-2.5 w-2.5", STATUS_BAR[item.status])} />{STATUS_LABEL[item.status]} <span className="tabular-nums text-muted-foreground">{item.count}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </ChartCard>
  );
}

type RunwayKey = keyof SupplyDashboard["runway"];

const RUNWAY: Array<{ key: RunwayKey; label: string; bad: boolean }> = [
  { key: "out_now", label: "Out now", bad: true },
  { key: "runs_out_2w", label: "Under 2 weeks", bad: true },
  { key: "runs_out_8w", label: "2 to 8 weeks", bad: false },
  { key: "runs_out_later", label: "Later", bad: false },
  { key: "steady", label: "Steady or rising", bad: false },
  { key: "few_readings", label: "Too few readings", bad: false },
];

/** When stock is projected to run out, as bars by bucket. A bar opens the parts in it. */
export function RunwayCard({ runway, onOpen }: { runway: SupplyDashboard["runway"]; onOpen: (key: RunwayKey) => void }) {
  const largest = Math.max(1, ...RUNWAY.map((item) => runway[item.key]));
  const soon = runway.out_now + runway.runs_out_2w;
  return (
    <ChartCard
      title="When stock runs out"
      info="Projected from each part's own readings at the rate its stock has been falling. Parts with too few readings are not guessed at."
      answer={soon === 0 ? "Nothing runs out within 2 weeks" : `${soon.toLocaleString()} ${soon === 1 ? "part is" : "parts are"} out or run out within 2 weeks`}
      table={<FigureTable rows={RUNWAY.map((item) => [item.label, runway[item.key]])} />}
    >
      <ul className="space-y-1">
        {RUNWAY.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              className="grid w-full grid-cols-[8rem_1fr_3rem] items-center gap-2 text-left text-xs hover:bg-muted/30"
              onClick={() => onOpen(item.key)}
              aria-label={`${item.label}: ${runway[item.key]}`}
            >
              <span>{item.label}</span>
              <span className="h-4 bg-muted/30"><span className={cn("block h-full", item.bad ? "bg-destructive" : "bg-primary")} style={{ width: `${(runway[item.key] / largest) * 100}%` }} /></span>
              <span className="text-right tabular-nums">{runway[item.key]}</span>
            </button>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

type HolderKey = keyof SupplyDashboard["holders"];

const HOLDERS: Array<{ key: HolderKey; label: string; stroke: string; swatch: string }> = [
  { key: "none", label: "No distributor", stroke: "stroke-destructive", swatch: "bg-destructive" },
  { key: "one", label: "One distributor", stroke: "stroke-warning", swatch: "bg-warning" },
  { key: "two", label: "Two", stroke: "stroke-primary/60", swatch: "bg-primary/60" },
  { key: "three_plus", label: "Three or more", stroke: "stroke-success", swatch: "bg-success" },
];

const RADIUS = 15.9155;

/** How many distributors hold stock of each part, as a donut. "One" is the single-source exposure. */
export function HoldersCard({ holders, onOpen }: { holders: SupplyDashboard["holders"]; onOpen: (key: HolderKey) => void }) {
  const total = HOLDERS.reduce((sum, item) => sum + holders[item.key], 0);
  let offset = 25;
  const arcs = HOLDERS.map((item) => {
    const share = (holders[item.key] / (total || 1)) * 100;
    const arc = { item, share, offset };
    offset -= share;
    return arc;
  });
  return (
    <ChartCard
      title="Where stock is held"
      answer={holders.one === 0 ? "No part depends on a single distributor" : `${holders.one.toLocaleString()} ${holders.one === 1 ? "part depends" : "parts depend"} on one distributor`}
      table={<FigureTable rows={HOLDERS.map((item) => [item.label, holders[item.key]])} />}
    >
      <div className="flex items-center gap-4">
        <svg role="img" aria-label="Parts by number of distributors holding stock" viewBox="0 0 36 36" className="h-24 w-24 shrink-0">
          <circle cx="18" cy="18" r={RADIUS} fill="none" className="stroke-muted" strokeWidth="5" />
          {total > 0 ? arcs.map(({ item, share, offset: start }) => (
            <circle key={item.key} cx="18" cy="18" r={RADIUS} fill="none" className={item.stroke} strokeWidth="5" strokeDasharray={`${share} ${100 - share}`} strokeDashoffset={start} />
          )) : null}
        </svg>
        <ul className="space-y-1 text-xs">
          {HOLDERS.map((item) => (
            <li key={item.key}>
              <button type="button" className="flex items-center gap-1.5 hover:underline" onClick={() => onOpen(item.key)}>
                <span className={cn("inline-block h-2.5 w-2.5", item.swatch)} />{item.label} <span className="tabular-nums text-muted-foreground">{holders[item.key]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}

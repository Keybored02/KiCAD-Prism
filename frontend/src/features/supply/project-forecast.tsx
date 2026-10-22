import { useCallback, useState } from "react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectForecast } from "@/types/supply";
import { ChartCard } from "./chart-card";
import { ModelChip } from "./forecast-chip";
import { chanceText } from "./forecast-text";
import { forecastWord } from "./forecast-words";
import { getProjectForecast } from "./supply-api";
import { formatPrice } from "./supply-format";
import { useLoaded } from "./use-loaded";

const MIN = 1;
const MAX = 1_000_000;
const SHOWN_WEEKS = 8;

/** The one board count of the tab: it drives the costing, the forecast and the CSV together, and is saved nowhere. */
export function BoardCount({ boards, onChange }: { boards: number; onChange: (next: number) => void }) {
  const [text, setText] = useState(String(boards));
  const apply = () => {
    const next = Math.floor(Number(text.replace(/[,\s]/g, "")));
    if (Number.isFinite(next) && next >= MIN && next <= MAX) onChange(next);
    else setText(String(boards));
  };
  return (
    <label className="flex items-center gap-1.5 text-sm">
      Boards
      <Input
        aria-label="Boards to forecast and cost" className="h-8 w-24" inputMode="numeric" value={text}
        onChange={(event) => setText(event.target.value)} onBlur={apply} onKeyDown={(event) => { if (event.key === "Enter") apply(); }}
      />
    </label>
  );
}

const WIDTH = 260;
const HEIGHT = 84;
const left = 28;

function point(week: number, probability: number): string {
  const x = left + (week / 12) * (WIDTH - left - 8);
  const y = HEIGHT - 14 - probability * (HEIGHT - 24);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

/** The chance every forecast line can be bought, week by week, with 50% and 80% marked and the stretch after 8 weeks dashed. */
function WeeksChart({ weeks, grey }: { weeks: number[]; grey: boolean }) {
  const stroke = grey ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))";
  const solid = weeks.slice(0, SHOWN_WEEKS + 1).map((value, week) => point(week, value)).join(" ");
  const dashed = weeks.slice(SHOWN_WEEKS).map((value, index) => point(SHOWN_WEEKS + index, value)).join(" ");
  return (
    <svg role="img" aria-label="Chance every part can be bought, week by week" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-24 w-full max-w-md">
      {[0.5, 0.8].map((level) => (
        <g key={level}>
          <line x1={left} x2={WIDTH - 8} y1={point(0, level).split(",")[1]} y2={point(0, level).split(",")[1]} stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <text x={2} y={Number(point(0, level).split(",")[1]) + 3} fontSize="8" fill="hsl(var(--muted-foreground))">{Math.round(level * 100)}%</text>
        </g>
      ))}
      <polyline points={solid} fill="none" stroke={stroke} strokeWidth="2" />
      <polyline points={dashed} fill="none" stroke={stroke} strokeWidth="2" strokeDasharray="4 3" />
      {[0, 4, 8, 12].map((week) => <text key={week} x={Number(point(week, 0).split(",")[0])} y={HEIGHT - 2} fontSize="8" textAnchor="middle" fill="hsl(var(--muted-foreground))">{week === 0 ? "now" : `${week}w`}</text>)}
    </svg>
  );
}

function costLine(forecast: ProjectForecast, currency: string): string | null {
  const cost = forecast.cost;
  if (!cost) return null;
  const f = (value: number) => formatPrice(String(Math.round(value * 100) / 100), currency);
  return `One board in 90 days: ${f(cost.h90.low)} to ${f(cost.h90.high)} (now ${f(cost.now)}${cost.lines_priced < forecast.lines ? `, ${cost.lines_priced} of ${forecast.lines} lines priced` : ""}).`;
}

/**
 * Can this project be built: the chance every part can be bought for a number of boards, week by week, what holds it back, and what a board
 * may cost. The board count is a question; nothing is saved. Greyed and labelled while the forecast is still learning.
 */
/** The forecast of a project's parts: shared by the forecast section and the parts table, which are given the same address. */
export function useProjectForecast(projectId: string, variant: string, boards: number, enabled = true) {
  const fetcher = useCallback((signal: AbortSignal) => getProjectForecast(projectId, boards, variant, signal), [projectId, boards, variant]);
  return useLoaded<ProjectForecast>(enabled ? `project-forecast:${projectId}:${variant}:${boards}` : null, fetcher, "Could not load the forecast");
}

export function ProjectForecastSection({ projectId, variant, boards, currency, onOpenPart }: {
  projectId: string; variant: string; boards: number; currency: string; onOpenPart: (partId: string) => void;
}) {
  const loaded = useProjectForecast(projectId, variant, boards);
  if (loaded.status === "loading") return <Skeleton className="h-32 w-full" aria-label="Loading the forecast" />;
  if (loaded.status === "error" || !loaded.data) return <p role="alert" className="text-sm text-destructive">{loaded.error}</p>;
  const forecast = loaded.data;
  const model = forecast.models.can_buy_8w;
  const grey = !model || model.state !== "shown";
  if (!forecast.available) {
    return (
      <section aria-label="Forecast" className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forecast for {boards.toLocaleString()} boards</h3>
        <p className="text-sm text-muted-foreground">Forecasts start after a week of readings of the tracked parts.</p>
      </section>
    );
  }
  const at8 = forecast.weeks[SHOWN_WEEKS];
  const cost = costLine(forecast, currency);
  return (
    <section aria-label="Forecast" className={`space-y-2 ${grey ? "text-muted-foreground" : ""}`}>
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forecast for {boards.toLocaleString()} boards</h3>
        <ModelChip model={model ? { state: model.state, checks: model.checks, needs: model.needs, reason: "" } : undefined} />
      </div>
      <p className="text-sm">
        Buildable in {SHOWN_WEEKS} weeks: <strong>{chanceText(forecastWord(at8))}</strong>
        {forecast.unknown_lines > 0 ? <span className="text-xs text-muted-foreground"> (of the {forecast.lines - forecast.unknown_lines} lines Prism can speak about; {forecast.unknown_lines} not tracked or too new)</span> : null}
      </p>
      <ChartCard
        title="Chance every part can be bought" info="Each week is the share of 1,000 simulated futures in which every line can be bought at its quantity from some distributor."
      >
        <WeeksChart weeks={forecast.weeks} grey={grey} />
      </ChartCard>
      {forecast.holding_back.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-medium">What holds it back</p>
          <ul className="divide-y border text-sm">
            {forecast.holding_back.map((item) => (
              <li key={item.key}>
                <button type="button" className="flex w-full flex-wrap items-baseline justify-between gap-2 p-2 text-left hover:bg-muted/30" onClick={() => onOpenPart(item.part_id)}>
                  <span className="font-medium">{item.mpn}</span>
                  <span className="text-xs text-muted-foreground">short in {Math.round(item.short_share * 100)}% of the futures at {SHOWN_WEEKS} weeks; {item.reason}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : <p className="text-xs">No part is likely to hold the build back.</p>}
      {cost ? <p className="text-sm">{cost}</p> : null}
      <p className="text-xs text-muted-foreground">Describes the parts as they stand: it plans no build and saves nothing.</p>
    </section>
  );
}

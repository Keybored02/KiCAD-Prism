import type { ReactNode } from "react";

import type { ProjectForecast, ProjectSupply, SupplyStatus } from "@/types/supply";
import { chanceText } from "./forecast-text";
import { forecastWord } from "./forecast-words";
import { CHIPS, LIKELY_OUT_CHANCE, type Chip } from "./project-part-filters";
import { StatusBar } from "./project-row-summary";
import { formatPrice, STATUS_LABEL } from "./supply-format";

const WEEKS = 8;

function Tile({ label, bad, children }: { label: string; bad?: boolean; children: ReactNode }) {
  return (
    <div className={`space-y-1 border p-3 ${bad ? "border-destructive/40" : ""}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

const big = (bad: boolean | undefined) => `text-xl font-semibold tabular-nums ${bad ? "text-destructive" : ""}`;

function BuildTile({ supply, boards, onOpenPart }: { supply: ProjectSupply; boards: number; onOpenPart: (partId: string) => void }) {
  const rollup = supply.rollup!;
  const limiting = (supply.parts ?? []).find((part) => part.key === rollup.limited_by);
  const covered = rollup.can_build;
  const short = covered !== null && covered < boards;
  return (
    <Tile label="Build" bad={short}>
      <p className={big(short)}>{covered === null ? "Not known" : `${Math.min(covered, boards).toLocaleString()} of ${boards.toLocaleString()} boards`}</p>
      <p className="text-xs text-muted-foreground">
        {covered === null ? "No stock figure yet." : short && limiting ? (
          <>limited by{" "}
            {limiting.part_id ? <button type="button" className="text-primary hover:underline" onClick={() => onOpenPart(limiting.part_id as string)}>{limiting.mpn}</button> : limiting.mpn}</>
        ) : `The stock covers ${covered.toLocaleString()}.`}
      </p>
    </Tile>
  );
}

function CostTile({ supply, boards }: { supply: ProjectSupply; boards: number }) {
  const rollup = supply.rollup!;
  const currency = rollup.currency;
  if (!rollup.cost_build || !currency) {
    return <Tile label="Cost"><p className={big(false)}>No total</p><p className="text-xs text-muted-foreground">Nothing is priced, or the prices cannot be added.</p></Tile>;
  }
  const waste = rollup.waste_cost && Number(rollup.waste_cost) > 0 ? `${formatPrice(rollup.waste_cost, currency)} left over from minimum orders` : "";
  return (
    <Tile label="Cost">
      <p className={big(false)}>{formatPrice(rollup.cost_build, currency)}</p>
      <p className="text-xs text-muted-foreground">
        for {boards.toLocaleString()} boards{rollup.cost_per_board ? `, ${formatPrice(rollup.cost_per_board, currency)} a board` : ""}
        {waste ? `, ${waste}` : ""}
        {rollup.lines_priced < rollup.lines ? `, ${rollup.lines_priced} of ${rollup.lines} lines priced` : ""}
      </p>
    </Tile>
  );
}

function HealthTile({ supply }: { supply: ProjectSupply }) {
  const rollup = supply.rollup!;
  const statuses: Partial<Record<SupplyStatus, number>> = {};
  const seen = new Set<string>();
  for (const part of supply.parts ?? []) {
    if (!part.part_id || !part.status || seen.has(part.part_id)) continue;
    seen.add(part.part_id);
    statuses[part.status] = (statuses[part.status] ?? 0) + 1;
  }
  const bad = rollup.health !== null && rollup.health_status !== "ok";
  const looks = Math.max(0, (rollup.needs_a_look ?? rollup.at_risk) - rollup.at_risk);
  return (
    <Tile label="Health" bad={bad && rollup.health_status !== "warning"}>
      <p className={big(bad)}>
        {rollup.health === null ? "No data" : `${rollup.health.toFixed(1)} of 10`}
        {rollup.health === null ? null : <span className="ml-2 text-xs font-normal text-muted-foreground">{STATUS_LABEL[rollup.health_status]}</span>}
      </p>
      <StatusBar group={{ statuses, count: seen.size }} className="w-full" />
      <p className="text-xs text-muted-foreground">{rollup.at_risk} at risk, {looks} more need a look, {rollup.not_tracked} not tracked</p>
    </Tile>
  );
}

function WeeksTile({ forecast, learning }: { forecast: ProjectForecast | undefined; learning: boolean }) {
  const chance = forecast?.available ? forecast.weeks[WEEKS] : undefined;
  return (
    <Tile label={`In ${WEEKS} weeks`}>
      <p className={`${big(false)} ${learning ? "text-muted-foreground" : ""}`}>{chance === undefined ? "Not yet" : chanceText(forecastWord(chance))}</p>
      <p className="text-xs text-muted-foreground">{chance === undefined ? "Forecasts start after a week of readings." : `the chance every part can be bought${learning ? ", still learning" : ""}`}</p>
    </Tile>
  );
}

/** Four tiles that answer "can we build N boards, and what stops us": the build, its cost, the health of the parts and the next 8 weeks. */
export function ProjectHeadline({ supply, boards, forecast, onOpenPart }: {
  supply: ProjectSupply; boards: number; forecast: ProjectForecast | undefined; onOpenPart: (partId: string) => void;
}) {
  if (!supply.rollup) return null;
  const learning = !forecast || forecast.models.can_buy_8w?.state !== "shown";
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Headline">
      <BuildTile supply={supply} boards={boards} onOpenPart={onOpenPart} />
      <CostTile supply={supply} boards={boards} />
      <HealthTile supply={supply} />
      <WeeksTile forecast={forecast} learning={learning} />
    </div>
  );
}

/** Counts of the parts that need a look, only the non-zero ones; a click filters the parts table to them and a second click clears it. */
export function NeedsALookChips({ supply, forecast, chip, onChip }: {
  supply: ProjectSupply; forecast: ProjectForecast | undefined; chip: Chip | null; onChip: (next: Chip | null) => void;
}) {
  const counts = supply.counts;
  if (!counts) return null;
  const chance = supply.likely_out_chance ?? LIKELY_OUT_CHANCE;
  const likely = Object.values(forecast?.by_line ?? {}).filter((share) => share >= chance).length;
  const shown = CHIPS.flatMap((item) => {
    const count = item.key === "likely_out" ? likely : (counts[item.key as keyof typeof counts] as number | undefined) ?? 0;
    return count > 0 ? [{ ...item, count }] : [];
  });
  if (shown.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Needs a look">
      {shown.map((item) => (
        <button
          key={item.key} type="button" aria-pressed={chip === item.key}
          className={`border px-2 py-1 text-xs ${chip === item.key ? "border-primary bg-primary/10" : "hover:bg-muted/40"}`}
          onClick={() => onChip(chip === item.key ? null : item.key)}
        >
          <span className="font-semibold tabular-nums">{item.count.toLocaleString()}</span> {item.label}
        </button>
      ))}
    </div>
  );
}

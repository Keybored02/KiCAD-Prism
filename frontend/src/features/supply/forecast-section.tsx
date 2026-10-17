import { useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import type { ForecastModelState, PartForecast } from "@/types/supply";
import { ModelChip } from "./forecast-chip";
import { chanceText, dateText, isGrey, priceRange, rangeText, whenText } from "./forecast-text";
import { formatPrice } from "./supply-format";

const MIN = 1;
const MAX = 1_000_000;

/** The inputs behind a line, one click away. */
function Why({ children }: { children: string }) {
  return (
    <details className="text-xs text-muted-foreground">
      <summary className="cursor-pointer select-none hover:text-foreground">Why</summary>
      <p className="mt-0.5 max-w-prose">{children}</p>
    </details>
  );
}

function Line({ model, children, why }: { model: ForecastModelState | undefined; children: ReactNode; why: string }) {
  return (
    <div className={isGrey(model) ? "text-muted-foreground" : ""}>
      <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span>{children}</span>
        <ModelChip model={model} />
        <Why>{why}</Why>
      </div>
    </div>
  );
}

/** Twelve cells, one a week: the darker, the likelier the part can be bought that week. */
function WeekStrip({ forecast, grey }: { forecast: PartForecast; grey: boolean }) {
  return (
    <ol aria-label="Chance it can be bought, week by week" className="flex gap-0.5">
      {(forecast.weeks ?? []).map((week) => (
        <li
          key={week.week}
          title={`Week ${week.week}, ${dateText(week.date, forecast.today)}: ${chanceText(week)}`}
          aria-label={`Week ${week.week}: ${chanceText(week)}`}
          className="h-4 w-5 border"
          style={{ backgroundColor: grey ? `hsl(var(--muted-foreground) / ${0.08 + week.probability * 0.3})` : `hsl(var(--primary) / ${0.08 + week.probability * 0.8})` }}
        />
      ))}
    </ol>
  );
}

function whyStock(forecast: PartForecast): string {
  const inputs = forecast.inputs;
  if (!inputs) return "";
  const drain = inputs.drain_known === 0
    ? "No distributor has fallen steadily since its last restock, so none is assumed to drain."
    : `${inputs.drain_known} of ${inputs.holders} ${inputs.holders === 1 ? "distributor falls" : "distributors fall"} steadily since the last restock, and each one's drain is the spread of its recent slopes.`;
  const outages = inputs.outages_modelled > 0
    ? ` Returns from a stock-out follow how long earlier stock-outs lasted (${inputs.outages_modelled} modelled).`
    : " Without earlier stock-outs to learn from, a return rests on the lead time the distributor quotes, if any.";
  const weekly = inputs.weekly ? " The part is read weekly, so dates are at least a week wide." : "";
  return `${drain}${outages}${weekly} ${inputs.span_days} days of readings. A fall in stock is not always sales.`;
}

function QuantityBox({ quantity, onChange }: { quantity: number; onChange: (next: number | null) => void }) {
  const [text, setText] = useState(String(quantity));
  const apply = () => {
    const next = Math.floor(Number(text.replace(/[,\s]/g, "")));
    if (Number.isFinite(next) && next >= MIN && next <= MAX) onChange(next);
    else setText(String(quantity));
  };
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      at
      <Input
        aria-label="Quantity to forecast for" className="h-7 w-24" inputMode="numeric" value={text}
        onChange={(event) => setText(event.target.value)} onBlur={apply} onKeyDown={(event) => { if (event.key === "Enter") apply(); }}
      />
      pieces
    </label>
  );
}

function priceWhy(forecast: PartForecast): string {
  const inputs = forecast.price?.inputs;
  if (!inputs) return "";
  return `${inputs.own_moves} price ${inputs.own_moves === 1 ? "move" : "moves"} in ${inputs.span_days} days for this part, pulled towards how often all tracked parts reprice. The currency's own movement is not included.`;
}

function backWhy(item: NonNullable<PartForecast["back"]>[number]): string {
  if (item.ratio !== null && item.quote_days) {
    return `${item.name} quoted ${Math.round(item.quote_days / 7)} weeks; its real waits have run ${item.ratio.toFixed(1)} times the quote, so that is what is expected.`;
  }
  const longer = item.beyond_share > 0.1 ? `; in ${Math.round(item.beyond_share * 100)}% of futures it is out longer than any seen` : "";
  return `Stock-outs of this kind have lasted this long before${longer}.`;
}

/**
 * What Prism expects for the part: the chance it can be bought, when it runs out, when a distributor is back, where its price is going.
 * A forecast whose model has not earned a place is greyed and labelled. Nothing is saved by asking at another quantity.
 */
export function ForecastSection({ forecast, currency, onQuantity }: { forecast: PartForecast | null; currency: string; onQuantity: (next: number | null) => void }) {
  if (!forecast) return null;
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forecast</h3>
      {forecast.available && forecast.quantity ? <QuantityBox key={forecast.quantity} quantity={forecast.quantity} onChange={onQuantity} /> : null}
    </div>
  );
  if (!forecast.available) {
    return (
      <section aria-label="Forecast" className="space-y-1">
        {header}
        <p className="text-sm text-muted-foreground">{forecast.reason === "no_readings" ? "Nothing has been read for this part yet." : "Forecasts start after a week of readings."}</p>
      </section>
    );
  }
  const today = forecast.today;
  const buy = forecast.weeks?.[3];
  const buyModel = forecast.buy_state?.["4w"];
  const format = (value: number) => formatPrice(String(value), currency);
  return (
    <section aria-label="Forecast" className="space-y-2">
      {header}
      {buy ? (
        <div className="space-y-1">
          <Line model={buyModel} why={`${whyStock(forecast)} The chance is the share of 2,000 simulated futures in which some distributor holds ${forecast.quantity?.toLocaleString()} pieces that day.`}>
            Can be bought {whenText(buy.date, today)}: <strong>{chanceText(buy)}</strong>
          </Line>
          <WeekStrip forecast={forecast} grey={isGrey(buyModel)} />
        </div>
      ) : null}
      {forecast.out_now ? (
        <p className="text-sm">Out of stock at every distributor now.</p>
      ) : forecast.runout ? (
        <Line model={forecast.runout.state} why={`${whyStock(forecast)} The range is where 8 in 10 simulated futures run out, given that it does within 8 weeks (${forecast.runout.percent}% of them do).`}>
          Runs out <strong>{rangeText(forecast.runout.low, forecast.runout.median, forecast.runout.high, today)}</strong>
        </Line>
      ) : null}
      {forecast.out_everywhere ? (
        <p className={`text-sm ${isGrey(forecast.buy_state?.["8w"]) ? "text-muted-foreground" : ""}`}>Out everywhere within 8 weeks: {chanceText(forecast.out_everywhere["8w"])}</p>
      ) : null}
      {(forecast.back ?? []).map((item) => (
        <Line key={item.connector_id} model={item.state} why={backWhy(item)}>
          {item.name} back <strong>{rangeText(item.low, item.median, item.high, today)}</strong>
          {item.quote_days ? <span className="text-xs text-muted-foreground"> (quoted {Math.round(item.quote_days / 7)} weeks)</span> : null}
        </Line>
      ))}
      {forecast.price ? (
        <Line model={forecast.price.h90.state} why={priceWhy(forecast)}>
          In 90 days, at its price quantity: <strong>{priceRange(forecast.price.h90.low, forecast.price.h90.high, format, forecast.price.h90.flat)}</strong>
        </Line>
      ) : null}
      {forecast.end_of_life ? (
        <Line
          model={forecast.end_of_life.state}
          why={`Lifecycle changes seen across all tracked parts, pooled by maker. ${forecast.end_of_life.changes} of the ${forecast.end_of_life.needs} needed so far; the rule-based outlook above stays the guide until then.`}
        >
          Chance of an end-of-life change within 12 months: {chanceText(forecast.end_of_life.p12)}
        </Line>
      ) : null}
    </section>
  );
}

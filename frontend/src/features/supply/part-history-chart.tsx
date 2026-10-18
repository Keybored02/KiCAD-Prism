// react-doctor-disable-next-line prefer-dynamic-import - the whole module is loaded with React.lazy (see part-history)
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { PartForecast, PartHistory } from "@/types/supply";
import { formatDay } from "./chart-format";
import { BAND_KEY, FORECAST_KEY, forecastKeyOf, historyRows, TOTAL_KEY, withDistributorForecasts, withForecast, type HistoryKind } from "./part-history-model";
import { formatPrice } from "./supply-format";

interface Props {
  history: PartHistory;
  kind: HistoryKind;
  hidden: ReadonlySet<string>;
  /** Drawn as a dashed line on the stock chart when the part has a threshold. */
  threshold?: number | null;
  height?: string;
  /** Continues the chart into the future with a band; greyed and dashed while its model is still learning. */
  forecast?: PartForecast | null;
}

interface TipProps {
  active?: boolean;
  label?: string;
  payload?: ReadonlyArray<{ dataKey?: string | number; value?: number | string | null; color?: string; name?: string }>;
}

/** Every distributor's value on the hovered day, one line each. A dashed continuation is not listed twice. */
function makeTip(format: (value: number) => string) {
  return function Tip({ active, label, payload }: TipProps) {
    if (!active || !payload?.length) return null;
    const rows = payload.filter((item) => item.value !== null && item.value !== undefined && !Array.isArray(item.value) && !String(item.dataKey).includes("~"));
    if (rows.length === 0) return null;
    // The total always closes the list.
    const ordered = [...rows].sort((a, b) => Number(a.dataKey === TOTAL_KEY) - Number(b.dataKey === TOTAL_KEY));
    return (
      <div className="border bg-background px-2.5 py-1.5 text-xs shadow-md">
        <p className="mb-1 font-medium">{formatDay(String(label))}</p>
        {ordered.map((item) => (
          <p key={String(item.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-2" style={{ backgroundColor: item.color }} />{item.name}</span>
            <span className="tabular-nums">{format(Number(item.value))}</span>
          </p>
        ))}
      </div>
    );
  };
}

/**
 * Stock or price over time, one line per distributor in its colour. A line steps from reading to reading and goes on,
 * dashed, when the distributor has not been read for longer than the part's rate allows. No dots: a part read once is a flat line.
 */
export default function PartHistoryChart({ history, kind, hidden, threshold = null, height = "h-44", forecast = null }: Props) {
  const base = historyRows(history, kind, hidden);
  const { keys } = base;
  const { rows, overlay } = withForecast(history, kind, base, forecast, hidden);
  const forecastLines = withDistributorForecasts(history, kind, rows, forecast, hidden);
  // A price forecast is drawn per distributor; the stock one keeps its range for the total beside them.
  const ownLines = kind === "price" && forecastLines.length > 0;
  const config: ChartConfig = Object.fromEntries(keys.map((item) => [item.key, { label: item.name, color: item.color }]));
  const format = kind === "stock" ? (value: number) => value.toLocaleString() : (value: number) => formatPrice(String(value), history.currency);
  const Tip = makeTip(format);
  const label = `${kind === "stock" ? "Stock per distributor" : "Price per distributor"}${overlay ? (overlay.grey ? ", with a forecast that is still learning" : ", with a forecast") : ""}`;
  const tone = overlay?.grey ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))";
  return (
    <div role="img" aria-label={label} className="w-full">
      <ChartContainer config={config} className={`aspect-auto ${height} w-full`}>
        <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={36} tickMargin={6} tickFormatter={formatDay} />
          <YAxis
            width={kind === "stock" ? 48 : 60} tickLine={false} axisLine={false} domain={kind === "stock" ? [0, "auto"] : ["auto", "auto"]}
            tickFormatter={(value: number) => format(value)}
          />
          <Tooltip cursor={false} content={<Tip />} />
          {kind === "stock" && threshold !== null ? (
            <ReferenceLine y={threshold} stroke="hsl(var(--destructive))" strokeDasharray="4 4"
              label={{ value: "Threshold", position: "insideBottomRight", fill: "hsl(var(--destructive))", fontSize: 11 }} />
          ) : null}
          {history.events.flatMap((event) => (rows.some((row) => row.day === event.day)
            ? [<ReferenceLine key={`${event.kind}-${event.day}-${event.text}`} x={event.day} stroke={event.kind === "restock" ? "hsl(var(--success))" : "hsl(var(--warning))"} strokeDasharray="2 3" ifOverflow="hidden" />]
            : []))}
          {overlay ? (
            <ReferenceLine x={overlay.from} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" label={{ value: "Today", position: "insideTopRight", fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
          ) : null}
          {overlay && !ownLines ? (
            <Area
              dataKey={BAND_KEY} name="Forecast range" type="monotone" stroke={tone} strokeDasharray={overlay.grey ? "3 3" : undefined} strokeOpacity={overlay.grey ? 0.6 : 0.3}
              fill={overlay.grey ? "none" : tone} fillOpacity={overlay.grey ? 0 : 0.12} isAnimationActive={false} connectNulls
            />
          ) : null}
          {overlay && !ownLines ? (
            <Line dataKey={FORECAST_KEY} name={overlay.grey ? "Forecast (learning)" : "Forecast"} type="monotone" stroke={tone} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />
          ) : null}
          {keys.map((item) => (
            <Line
              key={item.key} dataKey={item.key} name={item.name} type="stepAfter" stroke={item.color} strokeWidth={item.total ? 1 : 2}
              dot={false} connectNulls isAnimationActive={false}
            />
          ))}
          {keys.flatMap((item) => (forecastLines.includes(item.key)
            ? [<Line key={forecastKeyOf(item.key)} dataKey={forecastKeyOf(item.key)} name={item.name} type="monotone" stroke={item.color} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />]
            : []))}
          {keys.flatMap((item) => (item.dashed
            ? [<Line key={item.dashed} dataKey={item.dashed} name={item.name} type="stepAfter" stroke={item.color} strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls isAnimationActive={false} />]
            : []))}
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}

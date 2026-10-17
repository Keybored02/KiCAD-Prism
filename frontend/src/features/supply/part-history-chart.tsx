// react-doctor-disable-next-line prefer-dynamic-import - the whole module is loaded with React.lazy (see part-history)
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { PartHistory } from "@/types/supply";
import { formatDay } from "./chart-format";
import { historyRows, type HistoryKind } from "./part-history-model";
import { formatPrice } from "./supply-format";

interface Props {
  history: PartHistory;
  kind: HistoryKind;
  hidden: ReadonlySet<string>;
  /** Drawn as a dashed line on the stock chart when the part has a threshold. */
  threshold?: number | null;
  height?: string;
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
    const rows = payload.filter((item) => item.value !== null && item.value !== undefined && !String(item.dataKey).endsWith("~"));
    if (rows.length === 0) return null;
    return (
      <div className="border bg-background px-2.5 py-1.5 text-xs shadow-md">
        <p className="mb-1 font-medium">{formatDay(String(label))}</p>
        {rows.map((item) => (
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
export default function PartHistoryChart({ history, kind, hidden, threshold = null, height = "h-44" }: Props) {
  const { rows, keys } = historyRows(history, kind, hidden);
  const config: ChartConfig = Object.fromEntries(keys.map((item) => [item.key, { label: item.name, color: item.color }]));
  const format = kind === "stock" ? (value: number) => value.toLocaleString() : (value: number) => formatPrice(String(value), history.currency);
  const Tip = makeTip(format);
  const label = kind === "stock" ? "Stock per distributor" : "Price per distributor";
  return (
    <div role="img" aria-label={label} className="w-full">
      <ChartContainer config={config} className={`aspect-auto ${height} w-full`}>
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
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
          {keys.map((item) => (
            <Line
              key={item.key} dataKey={item.key} name={item.name} type="stepAfter" stroke={item.color} strokeWidth={item.total ? 1 : 2}
              dot={false} connectNulls isAnimationActive={false}
            />
          ))}
          {keys.flatMap((item) => (item.dashed
            ? [<Line key={item.dashed} dataKey={item.dashed} name={item.name} type="stepAfter" stroke={item.color} strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls isAnimationActive={false} />]
            : []))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

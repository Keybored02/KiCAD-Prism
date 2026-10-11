// react-doctor-disable-next-line prefer-dynamic-import - the whole module is loaded with React.lazy (see part-sheet)
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { SupplyPartDetail } from "@/types/supply";
import { coverageChanges, formatDay } from "./chart-format";

const CONFIG: ChartConfig = { stock: { label: "In stock", color: "hsl(var(--primary))" } };

interface StockChartProps {
  history: SupplyPartDetail["history"];
  /** Drawn as a dashed line when the part has a threshold. */
  threshold: number | null;
}

/**
 * Counted stock over the last 90 days. Stock is a level that holds until the next reading,
 * so the line steps. A faint vertical line marks a day when the number of listings behind
 * the figure changed, because a jump there is coverage, not a restock.
 */
export default function StockChart({ history, threshold }: StockChartProps) {
  const changes = coverageChanges(history);
  return (
    <div role="img" aria-label="Stock over the last 90 days" className="w-full">
      <ChartContainer config={CONFIG} className="aspect-auto h-44 w-full">
        <LineChart data={history} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={36} tickMargin={6} tickFormatter={formatDay} />
          <YAxis width={48} tickLine={false} axisLine={false} domain={[0, "auto"]} tickFormatter={(value: number) => value.toLocaleString()} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => formatDay(String(label))}
                valueFormatter={(value) => Number(value).toLocaleString()}
                footer={(row) => {
                  const count = (row as { listings?: number } | undefined)?.listings;
                  return count === undefined ? null : `${count} ${count === 1 ? "listing" : "listings"}`;
                }}
              />
            }
          />
          {changes.map((day) => <ReferenceLine key={day} x={day} strokeDasharray="2 3" />)}
          {threshold !== null ? (
            <ReferenceLine y={threshold} stroke="hsl(var(--destructive))" strokeDasharray="4 4"
              label={{ value: "Threshold", position: "insideBottomRight", fill: "hsl(var(--destructive))", fontSize: 11 }} />
          ) : null}
          <Line dataKey="stock" type="stepAfter" stroke="var(--color-stock)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

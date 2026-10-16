// react-doctor-disable-next-line prefer-dynamic-import - the whole module is loaded with React.lazy (see price-trend)
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatDay } from "./chart-format";
import { formatPrice } from "./supply-format";

const CONFIG: ChartConfig = { price: { label: "Cheapest price", color: "hsl(var(--primary))" } };
/** Up to this many days the readings are drawn as dots, so one or two still show. */
const FEW = 14;

/** The cheapest unit price any distributor showed, per day. A price holds until the next reading, so the line steps. */
export default function PriceChart({ history, currency }: { history: Array<{ day: string; price: number }>; currency: string }) {
  return (
    <div role="img" aria-label="Cheapest price per day" className="w-full">
      <ChartContainer config={CONFIG} className="aspect-auto h-36 w-full">
        <LineChart data={history} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={36} tickMargin={6} tickFormatter={formatDay} />
          <YAxis width={56} tickLine={false} axisLine={false} domain={["auto", "auto"]} tickFormatter={(value: number) => formatPrice(String(value), currency)} />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent labelFormatter={(label) => formatDay(String(label))} valueFormatter={(value) => formatPrice(String(value), currency)} />}
          />
          <Line dataKey="price" type="stepAfter" stroke="var(--color-price)" strokeWidth={2} dot={history.length <= FEW ? { r: 3 } : false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

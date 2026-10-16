// react-doctor-disable-next-line prefer-dynamic-import - the whole module is loaded with React.lazy (see dashboard-lazy-cards)
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { SupplyDashboard } from "@/types/supply";
import { ALERT_KIND_COLOUR, ALERT_KIND_LABEL } from "./alert-kinds";
import { formatDay } from "./chart-format";

/** Alerts opened each day, a column a day, a colour a kind. */
export default function AlertsByDayChart({ days, kinds }: { days: SupplyDashboard["alerts_by_day"]; kinds: string[] }) {
  const config: ChartConfig = Object.fromEntries(kinds.map((kind) => [kind, { label: ALERT_KIND_LABEL[kind as keyof typeof ALERT_KIND_LABEL] ?? kind, color: ALERT_KIND_COLOUR[kind] ?? "hsl(var(--primary))" }]));
  return (
    <div role="img" aria-label="Alerts opened each day" className="w-full">
      <ChartContainer config={config} className="aspect-auto h-44 w-full">
        <BarChart data={days} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={36} tickMargin={6} tickFormatter={formatDay} />
          <YAxis width={28} tickLine={false} axisLine={false} allowDecimals={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(label) => formatDay(String(label))} />} />
          {kinds.map((kind) => <Bar key={kind} dataKey={kind} stackId="alerts" fill={`var(--color-${kind})`} isAnimationActive={false} />)}
        </BarChart>
      </ChartContainer>
    </div>
  );
}

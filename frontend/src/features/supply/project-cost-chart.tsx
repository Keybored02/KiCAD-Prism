// react-doctor-disable-next-line prefer-dynamic-import - the whole module is loaded with React.lazy (see dashboard-lazy-cards)
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { SupplyDashboard } from "@/types/supply";
import { formatDay } from "./chart-format";

const COLOURS = ["hsl(var(--primary))", "#0070bb", "#4eb661", "#ff2100", "#a855f7", "#f59e0b"];

/** The cost of one board a day, a line a tracked project. A day with one reading draws as a dot. */
export default function ProjectCostChart({ projects }: { projects: SupplyDashboard["project_costs"] }) {
  const config: ChartConfig = Object.fromEntries(projects.map((project, index) => [`p${index}`, { label: project.project_name, color: COLOURS[index % COLOURS.length] }]));
  const days = [...new Set(projects.flatMap((project) => project.points.map(([day]) => day)))].sort();
  const rows = days.map((day) => {
    const row: Record<string, string | number | null> = { day };
    projects.forEach((project, index) => { row[`p${index}`] = project.points.find(([pointDay]) => pointDay === day)?.[1] ?? null; });
    return row;
  });
  return (
    <div role="img" aria-label="Cost of one board over time" className="w-full">
      <ChartContainer config={config} className="aspect-auto h-44 w-full">
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={36} tickMargin={6} tickFormatter={formatDay} />
          <YAxis width={48} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(label) => formatDay(String(label))} />} />
          {projects.map((project, index) => (
            <Line key={project.project_id} dataKey={`p${index}`} type="stepAfter" stroke={`var(--color-p${index})`} strokeWidth={2} dot={days.length <= 14 ? { r: 3 } : false} connectNulls isAnimationActive={false} />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

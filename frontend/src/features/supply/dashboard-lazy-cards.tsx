import { lazy, Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { SupplyDashboard } from "@/types/supply";
import { ALERT_KIND_LABEL, kindsOf } from "./alert-kinds";
import { ChartCard, FigureTable } from "./chart-card";

const AlertsByDayChart = lazy(() => import("./alerts-by-day-chart"));
const ProjectCostChart = lazy(() => import("./project-cost-chart"));

/** Alerts opened over the last 30 days, by kind. */
export function AlertsByDayCard({ days }: { days: SupplyDashboard["alerts_by_day"] }) {
  const kinds = kindsOf(days);
  const total = days.reduce((sum, day) => sum + kinds.reduce((inner, kind) => inner + (Number(day[kind]) || 0), 0), 0);
  return (
    <ChartCard
      title="Alerts opened, last 30 days"
      answer={total === 0 ? "No alerts opened" : `${total.toLocaleString()} ${total === 1 ? "alert" : "alerts"} opened`}
      table={<FigureTable head={["Kind", "Alerts"]} rows={kinds.map((kind) => [ALERT_KIND_LABEL[kind as keyof typeof ALERT_KIND_LABEL] ?? kind, days.reduce((sum, day) => sum + (Number(day[kind]) || 0), 0)])} />}
    >
      {total > 0 ? <Suspense fallback={<Skeleton className="h-44 w-full" />}><AlertsByDayChart days={days} kinds={kinds} /></Suspense> : null}
    </ChartCard>
  );
}

/** The cost of one board a day for each tracked project. */
export function ProjectCostCard({ projects }: { projects: SupplyDashboard["project_costs"] }) {
  return (
    <ChartCard
      title="Cost of one board"
      info="The cheapest counted price at the build quantity, summed over the BOM, in the base currency. One reading is stored a day."
      answer={`${projects.length} ${projects.length === 1 ? "project" : "projects"} tracked`}
      table={<FigureTable head={["Project", "Latest"]} rows={projects.map((project) => [project.project_name, `${project.points[project.points.length - 1]?.[1].toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? ""} ${project.currency}`])} />}
    >
      <Suspense fallback={<Skeleton className="h-44 w-full" />}><ProjectCostChart projects={projects} /></Suspense>
    </ChartCard>
  );
}

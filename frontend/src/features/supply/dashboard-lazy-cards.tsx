import { lazy, Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { SupplyDashboard } from "@/types/supply";
import { ALERT_KIND_COLOUR, ALERT_KIND_LABEL, kindsOf } from "./alert-kinds";
import { ChartCard, FigureTable } from "./chart-card";

const AlertsByDayChart = lazy(() => import("./alerts-by-day-chart"));
const ProjectCostChart = lazy(() => import("./project-cost-chart"));

/** Alerts opened over the last 30 days, by kind. */
export function AlertsByDayCard({ days, onKind }: { days: SupplyDashboard["alerts_by_day"]; onKind?: (kind: string) => void }) {
  const kinds = kindsOf(days);
  const total = days.reduce((sum, day) => sum + kinds.reduce((inner, kind) => inner + (Number(day[kind]) || 0), 0), 0);
  return (
    <ChartCard
      title="Alerts opened, last 30 days"
      answer={total === 0 ? "No alerts opened" : `${total.toLocaleString()} ${total === 1 ? "alert" : "alerts"} opened`}
      table={<FigureTable head={["Kind", "Alerts"]} rows={kinds.map((kind) => [ALERT_KIND_LABEL[kind as keyof typeof ALERT_KIND_LABEL] ?? kind, days.reduce((sum, day) => sum + (Number(day[kind]) || 0), 0)])} />}
    >
      {total > 0 ? <Suspense fallback={<Skeleton className="h-44 w-full" />}><AlertsByDayChart days={days} kinds={kinds} /></Suspense> : null}
      {total > 0 && onKind ? (
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs" aria-label="Kinds of alert">
          {kinds.map((kind) => (
            <li key={kind}>
              <button type="button" className="flex items-center gap-1.5 hover:underline" onClick={() => onKind(kind)}>
                <span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: ALERT_KIND_COLOUR[kind] }} />{ALERT_KIND_LABEL[kind as keyof typeof ALERT_KIND_LABEL] ?? kind}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
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

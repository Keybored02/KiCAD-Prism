import type { SupplyPlanRow } from "@/types/supply";

/** The plan for one part week by week. A negative balance is a week the plan runs short. */
export function PlanWeeks({ weeks }: { weeks: NonNullable<SupplyPlanRow["weeks"]> }) {
  if (weeks.length === 0) return null;
  return (
    <details className="mt-1 text-xs">
      <summary className="cursor-pointer text-muted-foreground">By week</summary>
      <table className="mt-1 w-full max-w-md text-right tabular-nums">
        <thead className="text-muted-foreground">
          <tr><th className="text-left font-normal">Week of</th><th className="font-normal">Needed</th><th className="font-normal">Arriving</th><th className="font-normal">Left</th></tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.week}>
              <td className="text-left">{week.week}</td>
              <td>{week.demand ? week.demand.toLocaleString() : ""}</td>
              <td>{week.incoming ? week.incoming.toLocaleString() : ""}</td>
              <td className={week.balance < 0 ? "font-medium text-destructive" : undefined}>{week.balance.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

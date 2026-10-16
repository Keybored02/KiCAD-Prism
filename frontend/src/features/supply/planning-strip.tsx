import { cn } from "@/lib/utils";
import type { SupplyPlanRow } from "@/types/supply";
import { StatusDot } from "./status-dot";

/** A row a part, a column a week: green where the plan covers the demand, red where it runs short. A row opens the part. */
export function PlanningStrip({ rows, onOpen }: { rows: SupplyPlanRow[]; onOpen: (partId: string) => void }) {
  const dated = rows.filter((row) => (row.weeks ?? []).length > 0);
  const weeks = [...new Set(dated.flatMap((row) => (row.weeks ?? []).map((week) => week.week)))].sort();
  if (weeks.length === 0) return null;
  return (
    <div className="overflow-x-auto border">
      <table aria-label="Weeks by part" className="border-collapse text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="w-44 p-2 text-left font-normal">Part</th>
            {weeks.map((week) => <th key={week} className="w-12 p-2 text-center font-normal" title={`Week of ${week}`}>{week.slice(5)}</th>)}
          </tr>
        </thead>
        <tbody>
          {dated.map((row) => (
            <tr key={row.part_id} className="border-t">
              <th scope="row" className="w-44 p-0 text-left font-medium">
                <button type="button" className="flex w-full items-center gap-2 truncate p-2 text-left hover:underline" onClick={() => onOpen(row.part_id)}>
                  <StatusDot status={row.status} />{row.mpn}
                </button>
              </th>
              {weeks.map((week) => {
                const cell = (row.weeks ?? []).find((item) => item.week === week);
                return (
                  <td
                    key={week}
                    title={cell ? `Week of ${week}: needed ${cell.demand}, arriving ${cell.incoming}, left ${cell.balance}` : `Week of ${week}: nothing`}
                    className={cn("w-12 border-l", !cell ? "bg-muted/20" : cell.balance < 0 ? "bg-destructive/50" : "bg-success/40")}
                  >
                    <span className="sr-only">{cell ? (cell.balance < 0 ? "short" : "covered") : "nothing"}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

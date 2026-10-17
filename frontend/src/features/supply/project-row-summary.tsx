import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { SupplyPartGroup, SupplyStatus } from "@/types/supply";
import { counts } from "./project-row-text";
import { formatAgo, formatPrice } from "./supply-format";

const ORDER: readonly SupplyStatus[] = ["fatal", "error", "warning", "ok", "unknown"];
const TONE: Record<SupplyStatus, string> = {
  ok: "bg-success", warning: "bg-warning", error: "bg-destructive/70", fatal: "bg-destructive", unknown: "bg-muted-foreground/40",
};
/** The parts of a project by status, as one thin bar. */
function StatusBar({ group }: { group: SupplyPartGroup }) {
  return (
    <span role="img" aria-label="Parts by status" className="flex h-1.5 w-40 overflow-hidden bg-muted">
      {ORDER.map((status) => {
        const count = group.statuses[status] ?? 0;
        return count > 0 ? <span key={status} className={TONE[status]} style={{ width: `${(count / group.count) * 100}%` }} /> : null;
      })}
    </span>
  );
}

/** Lines 2 and 3 of a project row: the status bar and counts, then cost, boards, BOM age and alerts. */
export function ProjectRowSummary({ group }: { group: SupplyPartGroup }) {
  const stats = group.stats;
  const cost = stats?.cost_per_board && stats.currency ? formatPrice(stats.cost_per_board, stats.currency) : null;
  const change = stats?.cost_change_percent;
  const third = [
    cost ? `${cost} a board${change ? ` ${change > 0 ? "▲" : "▼"} ${Math.abs(change)}% in 30 d` : ""}` : "",
    stats?.boards !== undefined && stats.boards !== null ? `can build ${stats.boards.toLocaleString()}` : "",
    stats?.bom_read_at ? `BOM read ${formatAgo(stats.bom_read_at)}` : "",
    stats?.alerts ? `${stats.alerts} open ${stats.alerts === 1 ? "alert" : "alerts"}` : "",
  ].filter(Boolean);
  return (
    <>
      <span className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <StatusBar group={group} />
        <span>{counts(group)}</span>
      </span>
      {third.length > 0 ? <span className="text-xs text-muted-foreground">{third.join(" · ")}</span> : null}
    </>
  );
}

/** The usual icon button that opens the project's supply page. */
export function OpenProjectButton({ group }: { group: SupplyPartGroup }) {
  return (
    <Button asChild size="icon" variant="outline" className="h-8 w-8">
      <Link to={`/project/${encodeURIComponent(group.project_id)}?section=supply`} aria-label={`Open ${group.project_name}'s supply`} title={`Open ${group.project_name}'s supply`}>
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}

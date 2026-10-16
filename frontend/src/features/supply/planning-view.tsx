import { useCallback } from "react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupplyPlan } from "@/types/supply";
import { PlanningStrip } from "./planning-strip";
import { heldText, planSentence } from "./planning-model";
import { StatusDot } from "./status-dot";
import { getSupplyPlan } from "./supply-api";
import { useLoaded } from "./use-loaded";
import { useSupplyNavigation } from "./use-supply-navigation";

/** Where the demand people entered runs past what is held. It buys nothing; it says where the plan is short. */
export function PlanningView() {
  const fetcher = useCallback((signal: AbortSignal) => getSupplyPlan(signal), []);
  const loaded = useLoaded<SupplyPlan>("planning", fetcher, "Could not load the plan");
  const { openPart } = useSupplyNavigation();

  if (loaded.status === "loading") return <Skeleton className="m-4 h-48" aria-label="Loading the plan" />;
  if (loaded.status === "error" || !loaded.data) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription className="flex items-center justify-between gap-3">
          {loaded.error}
          <Button size="sm" variant="outline" onClick={loaded.retry}>Retry</Button>
        </AlertDescription>
      </Alert>
    );
  }
  const plan = loaded.data;

  return (
    <div className="space-y-3 p-4">
      <p className="text-xs text-muted-foreground">Add demand in a part's sheet. A part is short on the first date the demand so far is more than the supply so far.</p>
      {plan.parts.length === 0 ? (
        <p className="text-sm">No part has open demand yet.</p>
      ) : (
        <>
          <p className="text-sm font-medium">{plan.short === 0 ? "Nothing runs short." : `${plan.short} of ${plan.parts.length} parts run short.`}</p>
          <PlanningStrip rows={plan.parts} onOpen={openPart} />
          <ul className="divide-y border text-sm">
            {plan.parts.map((row) => (
              <li key={row.part_id} className="grid gap-1 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-center">
                <span className="flex min-w-0 items-center gap-2">
                  <StatusDot status={row.status} />
                  <Link to={`/?section=supply&supplyView=parts&part=${encodeURIComponent(row.part_id)}`} className="truncate font-medium text-primary hover:underline">{row.mpn}</Link>
                  <span className="truncate text-xs text-muted-foreground">{row.manufacturer}</span>
                </span>
                <span className="min-w-0 text-xs">
                  <span className={row.short ? "font-medium text-destructive" : ""}>{planSentence(row)}</span>
                  <span className="block text-muted-foreground">
                    {row.needed.toLocaleString()} needed{row.next_need_by ? `, next by ${row.next_need_by}` : ""}
                    {row.committed > 0 ? `, ${row.committed.toLocaleString()} committed` : ""}. {heldText(row)}.
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

import { useCallback, useState } from "react";

import { canEditSupply, canReviewSupply } from "@/lib/roles";
import type { UserRole } from "@/types/auth";
import type { SupplyAssessment, SupplySubScore } from "@/types/supply";
import { FindingRow } from "./finding-row";
import { HealthDetails } from "./health-details";
import { StatusDot } from "./status-dot";
import { decideWaiver, getSupplyAssessment, proposeWaiver, revokeWaiver } from "./supply-api";
import { STATUS_LABEL } from "./supply-format";
import { useLoaded } from "./use-loaded";

const SCORE_LABEL: Record<SupplySubScore["name"], string> = {
  lifecycle: "Lifecycle", sourcing: "Sourcing", inventory: "Inventory", market: "Market", compliance: "Compliance",
};

interface FindingActions {
  canPropose: boolean;
  canApprove: boolean;
  onPropose: (check: string, reason: string) => void;
  onDecide: (waiverId: string, approve: boolean) => void;
  onRevoke: (waiverId: string) => void;
}

/** The five scores and every finding behind a part's health. */
function Details({ data, actions }: { data: SupplyAssessment; actions: FindingActions }) {
  return (
    <div className="space-y-2">
      <ul aria-label="Risk" className="grid grid-cols-5 gap-1 text-center text-[11px]">
        {data.sub_scores.map((item) => (
          <li key={item.name} title={item.reasons.join(" ") || "Nothing to flag"} className="border p-1">
            <div className="text-muted-foreground">{SCORE_LABEL[item.name]}</div>
            <div className={item.score >= 4 ? "font-semibold text-destructive" : item.score >= 3 ? "font-semibold text-warning" : "font-semibold"}>
              {item.score}/5
            </div>
          </li>
        ))}
      </ul>
      {data.findings.length > 0 ? (
        <ul aria-label="Findings" className="divide-y border">
          {data.findings.map((finding) => (
            <FindingRow
              key={finding.check}
              finding={finding}
              canPropose={actions.canPropose}
              canApprove={actions.canApprove}
              onPropose={(reason) => actions.onPropose(finding.check, reason)}
              onDecide={actions.onDecide}
              onRevoke={actions.onRevoke}
            />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No findings.</p>
      )}
    </div>
  );
}

/** How a part stands: its health at a glance. The scores and the findings people have accepted or still have to look at open from the info icon. */
export function AssessmentSection({ partId, role }: { partId: string; role: UserRole | null | undefined }) {
  const fetcher = useCallback((signal: AbortSignal) => getSupplyAssessment(partId, undefined, signal), [partId]);
  const assessment = useLoaded<SupplyAssessment>(partId, fetcher, "Could not load the assessment");
  const [error, setError] = useState("");
  const canApprove = canReviewSupply(role);
  const canPropose = canEditSupply(role) || canApprove;

  const act = async (action: () => Promise<unknown>) => {
    setError("");
    try {
      await action();
      await assessment.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong");
    }
  };

  const data = assessment.data;
  return (
    <section aria-label="Health" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Health</h3>
      {assessment.status === "loading" ? <p className="text-xs text-muted-foreground">Assessing...</p> : null}
      {assessment.status === "error" && !data ? (
        <p className="text-xs text-muted-foreground">
          {assessment.error}{" "}
          <button type="button" className="underline" onClick={assessment.retry}>Retry</button>
        </p>
      ) : null}
      {data ? (
        <div className="flex items-center gap-2">
          <StatusDot status={data.status} />
          <span className="text-sm font-medium">{data.status === "unknown" ? "No data to assess yet" : `${data.health.toFixed(1)} of 10`}</span>
          <span className="text-xs text-muted-foreground">{STATUS_LABEL[data.status]}</span>
          {data.status !== "unknown" ? (
            <HealthDetails label="Show the scores and findings">
              <Details
                data={data}
                actions={{
                  canPropose,
                  canApprove,
                  onPropose: (check, reason) => void act(() => proposeWaiver(partId, check, reason)),
                  onDecide: (waiverId, approve) => void act(() => decideWaiver(waiverId, approve)),
                  onRevoke: (waiverId) => void act(() => revokeWaiver(waiverId)),
                }}
              />
            </HealthDetails>
          ) : null}
        </div>
      ) : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}

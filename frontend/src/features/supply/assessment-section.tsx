import { useCallback, useState } from "react";

import { canEditSupply, canReviewSupply } from "@/lib/roles";
import type { UserRole } from "@/types/auth";
import type { SupplyAssessment, SupplySubScore } from "@/types/supply";
import { FindingRow } from "./finding-row";
import { StatusDot } from "./status-dot";
import { decideWaiver, getSupplyAssessment, proposeWaiver, revokeWaiver } from "./supply-api";
import { STATUS_LABEL } from "./supply-format";
import { useLoaded } from "./use-loaded";

const SCORE_LABEL: Record<SupplySubScore["name"], string> = {
  lifecycle: "Lifecycle", sourcing: "Sourcing", inventory: "Inventory", market: "Market", compliance: "Compliance",
};

/** How a part stands: its health, why, and the findings people have accepted or still have to look at. */
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
    <section aria-label="Assessment" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assessment</h3>
      {assessment.status === "loading" ? <p className="text-xs text-muted-foreground">Assessing...</p> : null}
      {assessment.status === "error" && !data ? (
        <p className="text-xs text-muted-foreground">
          {assessment.error}{" "}
          <button type="button" className="underline" onClick={assessment.retry}>Retry</button>
        </p>
      ) : null}
      {data ? (
        <>
          <div className="flex items-center gap-2">
            <StatusDot status={data.status} />
            <span className="text-sm font-medium">
              {data.status === "unknown" ? "No data to assess yet" : `Health ${data.health.toFixed(1)} of 10`}
            </span>
            <span className="text-xs text-muted-foreground">{STATUS_LABEL[data.status]}</span>
          </div>
          {data.status !== "unknown" ? (
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
          ) : null}
          {data.findings.length > 0 ? (
            <ul aria-label="Findings" className="divide-y border">
              {data.findings.map((finding) => (
                <FindingRow
                  key={finding.check}
                  finding={finding}
                  canPropose={canPropose}
                  canApprove={canApprove}
                  onPropose={(reason) => act(() => proposeWaiver(partId, finding.check, reason))}
                  onDecide={(waiverId, approve) => act(() => decideWaiver(waiverId, approve))}
                  onRevoke={(waiverId) => act(() => revokeWaiver(waiverId))}
                />
              ))}
            </ul>
          ) : data.status !== "unknown" ? (
            <p className="text-xs text-muted-foreground">No findings.</p>
          ) : null}
        </>
      ) : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </section>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SupplyFinding } from "@/types/supply";

const SEVERITY_LABEL = { fatal: "Critical", error: "Error", warning: "Warning", ok: "Note" } as const;

interface FindingRowProps {
  finding: SupplyFinding;
  canPropose: boolean;
  canApprove: boolean;
  onDecide: (waiverId: string, approve: boolean) => Promise<void>;
  onRevoke: (waiverId: string) => Promise<void>;
}

/** One finding, its severity tag above it, and what has been decided about it. */
export function FindingRow({ finding, canPropose, canApprove, onDecide, onRevoke }: FindingRowProps) {
  const waiver = finding.waiver;
  const holds = waiver?.holds === true;
  return (
    <li className="space-y-1 p-2 text-sm">
      <Badge variant={holds ? "outline" : "warning"}>{SEVERITY_LABEL[finding.severity]}</Badge>
      <p className={holds ? "text-muted-foreground line-through" : undefined}>{finding.text}</p>
      {waiver ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{waiverText(finding)}</span>
          <span className="flex gap-1">
            {canApprove && waiver.state === "proposed" ? (
              <>
                <Button size="sm" variant="outline" className="h-6" onClick={() => void onDecide(waiver.id, true)}>Approve</Button>
                <Button size="sm" variant="outline" className="h-6" onClick={() => void onDecide(waiver.id, false)}>Reject</Button>
              </>
            ) : null}
            {canPropose ? (
              <Button size="sm" variant="ghost" className="h-6" onClick={() => void onRevoke(waiver.id)}>
                {waiver.state === "proposed" ? "Withdraw" : "Revoke"}
              </Button>
            ) : null}
          </span>
        </div>
      ) : null}
    </li>
  );
}

function waiverText(finding: SupplyFinding): string {
  const waiver = finding.waiver;
  if (!waiver) return "";
  if (waiver.outdated) return `Waived for an earlier condition: ${waiver.reason}`;
  if (waiver.state === "proposed") return `Waiting for QA, asked by ${waiver.proposed_by}: ${waiver.reason}`;
  return `Waived by ${waiver.decided_by}: ${waiver.reason}`;
}

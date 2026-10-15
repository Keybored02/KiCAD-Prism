import { useCallback, useState } from "react";
import { ArrowDown, ArrowUp, Check, Eye, Plus, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canEditSupply, canReviewSupply } from "@/lib/roles";
import type { User } from "@/types/auth";
import type { SupplyComponentCheck, SupplySource } from "@/types/supply";
import { FindingRow } from "./finding-row";
import { AddAlternateDialog } from "./add-alternate-dialog";
import { ComponentWatch } from "./component-watch";
import { ComponentCoverageNote } from "./coverage-note";
import { StatusDot } from "./status-dot";
import {
  decideSource, decideWaiver, getComponentFindings, listComponentSources, proposeWaiver, rankSource, removeSource, revokeWaiver,
  watchComponentAlternates,
} from "./supply-api";
import { formatStock, LIFECYCLE_LABEL, STATUS_LABEL } from "./supply-format";
import { useLoaded } from "./use-loaded";

interface AvlSectionProps {
  componentId: string;
  manufacturer: string;
  mpn: string;
  user: User | null;
}

const APPROVAL_LABEL = { pending: "Waiting for QA", approved: "Approved", rejected: "Rejected" } as const;

/** Approved parts: the component's own part first, then the alternates that may stand in for it. */
export function AvlSection({ componentId, manufacturer, mpn, user }: AvlSectionProps) {
  const fetcher = useCallback((signal: AbortSignal) => listComponentSources(componentId, signal), [componentId]);
  const sources = useLoaded<SupplySource[]>(componentId, fetcher, "Could not load the approved parts");
  const findingsFetcher = useCallback((signal: AbortSignal) => getComponentFindings(componentId, signal), [componentId]);
  const findings = useLoaded<SupplyComponentCheck>(`${componentId}:findings`, findingsFetcher, "Could not load the component check");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const approves = canReviewSupply(user?.role);
  const proposes = canEditSupply(user?.role) || approves;
  const items = sources.data ?? [];

  const act = async (action: () => Promise<void>) => {
    setError("");
    try {
      await action();
      await Promise.all([sources.refresh(), findings.refresh()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong");
    }
  };

  const approved = items.filter((item) => item.approval === "approved");
  const move = (item: SupplySource, by: -1 | 1) => {
    const neighbour = approved[approved.indexOf(item) + by];
    if (!neighbour) return;
    // Equal ranks have no order to swap; spread them by one place.
    const [mine, theirs] = item.rank === neighbour.rank ? [neighbour.rank + (by === 1 ? 1 : 0), neighbour.rank + (by === 1 ? 0 : 1)] : [neighbour.rank, item.rank];
    void act(async () => {
      await rankSource(item.id, mine);
      await rankSource(neighbour.id, theirs);
    });
  };

  return (
    <section aria-label="Approved parts" className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved parts</h3>
        <span className="flex items-center gap-1.5">
          {canEditSupply(user?.role) && approved.length > 0 ? (
            <Button size="sm" variant="ghost" title="Read the approved alternates like the component's own part" onClick={() => void act(async () => { await watchComponentAlternates(componentId); })}>
              <Eye className="h-3.5 w-3.5" /> Watch alternates
            </Button>
          ) : null}
          {proposes ? (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Add alternate</Button>
          ) : null}
        </span>
      </div>
      <ComponentCoverageNote componentId={componentId} version={items.length} />
      <ComponentWatch componentId={componentId} canEdit={canEditSupply(user?.role)} onChanged={() => void sources.refresh()} />
      <ul className="divide-y border text-sm">
        <li className="flex items-center justify-between gap-3 p-2">
          <span className="min-w-0 truncate"><span className="font-medium">{mpn}</span>, {manufacturer}</span>
          <Badge variant="outline">Primary</Badge>
        </li>
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 p-2">
            <span className="flex min-w-0 items-center gap-2">
              <StatusDot status={item.status} />
              <span className="min-w-0 truncate"><span className="font-medium">{item.mpn}</span>, {item.manufacturer}</span>
              <span className="text-xs text-muted-foreground">
                {STATUS_LABEL[item.status]}, {item.stock === null ? "not read yet" : `${formatStock(item.stock)} in stock`}, {LIFECYCLE_LABEL[item.lifecycle].toLowerCase()}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Badge variant={item.approval === "approved" ? "outline" : "warning"}>{APPROVAL_LABEL[item.approval]}</Badge>
              {approves && item.approval === "pending" ? (
                <>
                  <Button size="icon" variant="ghost" aria-label={`Approve ${item.mpn}`} onClick={() => void act(() => decideSource(item.id, true))}><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Reject ${item.mpn}`} onClick={() => void act(() => decideSource(item.id, false))}><X className="h-4 w-4" /></Button>
                </>
              ) : null}
              {approves && item.approval === "approved" ? (
                <>
                  <Button size="icon" variant="ghost" aria-label={`Move ${item.mpn} up`} disabled={approved[0] === item} onClick={() => move(item, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`Move ${item.mpn} down`} disabled={approved[approved.length - 1] === item} onClick={() => move(item, 1)}><ArrowDown className="h-4 w-4" /></Button>
                </>
              ) : null}
              {proposes && (approves || item.approval === "pending") ? (
                <Button size="icon" variant="ghost" aria-label={`Remove ${item.mpn}`} onClick={() => void act(() => removeSource(item.id))}><X className="h-4 w-4" /></Button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {findings.data && findings.data.findings.length > 0 ? (
        <ul aria-label="Component findings" className="divide-y border">
          {findings.data.findings.map((finding) => (
            <FindingRow
              key={finding.check}
              finding={finding}
              canPropose={proposes && findings.data?.part_id != null}
              canApprove={approves}
              onPropose={(reason) => act(() => proposeWaiver(findings.data?.part_id ?? "", finding.check, reason, componentId).then(() => undefined))}
              onDecide={(waiverId, approve) => act(() => decideWaiver(waiverId, approve))}
              onRevoke={(waiverId) => act(() => revokeWaiver(waiverId))}
            />
          ))}
        </ul>
      ) : null}
      {sources.status === "error" ? <Alert variant="destructive"><AlertDescription>{sources.error}</AlertDescription></Alert> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {sources.status === "ready" && items.length === 0 ? <p className="text-xs text-muted-foreground">No alternates yet.</p> : null}
      <AddAlternateDialog
        open={adding}
        componentId={componentId}
        approves={approves}
        onOpenChange={setAdding}
        onAdded={() => void Promise.all([sources.refresh(), findings.refresh()])}
      />
    </section>
  );
}

import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { canReviewSupply } from "@/lib/roles";
import type { UserRole } from "@/types/auth";
import type { EndingPart } from "@/types/supply";
import { clearRestriction, getEndingParts, retireComponent, setRestriction } from "./ending-api";
import { StatusDot } from "./status-dot";
import { formatStock } from "./supply-format";
import { useLoaded } from "./use-loaded";

type Decision = "mark" | "retire";

function DecisionDialog({ item, decision, onClose, onDone }: { item: EndingPart; decision: Decision; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState(() => item.reasons.map((found) => found.text).join(". "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const retiring = decision === "retire";
  const save = () => {
    setBusy(true);
    const work = retiring ? retireComponent(item.component.id, reason) : setRestriction(item.component.id, "not_for_new_designs", reason);
    work
      .then(() => { toast.success(retiring ? `${item.component.name} is retired.` : `${item.component.name} is marked not for new designs.`); onDone(); onClose(); })
      .catch((caught: Error) => { setError(caught.message); setBusy(false); });
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{retiring ? "Retire" : "Not for new designs"}: {item.component.name}</DialogTitle>
          <DialogDescription>
            {retiring
              ? "The component is archived and leaves the KiCad library. Symbols already placed stop resolving."
              : "The component stays released and keeps resolving where it is placed. It is marked in the catalog so nobody picks it for a new design."}
          </DialogDescription>
        </DialogHeader>
        {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        {item.projects.length > 0 ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{retiring ? "Tracked projects that use it" : "Used by"}</p>
            <ul className="list-disc pl-5 text-muted-foreground">{item.projects.map((project) => <li key={project.project_id}>{project.name}, {project.quantity.toLocaleString()} per board</li>)}</ul>
          </div>
        ) : <p className="text-sm text-muted-foreground">No tracked project uses it.</p>}
        <div className="space-y-1">
          <Label htmlFor="ending-reason" className="text-xs">Reason</Label>
          <Textarea id="ending-reason" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={retiring ? "destructive" : "default"} disabled={busy} onClick={save}>{retiring ? "Retire" : "Mark"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ item, canDecide, onOpen, onChanged }: { item: EndingPart; canDecide: boolean; onOpen: () => void; onChanged: () => void }) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const clear = () => {
    clearRestriction(item.component.id).then(onChanged).catch((caught: Error) => toast.error(caught.message));
  };
  return (
    <tr className="border-b align-top last:border-0">
      <td className="px-3 py-2">
        <button type="button" className="text-left font-medium hover:underline" onClick={onOpen}>{item.component.name || item.component.mpn}</button>
        <div className="text-xs text-muted-foreground">{item.component.mpn}, {item.component.manufacturer}</div>
        {item.restriction ? <Badge variant="warning" className="mt-1">Not for new designs</Badge> : null}
      </td>
      <td className="px-3 py-2">
        <ul className="space-y-0.5">
          {item.reasons.map((reason) => <li key={reason.kind} className="text-sm">{reason.text}<span className="text-xs text-muted-foreground"> ({reason.source})</span></li>)}
        </ul>
        {item.last_buy.length > 0 ? <div className="text-xs text-muted-foreground">Last buy {item.last_buy.map((date) => date.value).join(", ")}</div> : null}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">
        <span className="inline-flex items-center justify-end gap-1.5"><StatusDot status={item.status} />{item.stock === null ? "not read" : formatStock(item.stock)}</span>
      </td>
      <td className="px-3 py-2 text-sm">
        {item.projects.length === 0 ? <span className="text-muted-foreground">none</span> : item.projects.slice(0, 3).map((project) => project.name).join(", ") + (item.projects.length > 3 ? ` and ${item.projects.length - 3} more` : "")}
      </td>
      <td className="px-3 py-2 text-right">
        {canDecide ? (
          <span className="inline-flex flex-wrap justify-end gap-1">
            {item.restriction ? <Button size="sm" variant="ghost" onClick={clear}>Clear mark</Button> : <Button size="sm" variant="outline" onClick={() => setDecision("mark")}>Not for new designs</Button>}
            <Button size="sm" variant="outline" onClick={() => setDecision("retire")}>Retire</Button>
          </span>
        ) : null}
        {decision ? <DecisionDialog item={item} decision={decision} onClose={() => setDecision(null)} onDone={onChanged} /> : null}
      </td>
    </tr>
  );
}

/**
 * Library components whose part is ending: the reason and where it comes from, the last buy date, stock and the projects that use it.
 * Supply proposes; QA and administrators decide. Nothing changes by itself.
 */
export function EndingPartsView({ role, onOpenComponent }: { role: UserRole | null | undefined; onOpenComponent: (componentId: string) => void }) {
  const loaded = useLoaded("ending", getEndingParts, "Could not load the ending parts");
  const canDecide = canReviewSupply(role);
  if (loaded.status === "loading") return <div className="space-y-2 p-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /></div>;
  if (loaded.status === "error") {
    return (
      <Alert variant="destructive" className="m-4 w-auto">
        <AlertDescription className="flex items-center justify-between gap-3">{loaded.error}<Button size="sm" variant="outline" onClick={loaded.retry}>Retry</Button></AlertDescription>
      </Alert>
    );
  }
  const items = loaded.data?.items ?? [];
  return (
    <div className="h-full space-y-3 overflow-y-auto p-4">
      <div>
        <h2 className="text-sm font-semibold">Ending parts</h2>
        <p className="text-sm text-muted-foreground">
          {items.length === 0 ? "No component's part is ending." : `${items.length} ${items.length === 1 ? "component's part is" : "components' parts are"} ending.`}
          {" "}Prism proposes; {canDecide ? "you decide" : "QA and administrators decide"}.
        </p>
      </div>
      {items.length > 0 ? (
        <div className="overflow-x-auto border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left text-xs font-medium text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Component</th>
                <th className="px-3 py-2">Why</th>
                <th className="px-3 py-2 text-right">In stock</th>
                <th className="px-3 py-2">Used by</th>
                <th className="px-3 py-2"><span className="sr-only">Decide</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => <Row key={item.component.id} item={item} canDecide={canDecide} onOpen={() => onOpenComponent(item.component.id)} onChanged={() => void loaded.refresh()} />)}
            </tbody>
          </table>
        </div>
      ) : null}
      {loaded.data && loaded.data.more > 0 ? <p className="text-xs text-muted-foreground">{loaded.data.more} more ending parts are not listed.</p> : null}
    </div>
  );
}

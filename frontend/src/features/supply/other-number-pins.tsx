import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { SupplyOtherNumberGroup } from "@/types/supply";
import { CollapsibleSection } from "./collapsible-section";
import { rejectSupplyListings } from "./supply-api";
import { useConnectorSubmit } from "./use-connector-submit";

function Group({ group, canDecide, onDecided }: { group: SupplyOtherNumberGroup; canDecide: boolean; onDecided: () => Promise<void> }) {
  const { busy, error, run } = useConnectorSubmit();
  const [kept, setKept] = useState<Set<string>>(new Set());
  const taking = group.listings.filter((item) => !kept.has(item.id));
  const toggle = (id: string) => setKept((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  return (
    <li className="space-y-2 p-3" aria-label={`Pinned under other numbers: ${group.mpn}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{group.mpn}</p>
          <p className="truncate text-xs text-muted-foreground">{group.manufacturer}</p>
        </div>
        {canDecide ? (
          <Button size="sm" disabled={busy || taking.length === 0} onClick={() => void run(async () => { await rejectSupplyListings(taking.map((item) => item.id)); await onDecided(); })}>
            Unpin ({taking.length})
          </Button>
        ) : null}
      </div>
      <ul className="divide-y border text-xs">
        {group.listings.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-3 py-1.5">
            <input
              type="checkbox" className="h-3.5 w-3.5" checked={!kept.has(item.id)} disabled={!canDecide} onChange={() => toggle(item.id)}
              aria-label={`Unpin ${item.sku}`}
            />
            <span className="min-w-0 flex-1 truncate">{item.raw_mpn}</span>
            <span className="text-muted-foreground">{item.connector} {item.sku}</span>
          </li>
        ))}
      </ul>
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </li>
  );
}

/** Listings pinned as a part although numbered otherwise: their stock counts as the part's. Ticked ones are taken off. */
export function OtherNumberPins({ groups, canDecide, onDecided }: { groups: readonly SupplyOtherNumberGroup[]; canDecide: boolean; onDecided: () => Promise<void> }) {
  if (groups.length === 0) return null;
  const total = groups.reduce((count, group) => count + group.listings.length, 0);
  return (
    <CollapsibleSection id="review-other-numbers" title="Pinned under another number" count={total} note="their stock counts as the part's">
      <ul className="divide-y">
        {groups.map((group) => <Group key={group.part_id} group={group} canDecide={canDecide} onDecided={onDecided} />)}
      </ul>
    </CollapsibleSection>
  );
}

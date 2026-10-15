import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { PackagingWaiting } from "@/types/supply";
import { PackagingPickDialog } from "./packaging-pick-dialog";

/** Tracked parts with several listings at a distributor and no pick, biggest saving first. */
export function PackagingSection({
  items, saves, canPick, onChanged,
}: { items: readonly PackagingWaiting[]; saves: number; canPick: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState<PackagingWaiting | null>(null);
  if (items.length === 0) return null;
  return (
    <section aria-label="Packaging" className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Packaging ({items.length}), picking saves {saves.toFixed(1)} calls a day
      </h3>
      <ul className="divide-y border">
        {items.map((item) => (
          <li key={`${item.part_id}:${item.connector_id}`} className="flex flex-wrap items-center justify-between gap-2 p-2 text-sm">
            <span>{item.mpn}, {item.manufacturer} <span className="text-muted-foreground">at {item.connector}, {item.listings} listings</span></span>
            <span className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">saves {item.saves_calls_a_day.toFixed(2)} a day</span>
              {canPick ? <Button size="sm" variant="outline" onClick={() => setOpen(item)}>Pick</Button> : null}
            </span>
          </li>
        ))}
      </ul>
      {open ? <PackagingPickDialog partId={open.part_id} connectorId={open.connector_id} onClose={() => setOpen(null)} onChanged={onChanged} /> : null}
    </section>
  );
}

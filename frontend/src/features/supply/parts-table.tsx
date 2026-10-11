import { Eye } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SupplyPartRow } from "@/types/supply";
import { StatusDot } from "./status-dot";
import { formatAgo, formatPrice, formatStock, LIFECYCLE_LABEL, PROBLEM_LABEL } from "./supply-format";

interface PartsTableProps {
  items: SupplyPartRow[];
  selectedId: string | null;
  onOpen: (partId: string) => void;
}

export function PartsTable({ items, selectedId, onOpen }: PartsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="w-8 px-3 py-2"><span className="sr-only">Status</span></th>
            <th className="px-3 py-2">Part</th>
            <th className="px-3 py-2 text-right">In stock</th>
            <th className="px-3 py-2 text-right">Price</th>
            <th className="px-3 py-2">Lifecycle</th>
            <th className="px-3 py-2">Read</th>
            <th className="w-8 px-3 py-2"><span className="sr-only">Watched</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((part) => (
            <tr
              key={part.id}
              className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/40", selectedId === part.id && "bg-muted/60")}
              onClick={() => onOpen(part.id)}
            >
              <td className="px-3 py-2"><StatusDot status={part.status} /></td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  className="text-left font-medium hover:underline"
                  onClick={(event) => { event.stopPropagation(); onOpen(part.id); }}
                >
                  {part.mpn}
                </button>
                <div className="text-xs text-muted-foreground">{part.manufacturer}</div>
                {part.problem ? <div className="text-xs text-destructive">{PROBLEM_LABEL[part.problem]}</div> : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {part.stock === null ? <span className="text-muted-foreground">{formatStock(null)}</span> : formatStock(part.stock)}
                {part.listings > 1 ? <div className="text-xs text-muted-foreground">{part.listings} listings</div> : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatPrice(part.unit_price, part.currency)}
                {part.unit_price ? <div className="text-xs text-muted-foreground">at {part.price_quantity.toLocaleString()}</div> : null}
              </td>
              <td className="px-3 py-2">{part.lifecycle === "unknown" ? "" : LIFECYCLE_LABEL[part.lifecycle]}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{formatAgo(part.fetched_at)}</td>
              <td className="px-3 py-2">
                {part.watch ? <Eye aria-label={part.watch.pinned ? "Watched, pinned" : "Watched"} className="h-4 w-4 text-muted-foreground" /> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

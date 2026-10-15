import { cn } from "@/lib/utils";
import type { SupplyPartRow } from "@/types/supply";
import { StatusDot } from "./status-dot";
import { formatPrice, formatStock, PROBLEM_LABEL } from "./supply-format";
import { DataAgeIcon, LifecycleIcon, TrackedIcon } from "./supply-icons";

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
            <th className="w-8 px-3 py-2"><span className="sr-only">Lifecycle</span></th>
            <th className="w-8 px-3 py-2"><span className="sr-only">Read</span></th>
            <th className="w-8 px-3 py-2"><span className="sr-only">Tracked</span></th>
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
                {part.used_in > 0 ? <div className="text-xs text-muted-foreground">Used in {part.used_in} {part.used_in === 1 ? "project" : "projects"}</div> : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {part.stock === null ? <span className="text-muted-foreground">{formatStock(null)}</span> : formatStock(part.stock)}
                {part.listings > 1 ? <div className="text-xs text-muted-foreground">{part.listings} listings</div> : null}
                {part.needed ? <div className="text-xs text-muted-foreground">needed {part.needed.toLocaleString()}{part.need_by ? ` by ${part.need_by}` : ""}</div> : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatPrice(part.unit_price, part.currency)}
                {part.unit_price ? <div className="text-xs text-muted-foreground">at {part.price_quantity.toLocaleString()}</div> : null}
              </td>
              <td className="px-3 py-2"><LifecycleIcon lifecycle={part.lifecycle} /></td>
              <td className="px-3 py-2"><DataAgeIcon fetchedAt={part.fetched_at} /></td>
              <td className="px-3 py-2">
                {part.watch ? <TrackedIcon /> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

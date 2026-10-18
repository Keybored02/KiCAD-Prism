import { cn } from "@/lib/utils";
import type { ForecastState, SupplyPartRow } from "@/types/supply";
import { Sparkline } from "./sparkline";
import { StatusDot } from "./status-dot";
import { formatStock, PROBLEM_LABEL } from "./supply-format";
import { DistributorSquares, ProjectNames, RateAndLead, RowFlags } from "./part-row-extras";
import { PriceCell } from "./price-cell";
import { RowRunout } from "./part-row-forecast";
import { JlcIcon, LifecycleIcon, TrackedIcon } from "./supply-icons";

const TIER_NUMBER = { daily: 1, weekly: 2, monthly: 2 } as const;

interface PartsTableProps {
  items: SupplyPartRow[];
  selectedId: string | null;
  onOpen: (partId: string) => void;
  /** The state of the forecast models, from the list. */
  forecastState?: Partial<Record<"runout" | "out_4w" | "can_buy_4w" | "can_buy_8w", ForecastState>>;
  /** The column names stay at the top of the scrolling parent. The parent must be the one that scrolls, both ways. */
  stickyHead?: boolean;
}

export function PartsTable({ items, selectedId, onOpen, forecastState, stickyHead = false }: PartsTableProps) {
  return (
    <div className={cn("border", !stickyHead && "overflow-x-auto")}>
      <table className="w-full text-sm">
        <thead className={cn("border-b bg-muted/30 text-left text-xs font-medium text-muted-foreground", stickyHead && "sticky top-0 z-10 bg-muted shadow-[inset_0_-1px_0_var(--border)]")}>
          <tr>
            <th className="w-8 px-3 py-2"><span className="sr-only">Status</span></th>
            <th className="px-3 py-2">Part</th>
            <th className="px-3 py-2 text-right">In stock</th>
            <th className="px-3 py-2 text-right">Price</th>
            <th className="w-10 px-3 py-2"><span className="sr-only">Lifecycle</span></th>
            <th className="w-10 px-3 py-2"><span className="sr-only">Tracked and flags</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((part) => (
            <tr
              key={part.id}
              className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/30", selectedId === part.id && "bg-muted/60")}
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
                <span className="ml-1.5"><JlcIcon jlc={part.jlc} /></span>
                <div className="text-xs text-muted-foreground">{part.manufacturer}{part.manufacturer_provisional ? " (not confirmed)" : ""}</div>
                {part.problem ? <div className="text-xs text-destructive">{PROBLEM_LABEL[part.problem]}</div> : null}
                <ProjectNames part={part} />
                <RateAndLead part={part} />
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {part.stock === null ? <span className="text-muted-foreground">{formatStock(null)}</span> : formatStock(part.stock)}
                {part.spark && part.spark.length > 1 ? <div className="flex justify-end"><Sparkline values={part.spark} label="Stock over the last 30 days" width={64} height={18} /></div> : null}
                {forecastState?.runout === "shown" && part.forecast?.runout && !part.forecast.out_now
                  ? <RowRunout part={part} state={forecastState.runout} />
                  : part.runs_out_days ? <div className="text-xs text-muted-foreground">runs out in about {part.runs_out_days.toLocaleString()} {part.runs_out_days === 1 ? "day" : "days"}</div> : null}
                {part.listings > 1 ? <div className="text-xs text-muted-foreground">{part.listings} listings</div> : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                <PriceCell part={part} />
                <div className="flex justify-end pt-0.5"><DistributorSquares part={part} /></div>
              </td>
              <td className="px-3 py-2"><LifecycleIcon lifecycle={part.lifecycle} /></td>
              <td className="px-3 py-2">
                <span className="flex items-center gap-2">{part.watch || part.tier ? <TrackedIcon tier={part.tier ? TIER_NUMBER[part.tier] : null} /> : null}<RowFlags flags={part.flags} /></span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { ForecastState, SupplyPartRow } from "@/types/supply";
import { PartOfferRows } from "./part-offer-rows";
import type { PartsLayout } from "./parts-layout";
import { Sparkline } from "./sparkline";
import { StatusDot } from "./status-dot";
import { formatStock, PROBLEM_LABEL } from "./supply-format";
import { DistributorSquares, ProjectNames, RowFlags } from "./part-row-extras";
import { PriceCell } from "./price-cell";
import { RowRunout } from "./part-row-forecast";
import { JlcIcon, LifecycleIcon } from "./supply-icons";

interface PartsTableProps {
  items: SupplyPartRow[];
  selectedId: string | null;
  onOpen: (partId: string) => void;
  /** The state of the forecast models, from the list. */
  forecastState?: Partial<Record<"runout" | "out_4w" | "can_buy_4w" | "can_buy_8w", ForecastState>>;
  /** The column names stay at the top of the scrolling parent. The parent must be the one that scrolls, both ways. */
  stickyHead?: boolean;
  /** Compact is one row a part; detailed adds a row for each vendor under it. */
  layout?: PartsLayout;
  /** Name the projects using each part. Off where the list is already grouped by project. */
  showProjects?: boolean;
}

export function PartsTable({ items, selectedId, onOpen, forecastState, stickyHead = false, layout = "compact", showProjects = true }: PartsTableProps) {
  // The detailed layout gives stock, price and vendors a row each below the part.
  const detailed = layout === "detailed";
  return (
    <div className={cn("border", !stickyHead && "overflow-x-auto")}>
      <table className="w-full text-sm">
        <thead className={cn("border-b bg-muted/30 text-left text-xs font-medium text-muted-foreground", stickyHead && "sticky top-0 z-10 bg-muted shadow-[inset_0_-1px_0_var(--border)]")}>
          <tr>
            <th className="w-8 px-3 py-2"><span className="sr-only">Status</span></th>
            <th className="px-3 py-2">Part</th>
            <th className="px-3 py-2 text-right">In stock</th>
            <th className="px-3 py-2 text-right">Price</th>
            <th className="px-3 py-2 text-right">Vendors</th>
            <th className="w-10 px-3 py-2"><span className="sr-only">Lifecycle</span></th>
            <th className="w-10 px-3 py-2"><span className="sr-only">Tracked and flags</span></th>
          </tr>
        </thead>
        {items.map((part) => (
          <tbody key={part.id} className="border-b last:border-0">
            <tr
              className={cn("cursor-pointer hover:bg-muted/30", selectedId === part.id && "bg-muted/60")}
              onClick={() => onOpen(part.id)}
            >
              <td className="px-3 py-2"><StatusDot status={part.status} /></td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <button
                    type="button"
                    className="text-left font-medium hover:underline"
                    onClick={(event) => { event.stopPropagation(); onOpen(part.id); }}
                  >
                    {part.mpn}
                  </button>
                  <span className="text-xs text-muted-foreground">{part.manufacturer}{part.manufacturer_provisional ? " (not confirmed)" : ""}</span>
                  <JlcIcon jlc={part.jlc} />
                </div>
                {part.problem ? <div className="text-xs text-destructive">{PROBLEM_LABEL[part.problem]}</div> : null}
                {showProjects ? <ProjectNames part={part} /> : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {detailed ? null : part.stock === null ? <span className="text-muted-foreground">{formatStock(null)}</span> : formatStock(part.stock)}
                {!detailed && part.spark && part.spark.length > 1 ? <div className="flex justify-end"><Sparkline values={part.spark} label="Stock over the last 30 days" width={64} height={18} /></div> : null}
                {forecastState?.runout === "shown" && part.forecast?.runout && !part.forecast.out_now
                  ? <RowRunout part={part} state={forecastState.runout} />
                  : part.runs_out_days ? <div className="text-xs text-muted-foreground">runs out in about {part.runs_out_days.toLocaleString()} {part.runs_out_days === 1 ? "day" : "days"}</div> : null}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{detailed ? null : <PriceCell part={part} />}</td>
              <td className="px-3 py-2"><div className="flex justify-end">{detailed ? null : <DistributorSquares part={part} />}</div></td>
              <td className="px-3 py-2"><LifecycleIcon lifecycle={part.lifecycle} /></td>
              <td className="px-3 py-2">
                <span className="flex items-center gap-2"><RowFlags flags={part.flags} /></span>
              </td>
            </tr>
            {detailed ? (
              <tr className={cn(selectedId === part.id && "bg-muted/60")}>
                <td />
                <td colSpan={6} className="px-3 pb-3"><PartOfferRows part={part} /></td>
              </tr>
            ) : null}
          </tbody>
        ))}
      </table>
    </div>
  );
}

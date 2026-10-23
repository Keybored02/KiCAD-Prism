import { useState } from "react";

import type { ProjectSupplyPart } from "@/types/supply";
import { StatusDot } from "./status-dot";
import { formatPrice, formatStock } from "./supply-format";
import { DataAgeIcon, JlcIcon, LifecycleIcon, TrackedIcon, WaitingIcon } from "./supply-icons";

type Column = "status" | "part" | "per_board" | "need" | "stock" | "holders" | "price" | "cost" | "lead" | "lifecycle" | "read" | "tracking" | "notes";

const WORST = { fatal: 0, error: 1, warning: 2, unknown: 3, ok: 4 } as const;

/** The value a column sorts by; a part with none sorts last in either direction. */
function sortValue(part: ProjectSupplyPart, column: Column): number | string | null {
  switch (column) {
    case "status": return part.status ? WORST[part.status] : null;
    case "part": return part.mpn.toLowerCase();
    case "per_board": return part.quantity;
    case "need": return part.need ?? null;
    case "stock": return part.part_id ? part.stock : null;
    case "holders": return part.holders ?? null;
    case "price": return part.unit_price === null ? null : Number(part.unit_price);
    case "cost": return part.line_cost == null ? null : Number(part.line_cost);
    case "lead": return part.lead_time_days;
    case "lifecycle": return part.lifecycle;
    case "read": return part.fetched_at ?? null;
    case "tracking": return part.tier;
    case "notes": return part.notes;
  }
}

function compare(left: number | string | null, right: number | string | null, direction: 1 | -1): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return (left < right ? -1 : left > right ? 1 : 0) * direction;
}

function Header({ column, label, sort, onSort, className = "", hidden = false }: {
  column: Column; label: string; sort: { column: Column; direction: 1 | -1 } | null; onSort: (column: Column) => void; className?: string; hidden?: boolean;
}) {
  const active = sort?.column === column;
  return (
    <th className={`p-2 ${className}`} aria-sort={active ? (sort.direction === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" className="uppercase tracking-wider hover:text-foreground" onClick={() => onSort(column)} aria-label={`Sort by ${label}`}>
        {hidden ? <span className="sr-only">{label}</span> : label}{active ? (sort.direction === 1 ? " ▲" : " ▼") : ""}
      </button>
    </th>
  );
}

/** The project's parts, worst first until a column is clicked. A row opens the part's sheet over the page. */
export function ProjectSupplyParts({ parts, shortAt8Weeks = {}, chance = 0.5, currency = "", onOpenPart }: {
  parts: ProjectSupplyPart[]; shortAt8Weeks?: Record<string, number>; chance?: number; currency?: string; onOpenPart?: (partId: string) => void;
}) {
  const [sort, setSort] = useState<{ column: Column; direction: 1 | -1 } | null>(null);
  const onSort = (column: Column) => setSort((current) => (current?.column === column ? (current.direction === 1 ? { column, direction: -1 } : null) : { column, direction: 1 }));
  const shown = sort ? [...parts].sort((a, b) => compare(sortValue(a, sort.column), sortValue(b, sort.column), sort.direction)) : parts;
  const head = { sort, onSort };
  return (
    <div className="overflow-x-auto border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <Header column="status" label="Status" className="w-8" hidden {...head} />
            <Header column="part" label="Part" {...head} />
            <Header column="per_board" label="Per board" className="text-right" {...head} />
            <Header column="need" label="Need" className="text-right" {...head} />
            <Header column="stock" label="In stock" className="text-right" {...head} />
            <Header column="holders" label="Distributors" className="text-right" {...head} />
            <Header column="price" label="Unit price" className="text-right" {...head} />
            <Header column="cost" label="Line cost" className="text-right" {...head} />
            <Header column="lead" label="Lead time" className="text-right" {...head} />
            <Header column="lifecycle" label="Lifecycle" className="w-8" hidden {...head} />
            <Header column="read" label="Read" className="w-8" {...head} />
            <Header column="tracking" label="Tracking" className="w-8" hidden {...head} />
            <Header column="notes" label="Notes" className="text-right" {...head} />
          </tr>
        </thead>
        <tbody>
          {shown.map((part) => (
            <tr key={part.key} className="border-b last:border-0">
              <td className="p-2">{part.status ? <StatusDot status={part.status} /> : null}</td>
              <td className="p-2">
                {part.part_id && onOpenPart ? (
                  <button type="button" className="font-medium text-primary hover:underline" onClick={() => onOpenPart(part.part_id as string)}>{part.mpn}</button>
                ) : (
                  <span className="font-medium">{part.mpn || "No part number"}</span>
                )}
                <div className="text-xs text-muted-foreground">{part.manufacturer}{part.references ? ` · ${part.references}` : ""} <JlcIcon jlc={part.jlc} /></div>
                {(shortAt8Weeks[part.key] ?? 0) >= chance ? (
                  <span className="mt-0.5 inline-block border border-warning/50 px-1 text-[11px] text-warning" title={`${Math.round(shortAt8Weeks[part.key] * 100)}% chance it cannot be bought for one board in 8 weeks`}>Out within 8 weeks</span>
                ) : null}
              </td>
              <td className="p-2 text-right tabular-nums">{part.quantity}</td>
              <td className="p-2 text-right tabular-nums">{part.need ?? ""}</td>
              <td className={`p-2 text-right tabular-nums ${part.short ? "text-destructive" : ""}`}>{part.part_id ? formatStock(part.stock) : ""}</td>
              <td className={`p-2 text-right tabular-nums ${part.holders === 1 ? "text-warning" : ""}`}>{part.holders ?? ""}</td>
              <td className="p-2 text-right tabular-nums">{part.unit_price !== null ? formatPrice(part.unit_price, part.price_currency || currency) : ""}</td>
              <td className="p-2 text-right tabular-nums">{part.line_cost && currency ? formatPrice(part.line_cost, currency) : ""}</td>
              <td className="p-2 text-right tabular-nums">{part.lead_time_days ? `${part.lead_time_days} d` : ""}</td>
              <td className="p-2">{part.lifecycle ? <LifecycleIcon lifecycle={part.lifecycle} /> : null}</td>
              <td className="p-2"><DataAgeIcon fetchedAt={part.fetched_at ?? null} /></td>
              <td className="p-2">
                <span className="flex gap-1">
                  {part.tier ? <TrackedIcon tier={part.tier} /> : null}
                  {part.waiting ? <WaitingIcon /> : null}
                </span>
              </td>
              <td className="p-2 text-right tabular-nums">{part.notes > 0 ? part.notes : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

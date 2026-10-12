import { AlertTriangle, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { SupplyBomLineResult } from "@/types/supply";
import { untrackedLabel, type RowSupply } from "./bom-supply";
import { StatusDot } from "./status-dot";
import { formatPrice, formatStock, STATUS_LABEL } from "./supply-format";

const MUTED = <span className="text-muted-foreground">{"-"}</span>;

function leadTime(days: number | null | undefined): string {
  if (days === null || days === undefined) return "";
  return days % 7 === 0 && days >= 14 ? `${days / 7} wk` : `${days} d`;
}

function manufacturerHint(result: SupplyBomLineResult): string {
  if (result.manufacturer_match === "missing") return "Matched on the part number alone: this line names no manufacturer.";
  if (result.manufacturer_match === "unmatched") return "Matched on the part number alone: Prism does not know this manufacturer spelling.";
  if (result.manufacturer_match === "lcsc") return "Matched by the LCSC number on the symbol.";
  return "";
}

function LineCell({ column, result }: { column: string; result: SupplyBomLineResult }) {
  if (result.state !== "tracked") {
    return column === "Supply" ? <span className="text-muted-foreground">{untrackedLabel(result)}</span> : MUTED;
  }
  const buy = result.buy;
  switch (column) {
    case "Supply": {
      const hint = manufacturerHint(result);
      return (
        <span className="flex items-center gap-1.5" title={hint || undefined}>
          <StatusDot status={result.status ?? "unknown"} />
          {STATUS_LABEL[result.status ?? "unknown"]}
          {result.watched ? null : <span className="text-muted-foreground">(not watched)</span>}
          {hint ? <AlertTriangle aria-label={hint} className="h-3 w-3 text-warning" /> : null}
        </span>
      );
    }
    case "Stock":
      return result.stock === null || result.stock === undefined ? (
        <span className="text-muted-foreground">None yet</span>
      ) : (
        <span
          className={result.short ? "text-destructive" : undefined}
          title={`Needs ${(result.part_need ?? result.need).toLocaleString()} for this build${result.part_need !== undefined && result.part_need !== result.need ? ", counting every line this part is on" : ""}`}
        >
          {formatStock(result.stock)}
          <span className="text-muted-foreground"> / {(result.part_need ?? result.need).toLocaleString()}</span>
        </span>
      );
    case "Unit price":
      if (result.bought_with) return <span className="text-muted-foreground" title="This part is on more than one line and is bought once">with another line</span>;
      return buy ? <span title={`At ${buy.quantity.toLocaleString()} pieces`}>{formatPrice(buy.unit_price, buy.currency)}</span> : MUTED;
    case "Extended":
      if (result.bought_with) return MUTED;
      return buy ? (
        <span
          className={buy.covers ? undefined : "text-warning"}
          title={`Buy ${buy.quantity.toLocaleString()} from ${buy.connector_name} (${buy.sku})${buy.covers ? "" : ". No offer holds enough stock."}`}
        >
          {formatPrice(buy.extended, buy.currency)}
        </span>
      ) : MUTED;
    case "Lead time":
      return leadTime(result.lead_time_days) ? <span>{leadTime(result.lead_time_days)}</span> : MUTED;
    default:
      return null;
  }
}

/** One supply cell of a BOM row: one part's figure, a summary when the row holds several parts, or a dash. */
export function SupplyCell({ column, supply, onDetails }: { column: string; supply: RowSupply; onDetails?: () => void }) {
  if (supply.kind === "none") return MUTED;
  if (supply.kind === "mixed") {
    if (column !== "Supply") return <span className="text-muted-foreground">Mixed</span>;
    return (
      <span className="flex items-center gap-1.5" title="This row holds several different parts">
        {supply.worst ? <StatusDot status={supply.worst} /> : null}
        {supply.count} parts
        <DetailsButton onDetails={onDetails} />
      </span>
    );
  }
  if (column !== "Supply") return <LineCell column={column} result={supply.result} />;
  return (
    <span className="flex items-center justify-between gap-1.5">
      <LineCell column={column} result={supply.result} />
      <DetailsButton onDetails={onDetails} />
    </span>
  );
}

function DetailsButton({ onDetails }: { onDetails?: () => void }) {
  if (!onDetails) return null;
  return (
    <Button type="button" variant="ghost" size="icon-xs" aria-label="Show part details" title="Show part details" onClick={onDetails}>
      <ChevronRight className="h-3.5 w-3.5" />
    </Button>
  );
}

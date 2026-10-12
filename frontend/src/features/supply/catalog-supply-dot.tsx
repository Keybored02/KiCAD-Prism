import type { SupplyComponentStanding } from "@/types/supply";
import { StatusDot } from "./status-dot";
import { formatStock } from "./supply-format";

/** A component's supply status in a catalog row. Nothing for a component Prism does not track. */
export function CatalogSupplyDot({ standing }: { standing: SupplyComponentStanding | undefined }) {
  if (!standing) return null;
  return (
    <span title={`${standing.watched ? "Watched, " : ""}${standing.stock === null ? "not read yet" : `${formatStock(standing.stock)} in stock`}`} className="inline-flex">
      <StatusDot status={standing.status} />
    </span>
  );
}

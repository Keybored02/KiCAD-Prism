import { lazy, Suspense } from "react";

import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/auth";
import type { SupplyPartDetail } from "@/types/supply";
import { AssessmentSection } from "./assessment-section";
import { ReadNowButton } from "./read-now-button";
import { InsightPanel } from "./insight-panel";
import { ListingTable } from "./listing-table";
import { PriceTrend } from "./price-trend";
import { Sparkline } from "./sparkline";
import { formatStock, LIFECYCLE_LABEL } from "./supply-format";
import { WatchSettings } from "./watch-settings";

// Recharts is large and only a part that is open needs it, so it loads on demand.
const StockChart = lazy(() => import("./stock-chart"));

/** What is known about one part: stock and history, its watch, where it is used and every listing. */
interface PartDetailSectionsProps {
  detail: SupplyPartDetail;
  canEdit: boolean;
  role: UserRole | null | undefined;
  onChanged: () => Promise<void>;
}

export function PartDetailSections({ detail, canEdit, role, onChanged }: PartDetailSectionsProps) {
  const values = detail.history.map((point) => point.stock);
  const low = values.length ? Math.min(...values) : null;
  const high = values.length ? Math.max(...values) : null;

  return (
    <div className="space-y-6">

      <section aria-label="Stock" className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">In stock</p>
            <p className="text-2xl font-semibold tabular-nums">{formatStock(detail.stock.total)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={detail.lifecycle === "active" || detail.lifecycle === "unknown" ? "outline" : "warning"}>
              {LIFECYCLE_LABEL[detail.lifecycle]}
            </Badge>
            {canEdit ? <ReadNowButton partId={detail.part.id} onRead={onChanged} /> : null}
          </div>
        </div>
        {detail.problem_text ? <p role="alert" className="text-sm text-destructive">{detail.problem_text}</p> : null}
        {detail.stock.by_connector.length > 1 ? (
          <p className="text-xs text-muted-foreground">
            {detail.stock.by_connector.map((item) => `${item.connector_name} ${item.stock.toLocaleString()}`).join(", ")}
          </p>
        ) : null}
        {values.length > 1 ? (
          <div className="space-y-1">
            <Suspense fallback={<Sparkline values={values} label="Stock over the last 90 days" />}>
              <StockChart history={detail.history} threshold={detail.watch?.threshold ?? null} />
            </Suspense>
            <p className="text-xs text-muted-foreground">
              {values.length} days. Low {low?.toLocaleString()}, high {high?.toLocaleString()}.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">History builds up as the part is read.</p>
        )}
      </section>

      <PriceTrend price={detail.price} />

      <AssessmentSection partId={detail.part.id} role={role} />

      <InsightPanel insight={detail.insight} />

      <section aria-label="Watch" className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Watch</h3>
        <WatchSettings part={detail.part} watch={detail.watch} canEdit={canEdit} onChanged={onChanged} />
      </section>

      {detail.used_in.length > 0 ? (
        <section aria-label="Used in" className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Used in ({detail.used_in.length})</h3>
          <ul className="space-y-1 text-sm">
            {detail.used_in.map((use) => (
              <li key={use.project_id} className="flex items-baseline justify-between gap-3">
                <Link to={`/project/${encodeURIComponent(use.project_id)}`} className="text-primary hover:underline">{use.project_name}</Link>
                <span className="text-xs text-muted-foreground" title={use.references}>{use.quantity} per board</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Listings" className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Listings ({detail.listings.length})</h3>
        <ListingTable listings={detail.listings} />
      </section>
    </div>
  );
}

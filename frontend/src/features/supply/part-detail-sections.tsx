import { canReviewSupply } from "@/lib/roles";
import { lazy, Suspense } from "react";

import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types/auth";
import type { SupplyPartDetail } from "@/types/supply";
import { AlertRulesSection } from "./alert-rules-section";
import { CoverageSummary } from "./coverage-note";
import { CrossReferenceSection } from "./cross-reference-section";
import { AssessmentSection } from "./assessment-section";
import { ReadNowButton } from "./read-now-button";
import { InsightPanel } from "./insight-panel";
import { behaviourLines } from "./market-behaviour-text";
import { ComplianceSection } from "./compliance-section";
import { DatasheetSection } from "./datasheet-section";
import { DemandSection } from "./demand-section";
import { ListingTable } from "./listing-table";
import { NoticesSection } from "./notices-section";
import { OutlookSection } from "./outlook-section";
import { ParametersSection } from "./parameters-section";
import { PriceTrend } from "./price-trend";
import { Sparkline } from "./sparkline";
import { formatStock, LIFECYCLE_LABEL } from "./supply-format";
import { TrackingControl } from "./tracking-control";
import { WatchSettings } from "./watch-settings";
import { VendorName } from "./vendor-name";

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
          <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {detail.stock.by_connector.map((item) => (
              <VendorName key={item.connector_id} provider={item.provider} name={`${item.connector_name} ${item.stock.toLocaleString()}`} />
            ))}
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

      <OutlookSection outlook={detail.outlook} />

      <AssessmentSection partId={detail.part.id} role={role} />

      <InsightPanel insight={detail.insight} />
      {behaviourLines(detail.market_behaviour).length > 0 ? (
        <section aria-label="Distributors compared" className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Distributors compared</h3>
          {behaviourLines(detail.market_behaviour).map((line) => <p key={line} className="text-sm">{line}</p>)}
        </section>
      ) : null}

      <DemandSection partId={detail.part.id} canEdit={canEdit} />

      <section aria-label="Watch" className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Watch</h3>
        <TrackingControl partId={detail.part.id} canEdit onChanged={onChanged} needsPick={detail.packaging?.needs_pick} />
        <WatchSettings part={detail.part} watch={detail.watch} canEdit={canEdit} onChanged={onChanged} />
      </section>

      {detail.watch ? <AlertRulesSection partId={detail.part.id} canEdit={canEdit} /> : null}

      <CrossReferenceSection partId={detail.part.id} canEdit={canEdit} />

      {detail.alternate_for && detail.alternate_for.length > 0 ? (
        <section aria-label="Approved alternate for" className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved alternate for</h3>
          {detail.alternate_for.map((coverage) => <CoverageSummary key={coverage.component_id} coverage={coverage} />)}
        </section>
      ) : null}

      {detail.used_in.length > 0 ? (
        <section aria-label="Used in" className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Used in ({detail.used_in.length})</h3>
          <ul className="space-y-1 text-sm">
            {detail.used_in.map((use) => (
              <li key={use.project_id} className="flex items-baseline justify-between gap-3">
                <Link to={`/project/${encodeURIComponent(use.project_id)}`} className="text-primary hover:underline">{use.project_name}</Link>
                <span className="text-xs text-muted-foreground" title={use.references}>
                  {use.quantity} per board{use.only_in_variants?.length ? `, only in ${use.only_in_variants.join(", ")}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ComplianceSection partId={detail.part.id} canEdit={canEdit} />

      <NoticesSection part={{ id: detail.part.id, manufacturer: detail.part.manufacturer, mpn: detail.part.mpn }} canEdit={canEdit} />

      <DatasheetSection partId={detail.part.id} canEdit={canEdit} />

      <ParametersSection parameters={detail.parameters} />

      <section aria-label="Listings" className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Listings ({detail.listings.length})</h3>
        <ListingTable listings={detail.listings} canDecide={canReviewSupply(role)} onChanged={onChanged} />
      </section>
    </div>
  );
}

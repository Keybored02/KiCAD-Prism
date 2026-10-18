import { canReviewSupply } from "@/lib/roles";

import type { UserRole } from "@/types/auth";
import type { SupplyPartDetail } from "@/types/supply";
import { AlertRulesSection } from "./alert-rules-section";
import { CoverageSummary } from "./coverage-note";
import { CrossReferenceSection } from "./cross-reference-section";
import { ReadNowButton } from "./read-now-button";
import { HoverDetails } from "./hover-details";
import { InsightDetails } from "./insight-panel";
import { insightLines } from "./insight-text";
import { behaviourLines } from "./market-behaviour-text";
import { RestockRecordSection } from "./restock-record";
import { FoldSection } from "./fold-section";
import { ForecastSection } from "./forecast-section";
import { TryQuantity } from "./price-quantity";
import { usePartForecast } from "./use-part-forecast";
import { ComplianceSection } from "./compliance-section";
import { DatasheetSection } from "./datasheet-section";
import { ListingGroups } from "./listing-groups";
import { PartHistoryPanel } from "./part-history";
import { usePartHistory } from "./use-part-history";
import { NoticesSection } from "./notices-section";
import { OutlookSection } from "./outlook-section";
import { ParametersSection } from "./parameters-section";
import { PriceTrend } from "./price-trend";
import { formatStock } from "./supply-format";
import { TrackingControl } from "./tracking-control";
import { WatchSettings } from "./watch-settings";

/** What is known about one part: stock and history, its watch, where it is used and every listing. */
interface PartDetailSectionsProps {
  detail: SupplyPartDetail;
  canEdit: boolean;
  role: UserRole | null | undefined;
  onChanged: () => Promise<void>;
}

export function PartDetailSections({ detail, canEdit, role, onChanged }: PartDetailSectionsProps) {
  // The forecast is made at the part's price quantity.
  const forecast = usePartForecast(detail.part.id, null, detail.price.quantity);
  const history = usePartHistory(detail.part.id);
  const trend = insightLines(detail.insight).length > 0;
  const compared = behaviourLines(detail.market_behaviour);
  return (
    <div className="space-y-6">

      <section aria-label="Stock" className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          In stock
          {trend ? <HoverDetails label="Show the stock trend"><InsightDetails insight={detail.insight} /></HoverDetails> : null}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-2xl font-semibold tabular-nums">{formatStock(detail.stock.total)}</p>
          {canEdit ? <ReadNowButton partId={detail.part.id} onRead={onChanged} /> : null}
        </div>
        {detail.problem_text ? <p role="alert" className="text-sm text-destructive">{detail.problem_text}</p> : null}
        <PartHistoryPanel kind="stock" partId={detail.part.id} history={history.data} threshold={detail.watch?.threshold ?? null} forecast={forecast.data} />
      </section>

      <PriceTrend
        price={detail.price} partId={detail.part.id} canEdit={canEdit} onChanged={onChanged}
        details={compared.length > 0 ? <ul aria-label="Distributors compared" className="space-y-1 text-sm">{compared.map((line) => <li key={line}>{line}</li>)}</ul> : null}
      >
        <PartHistoryPanel kind="price" partId={detail.part.id} history={history.data} forecast={forecast.data} />
      </PriceTrend>

      {forecast.data ? (
        <FoldSection title="Forecast">
          <ForecastSection titled={false} forecast={forecast.data} currency={detail.price.currency} />
        </FoldSection>
      ) : null}

      <OutlookSection outlook={detail.outlook} partId={detail.part.id} role={role} />

      {detail.listings.length > 0 ? <TryQuantity listings={detail.listings} /> : null}

      <FoldSection title={`Listings (${detail.listings.length})`} startOpen>
        <ListingGroups detail={detail} canDecide={canReviewSupply(role)} canTrack={canEdit} onChanged={onChanged} />
      </FoldSection>

      <CrossReferenceSection partId={detail.part.id} canEdit={canEdit} />

      <RestockRecordSection record={detail.restock_record ?? []} />

      <section aria-label="Watch" className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Watch</h3>
        <TrackingControl partId={detail.part.id} canEdit onChanged={onChanged} needsPick={detail.packaging?.needs_pick} />
        <WatchSettings part={detail.part} watch={detail.watch} canEdit={canEdit} onChanged={onChanged} />
      </section>

      {detail.watch ? <AlertRulesSection partId={detail.part.id} canEdit={canEdit} /> : null}

      {detail.alternate_for && detail.alternate_for.length > 0 ? (
        <section aria-label="Approved alternate for" className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approved alternate for</h3>
          {detail.alternate_for.map((coverage) => <CoverageSummary key={coverage.component_id} coverage={coverage} />)}
        </section>
      ) : null}

      <ComplianceSection partId={detail.part.id} canEdit={canEdit} trade={detail.trade} onChanged={onChanged} />

      <NoticesSection part={{ id: detail.part.id, manufacturer: detail.part.manufacturer, mpn: detail.part.mpn }} canEdit={canEdit} />

      <DatasheetSection partId={detail.part.id} canEdit={canEdit} />

      <ParametersSection parameters={detail.parameters} />

    </div>
  );
}

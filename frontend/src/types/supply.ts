import type { AssessmentSettings, ComponentRestriction, ReleaseCheckResult, ReleaseCheckUnavailable, StoresState, SupplyAlert, SupplyConnector, SupplyGroupStats, SupplyNotice, SupplyPartRow, SupplyPartsPage } from "./supply.generated";

export type {
  AlertDetail, AlertRules, AssessmentSettings, AssessmentSettingsView, BudgetCall, BudgetConnector, BudgetLibrary, BudgetNotices, BudgetShare, CheckProgress, CheckStarted, ComponentRestriction, CreateSupplyConnectorInput, CrossReference, DecisionState, EndingPart, EndingParts, FillCandidate, FillDetails, FillSearchResult, JlcClass, MarketBehaviour, NoticeAdded, PackagingListing, PackagingOptions, PackagingPicked, PackagingProposal, PackagingProposals, PackagingSeveral, PackagingSimilar, PartAlertRules, PartHistory, PartTracking, PicksMade, ProjectCostPoint, ProjectMoney, ProjectPartsPage, ProjectSupply, ProjectSupplyPart, ProjectSupplyRelease, ProjectTrackingPreview, ProjectTrackingState, ReleaseBomKept, ReleaseCheckLine, ReleaseCheckResult, ReleaseCheckUnavailable, ReleaseSnapshot, RestockRecord, RowForecast, RulesRequest, ScheduleSettings, StoresState, SubstitutesAsked, SupplyAlert, SupplyBomAlternate, SupplyBomBuy, SupplyBomComment, SupplyBomLineResult, SupplyBomLookup, SupplyBomRollup, SupplyBomWatchResult, SupplyCapacity, SupplyChoice, SupplyChoiceOption, SupplyCompliance, SupplyComplianceState, SupplyComponentStanding, SupplyComponentWatch, SupplyConnector, SupplyConnectorCheck, SupplyCredentialField, SupplyCsvImport, SupplyCsvResult, SupplyFact, SupplyGroupStats, SupplyHeadlinePrice, SupplyHealth, SupplyInsight, SupplyListing, SupplyMakerGroup, SupplyManufacturer, SupplyMatched, SupplyNotice, SupplyNoticeCheck, SupplyOffer, SupplyOtherNumberGroup, SupplyOutlook, SupplyParameter, SupplyPartDetail, SupplyPartGroup, SupplyPartGroups, SupplyPartRow, SupplyPartsPage, SupplyProvider, SupplyReviewAlias, SupplyReviewListing, SupplyReviewQueue, SupplyRowOffer, SupplySignin, SupplySvhcList, SupplyToApprove, SupplyWatch, SupplyWatchSummary, TrackProgress, TrackingPreview, TrackingReason, TrackingRoom, TrackingRoomAccount, UpdateSupplyConnectorInput,
} from "./supply.generated";
export type SupplyAlertKind = SupplyAlert["kind"];
export type SupplyAlertState = SupplyAlert["state"];
export type RestrictionLevel = ComponentRestriction["level"];
export type SupplyNoticeKind = SupplyNotice["kind"];
export type AssessmentSeverity = AssessmentSettings["severity"][string];
export type SupplyCredentialStatus = SupplyConnector["credentials_status"];
export type SupplyLifecycle = SupplyPartRow["lifecycle"];
export type SupplyProblem = NonNullable<SupplyPartRow["problem"]>;
export type SupplyTier = NonNullable<SupplyPartRow["tier"]>;
export type PriceKind = NonNullable<SupplyPartRow["price_kind"]>;
export type ForecastState = SupplyPartsPage["forecast_state"][string];

/** How far a supply job has got (backend `progress.job_progress`); jobs add their own details beside it. */
export interface JobProgress {
  state: "running" | "done" | "failed" | "none";
  done: number;
  total: number;
  failed: number;
  reason: string;
}

export interface SupplyCsvRowError {
  line: number;
  column: string;
  message: string;
}

export interface SupplyMarketMetric {
  value: number;
  /** The same figure at the earlier snapshot, or null when none was stored. */
  before: number | null;
}

export interface SupplyMarket {
  day: string | null;
  compared_with?: string | null;
  min_sample?: number;
  /** Groups where something is moving together: more out of stock than a month ago, or lead times stretching. */
  signals?: Array<{ kind: "manufacturer" | "category"; scope: string; signal: "draining" | "lead_times"; text: string }>;
  scopes: Array<{
    scope: string;
    kind: "all" | "manufacturer" | "category";
    sample: number;
    metrics: Partial<Record<"out_of_stock" | "lifecycle_risk" | "dropped" | "median_lead_time_days" | "price_index", SupplyMarketMetric>>;
  }>;
}

export type SupplyMarketScope = SupplyMarket["scopes"][number];

/** One metric over the stored days, a line per group. */
export interface SupplyMarketHistory {
  metric: string;
  series: Array<{ kind: "all" | "manufacturer" | "category"; scope: string; sample: number; points: Array<[string, number]> }>;
}

/** One distinct part on a BOM: what goes into a lookup. `quantity` is fitted parts per board. */
export interface BomLineInput {
  key: string;
  manufacturer: string;
  mpn: string;
  quantity: number;
  /** The catalog component placed on the symbol; when the catalog knows it, its manufacturer and number win. */
  prism_id?: string;
  /** The LCSC number on the symbol, such as C7950. */
  lcsc?: string;
  /** The symbol's value (10k) and the footprint's name, checked against the distributor's value and package. */
  value?: string;
  footprint?: string;
}

/** Map a spelling to an existing manufacturer, or name a new one. Exactly one. */
export type ConfirmAliasInput =
  | { alias_key: string; manufacturer_id: string }
  | { alias_key: string; new_manufacturer_name: string };

export type SupplyStatus = "ok" | "warning" | "error" | "fatal" | "unknown";
export type PartsScope = "followed" | "watched" | "tier1" | "tier2" | "in_use" | "waiting" | "pick" | "all";
/** One group of parts the Overview counts; empty is no narrowing. */
export type PartsFilter =
  | "" | "at_risk" | "out_of_stock" | "lifecycle"
  | "runs_out_2w" | "runs_out_8w" | "runs_out_later" | "steady" | "few_readings" | "draining" | "restock_late" | "often_out"
  | "one_distributor" | "lead_up" | "unusual_drop" | "price_moving" | "likely_out_4w" | "likely_out_8w"
  | "lifecycle_active" | "lifecycle_nrnd" | "lifecycle_last_time_buy" | "lifecycle_obsolete" | "lifecycle_unknown"
  | "outlook_ended" | "outlook_under_2_years" | "outlook_2_to_5_years" | "outlook_no_signs" | "outlook_unknown"
  | "lead_under_2w" | "lead_2_to_8w" | "lead_8_to_16w" | "lead_16_to_26w" | "lead_over_26w" | "lead_none"
  | "rohs_compliant" | "rohs_not_compliant" | "rohs_disputed" | "rohs_not_applicable" | "rohs_unknown"
  | "reach_compliant" | "reach_affected" | "reach_not_applicable" | "reach_unknown"
  | "control_controlled" | "control_disputed" | "control_none" | "control_unknown"
  | `${"origin" | "listed" | "stocked" | "cheapest" | "repricing" | "leader" | "restock_first" | "risk"}:${string}`;
/** Which listings a watch counts: all, or only one packaging. */
export type WatchPackaging = "any" | "cut_tape" | "custom_reel" | "tape_reel" | "tray" | "tube" | "bulk";

/** Where a forecast model stands: learning (not enough checks, or missing too often), shown, or paused. */
export interface ForecastModelState {
  state: ForecastState;
  checks: number;
  needs: number;
  reason: string;
}

export interface ForecastChance {
  probability: number;
  percent: number;
  word: string;
}

/** A range of dates (10% to 90%) with the most likely in the middle. */
export interface ForecastDates {
  low: string;
  median: string;
  high: string;
}

/** Everything the part sheet's Forecast section and chart bands need. Nothing is saved by asking at a quantity. */
export interface PartForecast {
  available: boolean;
  reason?: "no_readings" | "too_few_readings" | null;
  today: string;
  models: Record<string, ForecastModelState & Record<string, unknown>>;
  quantity?: number;
  out_now?: boolean;
  weeks?: Array<{ week: number; date: string } & ForecastChance>;
  buy_state?: { "4w": ForecastModelState; "8w": ForecastModelState };
  out_everywhere?: { "4w": ForecastChance; "8w": ForecastChance };
  runout?: (ForecastDates & ForecastChance & { state: ForecastModelState }) | null;
  back?: Array<ForecastDates & { connector_id: string; name: string; provider: string; quote_days: number | null; ratio: number | null; beyond_share: number; state: ForecastModelState }>;
  path?: Array<{ day: string; low: number; median: number; high: number }>;
  /** Each distributor's own forecast: its most likely stock by day, and its price in 30 and 90 days. */
  by_distributor?: {
    stock: Array<{ connector_id: string; path: Array<{ day: string; median: number }> }>;
    price: Array<{ connector_id: string; now: number; h30: { date: string; median: number; low: number; high: number }; h90: { date: string; median: number; low: number; high: number } }>;
  };
  inputs?: { span_days: number; holders: number; drain_known: number; from_similar?: number; outages_modelled: number; weekly: boolean };
  price?: {
    now: number;
    inputs: { readings: number; span_days: number; own_moves: number; pooled_moves: number };
    h30: { low: number; median: number; high: number; flat: boolean; date: string; state: ForecastModelState };
    h90: { low: number; median: number; high: number; flat: boolean; date: string; state: ForecastModelState };
  };
  end_of_life?: { p12: ForecastChance; p24: ForecastChance; changes: number; needs: number; state: ForecastModelState };
}

export interface ForecastEvent {
  kind: "runout" | "price";
  date: string;
  part_id: string;
  mpn: string;
  manufacturer: string;
  text: string;
  probability: number | null;
}

export interface TrackRecordModel {
  target: string;
  label: string;
  kind: "range" | "chance";
  state: ForecastState;
  checks: number;
  needs: number;
  score: number | null;
  since: string | null;
  reason: string;
}

export interface TrackRecord {
  models: TrackRecordModel[];
  reliability: Record<string, Array<{ said: number; happened: number; cases: number }>>;
}

/** The Insights Forecasts section. */
export interface ForecastInsights {
  currency: string;
  coming_up: ForecastEvent[];
  likely_out_4w: number;
  lead_times: Array<{ kind: string; scope: string; now: number; low: number; median: number; high: number; direction: "stretching" | "easing" | "flat"; points: number }>;
  warnings: Array<{ kind: string; scope: string; metric: string; before: number; after: number; direction: "up" | "down"; since: string }>;
  prices: { parts: number; flat: number; likeliest_up: Array<{ part_id: string; mpn: string; manufacturer: string; now: number; low: number; median: number; high: number; change: number; flat: boolean }> };
  lifecycle: { last_buy_lag: { available: boolean; cases: number; needs?: number; low?: number; median?: number; high?: number }; changes: number; needs: number };
  track_record: TrackRecord;
}

/** Something that happened lately to a watched part. */
export interface SupplyRecentChange {
  at: string;
  type: "alert_opened" | "alert_cleared" | "listing_gone" | "lifecycle_changed" | "normally_stocking_lost" | "moq_jump" | "family_member_new" | "param_changed"
    | "project_bom_changed";
  /** What the event recorded, for the kinds that carry figures. */
  detail?: Record<string, unknown>;
  /** Null for a change to a project's BOM, which names the project in ``detail``. */
  part_id: string | null;
  mpn: string;
  manufacturer: string;
  /** The alert behind an opened or cleared change. */
  alert: SupplyAlert | null;
  /** The distributor number of a listing that went. */
  sku: string;
}

export type FindingSeverity = "warning" | "error" | "fatal" | "ok";

export interface SupplyWaiver {
  id: string;
  state: "proposed" | "approved";
  reason: string;
  proposed_by: string;
  decided_by: string;
  /** Approved for the condition the part has now. */
  holds: boolean;
  /** Approved for a condition the part no longer has. */
  outdated: boolean;
}

export interface SupplyFinding {
  check: string;
  severity: FindingSeverity;
  text: string;
  scope: string;
  waiver: SupplyWaiver | null;
}

export interface SupplySubScore {
  name: "lifecycle" | "sourcing" | "inventory" | "market" | "compliance";
  /** 1 is good, 5 is bad. */
  score: number;
  reasons: string[];
}

export interface SupplyAssessment {
  part_id: string;
  health: number;
  status: SupplyStatus;
  need: number | null;
  findings: SupplyFinding[];
  sub_scores: SupplySubScore[];
}

/** The supply check on a BOM before release. `available` is false when that revision's BOM has not been read. */
export type ReleaseCheck = ReleaseCheckResult | ReleaseCheckUnavailable;

/** The Dashboard page in one read. */
export interface SupplyDashboard {
  figures: Record<"watched" | "at_risk" | "out_of_stock" | "lifecycle" | "open_alerts" | "waiting", number>;
  /** Library components whose part is ending and nobody has decided about. */
  ending_components?: number;
  /** Parts likely out within four weeks, the model's state and the next expected events. */
  forecast?: { likely_out_4w: number; state: ForecastModelState; coming_up: ForecastEvent[]; part_ids_likely_out_4w: string[] };
  /** Each figure's stored values over the last 30 days, oldest first. */
  figure_history: Record<string, number[]>;
  statuses: Array<{ status: SupplyStatus; count: number }>;
  runway: Record<"out_now" | "runs_out_2w" | "runs_out_8w" | "runs_out_later" | "steady" | "few_readings", number>;
  holders: Record<"none" | "one" | "two" | "three_plus" | "unknown", number>;
  alerts_by_day: Array<Record<string, number | string>>;
  project_costs: Array<{ project_id: string; project_name: string; currency: string; points: Array<[string, number]> }>;
  insights_ready: number;
  /** Enabled feeds whose last read failed, with their last good read: stores sources first, then connectors. */
  failing_feeds: Array<{ kind: "stores" | "connector"; name: string; since: string | null }>;
  /** Enabled connectors. */
  connectors: number;
  /** Tracked parts with no reading yet. */
  no_data: number;
  recent_changes: SupplyRecentChange[];
  /** Lifecycle against availability, a row per lifecycle. */
  risk_grid: Array<{ lifecycle: "active" | "nrnd" | "last_time_buy" | "obsolete" | "unknown"; two_plus: number; one: number; out: number; not_read: number }>;
  /** Last-time-buy and last-ship dates in the next year, soonest first. */
  deadlines: Array<{ part_id: string; mpn: string; manufacturer: string; kind: "last_time_buy" | "last_time_ship" | "last_buy_date"; date: string; source: string; url: string }>;
  /** The tracked projects with their closed-row figures. */
  projects: Array<{ project_id: string; project_name: string; count: number; statuses: Partial<Record<SupplyStatus, number>>; stats: SupplyGroupStats }>;
}

/** One distributor's record on the parts two or more distributors list. A figure is null until it rests on `min_events`. */
export interface ScorecardRow {
  connector_id: string;
  name: string;
  provider: string;
  parts: number;
  stock_outs: { n: number; median_days_out: number | null };
  restocked_first: { rounds: number; first: number | null };
  promises: { resolved: number; kept: number | null; median_days_late: number | null };
  wait: { n: number; quoted_days: number | null; real_days: number | null };
  in_stock: { days: number; share: number | null };
}

export interface SupplyScorecard {
  distributors: ScorecardRow[];
  shared_parts: number;
  min_events: number;
}

export interface SupplyDistributorBehaviour {
  repricing: Array<{ name: string; days: number; parts: number }>;
  leaders: Array<{ name: string; parts: number }>;
  restock_first: Array<{ name: string; parts: number }>;
  arrivals: { on_time: number; resolved: number } | null;
  scorecard?: SupplyScorecard;
}

/** The Insights page: counts of findings, the runway scatter, distributors, market. */
export interface SupplyInsightsPage {
  tracked: number;
  counts: Record<string, number>;
  scatter: Array<{ part_id: string; mpn: string; manufacturer: string; days_to_zero: number; lead_days: number }>;
  scatter_missing: { no_rate: number; no_lead_time: number };
  distributors: SupplyDistributorBehaviour;
  market: SupplyMarket;
  /** The last stored values of each market figure over all followed parts, oldest first. */
  market_trends: Record<string, number[]>;
  sourcing: {
    coverage: Array<{ connector_id: string; name: string; provider: string; tracked: number; listed: number; in_stock: number; cheapest: number }>;
    resilience: Record<"none" | "one" | "two" | "three_plus" | "unknown" | "not_read", number>;
  };
  lifecycle: {
    mix: Record<"active" | "nrnd" | "last_time_buy" | "obsolete" | "unknown", number>;
    outlook: Record<"ended" | "under_2_years" | "2_to_5_years" | "no_signs" | "unknown", number>;
    compliance: { rohs: Record<"compliant" | "not_compliant" | "disputed" | "not_applicable" | "unknown", number>; reach: Record<"compliant" | "affected" | "not_applicable" | "unknown", number> };
  };
  lead_times: Array<{ bucket: "under_2w" | "2_to_8w" | "8_to_16w" | "16_to_26w" | "over_26w" | "none"; parts: number }>;
  price_movers: { up: Array<{ part_id: string; mpn: string; manufacturer: string; percent: number }>; down: Array<{ part_id: string; mpn: string; manufacturer: string; percent: number }> };
  trade: {
    origins: Array<{ country: string; parts: number }>;
    other_origins: number;
    control: Record<"controlled" | "none" | "disputed" | "unknown", number>;
    controlled: Array<{ part_id: string; mpn: string; manufacturer: string; eccn: string; state: "controlled" | "disputed"; by_person: boolean }>;
  };
}

/** A local inventory server (InvenTree, or a server serving its API) whose stock fills the catalog. The token never comes back. */
export interface InventorySource {
  id: string;
  /** "push": the source sends its stock with a push token; it has no server, token or schedule. */
  kind: "inventree" | "push";
  display_name: string;
  base_url: string;
  category_id: number | null;
  enabled: boolean;
  interval_hours: number;
  has_token: boolean;
  server: string;
  api_version: number | null;
  last_sync_at: string | null;
  last_status: "" | "ok" | "error";
  last_error: string;
  matched: number;
  unmatched: number;
}

export interface InventorySourceInput {
  kind?: "inventree" | "push";
  display_name?: string;
  base_url?: string;
  /** Empty removes the token; left out keeps it. */
  token?: string;
  category_id?: number | null;
  interval_hours?: number;
  enabled?: boolean;
}

/** What can be pushed to: a file-fed connector (offers) or a push inventory source (stock levels). */
export type PushTarget = "connector" | "inventory_source";

/** A push token as Prism shows it: never the token, only its first characters. */
export interface PushToken {
  prefix: string;
  created_by: string;
  created_at: string;
  last_used_at: string | null;
}

export interface IssuedPushToken {
  token: string;
  prefix: string;
}

export interface InventoryServerCheck {
  server: string;
  api_version: number;
  instance: string;
  categories: Array<{ pk: number; name: string; pathstring: string; parent: number | null }>;
}

export interface InventorySyncResult {
  status: "ok" | "error";
  error: string;
  matched: number;
  unmatched: number;
  records: number;
}

/** A server part with stock that no catalog component matched. It waits in Supply > Review for a person to link it. */
export interface InventoryUnmatchedPart {
  remote_part: string;
  ipn: string;
  mpn: string;
  manufacturer: string;
  name: string;
  quantity: number;
  records: number;
  reason: "no_component" | "sap_code_shared" | "mpn_shared";
  seen_at: string;
  /** Set once a person linked it; the row stays until a read lands its stock on the component. */
  linked_component_id?: string | null;
  linked_mpn?: string;
  linked_name?: string;
  linked_at?: string | null;
}

/** A manufacturer part a catalog component may be built with: its main part, or an alternate a designer proposed and QA decided. */
export interface ComponentPart {
  part_id: string;
  role: "main" | "alternate";
  approval: "pending" | "approved" | "rejected";
  manufacturer: string;
  mpn: string;
  created_by: string;
  created_at: string;
  decided_by: string;
  decided_at: string | null;
}

export interface ComponentParts {
  component_id: string;
  parts: ComponentPart[];
}

/** One stock record at a local inventory location. */
export interface LocalStockRow {
  /** Unique per row. */
  key: string;
  source: string;
  source_id: string;
  location: string;
  quantity: number;
  allocated: number;
  status: string;
  /** At a vendor: shown, never counted as on hand. */
  external: boolean;
  batch: string;
  uom: string;
  /** The last read of its source failed; this is what the read before it found. */
  stale: boolean;
  fetched_at: string;
  updated_at: string;
}

/** A component's local stock: usable now (less what is allocated), held, and at a vendor. Totals are null when units are mixed. */
export interface LocalStock {
  component_id: string;
  stores?: StoresState | null;
  uom: string;
  mixed_units: boolean;
  available: number | null;
  held: number | null;
  at_vendor: number | null;
  rows: LocalStockRow[];
}

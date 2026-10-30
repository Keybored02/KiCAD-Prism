import type { AssessmentSettings, ComponentRestriction, JlcClass, SupplyAlert, SupplyConnector, SupplyGroupStats, SupplyManufacturer, SupplyNotice, SupplyPartRow, SupplyPartsPage } from "./supply.generated";

export type {
  AlertDetail, AlertRules, AssessmentSettings, AssessmentSettingsView, CheckProgress, CheckStarted, ComponentRestriction, CreateSupplyConnectorInput, CrossReference, DecisionState, EndingPart, EndingParts, FillCandidate, FillDetails, FillSearchResult, JlcClass, MarketBehaviour, NoticeAdded, PackagingListing, PackagingOptions, PackagingPicked, PackagingProposal, PackagingProposals, PackagingSeveral, PackagingSimilar, PartAlertRules, PartHistory, PartTracking, PicksMade, RestockRecord, RowForecast, RulesRequest, SubstitutesAsked, SupplyAlert, SupplyCapacity, SupplyCompliance, SupplyComplianceState, SupplyConnector, SupplyConnectorCheck, SupplyCredentialField, SupplyCsvImport, SupplyCsvResult, SupplyFact, SupplyGroupStats, SupplyHeadlinePrice, SupplyHealth, SupplyInsight, SupplyListing, SupplyMakerGroup, SupplyManufacturer, SupplyNotice, SupplyNoticeCheck, SupplyOffer, SupplyOutlook, SupplyParameter, SupplyPartDetail, SupplyPartGroup, SupplyPartGroups, SupplyPartRow, SupplyPartsPage, SupplyProvider, SupplyRowOffer, SupplySignin, SupplySvhcList, SupplyWatchSummary, TrackingReason, UpdateSupplyConnectorInput,
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

/** What the stores hold of a component: the same four states on every screen (UX-03). */
export interface StoresState {
  state: "stock" | "none" | "not_connected" | "down";
  /** Usable now (OK, at our locations, less allocated); null when none is held or units are mixed. */
  available: number | null;
  /** The last good read of a feed that is down. */
  since: string | null;
}

/** Where a catalog component stands, for the catalog table. */
export interface SupplyComponentStanding {
  status: SupplyStatus;
  /** What the distributors hold, summed. */
  stock: number | null;
  watched: boolean;
  /** The main part's headline unit price at the distributors. */
  unit_price?: string | null;
  currency?: string;
  /** From a simulated connector: test data, marked wherever it shows. */
  test_data?: boolean;
  /** Usable local stock (OK, at our locations, less allocated); absent when the local inventory holds none, null when units are mixed. */
  local_available?: number | null;
  stores?: StoresState;
  /** What the library decided about the component: marked for no new designs, or retired. */
  restriction?: RestrictionLevel | null;
}

/** RoHS and REACH of a part, and the substances a supplier declared for it. */
/** A note on a line of a project's BOM. */
export interface SupplyBomComment {
  id: string;
  line_key: string;
  body: string;
  author: string;
  author_name: string;
  created_at: string;
}


/** A standing request to watch a component's part. */
export interface SupplyComponentWatch {
  component_id: string;
  packaging: WatchPackaging;
  owner: string;
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

export interface SupplyBomBuy {
  /** What must be ordered: the need rounded up to the minimum order and multiples. */
  quantity: number;
  unit_price: string;
  currency: string;
  extended: string;
  /** False when no offer holds enough stock; the cheapest is shown anyway. */
  covers: boolean;
  connector_name: string;
  /** The connector's provider key, for its colour. */
  provider?: string;
  /** From a simulated connector: test data, marked wherever it shows. */
  test_data?: boolean;
  sku: string;
  product_url: string;
  /** Pieces bought beyond the need, because of the smallest order and its multiples, and their cost. */
  waste?: number;
  waste_cost?: string;
  /** The next price break above the order; `extra` is what buying that many costs in total against the order (negative: cheaper). */
  next_break?: { quantity: number; unit_price: string; extra: string } | null;
  /** The part bought: the line's own, or the approved alternate whose offer won. */
  part_id?: string | null;
}

/** An approved alternate of a line's component. Its stock and offers count for the line. */
export interface SupplyBomAlternate {
  part_id: string;
  manufacturer: string;
  mpn: string;
  stock: number | null;
  status: SupplyStatus;
}

export interface SupplyBomLineResult {
  jlc?: JlcClass | null;
  /** "tracked" has data; the rest say why a line has none. */
  state: "no_mpn" | "unknown" | "ambiguous" | "tracked";
  part_id: string | null;
  /** The stores state of the line's catalog component; absent when the line has none. */
  stores?: StoresState | null;
  /** Distributor stock plus available stores stock: what the build can draw on. */
  usable?: number | null;
  /** How the manufacturer matched: "missing" and "unmatched" mean the part number alone found it; "lcsc" the symbol's LCSC number. */
  manufacturer_match: "exact" | "missing" | "unmatched" | "lcsc" | null;
  /** Whether a catalog component has the line; null for a line without a part number. Only library parts are tracked. */
  in_library?: boolean | null;
  need: number;
  watched?: boolean;
  status?: SupplyStatus;
  problem?: SupplyProblem | null;
  stock?: number | null;
  lifecycle?: SupplyLifecycle;
  lead_time_days?: number | null;
  fetched_at?: string | null;
  /** What the whole part needs when it is on several lines; `need` is this line's own. */
  part_need?: number;
  short?: boolean;
  buy?: SupplyBomBuy | null;
  /** Set on the later lines of a part: the key of the line that carries the purchase. */
  bought_with?: string | null;
  /** The distributor a person prefers for the part, and what it holds. */
  preferred?: { connector_id: string; connector_name: string; provider: string; stock: number } | null;
  /** How the part stands: its health, status and how many findings still count. */
  assessment?: { health: number; status: SupplyStatus; open: number; checks?: string[] };
  /** The component's approved alternates; `stock` and `buy` count them. */
  alternates?: SupplyBomAlternate[];
  /** The alternate the status is told by, when it is better than the line's own part. */
  status_from?: string | null;
}

export interface SupplyBomRollup {
  /** Some of the cost comes from a simulated connector. */
  test_data?: boolean;
  lines: number;
  tracked: number;
  not_tracked: number;
  watched: number;
  /** Parts whose status is error or fatal. */
  at_risk: number;
  /** Parts with a warning as well: at risk and those that only need a look. */
  needs_a_look?: number;
  short: number;
  priced: number;
  /** How many lines the cost covers. */
  lines_priced: number;
  parts: number;
  currency: string | null;
  /** True when the total was converted to the base currency; `rates_day` says which day's rates. */
  converted?: boolean;
  rates_day?: string | null;
  cost_build: string | null;
  /** Before conversion, per currency the offers are quoted in; empty when nothing was converted. */
  original_costs?: Record<string, string>;
  cost_per_board: string | null;
  /** What rounding to smallest orders and multiples buys beyond the need, in the total's currency. */
  waste_cost?: string | null;
  can_build: number | null;
  limited_by: string | null;
  without_stock_data: number;
  /** 0 to 10, weighted by units needed; null when nothing has data. */
  health: number | null;
  health_status: SupplyStatus;
}

export interface SupplyBomLookup {
  build_quantity: number;
  /** The spares it priced with, a percent; null is by kind of part. */
  attrition_percent?: number | null;
  lines: Record<string, SupplyBomLineResult>;
  rollup: SupplyBomRollup;
}

export interface SupplyBomWatchResult {
  watched: number;
  already_watched: number;
  /** LCSC numbers on the lines newly linked to their parts. */
  lcsc_linked?: number;
  skipped: Array<{ key: string; reason: "no_mpn" | "no_manufacturer" | "unknown_manufacturer" }>;
}

/** A spelling a distributor used that maps to no manufacturer yet. */
export interface SupplyReviewAlias {
  alias_key: string;
  alias_text: string;
  seen_at_provider: string;
  first_seen_at: string;
  waiting_listings: number;
}

export interface SupplyReviewListing {
  id: string;
  connector_id: string;
  connector_name: string;
  /** The connector's provider key, for its colour. */
  provider?: string;
  sku: string;
  raw_mpn: string;
  raw_manufacturer: string;
  match_state: "manufacturer_unresolved" | "near";
  match_reason: string;
  packaging?: string;
  reel_size?: number | null;
  packaging_inferred?: boolean;
  first_seen_at: string;
  /** The part this listing is a candidate for. */
  part: { id: string; mpn: string; manufacturer: string } | null;
}

export interface SupplyChoiceOption {
  key: string;
  spelling: string;
  spellings: string[];
  connectors: string[];
  listings: number;
}

/** A part whose maker the answers do not settle: "maker" (not confirmed) or "unlisted" (no distributor lists its known maker). */
export interface SupplyChoice {
  part_id: string;
  mpn: string;
  manufacturer: string;
  kind: "maker" | "unlisted" | "number";
  options: SupplyChoiceOption[];
}

export interface SupplyMatched {
  aliases: Array<{ alias_key: string; alias_text: string; manufacturer: string; first_seen_at: string; parts: number }>;
  parts: Array<{ part_id: string; mpn: string; manufacturer: string; at: string }>;
}

export interface SupplyToApprove {
  waivers: Array<{ id: string; part_id: string; mpn: string; manufacturer: string; check_id: string; scope: string; reason: string; proposed_by: string; proposed_at: string }>;
  /** Alternates proposed for a library component, waiting for QA. */
  alternates?: Array<{
    component_id: string; component_name: string; component_mpn: string; part_id: string; mpn: string; manufacturer: string; proposed_by: string; proposed_at: string;
  }>;
  /** Ending components someone asked QA to dismiss, with the reasons they were dismissed for. */
  dismissals?: Array<{ id: string; component_id: string; component_name: string; component_mpn: string; reasons: string[]; proposed_by: string; proposed_at: string }>;
  /** Alerts someone asked QA to switch off on a part. */
  mutes?: Array<{ id: string; part_id: string; mpn: string; manufacturer: string; kind: string; proposed_by: string; proposed_at: string }>;
}

export interface SupplyOtherNumberGroup {
  part_id: string;
  mpn: string;
  manufacturer: string;
  listings: Array<{ id: string; sku: string; raw_mpn: string; connector: string }>;
}

export interface SupplyReviewQueue {
  aliases: SupplyReviewAlias[];
  listings: SupplyReviewListing[];
  /** Listings pinned as a part although numbered otherwise, by part. */
  other_numbers?: SupplyOtherNumberGroup[];
  /** Parts whose maker waits for a person. */
  choices?: SupplyChoice[];
  matched?: SupplyMatched;
  /** Waivers proposed and waiting for QA. */
  to_approve?: SupplyToApprove;
  counts: { aliases: number; unresolved: number; near: number };
  manufacturers: SupplyManufacturer[];
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

/** How a person follows a part (`/api/supply/tracking/parts`), keyed by the part. */
export interface SupplyWatch {
  part_id: string;
  manufacturer: string;
  mpn: string;
  tier: 1 | 2;
  rate: "daily" | "weekly" | "monthly";
  threshold: number | null;
  pinned: boolean;
  owner: string;
  packaging: WatchPackaging;
}

/** A project's parts, a page at a time, each with its BOM lines; the chips count over the whole project. */
export interface ProjectPartsPage extends SupplyPartsPage {
  items: Array<SupplyPartRow & { line: ProjectSupplyPart | null }>;
  /** Lines no part matches; on the first page only. */
  unmatched: ProjectSupplyPart[];
  chips: Array<{ key: "unchecked" | "out" | "short" | "limiting" | "not_priced" | "end_of_life" | "alerts"; count: number }>;
}

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

export interface ReleaseCheckLine {
  manufacturer: string;
  mpn: string;
  quantity: number;
  state: "no_mpn" | "unknown" | "ambiguous" | "tracked";
  part_id: string | null;
  health: number | null;
  status: SupplyStatus | null;
  findings: Array<{ check: string; severity: FindingSeverity; text: string }>;
  waived: number;
}

/** The supply check on a BOM before release. `available` is false when that revision's BOM has not been read. */
export type ReleaseCheck =
  | { available: false; reason: string }
  | {
      available: true;
      health: number | null;
      status: SupplyStatus;
      parts: number;
      tracked: number;
      not_tracked: number;
      needing_a_look: number;
      /** Rows of the BOM that name no part number, which the check cannot look at. */
      without_number: number;
      attention: ReleaseCheckLine[];
      lines: ReleaseCheckLine[];
    };

/** The supply check frozen when a release was published, kept beside the release record. */
export interface ReleaseSnapshot {
  id: string;
  build_id: string;
  tag: string;
  created_at: string;
  health: number | null;
  status: SupplyStatus;
  assessment: { parts: number; tracked: number; not_tracked: number; needing_a_look: number; attention: ReleaseCheckLine[] };
  compliance: unknown;
}

/** One connector's committed share, and what a change adds to it. */
export interface BudgetShare {
  connector_id: string;
  name: string;
  capacity: number;
  committed: number;
  free: number;
  admitted: number;
  waiting: number;
  adds_calls?: number;
  admitted_new?: number;
  waiting_new?: number;
}

export interface TrackingPreview {
  connectors: BudgetShare[];
  /** Nothing the change adds fits at any connector. */
  fits_nowhere: boolean;
  tracked?: {
    parts_created: number;
    skipped: Array<{ mpn: string; reason: string; manufacturer?: string; candidates?: Array<{ part_id: string; manufacturer: string }> }>;
  };
}

/** How far the first searches of a project's parts have got, per distributor. */
export interface TrackProgress extends JobProgress {
  parts: number;
  connectors: Array<{ connector_id: string; name: string; total: number; done: number }>;
}

export interface ProjectTrackingState {
  tracked: { project_id: string; variants: string[]; all_variants: boolean; packaging?: "cut_tape" | "custom_reel" | "tape_reel" | "tube_tray" | "smallest"; build_quantity?: number; spares?: string | null; connector_ids: string[] | null; tracked_by: string; tracked_at: string } | null;
  has_usage: boolean;
  variants: string[];
}

export interface BudgetCall {
  hour?: number;
  day?: string;
  kind?: string;
  purpose: string;
  calls: number;
}

/** Where one connector's call budget goes (GET /api/supply/budget). */
export interface BudgetNotices {
  limit: number;
  used: number;
  parts: number;
  interval_days: number;
  per_day: number;
}

export interface BudgetLibrary {
  total: number;
  found: number;
  not_found: number;
  /** Parts due a search here now. */
  waiting: number;
  calls_a_day: number;
  /** Null when no spare calls are expected. */
  days_left: number | null;
}

export interface BudgetConnector {
  connector_id: string;
  name: string;
  provider: string;
  enabled: boolean;
  shares_account: boolean;
  day: string;
  reset_in_seconds: number;
  daily_budget: number;
  committed: { capacity: number; spent: number };
  pool: { capacity: number; spent: number };
  spare_spent: number;
  /** What scheduled work still needs before the reset, what is kept for people, and what is free to spend now. */
  free?: { scheduled: number; kept_for_people: number; free: number };
  spent: number;
  refused_today: number;
  tracking: BudgetShare | null;
  hourly: BudgetCall[];
  days: BudgetCall[];
  /** The change-notice quota of a provider that keeps one apart from its product calls (DigiKey). */
  notices?: BudgetNotices | null;
  /** Matching the library's parts nothing follows, from spare budget. */
  library?: BudgetLibrary | null;
  owners: {
    projects: Array<{ project_id: string; project_name: string; calls_a_day: number }>;
    parts: Array<{ part_id: string; mpn: string; manufacturer: string; tier: number; calls_a_day: number; pick_saves: number }>;
  };
}

/** Which spare work is on. */
export interface ScheduleSettings {
  spare: { waiting: boolean; tier2_early: boolean; notices: boolean; library: boolean };
}

/** One part of a project's stored BOM, as the project's Supply tab lists it. */
export interface ProjectSupplyPart {
  key: string;
  manufacturer: string;
  mpn: string;
  quantity: number;
  references: string;
  part_id: string | null;
  state: SupplyBomLineResult["state"];
  status: SupplyStatus | null;
  stock: number | null;
  lifecycle: SupplyLifecycle | null;
  short: boolean;
  /** In the offer's currency, `unit_currency`. */
  unit_price: string | null;
  unit_currency?: string | null;
  /** The unit price in the total's currency: what `line_cost` is made of. Null when it can't be converted. */
  unit_price_in_total?: string | null;
  notes: number;
  /** Pieces the build needs, spares included. */
  need?: number | null;
  /** What the line costs for the build, in the total's currency; null when bought with another line or not priced. */
  line_cost?: string | null;
  /** Open alerts on the part. */
  alerts?: number;
  /** The catalog component the symbol places; empty when none. */
  prism_id?: string;
  stores?: StoresState | null;
  /** Pieces the line's purchase buys (the need rounded to the offer's minimum and multiple); `unit_price` is the price at it. */
  buy_quantity?: number | null;
  /** From a simulated connector: test data, marked wherever it shows. */
  test_data?: boolean;
  /** Whether a catalog component has the line; null for a line without a part number. */
  in_library?: boolean | null;
  /** The component's approved alternates; `stock` and `short` count them. */
  alternates?: SupplyBomAlternate[];
  status_from?: string | null;
}

export interface ProjectCostPoint {
  boards: number;
  cost_per_board: string | null;
  cost_build: string | null;
  currency: string | null;
  /** Parts the stock cannot cover at this size. */
  short: number;
  lines_priced: number;
  lines: number;
}

export interface ProjectMoney {
  lines: Array<{ key: string; part_id: string | null; mpn: string; manufacturer: string; cost: string; share: number }>;
  other: { count: number; cost: string; share: number };
  total: string;
}

export interface ProjectSupplyRelease {
  build_id: string;
  tag: string;
  created_at: string;
  health: number | null;
  status: SupplyStatus;
  parts: number;
  needing_a_look: number;
  /** Parts that were fine when it was published and are not today. */
  changed_since: Array<{ part_id: string; manufacturer: string; mpn: string; was: SupplyStatus | null; now: SupplyStatus }>;
}

export interface ProjectSupply {
  available: boolean;
  variant: string;
  variants: string[];
  /** The boards the page is worked out for, and the tracked project's usual build (null when it is not tracked). */
  build_quantity?: number;
  usual_build?: number | null;
  /** The spares the page is worked out with, in percent; null is by kind of part. */
  attrition_percent?: number | null;
  rollup?: SupplyBomRollup;
  parts?: ProjectSupplyPart[];
  /** The cost of one board a day, oldest first: the days that price every line and are not one price read wrong. */
  cost_history?: Array<{ day: string; cost_per_board: string; currency: string; boards: number }>;
  /** The days left out because one price was read wrong. */
  cost_history_left_out?: Array<{ day: string; cost_per_board: string; currency: string; boards: number }>;
  /** The cost at 1, 10, 100, 1,000 and 10,000 boards and the chosen size. */
  cost_curve?: ProjectCostPoint[];
  /** The lines that cost the most for the build, with their share, and what all the others cost. */
  money?: ProjectMoney | null;
  releases: ProjectSupplyRelease[];
  notes: SupplyBomComment[];
}

/** One account's room for more tracked parts, counted in parts like the ones already searched. Null where too few were searched. */
export interface TrackingRoomAccount {
  connector_ids: string[];
  name: string;
  assembly_only: boolean;
  capacity: number;
  free: number;
  waiting: number;
  searched: number;
  carried_percent: number;
  estimated_per_day: number;
  measured_per_day: number | null;
  factor: number;
  /** Calls a day committed to each tier, and the parts admitted. */
  by_tier: Record<"1" | "2", { calls: number; parts: number }>;
  /** What tracking was expected to spend on the provider's previous day, and what it spent (null when nothing was counted). */
  yesterday: { expected: number; spent: number | null };
  room: { daily: number | null; weekly: number | null };
}

export interface TrackingRoom {
  /** The distributor that fills first, among those every part is read at. */
  headline: { daily: { room: number; limited_by: string } | null; weekly: { room: number; limited_by: string } | null };
  accounts: TrackingRoomAccount[];
}

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

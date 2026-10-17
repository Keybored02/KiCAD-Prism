export type SupplyCredentialStatus = "none" | "ready" | "locked" | "unknown_key";

export interface SupplyCredentialField {
  name: string;
  label: string;
  secret: boolean;
}

export interface SupplyProvider {
  key: string;
  label: string;
  capabilities: string[];
  max_batch: number;
  stock_pooling: "pooled" | "separate";
  credential_fields: SupplyCredentialField[];
  storefronts: string[];
  default_daily_budget: number;
  /** False when calls cost nothing (local data), so no call budget applies. */
  metered: boolean;
}

/** The provider whose data comes from an uploaded file. */
export const CSV_PROVIDER = "csv";

export interface SupplyCsvImport {
  filename: string;
  imported_by: string;
  imported_at: string;
  row_count: number;
}

export interface SupplyCsvRowError {
  line: number;
  column: string;
  message: string;
}

export interface SupplyCsvResult extends SupplyCsvImport {
  ignored_columns: string[];
}

export interface SupplyConnector {
  id: string;
  provider: string;
  provider_label: string;
  provider_available: boolean;
  storefront: string;
  display_name: string;
  currency: string;
  enabled: boolean;
  paused_reason: string;
  daily_budget: number;
  interactive_reserve_pct: number;
  /** Days raw samples are kept before they are rolled into daily rows; null is the default (60). */
  retention_days: number | null;
  /** Days any history is kept, daily rows included; null keeps it for good. */
  keep_days: number | null;
  metered: boolean;
  /** Read only for a project that names it (JLCPCB: stock that feeds its own assembly). */
  assembly_only?: boolean;
  /** When the provider's day begins, and in which time zone. */
  reset_time?: string;
  reset_tz?: string;
  /** Rate-limit headers the provider sent with its last answer, per API (DigiKey: products, changenotifications), by lower-case name. */
  rate_limits?: Record<string, Record<string, string>>;
  rate_limits_at?: string | null;
  /** The reset time was taken from what the provider reported, so its own count of calls is trusted. */
  reset_from_provider?: boolean;
  /** When the provider's day seems to reset (UTC), once readings from different days agree. */
  reset_suggestion?: { from: string; to: string; suggested: string; tz: string; windows: number } | null;
  csv_import: SupplyCsvImport | null;
  usage_today: { spent: number; interactive_spent: number };
  /** Which credentials are set. Values are never returned. */
  credentials: Record<string, boolean>;
  credentials_status: SupplyCredentialStatus;
  last_ok_at: string | null;
  last_error_code: string;
  last_error_at: string | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateSupplyConnectorInput {
  provider: string;
  storefront: string;
  display_name: string;
  currency: string;
  credentials: Record<string, string>;
  daily_budget: number;
  interactive_reserve_pct: number;
}

export interface UpdateSupplyConnectorInput {
  display_name?: string;
  currency?: string;
  enabled?: boolean;
  daily_budget?: number;
  interactive_reserve_pct?: number;
  retention_days?: number | null;
  keep_days?: number | null;
  storefront?: string;
  reset_time?: string;
  reset_tz?: string;
  reset_from_provider?: boolean;
}

/** The outcome of one real call to a provider. A failure is a result, not an error. */
export interface SupplyConnectorCheck {
  ok: boolean;
  /** "ok", a provider error code, or "inactive" / "budget" / "unknown_provider". */
  code: string;
  message: string;
  took_ms: number;
  checked_at: string;
}

/** Whether a connector's budget keeps up with what is watched. Metered connectors only. */
export interface SupplyCapacity {
  connector_id: string;
  name: string;
  listings: number;
  calls_per_day: number;
  usable_per_day: number;
  /** Share of reads that will run later than their tier asks. */
  shortfall_pct: number;
  fits: boolean;
  /** Watched parts not yet searched for at this connector. */
  searches_pending: number;
  /** Of the tracked parts, how many this connector gives a price for. */
  quotes?: { parts: number; of: number };
}

export type SupplyNoticeKind = "end_of_life" | "nrnd" | "last_time_buy" | "change";

/** A manufacturer's product change notice, as a person entered it. */
export interface SupplyNotice {
  id: string;
  title: string;
  kind: SupplyNoticeKind;
  kind_label: string;
  notice_url: string;
  last_time_buy: string | null;
  last_time_ship: string | null;
  notes: string;
  state: "open" | "closed";
  created_by: string;
  parts: number;
  /** "manual" when a person entered it, else the distributor it was read from. */
  source: string;
  source_label: string;
  /** The date the distributor gives for the notice. */
  published_on: string | null;
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

/** An attribute distributors list for a part. `value` is in SI units when it could be read, else null. */
export interface SupplyParameter {
  name: string;
  raw: string;
  key: string | null;
  unit: string;
  value: string | null;
  sources: string[];
}

/** Where a catalog component stands, for the catalog table. */
export interface SupplyComponentStanding {
  status: SupplyStatus;
  stock: number | null;
  watched: boolean;
}

export interface SupplyOutlook {
  band: "ended" | "under_2_years" | "2_to_5_years" | "no_signs" | "unknown";
  label: string;
  method: "rule-based";
  signals: Array<{ text: string; source: string; weight: "hard" | "watch" | "soft" }>;
}

/** The ECHA Candidate List as loaded by an administrator. */
export interface SupplySvhcList {
  loaded: boolean;
  substances: number;
  loaded_at: string | null;
  loaded_by: string;
  source_name: string;
}

export interface SupplyComplianceState {
  state: string;
  reason: string;
}

/** RoHS and REACH of a part, and the substances a supplier declared for it. */
/** One thing distributors state about a part (RoHS wording, tariff code, last date to buy...), per source. */
export interface SupplyFact {
  name: string;
  label: string;
  sources: Array<{ provider: string; source: string; value: string; observed_at: string }>;
  /** True when two sources say different things. */
  disagree: boolean;
}

export interface SupplyCompliance {
  rohs: SupplyComplianceState;
  reach: SupplyComplianceState;
  /** ``declared_by`` is a person's address, or a distributor when ``from_distributor``. */
  substances: Array<{ cas: string; note: string; declared_by: string; declared_at: string; listed_as: string | null; from_distributor?: boolean }>;
  /** RoHS exemptions a person named from the manufacturer's declaration. */
  exemptions?: Array<{ code: string; note: string; declared_by: string }>;
  list: SupplySvhcList;
  facts?: SupplyFact[];
}

/** Whether someone is signed in at DigiKey for change notices. Never the tokens. */
export interface SupplySignin {
  signed_in: boolean;
  state: "none" | "ok" | "expired" | "refused";
  granted_by: string;
  granted_at: string | null;
  expires_at: string | null;
  /** The address the DigiKey app must list as its callback. */
  redirect_uri: string;
}

/** A finding about a component as a whole, such as no approved part being in stock. */
export interface SupplyComponentFinding {
  check: string;
  severity: "ok" | "warning" | "error" | "fatal";
  text: string;
  scope: string;
  waiver: SupplyWaiver | null;
}

/** A note on a line of a project's BOM. */
export interface SupplyBomComment {
  id: string;
  line_key: string;
  body: string;
  author: string;
  author_name: string;
  created_at: string;
}


/** A standing request to watch a component and, when asked, its approved alternates. */
export interface SupplyComponentWatch {
  component_id: string;
  include_alternates: boolean;
  packaging: WatchPackaging;
  owner: string;
}

/** A component's findings and the part they are waived on (its own part), or null when it has none tracked. */
export interface SupplyComponentCheck {
  part_id: string | null;
  findings: SupplyComponentFinding[];
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
  sku: string;
  product_url: string;
  /** Pieces bought beyond the need, because of the smallest order and its multiples, and their cost. */
  waste?: number;
  waste_cost?: string;
  /** The next price break above the order; `extra` is what buying that many costs in total against the order (negative: cheaper). */
  next_break?: { quantity: number; unit_price: string; extra: string } | null;
}

export interface SupplyBomLineResult {
  jlc?: JlcClass | null;
  /** "tracked" has data; the rest say why a line has none. */
  state: "no_mpn" | "unknown" | "ambiguous" | "tracked";
  part_id: string | null;
  /** How the manufacturer matched: "missing" and "unmatched" mean the part number alone found it; "lcsc" the symbol's LCSC number. */
  manufacturer_match: "exact" | "missing" | "unmatched" | "lcsc" | null;
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
  /** How the part stands: its health, status and how many findings still count. */
  assessment?: { health: number; status: SupplyStatus; open: number; checks?: string[] };
}

export interface SupplyBomRollup {
  lines: number;
  tracked: number;
  not_tracked: number;
  watched: number;
  at_risk: number;
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

export interface SupplyManufacturer {
  id: string;
  name: string;
  part_count: number;
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
  first_seen_at: string;
  /** The part this listing is a candidate for. */
  part: { id: string; mpn: string; manufacturer: string } | null;
}

export interface SupplyPartNumber {
  mpn: string;
  match_key: string;
  source: string;
}

/** A longer number the part's maker lists that does not count for the part yet. `kind` says what its ending means. */
export interface SupplySoldAs {
  key: string;
  mpn: string;
  kind: "packaging" | "grade" | "other";
  connectors: string[];
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
  alternates: Array<{ id: string; component_id: string; part_id: string; mpn: string; manufacturer: string; created_by: string; created_at: string }>;
}

export interface SupplyMakerGroup {
  group_key: string;
  name: string;
  spellings: Array<{ alias_key: string; alias_text: string; source: string }>;
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
  /** Waivers and alternates proposed and waiting for QA. */
  to_approve?: SupplyToApprove;
  counts: { aliases: number; unresolved: number; near: number };
  manufacturers: SupplyManufacturer[];
}

/** Map a spelling to an existing manufacturer, or name a new one. Exactly one. */
export type ConfirmAliasInput =
  | { alias_key: string; manufacturer_id: string }
  | { alias_key: string; new_manufacturer_name: string };

export type SupplyStatus = "ok" | "warning" | "error" | "fatal" | "unknown";
export type SupplyLifecycle = "active" | "nrnd" | "last_time_buy" | "obsolete" | "unknown";
/** How often a listing is read: its part's tracking rate. */
export type SupplyTier = "daily" | "weekly" | "monthly";
export type PartsScope = "followed" | "watched" | "tier1" | "tier2" | "in_use" | "waiting" | "pick" | "all";
/** One group of parts the Overview counts; empty is no narrowing. */
export type PartsFilter =
  | "" | "at_risk" | "out_of_stock" | "lifecycle"
  | "runs_out_2w" | "runs_out_8w" | "runs_out_later" | "steady" | "few_readings" | "draining" | "restock_late" | "often_out"
  | "one_distributor" | "lead_up" | "unusual_drop" | "price_moving";
/** Why a part with nothing counted is in trouble. */
export type SupplyProblem = "not_found" | "gone";

/** Which listings a watch counts: all, or only one packaging. */
export type WatchPackaging = "any" | "cut_tape" | "custom_reel" | "tape_reel" | "tray" | "tube" | "bulk";

export interface SupplyWatchSummary {
  id: string;
  threshold: number | null;
  pinned: boolean;
  owner: string;
  packaging: WatchPackaging;
}

export interface SupplyWatch {
  id: string;
  part_id: string;
  manufacturer: string;
  mpn: string;
  threshold: number | null;
  pinned: boolean;
  owner: string;
  packaging: WatchPackaging;
}

/** JLCPCB's class of a part: Basic or Extended, and whether it is on the preferred list. */
export interface JlcClass {
  library: "Basic" | "Extended" | null;
  preferred: boolean;
}

export interface SupplyPartRow {
  id: string;
  jlc?: JlcClass | null;
  mpn: string;
  manufacturer: string;
  /** The maker is as written and no distributor has confirmed it yet. */
  manufacturer_provisional?: boolean;
  watch: SupplyWatchSummary | null;
  status: SupplyStatus;
  problem: SupplyProblem | null;
  /** Null until something that counts has been read. */
  stock: number | null;
  listings: number;
  lifecycle: SupplyLifecycle;
  /** Every distributor that lists it has stopped selling it. */
  dropped: boolean;
  unit_price: string | null;
  /** The quantity the price is quoted at. */
  price_quantity: number;
  currency: string;
  fetched_at: string | null;
  tier: SupplyTier | null;
  /** How many projects' BOMs carry this part, among those whose BOM Prism has read. */
  used_in: number;
  /** The last 30 days of counted stock, and the days until it is projected to run out. */
  spark?: number[];
  runs_out_days?: number | null;
}

/** The parts that match a view, in one project's group (`none`: used by no project). */
export interface SupplyPartGroup {
  project_id: string;
  project_name: string;
  tracked: boolean;
  count: number;
  /** How many parts have each status. */
  statuses: Partial<Record<SupplyStatus, number>>;
}

export interface SupplyPartGroups {
  groups: SupplyPartGroup[];
  total: number;
}

export interface SupplyPartsPage {
  items: SupplyPartRow[];
  total: number;
  limit: number;
  offset?: number;
  /** Where the next page starts; null at the end. */
  next_offset?: number | null;
}

export interface SupplyOffer {
  fetched_at: string;
  stock: number;
  incoming: Array<[number, string | null]>;
  moq: number;
  order_multiple: number;
  price_breaks: Array<[number, string]>;
  currency: string;
  lead_time_days: number | null;
  lifecycle: SupplyLifecycle;
  discontinued: boolean;
  rohs: boolean | null;
  marketplace: boolean;
  product_url: string;
}

export interface SupplyListing {
  id: string;
  connector_id: string;
  connector_name: string;
  /** The connector's provider key, for its colour. */
  provider?: string;
  sku: string;
  packaging: string;
  /** Pieces on a full reel, when the distributor says. */
  reel_size?: number | null;
  /** The packaging was guessed, not stated. */
  packaging_inferred?: boolean;
  match_state: string;
  /** What the distributor calls the part and its maker. */
  raw_mpn?: string;
  raw_manufacturer?: string;
  /** Only counted listings feed stock and price. */
  counted: boolean;
  offer: SupplyOffer | null;
  poll: {
    tier: SupplyTier;
    next_poll_at: string | null;
    last_polled_at: string | null;
    error_streak: number;
    last_error_code: string;
  } | null;
}

/** How prices and restocks move across a part's distributors, and whether announced arrivals arrive. Figures are withheld when too few events back them. */
export interface MarketBehaviour {
  /** Median days between a distributor's price changes. */
  repricing: Record<string, number>;
  leadership: { changes: number; followed: number; followed_share: number; leader: string | null; led: Record<string, number> } | null;
  exchange: Record<string, { currency: string; from: string; to: string; in_base_percent: number; local_percent: number; exchange_percent: number }>;
  restock_order: { rounds: number; first: string; firsts: Record<string, number> } | null;
  arrivals: { announced: number; open: number; arrived: number; slipped: number; on_time: number | null; on_time_share: number | null; median_delay_days: number | null } | null;
}

export interface SupplyPartDetail {
  /** Other numbers the part is sold under. */
  numbers?: SupplyPartNumber[];
  sold_as?: SupplySoldAs[];
  market_behaviour?: MarketBehaviour;
  jlc?: JlcClass | null;
  /** The catalog components that list this part as an approved alternate, and what their parts hold together. */
  alternate_for?: ComponentCoverage[];
  part: { id: string; mpn: string; manufacturer: string; first_seen?: string | null };
  watch: SupplyWatchSummary | null;
  status: SupplyStatus;
  problem: SupplyProblem | null;
  problem_text: string;
  stock: { total: number | null; by_connector: Array<{ connector_id: string; connector_name: string; provider?: string; stock: number }> };
  lifecycle: SupplyLifecycle;
  listings: SupplyListing[];
  /** `listings` is how many listings stood behind the day, so a jump from a new one is not read as a restock. */
  history: Array<{ day: string; stock: number; listings: number }>;
  /** The cheapest counted unit price per day. `trend` is the move over the last 30 days, or null when there is not enough to read one. */
  price: {
    currency: string;
    history: Array<{ day: string; price: number }>;
    trend: { currency: string; was: string; now: string; change_percent: number; days: number } | null;
  };
  /** A rule-based band with every signal behind it. */
  outlook: SupplyOutlook;
  parameters: SupplyParameter[];
  insight: SupplyInsight;
  used_in: Array<{ project_id: string; project_name: string; quantity: number; references: string; only_in_variants?: string[] }>;
  /** Picks made on this part, and the distributors where it still waits for one. */
  packaging?: {
    picks: Record<string, string>;
    /** Who picked at each distributor (a person, or "auto" for Prism) and Prism's note when it fell back. */
    picked_by?: Record<string, { by: string; note: string }>;
    needs_pick: Array<{ connector_id: string; connector: string; listings: number }>;
  };
  /** The distributor a person prefers for this part: shown first. */
  preferred_connector_id?: string | null;
}

export interface SupplyManufacturer {
  id: string;
  name: string;
  part_count: number;
}

export interface SupplyInsight {
  confidence: "none" | "low" | "medium" | "high";
  trend: "falling" | "rising" | "steady" | null;
  /** Observed net decrease, pieces a day. Not consumption: transfers and caps look the same. */
  decrease_per_day: number | null;
  days_to_zero: number | null;
  days_to_threshold: number | null;
  restocks: number;
  restock_interval_days: number | null;
  /** Negative when a regular restock is overdue. */
  restock_expected_in_days: number | null;
  /** Share of the history's days at zero stock. */
  zero_share?: number | null;
  /** Median days at zero before stock came back. */
  restock_latency_days?: number | null;
  /** Spread of daily stock against its average. */
  volatility?: number | null;
  /** Distributors holding stock, last day against the first. */
  sources_change?: number | null;
  /** 1 when all the stock is at one distributor. */
  concentration?: number | null;
  /** Days by which stock is expected to run out before a new order could arrive. */
  lead_gap_days?: number | null;
  /** Days on which stock collapsed in one step, newest first. */
  anomalies?: Array<{ day: string; from: number; to: number }>;
  /** How stock runs by month of the year, once there is more than a year of history. */
  seasonality?: { index: Record<string, number>; peak: number; trough: number } | null;
  /** The quoted lead time, early in the last 90 days against late. */
  lead_time_trend?: { before: number; after: number; since: string } | null;
  inputs: { points: number; span_days: number; points_in_run: number; current: number | null };
}

export type SupplyAlertKind = "out_of_stock" | "below_threshold" | "lifecycle" | "part_lost" | "rupture_soon" | "price_up" | "pcn" | "target_price_missed" | "assessment_worse";
export type SupplyAlertState = "open" | "acknowledged" | "snoozed" | "resolved";

export interface SupplyAlert {
  id: number;
  part_id: string;
  mpn: string;
  manufacturer: string;
  kind: SupplyAlertKind;
  severity: "warning" | "error" | "fatal";
  state: SupplyAlertState;
  /** Facts behind the alert: stock, threshold, lifecycle or problem. */
  detail: {
    stock?: number; threshold?: number; lifecycle?: string; problem?: string; dropped?: boolean;
    days_to_zero?: number; decrease_per_day?: number; confidence?: string;
    change_percent?: number; was?: string; now?: string; currency?: string; days?: number;
    version?: number; change_summary?: string;
    price?: string; target?: string; was_status?: string; to?: string;
    title?: string; kind?: string; kind_label?: string; last_time_buy?: string | null; last_time_ship?: string | null; soon?: boolean;
    description?: string; new?: number;
  };
  opened_at: string | null;
  last_event_at: string | null;
  acknowledged_by: string;
  snoozed_until: string | null;
  resolved_at: string | null;
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

export interface SupplyOverview {
  figures: { watched: number; at_risk: number; out_of_stock: number; lifecycle: number; no_data: number };
  open_alerts: number;
  recent_changes: SupplyRecentChange[];
  data_age: { oldest: string | null; newest: string | null };
  /** Enabled connectors. */
  connectors: number;
}

export interface AddWatchInput {
  manufacturer: string;
  mpn: string;
  threshold?: number | null;
  pinned?: boolean;
}

/** Leave a field out to keep it; send null to clear the threshold. */
export interface UpdateWatchInput {
  threshold?: number | null;
  pinned?: boolean;
  packaging?: WatchPackaging;
}

export interface FillCandidate {
  connector_id: string;
  connector: string;
  /** The connector's provider key, for its colour. */
  provider?: string;
  sku: string;
  mpn: string;
  manufacturer: string;
  description: string;
  product_url: string;
  manufacturer_matches: boolean;
}

export interface FillSearchResult {
  candidates: FillCandidate[];
  skipped: Array<{ connector: string; reason: string }>;
}

export interface FillDetails {
  description: string;
  datasheet_url: string;
  package_name: string;
  category: string;
}

export type SourceApproval = "pending" | "approved" | "rejected";

/** An alternate on a component's approved parts list. The component's own part is its primary source. */
export interface SupplySource {
  id: string;
  part_id: string;
  manufacturer: string;
  mpn: string;
  approval: SourceApproval;
  rank: number;
  created_by: string;
  decided_by: string;
  created_at: string | null;
  decided_at: string | null;
  status: SupplyStatus;
  stock: number | null;
  lifecycle: SupplyLifecycle;
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
  avl: Record<string, { manufacturer: string; mpn: string; alternates: Array<{ manufacturer: string; mpn: string }> }>;
  compliance: unknown;
}

export type AssessmentSeverity = "ok" | "warning" | "error" | "fatal";

export interface AssessmentSettings {
  lead_time_days: number;
  stale_hours: number;
  /** Prices in other currencies are converted to this one. */
  base_currency: string;
  /** Relative weight of each risk area in health, 0 to 1. */
  weights: Record<SupplySubScore["name"], number>;
  severity: Record<string, AssessmentSeverity>;
}

export interface AssessmentSettingsView {
  settings: AssessmentSettings;
  defaults: AssessmentSettings;
  checks: Array<{ id: string; label: string }>;
  ranges: { lead_time_days: [number, number]; stale_hours: [number, number] };
}

/** Why Prism follows a part: a tracked project's variant, a person's choice, a catalog component, or a watch from before tiers. */
export interface TrackingReason {
  kind: "project" | "person" | "component" | "legacy";
  ref: string;
  variant?: string;
}

/** How Prism follows a part: tier 1 is read daily, tier 2 weekly or monthly. Tier 3 (not followed) is null. */
export interface PartTracking {
  tier: 1 | 2;
  rate: "daily" | "weekly" | "monthly";
  reasons: TrackingReason[];
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
export interface TrackProgress {
  parts: number;
  finished: boolean;
  connectors: Array<{ connector_id: string; name: string; parts: number; searched: number }>;
}

export interface ProjectTrackingState {
  tracked: { project_id: string; variants: string[]; all_variants: boolean; packaging?: "cut_tape" | "custom_reel" | "tape_reel" | "tube_tray" | "smallest"; connector_ids: string[] | null; tracked_by: string; tracked_at: string } | null;
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
/** A part's stock and price over time, a line per distributor (GET /api/supply/parts/{id}/history). */
export interface PartHistory {
  days: number;
  currency: string;
  connectors: Array<{
    connector_id: string;
    name: string;
    provider: string;
    last_read: string | null;
    /** Not read for longer than the part's rate allows. */
    stale: boolean;
    stock: Array<[string, number]>;
    price: Array<[string, number]>;
  }>;
  total: Array<[string, number]>;
}

export interface BudgetNotices {
  limit: number;
  used: number;
  parts: number;
  interval_days: number;
  per_day: number;
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
  spent: number;
  refused_today: number;
  tracking: BudgetShare | null;
  hourly: BudgetCall[];
  days: BudgetCall[];
  /** The change-notice quota of a provider that keeps one apart from its product calls (DigiKey). */
  notices?: BudgetNotices | null;
  owners: {
    projects: Array<{ project_id: string; project_name: string; calls_a_day: number }>;
    parts: Array<{ part_id: string; mpn: string; manufacturer: string; tier: number; calls_a_day: number; pick_saves: number }>;
  };
}

/** A tracked part with several listings at a distributor and no pick, and what picking would save. */
export interface PackagingWaiting {
  part_id: string;
  connector_id: string;
  connector: string;
  mpn: string;
  manufacturer: string;
  listings: number;
  saves_calls_a_day: number;
}

export interface PackagingListing {
  id: string;
  sku: string;
  /** The number the distributor lists it under. */
  raw_mpn?: string;
  /** It is listed under another number than the part's. */
  other_number?: boolean;
  packaging: string;
  reel_size?: number | null;
  packaging_inferred?: boolean;
  moq: number | null;
  order_multiple: number | null;
  stock: number | null;
  lead_time_days: number | null;
  marketplace: boolean;
  currency: string;
  /** Unit price at 1, 100 and 1,000 pieces. */
  prices: Record<string, string | null>;
  fetched_at: string | null;
}

export interface PackagingOptions {
  part_id: string;
  connector_id: string;
  picked: string | null;
  /** Who picked: a person, or "auto" when Prism did. */
  picked_by?: string;
  /** Said by Prism's pick when it fell back to a packaging next to the one asked for. */
  note?: string;
  saves_calls_a_day: number;
  /** The viewer may take a listing off the part. */
  can_unpin?: boolean;
  listings: PackagingListing[];
}

/** A tracked part with several listings at a distributor, and the pick there (GET /api/supply/packaging/several). */
export interface PackagingSeveral {
  part_id: string;
  connector_id: string;
  connector: string;
  provider: string;
  mpn: string;
  manufacturer: string;
  listings: number;
  picked_listing: string | null;
  picked_sku: string;
  picked_by: string;
  note: string;
  saves_calls_a_day: number;
}

/** What Prism would pick for a part's distributors that wait for a pick. */
export interface PackagingProposal {
  connector_id: string;
  connector: string;
  listing_id: string;
  sku: string;
  packaging: string;
  note: string;
  saves_calls_a_day: number;
}

export interface PackagingSimilar extends PackagingWaiting {
  listing_id: string;
  sku: string;
}

/** How far a check someone asked for once has got: parts read everywhere they will be, of all of them. */
export interface CheckProgress {
  id: string;
  kind: "bom" | "component";
  project_id: string;
  created_at: string;
  finished: boolean;
  parts: number;
  done: number;
  failed: number;
}

/** The workspace's working week, and which spare work may run outside it. */
export interface ScheduleSettings {
  tz: string;
  /** 0 is Monday. */
  days: number[];
  start: string;
  end: string;
  spare: { waiting: boolean; tier2_early: boolean; notices: boolean };
}

/** What a person wants to hear about a part. */
export interface AlertRules {
  muted: string[];
  price_rise_percent: number | null;
  target_price: string | null;
  target_currency: string;
}

/** One part of a project's stored BOM, as the project's Supply tab lists it. */
export interface ProjectSupplyPart {
  jlc?: JlcClass | null;
  first_seen?: string | null;
  fetched_at?: string | null;
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
  lead_time_days: number | null;
  short: boolean;
  unit_price: string | null;
  tier: 1 | 2 | null;
  waiting: boolean;
  notes: number;
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
  rollup?: SupplyBomRollup;
  parts?: ProjectSupplyPart[];
  /** The cost of one board a day, oldest first. */
  cost_history?: Array<{ day: string; cost_per_board: string; currency: string; complete: boolean }>;
  releases: ProjectSupplyRelease[];
  notes: SupplyBomComment[];
}

/** What a component's own part and its approved alternates hold together, and which part gives how much. */
export interface ComponentCoverage {
  component_id: string;
  /** Null when no part has been read. */
  stock: number | null;
  /** Parts nobody has read yet, so the total is not complete. */
  unread: number;
  parts: Array<{ part_id: string; manufacturer: string; mpn: string; role: "primary" | "alternate"; stock: number | null }>;
  component?: string;
}

/** The export control class and tariff codes distributors give for a project's parts. */
export interface TradeReport {
  parts: Array<{
    key: string; manufacturer: string; mpn: string; quantity: number; part_id: string | null;
    eccn: string[]; control: "none" | "controlled" | "disputed" | "unknown";
    hts_us: string[]; hts_eu: string[]; gaps: string[];
  }>;
  summary: { parts: number; controlled: number; unknown: number; disputed: number; with_gaps: number; note: string };
}

/** Alternatives to a part, graded by how close they are, from what Prism holds. */
export interface CrossReference {
  candidates: Array<{
    part_id: string; manufacturer: string; mpn: string;
    grade: "direct" | "form_fit_function" | "functional"; grade_label: string;
    same: string[]; differs: string[];
    stock: number | null; status: SupplyStatus; lifecycle: SupplyLifecycle;
  }>;
  /** Replacements distributors name for the part, as written. */
  suggested_by_distributors: string[];
  /** The parameters the comparison rested on. */
  judged_on: string[];
  /** The catalog component that has this part; an alternate is proposed to it. */
  component_id: string | null;
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

/** What Prism could add to a project's BOM lines. A list only; nothing in the project is changed. */
export interface BomSuggestions {
  available: boolean;
  counts: Record<"manufacturer" | "lcsc_part" | "datasheet" | "prism_id", number>;
  items: Array<{
    kind: "manufacturer" | "lcsc_part" | "datasheet" | "prism_id";
    label: string;
    line_key: string;
    references: string;
    manufacturer: string;
    mpn: string;
    current: string;
    suggested: string;
    reason: string;
  }>;
}

/** The Dashboard page in one read. */
export interface SupplyDashboard {
  figures: Record<"watched" | "at_risk" | "out_of_stock" | "lifecycle" | "open_alerts" | "waiting", number>;
  /** Each figure's stored values over the last 30 days, oldest first. */
  figure_history: Record<string, number[]>;
  statuses: Array<{ status: SupplyStatus; count: number }>;
  runway: Record<"out_now" | "runs_out_2w" | "runs_out_8w" | "runs_out_later" | "steady" | "few_readings", number>;
  holders: Record<"none" | "one" | "two" | "three_plus" | "unknown", number>;
  alerts_by_day: Array<Record<string, number | string>>;
  project_costs: Array<{ project_id: string; project_name: string; currency: string; points: Array<[string, number]> }>;
  insights_ready: number;
}

export interface SupplyDistributorBehaviour {
  repricing: Array<{ name: string; days: number; parts: number }>;
  leaders: Array<{ name: string; parts: number }>;
  restock_first: Array<{ name: string; parts: number }>;
  arrivals: { on_time: number; resolved: number } | null;
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
}

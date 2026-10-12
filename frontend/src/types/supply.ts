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
  metered: boolean;
  csv_import: SupplyCsvImport | null;
  usage_today: { spent: number; interactive_spent: number };
  /** Which credentials are set. Values are never returned. */
  credentials: Record<string, boolean>;
  credentials_status: SupplyCredentialStatus;
  terms_reviewed_by: string;
  terms_reviewed_at: string | null;
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
}

/** One kept version of a manufacturer's datasheet. */
export interface SupplyDatasheetVersion {
  id: string;
  version: number;
  url: string;
  size_bytes: number;
  pages: number;
  /** Lifecycle phrases found in the text. */
  markers: string[];
  /** What differs from the version before; empty for the first. */
  change_summary: string;
  fetched_at: string;
}

export interface SupplyDatasheets {
  url: string;
  checked_at: string | null;
  status: string | null;
  items: SupplyDatasheetVersion[];
}

/** How many of a part are needed. A negative quantity is stock already on its way in. */
export interface SupplyDemand {
  id: string;
  part_id: string;
  source: "manual" | "bom_watch" | "manufacturing_run";
  quantity: number;
  need_by: string | null;
  state: "planned" | "committed" | "closed";
  note: string;
  created_by: string;
}

/** Open demand, our own stock, and what distributors must still cover. */
export interface SupplyDemandSummary {
  open: number;
  own_stock: number | null;
  net: number;
  next_need_by: string | null;
}

/** A finding about a component as a whole, such as no approved part being in stock. */
export interface SupplyComponentFinding {
  check: string;
  severity: "ok" | "warning" | "error" | "fatal";
  text: string;
  scope: string;
}

/** One distinct part on a BOM: what goes into a lookup. `quantity` is fitted parts per board. */
export interface BomLineInput {
  key: string;
  manufacturer: string;
  mpn: string;
  quantity: number;
  /** The catalog component placed on the symbol; when the catalog knows it, its manufacturer and number win. */
  prism_id?: string;
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
  sku: string;
  product_url: string;
}

export interface SupplyBomLineResult {
  /** "tracked" has data; the rest say why a line has none. */
  state: "no_mpn" | "unknown" | "ambiguous" | "tracked";
  part_id: string | null;
  /** How the manufacturer matched: "missing" and "unmatched" mean the part number alone found it. */
  manufacturer_match: "exact" | "missing" | "unmatched" | null;
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
  cost_per_board: string | null;
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
  sku: string;
  raw_mpn: string;
  raw_manufacturer: string;
  match_state: "manufacturer_unresolved" | "near";
  match_reason: string;
  first_seen_at: string;
  /** The part this listing is a candidate for. */
  part: { id: string; mpn: string; manufacturer: string } | null;
}

export interface SupplyReviewQueue {
  aliases: SupplyReviewAlias[];
  listings: SupplyReviewListing[];
  counts: { aliases: number; unresolved: number; near: number };
  manufacturers: SupplyManufacturer[];
}

/** Map a spelling to an existing manufacturer, or name a new one. Exactly one. */
export type ConfirmAliasInput =
  | { alias_key: string; manufacturer_id: string }
  | { alias_key: string; new_manufacturer_name: string };

export type SupplyStatus = "ok" | "warning" | "error" | "fatal" | "unknown";
export type SupplyLifecycle = "active" | "nrnd" | "last_time_buy" | "obsolete" | "unknown";
export type SupplyTier = "hot" | "warm" | "normal" | "cold";
export type PartsScope = "watched" | "in_use" | "all";
/** Why a part with nothing counted is in trouble. */
export type SupplyProblem = "not_found" | "gone";

export interface SupplyWatchSummary {
  id: string;
  threshold: number | null;
  pinned: boolean;
  owner: string;
}

export interface SupplyWatch {
  id: string;
  part_id: string;
  manufacturer: string;
  mpn: string;
  threshold: number | null;
  pinned: boolean;
  owner: string;
}

export interface SupplyPartRow {
  id: string;
  mpn: string;
  manufacturer: string;
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
}

export interface SupplyPartsPage {
  items: SupplyPartRow[];
  total: number;
  limit: number;
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
  sku: string;
  packaging: string;
  match_state: string;
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

export interface SupplyPartDetail {
  part: { id: string; mpn: string; manufacturer: string };
  watch: SupplyWatchSummary | null;
  status: SupplyStatus;
  problem: SupplyProblem | null;
  problem_text: string;
  stock: { total: number | null; by_connector: Array<{ connector_id: string; connector_name: string; stock: number }> };
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
  insight: SupplyInsight;
  used_in: Array<{ project_id: string; project_name: string; quantity: number; references: string }>;
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
  inputs: { points: number; span_days: number; points_in_run: number; current: number | null };
}

export type SupplyAlertKind = "out_of_stock" | "below_threshold" | "lifecycle" | "part_lost" | "rupture_soon" | "price_up" | "datasheet_changed";
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
  };
  opened_at: string | null;
  last_event_at: string | null;
  acknowledged_by: string;
  snoozed_until: string | null;
  resolved_at: string | null;
}

export interface SupplyOverview {
  figures: { watched: number; at_risk: number; out_of_stock: number; lifecycle: number; no_data: number };
  needs_attention: SupplyPartRow[];
  open_alerts: number;
  data_age: { oldest: string | null; newest: string | null };
  /** Enabled connectors. */
  connectors: number;
  quota: Array<{ connector_id: string; name: string; metered: boolean; spent: number; budget: number | null; paused: boolean }>;
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
}

export interface FillCandidate {
  connector_id: string;
  connector: string;
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
      attention: ReleaseCheckLine[];
      lines: ReleaseCheckLine[];
    };

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

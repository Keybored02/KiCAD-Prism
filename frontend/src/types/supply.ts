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
  /** The provider's offers come from an uploaded file, not from calls to the distributor. */
  csv_fed: boolean;
}

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
  /** The connector's offers come from an uploaded file. */
  csv_fed: boolean;
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
  /** The connector rests, making no calls, until this time (after a refusal, a rate limit or errors in a row). */
  cooldown_until?: string | null;
  /** Refusals in a row at a provider with no credentials; each rests longer. */
  block_streak?: number;
  /** Calls are spaced twice as far apart until this time, after a refusal. */
  slow_until?: string | null;
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
  /** Usable local stock (OK, at our locations, less allocated); absent when the local inventory holds none, null when units are mixed. */
  local_available?: number | null;
  stores?: StoresState;
  /** What the library decided about the component: marked for no new designs, or retired. */
  restriction?: RestrictionLevel | null;
}

export type RestrictionLevel = "not_for_new_designs" | "retired";

/** A library component whose part is ending, with the reason and what a person needs to decide. */
export interface EndingPart {
  component: { id: string; name: string; mpn: string; manufacturer: string; stage: string };
  part_id: string;
  reasons: Array<{ kind: string; text: string; source: string }>;
  last_buy: Array<{ source: string; value: string }>;
  stock: number | null;
  status: SupplyStatus;
  projects: Array<{ project_id: string; name: string; quantity: number }>;
  restriction: { level: RestrictionLevel; reason: string; set_by: string; set_at: string } | null;
  /** Someone dismissed it for the reasons it has now. */
  dismissed: boolean;
}

export interface EndingParts {
  items: EndingPart[];
  tracked: number;
  /** Ending parts beyond the ones listed. */
  more: number;
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
export type SupplyLifecycle = "active" | "nrnd" | "last_time_buy" | "obsolete" | "unknown";
/** How often a listing is read: its part's tracking rate. */
export type SupplyTier = "daily" | "weekly" | "monthly";
export type PartsScope = "followed" | "watched" | "tier1" | "tier2" | "in_use" | "waiting" | "pick" | "all";
/** One group of parts the Overview counts; empty is no narrowing. */
export type PartsFilter =
  | "" | "at_risk" | "out_of_stock" | "lifecycle"
  | "runs_out_2w" | "runs_out_8w" | "runs_out_later" | "steady" | "few_readings" | "draining" | "restock_late" | "often_out"
  | "one_distributor" | "lead_up" | "unusual_drop" | "price_moving" | "likely_out_4w" | "likely_out_8w"
  | "lifecycle_active" | "lifecycle_nrnd" | "lifecycle_last_time_buy" | "lifecycle_obsolete" | "lifecycle_unknown"
  | "outlook_ended" | "outlook_under_2_years" | "outlook_2_to_5_years" | "outlook_no_signs" | "outlook_unknown"
  | "lead_under_2w" | "lead_2_to_8w" | "lead_8_to_16w" | "lead_16_to_26w" | "lead_over_26w" | "lead_none"
  | "rohs_compliant" | "rohs_not_compliant" | "rohs_not_applicable" | "rohs_unknown"
  | "reach_compliant" | "reach_affected" | "reach_not_applicable" | "reach_unknown"
  | "control_controlled" | "control_disputed" | "control_none" | "control_unknown"
  | `${"origin" | "listed" | "stocked" | "cheapest" | "repricing" | "leader" | "restock_first" | "risk"}:${string}`;
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

export type PriceKind = "orderable" | "backorder" | "last_seen" | "listed";

/** The price a part shows in lists, as the part sheet gets it too. */
export interface SupplyHeadlinePrice {
  unit_price: string | null;
  currency: string;
  price_quantity: number;
  price_kind: PriceKind | null;
  price_lead_days: number | null;
  price_range: { low: string; high: string; median: string; sellers: number } | null;
  price_native: { price: string; currency: string } | null;
  price_seen_day: string | null;
  price_unrated: string[];
}

export interface SupplyRowOffer {
  connector_id: string;
  provider: string;
  name: string;
  sku: string;
  /** Every number this line stands for: two products with the same terms (cut tape and its custom reel) are one line. */
  skus?: string[];
  /** The listing Prism follows at this distributor: the preferred one, else the smallest order in stock. */
  followed?: boolean;
  /** Other packagings the same line is sold in, with the same terms. */
  also_packaging?: string[];
  stock: number;
  moq: number;
  packaging: string;
  /** Pieces on a full reel, when known. */
  reel_size?: number | null;
  /** The packaging was guessed, not stated. */
  packaging_inferred?: boolean;
  /** The distributor's page for this number. */
  product_url?: string;
  currency: string;
  price_breaks: Array<[number, string]>;
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
  /** In the base currency, at the part's price quantity. */
  unit_price: string | null;
  /** The quantity the price is quoted at. */
  price_quantity: number;
  currency: string;
  /** orderable: bought now; backorder: nothing in stock, with a lead time; last_seen: the price when it was last in stock; listed: list price only. */
  price_kind?: PriceKind | null;
  price_lead_days?: number | null;
  /** Lowest, highest and median over the distributors that price it; null with fewer than two. */
  price_range?: { low: string; high: string; median: string; sellers: number } | null;
  /** What the price was before it was converted, when it was. */
  price_native?: { price: string; currency: string } | null;
  price_seen_day?: string | null;
  /** Currencies priced by a distributor that have no exchange rate, so were left out. */
  price_unrated?: string[];
  fetched_at: string | null;
  tier: SupplyTier | null;
  /** How many projects' BOMs carry this part, among those whose BOM Prism has read. */
  used_in: number;
  /** The last 30 days of counted stock, and the days until it is projected to run out. */
  spark?: number[];
  runs_out_days?: number | null;
  /** Why and how often Prism follows it. */
  tracking?: { tier: number; rate: string } | null;
  /** The first two projects using it, by name. */
  project_names?: string[];
  /** The distributors that list it: stock above zero is filled. */
  distributors?: Array<{ connector_id: string; provider: string; name: string; stock: number; price?: string | null; currency?: string }>;
  /** Each distributor's offer: stock, smallest order, packaging and price breaks as [from quantity, price]. */
  offers?: SupplyRowOffer[];
  preferred_connector_id?: string | null;
  /** Cheapest price over 30 days, in percent. */
  price_change_percent?: number | null;
  /** The shortest lead time quoted, in days. */
  lead_days?: number | null;
  /** Problems the row shows as icons: waiting, rohs, reach, ncnr, not_stocked. */
  flags?: string[];
  /** The kept forecast: when it likely runs out and the chance of being out within four and eight weeks. */
  forecast?: RowForecast | null;
}

/** The parts that match a view, in one project's group (`none`: used by no project). */
export interface SupplyPartGroup {
  project_id: string;
  project_name: string;
  tracked: boolean;
  count: number;
  /** How many parts have each status. */
  statuses: Partial<Record<SupplyStatus, number>>;
  stats?: SupplyGroupStats;
}

/** What a project row shows when closed. The cost, boards and alerts are for a tracked project. */
export interface SupplyGroupStats {
  at_risk: number;
  out: number;
  end_of_life: number;
  one_distributor: number;
  runs_out_soon: number;
  bom_read_at?: string | null;
  variants?: string[];
  all_variants?: boolean;
  packaging?: string | null;
  cost_per_board?: string;
  currency?: string;
  cost_change_percent?: number | null;
  boards?: number | null;
  /** The usual build the cost and boards are worked out for. */
  build_quantity?: number;
  /** BOM lines no stock figure checks: the boards count is unconfirmed while any is. */
  unchecked?: number;
  alerts?: number;
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
  /** The state of the forecast models the rows' forecasts come from. */
  forecast_state?: Partial<Record<"runout" | "out_4w" | "can_buy_4w" | "can_buy_8w", ForecastState>>;
}

export type ForecastState = "learning" | "shown" | "paused";

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

/** The forecast kept for a part, as a list row carries it. */
export interface RowForecast {
  made_on: string;
  runout?: { median_date: string; low_date: string; high_date: string; p: number };
  p_out_4w?: number;
  p_out_8w?: number;
  can_buy_4w?: number;
  can_buy_8w?: number;
  out_now?: boolean;
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
  /** Why it matched, or did not. */
  match_reason?: string;
  /** The distributor's page for it, even before it has been read. */
  page_url?: string;
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
  /** Why and how often Prism follows the part; null when nobody does. */
  tracking?: { tier: number; rate: string } | null;
  market_behaviour?: MarketBehaviour;
  restock_record?: RestockRecord[];
  jlc?: JlcClass | null;
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
    /** The quantity the part is priced at, the workspace default, and whether the part has its own. */
    quantity?: number;
    default?: number;
    own?: boolean;
    /** Days up to this one are drawn at 100 pieces, because the price breaks were not kept yet. */
    estimated_until?: string | null;
    headline?: SupplyHeadlinePrice;
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
  /** Export control: what distributors state, and a person's mark that wins over it. */
  trade?: {
    control: "controlled" | "none" | "disputed" | "unknown";
    eccn: string[];
    stated: string;
    stated_eccn: string[];
    mark: { control: "controlled" | "none"; eccn: string; set_by: string; set_at: string } | null;
  };
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
  /** Falling faster in the later half of the readings: the later rate and the days to zero at it. */
  pace?: "accelerating" | "steady" | "slowing" | null;
  recent_decrease_per_day?: number | null;
  days_to_zero_recent?: number | null;
  /** The drain is too slow to run out within a year, for a part that is still made and restocked. */
  beyond_year?: boolean;
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

export type SupplyAlertKind = "out_of_stock" | "below_threshold" | "lifecycle" | "part_lost" | "rupture_soon" | "price_up" | "pcn" | "target_price_missed" | "assessment_worse" | "likely_out";
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
    days_to_zero?: number; chance?: number; weeks?: number; decrease_per_day?: number; confidence?: string;
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

export type AssessmentSeverity = "ok" | "warning" | "error" | "fatal";

export interface AssessmentSettings {
  lead_time_days: number;
  /** A last date to buy this many days away or less makes a last time buy an error; past it, fatal. */
  last_buy_error_days: number;
  /** A read is late when it is this many hours past when the part's schedule wanted it. */
  late_hours: number;
  /** Spares a costing orders: one percent for every part ("flat"), or by kind of part ("package"). */
  spares_mode: "flat" | "package";
  spares_percent: number;
  spares_small_passives: number;
  spares_others: number;
  /** The price rise, and the chance of running out within four weeks, that raise an alert when a part has no rule of its own. */
  alert_price_rise_percent: number;
  alert_likely_out_percent: number;
  /** Prices in other currencies are converted to this one. */
  base_currency: string;
  /** Lists and price history price at this quantity, unless a part has its own. */
  price_quantity: number;
  /** Price the BOM at a preferred distributor with enough stock, else the cheapest. */
  prefer_distributors?: boolean;
  /** Connector ids, the most preferred first. */
  distributor_order?: string[];
  severity: Record<string, AssessmentSeverity>;
}

export interface AssessmentSettingsView {
  settings: AssessmentSettings;
  defaults: AssessmentSettings;
  checks: Array<{ id: string; label: string; area: string }>;
  ranges: {
    lead_time_days: [number, number]; last_buy_error_days: [number, number]; late_hours: [number, number]; price_quantity: [number, number];
    spares: [number, number]; alert_price_rise_percent: [number, number]; alert_likely_out_percent: [number, number];
  };
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
  /** Days worth marking on the axis: a restock, or a product change notice. */
  events: Array<{ day: string; kind: "restock" | "notice"; text: string }>;
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
  /** What scheduled work still needs before the reset, what is kept for people, and what is free to spend now. */
  free?: { scheduled: number; kept_for_people: number; free: number };
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
  /** The distributor's page for the listing. */
  product_url?: string;
}

export interface PackagingOptions {
  part_id: string;
  connector_id: string;
  /** The case the part comes in (QFN, SOT-23, 0402); empty when no distributor lists it. */
  package?: string;
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
  /** Listings found after the pick was made. */
  new_since_pick?: number;
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

/** Which spare work is on. */
export interface ScheduleSettings {
  spare: { waiting: boolean; tier2_early: boolean; notices: boolean };
}

/** What a person wants to hear about a part. */
export interface AlertRules {
  muted: string[];
  price_rise_percent: number | null;
  /** The chance of being out within four weeks that raises the likely-to-run-out alert; null is the default, 70. */
  likely_out_percent?: number | null;
  target_price: string | null;
  target_currency: string;
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
  unit_price: string | null;
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
  /** What distributors suggest in place of it, one row for each number with every distributor that said it. Not compared with the part. */
  suggestions?: Array<{
    manufacturer: string; mpn: string; sku: string;
    /** Their words: the package, or how close DigiKey says it is. */
    notes: string[];
    sources: Array<{ provider: string; name: string }>;
    /** Asked for from DigiKey, not seen in an offer read. */
    asked: boolean;
    /** The part in Prism, when it is one, with its stock and whether Prism follows it. */
    part_id: string | null;
    stock: number | null;
    status: SupplyStatus | null;
    tracked: boolean;
  }>;
  /** The parameters the comparison rested on. */
  judged_on: string[];
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

/** What a distributor promised about a part's return, and how its earlier promises went. */
export interface RestockRecord {
  connector_id: string;
  name: string;
  provider: string;
  open: { kind: "lead_time" | "dated"; expected: string; quoted_lead_days?: number | null; quantity?: number; late: boolean } | null;
  kept: number;
  resolved: number;
  stock_outs: number;
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
    compliance: { rohs: Record<"compliant" | "not_compliant" | "not_applicable" | "unknown", number>; reach: Record<"compliant" | "affected" | "not_applicable" | "unknown", number> };
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

/** A local inventory server (InvenTree, or Vision serving its API) whose stock fills the catalog. The token never comes back. */
export interface InventorySource {
  id: string;
  kind: "inventree";
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
  display_name?: string;
  base_url?: string;
  /** Empty removes the token; left out keeps it. */
  token?: string;
  category_id?: number | null;
  interval_hours?: number;
  enabled?: boolean;
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

/** A server part with stock that no catalog component matched. It waits in Library Manager > Review for a person to link it. */
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

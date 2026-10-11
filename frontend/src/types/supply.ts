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
export type PartsScope = "watched" | "all";
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
  unit_price: string | null;
  /** The quantity the price is quoted at. */
  price_quantity: number;
  currency: string;
  fetched_at: string | null;
  tier: SupplyTier | null;
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
}

export interface SupplyManufacturer {
  id: string;
  name: string;
  part_count: number;
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

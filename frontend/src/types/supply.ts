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

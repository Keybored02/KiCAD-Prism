import type { SupplyConnector, SupplyProvider } from "@/types/supply";

export function connectorFixture(overrides: Partial<SupplyConnector> = {}): SupplyConnector {
  return {
    id: "c1",
    provider: "demo",
    provider_label: "Demo distributor",
    provider_available: true,
    storefront: "",
    display_name: "Demo EU",
    currency: "EUR",
    enabled: true,
    paused_reason: "",
    daily_budget: 1000,
    interactive_reserve_pct: 10,
    metered: true,
    csv_import: null,
    usage_today: { spent: 120, interactive_spent: 0 },
    credentials: { api_key: true },
    credentials_status: "ready",
    terms_reviewed_by: "",
    terms_reviewed_at: null,
    last_ok_at: null,
    last_error_code: "",
    last_error_at: null,
    created_by: "admin@example.com",
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
    ...overrides,
  };
}

export function providerFixture(overrides: Partial<SupplyProvider> = {}): SupplyProvider {
  return {
    key: "demo",
    label: "Demo distributor",
    capabilities: ["search", "offers"],
    max_batch: 10,
    stock_pooling: "separate",
    credential_fields: [{ name: "api_key", label: "API key", secret: true }],
    storefronts: [],
    default_daily_budget: 1000,
    metered: true,
    ...overrides,
  };
}

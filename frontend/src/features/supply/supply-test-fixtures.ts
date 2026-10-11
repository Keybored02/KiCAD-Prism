import type { SupplyConnector, SupplyPartDetail, SupplyPartRow, SupplyProvider } from "@/types/supply";

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

export function partRowFixture(overrides: Partial<SupplyPartRow> = {}): SupplyPartRow {
  return {
    id: "p1",
    mpn: "LM358D",
    manufacturer: "Texas Instruments",
    watch: { id: "w1", threshold: null, pinned: false, owner: "ana@example.com" },
    status: "ok",
    stock: 12500,
    listings: 1,
    lifecycle: "active",
    unit_price: "0.52",
    currency: "EUR",
    fetched_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    tier: "normal",
    ...overrides,
  };
}

export function partDetailFixture(overrides: Partial<SupplyPartDetail> = {}): SupplyPartDetail {
  return {
    part: { id: "p1", mpn: "LM358D", manufacturer: "Texas Instruments" },
    watch: { id: "w1", threshold: 500, pinned: false, owner: "ana@example.com" },
    status: "ok",
    stock: { total: 12500, by_connector: [{ connector_id: "c1", connector_name: "Mouser EU", stock: 12500 }] },
    lifecycle: "active",
    listings: [
      {
        id: "l1", connector_id: "c1", connector_name: "Mouser EU", sku: "595-LM358D", packaging: "cut_tape",
        match_state: "exact", counted: true,
        offer: {
          fetched_at: new Date(Date.now() - 3600 * 1000).toISOString(), stock: 12500, incoming: [[5000, "2026-04-01"]],
          moq: 1, order_multiple: 1, price_breaks: [[1, "0.52"], [100, "0.31"]], currency: "EUR", lead_time_days: null,
          lifecycle: "active", discontinued: false, rohs: true, marketplace: false, product_url: "https://example.invalid/p",
        },
        poll: { tier: "normal", next_poll_at: null, last_polled_at: null, error_streak: 0, last_error_code: "" },
      },
      {
        id: "l2", connector_id: "c1", connector_name: "Mouser EU", sku: "595-LM358DR", packaging: "tape_reel",
        match_state: "near", counted: false, offer: null, poll: null,
      },
    ],
    history: [
      { day: "2026-02-27", stock: 9000 }, { day: "2026-02-28", stock: 11000 }, { day: "2026-03-01", stock: 12500 },
    ],
    ...overrides,
  };
}

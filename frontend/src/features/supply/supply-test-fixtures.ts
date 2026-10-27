import type { SupplyAlert, SupplyCapacity, SupplyConnector, SupplyDashboard, SupplyOverview, SupplyPartDetail, SupplyPartRow, SupplyProvider } from "@/types/supply";

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
    retention_days: null,
    keep_days: null,
    interactive_reserve_pct: 10,
    metered: true,
    csv_fed: false,
    csv_import: null,
    usage_today: { spent: 120, interactive_spent: 0 },
    credentials: { api_key: true },
    credentials_status: "ready",
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
    csv_fed: false,
    ...overrides,
  };
}

export function partRowFixture(overrides: Partial<SupplyPartRow> = {}): SupplyPartRow {
  return {
    id: "p1",
    mpn: "LM358D",
    manufacturer: "Texas Instruments",
    watch: { id: "w1", threshold: null, pinned: false, owner: "ana@example.com", packaging: "any" },
    status: "ok",
    problem: null,
    stock: 12500,
    listings: 1,
    lifecycle: "active",
    dropped: false,
    unit_price: "0.52",
    price_quantity: 100,
    currency: "EUR",
    fetched_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    tier: "daily",
    used_in: 0,
    ...overrides,
  };
}

export function partDetailFixture(overrides: Partial<SupplyPartDetail> = {}): SupplyPartDetail {
  return {
    part: { id: "p1", mpn: "LM358D", manufacturer: "Texas Instruments" },
    watch: { id: "w1", threshold: 500, pinned: false, owner: "ana@example.com", packaging: "any" },
    status: "ok",
    problem: null,
    problem_text: "",
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
        poll: { tier: "daily", next_poll_at: null, last_polled_at: null, error_streak: 0, last_error_code: "" },
      },
      {
        id: "l2", connector_id: "c1", connector_name: "Mouser EU", sku: "595-LM358DR", packaging: "tape_reel",
        match_state: "near", counted: false, offer: null, poll: null,
      },
    ],
    used_in: [],
    price: { currency: "", history: [], trend: null },
    parameters: [],
    outlook: { band: "no_signs", label: "No signs of an end of life", method: "rule-based", signals: [] },
    insight: {
      confidence: "none", trend: null, decrease_per_day: null, days_to_zero: null, days_to_threshold: null,
      restocks: 0, restock_interval_days: null, restock_expected_in_days: null,
      inputs: { points: 3, span_days: 2, points_in_run: 3, current: 12500 },
    },
    history: [
      { day: "2026-02-27", stock: 9000, listings: 1 }, { day: "2026-02-28", stock: 11000, listings: 1 },
      { day: "2026-03-01", stock: 12500, listings: 1 },
    ],
    ...overrides,
  };
}

export function capacityFixture(overrides: Partial<SupplyCapacity> = {}): SupplyCapacity {
  return {
    connector_id: "c1", name: "Demo EU", listings: 12, calls_per_day: 66, usable_per_day: 900,
    shortfall_pct: 0, fits: true, searches_pending: 0, ...overrides,
  };
}

export function alertFixture(overrides: Partial<SupplyAlert> = {}): SupplyAlert {
  return {
    id: 1,
    part_id: "p1",
    mpn: "LM358D",
    manufacturer: "Texas Instruments",
    kind: "below_threshold",
    severity: "warning",
    state: "open",
    detail: { stock: 40, threshold: 100 },
    opened_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    last_event_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    acknowledged_by: "",
    snoozed_until: null,
    resolved_at: null,
    ...overrides,
  };
}

export function overviewFixture(overrides: Partial<SupplyOverview> = {}): SupplyOverview {
  return {
    figures: { watched: 4, at_risk: 2, out_of_stock: 1, lifecycle: 1, no_data: 0 },
    open_alerts: 2,
    recent_changes: [],
    data_age: { oldest: new Date(Date.now() - 26 * 3600 * 1000).toISOString(), newest: new Date(Date.now() - 600 * 1000).toISOString() },
    connectors: 1,
    ...overrides,
  };
}

export function dashboardFixture(overrides: Partial<SupplyDashboard> = {}): SupplyDashboard {
  return {
    figures: { watched: 4, at_risk: 2, out_of_stock: 1, lifecycle: 1, open_alerts: 2, waiting: 3 },
    figure_history: { at_risk: [1, 1, 2], watched: [4, 4, 4] },
    statuses: [{ status: "ok", count: 2 }, { status: "warning", count: 1 }, { status: "error", count: 1 }, { status: "fatal", count: 0 }, { status: "unknown", count: 0 }],
    runway: { out_now: 1, runs_out_2w: 1, runs_out_8w: 0, runs_out_later: 1, steady: 1, few_readings: 0 },
    holders: { none: 1, one: 2, two: 1, three_plus: 0, unknown: 0 },
    alerts_by_day: [],
    project_costs: [],
    insights_ready: 4,
    risk_grid: [
      { lifecycle: "active", two_plus: 1, one: 1, out: 0, not_read: 0 },
      { lifecycle: "nrnd", two_plus: 0, one: 1, out: 1, not_read: 0 },
      { lifecycle: "last_time_buy", two_plus: 0, one: 0, out: 0, not_read: 0 },
      { lifecycle: "obsolete", two_plus: 0, one: 0, out: 0, not_read: 0 },
      { lifecycle: "unknown", two_plus: 0, one: 0, out: 0, not_read: 0 },
    ],
    deadlines: [],
    projects: [],
    ...overrides,
  };
}

# Supply package

Distributor connectors, the call budget, and (as they land) parts, stock
history, assessment and part intelligence. The design and roadmap are in
`docs/plans/supply-chain-integration.md`. Read `AGENTS.md` at the repository
root first.

## What exists

| Module | Role |
| --- | --- |
| `vocabulary.py` | `Status`, `Lifecycle`, `Packaging`. The only wording any surface uses. |
| `models.py` | Provider-neutral `Offer`, `PriceBreak`, `Incoming`, `PartMatch`, `PartData`. Validate on construction. |
| `providers/base.py` | `ProviderSpec`, the `SupplyProvider` protocol, `ProviderError` subclasses. |
| `providers/registry.py` | Provider lookup. Built-ins register at import; plugins load from the `prism.supply_providers` entry point. |
| `providers/tme.py` | TME API v2: OAuth client-credentials token (kept until shortly before it expires), `/products?mpns[]` to find listings, `/products` plus `/products/data` for offers (two calls a batch of 50). The storefront is the country. Gross prices are turned net. |
| `providers/mouser.py` | Mouser Search API V1: `search/partnumber` with up to 10 numbers per call, `Exact` matching, calls spaced 2 seconds apart. Errors arrive in a 200 answer. |
| `providers/digikey.py` | DigiKey Product Information V4, from its Swagger file: OAuth client credentials, keyword search, one product-details call per SKU (one SKU is one packaging), stock pooled. Not yet run against the live service. |
| `providers/farnell.py` | Farnell, Newark and element14 Product Search REST: manufacturer-number search, one SKU per call, the connector names the store and the currency. Not yet run against the live service. |
| `providers/lcsc.py` | LCSC through its product page data service, no key. Looks up an LCSC number only (its keyword search refuses non-browsers); checked live. |
| `providers/text_values.py` | Reads numbers sent as display text: "1,234 In Stock", "0,52 EUR", "42 Days". |
| `providers/unrecognised.py` | Logs once a status or wording an adapter does not know, so a new one that matters gets noticed. |
| `providers/fake.py` | Deterministic simulated market for tests, development and demos. Off unless `SUPPLY_ENABLE_SIMULATED_PROVIDER` is set. |
| `identity.py` | `match_key`: the lookup key for part numbers. Conservative on purpose: dots and slashes stay. |
| `parts.py` | Manufacturers, spellings (`pending` until a person maps them) and parts. Functions on a connection; none commit. |
| `discovery.py` | `DiscoveryService`: sorts a provider's answers into match states. Also `pin_listing`, `reject_listing`, `counted_listings`. |
| `review.py` | Reads the review queue: pending spellings and listings waiting for a person. |
| `backend/app/api/supply_review.py` | Review API. Everyone who reads supply data sees the queue; confirming a spelling and pinning or rejecting a listing need admin or qa. |
| `watches.py` | The watchlist: one watch per part, with a stock threshold and a pin to the fastest polling (pins are capped). |
| `tiers.py` | Pure rules: which polling tier a listing is on, and when it is next asked (`next_poll_at`) or retried (`retry_at`). |
| `stock.py` | A part's stock across distributors, honouring each provider's pooling. Only exact and manual listings, no marketplace stock. |
| `discoverer.py` | Searches for listings of watched parts, once per part per connector and weekly after. Costs budget like any call. |
| `trouble.py` | What to do when a provider call fails (rate limit, bad credentials, other), shared by polling and discovery. |
| `jobs.py` | The `supply_poll` job handler and `schedule_due_supply_jobs`, which prism-worker runs every minute. One job per connector with work. |
| `poller.py` | `Poller.poll_connector`: asks for due listings in batches within the call budget and records offers and samples. |
| `parts_view.py` | Read models for the Parts screen: the list and one part's detail, with history carried forward day by day. |
| `part_status.py` | The interim status of a part (ok, warning, error, fatal, unknown), with the problems that make an unread part an error (no distributor carries it, every listing gone). The assessment pipeline replaces it. |
| `alerts.py` | Alerts on watched parts: one per part and kind, opened after two looks 30 minutes apart (a lost part opens at once), cleared when the condition clears, acknowledged or snoozed by people. In-app only; nothing is sent anywhere. Evaluated after every read and every watch change. |
| `insights.py` | Pure: what a part's daily stock history says. Observed net decrease (Theil-Sen slope since the last restock), days to zero and to the threshold, restocks and cadence, and a confidence. A change in how many listings stand behind the figure is cut, never read as a restock. Every answer lists its inputs. |
| `connector_check.py` | Tests a connector with one real call charged to the interactive reserve. Reports in fixed, safe words (never the provider's text), records the result on the connector, and never pauses it. |
| `capacity.py` | Whether each metered connector's budget keeps up with the watchlist: calls a day against usable calls, counting a provider's calls per batch. |
| `bom_lookup.py` | Looks a BOM up in supply data without calling a distributor: each line resolves to a part (manufacturer and number, or number alone when unambiguous), reports stock, status, lead time and the cheapest offer that covers the need, and rolls up cost, shortages and "can build N". Also watches the parts on a BOM. |
| `backend/app/api/supply_bom.py` | BOM lookup (readers) and watch-all-lines (admin, designer). |
| `fill.py` | Fill from distributor: asks the connected distributors for a part number and, for one picked candidate, its description and datasheet. Spends the interactive reserve; writes nothing to the catalog. |
| `backend/app/api/supply_fill.py` | Fill search and details (admin, designer). |
| `sources.py` | The approved parts list (AVL): alternates for a catalog component, proposed by writers, approved and ranked by QA, audited. The component's own part is its primary source and is not stored. |
| `backend/app/api/supply_sources.py` | AVL API: readers list; admin, designer and qa propose; admin and qa approve, reject and rank. |
| `seeding.py` | Seeds listings from the catalog: a component naming a connected vendor and its part number gets a manual listing. Adds nothing else; safe to run again. |
| `backend/app/api/supply_seed.py` | Seeding endpoint (admin, designer). |
| `backend/app/services/supply/assessment/settings.py` | Check ids, default severities, weights and thresholds for the assessment. |
| `backend/app/services/supply/assessment/checks.py` | Findings from a part's facts: lifecycle, stock, lead time, RoHS, age. Pure rules. |
| `backend/app/services/supply/assessment/risk.py` | Five risk sub-scores, 1 good to 5 bad, each with its reasons. |
| `backend/app/services/supply/assessment/health.py` | Health 0 to 10, status, and the quantity-weighted BOM roll-up. |
| `backend/app/services/supply/assessment/waivers.py` | Proposing, approving and applying waivers; a waiver holds while its condition does. |
| `backend/app/services/supply/assessment/service.py` | Gathers a part's facts and runs the pipeline. Reads only; no distributor calls. |
| `backend/app/services/supply/assessment/settings_store.py` | Loads, saves and resets the workspace's assessment settings (thresholds, severities, weights); absent means the defaults in code. Changes are audited. |
| `backend/app/api/supply_settings.py` | Assessment settings endpoints: readers see them, administrators change them. |
| `backend/app/api/supply_assessment.py` | Assessment and waiver endpoints. Readers see assessments; admin, designer and qa propose waivers; admin and qa decide. |
| `backend/app/api/supply_access.py` | The role check shared by endpoints that writers and approvers both use. |
| `backend/app/services/supply/refresh.py` | Read one part now: its counted listings are polled at once from the interactive reserve, once every 15 minutes per person and part. |
| `backend/app/services/supply/panel_payload.py` | What the KiCad panel gets (remote provider 0.4.0, additive): a one-line summary on search, list and detail; detail adds distributor offers, approved alternates, insight, health, two risk lines and links. Reads only; not sent to roles that cannot read supply data. |
| `backend/app/services/supply/catalog_read.py` | Reads catalog components for supply through the catalog service: all components, a manufacturer-and-number to component id map, and the manufacturer and number behind a `Prism ID`. |
| `backend/app/services/supply/release_check.py` | The supply check on a project BOM before release (health, parts that need a look; informs, never blocks) and the snapshot frozen at publish with each matched component's approved parts. The snapshot is evidence beside the release, never part of its digest. |
| `backend/app/services/supply/publish_hook.py` | Called by Release Studio after a publish; takes the snapshot; any failure is logged and dropped. |
| `backend/app/api/supply_release.py` | Release check and release snapshot endpoints (readers; projects follow the caller's role). |
| `bom_fields.py` | Which symbol fields are the manufacturer and the manufacturer part number (best name first; never the distributor's number), what counts as fitted, and the `Prism ID` field. The frontend's `frontend/src/features/supply/bom-supply.ts` keeps the same lists; a test compares them. |
| `assessment/line_checks.py` | Findings about how a BOM line names its part: `manufacturer_missing` (found by number alone) and `not_in_library` (no catalog component has the pair). |
| `assessment/component_checks.py` | Findings about a component taken with its approved alternates: `no_approved_source` when the part and every approved alternate are known to be out of stock. Added to the BOM line of a placed component and shown in the Sourcing tab. |
| `demand.py` | Demand: how many of a part are needed and by when (manual rows now; a negative quantity is stock on its way in). Net requirement is open demand less our own stock, read from the catalog by the API layer. Open demand speeds a listing's polling tier and sets the need a part is judged against. |
| `health.py` | Per connector: calls against budget, last error, how many reads are late and the oldest read. Administrators only, at `/api/supply/health`. |
| `fx.py` | Exchange rates: the ECB daily file (fetched by the poll job, at most once in 20 hours) or rates an administrator enters; conversion goes through the euro and an unknown rate means no conversion. Used to compare offers and total a BOM in the base currency (a Supply setting, default EUR). |
| `datasheets.py` | The datasheet archive: fetch a part's datasheet through the guarded client (public HTTPS, PDF only, 25 MB), keep it by SHA-256 outside the database, read the first pages' text in a child process, note lifecycle phrases and what changed from the version before, keep five versions. Watched parts and parts on project BOMs are checked weekly from the supply poll job. |
| `compliance.py` | REACH: the ECHA Candidate List (loaded by an administrator from a CSV export), substances a supplier declared for a part as CAS numbers (checked digit by digit), and a part's REACH standing (affected, clear, unknown; silence is never clear). A distributor's REACH flag is read with the offer. |
| `outlook.py` | A rule-based lifecycle outlook: signals (manufacturer lifecycle, distributors dropping it, datasheet phrases, long zero stock, price rise), each with its source, and one of five bands. No signs of an end is never read as a promise of years. |
| `market.py` | Market indices over the watched and BOM parts, by manufacturer (out of stock, lifecycle risk, dropped, median lead time): groups of at least three parts, one snapshot a day from the supply poll job, compared with a month earlier. Describes this workspace's parts, not the market. |
| `pcn.py` | Product change notices entered by people (end of life, not recommended for new designs, last time buy, other change) with their dates and the parts they cover. Open ones feed the outlook and raise a `pcn` alert on watched parts, an error within 90 days of the last time buy. Prism does not read notice PDFs. |
| `prices.py` | The cheapest counted unit price per day from the recorded samples, in one currency, and whether a rise over the last 30 days counts as a price move (readings a week apart, the latest recent). The part sheet shows the 90 day series and the move. |
| `usage.py` | Where parts are used (and `project_rows`, the stored lines behind a project's supply card): one row per distinct part on each project's BOM, read from semantic indexes that already exist (it builds none). A symbol with a `Prism ID` the catalog knows takes that component's manufacturer and number. Each project carries the roles its folder lets see it, and every read filters by the caller's role. |
| `overview.py` | The Supply overview: counts, what needs attention, open alerts, data age, quota today. |
| `backend/app/api/supply_alerts.py` | Overview and alerts API. Readers see both; admin and designer acknowledge and snooze. |
| `pricing.py` | Unit price at a reference quantity (100), honouring minimum order and multiples. Prices are only compared at one quantity. |
| `retention.py` | Rolls raw samples older than 60 days into `samples_daily`, in slices of 30 days. Run at the end of each poll job. |
| `backend/app/api/supply_parts.py` | Parts and watches API, and the read-only part lookup the component Sourcing tab uses. Readers see parts, stock and history; admin and designer watch parts and change watch rules. |
| `audit.py` | `write_audit` and `actor_text`. The only way supply writes the audit trail. |
| `csv_format.py` | The offers file: columns, parsing, validation. Pure. A file is all or nothing. |
| `csv_offers.py`, `csv_import_service.py` | Storage for uploaded offers and the import and clear service. |
| `providers/csv_provider.py` | Offers from an uploaded file. Unmetered. Reads its own table, never writes. |
| `egress.py` | Outbound URL validation. Required before any fetch of a URL that is not hard-coded. |
| `http_client.py` | `SafeHttpClient`: the only way a provider makes a request. Validates every hop, connects to the checked address, maps statuses to `ProviderError` subclasses, keeps query strings out of messages. |
| `quota.py` | Pure budget policy: background allowance, interactive reserve, capacity estimate. |
| `ledger.py` | Atomic daily spending (`try_spend` locks the day's row). |
| `credentials.py` | The one adapter over the credential keyring. |
| `connectors.py` | Connector setup, credentials, pause, state. |
| `backend/app/api/supply_connectors.py` | HTTP API for connectors. Readers are admin, designer and qa; only admin changes anything. Strips request bodies from 422 errors. |
| `schema_migrations.py`, `store.py` | The `supply` schema, its own migration ledger, and connections. |

## Rules

- **Supply data never enters component revisions.** Revisions are hashed;
  prices change daily.
- **Only `exact` and `manual` listings count** toward stock and price. A person's
  decision (`manual`, `rejected`) is never overwritten by discovery, and an
  `exact` listing is never downgraded by a search for a different part.
- **A decrease in stock is called "observed net decrease", never consumption.** Transfers and
  reporting caps look the same. A rupture warning needs at least medium confidence and no regular
  restock due first.
- **Usage reads are role-aware.** A project hidden from a role by its folder never shows in that role's
  "Used in" or "In use"; `usage.VISIBLE` is the filter and every read passes the caller's role.
- **Only approvers introduce a manufacturer.** A designer watching a part must pick a
  manufacturer Prism already knows (`ensure_manufacturer(may_create=False)`), so a stray
  "TI" cannot become a second Texas Instruments.
- **A job is queued only when the connector can spend a call now** (`jobs._has_budget`),
  and a repeated provider failure rests the connector. Neither may become a job a minute.
- **A manufacturer argument is a hint, never a filter.** Prism decides who is the
  same manufacturer, using its alias table.
- **The manufacturer part is the spine.** A feature that needs part data reads
  it from there. No feature keeps its own copy.
- **Adapters follow the provider's published API description**, and their fixtures say where
  they come from (`backend/tests/fixtures/supply`). Replace a schema-shaped fixture with a
  recorded answer when one is available.
- **Network providers do not touch the database and do not log credentials.**
  They return models or raise `ProviderError`. Callers decide what to store.
  The CSV provider is the one that reads a table, and only its own.
- **Credentials go through `credentials.py` only.** Reads return which
  credentials are set, never their values. There is no plaintext fallback.
- **Every outbound request goes through `http_client.py`**, which validates
  with `egress.py` on each redirect and connects to the address that was
  checked. Do not call `requests` directly from a provider.
- **Failures retry on their own schedule** (`tiers.retry_at`), never the tier's. A
  rate limit holds the whole connector off; rejected credentials pause it.
- **Quota is a budget, not an error.** Running short delays polling and shows
  data age. Spend only through `ledger.try_spend`.
- **Audit identity comes from the session**, passed in as `actor`. Never take
  it from a request body.
- **Migrations are additive and numbered in this package's own ledger.** Do not
  add supply tables to the workspace or catalog ledgers.
- **Role-aware lookups only** when supply data is joined to projects.

## Frontend

`frontend/src/features/supply/` holds the UI, with types in
`frontend/src/types/supply.ts`. The Supply section (`frontend/src/features/supply/supply-workspace.tsx`, opened
from the sidebar through `frontend/src/components/workspace.tsx`) owns the Parts
and Review tabs; add new tabs to its `VIEWS` list. The URL holds the scope
(`partsScope`), the search (`partsQ`) and the open part (`part`). Formatting and
the threshold parser live in `frontend/src/features/supply/supply-format.ts`. The Connectors tab mounts from
`frontend/src/components/workspace/library-manager-workspace.tsx`. Each form
mounts only while its dialog is open, so it resets without effects; keep form
rules in `frontend/src/features/supply/connector-form-model.ts`, not in components.

## Tests

`backend/tests/test_supply_foundation.py`, `backend/tests/test_supply_csv_format.py` and
`backend/tests/test_supply_http_client.py` need no database or network.
`backend/tests/test_supply_connectors_postgres.py` and
`backend/tests/test_supply_connectors_api.py` need `PRISM_DATABASE_URL` and use a
disposable schema. Provider tests use recorded fixtures, never live
calls. Frontend tests are `*.test.ts(x)` beside the code.

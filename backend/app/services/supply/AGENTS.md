# Supply package

Distributor connectors, the call budget, and (as they land) parts, stock
history, assessment and part intelligence. Read `AGENTS.md` at the repository
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
| `providers/arrow.py` | Arrow Pricing & Availability (Item Service v4, `search/list`, GET with the key inside `req`): up to 100 numbers a call, every orderable line (`sourceParts[]`, per region with its own currency) a listing numbered `partNum\|sourcePartId`, prices never converted by Arrow, `vipPrice` ignored. From the documentation only; not yet run against the live service. |
| `providers/farnell.py` | Farnell, Newark and element14 Product Search REST: manufacturer-number search, one SKU per call, the connector names the store and the currency. Not yet run against the live service. |
| `providers/jlcpcb.py` | JLCPCB (assembly) as a CSV-fed connector: the same uploaded file as `csv_provider`, under the `jlcpcb` key, with every offer marked marketplace so no total counts it. Assembly-only; the file's optional `jlc_library` and `jlc_preferred` columns become facts (B, E, a star). Unmetered. |
| `providers/lcsc.py` | LCSC as a CSV-fed connector: the same uploaded file as `csv_provider`, under the `lcsc` key, so saved listings and BOM links keep their provider. Unmetered. |
| `providers/text_values.py` | Reads numbers sent as display text: "1,234 In Stock", "0,52 EUR", "42 Days". |
| `providers/unrecognised.py` | Logs once a status or wording an adapter does not know, so a new one that matters gets noticed. |
| `providers/fake.py` | Deterministic simulated market for tests, development and demos. Off unless `SUPPLY_ENABLE_SIMULATED_PROVIDER` is set. |
| `identity.py` | `match_key`: the lookup key for part numbers. Conservative on purpose: dots and slashes stay. |
| `parts.py` | Manufacturers, their spellings, parts and the other numbers a part is sold under (added by the packaging endings, or by a person in Review). `ensure_part` refuses nobody (a maker nobody has checked is provisional). Functions on a connection; none commit. |
| `makers.py` | `same_maker`: whether two spellings name one maker (same key, seeded spelling, starts with, whole words inside, initials, one lost letter). Never looks at a part number. |
| `settle.py` | Settling a provisional part's maker from the listings of its number, the questions a person answers (`needs_choice`, `choose`, `not_this_maker`, `use_numbers`), and learning spellings (`learn_aliases`, `undo_alias`). |
| `number_suffixes.py` | The endings makers put on a base number (`number_suffixes` table, editable): packaging ones are added to a part by discovery, grades wait for a person (`kind_of`). A comma and three digits is always packaging. |
| `part_insights.py` | What the history says about each tracked part (trend, days to zero, lead time, holders, repricing, 30-day stock), kept in `part_insights` by housekeeping (`renew`); `KINDS` are the findings the Parts `only` filter and the Insights lists use. |
| `dashboard.py` | The Dashboard page in one read: figures with 30 days of history (`figure_history`, one value a day), status mix, runway buckets, holders, alerts opened by day, cost per board. |
| `insights_page.py` | The Insights page: counts per finding, the runway scatter, distributor behaviour across all parts, the market overview. |
| `maker_seeds.py` | The built-in spellings of large makers as rows (`maker_seeds`) an administrator edits; `makers.refresh` reads them. |
| `maker_backfill.py` | Migration 56: sorts the listings that waited under the old rules again. |
| `packaging_auto.py` | Picks the packaging of a tracked part by what its projects buy for (prototypes: smallest order, production: a reel). Never changes a person's pick. |
| `discovery.py` | `DiscoveryService`: sorts a provider's answers into match states (a number the part is sold under and the same maker count; another maker's listing is `near`). Also `pin_listing`, `reject_listing`, `counted_listings`. |
| `review.py` | Reads the review queue: pending spellings and listings waiting for a person. |
| `backend/app/api/supply_review.py` | Review API. Everyone who reads supply data sees the queue; confirming a spelling and pinning or rejecting a listing need admin or qa. |
| `watches.py` | The watchlist: one watch per part, with a stock threshold and a pin to the fastest polling (pins are capped). |
| `tiers.py` | Pure rules: when a listing is next due (`next_poll_at`: once in each provider day for daily, a day-changing jitter for weekly and monthly), which comes first when the budget is short (`urgency`), and when to retry (`retry_at`). |
| `tracking.py` | What Prism follows and why: tracked projects, a person's tier choice (`watches.tier`, `rate`, `origin`) and `part_tiers`, derived from every source with its reasons (`recompute`). Tier 1 is read daily, tier 2 weekly or monthly, tier 3 only on request. |
| `budget.py` | Pure cost model: calls a day one part costs at one provider by tier, rate and listings followed (reads, notices, substances, searches). |
| `admission.py` | Where each followed part is read (`admissions`): admitted while the account's committed share has room, else waiting for room. `sync`, `preview` (runs a change and rolls it back) and `apply` ("track where room", refused when nothing fits). |
| `budget_view.py` | The read behind `GET /api/supply/budget`: shares, spending by kind and purpose, 14 days, what tracking costs, what costs most. |
| `packaging_picks.py` | One followed listing per part and distributor: the picks waiting, the listings side by side, pick and clear, and "same for similar". Only the picked listing is read and counted; `admission.sync` drops a pick whose listing is no longer counted. |
| `oneoff.py` | Check once: a request lists parts, `read_request_work` has a row for each part and distributor; the worker searches and reads them from the pool, then from spare budget, without tracking anything. |
| `packaging_picks.py` | One followed listing per part and distributor: the picks waiting, the listings side by side, pick and clear, "same for similar". Only the picked listing is read and counted; `admission.sync` drops a pick whose listing is no longer counted. |
| `oneoff.py` | Check once: `read_requests` list parts, `read_request_work` has a row per part and distributor; the worker searches and reads them from the pool, then spare budget, without tracking. |
| `project_supply.py` | The project Supply tab: the stored BOM looked up (parts with tier, waiting and note counts), the builds the project put on the plan, release snapshots judged against today for what changed since, and the line notes. Calls no distributor. |
| `alert_rules.py` | Per-part alert rules: muted kinds, the price rise that matters, a target price. `alerts.conditions_for` applies them; `assessment_marks` holds the status each part's assessment is judged against. |
| `attrition.py` | Spares by package class (small passives 2%, others none), used when a lookup asks for `attrition_percent: null`. |
| `cross_reference.py` | Alternatives graded direct, form-fit-function or functional from canonical parameters and the distributor category; `grade` is pure. No footprint or pin comparison. |
| `trade.py` | ECCN and tariff codes distributors state for a project's parts, disputes and gaps, and its CSV. |
| `accounts.py` | Connectors on the same credentials are one account (keyed hash): one ledger, one pacer, one job. |
| `pacing.py` | Jittered gaps between calls (0.75 to 1.5 times about half the published rate), shared per account (and between processes through `pace_state`), doubled for a day after a rate limit. |
| `schedule_settings.py` | Which spare work is on. Spare budget (`quota.free_allowance`) is the calls nothing else needs, at any hour. |
| `stock.py` | A part's stock across distributors, honouring each provider's pooling. Only exact and manual listings, no marketplace stock. |
| `discoverer.py` | Searches for listings of followed parts at the connectors they are admitted at: the first time from the pool (then spare), again every month at tier 1 and quarter at tier 2, found or not. A provider with `search_batch` is asked for a group of parts per call (`lookup_mpns`). Costs budget like any call. |
| `trouble.py` | What to do when a provider call fails (rate limit, bad credentials, other), shared by polling and discovery. |
| `component_watches.py` | A standing request to watch a catalog component's part; `sync` turns it into a part watch. |
| `bom_comments.py` | Notes on a project's BOM lines, by line key. |
| `demand.py` | What scheduled work (reads due before the reset, searches, budget-sharing notices) still needs of an account today, in calls the way each provider batches. The poll job stores it on the ledger; `quota.free_allowance` leaves it, what is kept for people and a margin alone, and the rest is free for spare work at any hour. |
| `notice_budget.py` | The change-notice allowance of a provider with a quota of its own (DigiKey, 50 a day): counted in `call_counts`, not in the product budget; all 50 may be spent, tracked parts read over the shortest interval that fits, untracked parts last. |
| `part_history.py` | A part's stock and price per distributor over a number of days, carried to each listing's last read, for the part sheet's lines and its larger dialog. |
| `headline_price.py` | The price a part shows in lists: every counted listing priced at the part's quantity and converted to the base currency, as orderable, backorder (with its lead time), last seen or list price, with the range and median over distributors and the price before conversion. A currency without a rate is left out and named. |
| `price_quantity.py` | The quantity prices are read at: the workspace default (a Supply setting, 100) and a part's own (`part_price_quantity`). A change drops the kept summaries and insights of the parts it touches; no distributor is asked. |
| `price_breaks.py` | A listing's price breaks as they changed (`price_breaks_history`), kept by the poller when they differ from the last, so the price history can be worked out at any quantity. |
| `part_search.py` | One search over library components and supply parts with a part found once (merged by maker and part number), by role. Behind `GET /api/search/parts` and the command palette. |
| `alternates.py` | Parts distributors suggest in place of a part (`part_alternates`): `listed` ones come with an offer read (LCSC, Mouser), `asked` ones from DigiKey's substitutions call. Each provider's set is replaced whole. Not compared with the part. |
| `substitutes.py` | Asking DigiKey for substitutes: on request (once an hour per part, interactive reserve) and automatically once for a tracked part that is ending (committed budget, again after 30 days). |
| `stock_events.py` | Stock-outs and restocks as the poller sees them, with the lead time quoted at the stock-out; a restock ends the open stock-out. |
| `scorecard.py` | Per distributor, on parts two or more list: stock-outs, restocked first, promises kept (quoted lead times and Mouser's dated arrivals), wait said against real, days in stock. Withheld under five events. Also each distributor's open promise on one part. |
| `ending_parts.py` | Library components whose part is ending, with the reasons, last buy date, stock and projects; and the decision kept for each (`component_restrictions`: not for new designs, retired). Proposes only. |
| `forecasting.py` | Forecasts as kept: stored when made, checked when their day comes, each model's state (learning, shown, paused) from its checks, the words for a chance, the track record. |
| `forecast_stock.py` | Runout, return from a stock-out and the chance of buying by week, from a simulation of 2,000 futures per distributor (drain from the slopes since the last restock, time out from Kaplan-Meier, restock sizes seen). Pure. |
| `forecast_price.py` | A part's price in 30 and 90 days from repricing events (Poisson rate shrunk to the pooled rate, sizes seen). Pure. |
| `forecast_market.py`, `forecast_lifecycle.py` | Lead times by family three months ahead and early warnings from the market series; the pooled monthly rate of changes into an ending lifecycle and the lag from a first sign to a last time buy. |
| `forecast_load.py`, `forecast_run.py`, `forecast_view.py`, `forecast_overview.py`, `forecast_backtest.py` | Reading the inputs, the daily make-and-check run (called from housekeeping and `part_insights`), the part forecast as the screens get it, the Dashboard and Insights roll-ups and the panel line, and the replay of past days. |
| `preferences.py` | A person's preferred distributor for a part (`part_preferences`); it orders and marks, and prices the BOM when the setting is on. |
| `trade_marks.py` | Whether a part is export controlled: what distributors state, and a person's mark that wins. |
| `risk_views.py` | The Dashboard and Insights risk views: lifecycle against availability, deadlines, distributor coverage, lifecycle and compliance mixes, lead times, price movers, trade. |
| `providers/packaging_hints.py` | Packaging read from words, and guessed from a SKU or order terms when a distributor says nothing (marked inferred). |
| `jobs.py` | The `supply_poll` job handler and `schedule_due_supply_jobs`, which prism-worker runs every minute. One job per connector with work. |
| `poller.py` | `Poller.poll_connector`: asks for due listings of admitted pairs (the picked listing when one is picked), tier 1 first, in batches within the call budget, and records offers; a sample only when something changed or the last is a day old. `spare=` reads waiting pairs or tier-2 parts early from spare budget. A provider with `groups_by_part` (DigiKey) is asked once per part, with the part's other listings read in the same call. |
| `offer_lines.py` | A part's offers as the detailed Parts list shows them: one line for each way of buying (DigiKey cut tape and Digi-Reel on the same terms are one; Mouser's reel inside its price table is its own). Keeps every number; the sheet's listings are untouched. |
| `parts_view.py` | Read models for the Parts screen: the list and one part's detail, with history carried forward day by day. |
| `part_status.py` | The interim status of a part (ok, warning, error, fatal, unknown), with the problems that make an unread part an error (no distributor carries it, every listing gone). The assessment pipeline replaces it. |
| `alerts.py` | Alerts on watched parts: one per part and kind, opened after two looks 30 minutes apart (a lost part opens at once), cleared when the condition clears, acknowledged or snoozed by people. In-app only; nothing is sent anywhere. Evaluated after every read and every watch change. |
| `insights.py` | Pure: what a part's daily stock history says. Observed net decrease (Theil-Sen slope since the last restock), days to zero and to the threshold, restocks and cadence, and a confidence. A change in how many listings stand behind the figure is cut, never read as a restock. Every answer lists its inputs. |
| `connector_check.py` | Tests a connector with one real call charged to the interactive reserve. Reports in fixed, safe words (never the provider's text), records the result on the connector, and never pauses it. |
| `capacity.py` | The older estimate of whether a connector's budget keeps up (calls a day against usable calls); the budget view supersedes it. |
| `bom_lookup.py` | Looks a BOM up in supply data without calling a distributor: each line resolves to a part (manufacturer and number, or number alone when unambiguous), reports stock, status, lead time and the cheapest offer that covers the need, and rolls up cost, shortages and "can build N". Also watches the parts on a BOM. |
| `backend/app/api/supply_bom.py` | BOM lookup (readers) and watch-all-lines (admin, designer). |
| `fill.py` | Fill from distributor: asks the connected distributors for a part number and, for one picked candidate, its description and datasheet. Spends the interactive reserve; writes nothing to the catalog. |
| `backend/app/api/supply_fill.py` | Fill search and details (admin, designer). |
| `backend/app/api/supply_component_watch.py` | Component watch API: readers see a component's watch; writers set or stop it. |
| `backend/app/services/supply/assessment/settings.py` | Check ids, default severities and thresholds for the assessment (the late read limit counts from the part's schedule). |
| `backend/app/services/supply/assessment/checks.py` | Findings from a part's facts: lifecycle, stock, lead time, RoHS, age. Pure rules. |
| `backend/app/services/supply/assessment/risk.py` | Five risk sub-scores, 1 good to 5 bad, each with its reasons. |
| `backend/app/services/supply/assessment/health.py` | Health 0 to 10, status, and the quantity-weighted BOM roll-up. |
| `backend/app/services/supply/assessment/waivers.py` | Proposing, approving and applying waivers; a waiver holds while its condition does. |
| `backend/app/services/supply/assessment/service.py` | Gathers a part's facts and runs the pipeline. Reads only; no distributor calls. |
| `backend/app/services/supply/assessment/settings_store.py` | Loads, saves and resets the workspace's assessment settings (thresholds, severities); absent means the defaults in code. Changes are audited. |
| `backend/app/api/supply_settings.py` | Assessment settings endpoints: readers see them, administrators change them. |
| `backend/app/api/supply_assessment.py` | Assessment and waiver endpoints. Readers see assessments; admin, designer and qa propose waivers; admin and qa decide. |
| `backend/app/api/supply_access.py` | The role check shared by endpoints that writers and approvers both use. |
| `backend/app/services/supply/refresh.py` | Read one part now: its counted listings are polled at once from the interactive reserve, once every 15 minutes per person and part. |
| `backend/app/services/supply/panel_payload.py` | What the KiCad panel gets (remote provider 0.4.0, additive): a one-line summary on search, list and detail; detail adds distributor offers, insight, health, two risk lines and links. Reads only; not sent to roles that cannot read supply data. |
| `backend/app/services/supply/catalog_read.py` | Reads catalog components for supply through the catalog service: all components, a manufacturer-and-number to component id map, and the manufacturer and number behind a `Prism ID`. |
| `backend/app/services/supply/release_check.py` | The supply check on a release's BOM (health, parts that need a look; informs, never blocks) and the snapshot frozen at publish. The snapshot is evidence beside the release, never part of its digest. |
| `backend/app/services/supply/release_bom.py`, `release_source.py` | Read the BOM a release build exported (the dossier's `bom` member, digest-checked) as BOM lines. |
| `backend/app/services/supply/release_snapshot.py` | Queues and runs the snapshot job at publish: idempotent per build, retried, with a recorded status (`release_snapshot_jobs`). |
| `backend/app/services/supply/publish_hook.py` | Called by Release Studio after a publish; queues the snapshot job. |
| `backend/app/api/supply_release.py` | Release check and release snapshot endpoints (readers; projects follow the caller's role). |
| `bom_fields.py` | Which symbol fields are the manufacturer and the manufacturer part number (best name first; never the distributor's number), what counts as fitted, and the `Prism ID` field. The frontend's `frontend/src/features/supply/bom-supply.ts` keeps the same lists; a test compares them. |
| `assessment/line_checks.py` | Findings about how a BOM line names its part: `manufacturer_missing` (found by number alone) and `not_in_library` (no catalog component has the pair). |
| `health.py` | Per connector: calls against budget, last error, how many reads are late and the oldest read. Administrators only, at `/api/supply/health`. |
| `fx.py` | Exchange rates: the ECB daily file (fetched by the poll job, at most once in 20 hours) or rates an administrator enters; conversion goes through the euro and an unknown rate means no conversion. Used to compare offers and total a BOM in the base currency (a Supply setting, default EUR). |
| `spreadsheet.py` | The first sheet of an Excel file (.xlsx, .xlsm) as rows of text, with size and unpacked-size limits. Used for uploaded BOMs (`POST /api/supply/bom/sheet`, stores nothing) and the ECHA candidate list. |
| `compliance.py` | REACH: the ECHA Candidate List (loaded by an administrator from a CSV or Excel export), substances a supplier declared for a part as CAS numbers (checked digit by digit), and a part's REACH standing (affected, clear, unknown; silence is never clear). A distributor's REACH flag is read with the offer. Substances a distributor names (Mouser's `REACH-SVHC`) become declarations marked `distributor:<provider>`, kept apart from people's. |
| `outlook.py` | A rule-based lifecycle outlook: signals (manufacturer lifecycle, distributors dropping it, datasheet phrases, long zero stock, price rise), each with its source, and one of five bands. No signs of an end is never read as a promise of years. |
| `market.py` | Market indices over the watched and BOM parts, by manufacturer and by distributor category (out of stock, lifecycle risk, dropped, median lead time, price index): groups of at least three parts, one snapshot a day from the supply poll job, compared with a month earlier. Describes this workspace's parts, not the market. |
| `pcn.py` | Product change notices entered by people or read from DigiKey (`source`, `external_key`: one row per notice whatever the parts), with their dates and the parts they cover. Open ones feed the outlook and raise a `pcn` alert on watched parts, an error within 90 days of the last time buy. A closed notice is not reopened. Prism does not read notice PDFs. |
| `facts.py` | Compliance and trade facts distributors state (RoHS and REACH wording, MSL, ECCN, tariff codes, last date to buy, suggested replacement), kept per part and provider when offers are read (no extra call), with the RoHS and REACH wording read into classes. Sources are shown apart, and disagreement is flagged. |
| `details.py` | The weekly per-listing reads that cost a call each: DigiKey change notices (needs a sign-in) and Mouser's substance list (API version 2, with the maker's Mouser spelling). A few per poll job, within budget; a failure is per listing and never pauses the connector. |
| `oauth.py` | An administrator's sign-in at DigiKey (authorization-code flow) for change notices: one-time state, tokens sealed apart from the client credentials, refresh under a row lock (DigiKey rotates the refresh token), a refused refresh marks the grant. |
| `params.py` | Reads distributors' attribute text for resistors, capacitors and inductors into one vocabulary and SI values ("10 kOhms", "100nF", "1/10W"); no units library on purpose. The raw text is always kept and nothing is guessed. |
| `compliance_draft.py` | A draft RoHS and REACH declaration for a project's stored BOM: each distinct part with what distributors and declarations say and the gaps listed, as JSON or a spreadsheet-safe CSV. A working document, not a declaration. |
| `prices.py` | The cheapest counted unit price per day from the recorded samples, in one currency, and whether a rise over the last 30 days counts as a price move (readings a week apart, the latest recent). The part sheet shows the 90 day series and the move. |
| `usage.py` | Where parts are used (and `project_rows`, the stored lines behind a project's supply card): one row per distinct part on each project's BOM, read from semantic indexes that already exist (it builds none). A symbol with a `Prism ID` the catalog knows takes that component's manufacturer and number. Each project carries the roles its folder lets see it, and every read filters by the caller's role. |
| `overview.py` | The Supply overview: counts, open alerts, recent changes, data age. |
| `backend/app/api/supply_alerts.py` | Overview and alerts API. Readers see both; admin and designer acknowledge and snooze. |
| `pricing.py` | Unit price at a reference quantity (100), honouring minimum order and multiples. Prices are only compared at one quantity. |
| `retention.py` | Rolls raw samples older than 60 days (or the connector's `retention_days`) into `samples_daily`, in slices of 30 days, and `drop_expired` deletes all history past the connector's `keep_days`. Run at the end of each poll job. |
| `backend/app/api/supply_parts.py` | Parts and watches API, and the read-only part lookup the component Sourcing tab uses. Readers see parts, stock and history; admin and designer watch parts and change watch rules. |
| `audit.py` | `write_audit` and `actor_text`. The only way supply writes the audit trail. |
| `csv_format.py` | The offers file: columns, parsing, validation. Pure. A file is all or nothing. |
| `csv_offers.py`, `csv_import_service.py` | Storage for uploaded offers and the import and clear service. |
| `providers/csv_provider.py` | Offers from an uploaded file, under the generic `csv` key and, with their own key and label, LCSC and JLCPCB (assembly). Unmetered. Reads its own table, never writes. |
| `egress.py` | Outbound URL validation. Required before any fetch of a URL that is not hard-coded. |
| `http_client.py` | `SafeHttpClient`: the only way a provider makes a request. Validates every hop, connects to the checked address, maps statuses to `ProviderError` subclasses, keeps query strings out of messages. |
| `quota.py` | Pure budget policy: the provider's day and reset, background allowance (spread over the day after a start delay), interactive allowance, spare allowance, capacity estimate. |
| `project_bom.py` | Tracked projects' BOMs kept current: read again every 15 minutes, the index of a new revision queued when missing (once per 6 hours if it fails), and a `project_bom_changed` event with what the revision added and removed. |
| `room.py` | How many more parts tracking has room for: a typical part's cost per distributor from what it carries and its listings, checked against a week of real tracking spend, divided into each account's free committed calls; the headline is the distributor that fills first (assembly-only left out). |
| `limits.py` | What a provider reports about its limits (`x-ratelimit-*`), `limit_marks`, the reset time suggested from readings and long refusals, and the sync of the provider's count into the ledger once an administrator has applied it. |
| `ledger.py` | Atomic daily spending per account (`try_spend` locks the day's row) with `call_counts` by connector, kind and purpose in the same transaction. |
| `credentials.py` | The one adapter over the credential keyring. |
| `connectors.py` | Connector setup, credentials, pause, state. |
| `backend/app/api/supply_connectors.py` | HTTP API for connectors. Readers are admin, designer and qa; only admin changes anything. Strips request bodies from 422 errors. |
| `schema_migrations.py`, `migration_steps/`, `store.py` | Supply tables live in the catalog's schema, each prefixed `supply_`. `schema_migrations.py` lists the steps (bodies in three modules under `migration_steps/`); the catalog ledger runs them all as its `supply_tables` step. `store.py` hands out connections on the catalog schema (or a test's disposable schema). |

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
- **Supply tables are catalog tables.** Every table, index, trigger and function
  is prefixed `supply_` (`backend/tests/test_supply_schema_names.py` checks). A change is
  a new step in `backend/app/services/catalog_schema_migrations.py`, never an edit to the steps the
  `supply_tables` step runs.
- **Role-aware lookups only** when supply data is joined to projects.

## Frontend

`frontend/src/features/supply/` holds the UI, with types in
`frontend/src/types/supply.ts`. The Supply section (`frontend/src/features/supply/supply-workspace.tsx`, opened
from the sidebar through `frontend/src/components/workspace.tsx`) owns five tabs (Dashboard, Parts, Review, Insights, Connectors); `frontend/src/features/supply/supply-views.ts` maps old addresses to them and a new tab goes in its `VIEWS` list. The project Supply tab is `frontend/src/features/supply/project-supply-tab.tsx`, mounted by the project page for roles that read supply. Icons come from `frontend/src/features/supply/supply-icons.tsx`; use them in lists, tables, bars and cards. The URL holds the scope
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

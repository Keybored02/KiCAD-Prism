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
| `providers/fake.py` | Deterministic simulated market for tests, development and demos. Off unless `SUPPLY_ENABLE_SIMULATED_PROVIDER` is set. |
| `identity.py` | `match_key`: the lookup key for part numbers. Conservative on purpose: dots and slashes stay. |
| `parts.py` | Manufacturers, spellings (`pending` until a person maps them) and parts. Functions on a connection; none commit. |
| `discovery.py` | `DiscoveryService`: sorts a provider's answers into match states. Also `pin_listing`, `reject_listing`, `counted_listings`. |
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
- **A manufacturer argument is a hint, never a filter.** Prism decides who is the
  same manufacturer, using its alias table.
- **The manufacturer part is the spine.** A feature that needs part data reads
  it from there. No feature keeps its own copy.
- **Network providers do not touch the database and do not log credentials.**
  They return models or raise `ProviderError`. Callers decide what to store.
  The CSV provider is the one that reads a table, and only its own.
- **Credentials go through `credentials.py` only.** Reads return which
  credentials are set, never their values. There is no plaintext fallback.
- **Every outbound request goes through `http_client.py`**, which validates
  with `egress.py` on each redirect and connects to the address that was
  checked. Do not call `requests` directly from a provider.
- **Quota is a budget, not an error.** Running short delays polling and shows
  data age. Spend only through `ledger.try_spend`.
- **Audit identity comes from the session**, passed in as `actor`. Never take
  it from a request body.
- **Migrations are additive and numbered in this package's own ledger.** Do not
  add supply tables to the workspace or catalog ledgers.
- **Role-aware lookups only** when supply data is joined to projects.

## Frontend

`frontend/src/features/supply/` holds the UI, with types in
`frontend/src/types/supply.ts`. The Connectors tab mounts from
`frontend/src/components/workspace/library-manager-workspace.tsx`. Each form
mounts only while its dialog is open, so it resets without effects; keep form
rules in `frontend/src/features/supply/connector-form-model.ts`, not in components.

## Tests

`backend/tests/test_supply_foundation.py` and
`backend/tests/test_supply_http_client.py` need no database or network.
`backend/tests/test_supply_connectors_postgres.py` and
`backend/tests/test_supply_connectors_api.py` need `PRISM_DATABASE_URL` and use a
disposable schema. Provider tests use recorded fixtures, never live
calls. Frontend tests are `*.test.ts(x)` beside the code.

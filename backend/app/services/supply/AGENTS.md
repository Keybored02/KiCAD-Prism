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
| `egress.py` | Outbound URL validation. Required before any fetch of a URL that is not hard-coded. |
| `quota.py` | Pure budget policy: background allowance, interactive reserve, capacity estimate. |
| `ledger.py` | Atomic daily spending (`try_spend` locks the day's row). |
| `credentials.py` | The one adapter over the credential keyring. |
| `connectors.py` | Connector setup, credentials, pause, state. |
| `schema_migrations.py`, `store.py` | The `supply` schema, its own migration ledger, and connections. |

## Rules

- **Supply data never enters component revisions.** Revisions are hashed;
  prices change daily.
- **The manufacturer part is the spine.** A feature that needs part data reads
  it from there. No feature keeps its own copy.
- **Providers do not touch the database and do not log credentials.** They
  return models or raise `ProviderError`. Callers decide what to store.
- **Credentials go through `credentials.py` only.** Reads return which
  credentials are set, never their values. There is no plaintext fallback.
- **Every outbound request is validated by `egress.py`**, including each
  redirect, and connects to the address that was checked.
- **Quota is a budget, not an error.** Running short delays polling and shows
  data age. Spend only through `ledger.try_spend`.
- **Audit identity comes from the session**, passed in as `actor`. Never take
  it from a request body.
- **Migrations are additive and numbered in this package's own ledger.** Do not
  add supply tables to the workspace or catalog ledgers.
- **Role-aware lookups only** when supply data is joined to projects.

## Tests

`backend/tests/test_supply_foundation.py` needs no database or network.
`backend/tests/test_supply_connectors_postgres.py` needs `PRISM_DATABASE_URL`
and uses a disposable schema. Provider tests use recorded fixtures, never live
calls.

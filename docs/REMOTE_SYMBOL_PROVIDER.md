# KiCAD Prism Remote Symbol Provider

Prism includes a KiCad remote-symbol provider backed by the Postgres component catalog.

What is included:
- a Postgres-backed component catalog managed through the Library Manager
- canonical KiCad-style asset storage under `.kicad-prism-components/`
- provider discovery at `/.well-known/kicad-remote-provider`
- a same-origin provider webview page at `/remote-provider/panel`
- KiCad-compatible OAuth endpoints for `REMOTE_LOGIN`
- manifest-based placement with signed asset URLs
- inline payload fallback for provider/UI validation
- a KiCad `datasource` ZIP builder at `scripts/build_datasource_package.py`

## Catalog storage layout

Prism now stores the active catalog state in KiCad-style directories:
- `symbols/<library>/*.kicad_sym`
- `footprints/<library>.pretty/*.kicad_mod`
- `3dmodels/<library>/*.step`
- `spice/<library>/*`
- `previews/symbols/*.svg`
- `previews/footprints/*.svg`
- `revisions/<revision-id>/...`

The Postgres catalog indexes those canonical files and tracks active revisions, preview status, and
remote-provider metadata.

## Running locally

1. Start the Prism backend.
2. Open `http://127.0.0.1:8000/.well-known/kicad-remote-provider` and confirm metadata loads.
3. Open `http://127.0.0.1:8000/remote-provider/panel` and confirm the seeded catalog renders.

Preview SVGs are generated on import using KiCad tooling when `kicad-cli` is available in the
backend runtime. If preview generation fails, the import still succeeds and the provider UI shows
placeholder artwork until previews can be regenerated.

If you keep KiCad's default Remote Symbol settings, the provider's rewritten payloads will match:
- library prefix: `remote`
- destination directory: `${KIPRJMOD}/RemoteLibrary`

If you change either of those in KiCad, set matching backend env vars:
- `REMOTE_PROVIDER_LIBRARY_PREFIX`
- `REMOTE_PROVIDER_DESTINATION_DIR`

In Docker Compose `.env` files, write the KiCad project variable as
`REMOTE_PROVIDER_DESTINATION_DIR=$${KIPRJMOD}/RemoteLibrary`; otherwise Compose may interpolate
`${KIPRJMOD}` to an empty string before the backend sees it.

## Enabling authentication

Prism will advertise `auth.type = oauth2` only when all of the following are true:
- `AUTH_ENABLED=true`
- `DEV_MODE=false`
- generic OIDC settings are configured: `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`
- `SESSION_SECRET` is set

Local test setup:
- set the OIDC redirect URI to `http://127.0.0.1:8000/oauth/oidc/callback`
- if using Google Sign-In, also register the normal Prism web login redirect URI:
  `http://127.0.0.1:8080/auth/callback` for Docker frontend testing
- run the backend on `http://127.0.0.1:8000`
- open `http://127.0.0.1:8000/.well-known/kicad-remote-provider` and confirm:
  - `"auth": { "type": "oauth2", ... }`
  - `"session_bootstrap_url"` is present

Prism exposes both metadata endpoints for the provider OAuth server:
- `http://127.0.0.1:8000/oauth/.well-known/oauth-authorization-server`
- `http://127.0.0.1:8000/oauth/.well-known/openid-configuration`

KiCad should use the authorization-server metadata URL from the provider metadata document.
The provider OAuth server accepts only the KiCad remote-symbol client ID, loopback redirect URIs,
authorization-code + PKCE with S256, and the `remote_symbols.read` scope. This keeps KiCad panel
tokens limited to remote-symbol read/search/placement APIs and prevents them from being reused for
Prism admin or Library Manager mutation APIs.

`SESSION_SECRET` also signs remote-provider access, refresh, bootstrap, and catalog asset URL
tokens. Missing secrets fail closed instead of falling back to a development secret.

## Building the datasource ZIP

```bash
cd backend/..
python3 scripts/build_datasource_package.py --base-url http://127.0.0.1:8000
```

This writes `dist/kicad-prism-remote-symbols.zip`.

## Installing in KiCad

1. Open PCM and install the generated ZIP from file.
2. Open eeschema Remote Symbol Settings.
3. Add `http://127.0.0.1:8000` as the provider metadata URL if KiCad does not auto-register it.
4. Open the Remote Symbols panel and test placement with the seeded parts.

## Manual authentication test

1. Set the backend env for real auth and restart Prism.
2. In KiCad, add `http://127.0.0.1:8000` as the provider metadata URL.
3. Open the Remote Symbols panel.
4. Confirm the provider page shows a sign-in prompt instead of the catalog.
5. Click the sign-in button in the provider page.
6. Complete the configured OIDC/SSO flow in the system browser.
7. Return to KiCad and confirm the provider reloads with the seeded catalog visible.
8. Place a seeded part through the normal `Place` button and confirm the project `RemoteLibrary` updates as before.

## Current Phase 1 limits

- KiCad remote-provider OAuth is intended only for KiCad/panel access, not general Prism admin APIs.
- Machine-to-machine PLM access should use `/api/oauth/token` with service-client credentials or an external OAuth2 JWT accepted through the configured issuer.

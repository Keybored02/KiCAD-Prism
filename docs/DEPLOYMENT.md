# Deployment Guide

This document covers the current KiCAD Prism deployment model for Docker hosting and local development.

## Runtime Overview

KiCAD Prism runs as three services:

- `postgres`: Postgres catalog database on port `5432`
- `backend`: FastAPI API server on port `8000`
- `frontend`: production Vite bundle served by Nginx on port `8080`

In Docker, the frontend proxies `/api/*` requests to the backend over the Compose network. The backend stores component metadata, release workflow state, and reusable asset indexes in Postgres. KiCad symbol, footprint, 3D model, SPICE, preview, and revision files are stored on disk under the mounted project data directory.

Default local endpoints:
- UI: [http://127.0.0.1:8080](http://127.0.0.1:8080)
- API: [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Docker Hosting

### Prerequisites

- Docker Engine or Docker Desktop
- Docker Compose support
- enough disk space for imported repositories and generated outputs

### 1. Clone the repository

```bash
git clone https://github.com/krishna-swaroop/KiCAD-Prism.git
cd KiCAD-Prism
```

### 2. Create the root `.env`

Docker Compose reads the repository root `.env` automatically.

```bash
cp .env.example .env
```

Baseline authenticated configuration:

```env
WORKSPACE_NAME=KiCAD Prism
AUTH_ENABLED=true
OIDC_ISSUER_URL=https://sso.example.com/realms/engineering
OIDC_CLIENT_ID=kicad-prism
OIDC_CLIENT_SECRET=
SESSION_SECRET=
SESSION_TTL_HOURS=12
SESSION_COOKIE_SECURE=false
ALLOWED_USERS_STR=
ALLOWED_DOMAINS_STR=
BOOTSTRAP_ADMIN_USERS_STR=admin@example.com
DEFAULT_VIEWER_DOMAINS_STR=pixxel.co.in,spacepixxel.co.in
GITHUB_TOKEN=
DEV_MODE=false

POSTGRES_DB=kicad_prism
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
CATALOG_DATABASE_URL=
```

Generate a session secret with:

```bash
python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
```

Important:
- `SESSION_SECRET` is required whenever auth is effectively enabled.
- `POSTGRES_PASSWORD` is required for Docker Compose. Keep it only in your private `.env`; do not commit it.
- `CATALOG_DATABASE_URL` can stay empty for the bundled Compose stack. The backend will build the internal database URL from `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`.
- Set `CATALOG_DATABASE_URL` only when pointing Prism at an externally managed Postgres instance.
- `SESSION_COOKIE_SECURE=true` should be used only behind HTTPS.
- `DEV_MODE` should stay `false` in Docker hosting.

### 3. Start the stack

```bash
docker compose up --build -d
```

Open the UI at [http://127.0.0.1:8080](http://127.0.0.1:8080).

### 4. Stop the stack

```bash
docker compose down
```

## Docker Volumes and Persistence

Current Compose mounts:

- `./data/postgres` -> `/var/lib/postgresql/data`
- `./data/projects` -> `/app/projects`
- `./data/ssh` -> `/root/.ssh`

Persisted data includes:
- Postgres component catalog data
- imported repositories
- canonical KiCad component library files under `data/projects/.kicad-prism-components`
- generated symbol and footprint previews
- `.project_registry.json`
- `.rbac_roles.json`
- `.folders.json`
- exported comments JSON inside repos when generated
- SSH keys and `known_hosts`

The backend creates `data/projects/.kicad-prism-components` automatically during startup after the catalog database configuration is valid. The startup initializer also creates the canonical subdirectories:

- `symbols/`
- `footprints/`
- `3dmodels/`
- `spice/`
- `previews/symbols/`
- `previews/footprints/`
- `revisions/`

You do not need to create these directories manually for a normal deployment.

## Authentication Modes

### Guest Mode

```env
AUTH_ENABLED=false
OIDC_CLIENT_ID=
SESSION_SECRET=
DEV_MODE=false
```

Behavior:
- login wall is disabled
- backend serves a guest admin session
- all visitors have full admin/designer/viewer access while auth is disabled

### OIDC Login + Session Auth

```env
AUTH_ENABLED=true
OIDC_ISSUER_URL=https://sso.example.com/realms/engineering
OIDC_CLIENT_ID=kicad-prism
OIDC_CLIENT_SECRET=
OIDC_SCOPES=openid email profile
OIDC_EMAIL_CLAIM=email
OIDC_NAME_CLAIM=name
OIDC_PICTURE_CLAIM=picture
OIDC_PROVIDER_NAME=SSO
OIDC_TOKEN_AUTH_METHOD=client_secret_post
SESSION_SECRET=
CORS_ORIGINS_STR=https://your-domain.example
DEFAULT_VIEWER_DOMAINS_STR=pixxel.co.in,spacepixxel.co.in
DEV_MODE=false
```

Behavior:
- frontend shows the configured SSO sign-in screen
- backend exchanges the OIDC authorization code, verifies signed `id_token`s with JWKS, validates nonce, and reads user profile claims
- backend issues an `HttpOnly` signed session cookie
- RBAC role resolution uses stored assignments plus bootstrap admins
- users from `DEFAULT_VIEWER_DOMAINS_STR` get implicit `viewer` access when no explicit role is stored
- on first successful login, those implicit viewers are written into `.rbac_roles.json` so admins can promote them later

Google Sign-In uses this same generic OIDC path with
`OIDC_ISSUER_URL=https://accounts.google.com`. For Docker frontend testing, Google must allow the
exact redirect URI `http://127.0.0.1:8080/auth/callback`. The KiCad remote-provider callback is a
separate backend callback and does not replace the frontend login callback.

### Local Dev Bypass

```env
AUTH_ENABLED=true
OIDC_CLIENT_ID=
SESSION_SECRET=
DEV_MODE=true
```

Behavior:
- auth is effectively disabled because the backend only enables auth when `AUTH_ENABLED=true`, OIDC client settings are set, and `DEV_MODE=false`
- this is convenient for local backend/frontend development

## OIDC/OAuth Setup

Create an OIDC client in your identity provider and add the frontend origins and redirect URIs you actually use.

Typical origins:
- local frontend dev: `http://127.0.0.1:5173`
- local Docker frontend: `http://127.0.0.1:8080`
- production: `https://your-domain.example`

Typical redirect URIs:
- local frontend dev: `http://127.0.0.1:5173/auth/callback`
- local Docker frontend: `http://127.0.0.1:8080/auth/callback`
- production: `https://your-domain.example/auth/callback`
- KiCad remote-symbol login: `https://your-domain.example/oauth/oidc/callback`

Use the issuer URL in `OIDC_ISSUER_URL`, the client ID in `OIDC_CLIENT_ID`, and the client secret in `OIDC_CLIENT_SECRET`.
Most providers work with `OIDC_SCOPES=openid email profile` and claim names `email`, `name`, and
`picture`. If your provider requires HTTP Basic authentication at the token endpoint, set
`OIDC_TOKEN_AUTH_METHOD=client_secret_basic`; otherwise keep the default `client_secret_post`.

Google Sign-In through the generic OIDC path:

```env
OIDC_ISSUER_URL=https://accounts.google.com
OIDC_SCOPES=openid email profile
OIDC_EMAIL_CLAIM=email
OIDC_NAME_CLAIM=name
OIDC_PICTURE_CLAIM=picture
OIDC_PROVIDER_NAME=Google
OIDC_TOKEN_AUTH_METHOD=client_secret_post
```

Register the frontend callback URLs above in Google Cloud Console when using Google. For local
Docker, the required URI is exactly `http://127.0.0.1:8080/auth/callback`; `localhost` and
`127.0.0.1` are not interchangeable for Google redirect matching.

Set `CORS_ORIGINS_STR` to the exact browser origins that should be allowed to send credentialed
requests to the API. For local Docker the default includes `http://127.0.0.1:8080`; for production
use your HTTPS origin and do not use `*`.

If your production deployment is HTTPS, also set:

```env
SESSION_COOKIE_SECURE=true
```

## Private Repository Access

KiCAD Prism supports two normal approaches.

### SSH

Recommended for long-lived hosted deployments.

- SSH material persists under `./data/ssh`
- backend startup ensures `~/.ssh` exists and scans common Git hosts into `known_hosts`
- add the generated or mounted public key to your Git host account

By default, startup does not scan Git host keys because network DNS during startup can slow down local Docker boot. If you want the backend to run `ssh-keyscan` for common Git hosts at startup, set:

```env
GIT_SCAN_KNOWN_HOSTS_ON_STARTUP=true
```

### GitHub Personal Access Token

If you use HTTPS cloning for private GitHub repositories, set:

```env
GITHUB_TOKEN=
```

The backend configures Git URL rewriting at startup so GitHub HTTPS operations can use the token.

## Local Development Hosting

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Notes:
- backend settings also support a backend-local `.env`
- if nothing is configured, local dev defaults generally keep auth off because `DEV_MODE=true`
- local backend development still requires Postgres for the component catalog unless tests inject a service-specific database URL

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend dev URL:
- [http://127.0.0.1:5173](http://127.0.0.1:5173)

### Remote Symbols Panel Bundle

The Remote Symbols panel source lives in the dedicated frontend app under `frontend/src/panel`. The backend still serves the panel at `/remote-provider/panel`, but `backend/app/static/remote_provider` is generated output and is intentionally not committed.

For Docker deployments, the backend Dockerfile builds the panel with `npm run build:panel` and copies `frontend/dist/remote_provider` into the backend image at `/app/app/static/remote_provider`.

For local development of the panel UI:

```bash
cd frontend
npm install
npm run dev:panel
```

For local backend testing without Docker, build the panel and copy the output into the backend static path before starting Uvicorn:

```bash
cd frontend
npm run build:panel
mkdir -p ../backend/app/static/remote_provider
cp -R dist/remote_provider/. ../backend/app/static/remote_provider/
```

Then start or rebuild the stack as usual:

```bash
docker compose up --build -d
```

## Component Library Deployment

The component catalog has two storage layers:

- Postgres stores component metadata, revisions, reusable asset rows, release workflow state, and preview status.
- Disk storage under `data/projects/.kicad-prism-components` stores canonical KiCad files.

Canonical disk layout:

- `symbols/`
- `footprints/`
- `3dmodels/`
- `spice/`
- `previews/`
- `revisions/`

Back up both Postgres and `data/projects/.kicad-prism-components`. A database backup without the canonical asset directory is not enough to restore placeable components.

Only components in the `Released` workflow stage and with both symbol and footprint assets attached are visible/placeable through the KiCad Remote Symbols panel.

For migrating existing KiCad libraries, see [Import Existing KiCad Libraries](IMPORT_EXISTING_KICAD_LIBRARIES.md).

## Production Tuning

Local Docker defaults favor fast startup:

```env
UVICORN_WORKERS=1
CATALOG_POOL_MIN_SIZE=1
CATALOG_POOL_MAX_SIZE=5
```

For a production host, increase workers and pool limits based on CPU count and Postgres capacity:

```env
UVICORN_WORKERS=4
CATALOG_POOL_MIN_SIZE=1
CATALOG_POOL_MAX_SIZE=10
POSTGRES_MAX_CONNECTIONS=100
```

Keep `UVICORN_WORKERS * CATALOG_POOL_MAX_SIZE` comfortably below `POSTGRES_MAX_CONNECTIONS` after accounting for admin sessions, import jobs, and future background workers.

## Operational Notes

### Rebuild after env or frontend changes

```bash
docker compose up --build -d
```

### Inspect logs

```bash
docker compose logs --tail=100 frontend
docker compose logs --tail=100 backend
```

### Session behavior

- changing `SESSION_SECRET` invalidates all existing sessions
- secure cookies require HTTPS and will not work correctly on plain HTTP if `SESSION_COOKIE_SECURE=true`

## Troubleshooting

### Blank page with frontend bundle errors

If the browser shows a blank page, open DevTools and check the first JavaScript error.

A previously observed production issue came from unsafe manual chunk splitting. If a bundle regression returns, rebuild and verify that:
- `/assets/index-*.js` loads successfully
- `/api/auth/config` returns `200`
- the first console error is captured before reloading again

### `SESSION_SECRET is not configured`

Cause:
- auth is enabled but `SESSION_SECRET` is empty

Fix:
- set `SESSION_SECRET` in the root `.env`
- rebuild/restart the stack

### SSO sign-in not appearing

Check:
- `AUTH_ENABLED=true`
- OIDC client settings are set
- `DEV_MODE=false`
- browser origin is listed in the identity provider OAuth/OIDC configuration

### `/api/auth/config` returns `502 Bad Gateway`

Cause:
- the frontend is running, but the backend is unavailable or restarting
- a common local cause is changing `POSTGRES_PASSWORD` after `./data/postgres` was already initialized

Fix:
- inspect `docker compose logs --tail=100 backend`
- if the log says `password authentication failed for user "postgres"`, either restore the original `POSTGRES_PASSWORD` value or reset the local Postgres data directory
- for a disposable local test database, stop the stack and move `data/postgres` aside before restarting:

```bash
docker compose down
mv data/postgres "data/postgres.bak.$(date +%Y%m%d%H%M%S)"
docker compose up --build -d
```

### Login works but API requests fail after deploy

Check:
- `SESSION_COOKIE_SECURE` matches your transport mode
- HTTPS termination is configured correctly if using secure cookies
- browser is not blocking cookies for the deployed origin

### Imported repositories disappear after restart

Check that `./data/projects` is mounted and writable on the host.

## Related Docs

- [../README.md](../README.md)
- [./KICAD-PRJ-REPO-STRUCTURE.md](./KICAD-PRJ-REPO-STRUCTURE.md)
- [./PATH-MAPPING.md](./PATH-MAPPING.md)

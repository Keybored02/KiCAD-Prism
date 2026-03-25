# Deployment Guide

KiCAD Prism can be deployed as a two-container Docker application with optional authentication, RBAC, persistent project storage, and a custom DNS-backed URL behind a reverse proxy.

This guide covers:

- initial server setup
- Docker deployment
- guest mode, Google login, and local username/password login
- RBAC and first-admin setup
- private repository access
- custom URLs, DNS, and reverse proxy configuration
- operational checks and troubleshooting

## Overview

KiCAD Prism runs as two services:

- `backend`: FastAPI API server on port `8000`
- `frontend`: production Vite bundle served by Nginx on port `8080`

In Docker:

- the frontend serves the UI
- the frontend proxies `/api/*` traffic to the backend over the Docker network

Default host endpoints:

- UI: [http://127.0.0.1:8080](http://127.0.0.1:8080)
- API: [http://127.0.0.1:8000](http://127.0.0.1:8000)

Persistent host data:

- `./data/projects`
- `./data/ssh`

Persisted application state includes:

- imported repositories
- `.project_registry.json`
- `.rbac_roles.json`
- `.folders.json`
- `.local_accounts.json` when local auth is used
- SSH keys and `known_hosts`

## Prerequisites

You need:

- Docker Engine or Docker Desktop
- Docker Compose support
- enough disk space for imported repositories and generated outputs
- optional DNS control if you want a custom hostname
- optional reverse proxy if you want access on port `80` or `443` instead of `:8080`

## Initial Setup

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

Generate a session secret:

```bash
python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
```

### 3. Choose a deployment mode

KiCAD Prism supports three modes:

1. `AUTH_ENABLED=false`
   No login wall. Everyone gets guest access.
2. `AUTH_ENABLED=true` and `AUTH_PROVIDER=google`
   Google-based login with RBAC.
3. `AUTH_ENABLED=true` and `AUTH_PROVIDER=local`
   Local username/password login with RBAC.

### 4. Start the stack

```bash
docker compose up --build -d
```

Open the UI at [http://127.0.0.1:8080](http://127.0.0.1:8080).

### 5. Stop the stack

```bash
docker compose down
```

## Core Environment Variables

The main deployment settings look like this:

```env
WORKSPACE_NAME=KiCAD Prism

AUTH_ENABLED=true
AUTH_PROVIDER=google

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

LOCAL_BOOTSTRAP_ADMIN_USERNAME=admin
LOCAL_BOOTSTRAP_ADMIN_PASSWORD=change-me-now
LOCAL_BOOTSTRAP_ADMIN_NAME=Workspace Admin

ALLOWED_USERS_STR=
ALLOWED_DOMAINS_STR=
BOOTSTRAP_ADMIN_USERS_STR=admin@example.com
DEFAULT_VIEWER_DOMAINS_STR=example.com,engineering.example.com

ROLE_STORE_PATH=
LOCAL_ACCOUNT_STORE_PATH=

SESSION_SECRET=replace-with-a-long-random-secret
SESSION_TTL_HOURS=12
SESSION_COOKIE_SECURE=false

GITHUB_TOKEN=
DEV_MODE=false
```

Important:

- `SESSION_SECRET` is required whenever auth is enabled.
- `DEV_MODE` should remain `false` for any normal hosted deployment.
- `SESSION_COOKIE_SECURE=true` should only be used when Prism is served over HTTPS.
- `AUTH_PROVIDER` matters only when `AUTH_ENABLED=true`.

## Authentication Modes

### Guest Mode

Use this when you want the app open without login.

```env
AUTH_ENABLED=false
SESSION_SECRET=
DEV_MODE=false
```

Behavior:

- the login wall is disabled
- backend serves a guest admin session
- every visitor gets full `admin`, `designer`, and `viewer` access

This mode is intentionally unsafe for public exposure. Use it only in trusted internal environments.

### How to Disable Auth

Set:

```env
AUTH_ENABLED=false
```

Then rebuild the stack:

```bash
docker compose up --build -d
```

### Google Login Mode

Use this when users should sign in with Google accounts.

```env
AUTH_ENABLED=true
AUTH_PROVIDER=google
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-random-secret
BOOTSTRAP_ADMIN_USERS_STR=admin@example.com
DEFAULT_VIEWER_DOMAINS_STR=example.com,engineering.example.com
DEV_MODE=false
```

Behavior:

- frontend shows the Google sign-in screen
- backend exchanges the Google authorization code for user info
- backend issues an `HttpOnly` signed session cookie
- RBAC still uses the same `admin` / `designer` / `viewer` model
- users from `DEFAULT_VIEWER_DOMAINS_STR` get implicit `viewer` access if no explicit role is stored
- on first successful login, those implicit viewers are written into `.rbac_roles.json` so an admin can promote them later

Google-only access controls:

- `ALLOWED_USERS_STR`
  Restrict login to exact email addresses
- `ALLOWED_DOMAINS_STR`
  Restrict login to email domains
- `BOOTSTRAP_ADMIN_USERS_STR`
  Grants `admin` role to listed Google accounts even without a stored RBAC entry

### Local Username/Password Mode

Use this when you want admin-managed local accounts instead of Google login.

```env
AUTH_ENABLED=true
AUTH_PROVIDER=local
LOCAL_BOOTSTRAP_ADMIN_USERNAME=admin
LOCAL_BOOTSTRAP_ADMIN_PASSWORD=change-me-now
LOCAL_BOOTSTRAP_ADMIN_NAME=Workspace Admin
SESSION_SECRET=your-random-secret
DEV_MODE=false
```

Behavior:

- frontend shows a username/password login screen
- backend authenticates against the local account store
- backend issues the same `HttpOnly` signed session cookie used by Google mode
- RBAC still uses the same `admin` / `designer` / `viewer` role enforcement
- admin users can create, update, reset, and delete local accounts from Settings

### Local Development Bypass

```env
AUTH_ENABLED=true
DEV_MODE=true
```

Behavior:

- auth is effectively disabled whenever `DEV_MODE=true`
- backend serves a guest admin session
- this is intended for local development only

## Access Control and RBAC

KiCAD Prism always enforces the same three roles:

- `viewer`
- `designer`
- `admin`

Role behavior:

- `viewer`
  Read-only access
- `designer`
  Read access plus project and folder mutation features
- `admin`
  Full access including Settings and access management

RBAC enforcement does not change based on login provider. Only the way the user authenticates changes.

## First Admin Setup

### Google Mode

There are two normal ways to get the first admin:

- set `BOOTSTRAP_ADMIN_USERS_STR=your-email@example.com`
- manually write a role entry into `.rbac_roles.json`

Recommended flow:

1. Set your Google account in `BOOTSTRAP_ADMIN_USERS_STR`
2. Start Prism
3. Log in with that Google account
4. Open `Settings`
5. Manage the rest of the users from `Access Control`

### Local Username/Password Mode

The first admin comes from `.env`, not from the UI.

Use:

```env
LOCAL_BOOTSTRAP_ADMIN_USERNAME=admin
LOCAL_BOOTSTRAP_ADMIN_PASSWORD=choose-a-strong-password
LOCAL_BOOTSTRAP_ADMIN_NAME=Workspace Admin
```

On first login:

1. Start Prism in local mode
2. Log in with `LOCAL_BOOTSTRAP_ADMIN_USERNAME`
3. Use `LOCAL_BOOTSTRAP_ADMIN_PASSWORD`
4. Open `Settings`
5. Create additional local accounts in `Local Accounts`

Bootstrap admin behavior:

- it is created automatically if it does not already exist
- it cannot be deleted
- its role cannot be downgraded below `admin`

## Access Control Walkthrough

### In Google Mode

Open:

- `Settings`
- `Access Control`

An admin can:

- add a user email and assign `viewer`, `designer`, or `admin`
- update an existing user’s role
- remove explicit role assignments

If a user belongs to a domain listed in `DEFAULT_VIEWER_DOMAINS_STR`, their first successful login can auto-create a `viewer` role entry. An admin can then promote that user later.

### In Local Mode

Open:

- `Settings`
- `Local Accounts`

An admin can:

- create a new account with username, display name, password, and role
- update a user’s display name
- change a user’s role
- reset a user’s password
- delete a user

There is no self-service sign-up flow. Admin creates and manages all local users.

## Google OAuth Setup

If you use `AUTH_PROVIDER=google`, create a Google OAuth client of type `Web application`.

Add the frontend origin and callback URI that match your deployment exactly.

Common examples:

- local Docker:
  - origin: `http://127.0.0.1:8080`
  - redirect URI: `http://127.0.0.1:8080/auth/callback`
- internal hostname:
  - origin: `http://kicad-prism.example.internal`
  - redirect URI: `http://kicad-prism.example.internal/auth/callback`
- HTTPS deployment:
  - origin: `https://kicad-prism.example.com`
  - redirect URI: `https://kicad-prism.example.com/auth/callback`

Use:

- `GOOGLE_CLIENT_ID` for the OAuth client ID
- `GOOGLE_CLIENT_SECRET` for the OAuth client secret

If you serve Prism over HTTPS, also set:

```env
SESSION_COOKIE_SECURE=true
```

## Private Repository Access

KiCAD Prism supports two normal approaches.

### SSH

Recommended for long-lived hosted deployments.

- SSH material persists under `./data/ssh`
- backend startup ensures `~/.ssh` exists
- add the generated or mounted public key to your Git host account

### GitHub Personal Access Token

If you use HTTPS cloning for private GitHub repositories:

```env
GITHUB_TOKEN=your_token_here
```

## Custom URL and DNS

By default, Prism is available on:

- `http://server-ip:8080`

If you want a custom URL such as:

- `http://kicad-prism.example.com`
- `https://kicad-prism.example.com`

you need:

1. DNS pointing the hostname to your server
2. a reverse proxy forwarding that hostname to `127.0.0.1:8080`

### DNS Setup

Create an `A` record or equivalent:

- `kicad-prism.example.com -> <server-ip>`

For internal office or VPN-only deployments, use your internal DNS system if available.

## Why a Reverse Proxy Helps

Prism listens on port `8080` by default.

A reverse proxy lets users access:

- `http://kicad-prism.example.com`

while forwarding traffic internally to:

- `http://127.0.0.1:8080`

Benefits:

- cleaner URLs
- optional HTTPS termination
- easier host-based routing if you run multiple services on one server

## Reverse Proxy Examples

### Caddy

Basic HTTP proxy:

```caddyfile
kicad-prism.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

HTTPS with explicit certificate files:

```caddyfile
kicad-prism.example.com {
    tls /path/to/fullchain.pem /path/to/privkey.pem
    reverse_proxy 127.0.0.1:8080
}
```

### Nginx

```nginx
server {
    listen 80;
    server_name kicad-prism.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If HTTPS terminates at the reverse proxy, set:

```env
SESSION_COOKIE_SECURE=true
```

## Deployment Patterns

### Direct Internal Access

Users open:

- `http://server-ip:8080`
- or `http://dns-name:8080`

### Reverse-Proxy Access

Users open:

- `http://kicad-prism.example.com`

The proxy forwards to:

- `http://127.0.0.1:8080`

### Reverse Proxy with HTTPS

Users open:

- `https://kicad-prism.example.com`

The proxy:

- terminates TLS
- forwards to `http://127.0.0.1:8080`

Prism should use:

```env
SESSION_COOKIE_SECURE=true
```

## Operational Commands

### Rebuild after config or frontend changes

```bash
docker compose up --build -d
```

### Inspect logs

```bash
docker compose logs --tail=100 frontend
docker compose logs --tail=100 backend
```

### Check current auth config

```bash
curl http://127.0.0.1:8000/api/auth/config
```

### Check running containers

```bash
docker compose ps
```

## Session Notes

- changing `SESSION_SECRET` invalidates all existing sessions
- secure cookies require HTTPS and will not work correctly on plain HTTP if `SESSION_COOKIE_SECURE=true`
- switching auth provider changes the login flow, but RBAC remains role-based

## Troubleshooting

### Login screen does not match the configured auth mode

Check:

- `AUTH_ENABLED`
- `AUTH_PROVIDER`
- `DEV_MODE=false`
- `docker compose up --build -d` was run after `.env` changes

### Local login rejects credentials

Check:

- `AUTH_PROVIDER=local`
- `LOCAL_BOOTSTRAP_ADMIN_USERNAME`
- `LOCAL_BOOTSTRAP_ADMIN_PASSWORD`
- `SESSION_SECRET` is set

On a fresh local-mode deployment, the bootstrap admin values must be present before the backend starts.

### Google login fails

Check:

- `AUTH_PROVIDER=google`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- the deployed origin matches the OAuth client configuration
- the deployed callback URI matches `/auth/callback`

### User can log in but sees the wrong permissions

Check:

- Google mode:
  - `.rbac_roles.json`
  - `BOOTSTRAP_ADMIN_USERS_STR`
  - `DEFAULT_VIEWER_DOMAINS_STR`
- Local mode:
  - `Local Accounts` settings
  - `.local_accounts.json`

### Session problems after changing auth settings

Changing any of these can affect active sessions:

- `SESSION_SECRET`
- `SESSION_COOKIE_SECURE`
- reverse proxy transport mode
- auth provider

After changes, rebuild and sign in again.

### Imported repositories disappear after restart

Check:

- `./data/projects` is mounted
- the Docker host can write to that path

## Related Docs

- [../README.md](../README.md)
- [./KICAD-PRJ-REPO-STRUCTURE.md](./KICAD-PRJ-REPO-STRUCTURE.md)
- [./PATH-MAPPING.md](./PATH-MAPPING.md)

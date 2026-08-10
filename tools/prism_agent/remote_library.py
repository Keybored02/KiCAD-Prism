"""Is Prism registered as KiCad's remote symbol provider?

KiCad keeps the registration in **eeschema.json**, under `remote_symbols`:

    "remote_symbols": {
        "providers": [
            {
                "provider_id": "provider-<12 hex>",
                "metadata_url": "http://127.0.0.1:8000",
                "display_name_override": "Prism",
                "last_account_label": "",
                "last_auth_status": "signed_out"
            }
        ],
        ...
    }

`metadata_url` is the Prism server. If it's missing, or it names a *different* server
than the agent is configured for, the link is stale and the user should re-link.

Writing this works whether or not KiCad is running. KiCad does rewrite eeschema.json when
it exits, but only the sections it actually touched, and it doesn't touch
`remote_symbols.providers` unless the user opens the Remote Symbol dialog. So an external
write survives. (Verified the hard way: written with KiCad open, survived a full restart.)

KiCad reads the providers at startup, so the user has to restart KiCad to *see* a change.
That's the only caveat, and it's the one the UI should state.
"""

from __future__ import annotations

import json
import os
import sys
import uuid
from pathlib import Path

PROVIDER_NAME = "Prism"


def kicad_config_dir() -> Path | None:
    """The current KiCad's config dir, the newest version installed.

    KiCad keeps one per major version, and an old 8.0 folder tends to linger long after
    the user has moved on. There's one KiCad they actually use.
    """
    if sys.platform == "win32":
        base = Path(os.environ.get("APPDATA", "")) / "kicad"
    elif sys.platform == "darwin":
        base = Path.home() / "Library" / "Preferences" / "kicad"
    else:
        base = (
            Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config") / "kicad"
        )

    if not base.is_dir():
        return None

    versions = [
        d for d in base.iterdir() if d.is_dir() and (d / "eeschema.json").is_file()
    ]
    if not versions:
        return None

    def key(path: Path) -> tuple:
        # Numeric, so "10.0" beats "9.0", a string sort gets that backwards.
        return tuple(int(p) if p.isdigit() else 0 for p in path.name.split("."))

    return max(versions, key=key)


def _same_server(a: str, b: str) -> bool:
    return a.rstrip("/").lower() == b.rstrip("/").lower()


def _providers(cfg: Path) -> list[dict]:
    try:
        data = json.loads((cfg / "eeschema.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return []
    remote = data.get("remote_symbols") or {}
    providers = remote.get("providers") or []
    return [p for p in providers if isinstance(p, dict)]


def status(server_url: str) -> dict:
    """Is Prism linked, and does it point at the server we're configured for?

    Three outcomes the UI cares about:
        not linked   no provider naming any Prism server
        linked       a provider whose metadata_url is our server
        stale        a provider is registered, but for a DIFFERENT server
    """
    cfg = kicad_config_dir()
    if cfg is None:
        return {
            "configured": False,
            "kicad_version": "",
            "linked": False,
            "stale": False,
            "linked_url": "",
            "server_url": server_url,
        }

    providers = _providers(cfg)
    ours = next(
        (p for p in providers if _same_server(p.get("metadata_url", ""), server_url)),
        None,
    )

    # A provider registered under Prism's name but pointing somewhere else is the case
    # worth calling out: the user changed the server URL and the link never followed.
    other = next(
        (
            p
            for p in providers
            if p.get("display_name_override") == PROVIDER_NAME
            and not _same_server(p.get("metadata_url", ""), server_url)
        ),
        None,
    )

    return {
        "configured": True,
        "kicad_version": cfg.name,
        "linked": ours is not None,
        "stale": ours is None and other is not None,
        "linked_url": (other or {}).get("metadata_url", ""),
        "server_url": server_url,
    }


class RemoteLibraryError(Exception):
    """Couldn't change the registration, with a reason worth showing."""


def link(server_url: str) -> dict:
    """Register Prism as KiCad's remote symbol provider.

    Works whether or not KiCad is running. KiCad rewrites eeschema.json on exit, but
    only the sections it actually touched, `remote_symbols.providers` isn't one of them
    unless the user opened the Remote Symbol dialog, so an external write survives.
    (Verified: written with KiCad open, survived a full restart.)

    KiCad reads the providers at startup, so it does need a restart to *see* the change.

    Read-modify-write: this is the user's own eeschema config, and every other setting in
    it has to survive.
    """
    cfg = kicad_config_dir()
    if cfg is None:
        raise RemoteLibraryError(
            "Couldn't find a KiCad configuration. Run KiCad once first."
        )

    path = cfg / "eeschema.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise RemoteLibraryError(f"Couldn't read {path}: {exc}") from exc

    server_url = server_url.rstrip("/")
    remote = data.setdefault("remote_symbols", {})
    providers = remote.setdefault("providers", [])

    # Drop any previous Prism entry, including one pointing at an old server, which is
    # exactly the stale case we're here to fix. Leave other people's providers alone.
    providers = [
        p
        for p in providers
        if not (
            isinstance(p, dict)
            and (
                p.get("display_name_override") == PROVIDER_NAME
                or _same_server(p.get("metadata_url", ""), server_url)
            )
        )
    ]

    entry = {
        # KiCad's own ids look like provider-<12 hex>; match the shape so nothing
        # downstream is surprised by it.
        "provider_id": "provider-%s" % uuid.uuid4().hex[:12],
        "metadata_url": server_url,
        "display_name_override": PROVIDER_NAME,
        "last_account_label": "",
        "last_auth_status": "signed_out",
    }
    providers.append(entry)

    remote["providers"] = providers
    remote["last_used_provider_id"] = entry["provider_id"]

    _save(path, data)
    return {"kicad_version": cfg.name, "server_url": server_url}


def unlink(server_url: str) -> dict:
    """Remove Prism from KiCad's providers. Leaves every other provider untouched."""
    cfg = kicad_config_dir()
    if cfg is None:
        return {"kicad_version": "", "removed": False}

    path = cfg / "eeschema.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise RemoteLibraryError(f"Couldn't read {path}: {exc}") from exc

    remote = data.get("remote_symbols") or {}
    providers = remote.get("providers") or []
    keep = [
        p
        for p in providers
        if not (
            isinstance(p, dict)
            and (
                p.get("display_name_override") == PROVIDER_NAME
                or _same_server(p.get("metadata_url", ""), server_url)
            )
        )
    ]
    if len(keep) == len(providers):
        return {"kicad_version": cfg.name, "removed": False}

    remote["providers"] = keep
    remote["last_used_provider_id"] = ""
    _save(path, data)
    return {"kicad_version": cfg.name, "removed": True}


def _save(path: Path, data: dict) -> None:
    # Write-then-replace: a half-written eeschema.json would cost the user every
    # preference they have.
    tmp = path.with_name(path.name + ".prism-tmp")
    try:
        tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
        tmp.replace(path)
    except OSError as exc:
        raise RemoteLibraryError(f"Couldn't write {path}: {exc}") from exc

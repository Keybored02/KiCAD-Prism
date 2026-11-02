"""Which code host serves a project's repository.

The answer comes only from hosts Prism was told about: a code-host connection
in Settings, then the forge-host registry (github.com, gitlab.com and
PRISM_FORGE_HOSTS). A hostname is never searched for words like "gitlab".
The browser uses the provider to build file links into the host's web UI.
"""

from __future__ import annotations

import re
from collections.abc import Mapping
from dataclasses import dataclass
from urllib.parse import urlsplit

from app.core.config import settings
from app.services.forge_hosts import ForgeHostConfigError, resolve_forge_host

_SCP_LIKE_RE = re.compile(r"^[^/@]+@(\[[^\]]+\]|[^/:]+):")


def remote_hostname(repo_url: str | None) -> str | None:
    """Hostname of an https, ssh or scp-style (``git@host:org/repo``) remote."""

    text = (repo_url or "").strip()
    if not text:
        return None
    scp = _SCP_LIKE_RE.match(text)
    if scp and "://" not in text:
        host = scp.group(1).strip("[]")
    else:
        try:
            host = urlsplit(text).hostname or ""
        except ValueError:
            return None
    host = host.casefold().removeprefix("www.")
    return host or None


@dataclass(frozen=True)
class RepositoryHost:
    provider: str
    # Scheme, host and port the host's web UI answers on, when a connection
    # records it. An ssh or scp remote carries only the ssh port, so this is
    # the one place a self-hosted instance's web port (``:3000``) is known.
    web_origin: str | None = None


def connector_hosts() -> dict[str, RepositoryHost]:
    """Provider and web origin of every configured code-host connection, by hostname."""

    from app.services.postgres_database import database
    from app.services.trackers.connector_service import connector_host

    with database.connection() as conn:
        conn.execute("SET search_path TO workspace, public")
        rows = conn.execute(
            "SELECT provider, base_url FROM tracker_connectors ORDER BY created_at ASC, id ASC"
        ).fetchall()
    hosts: dict[str, RepositoryHost] = {}
    for row in rows:
        row = dict(row)
        host = connector_host(row).casefold().removeprefix("www.")
        if host:
            hosts.setdefault(host, RepositoryHost(str(row["provider"]), _web_origin(row.get("base_url"))))
    return hosts


def _web_origin(base_url: str | None) -> str | None:
    try:
        parsed = urlsplit((base_url or "").strip())
    except ValueError:
        return None
    if parsed.scheme.casefold() not in {"http", "https"} or not parsed.netloc or parsed.username or parsed.password:
        return None
    return f"{parsed.scheme.casefold()}://{parsed.netloc}"


def repository_host(
    repo_url: str | None, *, connectors: Mapping[str, RepositoryHost] | None = None
) -> RepositoryHost | None:
    """The code host behind the remote, or ``None`` when Prism was not told about it."""

    host = remote_hostname(repo_url)
    if not host:
        return None
    known = connector_hosts() if connectors is None else connectors
    if host in known:
        return known[host]
    try:
        forge = resolve_forge_host(host, settings.PRISM_FORGE_HOSTS)
    except ForgeHostConfigError:
        return None
    return RepositoryHost(forge.kind) if forge else None


def repository_provider(
    repo_url: str | None, *, connectors: Mapping[str, RepositoryHost] | None = None
) -> str | None:
    """``github``, ``gitlab`` or ``gitea`` for the remote's host, or ``None`` when unknown."""

    found = repository_host(repo_url, connectors=connectors)
    return found.provider if found else None

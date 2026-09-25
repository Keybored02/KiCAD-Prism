"""
Shared helpers for resolving Prism's public base URL behind reverse proxies.
"""

from __future__ import annotations

from urllib.parse import urlsplit

from fastapi import Request

from app.core.config import settings

LOOPBACK_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})

# Sent by the KiCad agent's library bridge (tools/prism_agent/library_bridge.py): the
# 127.0.0.1 origin KiCad is really talking to. A dedicated header because proxies
# (Caddy, nginx, frontend/nginx.conf) overwrite X-Forwarded-Host with their own host.
LOOPBACK_ORIGIN_HEADER = "x-prism-loopback-origin"


def _normalize_base_url(base_url: str | None) -> str:
    """Return normalized base URL (no trailing slash)."""
    return (base_url or "").strip().rstrip("/")


def _first_forwarded_value(header_value: str | None) -> str:
    """Return the left-most value from a possibly comma-separated forwarded header."""
    if not header_value:
        return ""
    return header_value.split(",", 1)[0].strip()


def resolve_public_base_url(
    request: Request,
    explicit: str | None = None,
) -> str:
    """
    Resolve the externally visible origin for absolute URLs.

    Precedence:
    1. Explicit override argument
    2. PUBLIC_BASE_URL from environment
    3. X-Forwarded-Proto + (X-Forwarded-Host or Host)
    4. request.base_url, with scheme rewritten from X-Forwarded-Proto when present
    """
    normalized = _normalize_base_url(explicit)
    if normalized:
        return normalized

    normalized = _normalize_base_url(settings.PUBLIC_BASE_URL)
    if normalized:
        return normalized

    forwarded_proto = _first_forwarded_value(request.headers.get("x-forwarded-proto")).lower()
    forwarded_host = _first_forwarded_value(
        request.headers.get("x-forwarded-host") or request.headers.get("host")
    )

    if forwarded_proto in {"http", "https"} and forwarded_host:
        return f"{forwarded_proto}://{forwarded_host}".rstrip("/")

    base = str(request.base_url).rstrip("/")
    if forwarded_proto in {"http", "https"} and "://" in base:
        _, remainder = base.split("://", 1)
        return f"{forwarded_proto}://{remainder}"

    return base


def _kicad_accepts(url: str) -> bool:
    """KiCad's remote provider rule: HTTPS, or plain HTTP on a literal loopback host."""
    parts = urlsplit(url)
    scheme = parts.scheme.lower()
    return scheme == "https" or (
        scheme == "http" and (parts.hostname or "").lower() in LOOPBACK_HOSTS
    )


def _loopback_origin(url: str) -> str:
    """`url` reduced to scheme://host[:port] if it is plain HTTP on loopback, else ""."""
    try:
        parts = urlsplit(url)
    except ValueError:
        return ""
    if parts.scheme.lower() != "http" or (parts.hostname or "").lower() not in LOOPBACK_HOSTS:
        return ""
    return f"http://{parts.netloc}"


def _request_origin(request: Request) -> str:
    """The origin this request was addressed to, from forwarded headers or Host."""
    base = str(request.base_url)
    proto = _first_forwarded_value(request.headers.get("x-forwarded-proto")).lower()
    proto = proto or base.split("://", 1)[0].lower()
    host = _first_forwarded_value(
        request.headers.get("x-forwarded-host") or request.headers.get("host")
    )
    return f"{proto}://{host}" if host else ""


def resolve_provider_base_url(request: Request) -> str:
    """The origin to put in URLs handed to KiCad's remote symbol provider.

    Normally the public base URL. But KiCad refuses provider URLs that are plain HTTP
    on anything but localhost, so a LAN server without TLS is unusable as-is. When the
    public URL is one KiCad would reject, and the caller reached us via loopback
    (directly, or through the agent's library bridge), answer with that loopback
    origin instead. An HTTPS PUBLIC_BASE_URL never gets here, so deployments with
    TLS are unaffected; and a URL KiCad would have rejected anyway is all this ever
    replaces.
    """
    canonical = resolve_public_base_url(request)
    if _kicad_accepts(canonical):
        return canonical
    for candidate in (
        request.headers.get(LOOPBACK_ORIGIN_HEADER) or "",
        _request_origin(request),
    ):
        origin = _loopback_origin(candidate)
        if origin:
            return origin
    return canonical

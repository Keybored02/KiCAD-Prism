"""What to do when a provider call fails. Shared by polling and discovery.

The same three reactions apply to any call, so they live in one place:

* rate limited: hold the whole connector off until the provider says
* credentials rejected: pause the connector so it stops spending anything
* anything else: note the error code, stop the run, and wait a few minutes before
  the connector is tried again, so a dead provider is not hit on every scan
"""

from __future__ import annotations

from datetime import datetime, timedelta

from app.services.supply.connectors import ConnectorService
from app.services.supply.providers.base import AuthError, ProviderError, RateLimited
from app.services.supply.store import SupplyStore

RATE_LIMIT_DEFAULT = timedelta(minutes=15)
ERROR_COOLDOWN = timedelta(minutes=5)
SYSTEM_ACTOR = "system:poller"

RATE_LIMITED = "rate_limited"
AUTH_FAILED = "auth_failed"
ERROR = "error"


def react(
    connectors: ConnectorService,
    store: SupplyStore,
    connector_id: str,
    error: ProviderError,
    now: datetime,
) -> str:
    """Apply the connector-level reaction and return why the run stopped."""

    connectors.record_result(connector_id, error.code)
    if isinstance(error, AuthError):
        connectors.pause(connector_id, actor=SYSTEM_ACTOR, reason="The provider rejected the credentials.")
        return AUTH_FAILED
    if isinstance(error, RateLimited):
        wait = timedelta(seconds=error.retry_after_seconds) if error.retry_after_seconds else RATE_LIMIT_DEFAULT
        reason = RATE_LIMITED
    else:
        wait, reason = ERROR_COOLDOWN, ERROR
    with store.connection() as conn:
        conn.execute("UPDATE connectors SET cooldown_until = %s WHERE id = %s", (now + wait, connector_id))
    return reason


def cooling_down(store: SupplyStore, connector_id: str, now: datetime) -> bool:
    with store.connection() as conn:
        until = conn.execute("SELECT cooldown_until FROM connectors WHERE id = %s", (connector_id,)).fetchone()["cooldown_until"]
    return until is not None and until > now

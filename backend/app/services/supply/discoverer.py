"""Finding listings for watched parts, on a schedule.

A watch has no listings until a distributor has been asked about the part. This
asks, once per part per connector, and again weekly. A search costs a call like
any other, so it spends the budget and stops when the budget does. Parts a
distributor does not carry are recorded as searched, so they are not searched on
every scan.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Callable

from app.services.supply import ledger, trouble
from app.services.supply.connectors import ConnectorService
from app.services.supply.discovery import DiscoveryService
from app.services.supply.providers import registry
from app.services.supply.providers.base import CAP_SEARCH, ProviderError, SupplyProvider
from app.services.supply.store import SupplyStore, supply_store

REDO_AFTER = timedelta(days=7)
MAX_PER_RUN = 10

STOPPED_INACTIVE = "inactive"
STOPPED_COOLING_DOWN = "cooling_down"
STOPPED_UNSUPPORTED = "unsupported"
STOPPED_BUDGET = "budget"


@dataclass(frozen=True, slots=True)
class DiscoverySummary:
    connector_id: str
    searched: int = 0
    listings: int = 0
    stopped: str | None = None


def pending_parts(conn, connector_id: str, now: datetime, limit: int) -> list[str]:
    """Watched parts never searched at this connector, or not for a week, oldest first."""

    rows = conn.execute(
        """
        SELECT w.part_id FROM watches w
        LEFT JOIN discovery_runs d ON d.part_id = w.part_id AND d.connector_id = %s
        WHERE d.part_id IS NULL OR d.last_run_at <= %s
        ORDER BY COALESCE(d.last_run_at, '-infinity'::timestamptz), w.created_at, w.id
        LIMIT %s
        """,
        (connector_id, now - REDO_AFTER, limit),
    ).fetchall()
    return [row["part_id"] for row in rows]


class Discoverer:
    def __init__(
        self,
        connectors: ConnectorService,
        *,
        store: SupplyStore = supply_store,
        provider_for: Callable[[str], SupplyProvider] | None = None,
        clock: Callable[[], datetime] | None = None,
    ) -> None:
        self._connectors = connectors
        self._store = store
        self._provider_for = provider_for or connectors.load_provider
        self._clock = clock or (lambda: datetime.now(timezone.utc))

    def run(self, connector_id: str, *, limit: int = MAX_PER_RUN) -> DiscoverySummary:
        now = self._clock()
        connector = self._connectors.get(connector_id)
        if not connector["enabled"] or connector["paused_reason"] or not connector["provider_available"]:
            return DiscoverySummary(connector_id, stopped=STOPPED_INACTIVE)
        spec = registry.get_spec(connector["provider"])
        if CAP_SEARCH not in spec.capabilities:
            return DiscoverySummary(connector_id, stopped=STOPPED_UNSUPPORTED)
        if trouble.cooling_down(self._store, connector_id, now):
            return DiscoverySummary(connector_id, stopped=STOPPED_COOLING_DOWN)
        with self._store.connection() as conn:
            part_ids = pending_parts(conn, connector_id, now, limit)
        if not part_ids:
            return DiscoverySummary(connector_id)

        provider = self._provider_for(connector_id)
        service = DiscoveryService(lambda _id: provider, self._store)
        searched = listings = 0
        stopped: str | None = None
        for part_id in part_ids:
            if spec.metered and not ledger.spend_call(self._store, connector, now=now):
                stopped = STOPPED_BUDGET
                break
            try:
                result = service.discover(part_id, connector_id)
            except ProviderError as exc:
                stopped = trouble.react(self._connectors, self._store, connector_id, exc, now)
                break
            searched += 1
            listings += result.total
            with self._store.connection() as conn:
                conn.execute(
                    "INSERT INTO discovery_runs (part_id, connector_id, last_run_at, found) VALUES (%s, %s, %s, %s) "
                    "ON CONFLICT (part_id, connector_id) DO UPDATE SET last_run_at = EXCLUDED.last_run_at, found = EXCLUDED.found",
                    (part_id, connector_id, now, result.total),
                )
        return DiscoverySummary(connector_id, searched=searched, listings=listings, stopped=stopped)

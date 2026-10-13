"""Finding listings for watched parts, on a schedule.

A watch has no listings until a distributor has been asked about the part. This
asks, once per part per connector. A part a distributor carries is looked up again
after ``REDO_FOUND_AFTER`` (new packagings appear rarely); one it does not carry,
after ``REDO_AFTER``, in case it has been added since. A search costs a call like
any other, so it spends the budget and stops when the budget does. A provider that
can look up several numbers in one call (``search_batch``) is asked for a group of
parts at once. Parts a distributor does not carry are recorded as searched, so they
are not searched on every scan.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Callable

from app.services.supply import ledger, parts, trouble
from app.services.supply.connectors import ConnectorService
from app.services.supply.discovery import DiscoveryService
from app.services.supply.identity import match_key
from app.services.supply.providers import registry
from app.services.supply.providers.base import CAP_SEARCH, ProviderError, SupplyProvider
from app.services.supply.store import SupplyStore, supply_store

REDO_AFTER = timedelta(days=7)
REDO_FOUND_AFTER = timedelta(days=30)
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


# Which watched parts are due a search at connector ``c``: never searched, or searched longer ago than the wait that
# fits what was found (``%(found)s`` and ``%(missing)s`` are the two cut-off times). Shared with the job scheduler.
DUE_SEARCH = """
    d.part_id IS NULL OR d.last_run_at <= CASE
        WHEN EXISTS (SELECT 1 FROM listings x WHERE x.part_id = w.part_id AND x.connector_id = c.id
                     AND x.match_state IN ('exact', 'manual'))
        THEN %(found)s::timestamptz ELSE %(missing)s::timestamptz END
"""


def pending_parts(conn, connector_id: str, now: datetime, limit: int) -> list[str]:
    """Watched parts to search for at this connector, the longest waiting first."""

    rows = conn.execute(
        f"""
        SELECT w.part_id FROM watches w
        JOIN connectors c ON c.id = %(connector)s
        LEFT JOIN discovery_runs d ON d.part_id = w.part_id AND d.connector_id = c.id
        WHERE {DUE_SEARCH}
        ORDER BY COALESCE(d.last_run_at, '-infinity'::timestamptz), w.created_at, w.id
        LIMIT %(limit)s
        """,
        {"connector": connector_id, "found": now - REDO_FOUND_AFTER, "missing": now - REDO_AFTER, "limit": limit},
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
        group_size = max(spec.search_batch, 1)
        with self._store.connection() as conn:
            part_ids = pending_parts(conn, connector_id, now, limit * group_size)
        if not part_ids:
            return DiscoverySummary(connector_id)

        provider = self._provider_for(connector_id)
        service = DiscoveryService(lambda _id: provider, self._store)
        searched = listings = 0
        stopped: str | None = None
        for start in range(0, len(part_ids), group_size):
            group = part_ids[start:start + group_size]
            if spec.metered and not ledger.spend_call(self._store, connector, now=now):
                stopped = STOPPED_BUDGET
                break
            try:
                results = self._search(service, provider, group, connector_id, batched=group_size > 1)
            except ProviderError as exc:
                stopped = trouble.react(self._connectors, self._store, connector_id, exc, now)
                break
            for part_id, result in results.items():
                searched += 1
                listings += result.total
                with self._store.connection() as conn:
                    conn.execute(
                        "INSERT INTO discovery_runs (part_id, connector_id, last_run_at, found) VALUES (%s, %s, %s, %s) "
                        "ON CONFLICT (part_id, connector_id) DO UPDATE SET last_run_at = EXCLUDED.last_run_at, found = EXCLUDED.found",
                        (part_id, connector_id, now, result.total),
                    )
        return DiscoverySummary(connector_id, searched=searched, listings=listings, stopped=stopped)

    def _search(self, service: DiscoveryService, provider: SupplyProvider, group: list[str], connector_id: str, *, batched: bool):
        """One search call for ``group``; the result for each part, keyed by part id."""

        if not batched:
            return {group[0]: service.discover(group[0], connector_id)}
        with self._store.connection() as conn:
            found = [parts.get_part(conn, part_id) for part_id in group]
        answers = provider.lookup_mpns([part.mpn for part in found])  # type: ignore[attr-defined]
        return {part.id: service.apply(part, answers.get(match_key(part.mpn), []), connector_id) for part in found}

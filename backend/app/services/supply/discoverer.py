"""Finding listings for followed parts, on a schedule.

A followed part has no listings until a distributor has been asked about it. A part is searched at a connector once it
is admitted there (``admission.py``), the first time from the pool the budget keeps for one-off work (a person's
reads), and again from the committed share: where it was found, every month at tier 1 and every quarter at tier 2;
where nothing was found, every two weeks at tier 1 and every month at tier 2, so a distributor that starts stocking a part
is noticed. A search
costs a call like any other, so it spends the budget and stops when the budget does. A provider that can look up
several numbers in one call (``search_batch``) is asked for a group of parts at once. Parts a distributor does not
carry are recorded as searched, so they are not searched on every scan.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from app.services.supply import admission, ledger, parts, trouble
from app.services.supply.connectors import ConnectorService
from app.services.supply.discovery import DiscoveryService
from app.services.supply.identity import match_key
from app.services.supply.providers import registry
from app.services.supply.providers.base import CAP_SEARCH, ProviderError, SupplyProvider
from app.services.supply.store import SupplyStore, supply_store

# How long after a search a part is searched again, by tracking tier: where it was found, and where nothing was.
RESEARCH_AFTER = {1: timedelta(days=30), 2: timedelta(days=90)}
RESEARCH_MISSING_AFTER = {1: timedelta(days=14), 2: timedelta(days=30)}
MAX_PER_RUN = 10

STOPPED_INACTIVE = "inactive"
STOPPED_COOLING_DOWN = "cooling_down"
STOPPED_UNSUPPORTED = "unsupported"
STOPPED_BUDGET = "budget"
# First searches never take more than this share of the pool; the rest stays for people (Read now, Check notices, Fill).
POOL_KEPT_FOR_PEOPLE_PCT = 50


@dataclass(frozen=True, slots=True)
class DiscoverySummary:
    connector_id: str
    searched: int = 0
    listings: int = 0
    stopped: str | None = None


# Which followed parts are due a search at connector ``c``: admitted there, and never searched or searched longer ago than
# their tier waits (``%(tier1)s`` and ``%(tier2)s`` are the cut-off times); a connector that costs nothing needs no
# admission (``%(free)s`` lists those providers). Aliases: c connectors, pt part_tiers, a admissions, d discovery_runs.
# Shared with the job scheduler.
DUE_SEARCH = """
    (a.state = 'admitted' OR c.provider = ANY(%(free)s)) AND (d.part_id IS NULL OR d.last_run_at <= CASE
        WHEN d.found = 0 AND pt.tier = 1 THEN %(missing1)s::timestamptz
        WHEN d.found = 0 THEN %(missing2)s::timestamptz
        WHEN pt.tier = 1 THEN %(tier1)s::timestamptz ELSE %(tier2)s::timestamptz END)
"""


def cutoffs(now: datetime) -> dict[str, Any]:
    return {
        "tier1": now - RESEARCH_AFTER[1], "tier2": now - RESEARCH_AFTER[2],
        "missing1": now - RESEARCH_MISSING_AFTER[1], "missing2": now - RESEARCH_MISSING_AFTER[2],
        "free": [spec.key for spec in registry.list_specs(include_dev=True) if not spec.metered],
    }


@dataclass(frozen=True, slots=True)
class PendingPart:
    part_id: str
    tier: int
    first: bool


def pending_waiting(conn, connector_id: str, limit: int) -> list[PendingPart]:
    """Parts that wait for room here and have never been searched: their searches come from spare budget."""

    rows = conn.execute(
        """
        SELECT pt.part_id, pt.tier FROM part_tiers pt
        JOIN admissions a ON a.part_id = pt.part_id AND a.connector_id = %s AND a.state = 'waiting'
        LEFT JOIN discovery_runs d ON d.part_id = pt.part_id AND d.connector_id = a.connector_id
        WHERE d.part_id IS NULL ORDER BY pt.tier, pt.part_id LIMIT %s
        """,
        (connector_id, limit),
    ).fetchall()
    return [PendingPart(row["part_id"], int(row["tier"]), True) for row in rows]


def pending_parts(conn, connector_id: str, now: datetime, limit: int) -> list[PendingPart]:
    """Followed parts to search for at this connector: those never searched first, then the longest waiting."""

    rows = conn.execute(
        f"""
        SELECT pt.part_id, pt.tier, (d.part_id IS NULL) AS first
        FROM part_tiers pt
        JOIN connectors c ON c.id = %(connector)s
        LEFT JOIN admissions a ON a.part_id = pt.part_id AND a.connector_id = c.id
        LEFT JOIN discovery_runs d ON d.part_id = pt.part_id AND d.connector_id = c.id
        WHERE {DUE_SEARCH}
        ORDER BY (d.part_id IS NULL) DESC, pt.tier, COALESCE(d.last_run_at, '-infinity'::timestamptz), pt.part_id
        LIMIT %(limit)s
        """,
        {"connector": connector_id, "limit": limit, **cutoffs(now)},
    ).fetchall()
    return [PendingPart(row["part_id"], int(row["tier"]), bool(row["first"])) for row in rows]


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

    def run(self, connector_id: str, *, limit: int = MAX_PER_RUN, waiting: bool = False) -> DiscoverySummary:
        """Search for the parts due one. With ``waiting``, search for the parts that wait for room, from spare budget only."""

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
            pending = (
                pending_waiting(conn, connector_id, limit * group_size) if waiting
                else pending_parts(conn, connector_id, now, limit * group_size)
            )
        if not pending:
            return DiscoverySummary(connector_id)

        provider = self._provider_for(connector_id)
        service = DiscoveryService(lambda _id: provider, self._store)
        searched = listings = 0
        stopped: str | None = None
        # A first search is a one-off cost of taking a part on, paid from the pool; a repeat comes from the committed share.
        for first in (True, False):
            todo = [item for item in pending if item.first is first]
            for start in range(0, len(todo), group_size):
                group = todo[start:start + group_size]
                purpose = ledger.PURPOSE_ONE_OFF if first else f"tier{min(item.tier for item in group)}"
                if spec.metered and not self._spend(connector, first, purpose, spare_only=waiting):
                    stopped = STOPPED_BUDGET
                    break
                try:
                    results = self._search(service, provider, [item.part_id for item in group], connector_id, batched=group_size > 1)
                except ProviderError as exc:
                    return DiscoverySummary(
                        connector_id, searched=searched, listings=listings, stopped=trouble.react(self._connectors, self._store, connector_id, exc, now)
                    )
                for part_id, result in results.items():
                    searched += 1
                    listings += result.total
                    with self._store.connection() as conn:
                        conn.execute(
                            "INSERT INTO discovery_runs (part_id, connector_id, last_run_at, found) VALUES (%s, %s, %s, %s) "
                            "ON CONFLICT (part_id, connector_id) DO UPDATE SET last_run_at = EXCLUDED.last_run_at, found = EXCLUDED.found",
                            (part_id, connector_id, now, result.total),
                        )
        if searched:
            # What the searches found replaces the estimate admission was made on.
            with self._store.connection() as conn:
                admission.sync(conn)
        return DiscoverySummary(connector_id, searched=searched, listings=listings, stopped=stopped)

    def search_parts(self, connector_id: str, part_ids: list[str]) -> tuple[int, str | None]:
        """Search for these parts now, for a check someone asked for once: paid from the pool, then from spare budget.

        Returns how many were searched and why it stopped early, if it did. Parts already searched are not searched again.
        """

        now = self._clock()
        connector = self._connectors.get(connector_id)
        spec = registry.get_spec(connector["provider"])
        if (not connector["enabled"] or connector["paused_reason"] or not connector["provider_available"]
                or CAP_SEARCH not in spec.capabilities):
            return 0, STOPPED_INACTIVE
        if trouble.cooling_down(self._store, connector_id, now):
            return 0, STOPPED_COOLING_DOWN
        with self._store.connection() as conn:
            done = {r["part_id"] for r in conn.execute(
                "SELECT part_id FROM discovery_runs WHERE connector_id = %s AND part_id = ANY(%s)", (connector_id, part_ids)).fetchall()}
        todo = [part_id for part_id in part_ids if part_id not in done]
        provider = self._provider_for(connector_id)
        service = DiscoveryService(lambda _id: provider, self._store)
        size = max(spec.search_batch, 1)
        searched = 0
        for start in range(0, len(todo), size):
            group = todo[start:start + size]
            if spec.metered and not (
                ledger.spend_call(self._store, connector, now=now, interactive=True, kind=ledger.KIND_SEARCH, purpose=ledger.PURPOSE_ONE_OFF)
                or ledger.spend_call(self._store, connector, now=now, kind=ledger.KIND_SEARCH, purpose=ledger.PURPOSE_ONE_OFF, spare=True)
            ):
                return searched, STOPPED_BUDGET
            try:
                results = self._search(service, provider, group, connector_id, batched=size > 1)
            except ProviderError as exc:
                return searched, trouble.react(self._connectors, self._store, connector_id, exc, now)
            for part_id, result in results.items():
                searched += 1
                with self._store.connection() as conn:
                    conn.execute(
                        "INSERT INTO discovery_runs (part_id, connector_id, last_run_at, found) VALUES (%s, %s, %s, %s) "
                        "ON CONFLICT (part_id, connector_id) DO UPDATE SET last_run_at = EXCLUDED.last_run_at, found = EXCLUDED.found",
                        (part_id, connector_id, now, result.total),
                    )
        return searched, None

    def _spend(self, connector, first: bool, purpose: str, *, spare_only: bool = False) -> bool:
        """A first search is paid from the pool and, when that is empty, from spare budget; a repeat from the committed share."""

        now = self._clock()
        if spare_only:
            return ledger.spend_call(self._store, connector, now=now, kind=ledger.KIND_SEARCH, purpose=ledger.PURPOSE_SPARE, spare=True)
        if first:
            return ledger.spend_call(
                self._store, connector, now=now, interactive=True, kind=ledger.KIND_SEARCH, purpose=purpose,
                keep_pool_pct=POOL_KEPT_FOR_PEOPLE_PCT,
            ) or ledger.spend_call(self._store, connector, now=now, kind=ledger.KIND_SEARCH, purpose=purpose, spare=True)
        return ledger.spend_call(self._store, connector, now=now, kind=ledger.KIND_SEARCH, purpose=purpose)

    def _search(self, service: DiscoveryService, provider: SupplyProvider, group: list[str], connector_id: str, *, batched: bool):
        """One search call for ``group``; the result for each part, keyed by part id."""

        if not batched:
            return {group[0]: service.discover(group[0], connector_id, spend=lambda: self._spend_extra(connector_id))}
        with self._store.connection() as conn:
            found = [parts.get_part(conn, part_id) for part_id in group]
            extra = {part.id: parts.searched_numbers(conn, part.id) for part in found}
        asked = list(dict.fromkeys([part.mpn for part in found] + [number for numbers in extra.values() for number in numbers]))
        answers = provider.lookup_mpns(asked)  # type: ignore[attr-defined]
        results = {}
        for part in found:
            matches = list(answers.get(match_key(part.mpn), []))
            for number in extra[part.id]:
                matches += [match for match in answers.get(match_key(number), []) if match.sku not in {m.sku for m in matches}]
            results[part.id] = service.apply(part, matches, connector_id)
        return results

    def _spend_extra(self, connector_id: str) -> bool:
        """One more search call for a part's other number: from the committed share, then from spare budget."""

        connector = self._connectors.get(connector_id)
        if not registry.get_spec(connector["provider"]).metered:
            return True
        now = self._clock()
        return ledger.spend_call(self._store, connector, now=now, kind=ledger.KIND_SEARCH, purpose=ledger.PURPOSE_SPARE, spare=True)

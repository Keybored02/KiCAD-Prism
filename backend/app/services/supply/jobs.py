"""The supply job: discover and poll one connector. And the scan that queues it.

``schedule_due_supply_jobs`` runs from prism-worker every minute. It finds the
connectors with work to do and queues one job each. The artifact key makes the
job system keep at most one per connector queued or running, so a slow
provider cannot pile up jobs.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Mapping

from app.core.config import settings
from app.services.supply import datasheets, details, fx, ledger, market, quota, retention
from app.services.supply.connectors import ConnectorService
from app.services.supply.discoverer import REDO_AFTER, Discoverer
from app.services.supply.poller import Poller
from app.services.supply.providers import registry
from app.services.supply.providers.base import CAP_SEARCH
from app.services.supply.store import SupplyStore, supply_store

POLL_JOB_KIND = "supply_poll"
SUPPLY_RESOURCE = "supply"
# Leave a slot for everything else on a small worker, as the tracker scheduler does.
SUPPLY_RESOURCE_CAPACITY = min(2, max(1, settings.PRISM_WORKER_CONCURRENCY - 1))
SUPPLY_PRIORITY = 200
SCAN_SECONDS = 60
SYSTEM_REQUESTER = "system:supply-scheduler"


def artifact_key(connector_id: str) -> str:
    return f"supply-poll:{connector_id}"


def _has_budget(conn, row, now: datetime) -> bool:
    """Whether a connector may spend a background call right now. Free connectors always may."""

    try:
        if not registry.get_spec(row["provider"]).metered:
            return True
    except registry.UnknownProvider:
        return False
    state = ledger.get_state(
        conn, row["id"], daily_budget=row["daily_budget"], reserve_pct=row["interactive_reserve_pct"], now=now
    )
    return quota.background_allowance(state, now) > 0


_warned_providers: set[str] = set()


def _warn_unknown_provider(provider: str) -> None:
    if provider not in _warned_providers:
        _warned_providers.add(provider)
        logging.getLogger(__name__).warning(
            "Supply connector provider %r is unknown to this worker; its connectors are not polled. Restart the worker.", provider
        )


def connectors_with_work(conn, now: datetime) -> list[str]:
    """Active connectors with a listing due or a watched part to search for, and a call to spend.

    A connector whose budget for this stretch of the day is used up is left out, so
    a quiet budget does not queue a job a minute that can only find it empty.
    """

    active = """
        c.enabled AND c.paused_reason = '' AND (c.cooldown_until IS NULL OR c.cooldown_until <= %(now)s)
    """
    due = conn.execute(
        f"""
        SELECT DISTINCT l.connector_id AS id FROM listings l
        JOIN watches w ON w.part_id = l.part_id
        JOIN connectors c ON c.id = l.connector_id
        LEFT JOIN poll_state ps ON ps.listing_id = l.id
        WHERE l.match_state IN ('exact', 'manual') AND {active}
          AND (ps.listing_id IS NULL OR ps.next_poll_at <= %(now)s)
        """,
        {"now": now},
    ).fetchall()
    unsearched = conn.execute(
        f"""
        SELECT DISTINCT c.id, c.provider FROM connectors c
        CROSS JOIN watches w
        LEFT JOIN discovery_runs d ON d.part_id = w.part_id AND d.connector_id = c.id
        WHERE {active} AND (d.part_id IS NULL OR d.last_run_at <= %(redo)s)
        """,
        {"now": now, "redo": now - REDO_AFTER},
    ).fetchall()

    ids = [row["id"] for row in due]
    for row in unsearched:
        try:
            searchable = CAP_SEARCH in registry.get_spec(row["provider"]).capabilities
        except registry.UnknownProvider:
            # The worker runs code that does not know this provider (usually: started before it was added).
            _warn_unknown_provider(row["provider"])
            searchable = False
        if searchable and row["id"] not in ids:
            ids.append(row["id"])
    if not ids:
        return []
    funded = conn.execute(
        "SELECT id, provider, daily_budget, interactive_reserve_pct FROM connectors WHERE id = ANY(%s)", (ids,)
    ).fetchall()
    return sorted(row["id"] for row in funded if _has_budget(conn, row, now))


def schedule_due_supply_jobs(
    *,
    job_service: Any | None = None,
    store: SupplyStore = supply_store,
    now: datetime | None = None,
) -> list[dict[str, Any]]:
    """Queue a job for each connector with work. Returns what the job service returned."""

    if job_service is None:
        from app.services.job_service import jobs as job_service
    store.initialize()
    moment = now or datetime.now(timezone.utc)
    with store.connection() as conn:
        connector_ids = connectors_with_work(conn, moment)
    queued = []
    for connector_id in connector_ids:
        queued.append(job_service.enqueue(
            POLL_JOB_KIND,
            {"connector_id": connector_id},
            worker_pool="prism",
            artifact_key=artifact_key(connector_id),
            priority=SUPPLY_PRIORITY,
            resources={SUPPLY_RESOURCE: 1},
            requested_by=SYSTEM_REQUESTER,
            max_attempts=2,
        ))
    return queued


def _check_datasheets(store: SupplyStore) -> None:
    """Fetch a couple of due datasheets. Best effort: a failure is recorded against the part, never the job."""

    try:
        datasheets.run_due(store)
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).info("Datasheets not checked", exc_info=True)


def _read_details(connectors: ConnectorService, connector_id: str) -> str | None:
    """Read a few due change notices or substance lists. Best effort: a failure is recorded per listing, never the job."""

    try:
        return details.run(connectors, connector_id).stopped
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).info("Distributor details not read", exc_info=True)
        return "error"


def _snapshot_market(conn) -> None:
    """Store today's market indices once. Best effort."""

    try:
        with conn.transaction():
            market.snapshot(conn)
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).info("Market indices not stored", exc_info=True)


def _refresh_rates(conn) -> None:
    """Keep the exchange rates fresh. Best effort: with no route to the ECB, rates stay as they were."""

    try:
        fx.refresh_from_ecb(conn)
    except Exception:  # noqa: BLE001 - prices are shown without conversion when rates are missing
        logging.getLogger(__name__).info("Exchange rates not refreshed", exc_info=True)


def run_supply_poll_job(context: Any) -> Any:
    """Job handler: search for new listings, then ask about the ones that are due."""

    from app.services.job_runtime import JobResult

    connector_id = str(context.payload["connector_id"])
    connectors = ConnectorService()
    context.progress(stage="supply-discover", message="Searching for listings", percent=10, force=True)
    found = Discoverer(connectors).run(connector_id)
    context.progress(stage="supply-poll", message="Reading stock and prices", percent=50, force=True)
    polled = Poller(connectors).poll_connector(connector_id)
    with connectors.store.connection() as conn:
        _refresh_rates(conn)
        _snapshot_market(conn)
        compacted = retention.compact_samples(conn, datetime.now(timezone.utc))
    # Outside the connection above: fetching a file can take a while.
    _check_datasheets(connectors.store)
    details_stopped = _read_details(connectors, connector_id)
    details: Mapping[str, Any] = {
        "searched": found.searched, "listings_found": found.listings, "discovery_stopped": found.stopped,
        "calls": polled.calls, "polled": polled.polled, "gone": polled.gone, "poll_stopped": polled.stopped,
        "samples_compacted": compacted, "details_stopped": details_stopped,
    }
    return JobResult(
        message=f"Searched {found.searched} part(s), polled {polled.polled} listing(s)",
        details=details,
    )

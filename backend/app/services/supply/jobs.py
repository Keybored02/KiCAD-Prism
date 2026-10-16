"""The supply job: discover and poll one connector. And the scan that queues it.

``schedule_due_supply_jobs`` runs from prism-worker every minute. It finds the
connectors with work to do and queues one job each. The artifact key makes the
job system keep at most one per connector queued or running, so a slow
provider cannot pile up jobs.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Mapping

from app.core.config import settings
from app.services.supply import (
    accounts, datasheets, details, fx, ledger, market, notice_files, notice_parse, oneoff, project_bom, project_supply, quota, retention,
    schedule_settings, tracking, worker_seen,
)
from app.services.supply.connectors import ConnectorService
from app.services.supply.discoverer import DUE_SEARCH, Discoverer, cutoffs
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
    account = accounts.resolve(conn, row["id"])
    state = ledger.get_state(
        conn, account.ledger_id, daily_budget=account.daily_budget, reserve_pct=account.reserve_pct, now=now,
        reset_time=account.reset_time, reset_tz=account.reset_tz,
    )
    day = quota.provider_day(now, account.reset_time, account.reset_tz)
    return quota.background_allowance(
        state, now, reset_time=account.reset_time, tz=account.reset_tz,
        delay_seconds=quota.start_delay_seconds(account.ledger_id, day),
    ) > 0


def _has_spare(conn, row, now: datetime) -> bool:
    """Whether a connector has spare budget to spend right now (see ``quota.spare_allowance``)."""

    try:
        if not registry.get_spec(row["provider"]).metered:
            return False
    except registry.UnknownProvider:
        return False
    account = accounts.resolve(conn, row["id"])
    state = ledger.get_state(
        conn, account.ledger_id, daily_budget=account.daily_budget, reserve_pct=account.reserve_pct, now=now,
        reset_time=account.reset_time, reset_tz=account.reset_tz,
    )
    week = schedule_settings.work_week(schedule_settings.load(conn))
    return quota.spare_allowance(state, now, week, reset_time=account.reset_time, tz=account.reset_tz) > 0


def _has_pool_or_spare(conn, row, now: datetime) -> bool:
    """Whether the pool has a call left, or spare budget is open, for a check someone asked for once."""

    try:
        if not registry.get_spec(row["provider"]).metered:
            return True
    except registry.UnknownProvider:
        return False
    account = accounts.resolve(conn, row["id"])
    state = ledger.get_state(
        conn, account.ledger_id, daily_budget=account.daily_budget, reserve_pct=account.reserve_pct, now=now,
        reset_time=account.reset_time, reset_tz=account.reset_tz,
    )
    return quota.interactive_allowance(state) > 0 or _has_spare(conn, row, now)


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
        AND NOT (c.provider = ANY(%(needs_terms)s) AND c.terms_reviewed_at IS NULL)
    """
    due = conn.execute(
        f"""
        SELECT DISTINCT l.connector_id AS id FROM listings l
        JOIN part_tiers pt ON pt.part_id = l.part_id
        JOIN connectors c ON c.id = l.connector_id
        LEFT JOIN admissions a ON a.part_id = l.part_id AND a.connector_id = l.connector_id
        LEFT JOIN packaging_picks pk ON pk.part_id = l.part_id AND pk.connector_id = l.connector_id
        LEFT JOIN poll_state ps ON ps.listing_id = l.id
        WHERE l.match_state IN ('exact', 'manual') AND {active}
          AND (a.state = 'admitted' OR c.provider = ANY(%(free)s))
          AND (pk.listing_id IS NULL OR pk.listing_id = l.id)
          AND (ps.listing_id IS NULL OR ps.next_poll_at <= %(now)s)
        """,
        {"now": now, **cutoffs(now)},
    ).fetchall()
    unsearched = conn.execute(
        f"""
        SELECT DISTINCT c.id, c.provider FROM connectors c
        CROSS JOIN part_tiers pt
        LEFT JOIN admissions a ON a.part_id = pt.part_id AND a.connector_id = c.id
        LEFT JOIN discovery_runs d ON d.part_id = pt.part_id AND d.connector_id = c.id
        WHERE {active} AND ({DUE_SEARCH})
        """,
        {"now": now, **cutoffs(now)},
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
    funded = conn.execute(
        "SELECT id, provider, daily_budget, interactive_reserve_pct FROM connectors WHERE id = ANY(%s)", (ids,)
    ).fetchall()
    result = {row["id"] for row in funded if _has_budget(conn, row, now)}
    # Parts waiting for room, and tier-2 parts that could be read early, are work for spare budget.
    spare = conn.execute(
        f"""
        SELECT DISTINCT c.id, c.provider, c.daily_budget, c.interactive_reserve_pct FROM connectors c
        WHERE {active} AND c.id <> ALL(%(known)s) AND (
            EXISTS (SELECT 1 FROM admissions a WHERE a.connector_id = c.id AND a.state = 'waiting')
            OR EXISTS (SELECT 1 FROM admissions a JOIN part_tiers pt ON pt.part_id = a.part_id
                       WHERE a.connector_id = c.id AND a.state = 'admitted' AND pt.tier = 2))
        """,
        {"now": now, "known": sorted(result), **{"needs_terms": cutoffs(now)["needs_terms"]}},
    ).fetchall()
    result |= {row["id"] for row in spare if _has_spare(conn, row, now)}
    # Checks someone asked for once: served from the pool, then from spare budget.
    wanted = [cid for cid in oneoff.pending_connectors(conn) if cid not in result]
    if wanted:
        for row in conn.execute(
            f"SELECT c.id, c.provider, c.daily_budget, c.interactive_reserve_pct FROM connectors c WHERE {active} AND c.id = ANY(%(ids)s)",
            {"now": now, "ids": wanted, "needs_terms": cutoffs(now)["needs_terms"]},
        ).fetchall():
            if _has_pool_or_spare(conn, row, now):
                result.add(row["id"])
    return sorted(result)


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
        worker_seen.record(conn, moment)
        connector_ids = connectors_with_work(conn, moment)
    # One job per account: connectors on the same credentials are one caller to the provider, so they take turns.
    by_account: dict[str, list[str]] = {}
    with store.connection() as conn:
        for connector_id in connector_ids:
            by_account.setdefault(accounts.resolve(conn, connector_id).ledger_id, []).append(connector_id)
    queued = []
    for ledger_id, members in by_account.items():
        queued.append(job_service.enqueue(
            POLL_JOB_KIND,
            {"connector_id": members[0], **({"connector_ids": members} if len(members) > 1 else {})},
            worker_pool="prism",
            artifact_key=artifact_key(ledger_id),
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


def _keep_notice_files(store: SupplyStore) -> None:
    """Keep a copy of a couple of notice PDFs. Best effort: a failure is recorded against the notice, never the job."""

    try:
        notice_files.run_due(store)
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).info("Notice files not kept", exc_info=True)
    try:
        notice_parse.run_due(store)
    except Exception:  # noqa: BLE001 - what is read is a suggestion; the notice does not depend on it
        logging.getLogger(__name__).info("Notice files not read", exc_info=True)


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


def _snapshot_costs(conn) -> None:
    """Store today's BOM cost of each tracked project once. Best effort."""

    try:
        with conn.transaction():
            project_supply.snapshot_costs(conn, datetime.now(timezone.utc))
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).info("BOM costs not stored", exc_info=True)


def _refresh_rates(conn) -> None:
    """Keep the exchange rates fresh. Best effort: with no route to the ECB, rates stay as they were."""

    try:
        fx.refresh_from_ecb(conn)
    except Exception:  # noqa: BLE001 - prices are shown without conversion when rates are missing
        logging.getLogger(__name__).info("Exchange rates not refreshed", exc_info=True)


COMPONENT_SYNC_EVERY = 3600.0
_component_sync_at: float | None = None


def _sync_component_watches(conn, force: bool = False) -> None:
    """Watch the parts of watched components, so alternates approved elsewhere are picked up. Best effort.

    Once an hour per process: approving a source and setting a component watch already sync at once.
    """

    global _component_sync_at
    if not force and _component_sync_at is not None and time.monotonic() - _component_sync_at < COMPONENT_SYNC_EVERY:
        return
    _component_sync_at = time.monotonic()
    try:
        from app.services.supply import catalog_read, component_watches

        with conn.transaction():
            component_watches.sync_all(conn, catalog_read.identities)
    except Exception:  # noqa: BLE001 - the catalog may be unavailable; the next job tries again
        logging.getLogger(__name__).info("Component watches not synced", exc_info=True)


def _refresh_project_boms(conn) -> None:
    """Read tracked projects' BOMs again and queue the index of a new revision (``project_bom.py``). Best effort."""

    try:
        with conn.transaction():
            project_bom.refresh_tracked(conn, datetime.now(timezone.utc))
    except Exception:  # noqa: BLE001 - the project files may be unavailable; the next job tries again
        logging.getLogger(__name__).info("Project BOMs not refreshed", exc_info=True)


def _sync_tracking(conn) -> None:
    """Add the parts a tracked project's newest BOM brought, and keep the tiers in line. Best effort."""

    try:
        with conn.transaction():
            tracking.sync_projects(conn)
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).info("Tracking not synced", exc_info=True)


def _spend_spare(
    connectors: ConnectorService, connector_id: str, *, poller: Poller | None = None, discoverer: Discoverer | None = None
) -> None:
    """Use budget that would otherwise go unused, once all committed work is done. In order: searches and reads for parts
    waiting for room, then tier-2 parts ahead of their time. Best effort, and each stops where the spare allowance does."""

    try:
        with connectors.store.connection() as conn:
            kinds = [kind for kind, on in schedule_settings.load(conn)["spare"].items() if on]
        poller = poller or Poller(connectors)
        discoverer = discoverer or Discoverer(connectors)
        if "waiting" in kinds:
            discoverer.run(connector_id, waiting=True)
            poller.poll_connector(connector_id, spare="waiting")
        if "tier2_early" in kinds:
            poller.poll_connector(connector_id, spare="tier2_early")
        if "notices" in kinds:
            details.run_spare(connectors, connector_id)
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).info("Spare work not done", exc_info=True)


def run_supply_poll_job(context: Any) -> Any:
    """Job handler: search for new listings, then ask about the ones that are due."""

    from app.services.job_runtime import JobResult

    connector_ids = [str(item) for item in context.payload.get("connector_ids") or [context.payload["connector_id"]]]
    connectors = ConnectorService()
    try:
        connectors.refresh_account_keys()
    except Exception:  # noqa: BLE001 - a stale key only splits a shared budget; the poll goes on
        logging.getLogger(__name__).info("Account keys not refreshed", exc_info=True)
    searched = listings = calls = polled_count = gone = 0
    discovery_stopped = poll_stopped = None
    for connector_id in connector_ids:
        context.progress(stage="supply-discover", message="Searching for listings", percent=10, force=True)
        found = Discoverer(connectors).run(connector_id)
        context.progress(stage="supply-poll", message="Reading stock and prices", percent=50, force=True)
        polled = Poller(connectors).poll_connector(connector_id)
        try:
            oneoff.run(Discoverer(connectors), Poller(connectors), connectors.store, connector_id)
        except Exception:  # noqa: BLE001 - a check that fails is tried again; it never fails the job
            logging.getLogger(__name__).info("Check once not served", exc_info=True)
        if polled.stopped in (None, "nothing_due"):
            _spend_spare(connectors, connector_id)
        searched, listings = searched + found.searched, listings + found.listings
        calls, polled_count, gone = calls + polled.calls, polled_count + polled.polled, gone + polled.gone
        discovery_stopped, poll_stopped = found.stopped, polled.stopped
    with connectors.store.connection() as conn:
        _refresh_rates(conn)
        _snapshot_market(conn)
        _snapshot_costs(conn)
        _sync_component_watches(conn)
        _refresh_project_boms(conn)
        _sync_tracking(conn)
        compacted = retention.compact_samples(conn, datetime.now(timezone.utc))
        retention.drop_expired(conn, datetime.now(timezone.utc))
        retention.trim_summaries(conn)
    # Outside the connection above: fetching a file can take a while.
    _check_datasheets(connectors.store)
    _keep_notice_files(connectors.store)
    details_stopped = [_read_details(connectors, connector_id) for connector_id in connector_ids][-1]
    details: Mapping[str, Any] = {
        "searched": searched, "listings_found": listings, "discovery_stopped": discovery_stopped,
        "calls": calls, "polled": polled_count, "gone": gone, "poll_stopped": poll_stopped,
        "samples_compacted": compacted, "details_stopped": details_stopped,
    }
    return JobResult(
        message=f"Searched {searched} part(s), polled {polled_count} listing(s)",
        details=details,
    )

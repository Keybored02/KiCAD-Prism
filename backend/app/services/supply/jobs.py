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
    accounts, dashboard, details, forecast_run, fx, ledger, market, notice_budget, oauth, oneoff, packaging_auto, part_insights, project_bom, project_supply, quota, retention,
    schedule_settings, substitutes, tracking,
)
from app.services.supply.connectors import ConnectorService
from app.services.supply.discoverer import DUE_SEARCH, Discoverer, cutoffs
from app.services.supply.poller import Poller
from app.services.supply.providers import registry
from app.services.supply.providers.base import CAP_PCN, CAP_SEARCH, CAP_SUBSTANCES
from app.services.supply.store import SupplyStore, supply_store

POLL_JOB_KIND = "supply_poll"
SUPPLY_RESOURCE = "supply"
# Leave a slot for everything else on a small worker, as the tracker scheduler does.
SUPPLY_RESOURCE_CAPACITY = min(2, max(1, settings.PRISM_WORKER_CONCURRENCY - 1))
SUPPLY_PRIORITY = 200
SCAN_SECONDS = 60
# Housekeeping runs from the scanner too, so it goes on when every budget is used up and no poll job is queued.
HOUSEKEEPING_EVERY = 600
_housekeeping_at: float | None = None
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
        {"now": now, "known": sorted(result)},
    ).fetchall()
    result |= {row["id"] for row in spare if _has_spare(conn, row, now)}
    # Notices and substances come due on their own: a connector with some is work whatever its reads are doing.
    result |= _connectors_with_details(conn, now, result)
    # Checks someone asked for once: served from the pool, then from spare budget.
    wanted = [cid for cid in oneoff.pending_connectors(conn) if cid not in result]
    if wanted:
        for row in conn.execute(
            f"SELECT c.id, c.provider, c.daily_budget, c.interactive_reserve_pct FROM connectors c WHERE {active} AND c.id = ANY(%(ids)s)",
            {"now": now, "ids": wanted},
        ).fetchall():
            if _has_pool_or_spare(conn, row, now):
                result.add(row["id"])
    return sorted(result)


def _connectors_with_details(conn, now: datetime, known: set[str]) -> set[str]:
    """Active connectors not already queued that have notices or substances due. A provider with a quota of its own for notices
    (DigiKey) is gated by that quota and a person's sign-in; one without is gated by the product budget."""

    found: set[str] = set()
    rows = conn.execute(
        "SELECT id, provider, daily_budget, interactive_reserve_pct FROM connectors c "
        "WHERE c.enabled AND c.paused_reason = '' AND (c.cooldown_until IS NULL OR c.cooldown_until <= %s)", (now,)
    ).fetchall()
    for row in rows:
        if row["id"] in known:
            continue
        try:
            spec = registry.get_spec(row["provider"])
        except registry.UnknownProvider:
            continue
        kinds = [kind for capability, kind in ((CAP_PCN, "notices"), (CAP_SUBSTANCES, "substances")) if capability in spec.capabilities]
        if not kinds:
            continue
        if spec.notice_daily_limit and spec.metered:
            if not oauth.status(conn, row["id"], now)["signed_in"]:
                continue
            if not notice_budget.allowed(conn, row["id"], spec.notice_daily_limit, now, interactive=False, spare=False, news=False):
                continue
        elif not _has_budget(conn, row, now):
            continue
        if any(details.due(conn, row["id"], kind, now, 1) for kind in kinds):
            found.add(row["id"])
    return found


def housekeeping(store: SupplyStore) -> int:
    """Work that needs no distributor call: exchange rates, snapshots, component watches, tracked projects' BOMs, tracking
    and retention. Returns the samples compacted."""

    with store.connection() as conn:
        _refresh_rates(conn)
        _snapshot_market(conn)
        _snapshot_costs(conn)
        _snapshot_figures(conn)
        _sync_component_watches(conn)
        _refresh_project_boms(conn)
        _sync_tracking(conn)
        _pick_packagings(conn)
        _renew_insights(conn)
        compacted = retention.compact_samples(conn, datetime.now(timezone.utc))
        retention.drop_expired(conn, datetime.now(timezone.utc))
        retention.trim_summaries(conn)
    return compacted


def _housekeeping_if_due(store: SupplyStore) -> None:
    global _housekeeping_at
    if _housekeeping_at is not None and time.monotonic() - _housekeeping_at < HOUSEKEEPING_EVERY:
        return
    _housekeeping_at = time.monotonic()
    try:
        housekeeping(store)
    except Exception:  # noqa: BLE001 - the next scan tries again; it never stops the scanner
        logging.getLogger(__name__).info("Housekeeping failed", exc_info=True)


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
    _housekeeping_if_due(store)
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


def _read_details(connectors: ConnectorService, connector_id: str) -> str | None:
    """Read a few due change notices or substance lists. Best effort: a failure is recorded per listing, never the job."""

    try:
        stopped = details.run(connectors, connector_id).stopped
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).info("Distributor details not read", exc_info=True)
        return "error"
    try:
        substitutes.run_due(connectors, connector_id)
    except Exception:  # noqa: BLE001 - substitutes are a favour; the notices and the job do not depend on them
        logging.getLogger(__name__).info("Substitutes not asked for", exc_info=True)
    return stopped


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


def _pick_packagings(conn) -> None:
    """Pick a packaging for tracked parts that have several listings and no pick, by what their projects buy for. Best effort."""

    try:
        with conn.transaction():
            packaging_auto.auto_pick(conn)
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).info("Packagings not picked", exc_info=True)


def _snapshot_figures(conn) -> None:
    """Store the Dashboard's figures once a day, so each can show how it moved. Best effort."""

    try:
        with conn.transaction():
            dashboard.snapshot_figures(conn)
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).info("Figures not stored", exc_info=True)


def _renew_insights(conn) -> None:
    """Keep the facts the Dashboard and Insights list for each tracked part (no distributor call). Best effort."""

    try:
        with conn.transaction():
            part_insights.renew(conn)
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).info("Insights not renewed", exc_info=True)
    try:
        with conn.transaction():
            forecast_run.run_checks(conn)
    except Exception:  # noqa: BLE001 - checking forecasts is a favour; nothing else depends on it
        logging.getLogger(__name__).info("Forecasts not checked", exc_info=True)


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
    details_stopped = [_read_details(connectors, connector_id) for connector_id in connector_ids][-1]
    details: Mapping[str, Any] = {
        "searched": searched, "listings_found": listings, "discovery_stopped": discovery_stopped,
        "calls": calls, "polled": polled_count, "gone": gone, "poll_stopped": poll_stopped,
        "details_stopped": details_stopped,
    }
    return JobResult(
        message=f"Searched {searched} part(s), polled {polled_count} listing(s)",
        details=details,
    )

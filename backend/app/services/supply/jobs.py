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

from app.services.job_kinds import SUPPLY_RESOURCE, JobKind
from app.services.supply import (
    accounts, budget, demand, details, ledger, library_match, notice_budget, oauth, oneoff, quota, schedule_settings, substitutes, tasks,
)
from app.services.supply.connectors import ConnectorService
from app.services.supply.discoverer import DUE_SEARCH, Discoverer, cutoffs, pending_waiting
from app.services.supply.poller import GROUP_LISTINGS, MAX_BATCHES_PER_RUN, Poller, due_listings, hold_back, spare_listings, with_siblings
from app.services.supply.providers import registry
from app.services.supply.providers.base import CAP_PCN, CAP_SEARCH, CAP_SUBSTANCES
from app.services.supply.store import SupplyStore, supply_store

POLL_JOB_KIND = "supply_poll"
TASKS_JOB_KIND = "supply_tasks"
# One tasks job at a time.
TASKS_ARTIFACT = "supply:tasks"
SUPPLY_PRIORITY = 200
SCAN_SECONDS = 60
# Housekeeping runs from the scanner too, so it goes on when every budget is used up and no poll job is queued.
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


def refresh_scheduled(conn, connector_id: str, now: datetime) -> None:
    """Work out what the account's scheduled work still needs today and keep it for spare spending to leave alone."""

    account = accounts.resolve(conn, connector_id)
    ledger.store_scheduled(
        conn, account.ledger_id, now, demand.scheduled_rest(conn, account, now), reset_time=account.reset_time, reset_tz=account.reset_tz
    )


def _has_spare(conn, row, now: datetime) -> bool:
    """Whether a connector has free calls to spend right now (see ``quota.free_allowance``). The figure for scheduled work is
    worked out again when it is more than 5 minutes old."""

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
    day = quota.provider_day(now, account.reset_time, account.reset_tz)
    kept = conn.execute("SELECT scheduled_at FROM supply_quota_ledger WHERE account_id = %s AND day = %s", (account.ledger_id, day)).fetchone()
    if kept is None or kept["scheduled_at"] is None or now - kept["scheduled_at"] > timedelta(minutes=5):
        refresh_scheduled(conn, row["id"], now)
    ledger_row = conn.execute(
        "SELECT scheduled_rest, scheduled_at, spare_hour, spare_hour_spent FROM supply_quota_ledger WHERE account_id = %s AND day = %s",
        (account.ledger_id, day),
    ).fetchone()
    return ledger.free_calls(conn, account.ledger_id, state, ledger_row, now, reset_time=account.reset_time, reset_tz=account.reset_tz) > 0


def _spare_work_due(conn, row, now: datetime, kinds: list[str]) -> bool:
    """Whether a connector has spare work that is due, for the kinds switched on: a part waiting for room that is due a search or a read,
    a tier-2 listing old enough to read early, a notice to read, a library part to match. Each is a single-row look. Late committed reads (``overdue``) are not
    asked here: the main "due" query queues them already."""

    cid = row["id"]
    if "waiting" in kinds and (pending_waiting(conn, cid, now, 1) or spare_listings(conn, cid, now, 1, "waiting")):
        return True
    if "tier2_early" in kinds and spare_listings(conn, cid, now, 1, "tier2_early"):
        return True
    try:
        has_notices = CAP_PCN in registry.get_spec(row["provider"]).capabilities
    except registry.UnknownProvider:
        return False
    if "notices" in kinds and has_notices and details.due(conn, cid, "notices", now, 1, untracked=True):
        return True
    return "library" in kinds and bool(library_match.pending(conn, cid, row["provider"], now, 1))


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
        SELECT DISTINCT l.connector_id AS id FROM supply_listings l
        JOIN supply_part_tiers pt ON pt.part_id = l.part_id
        JOIN supply_connectors c ON c.id = l.connector_id
        LEFT JOIN supply_admissions a ON a.part_id = l.part_id AND a.connector_id = l.connector_id
        LEFT JOIN supply_packaging_picks pk ON pk.part_id = l.part_id AND pk.connector_id = l.connector_id AND c.provider = ANY(%(limited)s)
        LEFT JOIN supply_poll_state ps ON ps.listing_id = l.id
        WHERE supply_counted(l.match_state) AND {active}
          AND (a.state = 'admitted' OR c.provider = ANY(%(free)s))
          AND (pk.listing_id IS NULL OR pk.listing_id = l.id OR ps.listing_id IS NULL)
          AND (ps.listing_id IS NULL OR ps.next_poll_at <= %(now)s)
        """,
        {"now": now, "limited": budget.providers_limited_by_picks(), **cutoffs(now)},
    ).fetchall()
    unsearched = conn.execute(
        f"""
        SELECT DISTINCT c.id, c.provider FROM supply_connectors c
        CROSS JOIN supply_part_tiers pt
        LEFT JOIN supply_admissions a ON a.part_id = pt.part_id AND a.connector_id = c.id
        LEFT JOIN supply_discovery_runs d ON d.part_id = pt.part_id AND d.connector_id = c.id
        WHERE {active} AND ({DUE_SEARCH})
        """,
        {"now": now, **cutoffs(now)},
    ).fetchall()

    ids = [row["id"] for row in due if not _all_held(conn, row["id"], now)]
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
        "SELECT id, provider FROM supply_connectors WHERE id = ANY(%s)", (ids,)
    ).fetchall()
    result = {row["id"] for row in funded if _has_budget(conn, row, now)}
    # Parts waiting for room, and tier-2 parts that could be read early, are work for spare budget: a connector is queued for it only
    # when some of it is due and free calls are open.
    kinds = [kind for kind, on in schedule_settings.load(conn)["spare"].items() if on]
    spare = conn.execute(
        f"""
        SELECT c.id, c.provider FROM supply_connectors c
        WHERE {active} AND c.id <> ALL(%(known)s)
        """,
        {"now": now, "known": sorted(result)},
    ).fetchall() if kinds else []
    result |= {row["id"] for row in spare if _spare_work_due(conn, row, now, kinds) and _has_spare(conn, row, now)}
    # Notices and substances come due on their own: a connector with some is work whatever its reads are doing.
    result |= _connectors_with_details(conn, now, result)
    # Checks someone asked for once: served from the pool, then from spare budget.
    wanted = [cid for cid in oneoff.pending_connectors(conn) if cid not in result]
    if wanted:
        for row in conn.execute(
            f"SELECT c.id, c.provider FROM supply_connectors c WHERE {active} AND c.id = ANY(%(ids)s)",
            {"now": now, "ids": wanted},
        ).fetchall():
            if _has_pool_or_spare(conn, row, now):
                result.add(row["id"])
    return sorted(result)


def _all_held(conn, connector_id: str, now: datetime) -> bool:
    """Whether everything due at a connector is kept back to fill a batch, so a job would only report "nothing due". Asks the poller's
    own rule (``poller.hold_back``) over the listings it would read, for a provider that batches."""

    row = conn.execute(
        "SELECT c.provider, a.reset_time, a.reset_tz FROM supply_connectors c JOIN supply_accounts a ON a.id = c.account_id WHERE c.id = %s",
        (connector_id,),
    ).fetchone()
    if row is None:
        return False
    try:
        spec = registry.get_spec(row["provider"])
    except registry.UnknownProvider:
        return False
    if spec.max_batch <= 1:
        return False
    limit = (GROUP_LISTINGS * spec.max_batch if spec.groups_by_part else spec.max_batch) * MAX_BATCHES_PER_RUN
    due = due_listings(conn, connector_id, now, limit, metered=spec.metered)
    if not due:
        return False
    if spec.groups_by_part:
        due = with_siblings(conn, connector_id, due)
    batches, _held = hold_back(due, spec, now, (row["reset_time"], row["reset_tz"]))
    return not batches


def _connectors_with_details(conn, now: datetime, known: set[str]) -> set[str]:
    """Active connectors not already queued that have notices or substances due. A provider with a quota of its own for notices
    (DigiKey) is gated by that quota and a person's sign-in; one without is gated by the product budget."""

    found: set[str] = set()
    rows = conn.execute(
        "SELECT id, provider FROM supply_connectors c "
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
        tasks_due = bool(tasks.due(conn, moment))
    queued = []
    if tasks_due:
        queued.append(job_service.enqueue(
            TASKS_JOB_KIND, {}, worker_pool="prism", artifact_key=TASKS_ARTIFACT, priority=SUPPLY_PRIORITY,
            requested_by=SYSTEM_REQUESTER, max_attempts=1,
        ))
    # One job per account: connectors on the same credentials are one caller to the provider, so they take turns.
    by_account: dict[str, list[str]] = {}
    with store.connection() as conn:
        for connector_id in connector_ids:
            by_account.setdefault(accounts.resolve(conn, connector_id).ledger_id, []).append(connector_id)
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
        logging.getLogger(__name__).warning("Distributor details not read", exc_info=True)
        return "error"
    try:
        substitutes.run_due(connectors, connector_id)
    except Exception:  # noqa: BLE001 - substitutes are a favour; the notices and the job do not depend on them
        logging.getLogger(__name__).warning("Substitutes not asked for", exc_info=True)
    return stopped


def _spend_spare(
    connectors: ConnectorService, connector_id: str, *, poller: Poller | None = None, discoverer: Discoverer | None = None
) -> tuple[int, int]:
    """Use budget that would otherwise go unused, once all committed work is done. In order: searches and reads for parts
    late committed reads, then those waiting for room, then tier-2 parts ahead of their time, then notices, then the library pass. Best effort, and each stops where the spare allowance does.
    Returns the calls it spent and the listings it read."""

    calls = listings = 0

    try:
        with connectors.store.connection() as conn:
            kinds = [kind for kind, on in schedule_settings.load(conn)["spare"].items() if on]
        poller = poller or Poller(connectors)
        discoverer = discoverer or Discoverer(connectors)
        # Late committed reads come first, whatever the switches say: they are work the budget promised.
        late = poller.poll_connector(connector_id, spare="overdue")
        calls, listings = late.calls, late.polled
        if "waiting" in kinds:
            calls += discoverer.run(connector_id, waiting=True).searched
            waiting = poller.poll_connector(connector_id, spare="waiting")
            calls, listings = calls + waiting.calls, listings + waiting.polled
        if "tier2_early" in kinds:
            early = poller.poll_connector(connector_id, spare="tier2_early")
            calls, listings = calls + early.calls, listings + early.polled
        if "notices" in kinds:
            calls += details.run_spare(connectors, connector_id).read
        if "library" in kinds:
            calls += discoverer.run(connector_id, library=True).searched
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).warning("Spare work not done", exc_info=True)
    return calls, listings


def run_supply_poll_job(context: Any) -> Any:
    """Job handler: ask about the listings that are due, then search for new ones, so a big project's first searches never hold back the
    day's reads."""

    from app.services.job_runtime import JobResult

    connector_ids = [str(item) for item in context.payload.get("connector_ids") or [context.payload["connector_id"]]]
    connectors = ConnectorService()
    searched = listings = calls = polled_count = gone = spare_calls = holding = 0
    discovery_stopped = poll_stopped = None
    for connector_id in connector_ids:
        try:
            with connectors.store.connection() as conn:
                refresh_scheduled(conn, connector_id, datetime.now(timezone.utc))
        except Exception:  # noqa: BLE001 - without the figure no call counts as free; the job's own work goes on
            logging.getLogger(__name__).warning("Scheduled work not counted", exc_info=True)
        context.progress(stage="supply-poll", message="Reading stock and prices", percent=10, force=True)
        polled = Poller(connectors).poll_connector(connector_id)
        context.progress(stage="supply-discover", message="Searching for listings", percent=50, force=True)
        found = Discoverer(connectors).run(connector_id)
        try:
            oneoff.run(Discoverer(connectors), Poller(connectors), connectors.store, connector_id)
        except Exception:  # noqa: BLE001 - a check that fails is tried again; it never fails the job
            logging.getLogger(__name__).warning("Check once not served", exc_info=True)
        if polled.stopped in (None, "nothing_due", "budget"):
            try:
                with connectors.store.connection() as conn:
                    refresh_scheduled(conn, connector_id, datetime.now(timezone.utc))
            except Exception:  # noqa: BLE001
                logging.getLogger(__name__).warning("Scheduled work not counted", exc_info=True)
            spare_calls += _spend_spare(connectors, connector_id)[0]
        searched, listings = searched + found.searched, listings + found.listings
        calls, polled_count, gone, holding = calls + polled.calls, polled_count + polled.polled, gone + polled.gone, holding + polled.holding
        discovery_stopped, poll_stopped = found.stopped, polled.stopped
    details_stopped = [_read_details(connectors, connector_id) for connector_id in connector_ids][-1]
    if polled_count:
        tasks.run_one(connectors.store, "rollups", force=True)
    details: Mapping[str, Any] = {
        "searched": searched, "listings_found": listings, "discovery_stopped": discovery_stopped,
        "calls": calls, "spare_calls": spare_calls, "polled": polled_count, "gone": gone, "holding": holding, "poll_stopped": poll_stopped,
        "details_stopped": details_stopped,
    }
    return JobResult(
        message=f"Searched {searched} part(s), polled {polled_count} listing(s)",
        details=details,
    )


def run_supply_tasks_job(context: Any) -> Any:
    """Job handler: the periodic tasks that are due (``tasks.py``), each in its own transaction."""

    from app.services.job_runtime import JobResult

    outcome = tasks.run_due(supply_store)
    failed = sorted(name for name, worked in outcome.items() if not worked)
    return JobResult(message=f"Ran {len(outcome)} supply task(s)", details={"ran": sorted(outcome), "failed": failed})


JOB_KINDS = (
    JobKind(POLL_JOB_KIND, run_supply_poll_job, resources={SUPPLY_RESOURCE: 1}, priority=SUPPLY_PRIORITY, max_attempts=2),
    JobKind(TASKS_JOB_KIND, run_supply_tasks_job, priority=SUPPLY_PRIORITY, max_attempts=1),
)

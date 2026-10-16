"""Details a distributor gives on request, one listing at a time: change notices (DigiKey) and substances (Mouser).

They change rarely and each costs a call, so each is read once per part, from one of its listings (the picked one, else
the first): notices weekly for tier-1 and tier-2 parts, substances monthly for tier-1 parts only. Notices of parts nobody
tracks are read only from spare budget, at most weekly. A few per poll job, within the connector's daily budget and after
its polling. A failure is recorded against the listing and tried again the next turn; it never pauses the connector. A
rate limit or an outage stops the pass for this run.

DigiKey notices need a person's sign-in (``oauth.py``); without one the pass skips them and says so. Notices are
kept in ``pcns`` through ``pcn.record_external``. Mouser's substance list is kept as the ``reach_svhc`` fact, and the
CAS numbers it names (or Candidate List names it uses) become declarations from Mouser, so the ``reach_svhc`` check
reads them like any declaration.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from app.services.supply import accounts, alerts, compliance, facts, ledger, oauth, pcn, quota, trouble, usage
from app.services.supply.providers import registry
from app.services.supply.providers.base import CAP_PCN, CAP_SUBSTANCES, AuthError, Blocked, ProviderError, RateLimited, Unavailable

# How often each kind is read for a part.
EVERY = {"notices": timedelta(days=7), "substances": timedelta(days=30)}
REDO_AFTER = EVERY["notices"]
MAX_PER_RUN = 5
# Of a notice API's own daily quota (``ProviderSpec.notice_daily_limit``), the share scheduled reads may use; the rest is
# kept for a person's Check notices.
NOTICE_SHARE = 0.9
NOTICE_QUOTA = "notice_quota"


@dataclass(frozen=True, slots=True)
class DetailsSummary:
    read: int = 0
    new: int = 0
    stopped: str | None = None


def due(conn, connector_id: str, kind: str, now: datetime, limit: int, *, untracked: bool = False) -> list[dict[str, Any]]:
    """One listing per part at the connector whose ``kind`` is due: not read for the part within its interval.

    Tracked parts are those admitted at this connector (every part at a connector that costs nothing); substances only
    for tier 1. With ``untracked``, the parts nobody tracks that the connector has an offer for, for spare budget.
    """

    if untracked:
        rows = conn.execute(
            """
            SELECT DISTINCT ON (l.part_id) l.id, l.sku, l.part_id, l.raw_manufacturer, 2 AS tier
            FROM listings l
            JOIN offers o ON o.listing_id = l.id
            WHERE l.connector_id = %(connector)s AND l.match_state IN ('exact', 'manual')
              AND NOT EXISTS (SELECT 1 FROM part_tiers pt WHERE pt.part_id = l.part_id)
              AND NOT EXISTS (
                  SELECT 1 FROM detail_checks d JOIN listings l2 ON l2.id = d.listing_id
                  WHERE l2.part_id = l.part_id AND l2.connector_id = l.connector_id AND d.kind = %(kind)s AND d.checked_at > %(since)s)
            ORDER BY l.part_id, l.sku
            LIMIT %(limit)s
            """,
            {"connector": connector_id, "kind": kind, "since": now - EVERY[kind], "limit": limit},
        ).fetchall()
        return [dict(row) for row in rows]
    rows = conn.execute(
        """
        SELECT * FROM (
            SELECT DISTINCT ON (l.part_id) l.id, l.sku, l.part_id, l.raw_manufacturer, pt.tier,
                   (SELECT MAX(d.checked_at) FROM detail_checks d JOIN listings l2 ON l2.id = d.listing_id
                    WHERE l2.part_id = l.part_id AND l2.connector_id = l.connector_id AND d.kind = %(kind)s) AS last_checked
            FROM listings l
            JOIN part_tiers pt ON pt.part_id = l.part_id
            JOIN connectors c ON c.id = l.connector_id
            LEFT JOIN admissions a ON a.part_id = l.part_id AND a.connector_id = l.connector_id
            LEFT JOIN packaging_picks pk ON pk.part_id = l.part_id AND pk.connector_id = l.connector_id
            WHERE l.connector_id = %(connector)s AND l.match_state IN ('exact', 'manual')
              AND (a.state = 'admitted' OR c.provider = ANY(%(free)s))
              AND (%(kind)s <> 'substances' OR pt.tier = 1)
            ORDER BY l.part_id, (pk.listing_id = l.id) DESC NULLS LAST, l.sku
        ) per_part
        WHERE last_checked IS NULL OR last_checked <= %(since)s
        ORDER BY last_checked NULLS FIRST, sku
        LIMIT %(limit)s
        """,
        {
            "connector": connector_id, "kind": kind, "since": now - EVERY[kind], "limit": limit,
            "free": [spec.key for spec in registry.list_specs(include_dev=True) if not spec.metered],
        },
    ).fetchall()
    return [dict(row) for row in rows]


def _record(conn, listing_id: str, kind: str, now: datetime, status: str, *, failed: bool) -> None:
    conn.execute(
        """
        INSERT INTO detail_checks (listing_id, kind, checked_at, status, failures) VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (listing_id, kind) DO UPDATE SET checked_at = EXCLUDED.checked_at, status = EXCLUDED.status,
            failures = CASE WHEN %s THEN detail_checks.failures + 1 ELSE 0 END
        """,
        (listing_id, kind, now, status[:64], 1 if failed else 0, failed),
    )


def run(
    service,
    connector_id: str,
    *,
    now: datetime | None = None,
    provider: Any | None = None,
    token_for: Callable[..., str] = oauth.access_token,
    limit: int = MAX_PER_RUN,
) -> DetailsSummary:
    """Read the due notices and substances of one connector's listings."""

    now = now or datetime.now(timezone.utc)
    connector = service.get(connector_id)
    if not connector["enabled"] or connector["paused_reason"] or not connector["provider_available"]:
        return DetailsSummary(stopped="inactive")
    capabilities = registry.get_spec(connector["provider"]).capabilities
    if not capabilities & {CAP_PCN, CAP_SUBSTANCES}:
        return DetailsSummary()
    if trouble.cooling_down(service.store, connector_id, now):
        return DetailsSummary(stopped="cooling_down")
    if CAP_PCN in capabilities:
        return _notices(service, connector, now, provider, token_for, limit)
    return _substances(service, connector, now, provider, limit)


def _spend(
    service, connector, now: datetime, interactive: bool = False, *, kind: str = ledger.KIND_NOTICES, tier: int = 2, spare: bool = False
) -> bool:
    purpose = ledger.PURPOSE_INTERACTIVE if interactive else ledger.PURPOSE_SPARE if spare else f"tier{tier}"
    return not connector["metered"] or ledger.spend_call(
        service.store, connector, now=now, interactive=interactive, kind=kind, purpose=purpose, spare=spare
    )


def _notices_left(service, connector, now: datetime, interactive: bool) -> int | None:
    """Calls left today on a notice API with its own quota, or None when notices share the connector's budget. None left
    once the API has refused a call today: its count is the provider's, not Prism's."""

    allowed = registry.get_spec(connector["provider"]).notice_daily_limit
    if not allowed:
        return None
    with service.store.connection() as conn:
        account = accounts.resolve(conn, connector["id"])
        day = quota.provider_day(now, account.reset_time, account.reset_tz)
        row = conn.execute(
            "SELECT COALESCE(SUM(calls) FILTER (WHERE kind = %s), 0) AS used, "
            "COALESCE(SUM(calls) FILTER (WHERE kind = %s AND purpose = %s), 0) AS refused "
            "FROM call_counts WHERE connector_id = ANY(%s) AND day = %s",
            (ledger.KIND_NOTICES, ledger.KIND_REFUSED, ledger.KIND_NOTICES, list(account.members), day),
        ).fetchone()
    if row["refused"]:
        return 0
    return max(0, (allowed if interactive else int(allowed * NOTICE_SHARE)) - int(row["used"]))


def _notices(service, connector, now, provider, token_for, limit) -> DetailsSummary:
    with service.store.connection() as conn:
        rows = due(conn, connector["id"], "notices", now, limit)
    return _read_notices(service, connector, rows, now, provider, token_for)


def run_spare(
    service, connector_id: str, *, now: datetime | None = None, provider: Any | None = None,
    token_for: Callable[..., str] = oauth.access_token, limit: int = MAX_PER_RUN,
) -> DetailsSummary:
    """Read notices of parts nobody tracks, from spare budget only, at most weekly per part."""

    now = now or datetime.now(timezone.utc)
    connector = service.get(connector_id)
    if not connector["enabled"] or connector["paused_reason"] or not connector["provider_available"]:
        return DetailsSummary(stopped="inactive")
    if CAP_PCN not in registry.get_spec(connector["provider"]).capabilities or trouble.cooling_down(service.store, connector_id, now):
        return DetailsSummary()
    with service.store.connection() as conn:
        rows = due(conn, connector_id, "notices", now, limit, untracked=True)
    return _read_notices(service, connector, rows, now, provider, token_for, spare=True)


def _read_notices(service, connector, rows, now, provider, token_for, *, interactive: bool = False, spare: bool = False) -> DetailsSummary:
    """Read the notices of these listings of one connector, one call each."""

    connector_id = connector["id"]
    if not rows:
        return DetailsSummary()
    try:
        token = token_for(service, connector_id, now)
    except oauth.NotSignedIn:
        return DetailsSummary(stopped="not_signed_in")
    except (RateLimited, Unavailable, Blocked) as exc:
        trouble.react(service, service.store, connector_id, exc, now)
        return DetailsSummary(stopped=exc.code)
    except (ProviderError, oauth.SignInError):
        return DetailsSummary(stopped="unavailable")
    left = _notices_left(service, connector, now, interactive)
    if left == 0:
        return DetailsSummary(stopped=NOTICE_QUOTA)
    provider = provider or service.load_provider(connector_id)
    read = new = 0
    for row in rows:
        if left is not None and left <= 0:
            return DetailsSummary(read, new, NOTICE_QUOTA)
        if not _spend(service, connector, now, interactive, tier=row.get("tier", 2), spare=spare):
            return DetailsSummary(read, new, "budget")
        if left is not None:
            left -= 1
        try:
            notices = provider.change_notices(row["sku"], token)
        except AuthError:
            oauth.mark_refused(service.store, connector_id)
            return DetailsSummary(read, new, "sign_in_refused")
        except RateLimited as exc:
            if left is None:
                trouble.react(service, service.store, connector_id, exc, now)
                return DetailsSummary(read, new, exc.code)
            # The notice API's own quota is used up: notices wait for tomorrow, stock and prices go on.
            ledger.note_refusal(service.store, connector_id, now=now, purpose=ledger.KIND_NOTICES)
            return DetailsSummary(read, new, NOTICE_QUOTA)
        except (Unavailable, Blocked) as exc:
            trouble.react(service, service.store, connector_id, exc, now)
            return DetailsSummary(read, new, exc.code)
        except ProviderError as exc:
            with service.store.connection() as conn:
                _record(conn, row["id"], "notices", now, exc.code, failed=True)
            continue
        read += 1
        with service.store.connection() as conn:
            added = 0
            for notice in notices:
                key = pcn.external_key(notice.url, notice.kind_text, notice.description, notice.published_on)
                added += pcn.record_external(
                    conn, "digikey", key, row["part_id"], kind_text=notice.kind_text, description=notice.description,
                    notice_url=notice.url, published_on=notice.published_on,
                )
            _record(conn, row["id"], "notices", now, f"{len(notices)} notices", failed=False)
            if added:
                alerts.evaluate_parts(conn, [row["part_id"]], now)
        new += added
    return DetailsSummary(read, new)


ASK_ACTION = "part.check_notices"
ASK_COOLDOWN = timedelta(hours=1)


class TooSoon(ValueError):
    """The same person asked for this part's notices a short while ago."""


_ASK_STOPPED = {
    "not_signed_in": "needs an administrator to sign in at DigiKey (Supply > Connectors)",
    "sign_in_refused": "refused the sign-in; an administrator needs to sign in again",
    "budget": "has used today's allowance for asking",
    "rate_limited": "is limiting requests",
    NOTICE_QUOTA: "has used today's change-notice calls (its notice API allows a set number a day); try tomorrow",
    "unavailable": "did not answer",
    "inactive": "is disabled or paused",
    "cooling_down": "is cooling down after an error",
}


def check_now(
    service,
    part_id: str,
    actor: str,
    *,
    now: datetime | None = None,
    provider: Any | None = None,
    token_for: Callable[..., str] = oauth.access_token,
) -> dict[str, Any]:
    """Read the notices of one part now, at every connector that lists them, whatever the week's turn says.

    One call per listing, from the interactive reserve. A person may ask for the same part once an hour. The answer says
    how many listings were read, how many notices are new, and what stopped a connector.
    """

    from app.services.supply import parts
    from app.services.supply.audit import actor_text, write_audit

    actor = actor_text(actor)
    now = now or datetime.now(timezone.utc)
    store = service.store
    with store.connection() as conn:
        parts.get_part(conn, part_id)
        last = conn.execute(
            "SELECT MAX(at) AS at FROM audit_events WHERE action = %s AND subject_id = %s AND actor = %s", (ASK_ACTION, part_id, actor)
        ).fetchone()["at"]
        if last is not None and now - last < ASK_COOLDOWN:
            minutes = max(1, int((ASK_COOLDOWN - (now - last)).total_seconds() // 60) + 1)
            raise TooSoon(f"You checked this part's notices a moment ago. You can check again in {minutes} {'minute' if minutes == 1 else 'minutes'}.")
        listings = conn.execute(
            """
            SELECT l.id, l.sku, l.part_id, l.connector_id FROM listings l JOIN connectors c ON c.id = l.connector_id
            WHERE l.part_id = %s AND l.match_state IN ('exact', 'manual') ORDER BY l.connector_id, l.sku
            """,
            (part_id,),
        ).fetchall()
    by_connector: dict[str, list[dict[str, Any]]] = {}
    for row in listings:
        by_connector.setdefault(row["connector_id"], []).append(dict(row))
    read = new = checked = 0
    problems: list[dict[str, str]] = []
    for connector_id, rows in by_connector.items():
        connector = service.get(connector_id)
        if CAP_PCN not in registry.get_spec(connector["provider"]).capabilities:
            continue
        checked += 1
        if not connector["enabled"] or connector["paused_reason"]:
            summary = DetailsSummary(stopped="inactive")
        elif trouble.cooling_down(store, connector_id, now):
            summary = DetailsSummary(stopped="cooling_down")
        else:
            summary = _read_notices(service, connector, rows, now, provider, token_for, interactive=True)
        read += summary.read
        new += summary.new
        if summary.stopped:
            name = connector["display_name"]
            problems.append({"connector": name, "reason": f"{name} {_ASK_STOPPED.get(summary.stopped, 'could not be read')}."})
    if checked:
        with store.connection() as conn:
            write_audit(conn, actor, ASK_ACTION, part_id, {"read": read, "new": new}, subject_kind="part")
    return {"read": read, "new": new, "connectors": checked, "problems": problems}


def _substances(service, connector, now, provider, limit) -> DetailsSummary:
    connector_id = connector["id"]
    with service.store.connection() as conn:
        rows = due(conn, connector_id, "substances", now, limit)
    if not rows:
        return DetailsSummary()
    provider = provider or service.load_provider(connector_id)
    read = changed = 0
    for row in rows:
        if not _spend(service, connector, now, kind=ledger.KIND_SUBSTANCES, tier=row.get("tier", 1)):
            return DetailsSummary(read, changed, "budget")
        try:
            found = provider.substances(row["sku"], row["raw_manufacturer"] or "")
        except (AuthError, RateLimited, Unavailable, Blocked) as exc:
            if not isinstance(exc, AuthError):
                trouble.react(service, service.store, connector_id, exc, now)
            return DetailsSummary(read, changed, exc.code)
        except ProviderError as exc:
            with service.store.connection() as conn:
                _record(conn, row["id"], "substances", now, exc.code, failed=True)
            continue
        read += 1
        with service.store.connection() as conn:
            if found.stated:
                facts.set_one(conn, row["part_id"], connector["provider"], "reach_svhc", "; ".join(found.entries) or "None listed", now)
                changed += compliance.sync_distributor(conn, row["part_id"], connector["provider"], found.entries)
            _record(conn, row["id"], "substances", now, "stated" if found.stated else "not stated", failed=False)
            alerts.evaluate_parts(conn, [row["part_id"]], now)
    return DetailsSummary(read, changed)

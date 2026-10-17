"""The daily call ledger. Spending is atomic so two workers cannot both win.

The ledger belongs to an account (see ``accounts.py``) and counts the provider's day, which begins at the connector's
reset time. ``call_counts`` is its breakdown by connector, kind and purpose, written in the same transaction, so the two
always add up (refusals are counted apart: they were already paid for when the call was made).
"""

from __future__ import annotations

from datetime import datetime
from typing import Mapping

from app.services.supply import accounts, quota, schedule_settings

# What a call asks for.
KIND_SEARCH = "search"
KIND_OFFERS = "offers"
KIND_NOTICES = "notices"
KIND_SUBSTANCES = "substances"
KIND_TEST = "test"
KIND_REFUSED = "refused"
KINDS = (KIND_SEARCH, KIND_OFFERS, KIND_NOTICES, KIND_SUBSTANCES, KIND_TEST, KIND_REFUSED)

# What a call is for.
PURPOSE_TIER1 = "tier1"
PURPOSE_TIER2 = "tier2"
PURPOSE_COMMITTED = "committed"  # committed work whose tier is not known
PURPOSE_INTERACTIVE = "interactive"
PURPOSE_ONE_OFF = "oneoff"
PURPOSE_SPARE = "spare"
PURPOSES = (PURPOSE_TIER1, PURPOSE_TIER2, PURPOSE_COMMITTED, PURPOSE_INTERACTIVE, PURPOSE_ONE_OFF, PURPOSE_SPARE)


def _purpose(purpose: str | None, interactive: bool) -> str:
    return purpose or (PURPOSE_INTERACTIVE if interactive else PURPOSE_COMMITTED)


def _count(conn, connector_id: str, day, hour: int, kind: str, purpose: str, calls: int) -> None:
    conn.execute(
        """
        INSERT INTO call_counts (connector_id, day, hour, kind, purpose, calls) VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (connector_id, day, hour, kind, purpose) DO UPDATE SET calls = call_counts.calls + EXCLUDED.calls
        """,
        (connector_id, day, hour, kind, purpose, calls),
    )


def count_only(conn, connector_id: str, day, hour: int, kind: str, purpose: str, calls: int) -> None:
    """Count calls in ``call_counts`` without charging the account's daily budget (a quota of the provider's own)."""

    _count(conn, connector_id, day, hour, kind, purpose, calls)


def get_state(
    conn,
    connector_id: str,
    *,
    daily_budget: int,
    reserve_pct: int,
    now: datetime,
    reset_time: str = quota.DEFAULT_RESET_TIME,
    reset_tz: str = quota.DEFAULT_RESET_TZ,
) -> quota.QuotaState:
    row = conn.execute(
        "SELECT spent, interactive_spent, spare_spent FROM quota_ledger WHERE connector_id = %s AND day = %s",
        (connector_id, quota.provider_day(now, reset_time, reset_tz)),
    ).fetchone()
    return quota.QuotaState(
        daily_budget=daily_budget,
        spent_today=int(row["spent"]) if row else 0,
        interactive_spent_today=int(row["interactive_spent"]) if row else 0,
        reserve_pct=reserve_pct,
        spare_spent_today=int(row["spare_spent"]) if row else 0,
    )


def try_spend(
    conn,
    connector_id: str,
    units: int,
    *,
    interactive: bool,
    daily_budget: int,
    reserve_pct: int,
    now: datetime,
    reset_time: str = quota.DEFAULT_RESET_TIME,
    reset_tz: str = quota.DEFAULT_RESET_TZ,
    kind: str = KIND_OFFERS,
    purpose: str | None = None,
    counted_for: str | None = None,
    delay_seconds: int = 0,
    spare: bool = False,
    keep_pool_pct: int = 0,
) -> bool:
    """Spend ``units`` calls if the budget allows. Returns whether it did.

    ``delay_seconds`` holds background spending back after the provider's reset (``quota.start_delay_seconds``).
    ``spare`` spends budget that would otherwise go unused (``quota.spare_allowance``), by the workspace's working week.
    ``keep_pool_pct`` (pool spending only) refuses the call once less than that share of the pool would be left for people.

    ``connector_id`` is the ledger's owner (the account's first connector); ``counted_for`` is the connector the calls
    are counted against in ``call_counts``. The day's row is locked while the allowance is computed, so concurrent
    callers see each other's spending. The caller owns the transaction.
    """

    if units < 1:
        raise ValueError("units must be at least 1")
    day = quota.provider_day(now, reset_time, reset_tz)
    conn.execute(
        "INSERT INTO quota_ledger (connector_id, day) VALUES (%s, %s) ON CONFLICT DO NOTHING",
        (connector_id, day),
    )
    row = conn.execute(
        "SELECT spent, interactive_spent, spare_spent FROM quota_ledger "
        "WHERE connector_id = %s AND day = %s FOR UPDATE",
        (connector_id, day),
    ).fetchone()
    state = quota.QuotaState(
        daily_budget=daily_budget,
        spent_today=int(row["spent"]),
        interactive_spent_today=int(row["interactive_spent"]),
        reserve_pct=reserve_pct,
        spare_spent_today=int(row["spare_spent"]),
    )
    if spare:
        week = schedule_settings.work_week(schedule_settings.load(conn))
        allowance = quota.spare_allowance(state, now, week, reset_time=reset_time, tz=reset_tz)
    elif interactive:
        allowance = quota.interactive_allowance(state)
        allowance -= quota.interactive_reserve(daily_budget, reserve_pct) * keep_pool_pct // 100
    else:
        allowance = quota.background_allowance(state, now, reset_time=reset_time, tz=reset_tz, delay_seconds=delay_seconds)
    if units > allowance:
        return False
    conn.execute(
        "UPDATE quota_ledger SET spent = spent + %s, interactive_spent = interactive_spent + %s, "
        "spare_spent = spare_spent + %s WHERE connector_id = %s AND day = %s",
        (units, units if interactive else 0, units if spare else 0, connector_id, day),
    )
    purpose = PURPOSE_SPARE if spare and purpose is None else purpose
    _count(conn, counted_for or connector_id, day, quota.day_hour(now, reset_time, reset_tz), kind, _purpose(purpose, interactive), units)
    return True


def record_calls(
    store, connector_id: str, units: int, *, now: datetime, interactive: bool = False,
    kind: str = KIND_OFFERS, purpose: str | None = None,
) -> None:
    """Count calls that were already made beyond what was reserved, so the day's figure stays true.

    Unlike ``try_spend`` it never refuses: the calls happened. It is used when one batch needed more calls than
    the one it paid for (a part whose packagings DigiKey lists under two products).
    """

    if units < 1:
        return
    with store.connection() as conn:
        account = accounts.resolve(conn, connector_id)
        day = quota.provider_day(now, account.reset_time, account.reset_tz)
        conn.execute(
            """
            INSERT INTO quota_ledger (connector_id, day, spent, interactive_spent) VALUES (%s, %s, %s, %s)
            ON CONFLICT (connector_id, day) DO UPDATE SET spent = quota_ledger.spent + EXCLUDED.spent,
                interactive_spent = quota_ledger.interactive_spent + EXCLUDED.interactive_spent
            """,
            (account.ledger_id, day, units, units if interactive else 0),
        )
        _count(conn, connector_id, day, quota.day_hour(now, account.reset_time, account.reset_tz), kind,
               _purpose(purpose, interactive), units)


def note_refusal(store, connector_id: str, *, now: datetime, purpose: str | None = None) -> None:
    """Count a call the provider turned away (a rate limit, a block). It was paid for when made, so ``spent`` is unchanged."""

    with store.connection() as conn:
        account = accounts.resolve(conn, connector_id)
        day = quota.provider_day(now, account.reset_time, account.reset_tz)
        _count(conn, connector_id, day, quota.day_hour(now, account.reset_time, account.reset_tz), KIND_REFUSED,
               purpose or PURPOSE_COMMITTED, 1)


def spend_call(
    store, connector: Mapping, *, now: datetime, interactive: bool = False, units: int = 1,
    kind: str = KIND_OFFERS, purpose: str | None = None, spare: bool = False, keep_pool_pct: int = 0,
) -> bool:
    """Spend calls for a connector against its account, in their own transaction. Free connectors never get here."""

    with store.connection() as conn:
        account = accounts.resolve(conn, connector["id"])
        return try_spend(
            conn, account.ledger_id, units, interactive=interactive,
            daily_budget=account.daily_budget, reserve_pct=account.reserve_pct, now=now,
            reset_time=account.reset_time, reset_tz=account.reset_tz,
            kind=kind, purpose=purpose, counted_for=connector["id"], spare=spare, keep_pool_pct=keep_pool_pct,
            delay_seconds=quota.start_delay_seconds(account.ledger_id, quota.provider_day(now, account.reset_time, account.reset_tz)),
        )

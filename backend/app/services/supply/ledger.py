"""The daily call ledger. Spending is atomic so two workers cannot both win."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Mapping

from app.services.supply import quota


def _day(now: datetime):
    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    return now.astimezone(timezone.utc).date()


def get_state(
    conn,
    connector_id: str,
    *,
    daily_budget: int,
    reserve_pct: int,
    now: datetime,
) -> quota.QuotaState:
    row = conn.execute(
        "SELECT spent, interactive_spent FROM quota_ledger WHERE connector_id = %s AND day = %s",
        (connector_id, _day(now)),
    ).fetchone()
    return quota.QuotaState(
        daily_budget=daily_budget,
        spent_today=int(row["spent"]) if row else 0,
        interactive_spent_today=int(row["interactive_spent"]) if row else 0,
        reserve_pct=reserve_pct,
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
) -> bool:
    """Spend ``units`` calls if the budget allows. Returns whether it did.

    The day's row is locked while the allowance is computed, so concurrent
    callers see each other's spending. The caller owns the transaction.
    """

    if units < 1:
        raise ValueError("units must be at least 1")
    day = _day(now)
    conn.execute(
        "INSERT INTO quota_ledger (connector_id, day) VALUES (%s, %s) ON CONFLICT DO NOTHING",
        (connector_id, day),
    )
    row = conn.execute(
        "SELECT spent, interactive_spent FROM quota_ledger "
        "WHERE connector_id = %s AND day = %s FOR UPDATE",
        (connector_id, day),
    ).fetchone()
    state = quota.QuotaState(
        daily_budget=daily_budget,
        spent_today=int(row["spent"]),
        interactive_spent_today=int(row["interactive_spent"]),
        reserve_pct=reserve_pct,
    )
    allowance = (
        quota.interactive_allowance(state) if interactive else quota.background_allowance(state, now)
    )
    if units > allowance:
        return False
    conn.execute(
        "UPDATE quota_ledger SET spent = spent + %s, interactive_spent = interactive_spent + %s "
        "WHERE connector_id = %s AND day = %s",
        (units, units if interactive else 0, connector_id, day),
    )
    return True


def spend_call(store, connector: Mapping, *, now: datetime, interactive: bool = False) -> bool:
    """Spend one call for a connector, in its own transaction. Free connectors never get here."""

    with store.connection() as conn:
        return try_spend(
            conn, connector["id"], 1, interactive=interactive,
            daily_budget=connector["daily_budget"], reserve_pct=connector["interactive_reserve_pct"], now=now,
        )

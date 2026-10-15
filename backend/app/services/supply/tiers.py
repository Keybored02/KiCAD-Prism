"""When a listing is asked about next, and which comes first. Pure rules; no database.

How often a followed part is read is decided by its tracking tier (``tracking.py``): tier 1 daily, tier 2 weekly or
monthly. A listing's ``poll_state.tier`` holds that schedule. Here are the rules around it:

* ``next_poll_at``: a daily read falls once in each of the provider's days, at a time that changes every day; weekly and
  monthly reads are spread by a day-changing jitter, so nothing falls due at the same moment every time
* ``urgency``: which listing to read first when the day's budget cannot cover them all (low stock, near the threshold,
  not recommended for new designs, projected to run out). It sets the order, never the rate.

Failures back off on their own schedule (``retry_at``), whatever the schedule says, so a broken credential or a dead
provider cannot burn the daily budget.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import IntEnum

from app.services.supply import quota
from app.services.supply.vocabulary import Lifecycle

SCHEDULES = ("daily", "weekly", "monthly")
INTERVAL = {"daily": timedelta(days=1), "weekly": timedelta(days=7), "monthly": timedelta(days=30)}
# A weekly read lands within a day of the seventh, a monthly one within three days of the thirtieth.
SPREAD = {"weekly": timedelta(days=1), "monthly": timedelta(days=3)}
# A daily read lands in the first part of the provider's day, so a late one is still the same day's.
DAILY_WINDOW = timedelta(hours=20)


class Urgency(IntEnum):
    """Lower is first."""

    HOT = 0
    WARM = 1
    NORMAL = 2


_AT_RISK_LIFECYCLES = frozenset({Lifecycle.NRND, Lifecycle.LAST_TIME_BUY, Lifecycle.OBSOLETE})

RECENT_CHANGE = timedelta(hours=24)
# How close to the threshold counts as "approaching it", as a multiple.
APPROACH_FACTOR = 3
# Distributor stock under this many times the open demand: hot. Under the second: warm.
DEMAND_HOT_COVERAGE = 1.5
DEMAND_WARM_COVERAGE = 3
# Days until stock is projected to hit zero (see ``insights.rupture_expected_within``): under the first, hot; inside the horizon, warm.
RUPTURE_HOT_DAYS = 14
JITTER_SHARE = 0.10
BACKOFF_BASE = timedelta(minutes=5)
BACKOFF_CAP = timedelta(hours=24)


@dataclass(frozen=True, slots=True)
class UrgencyInputs:
    now: datetime
    pinned: bool = False
    lifecycle: Lifecycle = Lifecycle.UNKNOWN
    total_stock: int | None = None
    threshold: int | None = None
    last_change_at: datetime | None = None
    # Open demand in units, own incoming stock netted off. None or 0 means nothing is asked of the part.
    demand: int | None = None
    # Days to a believable projected rupture, or None when none is expected.
    rupture_days: int | None = None


def urgency(inputs: UrgencyInputs) -> Urgency:
    """The most urgent rank any rule asks for."""

    asked: list[Urgency] = [Urgency.NORMAL]
    if inputs.pinned:
        asked.append(Urgency.HOT)
    if inputs.total_stock is not None:
        if inputs.total_stock == 0:
            asked.append(Urgency.HOT)
        if inputs.threshold is not None:
            if inputs.total_stock <= inputs.threshold:
                asked.append(Urgency.HOT)
            elif inputs.total_stock < inputs.threshold * APPROACH_FACTOR:
                asked.append(Urgency.WARM)
    if inputs.demand and inputs.demand > 0 and inputs.total_stock is not None:
        cover = inputs.total_stock / inputs.demand
        if cover < DEMAND_HOT_COVERAGE:
            asked.append(Urgency.HOT)
        elif cover < DEMAND_WARM_COVERAGE:
            asked.append(Urgency.WARM)
    if inputs.rupture_days is not None:
        asked.append(Urgency.HOT if inputs.rupture_days <= RUPTURE_HOT_DAYS else Urgency.WARM)
    if inputs.lifecycle in _AT_RISK_LIFECYCLES:
        asked.append(Urgency.WARM)
    if inputs.last_change_at is not None and inputs.now - inputs.last_change_at < RECENT_CHANGE:
        asked.append(Urgency.WARM)
    return min(asked)


def backoff(error_streak: int) -> timedelta:
    """5 minutes after the first failure, doubling, capped at a day."""

    if error_streak < 1:
        return timedelta(0)
    return min(BACKOFF_BASE * (2 ** (error_streak - 1)), BACKOFF_CAP)


def _spread(key: str) -> float:
    """A stable number in [0, 1) for this key."""

    return int(hashlib.sha256(key.encode()).hexdigest()[:8], 16) % 1000 / 1000


def interval(schedule: str) -> timedelta:
    return INTERVAL[schedule]


def next_poll_at(
    now: datetime, schedule: str, *, key: str = "", reset_time: str = quota.DEFAULT_RESET_TIME, tz: str = quota.DEFAULT_RESET_TZ,
) -> datetime:
    """When to ask again after an answer.

    A daily listing is next due in the provider's next day, at a time that changes from day to day (``key`` and the date
    set it), so it is read once in each day and never at the same moment twice. Weekly and monthly ones are due after
    their interval, moved by up to half the spread either way.
    """

    day = quota.provider_day(now, reset_time, tz)
    spread = _spread(f"{key}|{day.isoformat()}")
    if schedule == "daily":
        next_day_start = now + timedelta(seconds=86400 - quota.seconds_into_day(now, reset_time, tz))
        return next_day_start + DAILY_WINDOW * spread
    return now + INTERVAL[schedule] + SPREAD[schedule] * (spread - 0.5)


def retry_at(now: datetime, error_streak: int, *, key: str = "") -> datetime:
    """When to try again after a failure.

    This is its own schedule and ignores the rate. A listing that was due daily is retried in minutes at first, so a
    brief outage costs little; one that keeps failing is retried less and less often, up to a day.
    """

    return now + backoff(max(error_streak, 1)) * (1 + JITTER_SHARE * _spread(key))

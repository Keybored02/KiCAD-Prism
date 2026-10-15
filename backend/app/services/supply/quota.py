"""Call budgets: how many calls may be spent now, and what a watchlist needs.

A daily budget is a plan, not an error. Background polling spends it evenly
across the provider's day (after a small opening burst); a share is held back for
lookups people trigger. Running short slows polling down. It never fails.

Everything here is pure. The ledger that records spending is separate.
"""

from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from typing import Mapping
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# How often each schedule reads a listing, for estimating what a watchlist costs.
TIER_INTERVAL_HOURS: Mapping[str, float] = {
    "daily": 24.0,
    "weekly": 168.0,
    "monthly": 720.0,
}

# Percent of the background budget available from the first minute of the day.
OPENING_BURST_PCT = 10


DEFAULT_RESET_TIME = "00:00"
DEFAULT_RESET_TZ = "UTC"


def _zone(tz: str):
    try:
        return ZoneInfo(tz)
    except (ZoneInfoNotFoundError, ValueError):
        return timezone.utc


def _reset_at(reset_time: str) -> time:
    try:
        hours, minutes = (int(part) for part in reset_time.split(":"))
        return time(hours, minutes)
    except ValueError:
        return time(0, 0)


def _local(now: datetime, reset_time: str, tz: str) -> datetime:
    """``now`` on the provider's clock, shifted so the provider's day starts at midnight."""

    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    at = _reset_at(reset_time)
    return now.astimezone(_zone(tz)) - timedelta(hours=at.hour, minutes=at.minute)


def provider_day(now: datetime, reset_time: str = DEFAULT_RESET_TIME, tz: str = DEFAULT_RESET_TZ) -> date:
    """The provider's day this moment falls in: a calendar day in its time zone that begins at its reset time."""

    return _local(now, reset_time, tz).date()


def day_bounds(now: datetime, reset_time: str = DEFAULT_RESET_TIME, tz: str = DEFAULT_RESET_TZ) -> tuple[datetime, datetime]:
    """When the provider's current day began and when it ends, in UTC. A day is 23 or 25 hours long where the clocks change."""

    zone, at = _zone(tz), _reset_at(reset_time)
    day = provider_day(now, reset_time, tz)
    start = datetime.combine(day, at, tzinfo=zone).astimezone(timezone.utc)
    end = datetime.combine(day + timedelta(days=1), at, tzinfo=zone).astimezone(timezone.utc)
    return start, end


def day_length(now: datetime, reset_time: str = DEFAULT_RESET_TIME, tz: str = DEFAULT_RESET_TZ) -> int:
    """Seconds in the provider's current day."""

    start, end = day_bounds(now, reset_time, tz)
    return int((end - start).total_seconds())


def seconds_into_day(now: datetime, reset_time: str = DEFAULT_RESET_TIME, tz: str = DEFAULT_RESET_TZ) -> int:
    start, end = day_bounds(now, reset_time, tz)
    return max(0, min(int((now - start).total_seconds()), int((end - start).total_seconds())))


def seconds_to_reset(now: datetime, reset_time: str = DEFAULT_RESET_TIME, tz: str = DEFAULT_RESET_TZ) -> int:
    return day_length(now, reset_time, tz) - seconds_into_day(now, reset_time, tz)


def day_hour(now: datetime, reset_time: str = DEFAULT_RESET_TIME, tz: str = DEFAULT_RESET_TZ) -> int:
    """Hours since the provider's day began, 0 to 23 (the last hour of a 25-hour day counts as 23)."""

    return min(seconds_into_day(now, reset_time, tz) // 3600, 23)


def start_delay_seconds(key: str, day: date) -> int:
    """A delay of 5 to 30 minutes after a day begins, different each day, so accounts do not all start at the reset."""

    digest = int(hashlib.sha256(f"{key}|{day.isoformat()}".encode()).hexdigest()[:8], 16)
    return 300 + digest % 1501


@dataclass(frozen=True, slots=True)
class QuotaState:
    daily_budget: int
    spent_today: int
    interactive_spent_today: int
    reserve_pct: int = 10
    # Calls made from budget that would otherwise go unused; they never count against the committed share.
    spare_spent_today: int = 0

    def __post_init__(self) -> None:
        if self.daily_budget < 0 or self.spent_today < 0 or self.interactive_spent_today < 0 or self.spare_spent_today < 0:
            raise ValueError("quota figures must not be negative")
        if self.interactive_spent_today + self.spare_spent_today > self.spent_today:
            raise ValueError("interactive and spare spending cannot exceed total spending")
        if not 0 <= self.reserve_pct <= 50:
            raise ValueError("reserve must be between 0 and 50 percent")


def interactive_reserve(daily_budget: int, reserve_pct: int) -> int:
    return math.ceil(daily_budget * reserve_pct / 100)


def background_allowance(
    state: QuotaState, now: datetime, *, reset_time: str = DEFAULT_RESET_TIME, tz: str = DEFAULT_RESET_TZ,
    delay_seconds: int = 0,
) -> int:
    """Calls the poller may spend right now.

    The day is the provider's (``reset_time`` in ``tz``). ``delay_seconds`` holds background work back after the reset.
    """

    seconds = seconds_into_day(now, reset_time, tz)
    length = day_length(now, reset_time, tz)
    if seconds < delay_seconds:
        return 0
    background_budget = state.daily_budget - interactive_reserve(state.daily_budget, state.reserve_pct)
    # The spread runs over the rest of the day once the delay has passed.
    seconds = (seconds - delay_seconds) * length // max(length - delay_seconds, 1)
    # Integer arithmetic: a float product lands a hair above whole numbers
    # (900 * 0.55 is 495.00000000000006) and ceil would round it up.
    fraction_numerator = OPENING_BURST_PCT * length + (100 - OPENING_BURST_PCT) * seconds
    target = -(-background_budget * fraction_numerator // (100 * length))
    background_spent = state.spent_today - state.interactive_spent_today - state.spare_spent_today
    left_in_day = state.daily_budget - state.spent_today
    return max(0, min(target - background_spent, left_in_day))


def interactive_allowance(state: QuotaState) -> int:
    """Calls a person-triggered lookup may spend right now."""

    reserve = interactive_reserve(state.daily_budget, state.reserve_pct)
    left_in_day = state.daily_budget - state.spent_today
    return max(0, min(reserve - state.interactive_spent_today, left_in_day))


@dataclass(frozen=True, slots=True)
class WorkWeek:
    """When the workspace is at work, which is when the budget's pool is likely to be wanted by people."""

    tz: str = "UTC"
    days: tuple[int, ...] = (0, 1, 2, 3, 4)  # Monday is 0
    start: str = "08:00"
    end: str = "19:00"


# Budget not used by a provider's reset is lost, so in its last hours everything left is released.
SPARE_FINAL_HOURS = 3
# The part of the pool kept for people even when spare is released.
INTERACTIVE_FLOOR_SHARE = 0.25


def _minutes(text: str) -> int:
    hours, minutes = (int(part) for part in text.split(":"))
    return hours * 60 + minutes


def is_working_time(now: datetime, week: WorkWeek) -> bool:
    try:
        local = now.astimezone(ZoneInfo(week.tz))
    except (ZoneInfoNotFoundError, ValueError):
        local = now.astimezone(timezone.utc)
    if local.weekday() not in week.days:
        return False
    return _minutes(week.start) <= local.hour * 60 + local.minute < _minutes(week.end)


def spare_allowance(
    state: QuotaState, now: datetime, week: WorkWeek, *, reset_time: str = DEFAULT_RESET_TIME, tz: str = DEFAULT_RESET_TZ,
) -> int:
    """Calls that may be spent on spare work right now.

    * In the last hours before the provider's reset: everything left but the interactive floor, since it is lost otherwise.
    * Outside working hours and on non-working days: the pool's unused part but its floor, since nobody is asking.
    * During working hours: nothing.
    """

    reserve = interactive_reserve(state.daily_budget, state.reserve_pct)
    floor = math.ceil(reserve * INTERACTIVE_FLOOR_SHARE)
    left_in_day = max(0, state.daily_budget - state.spent_today)
    final = seconds_to_reset(now, reset_time, tz) <= SPARE_FINAL_HOURS * 3600
    if final:
        return max(0, left_in_day - floor)
    if is_working_time(now, week):
        return 0
    pool_unused = max(0, reserve - state.interactive_spent_today - state.spare_spent_today)
    return max(0, min(pool_unused - floor, left_in_day))


@dataclass(frozen=True, slots=True)
class CapacityEstimate:
    calls_per_day: int
    usable_per_day: int
    shortfall_pct: int

    @property
    def fits(self) -> bool:
        return self.calls_per_day <= self.usable_per_day


def estimate_capacity(
    listings_by_tier: Mapping[str, int],
    *,
    max_batch: int,
    daily_budget: int,
    reserve_pct: int = 10,
    calls_per_batch: int = 1,
) -> CapacityEstimate:
    """Calls per day the watchlist needs against what the budget allows.

    Polling is per listing, not per part: a part sold in three packagings is three
    listings. Pass listing counts per tier. ``calls_per_batch`` is the provider's
    ``calls_per_offers_batch`` (TME needs two calls for one batch of offers).

    ``shortfall_pct`` is the share of polls that will run later than their tier
    asks. It is shown before it happens, in Connectors.
    """

    if max_batch < 1:
        raise ValueError("max_batch must be at least 1")
    needed = 0.0
    for tier, listings in listings_by_tier.items():
        interval = TIER_INTERVAL_HOURS[tier]
        if listings < 0:
            raise ValueError("listing counts must not be negative")
        needed += math.ceil(listings / max_batch) * calls_per_batch * (24 / interval)
    calls = math.ceil(needed)
    usable = daily_budget - interactive_reserve(daily_budget, reserve_pct)
    shortfall = 0 if calls <= usable or calls == 0 else math.ceil(100 * (1 - usable / calls))
    return CapacityEstimate(calls_per_day=calls, usable_per_day=usable, shortfall_pct=shortfall)

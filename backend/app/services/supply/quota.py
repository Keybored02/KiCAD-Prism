"""Call budgets: how many calls may be spent now, and what a watchlist needs.

A daily budget is a plan, not an error. Background polling spends it evenly
across the UTC day (after a small opening burst); a share is held back for
lookups people trigger. Running short slows polling down. It never fails.

Everything here is pure. The ledger that records spending is separate.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Mapping

# Defaults for the polling tiers; the poller owns them once it exists.
TIER_INTERVAL_HOURS: Mapping[str, float] = {
    "hot": 1.5,
    "warm": 6.0,
    "normal": 24.0,
    "cold": 168.0,
}

# Percent of the background budget available from the first minute of the day.
OPENING_BURST_PCT = 10
_SECONDS_PER_DAY = 86400


@dataclass(frozen=True, slots=True)
class QuotaState:
    daily_budget: int
    spent_today: int
    interactive_spent_today: int
    reserve_pct: int = 10

    def __post_init__(self) -> None:
        if self.daily_budget < 0 or self.spent_today < 0 or self.interactive_spent_today < 0:
            raise ValueError("quota figures must not be negative")
        if self.interactive_spent_today > self.spent_today:
            raise ValueError("interactive spending cannot exceed total spending")
        if not 0 <= self.reserve_pct <= 50:
            raise ValueError("reserve must be between 0 and 50 percent")


def interactive_reserve(daily_budget: int, reserve_pct: int) -> int:
    return math.ceil(daily_budget * reserve_pct / 100)


def background_allowance(state: QuotaState, now: datetime) -> int:
    """Calls the poller may spend right now."""

    if now.tzinfo is None:
        raise ValueError("now must be timezone-aware")
    now = now.astimezone(timezone.utc)
    background_budget = state.daily_budget - interactive_reserve(state.daily_budget, state.reserve_pct)
    seconds = now.hour * 3600 + now.minute * 60 + now.second
    # Integer arithmetic: a float product lands a hair above whole numbers
    # (900 * 0.55 is 495.00000000000006) and ceil would round it up.
    fraction_numerator = OPENING_BURST_PCT * _SECONDS_PER_DAY + (100 - OPENING_BURST_PCT) * seconds
    target = -(-background_budget * fraction_numerator // (100 * _SECONDS_PER_DAY))
    background_spent = state.spent_today - state.interactive_spent_today
    left_in_day = state.daily_budget - state.spent_today
    return max(0, min(target - background_spent, left_in_day))


def interactive_allowance(state: QuotaState) -> int:
    """Calls a person-triggered lookup may spend right now."""

    reserve = interactive_reserve(state.daily_budget, state.reserve_pct)
    left_in_day = state.daily_budget - state.spent_today
    return max(0, min(reserve - state.interactive_spent_today, left_in_day))


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

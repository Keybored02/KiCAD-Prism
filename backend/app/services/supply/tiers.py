"""How often a listing is asked about. Pure rules; no database.

A listing polls fast when it matters and slowly when nothing is happening. The
tiers and their intervals are in ``quota.TIER_INTERVAL_HOURS``. Failures back
off on their own schedule (``retry_at``), whatever the tier says, so a broken
credential or a dead provider cannot burn the daily budget.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import StrEnum

from app.services.supply.quota import TIER_INTERVAL_HOURS
from app.services.supply.vocabulary import Lifecycle


class Tier(StrEnum):
    HOT = "hot"
    WARM = "warm"
    NORMAL = "normal"
    COLD = "cold"


# Most urgent first.
_URGENCY = (Tier.HOT, Tier.WARM, Tier.NORMAL, Tier.COLD)
_AT_RISK_LIFECYCLES = frozenset({Lifecycle.NRND, Lifecycle.LAST_TIME_BUY, Lifecycle.OBSOLETE})

RECENT_CHANGE = timedelta(hours=24)
STABLE_FOR = timedelta(days=30)
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
class TierInputs:
    now: datetime
    watched: bool = True
    pinned: bool = False
    lifecycle: Lifecycle = Lifecycle.UNKNOWN
    total_stock: int | None = None
    threshold: int | None = None
    last_change_at: datetime | None = None
    # Open demand in units, own incoming stock netted off. None or 0 means nothing is asked of the part.
    demand: int | None = None
    # Days to a believable projected rupture, or None when none is expected.
    rupture_days: int | None = None


def interval(tier: Tier) -> timedelta:
    return timedelta(hours=TIER_INTERVAL_HOURS[tier.value])


def choose_tier(inputs: TierInputs) -> Tier:
    """The most urgent tier any rule asks for."""

    asked: list[Tier] = [Tier.NORMAL]
    if inputs.pinned:
        asked.append(Tier.HOT)
    if inputs.total_stock is not None:
        if inputs.total_stock == 0:
            asked.append(Tier.HOT)
        if inputs.threshold is not None:
            if inputs.total_stock <= inputs.threshold:
                asked.append(Tier.HOT)
            elif inputs.total_stock < inputs.threshold * APPROACH_FACTOR:
                asked.append(Tier.WARM)
    if inputs.demand and inputs.demand > 0 and inputs.total_stock is not None:
        cover = inputs.total_stock / inputs.demand
        if cover < DEMAND_HOT_COVERAGE:
            asked.append(Tier.HOT)
        elif cover < DEMAND_WARM_COVERAGE:
            asked.append(Tier.WARM)
    if inputs.rupture_days is not None:
        asked.append(Tier.HOT if inputs.rupture_days <= RUPTURE_HOT_DAYS else Tier.WARM)
    if inputs.lifecycle in _AT_RISK_LIFECYCLES:
        asked.append(Tier.WARM)
    if inputs.last_change_at is not None and inputs.now - inputs.last_change_at < RECENT_CHANGE:
        asked.append(Tier.WARM)
    best = min(asked, key=_URGENCY.index)
    if best is Tier.NORMAL and not inputs.watched and (
        inputs.last_change_at is None or inputs.now - inputs.last_change_at > STABLE_FOR
    ):
        return Tier.COLD
    return best


def backoff(error_streak: int) -> timedelta:
    """5 minutes after the first failure, doubling, capped at a day."""

    if error_streak < 1:
        return timedelta(0)
    return min(BACKOFF_BASE * (2 ** (error_streak - 1)), BACKOFF_CAP)


def _spread(key: str) -> float:
    """A stable number in [0, 1) for this listing."""

    return int(hashlib.sha256(key.encode()).hexdigest()[:8], 16) % 1000 / 1000


def next_poll_at(now: datetime, tier: Tier, *, key: str = "") -> datetime:
    """When to ask again after an answer: the tier's interval, spread a little by ``key``.

    The spread stops every listing from falling due at the same instant. It only
    ever delays, so a hot listing is never polled sooner than its tier says.
    """

    return now + interval(tier) * (1 + JITTER_SHARE * _spread(key))


def retry_at(now: datetime, error_streak: int, *, key: str = "") -> datetime:
    """When to try again after a failure.

    This is its own schedule and ignores the tier. A listing that was due daily
    is retried in minutes at first, so a brief outage costs little; one that
    keeps failing is retried less and less often, up to a day.
    """

    return now + backoff(max(error_streak, 1)) * (1 + JITTER_SHARE * _spread(key))

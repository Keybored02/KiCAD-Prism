"""Price forecasts: a part's cheapest price in 30 and 90 days (P6) and a board's cost (P7).

Repricing is modelled as events. A part's cheapest price (at its quantity, in the base currency) moves now and then; the number
of moves in a window is Poisson with the part's own rate pulled towards the rate across all tracked parts, and each move's size is
drawn from the sizes seen (the part's own when it has some, else the pooled ones). Most prices stay flat, and the range says so.
The currency's own spread is not modelled (the price is already converted at today's rate): a foreign price carries that risk.
"""

from __future__ import annotations

import math
import time
from datetime import date, datetime, timezone
from typing import Any, Sequence

import numpy as np

from app.services.supply import prices

DRAWS = 2000
# Days of readings a horizon needs before it is forecast: a month for the month ahead, two for the quarter.
MIN_SPAN_DAYS = {30: 30, 90: 60}
# A part's rate of repricing is pulled towards one in 90 days, as strongly as 90 days of its own history.
PRIOR_RATE = 1 / 90
SHRINK_DAYS = 90.0
MIN_OWN_MOVES = 3
# A change under this share is rounding or noise, not a repricing; one over BIG_MOVE counts only when the next reading holds the new price.
NOISE_MOVE = 0.01
BIG_MOVE = 0.25
# Moves are believed to drift one way only when the part's own history has this many the same way over at least this many days.
DRIFT_MOVES = 3
DRIFT_DAYS = 60
# No single repricing is believed to be bigger than a doubling or a halving: a bigger jump is a listing that changed, not a price.
MAX_MOVE = math.log(2)
SEED = 20261018
POOL_CACHE_FOR = 6 * 3600.0
_pool: tuple[float, "Moves"] | None = None


class Moves:
    """The moves of a price series: how many, over how long, and their sizes as log ratios."""

    __slots__ = ("count", "span", "sizes")

    def __init__(self, count: int, span: float, sizes: list[float]) -> None:
        self.count, self.span, self.sizes = count, span, sizes


def moves_of(series: Sequence[tuple[date, float]]) -> Moves:
    sizes = [math.log(b / a) for (_, a), (_, b) in zip(series, series[1:]) if a > 0 and b > 0 and a != b]
    span = (series[-1][0] - series[0][0]).days if len(series) > 1 else 0
    return Moves(len(sizes), float(span), sizes)


def _repricings(series: Sequence[tuple[date, Any]]) -> list[tuple[date, float]]:
    """The real repricings in one listing's series: (day, log ratio). Changes under ``NOISE_MOVE`` are dropped, and so is a big one the
    next reading does not confirm (a spike that reverts, or a last reading nothing follows)."""

    found: list[tuple[date, float]] = []
    level = float(series[0][1]) if series else 0.0
    for index in range(1, len(series)):
        after = float(series[index][1])
        if level <= 0 or after <= 0:
            level = after
            continue
        change = after / level - 1
        if abs(change) > BIG_MOVE:
            following = float(series[index + 1][1]) if index + 1 < len(series) else None
            if following is None or abs(following / after - 1) >= NOISE_MOVE:
                continue  # a reading nothing confirms: the level stays what it was
        if abs(change) >= NOISE_MOVE:
            found.append((series[index][0], math.log(after / level)))
        level = after
    return found


def own_moves(conn, part_id: str, now: datetime, days: int = 90) -> Moves:
    """The repricings of a part as its own listings made them: one event for each day a listing's price differed from its last reading,
    sized by the median change among the listings that moved that day. The cheapest listing changing, or a listing joining or leaving,
    is not an event, which the move sizes of the part's cheapest price used to count."""

    events: dict[date, list[float]] = {}
    first: date | None = None
    last: date | None = None
    for series in prices.listing_series(conn, part_id, now, days).values():
        first = series[0][0] if first is None else min(first, series[0][0])
        last = series[-1][0] if last is None else max(last, series[-1][0])
        for day, size in _repricings(series):
            events.setdefault(day, []).append(size)
    sizes = [max(-MAX_MOVE, min(MAX_MOVE, float(np.median(changes)))) for _day, changes in sorted(events.items())]
    span = float((last - first).days) if first is not None and last is not None else 0.0
    return Moves(len(sizes), span, sizes)


def series_of(conn, part_id: str, now: datetime, days: int = 90) -> list[tuple[date, float]]:
    points, _meta = prices.daily(conn, part_id, now, days)
    return [(day, float(price)) for day, price, _currency in points]


def pooled_moves(conn, part_ids: Sequence[str], now: datetime) -> Moves:
    """The moves across tracked parts, kept for six hours."""

    global _pool
    if _pool is not None and time.monotonic() - _pool[0] < POOL_CACHE_FOR:
        return _pool[1]
    count, span, sizes = 0, 0.0, []
    for part_id in part_ids:
        found = own_moves(conn, part_id, now)
        count += found.count
        span += found.span
        sizes.extend(found.sizes)
    result = Moves(count, span, sizes)
    _pool = (time.monotonic(), result)
    return result


def forget() -> None:
    global _pool
    _pool = None


def _centred(sizes: Sequence[float]) -> list[float]:
    """Sizes with their mean taken out: how big a move is, not which way prices happen to have gone."""

    if not sizes:
        return []
    mean = sum(sizes) / len(sizes)
    return [size - mean for size in sizes]


def drifts(own: Moves) -> bool:
    """Whether a part's own history is evidence for a trend: at least ``DRIFT_MOVES`` moves the same way over ``DRIFT_DAYS`` days."""

    if own.span < DRIFT_DAYS:
        return False
    return max(sum(1 for size in own.sizes if size > 0), sum(1 for size in own.sizes if size < 0)) >= DRIFT_MOVES


def draw_prices(
    series: Sequence[tuple[date, float]], pool: Moves, horizon: int, draws: int = DRAWS, seed: int = SEED, own: Moves | None = None,
) -> np.ndarray | None:
    """Possible prices ``horizon`` days ahead, or None when the series is too short to say anything.

    ``own`` is the part's repricings from its listings (``own_moves``); without it they are read from the series itself.
    The median is today's price unless the part's own history shows a trend: the sizes are centred, so a pool that went mostly one
    way is a spread, not a drift.
    """

    if len(series) < 2 or (series[-1][0] - series[0][0]).days < MIN_SPAN_DAYS.get(horizon, max(MIN_SPAN_DAYS.values())):
        return None
    own = own or moves_of(series)
    rate = (own.count + SHRINK_DAYS * PRIOR_RATE) / (own.span + SHRINK_DAYS)
    rng = np.random.default_rng(seed)
    counts = rng.poisson(rate * horizon, draws)
    if own.count >= MIN_OWN_MOVES:
        own_sizes = own.sizes if drifts(own) else _centred(own.sizes)
        sizes = np.asarray(own_sizes + _centred(pool.sizes)[: len(own.sizes)], dtype=float)
    else:
        sizes = np.asarray(_centred(pool.sizes) or [0.0], dtype=float)
    total = np.zeros(draws)
    for index, moves in enumerate(counts):
        if moves:
            total[index] = rng.choice(sizes, moves).sum()
    return series[-1][1] * np.exp(total)


def forecast(series: Sequence[tuple[date, float]], pool: Moves, own: Moves | None = None) -> dict[str, Any]:
    """The cheapest price in 30 and 90 days as ranges, with what they rest on."""

    now = series[-1][1] if series else None
    out: dict[str, Any] = {"available": False, "now": now}
    for horizon in (30, 90):
        draw = draw_prices(series, pool, horizon, own=own)
        if draw is None:
            out["reason"] = "too_few_readings"
            return out
        low, mid, high = (float(v) for v in np.percentile(draw, [10, 50, 90]))
        out[f"h{horizon}"] = {"low": low, "median": mid, "high": high, "flat": bool(np.isclose(low, high, rtol=1e-4) or (high - low) / max(now or 1, 1e-12) < 0.005)}
    own = own or moves_of(series)
    out["available"] = True
    out["inputs"] = {"readings": len(series), "span_days": own.span, "own_moves": own.count, "pooled_moves": pool.count}
    return out

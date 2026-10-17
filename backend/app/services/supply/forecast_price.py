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
MIN_SPAN_DAYS = 7
SHRINK_DAYS = 30.0
MIN_OWN_MOVES = 3
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
        found = moves_of(series_of(conn, part_id, now))
        count += found.count
        span += found.span
        sizes.extend(found.sizes)
    result = Moves(count, span, sizes)
    _pool = (time.monotonic(), result)
    return result


def forget() -> None:
    global _pool
    _pool = None


def draw_prices(series: Sequence[tuple[date, float]], pool: Moves, horizon: int, draws: int = DRAWS, seed: int = SEED) -> np.ndarray | None:
    """Possible prices ``horizon`` days ahead, or None when the series is too short to say anything."""

    if len(series) < 2 or (series[-1][0] - series[0][0]).days < MIN_SPAN_DAYS:
        return None
    own = moves_of(series)
    pooled_rate = pool.count / pool.span if pool.span > 0 else 0.0
    rate = (own.count + SHRINK_DAYS * pooled_rate) / (own.span + SHRINK_DAYS)
    rng = np.random.default_rng(seed)
    counts = rng.poisson(rate * horizon, draws)
    if own.count >= MIN_OWN_MOVES:
        sizes = np.asarray(own.sizes + pool.sizes[: len(own.sizes)] if pool.sizes else own.sizes, dtype=float)
    else:
        sizes = np.asarray(pool.sizes or [0.0], dtype=float)
    total = np.zeros(draws)
    for index, moves in enumerate(counts):
        if moves:
            total[index] = rng.choice(sizes, moves).sum()
    return series[-1][1] * np.exp(total)


def forecast(series: Sequence[tuple[date, float]], pool: Moves) -> dict[str, Any]:
    """The cheapest price in 30 and 90 days as ranges, with what they rest on."""

    now = series[-1][1] if series else None
    out: dict[str, Any] = {"available": False, "now": now}
    for horizon in (30, 90):
        draw = draw_prices(series, pool, horizon)
        if draw is None:
            out["reason"] = "too_few_readings"
            return out
        low, mid, high = (float(v) for v in np.percentile(draw, [10, 50, 90]))
        out[f"h{horizon}"] = {"low": low, "median": mid, "high": high, "flat": bool(np.isclose(low, high, rtol=1e-4) or (high - low) / max(now or 1, 1e-12) < 0.005)}
    own = moves_of(series)
    out["available"] = True
    out["inputs"] = {"readings": len(series), "span_days": own.span, "own_moves": own.count, "pooled_moves": pool.count}
    return out

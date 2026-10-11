"""What a part's stock history says, with the working shown.

Pure: takes the daily points that ``parts_view`` builds and returns facts about them.
Nothing here is a forecast of demand. It is the *observed net decrease* of counted
stock, which is not consumption: transfers between warehouses, allocations and
reporting caps look the same, and a restock and a sale in one day cancel out.

The method has to cope with uneven history, so it uses medians and no fixed spacing:

* A change in how many listings stand behind the figure (a listing found, lost or
  rejected) is a change of coverage, not stock moving. The series is cut there.
* A rise of at least 20% of the previous level is a restock (any rise, from zero).
* The rate is the Theil-Sen slope (the median of the slopes between every pair of
  points) over the days since the last restock, so one odd day cannot move it.
* Every answer carries a confidence from how many points there are and how long they
  span, and the inputs it was computed from.
"""

from __future__ import annotations

import math
import statistics
from dataclasses import dataclass
from datetime import date
from typing import Any, Sequence

HORIZON_DAYS = 56
RESTOCK_SHARE = 0.2
MIN_RUN_POINTS = 4
MIN_RUN_SPAN_DAYS = 3
MAX_PAIRWISE_POINTS = 60

NONE, LOW, MEDIUM, HIGH = "none", "low", "medium", "high"


@dataclass(frozen=True, slots=True)
class Point:
    day: date
    stock: int
    listings: int


def _segments(points: Sequence[Point]) -> list[list[Point]]:
    """Runs of points with the same coverage."""

    segments: list[list[Point]] = []
    for point in points:
        if segments and segments[-1][-1].listings == point.listings:
            segments[-1].append(point)
        else:
            segments.append([point])
    return segments


def _is_restock(before: int, after: int) -> bool:
    rise = after - before
    return rise > 0 and (before == 0 or rise >= RESTOCK_SHARE * before)


def _theil_sen(points: Sequence[Point]) -> float | None:
    """Median pairwise slope, in pieces per day. None without two different days."""

    sample = list(points[-MAX_PAIRWISE_POINTS:])
    slopes = [
        (b.stock - a.stock) / (b.day - a.day).days
        for index, a in enumerate(sample)
        for b in sample[index + 1:]
        if (b.day - a.day).days > 0
    ]
    return statistics.median(slopes) if slopes else None


def _confidence(count: int, span_days: int, run_points: int) -> str:
    if count < 2 or span_days < 1:
        return NONE
    if count < 4 or span_days < 7:
        return LOW
    if count < 15 or span_days < 30 or run_points < 8:
        return MEDIUM
    return HIGH


def analyse(points: Sequence[Point], *, threshold: int | None = None, today: date | None = None) -> dict[str, Any]:
    """Facts about one part's stock history. Every key is always present."""

    points = list(points)
    result: dict[str, Any] = {
        "confidence": NONE,
        "trend": None,
        "decrease_per_day": None,
        "days_to_zero": None,
        "days_to_threshold": None,
        "restocks": 0,
        "restock_interval_days": None,
        "restock_expected_in_days": None,
        "inputs": {"points": len(points), "span_days": 0, "points_in_run": 0, "current": points[-1].stock if points else None},
    }
    if len(points) < 2:
        return result

    span = (points[-1].day - points[0].day).days
    restock_days: list[date] = []
    run: list[Point] = []
    for segment in _segments(points):
        run = segment[:1]
        for before, after in zip(segment, segment[1:]):
            if _is_restock(before.stock, after.stock):
                restock_days.append(after.day)
                run = [after]
            else:
                run.append(after)
    # `run` is the stretch since the last restock, or since the coverage last changed.

    current = points[-1].stock
    result["restocks"] = len(restock_days)
    result["inputs"] |= {"span_days": span, "points_in_run": len(run)}
    result["confidence"] = _confidence(len(points), span, len(run))

    slope = None
    run_span = (run[-1].day - run[0].day).days
    if len(run) >= MIN_RUN_POINTS and run_span >= MIN_RUN_SPAN_DAYS:
        slope = _theil_sen(run)
    if slope is not None:
        if slope < 0:
            result["trend"] = "falling"
            rate = -slope
            result["decrease_per_day"] = round(rate, 2)
            if current > 0:
                result["days_to_zero"] = math.ceil(current / rate)
            if threshold is not None and current > threshold:
                result["days_to_threshold"] = math.ceil((current - threshold) / rate)
        else:
            result["trend"] = "rising" if slope > 0 else "steady"

    if len(restock_days) >= 2:
        gaps = [(b - a).days for a, b in zip(restock_days, restock_days[1:])]
        interval = round(statistics.median(gaps))
        result["restock_interval_days"] = interval
        reference = today or points[-1].day
        result["restock_expected_in_days"] = interval - (reference - restock_days[-1]).days
    return result


def rupture_expected_within(insight: dict[str, Any], horizon_days: int = HORIZON_DAYS) -> int | None:
    """Days until stock hits zero if that is inside the horizon and believable, else None.

    Believable means at least medium confidence, and no regular restock due before then:
    a part that always dips before its restock is not about to run out.
    """

    days = insight.get("days_to_zero")
    if days is None or days > horizon_days or insight.get("confidence") not in (MEDIUM, HIGH):
        return None
    expected = insight.get("restock_expected_in_days")
    if expected is not None and 0 <= expected < days and insight.get("restocks", 0) >= 2:
        return None
    return int(days)

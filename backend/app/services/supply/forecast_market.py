"""Forecasts for families of parts, from the market series Prism stores each day: lead times three months ahead (P5) and early
warnings that a family is going short (P12).

A family is a manufacturer or a distributor category with at least three tracked parts. Describes this workspace's parts, not the
market as a whole.
"""

from __future__ import annotations

import statistics
from datetime import date, datetime, timedelta, timezone
from typing import Any, Sequence

import numpy as np

HISTORY_DAYS = 120
MIN_POINTS = 14
MIN_SPAN_DAYS = 21
MAX_PAIRWISE = 60
LEAD_HORIZON = 90
EASING_STRETCHING_SHARE = 0.10
SHIFT_RECENT, SHIFT_PRIOR = 14, 14
SHIFT_SIGMAS = 3.0
# A share must move by at least this to be a warning, however calm the family was.
FLOORS = {"out_of_stock": 0.05, "dropped": 0.05, "lifecycle_risk": 0.05, "median_lead_time_days": 7.0}


def lead_trend(points: Sequence[tuple[date, float]]) -> dict[str, Any] | None:
    """Where a family's median quoted lead time is heading in ``LEAD_HORIZON`` days, as a range from the spread of pairwise slopes."""

    sample = list(points)[-MAX_PAIRWISE:]
    if len(sample) < MIN_POINTS or (sample[-1][0] - sample[0][0]).days < MIN_SPAN_DAYS:
        return None
    slopes = np.asarray([
        (b[1] - a[1]) / (b[0] - a[0]).days for index, a in enumerate(sample) for b in sample[index + 1:] if (b[0] - a[0]).days > 0
    ])
    now = float(statistics.median(value for _, value in sample[-5:]))
    low, mid, high = (float(v) for v in np.percentile(slopes, [10, 50, 90]))
    ahead = [max(now + slope * LEAD_HORIZON, 0.0) for slope in (low, mid, high)]
    base = max(now, 1.0)
    if ahead[0] > now and (ahead[1] - now) / base >= EASING_STRETCHING_SHARE:
        direction = "stretching"
    elif ahead[2] < now and (now - ahead[1]) / base >= EASING_STRETCHING_SHARE:
        direction = "easing"
    else:
        direction = "flat"
    return {"now": now, "low": ahead[0], "median": ahead[1], "high": ahead[2], "direction": direction, "points": len(sample)}


def shift(metric: str, points: Sequence[tuple[date, float]]) -> dict[str, Any] | None:
    """A family's figure that moved and stayed moved for two weeks: the last 14 days against the 14 before, beyond what that family's own
    day-to-day wobble explains and beyond the metric's floor."""

    values = [value for _, value in points]
    if len(values) < SHIFT_RECENT + SHIFT_PRIOR:
        return None
    recent, prior = values[-SHIFT_RECENT:], values[-(SHIFT_RECENT + SHIFT_PRIOR):-SHIFT_RECENT]
    before, after = statistics.fmean(prior), statistics.fmean(recent)
    wobble = statistics.pstdev(prior)
    change = after - before
    if abs(change) < max(SHIFT_SIGMAS * wobble, FLOORS.get(metric, 0.05)):
        return None
    # It has to stay: every one of the last seven days is on the new side of the old mean.
    side = 1 if change > 0 else -1
    if not all((value - before) * side > 0 for value in values[-7:]):
        return None
    return {"metric": metric, "before": before, "after": after, "direction": "up" if change > 0 else "down", "since": points[-SHIFT_RECENT][0].isoformat()}


def _series(conn, metric: str, today: date) -> dict[tuple[str, str], list[tuple[date, float]]]:
    found: dict[tuple[str, str], list[tuple[date, float]]] = {}
    for row in conn.execute(
        "SELECT day, scope_kind, scope_value, value FROM supply_market_indices WHERE metric = %s AND day >= %s AND scope_kind <> 'all' ORDER BY day",
        (metric, today - timedelta(days=HISTORY_DAYS)),
    ).fetchall():
        found.setdefault((row["scope_kind"], row["scope_value"]), []).append((row["day"], float(row["value"])))
    return found


def outlook(conn, today: date | None = None) -> dict[str, Any]:
    """Lead times ahead and early warnings across the families Prism has stored figures for."""

    today = today or datetime.now(timezone.utc).date()
    leads = []
    for (kind, scope), points in _series(conn, "median_lead_time_days", today).items():
        found = lead_trend(points)
        if found:
            leads.append({"kind": kind, "scope": scope, **found})
    leads.sort(key=lambda item: ({"stretching": 0, "easing": 1, "flat": 2}[item["direction"]], -abs(item["median"] - item["now"]), item["scope"].lower()))
    warnings = []
    for metric in ("out_of_stock", "median_lead_time_days", "dropped", "lifecycle_risk"):
        for (kind, scope), points in _series(conn, metric, today).items():
            found = shift(metric, points)
            if found:
                warnings.append({"kind": kind, "scope": scope, **found})
    warnings.sort(key=lambda item: -abs(item["after"] - item["before"]))
    return {"lead_times": leads, "warnings": warnings}
